import { useState } from "react";

const API_BASE = `${window.location.protocol}//${window.location.hostname}:20131`;

interface UseCaseDef {
  id: string;
  title: string;
  description: string;
  method: string;
  endpoint: string;
  requestBody?: object;
  responseBody?: object;
  notes?: string[];
}

const USE_CASES: UseCaseDef[] = [
  {
    id: "list-files",
    title: "List files & folders in a directory",
    description: "List all files and folders at a given path in cloud storage.",
    method: "POST",
    endpoint: "/files/list",
    requestBody: {
      path: "CloudflareR2/my-account/my-bucket/images",
    },
    responseBody: {
      currentPath: "CloudflareR2/my-account/my-bucket/images",
      items: [
        { name: "photo.jpg", absolutePath: "CloudflareR2/my-account/my-bucket/images/photo.jpg", type: "file", sizeBytes: 204800 },
        { name: "thumbs", absolutePath: "CloudflareR2/my-account/my-bucket/images/thumbs", type: "folder" },
      ],
    },
    notes: [
      "path format: <Provider>/<account>/<bucket>[/<folder>...]",
      "Supported providers: CloudflareR2, GoogleDrive.",
      "Token must have read permission for the path.",
    ],
  },
  {
    id: "download-file",
    title: "Download file bytes",
    description: "Download a file's metadata and bytes as base64 content.",
    method: "POST",
    endpoint: "/files/download",
    requestBody: {
      absolutePath: "CloudflareR2/my-account/my-bucket/images/photo.jpg",
    },
    responseBody: {
      file: {
        absolutePath: "CloudflareR2/my-account/my-bucket/images/photo.jpg",
        contentType: "image/jpeg",
        sizeBytes: 204800,
        contentBase64: "<base64-encoded file content>",
      },
    },
    notes: [
      "absolutePath format: <Provider>/<account>/<bucket>/<path>/<filename>",
      "The server returns file bytes in contentBase64.",
      "Token must have read permission for the path.",
    ],
  },
  {
    id: "list-all-files",
    title: "List all nested files in a folder",
    description: "Get every file at all depth levels under a given folder path. Returns a flat list of files only (no folders), reading from the synced database.",
    method: "POST",
    endpoint: "/files/all",
    requestBody: {
      path: "CloudflareR2/my-account/my-bucket/images",
    },
    responseBody: {
      currentPath: "CloudflareR2/my-account/my-bucket/images",
      items: [
        { name: "photo.jpg", absolutePath: "CloudflareR2/my-account/my-bucket/images/photo.jpg", type: "file", sizeBytes: 204800 },
        { name: "thumb.jpg", absolutePath: "CloudflareR2/my-account/my-bucket/images/thumbs/thumb.jpg", type: "file", sizeBytes: 10240 },
      ],
    },
    notes: [
      "path format: <Provider>/<account>/<bucket>[/<folder>...]",
      "Returns ALL files recursively — no depth limit.",
      "Only returns files (type=file); folders are excluded.",
      "Data is read from the local database — run a sync first to populate it.",
      "Token must have read permission for the path.",
    ],
  },
  {
    id: "temp-download-url",
    title: "Create temporary download URL",
    description: "Create a short-lived direct download URL for providers that support presigned URLs.",
    method: "POST",
    endpoint: "/files/temp-download-url",
    requestBody: {
      absolutePath: "CloudflareR2/my-account/my-bucket/images/photo.jpg",
      expiresInSeconds: 900,
    },
    responseBody: {
      absolutePath: "CloudflareR2/my-account/my-bucket/images/photo.jpg",
      url: "https://<account-id>.r2.cloudflarestorage.com/my-bucket/images/photo.jpg?X-Amz-Signature=<signature>",
      method: "GET",
      expiresAt: "2026-06-19T12:15:00.000Z",
    },
    notes: [
      "Token must have read permission for the path.",
      "CloudflareR2 returns presigned object URLs.",
      "GoogleDrive returns a Drive media URL with a short-lived OAuth access token.",
    ],
  },
  {
    id: "temp-upload-url",
    title: "Create temporary upload URL",
    description: "Create a short-lived direct upload URL for providers that support presigned URLs.",
    method: "POST",
    endpoint: "/files/temp-upload-url",
    requestBody: {
      absolutePath: "CloudflareR2/my-account/my-bucket/images/photo.jpg",
      contentType: "image/jpeg",
      expiresInSeconds: 900,
    },
    responseBody: {
      absolutePath: "CloudflareR2/my-account/my-bucket/images/photo.jpg",
      url: "https://<account-id>.r2.cloudflarestorage.com/my-bucket/images/photo.jpg?X-Amz-Signature=<signature>",
      method: "PUT",
      headers: { "Content-Type": "image/jpeg" },
      expiresAt: "2026-06-19T12:15:00.000Z",
    },
    notes: [
      "Token must have write permission for the path.",
      "Send the returned headers with the PUT request.",
      "Run sync after a direct upload to refresh local metadata.",
      "CloudflareR2 returns presigned object URLs.",
      "GoogleDrive returns a resumable upload session URL.",
    ],
  },
  {
    id: "get-accessible-directories",
    title: "Get accessible directories",
    description: "Returns the list of paths the current access token is permitted to access, along with the access level for each. Admin tokens return isAdmin: true with an empty directories array (full access).",
    method: "GET",
    endpoint: "/access/directories",
    responseBody: {
      isAdmin: false,
      directories: [
        { path: "CloudflareR2/my-account/my-bucket", access: "read-write" },
        { path: "GoogleDrive/my-account/reports", access: "read" },
      ],
    },
    notes: [
      "No request body — identity is derived from the Bearer token.",
      "Admin tokens (SYSTEM_SECRET) return { isAdmin: true, directories: [] } — they have unrestricted access.",
      "Client tokens return the exact path permissions configured in Settings → Access Tokens.",
      "Use this endpoint to discover what paths are available before calling /files/list or /files/all.",
    ],
  },
  {
    id: "upload-file",
    title: "Upload a file to an absolute path",
    description: "Upload any file to a specific location in cloud storage by providing its absolute path and base64-encoded content.",
    method: "POST",
    endpoint: "/files/upload",
    requestBody: {
      absolutePath: "CloudflareR2/my-account/my-bucket/images/photo.jpg",
      contentBase64: "<base64-encoded file content>",
      contentType: "image/jpeg",
    },
    notes: [
      "absolutePath format: <Provider>/<account>/<bucket>/<path>/<filename>",
      "contentType is optional — omit to let the provider infer it.",
      "Supported providers: CloudflareR2, GoogleDrive.",
      "Returns 204 No Content on success.",
      "Token must have write permission for the path.",
    ],
  },
];

