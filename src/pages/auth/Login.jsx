import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { extractError } from '../../services/apiClient';

const HOME = {
  superadmin: '/instansi',
  admin: '/jadwal',
  guru: '/absen',
  pegawai: '/absen',
};

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface p-4">
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-500/30 blur-3xl" />
        <div className="absolute -right-32 bottom-0 h-[28rem] w-[28rem] rounded-full bg-brand-900/20 blur-3xl" />
        <div className="absolute left-1/4 top-1/2 h-72 w-72 rounded-full bg-brand-200/50 blur-3xl" />
      </div>

      <div className="relative grid w-full max-w-4xl overflow-hidden rounded-card bg-surface-card shadow-card md:grid-cols-2">
        {/* Brand panel */}
        <div className="relative hidden flex-col justify-between bg-gradient-to-br from-brand-900 to-brand-950 p-8 text-text-inverse md:flex">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
            <span className="text-lg font-semibold">SIKAP</span>
          </div>

          <div>
            <h1 className="text-3xl font-bold leading-tight">
              Sistem Kehadiran
              <br />
              Darussalam 2
            </h1>
            <p className="mt-3 max-w-xs text-sm text-text-inverse/70">
              Pantau kehadiran guru, pegawai, dan siswa dalam satu dashboard terpadu.
            </p>
          </div>

          <div className="text-xs text-text-inverse/50">© {new Date().getFullYear()} SIKAP</div>
        </div>

        {/* Form panel */}
        <div className="p-8">
          <h2 className="text-2xl font-semibold text-text-primary">Masuk</h2>
          <p className="mt-1 text-sm text-text-muted">Gunakan akun yang terdaftar.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-text-primary">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="nama@sekolah.sch.id"
                className="rounded-xl border border-border-subtle bg-surface px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-500 focus:bg-surface-card focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-text-primary">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="rounded-xl border border-border-subtle bg-surface px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-500 focus:bg-surface-card focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full cursor-pointer rounded-full bg-brand-900 px-4 py-2.5 text-sm font-semibold text-text-inverse transition-all duration-200 ease-out hover:bg-brand-700 hover:shadow-md hover:shadow-brand-900/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-text-muted">
            Belum punya akun? Hubungi administrator instansi.
          </p>
        </div>
      </div>
    </div>
  );
}
