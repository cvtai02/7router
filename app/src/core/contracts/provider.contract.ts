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
}

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
}

