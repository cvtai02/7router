import { useParams } from "react-router-dom";
import { API_BASE_URL, getStoredToken } from "../api/client";

export function ViewPage() {
  const { "*": filePath } = useParams();

  if (!filePath) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        No file path provided. Use <code className="mx-1 px-2 py-0.5 bg-white/5 rounded font-mono text-xs">/view/Provider/Account/Bucket/file.mp4</code>
      </div>
    );
  }

  const streamUrl = `${API_BASE_URL}/files/stream?path=${encodeURIComponent(filePath)}&token=${encodeURIComponent(getStoredToken())}`;

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-3 border-b border-[var(--border)] bg-[var(--muted)] flex items-center gap-3 min-h-[48px]">
        <span className="text-sm font-mono text-gray-400 truncate">{filePath}</span>
      </div>
      <div className="flex-1 flex items-center justify-center bg-black/30 p-12">
        <video
          src={streamUrl}
          controls
          autoPlay
          className="rounded-lg shadow-2xl"
          style={{ maxWidth: "720px", maxHeight: "480px" }}
        />
      </div>
    </div>
  );
}
