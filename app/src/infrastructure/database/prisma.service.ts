import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { SettingsService } from "../settings/settings.service";
import { ProviderName } from "../../core/enums/provider-name.enum";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(settings: SettingsService) {
    process.env.DATABASE_URL = settings.get().database.url;
    super();
  }

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

