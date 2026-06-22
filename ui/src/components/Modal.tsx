export function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-xl rounded-xl border border-[var(--border)] bg-[var(--muted)] p-6 shadow-2xl">
        {children}
      </div>
    </div>
  );
}
