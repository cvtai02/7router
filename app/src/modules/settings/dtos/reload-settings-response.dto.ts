import { RuntimeSettings } from "../../../infrastructure/settings/settings.service";

export interface ReloadSettingsResponseDto {
  settings: RuntimeSettings;
  restartRequired: boolean;
}

