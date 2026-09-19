import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { extractError } from '../../services/apiClient';

const HOME = {
  superadmin: '/instansi',
  admin: '/jadwal',
  guru: '/absen',
  pegawai: '/absen',
};

function Star8({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="7" y="7" width="10" height="10" rx="0.5" />
      <rect x="7" y="7" width="10" height="10" rx="0.5" transform="rotate(45 12 12)" />
    </svg>
  );
}

export default function Login() {
  const { login } = useAuth();
  const { theme, toggle } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    import('../../services/authService').then(m => m.checkSetup()).then(req => {
      if (req) navigate('/register', { replace: true });
    }).catch(() => {});
  }, [navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Selamat datang, ${user.name}!`);
      navigate(HOME[user.role] || '/', { replace: true });
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4 sm:p-6">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-500/15 blur-3xl" />
        <div className="absolute -right-32 bottom-0 h-[26rem] w-[26rem] rounded-full bg-gold-500/10 blur-3xl dark:bg-gold-500/5" />
      </div>

      {/* Toggle tema */}
      <button
        type="button"
        onClick={toggle}
        aria-label={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}
        className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border-subtle bg-surface-card/80 text-text-muted backdrop-blur transition-all duration-300 hover:rotate-12 hover:border-gold-500/50 hover:text-gold-500 active:scale-95"
      >
        {theme === 'dark' ? (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4l1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4l1.4-1.4" />
          </svg>
        ) : (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8" />
          </svg>
        )}
      </button>

      <div className="relative grid w-full max-w-4xl overflow-hidden rounded-card bg-surface-card shadow-card ring-1 ring-border-subtle/60 md:grid-cols-[1.05fr_1fr]">
        {/* ===== Panel brand ===== */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[#12503E] via-[#0E4234] to-[#07231B] p-9 text-white md:flex">
          {/* Ornamen arch (mihrab) */}
          <svg
            className="pointer-events-none absolute -bottom-24 -right-16 h-[28rem] w-[28rem] text-gold-300 opacity-[0.12]"
            viewBox="0 0 240 320"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M30 320 V150 Q30 60 120 24 Q210 60 210 150 V320" />
            <path d="M55 320 V155 Q55 82 120 52 Q185 82 185 155 V320" />
            <rect x="105" y="130" width="30" height="30" transform="rotate(45 120 145)" />
            <circle cx="120" cy="145" r="5" />
          </svg>

          <div className="relative flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-gold-300 ring-1 ring-gold-300/40">
              <Star8 size={17} />
            </div>
            <span className="font-display text-lg tracking-wide">SIKAP</span>
          </div>

          <div className="relative">
            <p className="font-arabic text-2xl leading-relaxed text-gold-300">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ</p>
            <h1 className="mt-4 font-display text-3xl leading-snug">
              Sistem Kehadiran
              <br />
              Darussalam 2
            </h1>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/70">
              Memantau kehadiran guru, pegawai, dan siswa dalam satu naungan — tertib, tepat, dan amanah.
            </p>
          </div>

          <div className="relative flex items-center gap-2 text-[11px] uppercase tracking-widest text-white/40">
            <Star8 size={10} className="text-gold-300/60" />
            <span>© {new Date().getFullYear()} SIKAP</span>
          </div>
        </div>

        {/* ===== Form ===== */}
        <div className="p-8 sm:p-10">
          <h2 className="font-display text-3xl text-text-primary">Ahlan wa sahlan</h2>
          <p className="mt-1.5 text-sm text-text-muted">Masuk untuk melanjutkan ke dashboard Anda.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-text-primary">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="nama@sekolah.sch.id"
                className="w-full rounded-xl border border-border-subtle bg-surface px-3.5 py-2.5 text-sm text-text-primary transition placeholder:text-text-muted/70 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-text-primary">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full rounded-xl border border-border-subtle bg-surface px-3.5 py-2.5 text-sm text-text-primary transition placeholder:text-text-muted/70 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full cursor-pointer rounded-full bg-gradient-to-r from-brand-800 to-brand-900 px-4 py-2.5 text-sm font-semibold text-text-inverse shadow-md shadow-brand-900/20 transition-all duration-200 hover:shadow-lg hover:shadow-brand-900/30 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>

          <p className="mt-8 text-center text-xs leading-relaxed text-text-muted">
            Belum punya akun? Hubungi administrator instansi.
          </p>
        </div>
      </div>
    </div>
  );
}
