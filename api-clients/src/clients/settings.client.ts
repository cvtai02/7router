import { SevenRouterClientOptions } from "../interfaces/options";
import { BaseClient } from "./base.client";

export interface TokenPermission {
  path: string;
  access: "read" | "write" | "read-write";
}

export interface MaskedToken {
  name: string;
  value: string; // "<id>.••••••••" — ID prefix visible, secret masked
  permissions: TokenPermission[];
}

export class SettingsClient extends BaseClient {
  constructor(options: SevenRouterClientOptions) {
    super(options);
  }

  getSettings<T = unknown>(): Promise<T> {
    return this.request("/settings");
  }

  updateSettings<T = unknown>(settings: Partial<T>): Promise<T> {
    return this.request("/settings", { method: "PUT", body: JSON.stringify(settings) });
  }

  reloadSettings<T = unknown>(): Promise<T> {
    return this.request("/settings/reload", { method: "POST" });
  }

  listTokens(): Promise<{ tokens: MaskedToken[] }> {
    return this.request("/settings/tokens");
  }

  addToken(name: string, token: string): Promise<{ tokens: MaskedToken[] }> {
    return this.request("/settings/tokens", { method: "POST", body: JSON.stringify({ name, token }) });
  }

  removeToken(id: string): Promise<{ tokens: MaskedToken[] }> {
    return this.request(`/settings/tokens/${id}`, { method: "DELETE" });
  }

  addPermission(tokenId: string, path: string, access: TokenPermission["access"]): Promise<{ tokens: MaskedToken[] }> {
    return this.request(`/settings/tokens/${tokenId}/permissions`, { method: "POST", body: JSON.stringify({ path, access }) });
  }

  removePermission(tokenId: string, permissionIndex: number): Promise<{ tokens: MaskedToken[] }> {
    return this.request(`/settings/tokens/${tokenId}/permissions/${permissionIndex}`, { method: "DELETE" });
  }
}
