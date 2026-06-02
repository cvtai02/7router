import { ProviderName } from "../../../core/enums/provider-name.enum";

export interface RemoveAccountResponseDto {
  providerName: ProviderName;
  accountName: string;
  removed: boolean;
}

