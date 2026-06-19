import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { clients, ProviderName } from "../api/client";

const PROVIDERS = [
  { value: ProviderName.CloudflareR2, label: "Cloudflare R2" },
  { value: ProviderName.GoogleDrive, label: "Google Drive" },
];

type R2Fields = { accountId: string; accessKeyId: string; secretAccessKey: string; endpoint: string; region: string };

const emptyR2: R2Fields = { accountId: "", accessKeyId: "", secretAccessKey: "", endpoint: "", region: "" };

function buildR2Credentials(r2: R2Fields): Record<string, unknown> {
  const creds: Record<string, string> = {
    accountId: r2.accountId,
    accessKeyId: r2.accessKeyId,
    secretAccessKey: r2.secretAccessKey,
  };
  if (r2.endpoint) creds.endpoint = r2.endpoint;
  if (r2.region) creds.region = r2.region;
  return creds;
}

const inputCls = "w-full bg-black/30 border border-[var(--border)] focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none transition-colors placeholder:text-gray-600";
const labelCls = "block text-xs text-gray-400 mb-1.5";

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
}

function Field({ label, value, onChange, placeholder, required, type = "text" }: FieldProps) {
  return (
    <div>
      <label className={labelCls}>{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
      <input
        required={required}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputCls}
      />
    </div>
  );
}

