import { useState } from "react";
import { API_BASE_URL, getStoredToken } from "../api/client";
import { CopyButton } from "../components/CopyButton";

const API_BASE = API_BASE_URL;

interface FieldDef {
  key: string;
  label: string;
  placeholder: string;
  required?: boolean;
  type?: "text" | "number" | "file" | "password";
}

interface UseCaseDef {
  id: string;
  title: string;
  description: string;
  method: string;
  endpoint: string;
  fields: FieldDef[];
  buildBody: (values: Record<string, string>) => object | null;
  notes?: string[];
}

const USE_CASES: UseCaseDef[] = [
  {
    id: "list-files",
    title: "List files & folders",
    description: "List all files and folders at a given path.",
    method: "POST",
    endpoint: "/files/list",
    fields: [
      { key: "path", label: "Path", placeholder: "CloudflareR2/account/bucket/folder", required: true },
    ],
    buildBody: (v) => ({ path: v.path }),
    notes: [
      "Path format: <Provider>/<account>/<bucket>[/<folder>...]",
      "Token must have read permission for the path.",
    ],
  },
  {
    id: "list-all-files",
    title: "List all nested files",
    description: "Get every file at all depth levels under a folder (flat list, files only, from synced DB).",
    method: "POST",
    endpoint: "/files/all",
    fields: [
      { key: "path", label: "Path", placeholder: "CloudflareR2/account/bucket", required: true },
    ],
    buildBody: (v) => ({ path: v.path }),
    notes: [
      "Returns ALL files recursively — no depth limit.",
      "Data is from the local database — sync first to populate.",
    ],
  },
  {
    id: "download-file",
    title: "Download file",
    description: "Download a file's metadata and bytes as base64.",
    method: "POST",
    endpoint: "/files/download",
    fields: [
      { key: "absolutePath", label: "Absolute Path", placeholder: "CloudflareR2/account/bucket/file.jpg", required: true },
    ],
    buildBody: (v) => ({ absolutePath: v.absolutePath }),
    notes: ["Returns file bytes in contentBase64."],
  },
  {
    id: "upload-file",
    title: "Upload file",
    description: "Upload a file to a specific location by providing its absolute path and content.",
    method: "POST",
    endpoint: "/files/upload",
    fields: [
      { key: "absolutePath", label: "Absolute Path", placeholder: "CloudflareR2/account/bucket/file.jpg", required: true },
      { key: "file", label: "File", placeholder: "Choose file", type: "file" },
      { key: "contentType", label: "Content Type (optional)", placeholder: "image/jpeg" },
    ],
    buildBody: (v) => ({
      absolutePath: v.absolutePath,
      contentBase64: v._fileBase64 || "",
      contentType: v.contentType || undefined,
    }),
    notes: [
      "contentType is optional — omit to let the provider infer it.",
      "Returns 204 No Content on success.",
    ],
  },
  {
    id: "temp-download-url",
    title: "Temporary download URL",
    description: "Create a short-lived presigned download URL.",
    method: "POST",
    endpoint: "/files/temp-download-url",
    fields: [
      { key: "absolutePath", label: "Absolute Path", placeholder: "CloudflareR2/account/bucket/file.jpg", required: true },
      { key: "expiresInSeconds", label: "Expires In (seconds)", placeholder: "900", type: "number" },
    ],
    buildBody: (v) => ({
      absolutePath: v.absolutePath,
      ...(v.expiresInSeconds ? { expiresInSeconds: Number(v.expiresInSeconds) } : {}),
    }),
    notes: [
      "CloudflareR2 returns presigned object URLs.",
      "GoogleDrive returns a Drive media URL with a short-lived OAuth token.",
    ],
  },
  {
    id: "temp-upload-url",
    title: "Temporary upload URL",
    description: "Create a short-lived presigned upload URL.",
    method: "POST",
    endpoint: "/files/temp-upload-url",
    fields: [
      { key: "absolutePath", label: "Absolute Path", placeholder: "CloudflareR2/account/bucket/file.jpg", required: true },
      { key: "contentType", label: "Content Type", placeholder: "image/jpeg" },
      { key: "expiresInSeconds", label: "Expires In (seconds)", placeholder: "900", type: "number" },
    ],
    buildBody: (v) => ({
      absolutePath: v.absolutePath,
      ...(v.contentType ? { contentType: v.contentType } : {}),
      ...(v.expiresInSeconds ? { expiresInSeconds: Number(v.expiresInSeconds) } : {}),
    }),
    notes: [
      "Send the returned headers with the PUT request.",
      "Run sync after a direct upload to refresh local metadata.",
    ],
  },
  {
    id: "get-accessible-directories",
    title: "Get accessible directories",
    description: "Returns paths the current token can access. Admin tokens return isAdmin: true.",
    method: "GET",
    endpoint: "/access/directories",
    fields: [],
    buildBody: () => null,
    notes: [
      "No request body — identity derived from the Bearer token.",
      "Admin tokens return { isAdmin: true, directories: [] }.",
    ],
  },
  {
    id: "create-folder",
    title: "Create folder",
    description: "Create a new folder in a directory.",
    method: "POST",
    endpoint: "/files/folder",
    fields: [
      { key: "parentPath", label: "Parent Path", placeholder: "CloudflareR2/account/bucket", required: true },
      { key: "folderName", label: "Folder Name", placeholder: "new-folder", required: true },
    ],
    buildBody: (v) => ({ parentPath: v.parentPath, folderName: v.folderName }),
  },
  {
    id: "create-bucket",
    title: "Create bucket",
    description: "Create a new bucket under an account.",
    method: "POST",
    endpoint: "/files/bucket",
    fields: [
      { key: "accountPath", label: "Account Path", placeholder: "CloudflareR2/account", required: true },
      { key: "bucketName", label: "Bucket Name", placeholder: "my-bucket", required: true },
    ],
    buildBody: (v) => ({ accountPath: v.accountPath, bucketName: v.bucketName }),
  },
  {
    id: "sync",
    title: "Run sync",
    description: "Manually sync a path to populate the local database with remote metadata.",
    method: "POST",
    endpoint: "/sync",
    fields: [
      { key: "absolutePath", label: "Absolute Path", placeholder: "CloudflareR2/account/bucket", required: true },
    ],
    buildBody: (v) => ({ absolutePath: v.absolutePath }),
    notes: ["Sync is manual only — runs immediately and returns when complete."],
  },
  {
    id: "list-sync-runs",
    title: "List sync runs",
    description: "List all past sync run records.",
    method: "GET",
    endpoint: "/sync/runs",
    fields: [],
    buildBody: () => null,
  },
  {
    id: "check-token",
    title: "Check token validity",
    description: "Verify if an access token is valid.",
    method: "POST",
    endpoint: "/auth/check-token",
    fields: [
      { key: "accessToken", label: "Access Token", placeholder: "paste token here", required: true, type: "password" },
    ],
    buildBody: (v) => ({ accessToken: v.accessToken }),
    notes: ["Returns { valid: true } or { valid: false }."],
  },
];

