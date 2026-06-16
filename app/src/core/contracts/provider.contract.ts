import { ProviderName } from "../enums/provider-name.enum";

export interface ProviderListItemDto {
  name: string;
  absolutePath: string;
  type: "provider" | "account" | "bucket" | "folder" | "file";
  providerName: ProviderName;
  accountName?: string;
  bucketOrRootName?: string;
  keyOrPath?: string;
  sizeBytes?: number;
  contentType?: string;
  modifiedAt?: string;
  cdnUrl?: string;
}

export interface ProviderFileDto {
  absolutePath: string;
  providerName: ProviderName;
  accountName: string;
  bucketOrRootName: string;
  keyOrPath: string;
  contentType?: string;
  sizeBytes?: number;
  // The server does not transfer file bytes. It returns a URL the client uses to
  // download directly from the provider.
  cdnUrl?: string;
  downloadUrl?: string;
}

export interface AddProviderAccountDto {
  providerName: ProviderName;
  accountName: string;
  credentials: Record<string, unknown>;
}

export interface RemoveProviderAccountDto {
  providerName: ProviderName;
  accountName: string;
}

export interface IProvider {
  readonly providerName: ProviderName;
  listSubFolderAndFile(currentPath: string): Promise<ProviderListItemDto[]>;
  addAccount(input: AddProviderAccountDto): Promise<void>;
  removeAccount(input: RemoveProviderAccountDto): Promise<void>;
  getFile(absolutePath: string): Promise<ProviderFileDto>;
  createFolder(parentPath: string, folderName: string): Promise<void>;
  createBucket(accountPath: string, bucketName: string): Promise<void>;
  uploadFile(absolutePath: string, contentBase64: string, contentType?: string): Promise<void>;
  getBucketCdnUrl(bucketPath: string): Promise<string>;
}
