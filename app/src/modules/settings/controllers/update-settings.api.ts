import { Body, Controller, Put } from "@nestjs/common";
import { SettingsResponseDto } from "../dtos/settings-response.dto";
import { UpdateSettingsRequestDto } from "../dtos/update-settings-request.dto";
import { UpdateSettingsUseCase } from "../usecases/update-settings.usecase";

@Controller("settings")
export class UpdateSettingsApi {
  constructor(private readonly updateSettings: UpdateSettingsUseCase) {}

  @Put()
  update(@Body() body: UpdateSettingsRequestDto): Promise<SettingsResponseDto> {
    return this.updateSettings.execute(body);
  }
}
