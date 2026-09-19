import { useEffect } from 'react';
import { createPortal } from 'react-dom';

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export default function Modal({ open, onClose, title, subtitle, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
      <div
        className="animate-fade-in fixed inset-0 bg-zinc-950/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`animate-slide-up relative z-10 w-full ${SIZES[size]} max-h-[92vh] overflow-hidden rounded-t-card bg-surface-card shadow-2xl sm:rounded-card`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border-subtle px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 id="modal-title" className="text-base font-semibold text-text-primary">
              {title}
            </h2>
            {subtitle && <p className="mt-0.5 text-xs text-text-muted">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="-mr-1 mt-0.5 inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-text-muted transition hover:bg-surface hover:text-text-primary"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="max-h-[calc(92vh-8rem)] overflow-y-auto px-5 py-5 sm:px-6">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-border-subtle bg-surface px-5 py-3 sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
