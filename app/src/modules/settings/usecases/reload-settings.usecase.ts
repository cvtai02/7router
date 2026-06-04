import { Injectable } from "@nestjs/common";
import { ReloadSettingsResponseDto } from "../dtos/reload-settings-response.dto";

@Injectable()
export class ReloadSettingsUseCase {
  execute(): ReloadSettingsResponseDto {
    return { restartRequired: false };
  }
}
