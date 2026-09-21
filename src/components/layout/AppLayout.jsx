import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

/* ====== Icon set (outline, lucide-style) ====== */
function Icon({ d, size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <path d={d} />
    </svg>
  );
}
const I = {
  building: 'M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01',
  user: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  chart: 'M3 3v18h18M18 17V9M13 17V5M8 17v-3',
  calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  pin: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z',
  file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
  check: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
  cap: 'M22 10v6M2 10l10-5 10 5-10 5z M6 12v5c3 3 9 3 12 0v-5',
  history: 'M12 8v4l3 3M3.05 11a9 9 0 1 1 .5 4M3 3v5h5',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H2a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 3.6 8a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H8a1.65 1.65 0 0 0 1-1.51V2a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H22a2 2 0 1 1 0 4h-.09c-.658 0-1.25.393-1.51 1z',
  help: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0',
  menu: 'M3 6h18M3 12h18M3 18h18',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4l1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4l1.4-1.4',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
};

/* ====== Bintang 8 (rub el hizb) — identitas visual ====== */
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

/* ====== Ornamen pembatas ====== */
function Ornament({ className = '' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="h-px flex-1 bg-border-subtle" />
      <Star8 size={10} className="text-gold-500" />
      <span className="h-px flex-1 bg-border-subtle" />
    </div>
  );
}

/* ====== PWA Install Button ====== */
function InstallPwaButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!isInstallable) return null;

  return (
    <button
      type="button"
      onClick={async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') setIsInstallable(false);
        setDeferredPrompt(null);
      }}
      aria-label="Install Aplikasi"
      title="Install Aplikasi"
      className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-border-subtle text-text-muted transition-all duration-300 hover:-translate-y-1 hover:border-gold-500/50 hover:text-gold-500 active:scale-95"
    >
      <Icon d={I.download} size={16} />
    </button>
  );
}

/* ====== Toggle tema (ikon) ====== */
function ThemeIconButton() {
  const { theme, toggle } = useTheme();
  const label = theme === 'dark' ? 'Mode terang' : 'Mode gelap';
  return (
    <div className="flex items-center gap-2">
      <InstallPwaButton />
      <button
        type="button"
        onClick={toggle}
        aria-label={label}
        title={label}
        className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-border-subtle text-text-muted transition-all duration-300 hover:rotate-12 hover:border-gold-500/50 hover:text-gold-500 active:scale-95"
      >
        <Icon d={theme === 'dark' ? I.sun : I.moon} size={16} />
      </button>
    </div>
  );
}

/* ====== NAV per role ====== */
const NAV = {
  superadmin: [
    { to: '/instansi', label: 'Instansi', icon: I.building },
    { to: '/admin', label: 'Admin', icon: I.user },
    { to: '/monitor', label: 'Monitor', icon: I.bell },
    { to: '/laporan', label: 'Laporan', icon: I.chart },
  ],
  admin: [
    { to: '/guru-pegawai', label: 'Guru & Pegawai', icon: I.user },
    { to: '/mapel', label: 'Mata Pelajaran', icon: I.book },
    { to: '/kelas', label: 'Kelas', icon: I.cap },
    { to: '/siswa', label: 'Data Siswa', icon: I.user },
    { to: '/jadwal', label: 'Jadwal Kerja', icon: I.history },
    { to: '/jadwal-pelajaran', label: 'Jadwal Pelajaran', icon: I.calendar },
    { to: '/izin-manual', label: 'Izin / Sakit / Alpa', icon: I.file },
    { to: '/monitor', label: 'Monitor', icon: I.bell },
    { to: '/laporan', label: 'Laporan', icon: I.chart },
  ],
  guru: [
    { to: '/absen', label: 'Absen', icon: I.check },
    { to: '/absen-siswa', label: 'Absen Siswa', icon: I.cap },
    { to: '/riwayat', label: 'Riwayat', icon: I.history },
    { to: '/laporan', label: 'Laporan', icon: I.chart },
  ],
  pegawai: [
    { to: '/absen', label: 'Absen', icon: I.check },
    { to: '/riwayat', label: 'Riwayat', icon: I.history },
  ],
};

const ROLE_LABEL = {
  superadmin: 'Superadmin',
  admin: 'Administrator',
  guru: 'Guru',
  pegawai: 'Pegawai',
};

