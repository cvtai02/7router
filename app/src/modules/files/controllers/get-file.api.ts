import { Controller, Get, Query } from "@nestjs/common";
import { GetFileResponseDto } from "../dtos/get-file-response.dto";
import { GetFileUseCase } from "../usecases/get-file.usecase";

@Controller("files")
export class GetFileApi {
  constructor(private readonly getFile: GetFileUseCase) {}

  @Get("get")
  get(@Query("absolutePath") absolutePath: string): Promise<GetFileResponseDto> {
    return this.getFile.execute(absolutePath);
  }
}

