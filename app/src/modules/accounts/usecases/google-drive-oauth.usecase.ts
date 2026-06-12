import { BadRequestException, Injectable } from "@nestjs/common";
import { google } from "googleapis";
import { createHmac, timingSafeEqual } from "node:crypto";
import { ProviderName } from "../../../core/enums/provider-name.enum";
import { GoogleDriveCredentialsDto } from "../../../infrastructure/providers/google-drive/google-drive.provider";
import { GoogleDriveOAuthConfig, SettingsService } from "../../../infrastructure/settings/settings.service";
import { AddAccountUseCase } from "./add-account.usecase";

interface GoogleDriveOAuthState {
  accountName: string;
  exp: number;
  returnUrl: string;
}

@Injectable()
export class GoogleDriveOAuthUseCase {
  private readonly scope = ["https://www.googleapis.com/auth/drive"];

  constructor(
    private readonly addAccount: AddAccountUseCase,
    private readonly settings: SettingsService,
  ) {}

  async start(accountName: string, returnUrl?: string): Promise<string> {
    if (!accountName.trim()) throw new BadRequestException("Account name is required.");
    const config = await this.getConfig();
    const oauth2 = this.createOAuthClient(config);
    const state = this.signState({
      accountName: accountName.trim(),
      exp: Date.now() + 10 * 60 * 1000,
      returnUrl: this.normalizeReturnUrl(config, returnUrl),
    });

    return oauth2.generateAuthUrl({
      access_type: "offline",
      include_granted_scopes: true,
      prompt: "consent",
      scope: this.scope,
      state,
    });
  }

  async complete(code: string, state: string): Promise<string> {
    if (!code) throw new BadRequestException("Missing OAuth code.");
    const payload = this.verifyState(state);
    const config = await this.getConfig();
    const oauth2 = this.createOAuthClient(config);
    const { tokens } = await oauth2.getToken(code);
    if (!tokens.access_token) throw new BadRequestException("Google did not return an access token.");

    const credentials: GoogleDriveCredentialsDto = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? undefined,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      tokenExpiryIso: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : undefined,
    };

    await this.addAccount.execute(ProviderName.GoogleDrive, {
      accountName: payload.accountName,
      credentials: credentials as unknown as Record<string, unknown>,
    });

    const url = new URL(payload.returnUrl);
    url.searchParams.set("googleDriveOAuth", "connected");
    url.searchParams.set("accountName", payload.accountName);
    return url.toString();
  }

  async errorRedirect(error: string | undefined, state: string | undefined): Promise<string> {
    const { uiBaseUrl } = await this.settings.getGoogleDriveOAuthSettings();
    const fallback = new URL("/accounts", uiBaseUrl).toString();
    let returnUrl = fallback;
    if (state) {
      try {
        returnUrl = this.verifyState(state).returnUrl;
      } catch {
        returnUrl = fallback;
      }
    }
    const url = new URL(returnUrl);
    url.searchParams.set("googleDriveOAuth", "error");
    url.searchParams.set("message", error ?? "Google OAuth failed.");
    return url.toString();
  }

  private createOAuthClient(config: GoogleDriveOAuthConfig) {
    return new google.auth.OAuth2(config.clientId, config.clientSecret, config.redirectUri);
  }

  private signState(payload: GoogleDriveOAuthState): string {
    const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
    const signature = createHmac("sha256", this.stateSecret()).update(body).digest("base64url");
    return `${body}.${signature}`;
  }

  private verifyState(state: string): GoogleDriveOAuthState {
    const [body, signature] = state.split(".");
    if (!body || !signature) throw new BadRequestException("Invalid OAuth state.");
    const expected = createHmac("sha256", this.stateSecret()).update(body).digest("base64url");
    if (!this.safeEqual(signature, expected)) throw new BadRequestException("Invalid OAuth state.");

    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as GoogleDriveOAuthState;
    if (!payload.accountName || !payload.returnUrl || Date.now() > payload.exp) {
      throw new BadRequestException("Expired OAuth state.");
    }
    return payload;
  }

  private safeEqual(a: string, b: string): boolean {
    const left = Buffer.from(a);
    const right = Buffer.from(b);
    return left.length === right.length && timingSafeEqual(left, right);
  }

  private normalizeReturnUrl(config: GoogleDriveOAuthConfig, returnUrl?: string): string {
    const base = new URL(config.uiBaseUrl);
    const url = new URL(returnUrl || "/accounts", base);
    if (url.origin !== base.origin) throw new BadRequestException("Invalid return URL.");
    return url.toString();
  }

  private stateSecret(): string {
    return this.getRequiredEnv("SYSTEM_SECRET");
  }

  private async getConfig(): Promise<GoogleDriveOAuthConfig> {
    const config = await this.settings.getGoogleDriveOAuthConfig();
    if (!config.clientId) throw new BadRequestException("Google Drive OAuth client ID is not set in Settings.");
    if (!config.clientSecret) throw new BadRequestException("Google Drive OAuth client secret is not set in Settings.");
    if (!config.redirectUri) throw new BadRequestException("Google Drive OAuth redirect URI is not set in Settings.");
    if (!config.uiBaseUrl) throw new BadRequestException("UI base URL is not set in Settings.");
    return config;
  }

  private getRequiredEnv(name: string): string {
    const value = process.env[name];
    if (!value) throw new BadRequestException(`${name} is not set.`);
    return value;
  }
}
