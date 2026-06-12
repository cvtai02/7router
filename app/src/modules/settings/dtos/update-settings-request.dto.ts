export interface UpdateGoogleDriveOAuthSettingsDto {
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  uiBaseUrl?: string;
}

export interface UpdateSettingsRequestDto {
  googleDriveOAuth?: UpdateGoogleDriveOAuthSettingsDto;
}
