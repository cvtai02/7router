import { Injectable } from "@nestjs/common";
import { SettingsService } from "../../../infrastructure/settings/settings.service";
import { SettingsResponseDto } from "../dtos/settings-response.dto";
import { UpdateSettingsRequestDto } from "../dtos/update-settings-request.dto";

@Injectable()
export class UpdateSettingsUseCase {
  constructor(private readonly settings: SettingsService) {}

  execute(input: UpdateSettingsRequestDto): SettingsResponseDto {
    return this.settings.updateSafeSettings(input);
  }
}

