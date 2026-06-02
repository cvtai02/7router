import { Injectable } from "@nestjs/common";
import { SettingsService } from "../../../infrastructure/settings/settings.service";
import { ReloadSettingsResponseDto } from "../dtos/reload-settings-response.dto";

@Injectable()
export class ReloadSettingsUseCase {
  constructor(private readonly settings: SettingsService) {}

  execute(): ReloadSettingsResponseDto {
    return { settings: this.settings.reload(), restartRequired: true };
  }
}

