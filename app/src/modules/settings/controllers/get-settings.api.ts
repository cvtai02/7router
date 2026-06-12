import { Controller, Get } from "@nestjs/common";
import { SettingsResponseDto } from "../dtos/settings-response.dto";
import { GetSettingsUseCase } from "../usecases/get-settings.usecase";

@Controller("settings")
export class GetSettingsApi {
  constructor(private readonly getSettings: GetSettingsUseCase) {}

  @Get()
  get(): Promise<SettingsResponseDto> {
    return this.getSettings.execute();
  }
}
