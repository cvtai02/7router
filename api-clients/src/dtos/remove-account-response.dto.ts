import { ProviderName } from "./provider-name.dto";

export interface RemoveAccountResponseDto {
  providerName: ProviderName;
  accountName: string;
  removed: boolean;
}

