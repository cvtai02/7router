import { GetFileResponseDto, ListFilesResponseDto } from "../dtos";
import { SevenRouterClientOptions } from "../interfaces/options";
import { BaseClient } from "./base.client";

export class FilesClient extends BaseClient {
  constructor(options: SevenRouterClientOptions) {
    super(options);
  }

  list(path: string): Promise<ListFilesResponseDto> {
    return this.request("/files/list", { method: "POST", body: JSON.stringify({ path }) });
  }

  get(absolutePath: string): Promise<GetFileResponseDto> {
    return this.request("/files/get", { method: "POST", body: JSON.stringify({ absolutePath }) });
  }

  createFolder(parentPath: string, folderName: string): Promise<void> {
    return this.request("/files/folder", {
      method: "POST",
      body: JSON.stringify({ parentPath, folderName }),
    });
  }

  createBucket(accountPath: string, bucketName: string): Promise<void> {
    return this.request("/files/bucket", {
      method: "POST",
      body: JSON.stringify({ accountPath, bucketName }),
    });
  }

  uploadFile(absolutePath: string, contentBase64: string, contentType?: string): Promise<void> {
    return this.request("/files/upload", {
      method: "POST",
      body: JSON.stringify({ absolutePath, contentBase64, contentType }),
    });
  }

}

