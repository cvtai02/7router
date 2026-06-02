import { Injectable } from "@nestjs/common";
import { ProviderName } from "../../../core/enums/provider-name.enum";
import { ProviderSummaryDto } from "../dtos/provider-summary.dto";
import { ListProvidersUseCase } from "./list-providers.usecase";

@Injectable()
export class GetProviderUseCase {
  constructor(private readonly listProviders: ListProvidersUseCase) {}

  async execute(providerName: ProviderName): Promise<ProviderSummaryDto> {
    const provider = (await this.listProviders.execute()).find((item) => item.providerName === providerName);
    if (!provider) throw new Error(`Provider not found: ${providerName}`);
    return provider;
  }
}

