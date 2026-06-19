import { Injectable } from "@nestjs/common";
import { UploadFileDto } from "../../../core/contracts/provider.contract";
import { ProviderAbsolutePath } from "../../../core/value-objects/provider-absolute-path";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { ProviderRegistryService } from "../../../infrastructure/providers/provider-registry.service";

@Injectable()
export class UploadFileUseCase {
  constructor(
    private readonly providers: ProviderRegistryService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(input: UploadFileDto): Promise<void> {
    const parsed = ProviderAbsolutePath.parse(input.absolutePath);
    await this.providers.resolve(parsed.providerName).uploadFile({ ...input, absolutePath: parsed.originalPath });

    const sizeBytes = Math.ceil((input.contentBase64.length * 3) / 4);
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
      update: { sizeBytes, contentType: input.contentType, lastSyncedAt: new Date(), modifiedAt: new Date() },
      create: {
        bucketId: bucket.id,
        key,
        absolutePath: parsed.originalPath,
        itemType: "file",
        sizeBytes,
        contentType: input.contentType,
        lastSyncedAt: new Date(),
        modifiedAt: new Date(),
      },
    });
  }
}
