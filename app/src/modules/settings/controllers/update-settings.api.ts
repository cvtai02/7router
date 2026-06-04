import { Body, Controller, Put } from "@nestjs/common";
import { UpdateSettingsUseCase } from "../usecases/update-settings.usecase";

@Controller("settings")
export class UpdateSettingsApi {
  constructor(private readonly updateSettings: UpdateSettingsUseCase) {}

  @Put()
  update(@Body() _body: unknown): Record<string, never> {
    return this.updateSettings.execute();
  }
}
