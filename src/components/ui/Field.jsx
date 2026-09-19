export function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-text-primary">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  'w-full rounded-xl border border-border-subtle bg-surface px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted transition-all duration-200 hover:border-brand-200 focus:border-brand-500 focus:bg-surface-card focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:opacity-60';

export function TextInput({ className = '', ...props }) {
  return <input {...props} className={`${inputCls} ${className}`} />;
}

export function SelectInput({ options = [], placeholder, className = '', ...props }) {
  return (
    <select {...props} className={`${inputCls} cursor-pointer ${className}`}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
