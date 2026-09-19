export function Card({ className = '', children }) {
  return (
    <div
      className={`animate-scale-in rounded-card bg-surface-card p-5 shadow-card transition-shadow duration-300 hover:shadow-lg hover:shadow-zinc-900/5 sm:p-6 ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold text-text-primary">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
