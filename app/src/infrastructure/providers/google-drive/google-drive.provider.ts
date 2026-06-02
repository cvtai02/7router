import { Injectable } from "@nestjs/common";
import { google, drive_v3 } from "googleapis";
import { ProviderName } from "../../../core/enums/provider-name.enum";
import {
  AddProviderAccountDto,
  IProvider,
  ProviderFileDto,
  ProviderListItemDto,
  RemoveProviderAccountDto,
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

  async listSubFolderAndFile(currentPath: string): Promise<ProviderListItemDto[]> {
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

  async getFile(absolutePath: string): Promise<ProviderFileDto> {
    const parsed = ProviderAbsolutePath.parse(absolutePath);
    if (!parsed.accountName || !parsed.bucketOrRootName || !parsed.keyOrPath) {
      throw new Error("Google Drive file path must include account, root, and file path.");
    }
    const account = await this.findAccount(parsed.accountName);
    const drive = this.createDrive(this.encryption.decrypt<GoogleDriveCredentialsDto>(account.encryptedCredentials));
    const file = await this.resolveFileByPath(drive, parsed.bucketOrRootName, parsed.keyOrPath);
    const content = await drive.files.get({ fileId: file.id!, alt: "media", supportsAllDrives: true }, { responseType: "arraybuffer" });
    return {
      absolutePath: parsed.originalPath,
      providerName: this.providerName,
      accountName: parsed.accountName,
      bucketOrRootName: parsed.bucketOrRootName,
      keyOrPath: parsed.keyOrPath,
      contentType: file.mimeType ?? undefined,
      sizeBytes: file.size ? Number(file.size) : undefined,
      contentBase64: Buffer.from(content.data as ArrayBuffer).toString("base64"),
    };
  }

  private createDrive(credentials: GoogleDriveCredentialsDto): drive_v3.Drive {
    const oauth2 = new google.auth.OAuth2(credentials.clientId, credentials.clientSecret);
    oauth2.setCredentials({
      access_token: credentials.accessToken,
      refresh_token: credentials.refreshToken,
      expiry_date: credentials.tokenExpiryIso ? new Date(credentials.tokenExpiryIso).getTime() : undefined,
    });
    return google.drive({ version: "v3", auth: oauth2 });
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
}

