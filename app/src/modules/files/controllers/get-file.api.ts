import { Body, Controller, Post } from "@nestjs/common";
import { Policy, ReadAccess } from "../../auth/policy.decorator";
import { GetFileResponseDto } from "../dtos/get-file-response.dto";
import { GetFileUseCase } from "../usecases/get-file.usecase";

@Controller("files")
@Policy("client-api")
export class GetFileApi {
  constructor(private readonly getFile: GetFileUseCase) {}

  @Post("get")
  @ReadAccess()
  get(@Body() body: { absolutePath: string }): Promise<GetFileResponseDto> {
    return this.getFile.execute(body.absolutePath);
  }
}

