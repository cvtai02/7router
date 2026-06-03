import { Injectable } from "@nestjs/common";
import { ProviderAbsolutePath } from "../../../core/value-objects/provider-absolute-path";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { ProviderRegistryService } from "../../../infrastructure/providers/provider-registry.service";

@Injectable()
export class CreateFolderUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly providers: ProviderRegistryService,
  ) {}

  async execute(parentPath: string, folderName: string): Promise<void> {
    const parsed = ProviderAbsolutePath.parse(parentPath);
    await this.providers.resolve(parsed.providerName).createFolder(parsed.originalPath, folderName);
    await this.persistFolder(parsed, folderName);
  }

  private async persistFolder(parsed: ReturnType<typeof ProviderAbsolutePath.parse>, folderName: string): Promise<void> {
    if (!parsed.accountName || !parsed.bucketOrRootName) {
      throw new Error("Folder persistence requires account and bucket/root in the path.");
    }

    const account = await this.prisma.providerAccount.findFirst({
      where: { accountName: parsed.accountName, provider: { name: parsed.providerName } },
    });
    if (!account) throw new Error(`Provider account not found: ${parsed.accountName}`);

    const bucket = await this.prisma.storageBucket.upsert({
      where: { accountId_name: { accountId: account.id, name: parsed.bucketOrRootName } },
      update: {},
      create: { accountId: account.id, name: parsed.bucketOrRootName, displayName: parsed.bucketOrRootName },
    });

    const key = parsed.keyOrPath ? `${parsed.keyOrPath}/${folderName}` : folderName;
    const absolutePath = `${parsed.providerName}/${parsed.accountName}/${parsed.bucketOrRootName}/${key}`;
    await this.prisma.storageKey.upsert({
      where: { absolutePath },
      update: {
        bucketId: bucket.id,
        key,
        itemType: "folder",
        sizeBytes: null,
        contentType: null,
        providerFileId: null,
        checksum: null,
        modifiedAt: null,
        lastSyncedAt: new Date(),
      },
      create: {
        bucketId: bucket.id,
        key,
        absolutePath,
        itemType: "folder",
        lastSyncedAt: new Date(),
      },
    });
  }
}
