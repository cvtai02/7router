import { Controller, Get, Param } from "@nestjs/common";
import { ProviderName } from "../../../core/enums/provider-name.enum";
import { ProviderAccountSummaryDto } from "../dtos/provider-account-summary.dto";
import { ListProviderAccountsUseCase } from "../usecases/list-provider-accounts.usecase";

@Controller("providers")
export class ListProviderAccountsApi {
  constructor(private readonly listAccounts: ListProviderAccountsUseCase) {}

  @Get(":providerName/accounts")
  accounts(@Param("providerName") providerName: ProviderName): Promise<ProviderAccountSummaryDto[]> {
    return this.listAccounts.execute(providerName);
  }
}

