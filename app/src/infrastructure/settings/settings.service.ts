import { Injectable, OnModuleInit } from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { hashAccessTokenValue } from "../../core/security/access-token-hash";
import { GoogleDriveOAuthSettingsDto } from "../../modules/settings/dtos/settings-response.dto";
import { UpdateGoogleDriveOAuthSettingsDto } from "../../modules/settings/dtos/update-settings-request.dto";
import { PrismaService } from "../database/prisma.service";
import { CredentialEncryptionService } from "../encryption/credential-encryption.service";

export interface TokenPermission {
  path: string;
  access: "read" | "write" | "read-write";
}

export interface MaskedToken {
  id: string;
  name: string;
  value: string;
  permissions: TokenPermission[];
}

export interface GoogleDriveOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  uiBaseUrl: string;
}

@Injectable()
export class SettingsService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: CredentialEncryptionService,
  ) {}

  /** Backfills legacy plaintext token rows into prefix + hash + encrypted value. */
  async onModuleInit(): Promise<void> {
    const legacy = await this.prisma.accessToken.findMany({ where: { value: { not: null } } });
    for (const token of legacy) {
      const value = token.value as string;
      const dot = value.indexOf(".");
      await this.prisma.accessToken.update({
        where: { id: token.id },
        data: {
          prefix: dot >= 0 ? value.slice(0, dot) : "",
          valueHash: hashAccessTokenValue(value),
          encryptedValue: this.encryption.encrypt(value),
          value: null,
        },
      });
    }
  }

  getSystemSecret(): string {
    return process.env.SYSTEM_SECRET ?? "";
  }

  async getGoogleDriveOAuthSettings(): Promise<GoogleDriveOAuthSettingsDto> {
    const settings = await this.prisma.googleSetting.findUnique({ where: { id: "default" } });
    return {
      clientId: settings?.clientId ?? "",
      clientSecretSet: Boolean(settings?.encryptedClientSecret),
      redirectUri: settings?.redirectUri ?? this.defaultRedirectUri(),
      uiBaseUrl: settings?.uiBaseUrl ?? this.defaultUiBaseUrl(),
    };
  }

  async updateGoogleDriveOAuthSettings(input: UpdateGoogleDriveOAuthSettingsDto): Promise<GoogleDriveOAuthSettingsDto> {
    const data: {
      clientId?: string;
      encryptedClientSecret?: string;
      redirectUri?: string;
      uiBaseUrl?: string;
    } = {};

    if (input.clientId !== undefined) data.clientId = input.clientId.trim();
    if (input.clientSecret !== undefined && input.clientSecret.trim()) {
      data.encryptedClientSecret = this.encryption.encrypt(input.clientSecret.trim());
    }
    if (input.redirectUri !== undefined) data.redirectUri = input.redirectUri.trim();
    if (input.uiBaseUrl !== undefined) data.uiBaseUrl = input.uiBaseUrl.trim();

    await this.prisma.googleSetting.upsert({
      where: { id: "default" },
      update: data,
      create: {
        id: "default",
        clientId: data.clientId ?? "",
        encryptedClientSecret: data.encryptedClientSecret,
        redirectUri: data.redirectUri ?? this.defaultRedirectUri(),
        uiBaseUrl: data.uiBaseUrl ?? this.defaultUiBaseUrl(),
      },
    });
    return this.getGoogleDriveOAuthSettings();
  }

  async getGoogleDriveOAuthConfig(): Promise<GoogleDriveOAuthConfig> {
    const settings = await this.prisma.googleSetting.findUnique({ where: { id: "default" } });
    const encryptedClientSecret = settings?.encryptedClientSecret;
    return {
      clientId: settings?.clientId || "",
      clientSecret: encryptedClientSecret ? this.encryption.decrypt<string>(encryptedClientSecret) : "",
      redirectUri: settings?.redirectUri || this.defaultRedirectUri(),
      uiBaseUrl: settings?.uiBaseUrl || this.defaultUiBaseUrl(),
    };
  }

  async listTokens(): Promise<MaskedToken[]> {
    const tokens = await this.prisma.accessToken.findMany({ orderBy: { createdAt: "asc" } });
    return tokens.map((t) => this.toMasked(t));
  }

  async addToken(name: string, value: string): Promise<MaskedToken[]> {
    const dot = value.indexOf(".");
    await this.prisma.accessToken.create({
      data: {
        name,
        prefix: dot >= 0 ? value.slice(0, dot) : "",
        valueHash: hashAccessTokenValue(value),
        encryptedValue: this.encryption.encrypt(value),
        permissions: "[]",
      },
    });
    return this.listTokens();
  }

  async revealToken(tokenId: string): Promise<string> {
    const token = await this.prisma.accessToken.findUniqueOrThrow({ where: { id: tokenId } });
    if (token.encryptedValue) return this.encryption.decrypt<string>(token.encryptedValue);
    if (token.value) return token.value;
    throw new Error("Token value is not recoverable.");
  }

  async removeToken(tokenId: string): Promise<MaskedToken[]> {
    await this.prisma.accessToken.delete({ where: { id: tokenId } });
    return this.listTokens();
  }

  async addPermission(tokenId: string, path: string, access: TokenPermission["access"]): Promise<MaskedToken[]> {
    const token = await this.prisma.accessToken.findUniqueOrThrow({ where: { id: tokenId } });
    const perms = JSON.parse(token.permissions) as TokenPermission[];
    perms.push({ path, access });
    await this.prisma.accessToken.update({ where: { id: tokenId }, data: { permissions: JSON.stringify(perms) } });
    return this.listTokens();
  }

  async removePermission(tokenId: string, permissionIndex: number): Promise<MaskedToken[]> {
    const token = await this.prisma.accessToken.findUniqueOrThrow({ where: { id: tokenId } });
    const perms = JSON.parse(token.permissions) as TokenPermission[];
    perms.splice(permissionIndex, 1);
    await this.prisma.accessToken.update({ where: { id: tokenId }, data: { permissions: JSON.stringify(perms) } });
    return this.listTokens();
  }

  static generateTokenValue(): string {
    const id = randomBytes(4).toString("hex");
    const secret = randomBytes(28).toString("hex");
    return `${id}.${secret}`;
  }

  private defaultRedirectUri(): string {
    return `http://localhost:${process.env.PORT ?? "20131"}/providers/GoogleDrive/accounts/oauth/callback`;
  }

  private defaultUiBaseUrl(): string {
    return "http://localhost:20132";
  }

  private toMasked(t: { id: string; name: string; prefix: string; permissions: string }): MaskedToken {
    return {
      id: t.id,
      name: t.name,
      value: t.prefix ? `${t.prefix}.********` : "********",
      permissions: JSON.parse(t.permissions) as TokenPermission[],
    };
  }
}
