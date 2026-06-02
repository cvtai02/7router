import { Injectable } from "@nestjs/common";
import { ProviderName } from "../../../core/enums/provider-name.enum";
import { ProviderRegistryService } from "../../../infrastructure/providers/provider-registry.service";
import { RemoveAccountResponseDto } from "../dtos/remove-account-response.dto";

@Injectable()
export class RemoveAccountUseCase {
  constructor(private readonly providers: ProviderRegistryService) {}

  async execute(providerName: ProviderName, accountName: string): Promise<RemoveAccountResponseDto> {
    await this.providers.resolve(providerName).removeAccount({ providerName, accountName });
    return { providerName, accountName, removed: true };
  }
}