function buildCurl(uc: UseCaseDef): string {
  const lines = [`curl -X ${uc.method} "${API_BASE}${uc.endpoint}" \\`, `  -H "Authorization: Bearer <token>"`];
  if (uc.requestBody) {
    lines[lines.length - 1] += " \\";
    lines.push(`  -H "Content-Type: application/json" \\`);
    lines.push(`  -d '${JSON.stringify(uc.requestBody, null, 2).split("\n").join("\n  ")}'`);
  }
  return lines.join("\n");
}

function toMarkdown(uc: UseCaseDef): string {
  const lines: string[] = [];
  lines.push(`# ${uc.title}`);
  lines.push("");
  lines.push(uc.description);
  lines.push("");
  lines.push(`## Endpoint`);
  lines.push("");
  lines.push(`\`\`\`\n${uc.method} ${API_BASE}${uc.endpoint}\n\`\`\``);
  lines.push("");
  lines.push(`**Authorization:** \`Bearer <token>\``);
  lines.push("");

  if (uc.requestBody) {
    lines.push(`## Request Body`);
    lines.push("");
    lines.push("```json");
    lines.push(JSON.stringify(uc.requestBody, null, 2));
    lines.push("```");
    lines.push("");
  }

  if (uc.responseBody) {
    lines.push(`## Response`);
    lines.push("");
    lines.push("```json");
    lines.push(JSON.stringify(uc.responseBody, null, 2));
    lines.push("```");
    lines.push("");
  }

  lines.push(`## Example (curl)`);
  lines.push("");
  lines.push("```bash");
  lines.push(buildCurl(uc));
  lines.push("```");
  lines.push("");

  if (uc.notes?.length) {
    lines.push(`## Notes`);
    lines.push("");
    uc.notes.forEach((n) => lines.push(`- ${n}`));
    lines.push("");
  }

  return lines.join("\n");
}

