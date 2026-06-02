import { Injectable } from "@nestjs/common";
import { ProviderName } from "../../../core/enums/provider-name.enum";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { ProviderAccountSummaryDto } from "../dtos/provider-account-summary.dto";

@Injectable()
export class ListProviderAccountsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(providerName: ProviderName): Promise<ProviderAccountSummaryDto[]> {
    const accounts = await this.prisma.providerAccount.findMany({
      where: { provider: { name: providerName } },
      orderBy: { accountName: "asc" },
    });
    return accounts.map((account) => ({
      providerName,
      accountName: account.accountName,
      credentialHint: account.credentialHint ?? undefined,
      createdAt: account.createdAt.toISOString(),
    }));
  }
}

