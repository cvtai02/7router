import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { clients } from "../api/client";

export function SyncedFilesPage() {
  const [q, setQ] = useState("");
  const files = useQuery({ queryKey: ["synced-files", q], queryFn: () => clients().sync.listSyncedFiles({ q }) });
  return (
    <>
      <h1>Synced Files</h1>
      <div className="toolbar"><input placeholder="Search path" value={q} onChange={(event) => setQ(event.target.value)} /></div>
      <table>
        <thead><tr><th>Path</th><th>Type</th><th>Size</th><th>Last synced</th></tr></thead>
        <tbody>
          {(files.data?.items ?? []).map((file) => (
            <tr key={file.id}><td>{file.absolutePath}</td><td>{file.itemType}</td><td>{file.sizeBytes ?? ""}</td><td>{file.lastSyncedAt}</td></tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

