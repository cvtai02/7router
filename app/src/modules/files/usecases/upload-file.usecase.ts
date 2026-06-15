import { Injectable } from "@nestjs/common";
import { ProviderAbsolutePath } from "../../../core/value-objects/provider-absolute-path";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { ProviderRegistryService } from "../../../infrastructure/providers/provider-registry.service";

@Injectable()
export class UploadFileUseCase {
  constructor(
    private readonly providers: ProviderRegistryService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(absolutePath: string, contentBase64: string, contentType?: string): Promise<void> {
    const parsed = ProviderAbsolutePath.parse(absolutePath);
    await this.providers.resolve(parsed.providerName).uploadFile(parsed.originalPath, contentBase64, contentType);

    const sizeBytes = Math.ceil((contentBase64.length * 3) / 4);
    const account = await this.prisma.providerAccount.findFirst({
      where: { accountName: parsed.accountName, provider: { name: parsed.providerName } },
    });
    if (!account) return;
    const bucket = await this.prisma.storageBucket.findFirst({
      where: { accountId: account.id, name: parsed.bucketOrRootName! },
    });
    if (!bucket) return;

    const key = parsed.keyOrPath ?? "";
    await this.prisma.storageKey.upsert({
      where: { absolutePath: parsed.originalPath },
      update: { sizeBytes, contentType, lastSyncedAt: new Date(), modifiedAt: new Date() },
      create: {
        bucketId: bucket.id,
        key,
        absolutePath: parsed.originalPath,
        itemType: "file",
        sizeBytes,
        contentType,
        lastSyncedAt: new Date(),
        modifiedAt: new Date(),
      },
    });
  }
}
