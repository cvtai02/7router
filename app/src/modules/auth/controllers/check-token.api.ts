import { Body, Controller, Post } from "@nestjs/common";
import { CheckTokenRequestDto } from "../dtos/check-token-request.dto";
import { CheckTokenResponseDto } from "../dtos/check-token-response.dto";
import { PublicRoute } from "../public-route.decorator";
import { CheckTokenUseCase } from "../usecases/check-token.usecase";

@Controller("auth")
export class CheckTokenApi {
  constructor(private readonly checkToken: CheckTokenUseCase) {}

  @PublicRoute()
  @Post("check-token")
  check(@Body() body: CheckTokenRequestDto): Promise<CheckTokenResponseDto> {
    return this.checkToken.execute(body);
  }
}

