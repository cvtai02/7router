import { Controller, Delete, Param } from "@nestjs/common";
import { ProviderName } from "../../../core/enums/provider-name.enum";
import { RemoveAccountResponseDto } from "../dtos/remove-account-response.dto";
import { RemoveAccountUseCase } from "../usecases/remove-account.usecase";

@Controller("providers/:providerName/accounts")
export class RemoveAccountApi {
  constructor(private readonly removeAccount: RemoveAccountUseCase) {}

  @Delete(":accountName")
  remove(
    @Param("providerName") providerName: ProviderName,
    @Param("accountName") accountName: string,
  ): Promise<RemoveAccountResponseDto> {
    return this.removeAccount.execute(providerName, accountName);
  }
}

