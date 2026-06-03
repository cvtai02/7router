import { Injectable } from "@nestjs/common";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { join } from "node:path";

export interface TokenPermission {
  path: string;
  access: "read" | "write" | "read-write";
}

export interface AccessToken {
  name: string;
  value: string; // format: "<8-char-id>.<56-char-secret>"
  permissions: TokenPermission[];
}

export interface RuntimeSettings {
  server: { port: number; corsOrigins: string[] };
  auth: { adminToken: string; accessTokens: AccessToken[] };
  database: { url: string };
  encryption: { keyBase64: string };
  providers: {
    cloudflareR2: { enabled: boolean };
    googleDrive: { enabled: boolean };
  };
  features: { manualSync: boolean };
}

export interface MaskedToken {
  name: string;
  value: string; // "<id>.••••••••" — ID visible, secret masked
  permissions: TokenPermission[];
}

@Injectable()
export class SettingsService {
  private readonly localPath = join(process.cwd(), "settings.local.json");
  private readonly examplePath = join(process.cwd(), "settings.example.json");
  private settings: RuntimeSettings;

  constructor() {
    this.settings = this.loadFromDisk();
  }

  get(): RuntimeSettings {
    return this.settings;
  }

  getMasked(): RuntimeSettings {
    return {
      ...this.settings,
      auth: {
        adminToken: "********",
        accessTokens: this.settings.auth.accessTokens.map((t) => ({ ...t, value: this.maskValue(t.value) })),
      },
      encryption: { keyBase64: "********" },
    };
  }

  updateSafeSettings(input: Partial<RuntimeSettings>): RuntimeSettings {
    const next = {
      ...this.settings,
      server: { ...this.settings.server, ...input.server },
      providers: { ...this.settings.providers, ...input.providers },
      features: { ...this.settings.features, ...input.features },
    };
    if (input.database?.url) next.database = input.database;
    if (input.encryption?.keyBase64 && input.encryption.keyBase64 !== "********") next.encryption = input.encryption;
    if (input.auth?.adminToken && input.auth.adminToken !== "********") next.auth = { ...next.auth, adminToken: input.auth.adminToken };
    this.save(next);
    return this.getMasked();
  }

  reload(): RuntimeSettings {
    this.settings = this.loadFromDisk();
    return this.getMasked();
  }

  listTokens(): MaskedToken[] {
    return this.settings.auth.accessTokens.map((t) => ({ ...t, value: this.maskValue(t.value) }));
  }

  addToken(name: string, value: string): MaskedToken[] {
    const token: AccessToken = { name, value, permissions: [] };
    const next = { ...this.settings, auth: { ...this.settings.auth, accessTokens: [...this.settings.auth.accessTokens, token] } };
    this.save(next);
    return this.listTokens();
  }

  removeToken(tokenId: string): MaskedToken[] {
    const tokens = this.settings.auth.accessTokens.filter((t) => this.extractId(t.value) !== tokenId);
    const next = { ...this.settings, auth: { ...this.settings.auth, accessTokens: tokens } };
    this.save(next);
    return this.listTokens();
  }

  addPermission(tokenId: string, path: string, access: TokenPermission["access"]): MaskedToken[] {
    const tokens = this.settings.auth.accessTokens.map((t) =>
      this.extractId(t.value) === tokenId ? { ...t, permissions: [...t.permissions, { path, access }] } : t
    );
    const next = { ...this.settings, auth: { ...this.settings.auth, accessTokens: tokens } };
    this.save(next);
    return this.listTokens();
  }

  removePermission(tokenId: string, permissionIndex: number): MaskedToken[] {
    const tokens = this.settings.auth.accessTokens.map((t) =>
      this.extractId(t.value) === tokenId ? { ...t, permissions: t.permissions.filter((_, i) => i !== permissionIndex) } : t
    );
    const next = { ...this.settings, auth: { ...this.settings.auth, accessTokens: tokens } };
    this.save(next);
    return this.listTokens();
  }

  private extractId(value: string): string {
    const dot = value.indexOf(".");
    return dot >= 0 ? value.slice(0, dot) : value;
  }

  private maskValue(value: string): string {
    const dot = value.indexOf(".");
    return dot >= 0 ? `${value.slice(0, dot)}.••••••••` : "••••••••";
  }

  static generateTokenValue(): string {
    const id = randomBytes(4).toString("hex");     // 8 chars
    const secret = randomBytes(28).toString("hex"); // 56 chars
    return `${id}.${secret}`;
  }

  private save(settings: RuntimeSettings): void {
    writeFileSync(this.localPath, `${JSON.stringify(settings, null, 2)}\n`, "utf8");
    this.settings = settings;
  }

  private loadFromDisk(): RuntimeSettings {
    const filePath = existsSync(this.localPath) ? this.localPath : this.examplePath;
    const raw = JSON.parse(readFileSync(filePath, "utf8")) as RuntimeSettings & {
      auth: { adminToken?: string; accessTokens: (Partial<AccessToken> & { id?: string } | string)[] };
    };
    const tokens: AccessToken[] = (raw.auth.accessTokens ?? []).map((t, i) => {
      if (typeof t === "string") return { name: `token-${i + 1}`, value: t, permissions: [] };
      // drop legacy `id` field — identity now lives in value
      return { name: t.name ?? `token-${i + 1}`, value: t.value ?? "", permissions: t.permissions ?? [] };
    });
    return { ...raw, auth: { adminToken: raw.auth.adminToken ?? "", accessTokens: tokens } };
  }
}
