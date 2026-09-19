const VARIANTS = {
  primary:
    'bg-brand-900 text-text-inverse hover:bg-brand-700 hover:shadow-md hover:shadow-brand-900/20 focus:ring-brand-200 active:scale-[0.97]',
  secondary:
    'border border-border-subtle bg-surface-card text-text-primary hover:bg-surface hover:border-brand-200 focus:ring-brand-100 active:scale-[0.97]',
  ghost:
    'text-text-muted hover:bg-brand-100 hover:text-brand-900 focus:ring-brand-100 active:scale-[0.97]',
  danger:
    'bg-status-danger-bg text-status-danger-text hover:bg-red-200 focus:ring-red-200 active:scale-[0.97]',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) {
  const sizeCls =
    size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm';
  return (
    <button
      {...props}
      className={`inline-flex cursor-pointer select-none items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 ease-out focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:shadow-none ${sizeCls} ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
