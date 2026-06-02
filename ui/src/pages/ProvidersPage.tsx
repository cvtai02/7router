import { useQuery } from "@tanstack/react-query";
import { clients } from "../api/client";

export function ProvidersPage() {
  const providers = useQuery({ queryKey: ["providers"], queryFn: () => clients().providers.listProviders() });
  return (
    <>
      <h1>Providers</h1>
      <table>
        <thead><tr><th>Provider</th><th>Status</th><th>Accounts</th></tr></thead>
        <tbody>
          {(providers.data ?? []).map((provider) => (
            <tr key={provider.providerName}>
              <td>{provider.displayName}</td>
              <td>{provider.enabled ? "Enabled" : "Disabled"}</td>
              <td>{provider.accountCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

