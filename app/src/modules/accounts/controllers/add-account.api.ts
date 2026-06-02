import { Body, Controller, Param, Post } from "@nestjs/common";
import { ProviderName } from "../../../core/enums/provider-name.enum";
import { AddAccountRequestDto } from "../dtos/add-account-request.dto";
import { AddAccountResponseDto } from "../dtos/add-account-response.dto";
import { AddAccountUseCase } from "../usecases/add-account.usecase";

@Controller("providers/:providerName/accounts")
export class AddAccountApi {
  constructor(private readonly addAccount: AddAccountUseCase) {}

  @Post()
  add(@Param("providerName") providerName: ProviderName, @Body() body: AddAccountRequestDto): Promise<AddAccountResponseDto> {
    return this.addAccount.execute(providerName, body);
  }
}

