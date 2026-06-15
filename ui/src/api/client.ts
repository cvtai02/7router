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

// ---- Domain types ----

export type ProviderName = "CloudflareR2" | "GoogleDrive";
// eslint-disable-next-line @typescript-eslint/no-redeclare
export const ProviderName = {
  CloudflareR2: "CloudflareR2" as ProviderName,
  GoogleDrive: "GoogleDrive" as ProviderName,
};

export interface ProviderListItemDto {
  name: string;
  absolutePath: string;
  type: "provider" | "account" | "bucket" | "folder" | "file";
  providerName: ProviderName;
  accountName?: string;
  bucketOrRootName?: string;
  keyOrPath?: string;
  sizeBytes?: number;
  contentType?: string;
  modifiedAt?: string;
  cdnUrl?: string;
}

export interface ProviderFileDto {
  absolutePath: string;
  providerName: ProviderName;
  accountName: string;
  bucketOrRootName: string;
  keyOrPath: string;
  contentType?: string;
  sizeBytes?: number;
  cdnUrl?: string;
  downloadUrl?: string;
}

export interface ListFilesResponseDto {
  currentPath: string;
  items: ProviderListItemDto[];
}

export interface GetFileResponseDto {
  file: ProviderFileDto;
}

export interface ProviderSummaryDto {
  providerName: ProviderName;
  displayName: string;
  enabled: boolean;
  accountCount: number;
}

export interface ProviderAccountSummaryDto {
  providerName: ProviderName;
  accountName: string;
  credentialHint?: string;
  occupiedSpaceBytes: number;
  createdAt: string;
}

export interface AddAccountRequestDto {
  accountName: string;
  credentials: Record<string, unknown>;
}

export interface AddAccountResponseDto {
  providerName: ProviderName;
  accountName: string;
  added: boolean;
}

export interface StartProviderOAuthResponseDto {
  authUrl: string;
}

export interface RemoveAccountResponseDto {
  removed: boolean;
}

export interface SyncResponseDto {
  syncRunId: string;
  absolutePath: string;
  status: "Completed" | "Failed";
  discovered: number;
  inserted: number;
  updated: number;
  deleted: number;
  failed: number;
  errorMessage?: string;
}

export interface SyncRunDto extends SyncResponseDto {
  providerName: ProviderName;
  accountName?: string;
  bucketName?: string;
  startedAt: string;
  completedAt?: string;
}

export interface SyncedFileDto {
  id: string;
  providerName: ProviderName;
  accountName: string;
  bucketName: string;
  key: string;
  absolutePath: string;
  itemType: string;
  sizeBytes?: number;
  contentType?: string;
  modifiedAt?: string;
  lastSyncedAt: string;
}

export interface SyncedFilesResponseDto {
  items: SyncedFileDto[];
  nextCursor?: string;
}

export interface TokenPermission {
  path: string;
  access: "read" | "write" | "read-write";
}

export interface AccessibleDirectoriesResponseDto {
  isAdmin: boolean;
  directories: TokenPermission[];
}

export interface MaskedToken {
  id: string;
  name: string;
  value: string; // "<prefix>.••••••••"
  permissions: TokenPermission[];
}

export interface GoogleDriveOAuthSettings {
  clientId: string;
  clientSecretSet: boolean;
  redirectUri: string;
  uiBaseUrl: string;
}

export interface SettingsResponse {
  googleDriveOAuth: GoogleDriveOAuthSettings;
}

export interface UpdateSettingsRequest {
  googleDriveOAuth?: {
    clientId?: string;
    clientSecret?: string;
    redirectUri?: string;
    uiBaseUrl?: string;
  };
}

// ---- HTTP helper ----

async function request<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { ...headers, ...(init.headers as Record<string, string> | undefined) },
  });
  if (res.status === 401) {
    clearStoredToken();
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (text) {
      let message = "";
      try {
        const parsed = JSON.parse(text) as { message?: unknown };
        if (typeof parsed.message === "string") message = parsed.message;
      } catch {
        message = "";
      }
      if (message) throw new Error(message);
    }
    throw new Error(text || `HTTP ${res.status}`);
  }
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

// ---- Sub-clients ----

function authClient() {
  return {
    checkToken: (accessToken: string) =>
      request<{ valid: boolean }>("/auth/check-token", accessToken, {
        method: "POST",
        body: JSON.stringify({ accessToken }),
      }),
  };
}

function accessClient(token: string) {
  return {
    getDirectories: () =>
      request<AccessibleDirectoriesResponseDto>("/access/directories", token),
  };
}

