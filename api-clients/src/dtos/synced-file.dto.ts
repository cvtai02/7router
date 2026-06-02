import { ProviderName } from "./provider-name.dto";

export interface SyncedFileDto {
  id: string;
  providerName: ProviderName;
  accountName: string;
  bucketName: string;
  key: string;
  absolutePath: string;
  itemType: string;
  sizeBytes?: number;
  contentType?: string;
  modifiedAt?: string;
  lastSyncedAt: string;
}

