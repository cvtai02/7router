import { ProviderName } from "./provider-name.dto";

export interface AddAccountResponseDto {
  providerName: ProviderName;
  accountName: string;
  added: boolean;
}

