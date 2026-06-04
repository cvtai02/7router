import { Controller, Get } from "@nestjs/common";
import { GetSettingsUseCase } from "../usecases/get-settings.usecase";

@Controller("settings")
export class GetSettingsApi {
  constructor(private readonly getSettings: GetSettingsUseCase) {}

  @Get()
  get(): Record<string, never> {
    return this.getSettings.execute();
  }
}
