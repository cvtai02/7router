import { Injectable } from "@nestjs/common";
import { ProviderName } from "../../../core/enums/provider-name.enum";
import { ProviderRegistryService } from "../../../infrastructure/providers/provider-registry.service";
import { AddAccountRequestDto } from "../dtos/add-account-request.dto";
import { AddAccountResponseDto } from "../dtos/add-account-response.dto";

@Injectable()
export class AddAccountUseCase {
  constructor(private readonly providers: ProviderRegistryService) {}

  async execute(providerName: ProviderName, input: AddAccountRequestDto): Promise<AddAccountResponseDto> {
    await this.providers.resolve(providerName).addAccount({ providerName, ...input });
    return { providerName, accountName: input.accountName, added: true };
  }
}

