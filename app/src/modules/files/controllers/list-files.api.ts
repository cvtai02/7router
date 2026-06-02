import { Controller, Get, Query } from "@nestjs/common";
import { ListFilesResponseDto } from "../dtos/list-files-response.dto";
import { ListFilesUseCase } from "../usecases/list-files.usecase";

@Controller("files")
export class ListFilesApi {
  constructor(private readonly listFiles: ListFilesUseCase) {}

  @Get("list")
  list(@Query("path") path: string): Promise<ListFilesResponseDto> {
    return this.listFiles.execute(path);
  }
}

