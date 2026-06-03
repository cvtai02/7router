import { Body, Controller, Post } from "@nestjs/common";
import { Policy, ReadAccess } from "../../auth/policy.decorator";
import { ListFilesResponseDto } from "../dtos/list-files-response.dto";
import { ListAllFilesUseCase } from "../usecases/list-all-files.usecase";

@Controller("files")
@Policy("client-api")
export class ListAllFilesApi {
  constructor(private readonly listAllFiles: ListAllFilesUseCase) {}

  @Post("all")
  @ReadAccess()
  listAll(@Body() body: { path: string }): Promise<ListFilesResponseDto> {
    return this.listAllFiles.execute(body.path);
  }
}
