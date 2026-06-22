export function LoadingSkeleton({ type }: { type: "cards" | "table" }) {
  if (type === "cards") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--muted)] p-5 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/10 shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-3.5 w-24 bg-white/10 rounded" />
                <div className="h-3 w-16 bg-white/5 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] overflow-hidden animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-[var(--border)] last:border-0">
          <div className="h-3.5 w-48 bg-white/10 rounded" />
          <div className="h-3 w-12 bg-white/5 rounded" />
        </div>
      ))}
    </div>
  );
}
