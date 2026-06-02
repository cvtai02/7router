import { Injectable } from "@nestjs/common";
import { SettingsService } from "../../../infrastructure/settings/settings.service";
import { SettingsResponseDto } from "../dtos/settings-response.dto";

@Injectable()
export class GetSettingsUseCase {
  constructor(private readonly settings: SettingsService) {}

  execute(): SettingsResponseDto {
    return this.settings.getMasked();
  }
}

