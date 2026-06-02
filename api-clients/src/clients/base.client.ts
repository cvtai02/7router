import { SevenRouterClientOptions } from "../interfaces/options";

export class BaseClient {
  protected readonly baseUrl: string;
  protected readonly accessToken?: string;
  protected readonly fetchImpl: typeof fetch;

  constructor(options: SevenRouterClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.accessToken = options.accessToken;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  protected async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("Content-Type", "application/json");
    if (this.accessToken) headers.set("Authorization", `Bearer ${this.accessToken}`);
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, { ...init, headers });
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}: ${await response.text()}`);
    }
    return (await response.json()) as T;
  }

  protected query(params: Record<string, string | number | undefined>): string {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") search.set(key, String(value));
    }
    const value = search.toString();
    return value ? `?${value}` : "";
  }
}

