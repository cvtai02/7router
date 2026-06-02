import { SevenRouterClientOptions } from "../interfaces/options";
import { BaseClient } from "./base.client";

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
}

