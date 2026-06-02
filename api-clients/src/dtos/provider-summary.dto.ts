import { ProviderName } from "./provider-name.dto";

export interface ProviderSummaryDto {
  providerName: ProviderName;
  displayName: string;
  enabled: boolean;
  accountCount: number;
}

