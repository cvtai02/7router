import { Body, Controller, Post } from "@nestjs/common";
import { TempDownloadUrlDto, TempDownloadUrlRequestDto } from "../../../core/contracts/provider.contract";
import { Policy, ReadAccess } from "../../auth/policy.decorator";
import { GetTempDownloadUrlUseCase } from "../usecases/get-temp-download-url.usecase";

@Controller("files")
@Policy("client-api")
export class GetTempDownloadUrlApi {
  constructor(private readonly getTempDownloadUrl: GetTempDownloadUrlUseCase) {}

  @Post("temp-download-url")
  @ReadAccess()
  get(@Body() body: TempDownloadUrlRequestDto): Promise<TempDownloadUrlDto> {
    return this.getTempDownloadUrl.execute(body);
  }
}
