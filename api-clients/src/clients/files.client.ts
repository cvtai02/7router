import { GetFileResponseDto, ListFilesResponseDto } from "../dtos";
import { SevenRouterClientOptions } from "../interfaces/options";
import { BaseClient } from "./base.client";

export class FilesClient extends BaseClient {
  constructor(options: SevenRouterClientOptions) {
    super(options);
  }

  list(path: string): Promise<ListFilesResponseDto> {
    return this.request(`/files/list${this.query({ path })}`);
  }

  get(absolutePath: string): Promise<GetFileResponseDto> {
    return this.request(`/files/get${this.query({ absolutePath })}`);
  }
}

