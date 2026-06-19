export interface TempDownloadUrlDto {
  absolutePath: string;
  url: string;
  method: "GET";
  expiresAt: string;
}
