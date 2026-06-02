import { Controller, Post } from "@nestjs/common";
import { ReloadSettingsResponseDto } from "../dtos/reload-settings-response.dto";
import { ReloadSettingsUseCase } from "../usecases/reload-settings.usecase";

@Controller("settings")
export class ReloadSettingsApi {
  constructor(private readonly reloadSettings: ReloadSettingsUseCase) {}

  @Post("reload")
  reload(): ReloadSettingsResponseDto {
    return this.reloadSettings.execute();
  }
}

