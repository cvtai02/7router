import { Injectable } from "@nestjs/common";
import { ProviderListItemDto } from "../../../core/contracts/provider.contract";
import { ProviderAbsolutePath } from "../../../core/value-objects/provider-absolute-path";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { ProviderRegistryService } from "../../../infrastructure/providers/provider-registry.service";
import { SyncRequestDto } from "../dtos/sync-request.dto";
import { SyncResponseDto } from "../dtos/sync-response.dto";

@Injectable()
export class RunSyncUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly providers: ProviderRegistryService,
  ) {}

  async execute(input: SyncRequestDto): Promise<SyncResponseDto> {
    const parsed = ProviderAbsolutePath.parse(input.absolutePath);
    const syncRun = await this.prisma.syncRun.create({
      data: {
        absolutePath: parsed.originalPath,
        providerName: parsed.providerName,
        accountName: parsed.accountName,
        bucketName: parsed.bucketOrRootName,
        status: "Running",
      },
    });

    let discovered = 0;
    let inserted = 0;
    let updated = 0;
    let deleted = 0;
    let failed = 0;

    try {
      const provider = this.providers.resolve(parsed.providerName);
      const stack = [parsed.originalPath];
      const seen = new Set<string>();
      const persistedPaths = new Set<string>();

      while (stack.length > 0) {
        const path = stack.pop()!;
        if (seen.has(path)) continue;
        seen.add(path);
        const items = await provider.listSubFolderAndFile(path);
        discovered += items.length;
        for (const item of items) {
          if (item.type === "folder" || item.type === "bucket") {
            stack.push(item.absolutePath);
          }
          if (!item.accountName || !item.bucketOrRootName) continue;
          try {
            const existed = await this.persistItem(item);
            persistedPaths.add(item.absolutePath);
            if (existed) updated += 1;
            else inserted += 1;
          } catch {
            failed += 1;
          }
        }
      }

      // Remove stale records that were not found in this sync
      const syncedPrefix = parsed.originalPath + "/";
      const result = await this.prisma.storageKey.deleteMany({
        where: {
          absolutePath: { startsWith: syncedPrefix },
          NOT: { absolutePath: { in: [...persistedPaths] } },
        },
      });
      deleted = result.count;

      await this.prisma.syncRun.update({
        where: { id: syncRun.id },
        data: { status: "Completed", discovered, inserted, updated, deleted, failed, completedAt: new Date() },
      });
      return { syncRunId: syncRun.id, absolutePath: parsed.originalPath, status: "Completed", discovered, inserted, updated, deleted, failed };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown sync error";
      await this.prisma.syncRun.update({
        where: { id: syncRun.id },
        data: { status: "Failed", discovered, inserted, updated, deleted, failed, errorMessage: message, completedAt: new Date() },
      });
      return {
        syncRunId: syncRun.id,
        absolutePath: parsed.originalPath,
        status: "Failed",
        discovered,
        inserted,
        updated,
        deleted,
        failed,
        errorMessage: message,
      };
    }
  }

  private async persistItem(item: ProviderListItemDto): Promise<boolean> {
    const provider = await this.prisma.providerRecord.upsert({
      where: { name: item.providerName },
      update: {},
      create: {
        name: item.providerName,
        displayName: item.providerName === "CloudflareR2" ? "Cloudflare R2" : "Google Drive",
      },
    });
    const account = await this.prisma.providerAccount.findUnique({
      where: { providerId_accountName: { providerId: provider.id, accountName: item.accountName! } },
    });
    if (!account) return false;
    const bucket = await this.prisma.storageBucket.upsert({
      where: { accountId_name: { accountId: account.id, name: item.bucketOrRootName! } },
      update: {},
      create: { accountId: account.id, name: item.bucketOrRootName!, displayName: item.bucketOrRootName },
    });
    const existing = await this.prisma.storageKey.findUnique({ where: { absolutePath: item.absolutePath } });
    await this.prisma.storageKey.upsert({
      where: { absolutePath: item.absolutePath },
      update: {
        itemType: item.type,
        key: item.keyOrPath ?? "",
        sizeBytes: item.sizeBytes,
        contentType: item.contentType,
        modifiedAt: item.modifiedAt ? new Date(item.modifiedAt) : undefined,
        lastSyncedAt: new Date(),
      },
      create: {
        bucketId: bucket.id,
        itemType: item.type,
        key: item.keyOrPath ?? "",
        absolutePath: item.absolutePath,
        sizeBytes: item.sizeBytes,
        contentType: item.contentType,
        modifiedAt: item.modifiedAt ? new Date(item.modifiedAt) : undefined,
        lastSyncedAt: new Date(),
      },
    });
    return Boolean(existing);
  }
}

