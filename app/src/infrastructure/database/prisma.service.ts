import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { ProviderName } from "../../core/enums/provider-name.enum";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
    await this.providerRecord.upsert({
      where: { name: ProviderName.CloudflareR2 },
      update: {},
      create: { name: ProviderName.CloudflareR2, displayName: "Cloudflare R2" },
    });
    await this.providerRecord.upsert({
      where: { name: ProviderName.GoogleDrive },
      update: {},
      create: { name: ProviderName.GoogleDrive, displayName: "Google Drive" },
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
