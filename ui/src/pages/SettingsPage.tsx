import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { clients } from "../api/client";

export function SettingsPage() {
  const settings = useQuery({ queryKey: ["settings"], queryFn: () => clients().settings.getSettings() });
  const [text, setText] = useState("");
  useEffect(() => {
    if (settings.data) setText(JSON.stringify(settings.data, null, 2));
  }, [settings.data]);
  const update = useMutation({ mutationFn: () => clients().settings.updateSettings(JSON.parse(text)) });
  function submit(event: FormEvent) {
    event.preventDefault();
    update.mutate();
  }
  return (
    <>
      <h1>Settings</h1>
      <form className="panel" onSubmit={submit}>
        <textarea value={text} onChange={(event) => setText(event.target.value)} rows={18} />
        <button>Save settings</button>
      </form>
      {update.data && <p className="notice">Settings saved. Some changes require restart.</p>}
      {update.error && <p className="error">{String(update.error)}</p>}
    </>
  );
}

