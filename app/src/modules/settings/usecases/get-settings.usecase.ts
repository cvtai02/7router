import { Injectable } from "@nestjs/common";
import { SettingsService } from "../../../infrastructure/settings/settings.service";
import { SettingsResponseDto } from "../dtos/settings-response.dto";

@Injectable()
export class GetSettingsUseCase {
  constructor(private readonly settings: SettingsService) {}

  async execute(): Promise<SettingsResponseDto> {
    return {
      googleDriveOAuth: await this.settings.getGoogleDriveOAuthSettings(),
    };
  }
}
