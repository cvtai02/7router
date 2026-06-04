export function SettingsPage() {
  return (
    <div className="p-8 flex flex-col gap-6 min-h-full">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">System configuration</p>
      </div>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] p-10 text-center max-w-2xl">
        <p className="text-sm text-gray-500">No configurable settings yet.</p>
      </div>
    </div>
  );
}
