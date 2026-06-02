import { ProviderName } from "../../../core/enums/provider-name.enum";

export interface AddAccountResponseDto {
  providerName: ProviderName;
  accountName: string;
  added: boolean;
}

