import { FormEvent, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clients } from "../api/client";

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
    <>
      <h1>Manual Sync</h1>
      <form className="panel" onSubmit={submit}>
        <label>Absolute path<input value={absolutePath} onChange={(event) => setAbsolutePath(event.target.value)} /></label>
        <button>Run sync</button>
      </form>
      {sync.data && <pre>{JSON.stringify(sync.data, null, 2)}</pre>}
      {sync.error && <p className="error">{String(sync.error)}</p>}
    </>
  );
}

