import {
  AccountsClient,
  AuthClient,
  FilesClient,
  ProvidersClient,
  SettingsClient,
  SyncClient,
} from "@7router/api-clients";

const API_BASE_URL =
  import.meta.env.VITE_7ROUTER_API_BASE_URL ?? `${window.location.protocol}//${window.location.hostname}:20131`;
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

function makeFetch(): typeof fetch {
  return async (input, init) => {
    const res = await fetch(input, init);
    if (res.status === 401) {
      clearStoredToken();
      window.location.href = "/login";
    }
    return res;
  };
}

export function clients(accessToken = getStoredToken()) {
  const fetchImpl = makeFetch();
  const options = { baseUrl: API_BASE_URL, accessToken, fetchImpl };
  return {
    auth: new AuthClient({ baseUrl: API_BASE_URL, fetchImpl }),
    providers: new ProvidersClient(options),
    accounts: new AccountsClient(options),
    files: new FilesClient(options),
    sync: new SyncClient(options),
    settings: new SettingsClient(options),
  };
}
