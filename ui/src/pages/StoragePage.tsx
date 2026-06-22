import { FormEvent, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate as useRouterNavigate, useSearchParams } from "react-router-dom";
import { clients, ProviderName } from "../api/client";
import { Icons } from "../components/Icons";
import { Modal } from "../components/Modal";
import { Badge } from "../components/Badge";
import { Field, inputCls, labelCls } from "../components/Field";
import { CopyButton } from "../components/CopyButton";
import { EmptyState } from "../components/EmptyState";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { formatSize, fileToBase64 } from "../utils/format";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROVIDER_META: Record<string, { label: string; icon: string }> = {
  CloudflareR2: { label: "Cloudflare R2", icon: "/cloudflare.svg" },
  GoogleDrive: { label: "Google Drive", icon: "/google-drive.svg" },
};

const PROVIDER_OPTIONS = [
  { value: ProviderName.CloudflareR2, label: "Cloudflare R2" },
  { value: ProviderName.GoogleDrive, label: "Google Drive" },
];

type R2Fields = { accountId: string; accessKeyId: string; secretAccessKey: string; endpoint: string; region: string };
const emptyR2: R2Fields = { accountId: "", accessKeyId: "", secretAccessKey: "", endpoint: "", region: "" };

function buildR2Credentials(r2: R2Fields): Record<string, string> {
  const c: Record<string, string> = { accountId: r2.accountId, accessKeyId: r2.accessKeyId, secretAccessKey: r2.secretAccessKey };
  if (r2.endpoint) c.endpoint = r2.endpoint;
  if (r2.region) c.region = r2.region;
  return c;
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function StoragePage() {
  const qc = useQueryClient();
  const routerNavigate = useRouterNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Navigation
  const [path, setPath] = useState("");
  const [editingPath, setEditingPath] = useState(false);
  const [inputPath, setInputPath] = useState("");

  // File preview
  const [filePath, setFilePath] = useState("");

  // Inline create
  const [newName, setNewName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const createInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  // Add account modal
  const [addOpen, setAddOpen] = useState(false);
  const [addProvider, setAddProvider] = useState<ProviderName>(ProviderName.CloudflareR2);
  const [accountName, setAccountName] = useState("");
  const [r2, setR2] = useState<R2Fields>(emptyR2);

  // Google Drive settings modal
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [redirectUri, setRedirectUri] = useState("");
  const [uiBaseUrl, setUiBaseUrl] = useState("");
  const [settingsSaved, setSettingsSaved] = useState(false);

  // OAuth callback banner
  const [oauthMessage, setOauthMessage] = useState("");

  // --- Derived ---
  const parts = path ? path.split("/") : [];
  const depth = parts.length; // 0=root  1=provider  2=account  3+=browser
  const currentProvider = parts[0] as ProviderName | undefined;
  const isGoogleContext = currentProvider === ProviderName.GoogleDrive;

  // --- Queries (each level uses a different API) ---
  const providers = useQuery({
    queryKey: ["providers"],
    queryFn: () => clients().providers.listProviders(),
    enabled: depth === 0,
  });

  const accounts = useQuery({
    queryKey: ["accounts", currentProvider],
    queryFn: () => clients().providers.listAccounts(currentProvider!),
    enabled: depth === 1 && Boolean(currentProvider),
  });

  const listing = useQuery({
    queryKey: ["files", path],
    queryFn: () => clients().files.list(path),
    enabled: depth >= 2,
  });

  const appSettings = useQuery({
    queryKey: ["settings"],
    queryFn: () => clients().settings.getSettings(),
  });

  const googleOAuthReady =
    Boolean(appSettings.data?.googleDriveOAuth.clientId) &&
    Boolean(appSettings.data?.googleDriveOAuth.clientSecretSet);

  const file = useQuery({
    queryKey: ["file", filePath],
    queryFn: () => clients().files.download(filePath),
    enabled: Boolean(filePath),
  });

  // --- Effects ---
  useEffect(() => {
    const status = searchParams.get("googleDriveOAuth");
    if (!status) return;
    const name = searchParams.get("accountName");
    const message = searchParams.get("message");
    navigate("GoogleDrive");
    setOauthMessage(
      status === "connected"
        ? `Google Drive account${name ? ` "${name}"` : ""} connected.`
        : message || "Google Drive connection failed.",
    );
    qc.invalidateQueries({ queryKey: ["accounts", ProviderName.GoogleDrive] });
    qc.invalidateQueries({ queryKey: ["files"] });
    setSearchParams({});
  }, [qc, searchParams, setSearchParams]);

  useEffect(() => {
    if (!appSettings.data) return;
    setClientId(appSettings.data.googleDriveOAuth.clientId);
    setRedirectUri(appSettings.data.googleDriveOAuth.redirectUri);
    setUiBaseUrl(appSettings.data.googleDriveOAuth.uiBaseUrl);
  }, [appSettings.data]);

  // --- Mutations ---
  const addAccount = useMutation({
    mutationFn: () => clients().accounts.addAccount(addProvider, { accountName, credentials: buildR2Credentials(r2) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["files"] });
      resetAddForm();
    },
  });

  const startOAuth = useMutation({
    mutationFn: () => clients().accounts.startOAuth(ProviderName.GoogleDrive, accountName, `${window.location.origin}/storage`),
    onSuccess: (res) => { window.location.href = res.authUrl; },
  });

  const removeAccount = useMutation({
    mutationFn: ({ provider, account }: { provider: ProviderName; account: string }) =>
      clients().accounts.removeAccount(provider, account),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["files"] });
    },
  });

  const updateSettings = useMutation({
    mutationFn: () => clients().settings.updateSettings({ googleDriveOAuth: { clientId, clientSecret, redirectUri, uiBaseUrl } }),
    onSuccess: () => { setSettingsSaved(true); setClientSecret(""); qc.invalidateQueries({ queryKey: ["settings"] }); },
  });

  const createFolder = useMutation({
    mutationFn: () =>
      depth === 2
        ? clients().files.createBucket(path, newName)
        : clients().files.createFolder(path, newName),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["files", path] }); setNewName(""); setShowCreate(false); },
  });

  const upload = useMutation({
    mutationFn: async (f: File) => {
      const contentBase64 = await fileToBase64(f);
      return clients().files.uploadFile({ absolutePath: `${path}/${f.name}`, contentBase64, contentType: f.type || undefined });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["files", path] }); if (uploadInputRef.current) uploadInputRef.current.value = ""; },
  });

  const syncMut = useMutation({
    mutationFn: () => clients().sync.sync(path),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sync-runs"] }); qc.invalidateQueries({ queryKey: ["files"] }); },
  });

  // --- Handlers ---
  function navigate(to: string) {
    setPath(to);
    setFilePath("");
    setShowCreate(false);
    setEditingPath(false);
  }

  function goUp() {
    if (depth > 0) navigate(parts.slice(0, -1).join("/"));
  }

  function resetAddForm() {
    setAddOpen(false);
    setAccountName("");
    setR2(emptyR2);
  }

  function submitAccount(e: FormEvent) {
    e.preventDefault();
    if (addProvider === ProviderName.GoogleDrive) { startOAuth.mutate(); return; }
    addAccount.mutate();
  }

  function submitSettings(e: FormEvent) {
    e.preventDefault();
    setSettingsSaved(false);
    updateSettings.mutate();
  }

  function startCreate() {
    setShowCreate(true);
    setTimeout(() => createInputRef.current?.focus(), 0);
  }

  // Determine loading / error / data based on current depth
  const isLoading = depth === 0 ? providers.isPending : depth === 1 ? accounts.isPending : listing.isPending;
  const queryError = depth === 0 ? providers.error : depth === 1 ? accounts.error : listing.error;
  const fileItems = listing.data?.items ?? [];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex flex-col h-full">
      {/* ── Breadcrumb bar ── */}
      <div className="px-6 py-3 border-b border-[var(--border)] bg-[var(--muted)] flex items-center gap-1 min-h-[48px]">
        <button onClick={() => navigate("")} className="p-1 rounded text-gray-400 hover:text-white transition-colors" title="Root">
          {Icons.home}
        </button>

        {parts.map((segment, i) => {
          const segPath = parts.slice(0, i + 1).join("/");
          const meta = i === 0 ? PROVIDER_META[segment] : undefined;
          const isLast = i === parts.length - 1;
          return (
            <span key={segPath} className="flex items-center gap-1">
              {Icons.chevronRight}
              {meta?.icon && <img src={meta.icon} className="w-4 h-4" alt="" />}
              {isLast ? (
                <span className="text-sm font-medium text-white">{meta?.label ?? segment}</span>
              ) : (
                <button onClick={() => navigate(segPath)} className="text-sm text-gray-400 hover:text-white transition-colors">
                  {meta?.label ?? segment}
                </button>
              )}
            </span>
          );
        })}

        {editingPath ? (
          <form
            className="flex-1 ml-2"
            onSubmit={(e) => { e.preventDefault(); navigate(inputPath); }}
          >
            <input
              autoFocus
              value={inputPath}
              onChange={(e) => setInputPath(e.target.value)}
              onBlur={() => setEditingPath(false)}
              onKeyDown={(e) => { if (e.key === "Escape") setEditingPath(false); }}
              className="w-full bg-black/30 border border-indigo-500 rounded px-2 py-1 text-sm text-white font-mono focus:outline-none"
              placeholder="Enter path..."
            />
          </form>
        ) : (
          <button
            onClick={() => { setInputPath(path); setEditingPath(true); }}
            className="ml-auto p-1.5 rounded text-gray-600 hover:text-gray-300 transition-colors"
            title="Edit path"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        )}

        {path && <CopyButton text={path} className="p-1.5 text-gray-600 hover:text-gray-300 transition-colors" />}
      </div>

      {/* ── Toolbar ── */}
      <div className="px-6 py-2.5 border-b border-[var(--border)] flex items-center gap-2 flex-wrap">
        {depth > 0 && (
          <button onClick={goUp} className="p-1.5 text-gray-400 hover:text-white rounded transition-colors" title="Go up">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
        )}

        {depth <= 1 && (
          <button onClick={() => { if (currentProvider) setAddProvider(currentProvider); setAddOpen(true); }}
            className="flex items-center gap-1.5 text-sm text-gray-300 hover:text-white bg-indigo-600/80 hover:bg-indigo-600 px-3 py-1.5 rounded-lg transition-colors">
            {Icons.plus} Add Account
          </button>
        )}

        {isGoogleContext && (
          <button onClick={() => { setSettingsSaved(false); setSettingsOpen(true); }}
            title="Google Drive settings"
            className="p-1.5 text-gray-400 hover:text-white rounded transition-colors">
            {Icons.settings}
          </button>
        )}

        {depth >= 2 && (
          <>
            <button onClick={startCreate}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white border border-[var(--border)] hover:border-indigo-500/50 px-3 py-1.5 rounded-lg transition-colors">
              {Icons.plus} {depth === 2 ? "New Bucket" : "New Folder"}
            </button>
            {showCreate && (
              <form onSubmit={(e) => { e.preventDefault(); if (newName.trim()) createFolder.mutate(); }} className="flex items-center gap-2">
                <input ref={createInputRef} value={newName} onChange={(e) => setNewName(e.target.value)}
                  placeholder={depth === 2 ? "Bucket name" : "Folder name"}
                  className="bg-black/30 border border-[var(--border)] focus:border-indigo-500 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none w-44"
                  onKeyDown={(e) => { if (e.key === "Escape") { setShowCreate(false); setNewName(""); } }}
                />
                <button type="submit" disabled={createFolder.isPending || !newName.trim()}
                  className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors">
                  {createFolder.isPending ? "..." : "Create"}
                </button>
              </form>
            )}
          </>
        )}

        {depth >= 3 && (
          <>
            <input ref={uploadInputRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload.mutate(f); }} />
            <button onClick={() => uploadInputRef.current?.click()} disabled={upload.isPending}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white border border-[var(--border)] hover:border-indigo-500/50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
              {Icons.upload} {upload.isPending ? "Uploading..." : "Upload"}
            </button>
          </>
        )}

        {depth >= 1 && (
          <button onClick={() => syncMut.mutate()} disabled={syncMut.isPending}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white border border-[var(--border)] hover:border-indigo-500/50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
            {Icons.sync(syncMut.isPending ? "animate-spin" : "")} {syncMut.isPending ? "Syncing..." : "Sync"}
          </button>
        )}

        <div className="flex items-center gap-2 ml-auto">
          {upload.isSuccess && <Badge color="green">Uploaded</Badge>}
          {upload.error && <Badge color="red">{String(upload.error)}</Badge>}
          {syncMut.isSuccess && <Badge color="green">Synced</Badge>}
          {syncMut.error && <Badge color="red">{String(syncMut.error)}</Badge>}
          {createFolder.error && <Badge color="red">{String(createFolder.error)}</Badge>}
        </div>
      </div>

      {/* ── OAuth callback banner ── */}
      {oauthMessage && (
        <div className="px-6 py-3 border-b border-[var(--border)] bg-emerald-500/5 flex items-center justify-between">
          <p className="text-sm text-emerald-300">{oauthMessage}</p>
          <button onClick={() => setOauthMessage("")} className="text-gray-500 hover:text-white">{Icons.close}</button>
        </div>
      )}

      {/* ── Content area ── */}
      <div className="flex-1 overflow-auto p-6">
        {queryError && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400 mb-4">
            {String(queryError)}
          </div>
        )}

        {isLoading ? (
          <LoadingSkeleton type={depth <= 1 ? "cards" : "table"} />
        ) : depth === 0 ? (
          (providers.data ?? []).length === 0 ? (
            <EmptyState depth={0} onAddAccount={() => setAddOpen(true)} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(providers.data ?? []).map((p) => {
                const meta = PROVIDER_META[p.providerName];
                return (
                  <div
                    key={p.providerName}
                    onClick={() => navigate(p.providerName)}
                    className="group rounded-xl border border-[var(--border)] bg-[var(--muted)] p-5 cursor-pointer hover:border-indigo-500/40 transition-all hover:bg-white/[0.02]"
                  >
                    <div className="flex items-start gap-3">
                      {meta?.icon ? (
                        <img src={meta.icon} className="w-9 h-9 mt-0.5" alt="" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                          <span className="text-xs font-bold">{p.displayName.slice(0, 2).toUpperCase()}</span>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white">{meta?.label ?? p.displayName}</p>
                        {p.enabled ? (
                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                            {p.accountCount} account{p.accountCount !== 1 ? "s" : ""}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-600 mt-1">Disabled</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : depth === 1 ? (
          (accounts.data ?? []).length === 0 ? (
            <EmptyState depth={1} onAddAccount={() => setAddOpen(true)} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(accounts.data ?? []).map((acct) => (
                <div
                  key={acct.accountName}
                  onClick={() => navigate(`${currentProvider}/${acct.accountName}`)}
                  className="group rounded-xl border border-[var(--border)] bg-[var(--muted)] p-5 cursor-pointer hover:border-indigo-500/40 transition-all hover:bg-white/[0.02] relative"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                      <span className="text-xs font-bold">{acct.accountName.slice(0, 2).toUpperCase()}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">{acct.accountName}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {acct.credentialHint ? <span className="font-mono">{acct.credentialHint}</span> : "No credential hint"}
                        {acct.occupiedSpaceBytes > 0 && <span> · {formatSize(acct.occupiedSpaceBytes)}</span>}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeAccount.mutate({ provider: currentProvider!, account: acct.accountName }); }}
                    disabled={removeAccount.isPending}
                    className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                    title="Remove account"
                  >
                    {Icons.trash}
                  </button>
                </div>
              ))}
            </div>
          )
        ) : (
          fileItems.length === 0 ? (
            <EmptyState depth={depth} onAddAccount={() => setAddOpen(true)} />
          ) : (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-gray-500 text-xs">
                    <th className="px-5 py-3 text-left">Name</th>
                    <th className="px-5 py-3 text-left">Type</th>
                    <th className="px-5 py-3 text-left">Size</th>
                    <th className="px-5 py-3 text-left">Path</th>
                  </tr>
                </thead>
                <tbody>
                  {fileItems.map((item) => (
                    <tr key={item.absolutePath} className="border-b border-[var(--border)] last:border-0 hover:bg-white/[0.03] group">
                      <td className="px-5 py-3">
                        <button
                          onClick={() => item.type === "file" ? routerNavigate(`/view/${item.absolutePath}`) : navigate(item.absolutePath)}
                          className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          <span className="shrink-0 text-gray-500">{item.type === "file" ? Icons.file : Icons.folder}</span>
                          {item.name}
                        </button>
                      </td>
                      <td className="px-5 py-3 text-gray-500 capitalize">{item.type}</td>
                      <td className="px-5 py-3 text-gray-400 tabular-nums">{formatSize(item.sizeBytes)}</td>
                      <td className="px-5 py-3 max-w-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-600 font-mono text-xs truncate">{item.absolutePath}</span>
                          <CopyButton text={item.absolutePath} className="shrink-0 text-gray-700 hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {file.data && (
          <div className="mt-6">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Downloaded File</h2>
            <pre className="bg-black/40 border border-[var(--border)] rounded-xl text-gray-300 text-xs p-5 overflow-auto max-h-80">
              {JSON.stringify(file.data.file, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* ── Add Account modal ── */}
      {addOpen && (
        <Modal onClose={resetAddForm}>
          <form onSubmit={submitAccount} className="space-y-5">
            <h2 className="text-lg font-semibold text-white">Add Account</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Provider</label>
                <select value={addProvider} onChange={(e) => setAddProvider(e.target.value as ProviderName)} className={inputCls}>
                  {PROVIDER_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <Field label="Account name" value={accountName} onChange={setAccountName} placeholder="my-account" required />
            </div>

            {addProvider === ProviderName.CloudflareR2 && (
              <div className="space-y-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Cloudflare R2 credentials</p>
                <Field label="Account ID" value={r2.accountId} onChange={(v) => setR2({ ...r2, accountId: v })} placeholder="abc123..." required />
                <Field label="Access Key ID" value={r2.accessKeyId} onChange={(v) => setR2({ ...r2, accessKeyId: v })} placeholder="R2 access key ID" required />
                <Field label="Secret Access Key" value={r2.secretAccessKey} onChange={(v) => setR2({ ...r2, secretAccessKey: v })} placeholder="R2 secret access key" required type="password" />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Endpoint (optional)" value={r2.endpoint} onChange={(v) => setR2({ ...r2, endpoint: v })} placeholder="https://example.r2.cloudflarestorage.com" />
                  <Field label="Region (optional)" value={r2.region} onChange={(v) => setR2({ ...r2, region: v })} placeholder="auto" />
                </div>
              </div>
            )}

            {addProvider === ProviderName.GoogleDrive && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Google Drive OAuth</p>
                <p className="text-sm text-gray-400">Connect with Google to grant Drive access. Tokens are encrypted after redirect.</p>
                {!googleOAuthReady && (
                  <p className="text-amber-300 text-sm bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                    Configure Google Drive OAuth settings first.
                  </p>
                )}
              </div>
            )}

            {(addAccount.error || startOAuth.error) && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {String(addAccount.error ?? startOAuth.error)}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={resetAddForm} className="px-4 py-2 text-sm text-gray-300 hover:text-white rounded-lg border border-[var(--border)] hover:border-gray-500 transition-colors">
                Cancel
              </button>
              <button type="submit"
                disabled={addAccount.isPending || startOAuth.isPending || (addProvider === ProviderName.GoogleDrive && !googleOAuthReady)}
                className="px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50 transition-colors">
                {addProvider === ProviderName.GoogleDrive
                  ? startOAuth.isPending ? "Opening Google..." : googleOAuthReady ? "Connect Google Drive" : "Settings Required"
                  : addAccount.isPending ? "Adding..." : "Add Account"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Google Drive settings modal ── */}
      {settingsOpen && (
        <Modal onClose={() => setSettingsOpen(false)}>
          <form onSubmit={submitSettings} className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-white">Google Drive Settings</h2>
              <p className="text-xs text-gray-500 mt-1">OAuth credentials are saved encrypted in the database.</p>
            </div>
            <Field label="Client ID" value={clientId} onChange={setClientId} placeholder="...apps.googleusercontent.com" />
            <Field
              label={`Client Secret ${appSettings.data?.googleDriveOAuth.clientSecretSet ? "(saved)" : ""}`}
              value={clientSecret} onChange={setClientSecret}
              placeholder={appSettings.data?.googleDriveOAuth.clientSecretSet ? "Leave blank to keep existing" : "GOCSPX-..."}
              type="password"
            />
            <Field label="Redirect URI" value={redirectUri} onChange={setRedirectUri} />
            <Field label="UI Base URL" value={uiBaseUrl} onChange={setUiBaseUrl} />
            {settingsSaved && <p className="text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">Settings saved.</p>}
            {updateSettings.error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{String(updateSettings.error)}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setSettingsOpen(false)} className="px-4 py-2 text-sm text-gray-300 hover:text-white rounded-lg border border-[var(--border)] hover:border-gray-500 transition-colors">Cancel</button>
              <button type="submit" disabled={appSettings.isPending || updateSettings.isPending}
                className="px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50 transition-colors">
                {updateSettings.isPending ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
