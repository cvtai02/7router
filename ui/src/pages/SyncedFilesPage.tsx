import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { clients } from "../api/client";

function formatSize(bytes: number | null | undefined): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function SyncedFilesPage() {
  const [q, setQ] = useState("");

  const files = useQuery({
    queryKey: ["synced-files", q],
    queryFn: () => clients().sync.listSyncedFiles({ q }),
  });

  return (
    <div className="p-8 flex flex-col gap-6 min-h-full">
      <div>
        <h1 className="text-2xl font-bold text-white">Synced Files</h1>
        <p className="text-sm text-gray-500 mt-1">Files tracked across all providers</p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-black/30 border border-[var(--border)] focus-within:border-indigo-500 rounded-lg px-3 py-2 transition-colors max-w-md">
        <svg className="w-4 h-4 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search path…"
          className="flex-1 bg-transparent text-sm text-white focus:outline-none placeholder:text-gray-600"
        />
        {q && (
          <button onClick={() => setQ("")} className="text-gray-500 hover:text-gray-300 text-xs">
            ✕
          </button>
        )}
      </div>

      {files.isPending ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] overflow-hidden animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-[var(--border)] last:border-0">
              <div className="h-3.5 w-56 bg-white/10 rounded" />
              <div className="h-3 w-16 bg-white/5 rounded" />
              <div className="h-3 w-20 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      ) : (files.data?.items ?? []).length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] p-10 text-center">
          <p className="text-sm text-gray-500">
            {q ? `No files matching "${q}"` : "No synced files yet. Run a sync to get started."}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
            <span className="text-xs text-gray-500">
              {files.data?.items.length ?? 0} file{(files.data?.items.length ?? 0) !== 1 ? "s" : ""}
            </span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-gray-500 text-xs">
                <th className="px-5 py-3 text-left">Path</th>
                <th className="px-5 py-3 text-left">Type</th>
                <th className="px-5 py-3 text-left">Size</th>
                <th className="px-5 py-3 text-left">Last synced</th>
              </tr>
            </thead>
            <tbody>
              {(files.data?.items ?? []).map((file) => (
                <tr key={file.id} className="border-b border-[var(--border)] last:border-0 hover:bg-white/[0.03]">
                  <td className="px-5 py-3 font-mono text-xs text-gray-300 max-w-sm truncate">{file.absolutePath}</td>
                  <td className="px-5 py-3 text-gray-500 capitalize">{file.itemType}</td>
                  <td className="px-5 py-3 text-gray-400 tabular-nums">{formatSize(file.sizeBytes)}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{file.lastSyncedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
