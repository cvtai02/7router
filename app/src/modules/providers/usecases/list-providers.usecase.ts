import { Injectable } from "@nestjs/common";
import { ProviderName } from "../../../core/enums/provider-name.enum";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { ProviderSummaryDto } from "../dtos/provider-summary.dto";

@Injectable()
export class ListProvidersUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(): Promise<ProviderSummaryDto[]> {
    const supportedProviders = [ProviderName.CloudflareR2, ProviderName.GoogleDrive];
    const records = await this.prisma.providerRecord.findMany({
      where: { name: { in: supportedProviders } },
      include: { accounts: true },
    });
    const displayNames: Record<string, string> = {
      [ProviderName.CloudflareR2]: "Cloudflare R2",
      [ProviderName.GoogleDrive]: "Google Drive",
    };
    return supportedProviders.map((providerName) => {
      const record = records.find((item) => item.name === providerName);
      return {
        providerName,
        displayName: displayNames[providerName] ?? providerName,
        enabled: true,
        accountCount: record?.accounts.length ?? 0,
      };
    });
  }
}
