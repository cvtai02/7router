import { Body, Controller, Post } from "@nestjs/common";
import { Policy, ReadAccess } from "../../auth/policy.decorator";
import { ListFilesResponseDto } from "../dtos/list-files-response.dto";
import { ListFilesUseCase } from "../usecases/list-files.usecase";

@Controller("files")
@Policy("client-api")
export class ListFilesApi {
  constructor(private readonly listFiles: ListFilesUseCase) {}

  @Post("list")
  @ReadAccess()
  list(@Body() body: { path: string }): Promise<ListFilesResponseDto> {
    return this.listFiles.execute(body.path);
  }
}

