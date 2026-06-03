import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { clients } from "../api/client";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatSize(bytes: number | null | undefined): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  }
  return (
    <button onClick={handleCopy} title="Copy path" className={className}>
      {copied ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
}

const QUICK_PATHS = [
  { icon: "/cloudflare.svg", path: "CloudflareR2" },
  { icon: "/google-drive.svg", path: "GoogleDrive" },
];

export function BrowserPage() {
  const routerNavigate = useNavigate();
  const [path, setPath] = useState("CloudflareR2");
  const [filePath, setFilePath] = useState("");
  const [inputPath, setInputPath] = useState("CloudflareR2");
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const listing = useQuery({
    queryKey: ["files", path],
    queryFn: () => clients().files.list(path),
    enabled: Boolean(path),
  });

  const file = useQuery({
    queryKey: ["file", filePath],
    queryFn: () => clients().files.get(filePath),
    enabled: Boolean(filePath),
  });

  const pathDepth = path.split("/").length;

  const createFolder = useMutation({
    mutationFn: () =>
      pathDepth === 2
        ? clients().files.createBucket(path, newFolderName)
        : clients().files.createFolder(path, newFolderName),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["files", path] });
      setNewFolderName("");
      setShowNewFolder(false);
    },
  });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const contentBase64 = await fileToBase64(file);
      const absolutePath = `${path}/${file.name}`;
      return clients().files.uploadFile(absolutePath, contentBase64, file.type || undefined);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["files", path] });
      if (uploadInputRef.current) uploadInputRef.current.value = "";
    },
  });

  const sync = useMutation({
    mutationFn: () => clients().sync.sync(path),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sync-runs"] });
      qc.invalidateQueries({ queryKey: ["synced-files"] });
      qc.invalidateQueries({ queryKey: ["files"] });
    },
  });

  function navigate(to: string) {
    setPath(to);
    setInputPath(to);
    setFilePath("");
    setShowNewFolder(false);
  }

  function openNewFolder() {
    if (path.split("/").length === 1) {
      routerNavigate("/accounts");
      return;
    }
    setShowNewFolder(true);
    setTimeout(() => folderInputRef.current?.focus(), 0);
  }

  return (
    <div className="p-8 flex flex-col gap-6 min-h-full">
      <div>
        <h1 className="text-2xl font-bold text-white">Browser</h1>
        <p className="text-sm text-gray-500 mt-1">Explore cloud storage files</p>
      </div>

      {/* Path bar */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => { const parts = path.split("/"); if (parts.length > 1) navigate(parts.slice(0, -1).join("/")); }}
          disabled={pathDepth <= 1}
          className="p-2 text-gray-400 hover:text-white border border-[var(--border)] hover:border-indigo-500/50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Go up"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div className="flex-1 flex items-center gap-2 bg-black/30 border border-[var(--border)] focus-within:border-indigo-500 rounded-lg px-3 py-2 transition-colors">
          <svg className="w-4 h-4 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <input
            value={inputPath}
            onChange={(e) => setInputPath(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") navigate(inputPath); }}
            className="flex-1 bg-transparent text-sm text-white focus:outline-none font-mono"
            placeholder="Enter path…"
          />
        </div>
        {QUICK_PATHS.map((q) => (
          <button
            key={q.path}
            onClick={() => navigate(q.path)}
            title={q.path}
            className={`p-2 rounded-lg border transition-colors ${
              path === q.path
                ? "border-indigo-500/60 bg-indigo-600/10"
                : "border-[var(--border)] hover:border-gray-500 opacity-60 hover:opacity-100"
            }`}
          >
            <img src={q.icon} className="w-5 h-5" />
          </button>
        ))}
        <CopyButton text={path} className="p-2 text-gray-500 hover:text-white border border-[var(--border)] hover:border-gray-500 rounded-lg transition-colors" />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <button
          onClick={openNewFolder}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white border border-[var(--border)] hover:border-indigo-500/50 px-3 py-1.5 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {pathDepth === 2 ? "New Bucket" : "New Folder"}
        </button>

        {showNewFolder && (
          <form
            onSubmit={(e) => { e.preventDefault(); if (newFolderName.trim()) createFolder.mutate(); }}
            className="flex items-center gap-2"
          >
            <input
              ref={folderInputRef}
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder={pathDepth === 2 ? "Bucket name" : "Folder name"}
              className="bg-black/30 border border-[var(--border)] focus:border-indigo-500 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none transition-colors w-48"
              onKeyDown={(e) => { if (e.key === "Escape") { setShowNewFolder(false); setNewFolderName(""); } }}
            />
            <button
              type="submit"
              disabled={createFolder.isPending || !newFolderName.trim()}
              className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
            >
              {createFolder.isPending ? "Creating…" : "Create"}
            </button>
            <button
              type="button"
              onClick={() => { setShowNewFolder(false); setNewFolderName(""); }}
              className="text-sm text-gray-500 hover:text-white px-2 py-1.5 transition-colors"
            >
              Cancel
            </button>
          </form>
        )}

        {createFolder.error && (
          <p className="text-red-400 text-xs">{String(createFolder.error)}</p>
        )}

        {pathDepth >= 3 && (
          <>
            <input
              ref={uploadInputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) upload.mutate(file);
              }}
            />
            <button
              onClick={() => uploadInputRef.current?.click()}
              disabled={upload.isPending}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white border border-[var(--border)] hover:border-indigo-500/50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {upload.isPending ? "Uploading…" : "Upload"}
            </button>
            {upload.isSuccess && (
              <span className="text-xs text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                Uploaded
              </span>
            )}
            {upload.error && (
              <p className="text-red-400 text-xs">{String(upload.error)}</p>
            )}
          </>
        )}

        <button
          onClick={() => sync.mutate()}
          disabled={sync.isPending}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white border border-[var(--border)] hover:border-indigo-500/50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          <svg className={`w-4 h-4 ${sync.isPending ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {sync.isPending ? "Syncing…" : "Sync"}
        </button>

        {sync.isSuccess && (
          <span className="text-xs text-green-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
            Synced
          </span>
        )}
        {sync.error && (
          <p className="text-red-400 text-xs">{String(sync.error)}</p>
        )}
      </div>

      {listing.error && (
        <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {String(listing.error)}
        </p>
      )}

      {listing.isPending ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] overflow-hidden animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-[var(--border)] last:border-0">
              <div className="h-3.5 w-48 bg-white/10 rounded" />
              <div className="h-3 w-12 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      ) : (listing.data?.items ?? []).length > 0 && (
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
              {(listing.data?.items ?? []).map((item) => (
                <tr key={item.absolutePath} className="border-b border-[var(--border)] last:border-0 hover:bg-white/[0.03]">
                  <td className="px-5 py-3">
                    <button
                      onClick={() =>
                        item.type === "file"
                          ? setFilePath(item.absolutePath)
                          : navigate(item.absolutePath)
                      }
                      className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      {item.type === "folder" ? (
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                      {item.name}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-gray-500 capitalize">{item.type}</td>
                  <td className="px-5 py-3 text-gray-400 tabular-nums">{formatSize(item.sizeBytes)}</td>
                  <td className="px-5 py-3 max-w-xs">
                    <div className="flex items-center gap-1.5 group">
                      <span className="text-gray-600 font-mono text-xs truncate">{item.absolutePath}</span>
                      <CopyButton text={item.absolutePath} className="shrink-0 text-gray-700 hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {file.data && (
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">File Details</h2>
          <pre className="bg-black/40 border border-[var(--border)] rounded-xl text-gray-300 text-xs p-5 overflow-auto">
            {JSON.stringify(
              {
                ...file.data.file,
                contentBase64: file.data.file.contentBase64 ? "[base64 content]" : undefined,
              },
              null,
              2
            )}
          </pre>
        </div>
      )}
    </div>
  );
}
