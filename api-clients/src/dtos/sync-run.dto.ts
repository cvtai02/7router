import { ProviderName } from "./provider-name.dto";
import { SyncResponseDto } from "./sync-response.dto";

export interface SyncRunDto extends SyncResponseDto {
  providerName: ProviderName;
  accountName?: string;
  bucketName?: string;
  startedAt: string;
  completedAt?: string;
}

