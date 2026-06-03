import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { clients } from "../api/client";


const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  CloudflareR2: <img src="/cloudflare.svg" className="w-10 h-10" alt="Cloudflare R2" />,
  GoogleDrive:  <img src="/google-drive.svg" className="w-10 h-10" alt="Google Drive" />,
};

export function ProvidersPage() {
  const providers = useQuery({
    queryKey: ["providers"],
    queryFn: () => clients().providers.listProviders(),
  });

  return (
    <div className="p-8 flex flex-col gap-8 min-h-full">
      <div>
        <h1 className="text-2xl font-bold text-white">Providers</h1>
        <p className="text-sm text-gray-500 mt-1">Configured cloud storage providers</p>
      </div>

      {providers.isPending ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--muted)] p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-3.5 w-24 bg-white/10 rounded" />
                  <div className="h-3 w-16 bg-white/5 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : providers.data?.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] p-12 text-center">
          <p className="text-white font-medium">No providers found</p>
          <p className="text-sm text-gray-500 mt-1">Add accounts to get started.</p>
          <Link
            to="/accounts"
            className="mt-4 inline-flex bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Manage Accounts
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(providers.data ?? []).map((provider) => {
            const icon = PROVIDER_ICONS[provider.providerName];
            return (
              <Link
                key={provider.providerName}
                to="/accounts"
                className="rounded-xl border border-[var(--border)] bg-[var(--muted)] p-4 flex items-center gap-3 hover:border-indigo-500/50 transition-colors"
              >
                <div className="w-10 h-10 flex items-center justify-center shrink-0">
                  {icon ?? (
                    <span className="text-sm font-bold text-white">
                      {provider.displayName.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">{provider.displayName}</p>
                  {provider.enabled ? (
                    <p className="text-xs text-green-400 flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                      {provider.accountCount} account{provider.accountCount !== 1 ? "s" : ""}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-0.5">Disabled</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
