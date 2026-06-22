import { Injectable } from "@nestjs/common";
import { google, drive_v3 } from "googleapis";
import { ProviderName } from "../../../core/enums/provider-name.enum";
import {
  AddProviderAccountDto,
  DownloadFileDto,
  IProvider,
  ProviderListItemDto,
  RemoveProviderAccountDto,
  TempDownloadUrlDto,
  TempDownloadUrlRequestDto,
  TempUploadUrlDto,
  TempUploadUrlRequestDto,
  UploadFileDto,
} from "../../../core/contracts/provider.contract";
import { ProviderAbsolutePath } from "../../../core/value-objects/provider-absolute-path";
import { PrismaService } from "../../database/prisma.service";
import { CredentialEncryptionService } from "../../encryption/credential-encryption.service";

export interface GoogleDriveCredentialsDto {
  accessToken: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
  tokenExpiryIso?: string;
  accountEmail?: string;
}

@Injectable()
export class GoogleDriveProvider implements IProvider {
  readonly providerName = ProviderName.GoogleDrive;

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: CredentialEncryptionService,
  ) {}

  async listChildren(currentPath: string): Promise<ProviderListItemDto[]> {
    const parsed = ProviderAbsolutePath.parse(currentPath);
    if (!parsed.accountName) {
      const accounts = await this.prisma.providerAccount.findMany({
        where: { provider: { name: this.providerName } },
        orderBy: { accountName: "asc" },
      });
      return accounts.map((account) => ({
        name: account.accountName,
        absolutePath: `${this.providerName}/${account.accountName}`,
        type: "account",
        providerName: this.providerName,
        accountName: account.accountName,
      }));
    }

    const account = await this.findAccount(parsed.accountName);
    const drive = this.createDrive(this.encryption.decrypt<GoogleDriveCredentialsDto>(account.encryptedCredentials));

    if (!parsed.bucketOrRootName) {
      const drives = await drive.drives.list({ pageSize: 100 });
      return [
        {
          name: "My Drive",
          absolutePath: `${this.providerName}/${parsed.accountName}/My Drive`,
          type: "bucket",
          providerName: this.providerName,
          accountName: parsed.accountName,
          bucketOrRootName: "My Drive",
        },
        ...(drives.data.drives ?? []).map((sharedDrive) => ({
          name: sharedDrive.name ?? sharedDrive.id ?? "Shared Drive",
          absolutePath: `${this.providerName}/${parsed.accountName}/${sharedDrive.name ?? sharedDrive.id}`,
          type: "bucket" as const,
          providerName: this.providerName,
          accountName: parsed.accountName,
          bucketOrRootName: sharedDrive.name ?? sharedDrive.id ?? undefined,
          keyOrPath: sharedDrive.id ?? undefined,
        })),
      ];
    }

    const folderId = await this.resolveFolderId(drive, parsed.bucketOrRootName, parsed.keyOrPath);
    const result = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "files(id,name,mimeType,size,modifiedTime)",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      pageSize: 1000,
    });
    return (result.data.files ?? []).map((file) => {
      const isFolder = file.mimeType === "application/vnd.google-apps.folder";
      const key = parsed.keyOrPath ? `${parsed.keyOrPath}/${file.name}` : file.name ?? file.id ?? "";
      return {
        name: file.name ?? file.id ?? "",
        absolutePath: `${this.providerName}/${parsed.accountName}/${parsed.bucketOrRootName}/${key}`,
        type: isFolder ? "folder" : "file",
        providerName: this.providerName,
        accountName: parsed.accountName,
        bucketOrRootName: parsed.bucketOrRootName,
        keyOrPath: key,
        sizeBytes: file.size ? Number(file.size) : undefined,
        contentType: file.mimeType ?? undefined,
        modifiedAt: file.modifiedTime ?? undefined,
      };
    });
  }

  async addAccount(input: AddProviderAccountDto): Promise<void> {
    const credentials = input.credentials as unknown as GoogleDriveCredentialsDto;
    const about = await this.createDrive(credentials).about.get({ fields: "user" });
    const provider = await this.prisma.providerRecord.upsert({
      where: { name: this.providerName },
      update: {},
      create: { name: this.providerName, displayName: "Google Drive" },
    });
    await this.prisma.providerAccount.upsert({
      where: { providerId_accountName: { providerId: provider.id, accountName: input.accountName } },
      update: {
        encryptedCredentials: this.encryption.encrypt(credentials),
        credentialHint: credentials.accountEmail ?? about.data.user?.emailAddress ?? undefined,
      },
      create: {
        providerId: provider.id,
        accountName: input.accountName,
        encryptedCredentials: this.encryption.encrypt(credentials),
        credentialHint: credentials.accountEmail ?? about.data.user?.emailAddress ?? undefined,
      },
    });
  }

  async removeAccount(input: RemoveProviderAccountDto): Promise<void> {
    await this.prisma.providerAccount.deleteMany({
      where: { accountName: input.accountName, provider: { name: this.providerName } },
    });
  }

  async uploadFile(input: UploadFileDto): Promise<void> {
    const parsed = ProviderAbsolutePath.parse(input.absolutePath);
    if (!parsed.accountName || !parsed.bucketOrRootName || !parsed.keyOrPath) {
      throw new Error("Google Drive upload path must include account, root, and file path.");
    }
    const account = await this.findAccount(parsed.accountName);
    const drive = this.createDrive(this.encryption.decrypt<GoogleDriveCredentialsDto>(account.encryptedCredentials));
    const segments = parsed.keyOrPath.split("/");
    const fileName = segments.pop()!;
    const parentId = await this.resolveFolderId(drive, parsed.bucketOrRootName, segments.join("/") || undefined);
    await drive.files.create({
      requestBody: { name: fileName, parents: [parentId] },
      media: { mimeType: input.contentType ?? "application/octet-stream", body: Buffer.from(input.contentBase64, "base64") },
      supportsAllDrives: true,
    });
  }

  async createFolder(parentPath: string, folderName: string): Promise<void> {
    const parsed = ProviderAbsolutePath.parse(parentPath);
    if (parsed.accountName && !parsed.bucketOrRootName) {
      throw new Error("Creating shared drives is not supported.");
    }

    if (!parsed.accountName || !parsed.bucketOrRootName) {
      throw new Error("Google Drive folder creation requires account and root in the path.");
    }
    const account = await this.findAccount(parsed.accountName);
    const drive = this.createDrive(this.encryption.decrypt<GoogleDriveCredentialsDto>(account.encryptedCredentials));
    const parentId = await this.resolveFolderId(drive, parsed.bucketOrRootName, parsed.keyOrPath);
    await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
        parents: [parentId],
      },
      supportsAllDrives: true,
    });
  }

  async downloadFile(absolutePath: string): Promise<DownloadFileDto> {
    const parsed = ProviderAbsolutePath.parse(absolutePath);
    if (!parsed.accountName || !parsed.bucketOrRootName || !parsed.keyOrPath) {
      throw new Error("Google Drive file path must include account, root, and file path.");
    }
    const account = await this.findAccount(parsed.accountName);
    const drive = this.createDrive(this.encryption.decrypt<GoogleDriveCredentialsDto>(account.encryptedCredentials));
    const file = await this.resolveFileByPath(drive, parsed.bucketOrRootName, parsed.keyOrPath);
    const downloaded = await drive.files.get({
      fileId: file.id!,
      alt: "media",
      supportsAllDrives: true,
    }, { responseType: "arraybuffer" });
    const content = Buffer.from(downloaded.data as unknown as ArrayBuffer);
    return {
      absolutePath: parsed.originalPath,
      contentType: file.mimeType ?? undefined,
      sizeBytes: file.size ? Number(file.size) : content.byteLength,
      contentBase64: content.toString("base64"),
    };
  }

  async getTempDownloadUrl(_input: TempDownloadUrlRequestDto): Promise<TempDownloadUrlDto> {
    const parsed = ProviderAbsolutePath.parse(_input.absolutePath);
    if (!parsed.accountName || !parsed.bucketOrRootName || !parsed.keyOrPath) {
      throw new Error("Google Drive temp download URL path must include account, root, and file path.");
    }
    const credentials = await this.findCredentials(parsed.accountName);
    const drive = this.createDrive(credentials);
    const file = await this.resolveFileByPath(drive, parsed.bucketOrRootName, parsed.keyOrPath);

    await drive.permissions.create({
      fileId: file.id!,
      supportsAllDrives: true,
      requestBody: { role: "reader", type: "anyone" },
    });

    const expiresIn = this.normalizeExpiresInSeconds(_input.expiresInSeconds);

    return {
      absolutePath: parsed.originalPath,
      url: `https://drive.google.com/uc?export=download&id=${encodeURIComponent(file.id!)}`,
      method: "GET",
      expiresAt: this.expiresAt(expiresIn),
    };
  }

  async getTempUploadUrl(input: TempUploadUrlRequestDto): Promise<TempUploadUrlDto> {
    const parsed = ProviderAbsolutePath.parse(input.absolutePath);
    if (!parsed.accountName || !parsed.bucketOrRootName || !parsed.keyOrPath) {
      throw new Error("Google Drive temp upload URL path must include account, root, and file path.");
    }
    const credentials = await this.findCredentials(parsed.accountName);
    const drive = this.createDrive(credentials);
    const segments = parsed.keyOrPath.split("/");
    const fileName = segments.pop()!;
    const parentId = await this.resolveFolderId(drive, parsed.bucketOrRootName, segments.join("/") || undefined);
    const token = await this.getAccessToken(credentials);
    const contentType = input.contentType ?? "application/octet-stream";
    const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": contentType,
      },
      body: JSON.stringify({ name: fileName, parents: [parentId] }),
    });
    if (!response.ok) {
      const message = await response.text().catch(() => "");
      throw new Error(`Google Drive temp upload URL creation failed: ${message || response.status}`);
    }
    const url = response.headers.get("location");
    if (!url) throw new Error("Google Drive did not return a resumable upload URL.");
    const expiresIn = this.normalizeExpiresInSeconds(input.expiresInSeconds);

    return {
      absolutePath: parsed.originalPath,
      url,
      method: "PUT",
      headers: { "Content-Type": contentType },
      expiresAt: this.expiresAt(expiresIn),
    };
  }

  private createDrive(credentials: GoogleDriveCredentialsDto): drive_v3.Drive {
    return google.drive({ version: "v3", auth: this.createOAuthClient(credentials) });
  }

  private createOAuthClient(credentials: GoogleDriveCredentialsDto) {
    const oauth2 = new google.auth.OAuth2(credentials.clientId, credentials.clientSecret);
    oauth2.setCredentials({
      access_token: credentials.accessToken,
      refresh_token: credentials.refreshToken,
      expiry_date: credentials.tokenExpiryIso ? new Date(credentials.tokenExpiryIso).getTime() : undefined,
    });
    return oauth2;
  }

  private async getAccessToken(credentials: GoogleDriveCredentialsDto): Promise<{ accessToken: string; expiresAt?: string }> {
    const oauth2 = this.createOAuthClient(credentials);
    const result = await oauth2.getAccessToken();
    const accessToken = typeof result === "string" ? result : result?.token;
    if (!accessToken) throw new Error("Google Drive access token is not available.");
    const expiresAt = oauth2.credentials.expiry_date
      ? new Date(oauth2.credentials.expiry_date).toISOString()
      : credentials.tokenExpiryIso;
    return { accessToken, expiresAt };
  }

  private async resolveFolderId(drive: drive_v3.Drive, rootName: string, keyOrPath?: string): Promise<string> {
    let parent = rootName === "My Drive" ? "root" : await this.findSharedDriveId(drive, rootName);
    if (!keyOrPath) return parent;
    const segments = keyOrPath.split("/");
    for (const segment of segments) {
      const result = await drive.files.list({
        q: `'${parent}' in parents and name = '${segment.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
        fields: "files(id,name)",
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        pageSize: 1,
      });
      const folder = result.data.files?.[0];
      if (!folder?.id) throw new Error(`Google Drive folder not found: ${segment}`);
      parent = folder.id;
    }
    return parent;
  }

  private async resolveFileByPath(drive: drive_v3.Drive, rootName: string, keyOrPath: string) {
    const segments = keyOrPath.split("/");
    const fileName = segments.pop();
    const folderId = await this.resolveFolderId(drive, rootName, segments.join("/") || undefined);
    const result = await drive.files.list({
      q: `'${folderId}' in parents and name = '${(fileName ?? "").replace(/'/g, "\\'")}' and trashed = false`,
      fields: "files(id,name,mimeType,size,modifiedTime)",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      pageSize: 1,
    });
    const file = result.data.files?.[0];
    if (!file?.id) throw new Error(`Google Drive file not found: ${keyOrPath}`);
    return file;
  }

  private async findSharedDriveId(drive: drive_v3.Drive, rootName: string): Promise<string> {
    const result = await drive.drives.list({ q: `name = '${rootName.replace(/'/g, "\\'")}'`, pageSize: 1 });
    const id = result.data.drives?.[0]?.id;
    if (!id) throw new Error(`Google Drive root not found: ${rootName}`);
    return id;
  }

  private async findAccount(accountName: string) {
    const account = await this.prisma.providerAccount.findFirst({
      where: { accountName, provider: { name: this.providerName } },
    });
    if (!account) throw new Error(`Google Drive account not found: ${accountName}`);
    return account;
  }

  private async findCredentials(accountName: string): Promise<GoogleDriveCredentialsDto> {
    const account = await this.findAccount(accountName);
    return this.encryption.decrypt<GoogleDriveCredentialsDto>(account.encryptedCredentials);
  }

  private normalizeExpiresInSeconds(value?: number): number {
    if (value === undefined) return 900;
    if (!Number.isFinite(value) || value <= 0) throw new Error("expiresInSeconds must be a positive number.");
    return Math.min(Math.floor(value), 604800);
  }

  private expiresAt(expiresInSeconds: number): string {
    return new Date(Date.now() + expiresInSeconds * 1000).toISOString();
  }

  private minExpiresAt(expiresInSeconds: number, providerExpiresAt?: string): string {
    const requested = Date.now() + expiresInSeconds * 1000;
    const providerExpiry = providerExpiresAt ? new Date(providerExpiresAt).getTime() : undefined;
    const expiresAt = providerExpiry && Number.isFinite(providerExpiry)
      ? Math.min(requested, providerExpiry)
      : requested;
    return new Date(expiresAt).toISOString();
  }
}

