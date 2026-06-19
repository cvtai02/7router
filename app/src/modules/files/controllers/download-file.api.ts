import { Body, Controller, Post } from "@nestjs/common";
import { Policy, ReadAccess } from "../../auth/policy.decorator";
import { DownloadFileResponseDto } from "../dtos/download-file-response.dto";
import { DownloadFileUseCase } from "../usecases/download-file.usecase";

@Controller("files")
@Policy("client-api")
export class DownloadFileApi {
  constructor(private readonly downloadFile: DownloadFileUseCase) {}

  @Post("download")
  @ReadAccess()
  download(@Body() body: { absolutePath: string }): Promise<DownloadFileResponseDto> {
    return this.downloadFile.execute(body.absolutePath);
  }
}
