import { ProviderAccountSummaryDto, ProviderName, ProviderSummaryDto } from "../dtos";
import { SevenRouterClientOptions } from "../interfaces/options";
import { BaseClient } from "./base.client";

export class ProvidersClient extends BaseClient {
  constructor(options: SevenRouterClientOptions) {
    super(options);
  }

  listProviders(): Promise<ProviderSummaryDto[]> {
    return this.request("/providers");
  }

  getProvider(providerName: ProviderName): Promise<ProviderSummaryDto> {
    return this.request(`/providers/${providerName}`);
  }

  listAccounts(providerName: ProviderName): Promise<ProviderAccountSummaryDto[]> {
    return this.request(`/providers/${providerName}/accounts`);
  }
}

