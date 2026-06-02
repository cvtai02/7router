import { useQuery } from "@tanstack/react-query";
import { clients } from "../api/client";

export function DashboardPage() {
  const providers = useQuery({ queryKey: ["providers"], queryFn: () => clients().providers.listProviders() });
  const runs = useQuery({ queryKey: ["sync-runs"], queryFn: () => clients().sync.listRuns() });
  const accountCount = providers.data?.reduce((total, provider) => total + provider.accountCount, 0) ?? 0;

  return (
    <>
      <h1>Dashboard</h1>
      <section className="metrics">
        <div className="metric"><span>Providers</span><strong>{providers.data?.length ?? 0}</strong></div>
        <div className="metric"><span>Accounts</span><strong>{accountCount}</strong></div>
        <div className="metric"><span>Sync Runs</span><strong>{runs.data?.length ?? 0}</strong></div>
      </section>
      <h2>Recent Sync Runs</h2>
      <table>
        <thead><tr><th>Path</th><th>Status</th><th>Discovered</th><th>Completed</th></tr></thead>
        <tbody>
          {(runs.data ?? []).map((run) => (
            <tr key={run.syncRunId}><td>{run.absolutePath}</td><td>{run.status}</td><td>{run.discovered}</td><td>{run.completedAt ?? ""}</td></tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

