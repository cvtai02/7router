import { Injectable } from "@nestjs/common";
import { ProviderName } from "../../../core/enums/provider-name.enum";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { ProviderSummaryDto } from "../dtos/provider-summary.dto";

@Injectable()
export class ListProvidersUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(): Promise<ProviderSummaryDto[]> {
    const records = await this.prisma.providerRecord.findMany({ include: { accounts: true } });
    return [ProviderName.CloudflareR2, ProviderName.GoogleDrive].map((providerName) => {
      const record = records.find((item) => item.name === providerName);
      return {
        providerName,
        displayName: providerName === ProviderName.CloudflareR2 ? "Cloudflare R2" : "Google Drive",
        enabled: true,
        accountCount: record?.accounts.length ?? 0,
      };
    });
  }
}
