import { ProviderName } from "../../../core/enums/provider-name.enum";

export interface ProviderSummaryDto {
  providerName: ProviderName;
  displayName: string;
  enabled: boolean;
  accountCount: number;
}

