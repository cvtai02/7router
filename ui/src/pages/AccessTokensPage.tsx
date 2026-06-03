import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clients } from "../api/client";
import type { MaskedToken, TokenPermission } from "@7router/api-clients";

function generateToken(): string {
  const id = new Uint8Array(4);
  const secret = new Uint8Array(28);
  crypto.getRandomValues(id);
  crypto.getRandomValues(secret);
  const hex = (arr: Uint8Array) => Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex(id)}.${hex(secret)}`;
}

function tokenIdFromValue(maskedValue: string): string {
  const dot = maskedValue.indexOf(".");
  return dot >= 0 ? maskedValue.slice(0, dot) : maskedValue;
}

function AccessLabel({ access }: { access: TokenPermission["access"] }) {
  const map = {
    "read": "bg-blue-500/15 text-blue-400 border-blue-500/30",
    "write": "bg-orange-500/15 text-orange-400 border-orange-500/30",
    "read-write": "bg-purple-500/15 text-purple-400 border-purple-500/30",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded border font-mono ${map[access]}`}>{access}</span>
  );
}

function PermissionsPanel({ token }: { token: MaskedToken }) {
  const [path, setPath] = useState("");
  const [access, setAccess] = useState<TokenPermission["access"]>("read");
  const qc = useQueryClient();

  const addPerm = useMutation({
    mutationFn: () => clients().settings.addPermission(tokenIdFromValue(token.value), path.trim(), access),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tokens"] }); setPath(""); },
  });

  const removePerm = useMutation({
    mutationFn: (index: number) => clients().settings.removePermission(tokenIdFromValue(token.value), index),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tokens"] }),
  });

  return (
    <div className="border-t border-[var(--border)] bg-black/20 px-5 py-4 space-y-3">
      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Path Permissions</p>

      {token.permissions.length === 0 ? (
        <p className="text-xs text-gray-600">No permissions — token cannot access any path.</p>
      ) : (
        <div className="space-y-1.5">
          {token.permissions.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <code className="flex-1 text-xs text-gray-300 font-mono bg-black/30 px-2.5 py-1.5 rounded-lg truncate">{p.path}</code>
              <AccessLabel access={p.access} />
              <button
                onClick={() => removePerm.mutate(i)}
                disabled={removePerm.isPending}
                className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded border border-red-500/20 hover:border-red-400/40 transition-colors"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <input
          value={path}
          onChange={(e) => setPath(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && path.trim()) addPerm.mutate(); }}
          placeholder="CloudflareR2/account/bucket/folder"
          className="flex-1 bg-black/30 border border-[var(--border)] focus:border-indigo-500 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none transition-colors font-mono"
        />
        <select
          value={access}
          onChange={(e) => setAccess(e.target.value as TokenPermission["access"])}
          className="bg-black/30 border border-[var(--border)] focus:border-indigo-500 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none transition-colors"
        >
          <option value="read">read</option>
          <option value="write">write</option>
          <option value="read-write">read-write</option>
        </select>
        <button
          onClick={() => addPerm.mutate()}
          disabled={addPerm.isPending || !path.trim()}
          className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50 transition-colors"
        >
          Add
        </button>
      </div>
      {addPerm.error && <p className="text-red-400 text-xs">{String(addPerm.error)}</p>}
    </div>
  );
}

function TokenRow({ token, onRevoke }: { token: MaskedToken; onRevoke: () => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-[var(--border)] last:border-0">
      <div
        className="flex items-center gap-4 px-5 py-3 hover:bg-white/[0.03] cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <svg
          className={`w-3.5 h-3.5 text-gray-500 shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <div className="flex-1 min-w-0">
          <span className="text-sm text-white font-medium">{token.name}</span>
        </div>
        <span className="text-xs font-mono text-gray-500">{token.value}</span>
        <span className="text-xs text-gray-600">{token.permissions.length} permission{token.permissions.length !== 1 ? "s" : ""}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onRevoke(); }}
          className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg border border-red-500/30 hover:border-red-400/50 transition-colors"
        >
          Revoke
        </button>
      </div>
      {expanded && <PermissionsPanel token={token} />}
    </div>
  );
}

export function AccessTokensPage() {
  const [name, setName] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [justCreated, setJustCreated] = useState<{ name: string; value: string } | null>(null);
  const qc = useQueryClient();

  const tokens = useQuery({
    queryKey: ["tokens"],
    queryFn: () => clients().settings.listTokens(),
  });

  const add = useMutation({
    mutationFn: ({ n, t }: { n: string; t: string }) => clients().settings.addToken(n, t),
    onSuccess: (_, { n, t }) => {
      qc.invalidateQueries({ queryKey: ["tokens"] });
      setJustCreated({ name: n, value: t });
      setName("");
      setShowForm(false);
    },
  });

  const remove = useMutation({
    mutationFn: (tokenId: string) => clients().settings.removeToken(tokenId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tokens"] }),
  });

  function handleGenerate() {
    if (!name.trim()) return;
    add.mutate({ n: name.trim(), t: generateToken() });
  }

  return (
    <div className="p-8 flex flex-col gap-6 min-h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Access Tokens</h1>
          <p className="text-sm text-gray-500 mt-1">Manage tokens for external API access</p>
        </div>
        <button
          onClick={() => { setShowForm((v) => !v); setJustCreated(null); }}
          className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          {showForm ? "Cancel" : "+ New Token"}
        </button>
      </div>

      {justCreated && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 flex items-start gap-3">
          <svg className="w-4 h-4 text-green-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-green-400 font-medium">
              Token <span className="font-bold">{justCreated.name}</span> created — copy it now, it won't be shown again
            </p>
            <code className="text-xs text-green-300 font-mono break-all mt-1 block">{justCreated.value}</code>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(justCreated.value)}
            className="text-xs text-green-400 hover:text-green-300 border border-green-500/30 px-3 py-1.5 rounded-lg transition-colors shrink-0"
          >
            Copy
          </button>
          <button onClick={() => setJustCreated(null)} className="text-gray-500 hover:text-white transition-colors shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {showForm && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">New Token</h2>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Token name <span className="text-red-400">*</span></label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. my-app-prod"
              className="w-full bg-black/30 border border-[var(--border)] focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none transition-colors"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={add.isPending || !name.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            Generate Token
          </button>

          {add.error && <p className="text-red-400 text-sm">{String(add.error)}</p>}
        </div>
      )}

      <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] overflow-hidden">
        {tokens.isPending ? (
          <div className="animate-pulse p-5 space-y-3">
            {[1, 2].map((i) => <div key={i} className="h-10 bg-white/5 rounded-lg" />)}
          </div>
        ) : (tokens.data?.tokens ?? []).length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-gray-500">No access tokens. Create one to get started.</p>
          </div>
        ) : (
          <div>
            {(tokens.data?.tokens ?? []).map((token) => (
              <TokenRow key={token.value} token={token} onRevoke={() => remove.mutate(tokenIdFromValue(token.value))} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
