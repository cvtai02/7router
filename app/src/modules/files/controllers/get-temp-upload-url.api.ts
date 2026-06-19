import { Body, Controller, Post } from "@nestjs/common";
import { TempUploadUrlDto, TempUploadUrlRequestDto } from "../../../core/contracts/provider.contract";
import { Policy } from "../../auth/policy.decorator";
import { GetTempUploadUrlUseCase } from "../usecases/get-temp-upload-url.usecase";

@Controller("files")
@Policy("client-api")
export class GetTempUploadUrlApi {
  constructor(private readonly getTempUploadUrl: GetTempUploadUrlUseCase) {}

  @Post("temp-upload-url")
  get(@Body() body: TempUploadUrlRequestDto): Promise<TempUploadUrlDto> {
    return this.getTempUploadUrl.execute(body);
  }
}
