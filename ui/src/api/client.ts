import {
  AccountsClient,
  AuthClient,
  FilesClient,
  ProvidersClient,
  SettingsClient,
  SyncClient,
} from "@7router/api-clients";

const API_BASE_URL = import.meta.env.VITE_7ROUTER_API_BASE_URL ?? "http://localhost:3000";
const TOKEN_KEY = "7router.accessToken";

export function getStoredToken(): string {
  return localStorage.getItem(TOKEN_KEY) ?? "";
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function clients(accessToken = getStoredToken()) {
  const options = { baseUrl: API_BASE_URL, accessToken };
  return {
    auth: new AuthClient({ baseUrl: API_BASE_URL }),
    providers: new ProvidersClient(options),
    accounts: new AccountsClient(options),
    files: new FilesClient(options),
    sync: new SyncClient(options),
    settings: new SettingsClient(options),
  };
}