function methodColor(method: string) {
  if (method === "POST") return "bg-blue-500/20 text-blue-400 border-blue-500/30";
  if (method === "GET") return "bg-green-500/20 text-green-400 border-green-500/30";
  if (method === "PUT") return "bg-amber-500/20 text-amber-400 border-amber-500/30";
  if (method === "DELETE") return "bg-red-500/20 text-red-400 border-red-500/30";
  return "bg-gray-500/20 text-gray-400 border-gray-500/30";
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve((r.result as string).split(",")[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function toMarkdown(uc: UseCaseDef): string {
  const lines: string[] = [];
  lines.push(`# ${uc.title}`);
  lines.push("", uc.description, "");
  lines.push(`## Endpoint`, "", `\`\`\`\n${uc.method} ${API_BASE}${uc.endpoint}\n\`\`\``, "");
  lines.push(`**Authorization:** \`Bearer <token>\``, "");
  if (uc.fields.length > 0) {
    const sample: Record<string, string> = {};
    for (const f of uc.fields) if (f.type !== "file") sample[f.key] = f.placeholder;
    lines.push(`## Request Body`, "", "```json", JSON.stringify(sample, null, 2), "```", "");
  }
  lines.push(`## Example (curl)`, "", "```bash", buildCurl(uc, {}), "```", "");
  if (uc.notes?.length) {
    lines.push(`## Notes`, "");
    uc.notes.forEach((n) => lines.push(`- ${n}`));
    lines.push("");
  }
  return lines.join("\n");
}

function downloadMd(uc: UseCaseDef) {
  const blob = new Blob([toMarkdown(uc)], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${uc.id}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadAllMd() {
  const md = USE_CASES.map((uc) => toMarkdown(uc)).join("\n---\n\n");
  const blob = new Blob([md], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "7Router-usecases.md";
  a.click();
  URL.revokeObjectURL(url);
}

function buildCurl(uc: UseCaseDef, values: Record<string, string>): string {
  const lines = [`curl -X ${uc.method} "${API_BASE}${uc.endpoint}" \\`, `  -H "Authorization: Bearer <token>"`];
  const body = uc.buildBody(values);
  if (body) {
    lines[lines.length - 1] += " \\";
    lines.push(`  -H "Content-Type: application/json" \\`);
    lines.push(`  -d '${JSON.stringify(body, null, 2).split("\n").join("\n  ")}'`);
  }
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Interactive test panel for a single use case
// ---------------------------------------------------------------------------

function UseCasePanel({ uc }: { uc: UseCaseDef }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [response, setResponse] = useState<{ status: number; body: string; time: number } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokenOverride, setTokenOverride] = useState("");

  const token = tokenOverride || getStoredToken();

  function set(key: string, val: string) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await fileToBase64(file);
    setValues((prev) => ({ ...prev, _fileBase64: b64, _fileName: file.name }));
    if (!values.contentType && file.type) set("contentType", file.type);
    if (!values.absolutePath) {
      const parts = values.absolutePath?.split("/") ?? [];
      if (parts.length >= 3) set("absolutePath", parts.slice(0, -1).join("/") + "/" + file.name);
    }
  }

  async function send() {
    setLoading(true);
    setResponse(null);
    setError("");

    const body = uc.buildBody(values);
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (body) headers["Content-Type"] = "application/json";

    const t0 = performance.now();
    try {
      const res = await fetch(`${API_BASE}${uc.endpoint}`, {
        method: uc.method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      const elapsed = Math.round(performance.now() - t0);
      const text = await res.text();
      let formatted = text;
      try { formatted = JSON.stringify(JSON.parse(text), null, 2); } catch { /* not JSON */ }
      setResponse({ status: res.status, body: formatted || "(empty)", time: elapsed });
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  const hasRequired = uc.fields.filter((f) => f.required).every((f) => values[f.key]?.trim());
  const curl = buildCurl(uc, values);

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className={`text-xs font-bold px-2 py-0.5 rounded border ${methodColor(uc.method)}`}>{uc.method}</span>
          <code className="text-sm text-indigo-300 font-mono">{uc.endpoint}</code>
          <button
            onClick={() => downloadMd(uc)}
            className="ml-auto flex items-center gap-1.5 shrink-0 text-xs text-gray-500 hover:text-white border border-[var(--border)] hover:border-indigo-500/50 px-2.5 py-1 rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            .md
          </button>
        </div>
        <p className="text-sm text-gray-400 mt-2">{uc.description}</p>
      </div>

      {/* Token override */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">Bearer Token <span className="text-gray-700">(leave blank to use session token)</span></label>
        <input
          type="password"
          value={tokenOverride}
          onChange={(e) => setTokenOverride(e.target.value)}
          placeholder={token ? `${token.slice(0, 8)}...` : "no session token"}
          className="w-full bg-black/30 border border-[var(--border)] focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none transition-colors placeholder:text-gray-600 font-mono"
        />
      </div>

      {/* Fields */}
      {uc.fields.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Parameters</p>
          {uc.fields.map((field) => (
            <div key={field.key}>
              <label className="block text-xs text-gray-400 mb-1">
                {field.label}
                {field.required && <span className="text-red-400 ml-0.5">*</span>}
              </label>
              {field.type === "file" ? (
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="text-sm text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-[var(--border)] file:text-xs file:text-gray-300 file:bg-black/30 file:cursor-pointer hover:file:border-indigo-500/50 file:transition-colors"
                  />
                  {values._fileName && <span className="text-xs text-gray-500">{values._fileName}</span>}
                </div>
              ) : (
                <input
                  type={field.type === "number" ? "number" : "text"}
                  value={values[field.key] ?? ""}
                  onChange={(e) => set(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full bg-black/30 border border-[var(--border)] focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none transition-colors placeholder:text-gray-600 font-mono"
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Send */}
      <div className="flex items-center gap-3">
        <button
          onClick={send}
          disabled={loading || !hasRequired}
          className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Sending...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Send Request
            </>
          )}
        </button>

        {response && (
          <span className={`text-xs font-mono px-2 py-1 rounded border ${
            response.status < 300 ? "text-green-400 bg-green-500/10 border-green-500/20"
            : response.status < 500 ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
            : "text-red-400 bg-red-500/10 border-red-500/20"
          }`}>
            {response.status} · {response.time}ms
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Response */}
      {response && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Response</p>
            <CopyButton text={response.body} className="p-1 text-gray-600 hover:text-gray-300 transition-colors" />
          </div>
          <pre className="bg-black/40 border border-[var(--border)] rounded-xl text-xs text-gray-300 p-4 overflow-auto max-h-96 font-mono whitespace-pre">
            {response.body}
          </pre>
        </div>
      )}

      {/* Curl */}
      <details className="group">
        <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-400 transition-colors select-none">
          <span className="group-open:hidden">Show curl command</span>
          <span className="hidden group-open:inline">Hide curl command</span>
        </summary>
        <div className="mt-2 relative">
          <CopyButton text={curl} className="absolute top-2 right-2 p-1.5 text-gray-600 hover:text-gray-300 transition-colors" />
          <pre className="bg-black/40 border border-[var(--border)] rounded-lg text-xs text-gray-400 p-4 overflow-x-auto font-mono whitespace-pre">
            {curl}
          </pre>
        </div>
      </details>

      {/* Notes */}
      {uc.notes && uc.notes.length > 0 && (
        <div className="border-t border-[var(--border)] pt-4">
          <ul className="space-y-1">
            {uc.notes.map((note, i) => (
              <li key={i} className="text-xs text-gray-600 flex gap-2">
                <span className="text-gray-700 shrink-0">•</span>
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function UseCasePage() {
  const [selected, setSelected] = useState(USE_CASES[0].id);
  const uc = USE_CASES.find((u) => u.id === selected)!;

  return (
    <div className="flex min-h-full">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-[var(--border)] p-4 flex flex-col gap-1">
        <p className="text-xs text-gray-600 uppercase tracking-wider px-3 mb-3">API Tester</p>
        {USE_CASES.map((u) => (
          <button
            key={u.id}
            onClick={() => setSelected(u.id)}
            className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              selected === u.id
                ? "bg-indigo-600/20 text-indigo-400"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
              u.method === "GET" ? "bg-green-500/20 text-green-500" : "bg-blue-500/20 text-blue-500"
            }`}>{u.method.slice(0, 3)}</span>
            <span className="truncate leading-snug">{u.title}</span>
          </button>
        ))}
        <div className="mt-auto pt-4 border-t border-[var(--border)] space-y-2">
          <button
            onClick={downloadAllMd}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download all (.md)
          </button>
          <p className="text-[10px] text-gray-700 px-3">
            Base: <code className="text-gray-500">{API_BASE}</code>
          </p>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 p-8 overflow-auto">
        <UseCasePanel key={uc.id} uc={uc} />
      </div>
    </div>
  );
}
