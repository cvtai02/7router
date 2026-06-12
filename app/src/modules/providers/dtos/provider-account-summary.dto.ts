import { ProviderName } from "../../../core/enums/provider-name.enum";

export interface ProviderAccountSummaryDto {
  providerName: ProviderName;
  accountName: string;
  credentialHint?: string;
  occupiedSpaceBytes: number;
  createdAt: string;
}
