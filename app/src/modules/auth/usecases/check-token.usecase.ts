import { Injectable } from "@nestjs/common";
import { SettingsService } from "../../../infrastructure/settings/settings.service";
import { CheckTokenRequestDto } from "../dtos/check-token-request.dto";
import { CheckTokenResponseDto } from "../dtos/check-token-response.dto";

@Injectable()
export class CheckTokenUseCase {
  constructor(private readonly settings: SettingsService) {}

  execute(input: CheckTokenRequestDto): CheckTokenResponseDto {
    return { valid: this.settings.get().auth.accessTokens.includes(input.accessToken) };
  }
}
