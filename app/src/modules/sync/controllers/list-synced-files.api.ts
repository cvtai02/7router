import { Controller, Get, Query } from "@nestjs/common";
import { SyncedFilesResponseDto } from "../dtos/synced-files-response.dto";
import { ListSyncedFilesUseCase } from "../usecases/list-synced-files.usecase";

@Controller()
export class ListSyncedFilesApi {
  constructor(private readonly listSyncedFiles: ListSyncedFilesUseCase) {}

  @Get("synced-files")
  syncedFiles(@Query() query: Record<string, string | undefined>): Promise<SyncedFilesResponseDto> {
    return this.listSyncedFiles.execute(query);
  }
}

