import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { clients } from "../api/client";

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    completed: "bg-green-500/10 text-green-400 border-green-500/20",
    running:   "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    failed:    "bg-red-500/10 text-red-400 border-red-500/20",
    pending:   "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  };
  const cls = colors[status.toLowerCase()] ?? "bg-white/5 text-gray-400 border-white/10";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${cls} capitalize`}>
      {status}
    </span>
  );
}

export function DashboardPage() {
  const providers = useQuery({ queryKey: ["providers"], queryFn: () => clients().providers.listProviders() });
  const runs = useQuery({ queryKey: ["sync-runs"], queryFn: () => clients().sync.listRuns() });
  const accountCount = providers.data?.reduce((total, p) => total + p.accountCount, 0) ?? 0;

  const stats = [
    { label: "Providers", value: providers.data?.length ?? 0, href: "/storage", color: "text-purple-400" },
    { label: "Accounts", value: accountCount, href: "/storage", color: "text-indigo-400" },
    { label: "Sync Runs", value: runs.data?.length ?? 0, href: "/", color: "text-cyan-400" },
  ];

  const recent = (runs.data ?? []).slice(0, 8);

  return (
    <div className="p-8 flex flex-col gap-8 min-h-full">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">7Router running on localhost:20132</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            to={stat.href}
            className="rounded-xl border border-[var(--border)] bg-[var(--muted)] p-5 hover:border-indigo-500/50 transition-colors"
          >
            <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
          </Link>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Recent Sync Runs</h2>
          <span className="text-xs text-gray-500">
            Recent activity
          </span>
        </div>

        {recent.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] p-10 text-center">
            <p className="text-sm text-gray-500">No sync runs yet.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-gray-500 text-xs">
                  <th className="px-5 py-3 text-left">Path</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Discovered</th>
                  <th className="px-5 py-3 text-left">Completed</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((run) => (
                  <tr key={run.syncRunId} className="border-b border-[var(--border)] last:border-0 hover:bg-white/[0.03]">
                    <td className="px-5 py-3 font-mono text-xs text-gray-400 max-w-xs truncate">{run.absolutePath}</td>
                    <td className="px-5 py-3"><StatusBadge status={run.status} /></td>
                    <td className="px-5 py-3 text-gray-300">{run.discovered}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{run.completedAt ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
