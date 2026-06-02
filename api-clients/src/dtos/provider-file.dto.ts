import { ProviderName } from "./provider-name.dto";

export interface ProviderFileDto {
  absolutePath: string;
  providerName: ProviderName;
  accountName: string;
  bucketOrRootName: string;
  keyOrPath: string;
  contentType?: string;
  sizeBytes?: number;
  contentBase64?: string;
  downloadUrl?: string;
}

