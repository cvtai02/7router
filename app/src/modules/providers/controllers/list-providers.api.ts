import { Controller, Get } from "@nestjs/common";
import { ProviderSummaryDto } from "../dtos/provider-summary.dto";
import { ListProvidersUseCase } from "../usecases/list-providers.usecase";

@Controller("providers")
export class ListProvidersApi {
  constructor(private readonly listProviders: ListProvidersUseCase) {}

  @Get()
  list(): Promise<ProviderSummaryDto[]> {
    return this.listProviders.execute();
  }
}

