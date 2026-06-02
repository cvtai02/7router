import { ProviderName } from "../../../core/enums/provider-name.enum";
import { SyncResponseDto } from "./sync-response.dto";

export interface SyncRunDto extends SyncResponseDto {
  providerName: ProviderName;
  accountName?: string;
  bucketName?: string;
  startedAt: string;
  completedAt?: string;
}