function download(uc: UseCaseDef) {
  const md = toMarkdown(uc);
  const blob = new Blob([md], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${uc.id}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadAll() {
  const md = USE_CASES.map((uc) => toMarkdown(uc)).join("\n---\n\n");
  const blob = new Blob([md], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "7Router-usecases.md";
  a.click();
  URL.revokeObjectURL(url);
}

function methodColor(method: string) {
  if (method === "POST") return "bg-blue-500/20 text-blue-400 border-blue-500/30";
  if (method === "GET") return "bg-green-500/20 text-green-400 border-green-500/30";
  return "bg-gray-500/20 text-gray-400 border-gray-500/30";
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="bg-black/40 border border-[var(--border)] rounded-lg text-xs text-gray-300 p-4 overflow-x-auto font-mono whitespace-pre">
      {code}
    </pre>
  );
}

function UseCaseDetail({ uc }: { uc: UseCaseDef }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">{uc.title}</h2>
          <p className="text-sm text-gray-400 mt-1">{uc.description}</p>
        </div>
        <button
          onClick={() => download(uc)}
          className="flex items-center gap-1.5 shrink-0 text-xs text-gray-400 hover:text-white border border-[var(--border)] hover:border-indigo-500/50 px-3 py-1.5 rounded-lg transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download .md
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className={`text-xs font-bold px-2 py-0.5 rounded border ${methodColor(uc.method)}`}>{uc.method}</span>
        <code className="text-sm text-indigo-300 font-mono">{API_BASE}{uc.endpoint}</code>
      </div>

      {uc.requestBody && (
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Request body</p>
          <CodeBlock code={JSON.stringify(uc.requestBody, null, 2)} />
        </div>
      )}

      {uc.responseBody && (
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Response</p>
          <CodeBlock code={JSON.stringify(uc.responseBody, null, 2)} />
        </div>
      )}

      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Example (curl)</p>
        <CodeBlock code={buildCurl(uc)} />
      </div>

      {uc.notes && uc.notes.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Notes</p>
          <ul className="space-y-1">
            {uc.notes.map((note, i) => (
              <li key={i} className="text-xs text-gray-500 flex gap-2">
                <span className="text-gray-600 shrink-0">•</span>
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="pt-2">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Markdown preview</p>
        <CodeBlock code={toMarkdown(uc)} />
      </div>
    </div>
  );
}

export function UseCasePage() {
  const [selected, setSelected] = useState(USE_CASES[0].id);
  const uc = USE_CASES.find((u) => u.id === selected)!;

  return (
    <div className="flex min-h-full">
      {/* Menu */}
      <aside className="w-56 shrink-0 border-r border-[var(--border)] p-4 flex flex-col gap-1">
        <p className="text-xs text-gray-600 uppercase tracking-wider px-3 mb-3">Use Cases</p>
        {USE_CASES.map((u, i) => (
          <button
            key={u.id}
            onClick={() => setSelected(u.id)}
            className={`w-full text-left flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              selected === u.id
                ? "bg-indigo-600/20 text-indigo-400"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <span className="text-xs text-gray-600 shrink-0 mt-0.5">#{i + 1}</span>
            <span className="leading-snug">{u.title}</span>
          </button>
        ))}
        <div className="mt-auto pt-4 border-t border-[var(--border)]">
          <button
            onClick={downloadAll}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download all (.md)
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 p-8 overflow-auto">
        <div className="mb-6">
          <p className="text-xs text-gray-600">
            Base URL: <code className="text-indigo-400">{API_BASE}</code>
            <span className="ml-4">Auth: <code className="text-gray-400">Authorization: Bearer &lt;token&gt;</code></span>
            <span className="ml-4 text-gray-700">Tokens must have path permissions configured in Settings → Access Tokens.</span>
          </p>
        </div>
        <UseCaseDetail uc={uc} />
      </div>
    </div>
  );
}
