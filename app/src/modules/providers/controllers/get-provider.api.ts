import { Controller, Get, Param } from "@nestjs/common";
import { ProviderName } from "../../../core/enums/provider-name.enum";
import { ProviderSummaryDto } from "../dtos/provider-summary.dto";
import { GetProviderUseCase } from "../usecases/get-provider.usecase";

@Controller("providers")
export class GetProviderApi {
  constructor(private readonly getProvider: GetProviderUseCase) {}

  @Get(":providerName")
  get(@Param("providerName") providerName: ProviderName): Promise<ProviderSummaryDto> {
    return this.getProvider.execute(providerName);
  }
}

