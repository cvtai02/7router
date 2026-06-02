import { AddAccountRequestDto, AddAccountResponseDto, ProviderName, RemoveAccountResponseDto } from "../dtos";
import { SevenRouterClientOptions } from "../interfaces/options";
import { BaseClient } from "./base.client";

export class AccountsClient extends BaseClient {
  constructor(options: SevenRouterClientOptions) {
    super(options);
  }

  addAccount(providerName: ProviderName, input: AddAccountRequestDto): Promise<AddAccountResponseDto> {
    return this.request(`/providers/${providerName}/accounts`, { method: "POST", body: JSON.stringify(input) });
  }

  removeAccount(providerName: ProviderName, accountName: string): Promise<RemoveAccountResponseDto> {
    return this.request(`/providers/${providerName}/accounts/${encodeURIComponent(accountName)}`, { method: "DELETE" });
  }
}

