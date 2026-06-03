import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clients, setStoredToken } from "../api/client";

export function LoginPage() {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await clients("").auth.checkToken(token);
      if (!result.valid) {
        setError("Token was rejected.");
        return;
      }
      setStoredToken(token);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach the API.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">7router</h1>
          <p className="text-sm text-gray-500 mt-1">Storage Gateway</p>
        </div>

        <div className="bg-[var(--muted)] border border-[var(--border)] rounded-2xl p-8">
          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Access token</label>
              <input
                type="password"
                autoFocus
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter your token"
                className="w-full bg-black/30 border border-[var(--border)] focus:border-indigo-500 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none transition-colors placeholder:text-gray-600"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full px-5 py-2.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50 transition-colors"
            >
              {loading ? "Signing in…" : "Continue"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
