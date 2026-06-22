export function Badge({ color, children }: { color: "green" | "red"; children: React.ReactNode }) {
  const cls = color === "green"
    ? "text-green-400 bg-green-500/10 border-green-500/20"
    : "text-red-400 bg-red-500/10 border-red-500/20";
  return <span className={`text-xs px-2.5 py-1 rounded-full border ${cls}`}>{children}</span>;
}
