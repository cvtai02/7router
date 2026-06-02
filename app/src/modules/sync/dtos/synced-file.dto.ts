import { ProviderName } from "../../../core/enums/provider-name.enum";

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

