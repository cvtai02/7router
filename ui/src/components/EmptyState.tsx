import { Icons } from "./Icons";

export function EmptyState({ depth, onAddAccount }: { depth: number; onAddAccount: () => void }) {
  if (depth <= 1) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] p-16 text-center">
        <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto mb-4 text-indigo-400">
          {Icons.plus}
        </div>
        <p className="text-white font-medium">{depth === 0 ? "No providers configured" : "No accounts yet"}</p>
        <p className="text-sm text-gray-500 mt-1 mb-5">Add an account to get started.</p>
        <button onClick={onAddAccount}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">
          Add Account
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] p-16 text-center">
      <p className="text-sm text-gray-500">This directory is empty.</p>
    </div>
  );
}