export function ProviderAccountsPage() {
  const [providerName, setProviderName] = useState<ProviderName>(ProviderName.CloudflareR2);
  const [accountName, setAccountName] = useState("");
  const [r2, setR2] = useState<R2Fields>(emptyR2);
  const [showForm, setShowForm] = useState(false);
  const [oauthMessage, setOauthMessage] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const qc = useQueryClient();

  useEffect(() => {
    const status = searchParams.get("googleDriveOAuth");
    if (!status) return;

    const name = searchParams.get("accountName");
    const message = searchParams.get("message");
    setProviderName(ProviderName.GoogleDrive);
    setOauthMessage(
      status === "connected"
        ? `Google Drive account${name ? ` "${name}"` : ""} connected.`
        : message || "Google Drive connection failed.",
    );
    qc.invalidateQueries({ queryKey: ["accounts", ProviderName.GoogleDrive] });
    qc.invalidateQueries({ queryKey: ["providers"] });
    setSearchParams({});
  }, [qc, searchParams, setSearchParams]);

  const accounts = useQuery({
    queryKey: ["accounts", providerName],
    queryFn: () => clients().providers.listAccounts(providerName),
  });
  const settings = useQuery({
    queryKey: ["settings"],
    queryFn: () => clients().settings.getSettings(),
  });
  const googleOAuthReady =
    Boolean(settings.data?.googleDriveOAuth.clientId) &&
    Boolean(settings.data?.googleDriveOAuth.clientSecretSet);

  const add = useMutation({
    mutationFn: () => {
      const credentials = buildR2Credentials(r2);
      return clients().accounts.addAccount(providerName, { accountName, credentials });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts", providerName] });
      qc.invalidateQueries({ queryKey: ["providers"] });
      setAccountName("");
      setR2(emptyR2);
      setShowForm(false);
    },
  });

  const startOAuth = useMutation({
    mutationFn: () =>
      clients().accounts.startOAuth(
        ProviderName.GoogleDrive,
        accountName,
        `${window.location.origin}/accounts`,
      ),
    onSuccess: (result) => {
      window.location.href = result.authUrl;
    },
  });

  const remove = useMutation({
    mutationFn: (name: string) => clients().accounts.removeAccount(providerName, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts", providerName] });
      qc.invalidateQueries({ queryKey: ["providers"] });
    },
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    if (providerName === ProviderName.GoogleDrive) {
      startOAuth.mutate();
      return;
    }
    add.mutate();
  }

  return (
    <div className="p-8 flex flex-col gap-6 min-h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Accounts</h1>
          <p className="text-sm text-gray-500 mt-1">Manage provider credentials</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          {showForm ? "Cancel" : "+ Add Account"}
        </button>
      </div>

      {oauthMessage && (
        <p className="rounded-lg border border-[var(--border)] bg-[var(--muted)] px-4 py-3 text-sm text-gray-300">
          {oauthMessage}
        </p>
      )}

      {showForm && (
        <form onSubmit={submit} className="rounded-xl border border-[var(--border)] bg-[var(--muted)] p-6 space-y-5">
          <h2 className="text-sm font-semibold text-white">Add Account</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Provider</label>
              <select
                value={providerName}
                onChange={(e) => setProviderName(e.target.value as ProviderName)}
                className={inputCls}
              >
                {PROVIDERS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <Field
              label="Account name"
              value={accountName}
              onChange={setAccountName}
              placeholder="my-account"
              required
            />
          </div>

          {providerName === ProviderName.CloudflareR2 && (
            <div className="space-y-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Cloudflare R2 credentials</p>
              <div className="grid grid-cols-1 gap-4">
                <Field label="Account ID" value={r2.accountId} onChange={(v) => setR2({ ...r2, accountId: v })} placeholder="abc123..." required />
                <Field label="Access Key ID" value={r2.accessKeyId} onChange={(v) => setR2({ ...r2, accessKeyId: v })} placeholder="R2 access key ID" required />
                <Field label="Secret Access Key" value={r2.secretAccessKey} onChange={(v) => setR2({ ...r2, secretAccessKey: v })} placeholder="R2 secret access key" required type="password" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Endpoint (optional)" value={r2.endpoint} onChange={(v) => setR2({ ...r2, endpoint: v })} placeholder="https://example.r2.cloudflarestorage.com" />
                <Field label="Region (optional)" value={r2.region} onChange={(v) => setR2({ ...r2, region: v })} placeholder="auto" />
              </div>
            </div>
          )}

          {providerName === ProviderName.GoogleDrive && (
            <div className="space-y-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Google Drive OAuth</p>
              <p className="text-sm text-gray-400">
                Connect with Google to grant Drive access. Tokens will be saved encrypted after Google redirects back.
              </p>
              {!googleOAuthReady && (
                <p className="text-amber-300 text-sm bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                  Save Google Drive OAuth client ID and client secret from the Google Drive provider page first.
                </p>
              )}
            </div>
          )}

          {(add.error || startOAuth.error) && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {String(add.error ?? startOAuth.error)}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={add.isPending || startOAuth.isPending || (providerName === ProviderName.GoogleDrive && !googleOAuthReady)}
              className="px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50 transition-colors"
            >
              {providerName === ProviderName.GoogleDrive
                ? startOAuth.isPending ? "Opening Google..." : googleOAuthReady ? "Connect Google Drive" : "Settings Required"
                : add.isPending ? "Adding..." : "Add Account"}
            </button>
          </div>
        </form>
      )}

      <div className="flex gap-0.5 border-b border-[var(--border)]">
        {PROVIDERS.map((p) => (
          <button
            key={p.value}
            onClick={() => setProviderName(p.value)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              providerName === p.value
                ? "border-indigo-500 text-white"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {accounts.isPending ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] overflow-hidden animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-[var(--border)] last:border-0">
              <div className="h-3.5 w-32 bg-white/10 rounded" />
              <div className="h-3 w-24 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      ) : (accounts.data ?? []).length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] p-10 text-center">
          <p className="text-sm text-gray-500">No accounts for this provider yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-gray-500 text-xs">
                <th className="px-5 py-3 text-left">Name</th>
                <th className="px-5 py-3 text-left">Credential hint</th>
                <th className="px-5 py-3 text-left">Created</th>
                <th className="px-5 py-3 text-left"></th>
              </tr>
            </thead>
            <tbody>
              {(accounts.data ?? []).map((account) => (
                <tr key={account.accountName} className="border-b border-[var(--border)] last:border-0 hover:bg-white/[0.03]">
                  <td className="px-5 py-3 text-white font-medium">{account.accountName}</td>
                  <td className="px-5 py-3 text-gray-400 font-mono text-xs">{account.credentialHint ?? "-"}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{account.createdAt}</td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => remove.mutate(account.accountName)}
                      disabled={remove.isPending}
                      className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg border border-red-500/30 hover:border-red-400/50 transition-colors"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
