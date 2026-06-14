import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate, useParams } from "react-router-dom";
import { clients, ProviderName } from "../api/client";

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  CloudflareR2: <img src="/cloudflare.svg" className="w-12 h-12" alt="Cloudflare R2" />,
  GoogleDrive: <img src="/google-drive.svg" className="w-12 h-12" alt="Google Drive" />,
};

const PROVIDER_LABELS: Record<string, string> = {
  CloudflareR2: "Cloudflare R2",
  GoogleDrive: "Google Drive",
};

const inputCls = "w-full bg-black/30 border border-[var(--border)] focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none transition-colors placeholder:text-gray-600";
const labelCls = "block text-xs text-gray-400 mb-1.5";

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
}

function SettingsIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="w-4 h-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export function ProviderDetailsPage() {
  const params = useParams();
  const providerName = params.providerName as ProviderName | undefined;
  const isKnownProvider = providerName === ProviderName.CloudflareR2 || providerName === ProviderName.GoogleDrive;
  const activeProviderName = isKnownProvider ? providerName : ProviderName.CloudflareR2;
  const qc = useQueryClient();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [redirectUri, setRedirectUri] = useState("");
  const [uiBaseUrl, setUiBaseUrl] = useState("");
  const [settingsSaved, setSettingsSaved] = useState(false);

  const provider = useQuery({
    queryKey: ["provider", activeProviderName],
    queryFn: () => clients().providers.getProvider(activeProviderName),
    enabled: isKnownProvider,
  });

  const accounts = useQuery({
    queryKey: ["accounts", activeProviderName],
    queryFn: () => clients().providers.listAccounts(activeProviderName),
    enabled: isKnownProvider,
  });

  const settings = useQuery({
    queryKey: ["settings"],
    queryFn: () => clients().settings.getSettings(),
    enabled: activeProviderName === ProviderName.GoogleDrive,
  });

  useEffect(() => {
    if (!settings.data) return;
    setClientId(settings.data.googleDriveOAuth.clientId);
    setRedirectUri(settings.data.googleDriveOAuth.redirectUri);
    setUiBaseUrl(settings.data.googleDriveOAuth.uiBaseUrl);
  }, [settings.data]);

  const updateSettings = useMutation({
    mutationFn: () =>
      clients().settings.updateSettings({
        googleDriveOAuth: {
          clientId,
          clientSecret,
          redirectUri,
          uiBaseUrl,
        },
      }),
    onSuccess: () => {
      setSettingsSaved(true);
      setClientSecret("");
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  function submitSettings(event: FormEvent) {
    event.preventDefault();
    setSettingsSaved(false);
    updateSettings.mutate();
  }

  if (!isKnownProvider) {
    return <Navigate to="/providers" replace />;
  }

  const displayName = provider.data?.displayName ?? PROVIDER_LABELS[activeProviderName] ?? activeProviderName;
  const totalOccupiedSpace = (accounts.data ?? []).reduce((sum, account) => sum + account.occupiedSpaceBytes, 0);

  return (
    <div className="p-8 flex flex-col gap-6 min-h-full">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-14 h-14 rounded-lg border border-[var(--border)] bg-[var(--muted)] flex items-center justify-center shrink-0">
            {PROVIDER_ICONS[activeProviderName] ?? <span className="text-sm font-bold">{displayName.slice(0, 2).toUpperCase()}</span>}
          </div>
          <div className="min-w-0">
            <Link to="/providers" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              Providers
            </Link>
            <h1 className="text-2xl font-bold text-white mt-1">{displayName}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {provider.data?.enabled === false
                ? "Disabled"
                : `${provider.data?.accountCount ?? accounts.data?.length ?? 0} account${(provider.data?.accountCount ?? accounts.data?.length ?? 0) !== 1 ? "s" : ""} · ${formatBytes(totalOccupiedSpace)} occupied`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeProviderName === ProviderName.GoogleDrive && (
            <button
              type="button"
              onClick={() => {
                setSettingsSaved(false);
                setSettingsOpen(true);
              }}
              title="Google Drive settings"
              aria-label="Google Drive settings"
              className="w-9 h-9 rounded-lg border border-[var(--border)] text-gray-400 hover:text-white hover:border-indigo-500/50 bg-[var(--muted)] flex items-center justify-center transition-colors"
            >
              <SettingsIcon />
            </button>
          )}
          <Link
            to="/accounts"
            className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Add Account
          </Link>
        </div>
      </div>

      {accounts.isPending ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] overflow-hidden animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-[var(--border)] last:border-0">
              <div className="h-3.5 w-32 bg-white/10 rounded" />
              <div className="h-3 w-24 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      ) : (accounts.data ?? []).length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] p-10 text-center">
          <p className="text-white font-medium">No accounts yet</p>
          <p className="text-sm text-gray-500 mt-1">Add an account to start browsing this provider.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-gray-500 text-xs">
                <th className="px-5 py-3 text-left">Account</th>
                <th className="px-5 py-3 text-left">Credential hint</th>
                <th className="px-5 py-3 text-left">Occupied space</th>
                <th className="px-5 py-3 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {(accounts.data ?? []).map((account) => (
                <tr key={account.accountName} className="border-b border-[var(--border)] last:border-0 hover:bg-white/[0.03]">
                  <td className="px-5 py-3 text-white font-medium">{account.accountName}</td>
                  <td className="px-5 py-3 text-gray-400 font-mono text-xs">{account.credentialHint ?? "-"}</td>
                  <td className="px-5 py-3 text-gray-300 font-mono text-xs">{formatBytes(account.occupiedSpaceBytes)}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{account.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeProviderName === ProviderName.GoogleDrive && settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <form onSubmit={submitSettings} className="w-full max-w-xl rounded-xl border border-[var(--border)] bg-[var(--muted)] p-6 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Google Drive settings</h2>
                <p className="text-xs text-gray-500 mt-1">OAuth credentials are saved in the database. The client secret is encrypted.</p>
              </div>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                aria-label="Close settings"
                className="w-8 h-8 rounded-lg border border-[var(--border)] text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
              >
                <CloseIcon />
              </button>
            </div>

            <div>
              <label className={labelCls}>Client ID</label>
              <input className={inputCls} value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="...apps.googleusercontent.com" />
            </div>

            <div>
              <label className={labelCls}>
                Client Secret {settings.data?.googleDriveOAuth.clientSecretSet && <span className="text-gray-500">(saved)</span>}
              </label>
              <input
                className={inputCls}
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder={settings.data?.googleDriveOAuth.clientSecretSet ? "Leave blank to keep existing secret" : "GOCSPX-..."}
                type="password"
              />
            </div>

            <div>
              <label className={labelCls}>Redirect URI</label>
              <input className={inputCls} value={redirectUri} onChange={(e) => setRedirectUri(e.target.value)} />
            </div>

            <div>
              <label className={labelCls}>UI Base URL</label>
              <input className={inputCls} value={uiBaseUrl} onChange={(e) => setUiBaseUrl(e.target.value)} />
            </div>

            {settingsSaved && (
              <p className="text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                Settings saved.
              </p>
            )}

            {updateSettings.error && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {String(updateSettings.error)}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white rounded-lg border border-[var(--border)] hover:border-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={settings.isPending || updateSettings.isPending}
                className="px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50 transition-colors"
              >
                {updateSettings.isPending ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
