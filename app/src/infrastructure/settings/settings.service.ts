import { Injectable } from "@nestjs/common";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export interface RuntimeSettings {
  server: { port: number; corsOrigins: string[] };
  auth: { accessTokens: string[] };
  database: { url: string };
  encryption: { keyBase64: string };
  providers: {
    cloudflareR2: { enabled: boolean };
    googleDrive: { enabled: boolean };
  };
  features: { manualSync: boolean };
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
      auth: { accessTokens: this.settings.auth.accessTokens.map(() => "********") },
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
    if (input.auth?.accessTokens?.length) next.auth = input.auth;
    if (input.database?.url) next.database = input.database;
    if (input.encryption?.keyBase64 && input.encryption.keyBase64 !== "********") next.encryption = input.encryption;
    writeFileSync(this.localPath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
    this.settings = next;
    return this.getMasked();
  }

  reload(): RuntimeSettings {
    this.settings = this.loadFromDisk();
    return this.getMasked();
  }

  private loadFromDisk(): RuntimeSettings {
    const path = existsSync(this.localPath) ? this.localPath : this.examplePath;
    return JSON.parse(readFileSync(path, "utf8")) as RuntimeSettings;
  }
}

