import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ProviderName } from "@7router/api-clients";
import { clients } from "../api/client";

export function ProviderAccountsPage() {
  const [providerName, setProviderName] = useState<ProviderName>(ProviderName.CloudflareR2);
  const [accountName, setAccountName] = useState("");
  const [credentials, setCredentials] = useState("{}");
  const qc = useQueryClient();
  const accounts = useQuery({ queryKey: ["accounts", providerName], queryFn: () => clients().providers.listAccounts(providerName) });
  const add = useMutation({
    mutationFn: () => clients().accounts.addAccount(providerName, { accountName, credentials: JSON.parse(credentials) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts", providerName] }),
  });
  const remove = useMutation({
    mutationFn: (name: string) => clients().accounts.removeAccount(providerName, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts", providerName] }),
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    add.mutate();
  }

  return (
    <>
      <h1>Accounts</h1>
      <form className="panel" onSubmit={submit}>
        <label>Provider
          <select value={providerName} onChange={(event) => setProviderName(event.target.value as ProviderName)}>
            <option value={ProviderName.CloudflareR2}>Cloudflare R2</option>
            <option value={ProviderName.GoogleDrive}>Google Drive</option>
          </select>
        </label>
        <label>Account name<input value={accountName} onChange={(event) => setAccountName(event.target.value)} /></label>
        <label>Credentials JSON<textarea value={credentials} onChange={(event) => setCredentials(event.target.value)} rows={8} /></label>
        <button>Add account</button>
        {add.error && <p className="error">{String(add.error)}</p>}
      </form>
      <table>
        <thead><tr><th>Name</th><th>Credential hint</th><th>Created</th><th></th></tr></thead>
        <tbody>
          {(accounts.data ?? []).map((account) => (
            <tr key={account.accountName}>
              <td>{account.accountName}</td><td>{account.credentialHint ?? ""}</td><td>{account.createdAt}</td>
              <td><button className="secondary" onClick={() => remove.mutate(account.accountName)}>Remove</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

