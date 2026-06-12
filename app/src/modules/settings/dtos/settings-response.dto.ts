export interface GoogleDriveOAuthSettingsDto {
  clientId: string;
  clientSecretSet: boolean;
  redirectUri: string;
  uiBaseUrl: string;
}

export interface SettingsResponseDto {
  googleDriveOAuth: GoogleDriveOAuthSettingsDto;
}
