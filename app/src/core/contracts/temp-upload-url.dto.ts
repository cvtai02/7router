export interface TempUploadUrlDto {
  absolutePath: string;
  url: string;
  method: "PUT";
  headers: Record<string, string>;
  expiresAt: string;
}
