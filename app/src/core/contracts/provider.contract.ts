import { ProviderName } from "../enums/provider-name.enum";
import { TempDownloadUrlDto } from "./temp-download-url.dto";
import { TempDownloadUrlRequestDto } from "./temp-download-url-request.dto";
import { TempUploadUrlDto } from "./temp-upload-url.dto";
import { TempUploadUrlRequestDto } from "./temp-upload-url-request.dto";
import { UploadFileDto } from "./upload-file.dto";

export type { TempDownloadUrlDto } from "./temp-download-url.dto";
export type { TempDownloadUrlRequestDto } from "./temp-download-url-request.dto";
export type { TempUploadUrlDto } from "./temp-upload-url.dto";
export type { TempUploadUrlRequestDto } from "./temp-upload-url-request.dto";
export type { UploadFileDto } from "./upload-file.dto";

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

export interface DownloadFileDto {
  absolutePath: string;
  contentType?: string;
  sizeBytes?: number;
  contentBase64: string;
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
  listChildren(currentPath: string): Promise<ProviderListItemDto[]>;
  addAccount(input: AddProviderAccountDto): Promise<void>;
  removeAccount(input: RemoveProviderAccountDto): Promise<void>;
  downloadFile(absolutePath: string): Promise<DownloadFileDto>;
  getTempDownloadUrl(input: TempDownloadUrlRequestDto): Promise<TempDownloadUrlDto>;
  getTempUploadUrl(input: TempUploadUrlRequestDto): Promise<TempUploadUrlDto>;
  createFolder(parentPath: string, folderName: string): Promise<void>;
  uploadFile(input: UploadFileDto): Promise<void>;
}
