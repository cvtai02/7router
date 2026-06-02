import { ProviderName } from "./provider-name.dto";

export interface ProviderAccountSummaryDto {
  providerName: ProviderName;
  accountName: string;
  credentialHint?: string;
  createdAt: string;
}