function SidebarItem({ to, icon, label, onNavigate }) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        `group relative flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium transition-all duration-200 ease-out ${
          isActive
            ? 'bg-brand-100 text-brand-900 shadow-sm'
            : 'text-text-muted hover:translate-x-0.5 hover:bg-brand-100/70 hover:text-brand-900'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute -left-3 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-gold-500" />
          )}
          <Icon d={icon} size={16} />
          <span className="truncate">{label}</span>
        </>
      )}
    </NavLink>
  );
}

function SidebarContent({ role, onLogout, onNavigate }) {
  const items = NAV[role] || [];
  const [openPengaturan, setOpenPengaturan] = useState(false);
  const { theme, toggle } = useTheme();

  return (
    <div className="flex h-full flex-col rounded-card bg-surface-card p-3 shadow-card">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-2 py-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-800 to-brand-950 text-gold-300 shadow-md shadow-brand-950/20">
          <Star8 size={17} />
        </div>
        <div className="leading-tight">
          <span className="block font-display text-lg tracking-wide text-text-primary">SIKAP</span>
          <span className="block text-[10px] uppercase tracking-widest text-text-muted">Darussalam 2</span>
        </div>
      </div>

      <Ornament className="my-2 px-2" />

      {/* Menu */}
      <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-text-muted">Menu</p>
      <nav className="flex flex-col gap-0.5">
        {items.map((link) => (
          <SidebarItem
            key={link.to}
            to={link.to}
            icon={link.icon}
            label={link.label}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      {/* Pengaturan (collapsible) */}
      <button
        type="button"
        onClick={() => setOpenPengaturan((v) => !v)}
        className="mt-6 flex w-full cursor-pointer items-center gap-2 px-3 pb-1 pt-0 text-left text-[10px] font-semibold uppercase tracking-widest text-text-muted transition hover:text-text-primary"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 transition-transform duration-200 ${openPengaturan ? 'rotate-90' : ''}`}
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
        <span>Pengaturan</span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${
          openPengaturan ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <nav className="flex flex-col gap-0.5">
          <SidebarItem to="/pengaturan" icon={I.settings} label="Pengaturan" onNavigate={onNavigate} />
          <SidebarItem to="/bantuan" icon={I.help} label="Bantuan" onNavigate={onNavigate} />
        </nav>
      </div>

      <div className="mt-auto space-y-1 pt-3">
        <Ornament className="mb-2 px-2" />
        <button
          type="button"
          onClick={toggle}
          className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium text-text-muted transition-all duration-200 hover:bg-brand-100/70 hover:text-brand-900"
        >
          <Icon d={theme === 'dark' ? I.sun : I.moon} size={16} />
          <span>{theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}</span>
          <span className="ml-auto rounded-full border border-border-subtle px-1.5 py-0.5 text-[10px] uppercase tracking-wider">
            {theme === 'dark' ? 'Gelap' : 'Terang'}
          </span>
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl border border-status-danger-text/20 px-3 py-2 text-[13px] font-medium text-status-danger-text transition-all duration-200 hover:translate-x-0.5 hover:bg-status-danger-bg"
        >
          <Icon d={I.logout} size={16} />
          <span>Keluar</span>
        </button>
      </div>
    </div>
  );
}

function TopBar({ user, role }) {
  const today = new Date();
  const masehi = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(today);
  const hijri = (() => {
    try {
      return (
        new Intl.DateTimeFormat('id-ID-u-ca-islamic-umalqura', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }).format(today) + ' H'
      );
    } catch {
      return '';
    }
  })();

  return (
    <header className="flex items-center justify-between gap-4 border-b border-border-subtle px-5 py-4 sm:px-6">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-700">Assalamu&rsquo;alaikum</p>
        <p className="truncate text-[15px] font-semibold text-text-primary">{user?.name || 'Pengguna'}</p>
      </div>

      <div className="hidden flex-1 text-center md:block">
        <p className="text-xs text-text-muted">
          <span className="font-medium text-text-primary">{masehi}</span>
          {hijri && <span className="mx-2 text-border-subtle">|</span>}
          {hijri && <span className="font-medium text-gold-700">{hijri}</span>}
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        <ThemeIconButton />
        <button
          type="button"
          className="hidden h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-border-subtle text-text-muted transition-all duration-200 hover:bg-surface hover:text-text-primary active:scale-95 sm:inline-flex"
          aria-label="Notifikasi"
        >
          <Icon d={I.bell} size={16} />
        </button>
        <div className="hidden items-center gap-2.5 pl-1 sm:flex">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-800 to-brand-950 text-xs font-semibold text-gold-300 ring-1 ring-gold-500/30">
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="hidden leading-tight lg:block">
            <p className="text-sm font-medium text-text-primary">{ROLE_LABEL[role] || role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function AppLayout() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="relative min-h-screen p-2 sm:p-3">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-brand-500/10 blur-3xl" />
        <div className="absolute -right-40 top-1/3 h-[26rem] w-[26rem] rounded-full bg-gold-500/10 blur-3xl dark:bg-gold-500/5" />
        <div className="absolute bottom-[-10rem] left-1/3 h-[24rem] w-[24rem] rounded-full bg-brand-300/10 blur-3xl" />
      </div>

      <div className="relative flex min-h-[calc(100vh-1rem)] gap-3 sm:min-h-[calc(100vh-1.5rem)]">
        {/* Sidebar desktop */}
        <aside className="sticky top-3 hidden h-[calc(100vh-1.5rem)] w-64 shrink-0 lg:block">
          <SidebarContent role={role} user={user} onLogout={handleLogout} />
        </aside>

        {/* Sidebar mobile overlay */}
        {open && (
          <div
            className="fixed inset-0 z-40 bg-zinc-950/50 backdrop-blur-sm lg:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
        )}
        <aside
          className={`fixed inset-y-2 left-2 z-50 w-64 transform transition-transform duration-300 ease-out lg:hidden ${
            open ? 'translate-x-0' : '-translate-x-[110%]'
          }`}
        >
          <SidebarContent
            role={role}
            user={user}
            onLogout={handleLogout}
            onNavigate={() => setOpen(false)}
          />
        </aside>

        {/* Konten utama */}
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-card bg-surface-card shadow-card ring-1 ring-border-subtle/60">
          <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3 lg:hidden">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border-subtle text-text-muted transition hover:bg-surface"
                aria-label="Buka menu"
              >
                <Icon d={I.menu} size={18} />
              </button>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-800 to-brand-950 text-gold-300">
                  <Star8 size={13} />
                </div>
                <span className="font-display text-base text-text-primary">SIKAP</span>
              </div>
            </div>
            <ThemeIconButton />
          </div>
          <div className="hidden lg:block">
            <TopBar user={user} role={role} />
          </div>
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
