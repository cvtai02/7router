import { Injectable } from "@nestjs/common";
import { ProviderAbsolutePath } from "../../../core/value-objects/provider-absolute-path";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { ProviderRegistryService } from "../../../infrastructure/providers/provider-registry.service";

@Injectable()
export class CreateBucketUseCase {
  constructor(
    private readonly providers: ProviderRegistryService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(accountPath: string, bucketName: string): Promise<void> {
    const parsed = ProviderAbsolutePath.parse(accountPath);
    await this.providers.resolve(parsed.providerName).createBucket(parsed.originalPath, bucketName);

    const providerRecord = await this.prisma.providerRecord.findUniqueOrThrow({
      where: { name: parsed.providerName },
    });
    const account = await this.prisma.providerAccount.findFirstOrThrow({
      where: { providerId: providerRecord.id, accountName: parsed.accountName },
    });
    await this.prisma.storageBucket.upsert({
      where: { accountId_name: { accountId: account.id, name: bucketName } },
      update: {},
      create: { accountId: account.id, name: bucketName },
    });
  }
}
