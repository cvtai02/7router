import { Injectable } from "@nestjs/common";
import { SettingsService } from "../../../infrastructure/settings/settings.service";
import { SettingsResponseDto } from "../dtos/settings-response.dto";
import { UpdateSettingsRequestDto } from "../dtos/update-settings-request.dto";

@Injectable()
export class UpdateSettingsUseCase {
  constructor(private readonly settings: SettingsService) {}

  async execute(input: UpdateSettingsRequestDto): Promise<SettingsResponseDto> {
    if (input.googleDriveOAuth) {
      await this.settings.updateGoogleDriveOAuthSettings(input.googleDriveOAuth);
    }
    return {
      googleDriveOAuth: await this.settings.getGoogleDriveOAuthSettings(),
    };
  }
}
