import { FormEvent, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clients } from "../api/client";

const QUICK_PATHS = [
  { label: "Cloudflare R2", path: "CloudflareR2" },
  { label: "Google Drive",  path: "GoogleDrive" },
];

export function SyncPage() {
  const [absolutePath, setAbsolutePath] = useState("CloudflareR2");
  const qc = useQueryClient();

  const sync = useMutation({
    mutationFn: () => clients().sync.sync(absolutePath),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sync-runs"] });
      qc.invalidateQueries({ queryKey: ["synced-files"] });
    },
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    sync.mutate();
  }

  return (
    <div className="p-8 flex flex-col gap-6 min-h-full">
      <div>
        <h1 className="text-2xl font-bold text-white">Manual Sync</h1>
        <p className="text-sm text-gray-500 mt-1">Trigger a sync run for a storage path</p>
      </div>

      <form onSubmit={submit} className="rounded-xl border border-[var(--border)] bg-[var(--muted)] p-6 space-y-5 max-w-xl">
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Absolute path</label>
          <input
            required
            value={absolutePath}
            onChange={(e) => setAbsolutePath(e.target.value)}
            className="w-full bg-black/30 border border-[var(--border)] focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none transition-colors font-mono"
            placeholder="CloudflareR2/my-bucket/path"
          />
          <div className="flex gap-2 mt-2">
            {QUICK_PATHS.map((q) => (
              <button
                key={q.path}
                type="button"
                onClick={() => setAbsolutePath(q.path)}
                className="text-xs text-indigo-400 hover:text-indigo-300 px-2.5 py-1 rounded-md border border-indigo-500/30 hover:border-indigo-500/60 transition-colors"
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        {sync.error && (
          <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {String(sync.error)}
          </p>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={sync.isPending}
            className="px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {sync.isPending && (
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {sync.isPending ? "Running…" : "Run Sync"}
          </button>
          {sync.isSuccess && (
            <span className="text-xs text-green-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
              Sync completed
            </span>
          )}
        </div>
      </form>

      {sync.data && (
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Result</h2>
          <pre className="bg-black/40 border border-[var(--border)] rounded-xl text-gray-300 text-xs p-5 overflow-auto">
            {JSON.stringify(sync.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
