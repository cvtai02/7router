import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { clients } from "../api/client";

export function SettingsPage() {
  const settings = useQuery({
    queryKey: ["settings"],
    queryFn: () => clients().settings.getSettings(),
  });

  const [text, setText] = useState("");
  const [jsonError, setJsonError] = useState("");

  useEffect(() => {
    if (settings.data) setText(JSON.stringify(settings.data, null, 2));
  }, [settings.data]);

  const update = useMutation({
    mutationFn: () => clients().settings.updateSettings(JSON.parse(text)),
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    setJsonError("");
    try {
      JSON.parse(text);
    } catch {
      setJsonError("Invalid JSON — please fix before saving.");
      return;
    }
    update.mutate();
  }

  return (
    <div className="p-8 flex flex-col gap-6 min-h-full">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Runtime configuration — some changes require restart</p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-4 max-w-2xl">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
            <span className="text-xs text-gray-500 font-mono">runtime.config.json</span>
            {settings.isPending && (
              <span className="text-xs text-gray-600">Loading…</span>
            )}
          </div>
          <textarea
            rows={20}
            value={text}
            onChange={(e) => { setText(e.target.value); setJsonError(""); }}
            className="w-full bg-transparent px-5 py-4 text-xs text-gray-300 focus:outline-none font-mono resize-none"
            placeholder={settings.isPending ? "Loading settings…" : "{}"}
          />
        </div>

        {(jsonError || update.error) && (
          <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {jsonError || String(update.error)}
          </p>
        )}

        {update.isSuccess && (
          <p className="text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
            Settings saved. Some changes require restart.
          </p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={update.isPending || settings.isPending}
            className="px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50 transition-colors"
          >
            {update.isPending ? "Saving…" : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
