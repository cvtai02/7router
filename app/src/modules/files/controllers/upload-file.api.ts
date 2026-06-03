import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { Policy } from "../../auth/policy.decorator";
import { UploadFileUseCase } from "../usecases/upload-file.usecase";

@Controller("files")
@Policy("client-api")
export class UploadFileApi {
  constructor(private readonly uploadFile: UploadFileUseCase) {}

  @Post("upload")
  @HttpCode(204)
  async upload(@Body() body: { absolutePath: string; contentBase64: string; contentType?: string }): Promise<void> {
    await this.uploadFile.execute(body.absolutePath, body.contentBase64, body.contentType);
  }
}
