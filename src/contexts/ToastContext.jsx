import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ToastContext = createContext(null);

let notifAudio = null;
function getNotifAudio() {
  if (typeof Audio === 'undefined') return null;
  if (!notifAudio) {
    notifAudio = new Audio('/notif.wav');
    notifAudio.preload = 'auto';
    notifAudio.volume = 0.5;
  }
  return notifAudio;
}

function playNotif() {
  try {
    const audio = getNotifAudio();
    if (!audio) return;
    audio.currentTime = 0;
    const p = audio.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  } catch {
    // ignore autoplay errors
  }
}

const VARIANTS = {
  success: {
    bg: 'bg-status-success-bg',
    text: 'text-status-success-text',
    ring: 'ring-status-success-text/20',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6L9 17l-5-5" />
      </svg>
    ),
  },
  error: {
    bg: 'bg-status-danger-bg',
    text: 'text-status-danger-text',
    ring: 'ring-status-danger-text/20',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
  warning: {
    bg: 'bg-status-warning-bg',
    text: 'text-status-warning-text',
    ring: 'ring-status-warning-text/20',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  info: {
    bg: 'bg-status-info-bg',
    text: 'text-status-info-text',
    ring: 'ring-status-info-text/20',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message, options = {}) => {
      const id = ++idRef.current;
      const variant = options.variant || 'info';
      const duration = options.duration ?? 3500;
      if (options.sound !== false) playNotif();
      setToasts((prev) => [...prev, { id, message, variant, title: options.title }]);
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss]
  );

  const api = {
    show,
    dismiss,
    success: (msg, opts) => show(msg, { ...opts, variant: 'success' }),
    error: (msg, opts) => show(msg, { ...opts, variant: 'error' }),
    warning: (msg, opts) => show(msg, { ...opts, variant: 'warning' }),
    info: (msg, opts) => show(msg, { ...opts, variant: 'info' }),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((t) => {
          const v = VARIANTS[t.variant] || VARIANTS.info;
          return (
            <div
              key={t.id}
              role="alert"
              className={`animate-toast-in pointer-events-auto flex items-start gap-3 rounded-card ${v.bg} ${v.text} px-4 py-3 shadow-lg ring-1 ${v.ring}`}
            >
              <div className="mt-0.5 shrink-0">{v.icon}</div>
              <div className="min-w-0 flex-1 text-sm leading-snug">
                {t.title && <p className="font-semibold">{t.title}</p>}
                <p className={t.title ? 'text-xs opacity-90' : 'font-medium'}>{t.message}</p>
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Tutup notifikasi"
                className="mt-0.5 shrink-0 cursor-pointer rounded-full p-1 text-current opacity-60 transition hover:bg-black/5 dark:hover:bg-white/10 hover:opacity-100"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast harus dipakai di dalam <ToastProvider>.');
  }
  return ctx;
}
