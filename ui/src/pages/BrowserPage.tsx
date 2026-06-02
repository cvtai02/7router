import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { clients } from "../api/client";

export function BrowserPage() {
  const [path, setPath] = useState("CloudflareR2");
  const [filePath, setFilePath] = useState("");
  const listing = useQuery({ queryKey: ["files", path], queryFn: () => clients().files.list(path), enabled: Boolean(path) });
  const file = useQuery({ queryKey: ["file", filePath], queryFn: () => clients().files.get(filePath), enabled: Boolean(filePath) });
  return (
    <>
      <h1>Browser</h1>
      <div className="toolbar">
        <input value={path} onChange={(event) => setPath(event.target.value)} />
        <button onClick={() => setPath("CloudflareR2")}>R2</button>
        <button onClick={() => setPath("GoogleDrive")}>Drive</button>
      </div>
      <table>
        <thead><tr><th>Name</th><th>Type</th><th>Size</th><th>Path</th></tr></thead>
        <tbody>
          {(listing.data?.items ?? []).map((item) => (
            <tr key={item.absolutePath}>
              <td><button className="link" onClick={() => item.type === "file" ? setFilePath(item.absolutePath) : setPath(item.absolutePath)}>{item.name}</button></td>
              <td>{item.type}</td><td>{item.sizeBytes ?? ""}</td><td>{item.absolutePath}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {file.data && <pre>{JSON.stringify({ ...file.data.file, contentBase64: file.data.file.contentBase64 ? "[base64 content]" : undefined }, null, 2)}</pre>}
      {listing.error && <p className="error">{String(listing.error)}</p>}
    </>
  );
}