function providersClient(token: string) {
  return {
    listProviders: () => request<ProviderSummaryDto[]>("/providers", token),
    getProvider: (providerName: ProviderName) => request<ProviderSummaryDto>(`/providers/${providerName}`, token),
    listAccounts: (providerName: ProviderName) =>
      request<ProviderAccountSummaryDto[]>(`/providers/${providerName}/accounts`, token),
  };
}

function accountsClient(token: string) {
  return {
    addAccount: (providerName: ProviderName, input: AddAccountRequestDto) =>
      request<AddAccountResponseDto>(`/providers/${providerName}/accounts`, token, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    startOAuth: (providerName: ProviderName, accountName: string, returnUrl: string) =>
      request<StartProviderOAuthResponseDto>(`/providers/${providerName}/accounts/oauth/start`, token, {
        method: "POST",
        body: JSON.stringify({ accountName, returnUrl }),
      }),
    removeAccount: (providerName: ProviderName, accountName: string) =>
      request<RemoveAccountResponseDto>(
        `/providers/${providerName}/accounts/${encodeURIComponent(accountName)}`,
        token,
        { method: "DELETE" },
      ),
  };
}

function filesClient(token: string) {
  return {
    list: (path: string) =>
      request<ListFilesResponseDto>("/files/list", token, { method: "POST", body: JSON.stringify({ path }) }),
    get: (absolutePath: string) =>
      request<GetFileResponseDto>("/files/get", token, { method: "POST", body: JSON.stringify({ absolutePath }) }),
    createFolder: (parentPath: string, folderName: string) =>
      request<void>("/files/folder", token, { method: "POST", body: JSON.stringify({ parentPath, folderName }) }),
    createBucket: (accountPath: string, bucketName: string) =>
      request<void>("/files/bucket", token, { method: "POST", body: JSON.stringify({ accountPath, bucketName }) }),
    listAll: (path: string) =>
      request<ListFilesResponseDto>("/files/all", token, { method: "POST", body: JSON.stringify({ path }) }),
    uploadFile: (absolutePath: string, contentBase64: string, contentType?: string) =>
      request<void>("/files/upload", token, {
        method: "POST",
        body: JSON.stringify({ absolutePath, contentBase64, contentType }),
      }),
  };
}

function syncClient(token: string) {
  return {
    sync: (absolutePath: string) =>
      request<SyncResponseDto>("/sync", token, { method: "POST", body: JSON.stringify({ absolutePath }) }),
    listRuns: () => request<SyncRunDto[]>("/sync/runs", token),
    getRun: (syncRunId: string) => request<SyncRunDto>(`/sync/runs/${encodeURIComponent(syncRunId)}`, token),
    listSyncedFiles: (params: Record<string, string | number | undefined> = {}) => {
      const qs = Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join("&");
      return request<SyncedFilesResponseDto>(`/synced-files${qs ? `?${qs}` : ""}`, token);
    },
  };
}

function settingsClient(token: string) {
  return {
    getSettings: () => request<SettingsResponse>("/settings", token),
    updateSettings: (input: UpdateSettingsRequest) =>
      request<SettingsResponse>("/settings", token, { method: "PUT", body: JSON.stringify(input) }),
    reloadSettings: () => request<{ restartRequired: boolean }>("/settings/reload", token, { method: "POST" }),
    listTokens: () => request<{ tokens: MaskedToken[] }>("/settings/tokens", token),
    addToken: (name: string, tok: string) =>
      request<{ tokens: MaskedToken[] }>("/settings/tokens", token, {
        method: "POST",
        body: JSON.stringify({ name, token: tok }),
      }),
    revealToken: (id: string) =>
      request<{ value: string }>(`/settings/tokens/${id}/reveal`, token, { method: "POST" }),
    removeToken: (id: string) =>
      request<{ tokens: MaskedToken[] }>(`/settings/tokens/${id}`, token, { method: "DELETE" }),
    addPermission: (tokenId: string, path: string, access: TokenPermission["access"]) =>
      request<{ tokens: MaskedToken[] }>(`/settings/tokens/${tokenId}/permissions`, token, {
        method: "POST",
        body: JSON.stringify({ path, access }),
      }),
    removePermission: (tokenId: string, permissionIndex: number) =>
      request<{ tokens: MaskedToken[] }>(
        `/settings/tokens/${tokenId}/permissions/${permissionIndex}`,
        token,
        { method: "DELETE" },
      ),
  };
}

// ---- Public factory ----

export function clients(accessToken = getStoredToken()) {
  return {
    auth: authClient(),
    access: accessClient(accessToken),
    providers: providersClient(accessToken),
    accounts: accountsClient(accessToken),
    files: filesClient(accessToken),
    sync: syncClient(accessToken),
    settings: settingsClient(accessToken),
  };
}
