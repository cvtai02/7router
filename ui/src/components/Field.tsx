export const inputCls = "w-full bg-black/30 border border-[var(--border)] focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none transition-colors placeholder:text-gray-600";
export const labelCls = "block text-xs text-gray-400 mb-1.5";

export function Field({ label, value, onChange, placeholder, required, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean; type?: string;
}) {
  return (
    <div>
      <label className={labelCls}>{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
      <input required={required} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputCls} />
    </div>
  );
}
