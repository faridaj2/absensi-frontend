import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Avatar, Input } from '@heroui/react';
import { useAuth } from '../../contexts/AuthContext';

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
  dashboard: 'M3 12l9-9 9 9M5 10v10a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1V10',
  building: 'M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01',
  user: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  chart: 'M3 3v18h18M18 17V9M13 17V5M8 17v-3',
  calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  pin: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z',
  link: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
  swap: 'M16 3h5v5M21 3l-7 7M8 21H3v-5M3 21l7-7',
  file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
  check: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
  cap: 'M22 10v6M2 10l10-5 10 5-10 5z M6 12v5c3 3 9 3 12 0v-5',
  history: 'M12 8v4l3 3M3.05 11a9 9 0 1 1 .5 4M3 3v5h5',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H2a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 3.6 8a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H8a1.65 1.65 0 0 0 1-1.51V2a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H22a2 2 0 1 1 0 4h-.09c-.658 0-1.25.393-1.51 1z',
  help: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  search: 'M21 21l-4.35-4.35M17 11a6 6 0 1 1-12 0 6 6 0 0 1 12 0z',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0',
  menu: 'M3 6h18M3 12h18M3 18h18',
  close: 'M18 6L6 18M6 6l12 12',
};

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
    { to: '/lokasi', label: 'Lokasi Absen', icon: I.pin },
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
        `group relative flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-all duration-150 ease-out ${
          isActive
            ? 'bg-brand-200 text-brand-900'
            : 'text-text-muted hover:translate-x-0.5 hover:bg-brand-100 hover:text-brand-900'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute -left-4 top-1/2 h-4 w-1 -translate-y-1/2 rounded-r-full bg-brand-900" />
          )}
          <span className={isActive ? 'text-brand-900' : 'text-text-muted'}>
            <Icon d={icon} size={16} />
          </span>
          <span className="truncate">{label}</span>
        </>
      )}
    </NavLink>
  );
}

function SidebarContent({ role, user, onLogout, onNavigate }) {
  const items = NAV[role] || [];
  const [openPengaturan, setOpenPengaturan] = useState(false);

  return (
    <div className="flex h-full flex-col bg-surface-card rounded-card p-3">
      {/* Brand */}
      <div className="flex items-center gap-2 px-2 py-1.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-900 text-text-inverse">
          <Icon d={I.check} size={16} />
        </div>
                      <span className="text-base font-semibold text-text-primary">SIKAP</span>
      </div>

      {/* Menu */}
      <p className="px-2.5 pt-2.5 pb-1 text-[10px] font-semibold tracking-wider text-text-muted uppercase">
        Menu
      </p>
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

      {/* Pengaturan (collapsible, default tertutup) */}
      <button
        type="button"
        onClick={() => setOpenPengaturan((v) => !v)}
        className="mt-6 flex w-full cursor-pointer items-center gap-2 px-2.5 pb-1 pt-0 text-left text-[10px] font-semibold tracking-wider text-text-muted uppercase transition hover:text-text-primary"
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

      <div className="mt-auto pt-3">
        <button
          type="button"
          onClick={onLogout}
          className="relative flex w-full cursor-pointer items-center gap-2.5 rounded-lg border border-status-danger-bg px-2.5 py-1.5 text-[13px] font-medium text-status-danger-text transition-all duration-150 ease-out hover:translate-x-0.5 hover:bg-status-danger-bg"
        >
          <Icon d={I.logout} size={16} />
          <span>Keluar</span>
        </button>
      </div>
    </div>
  );
}

function TopBar({ user, role }) {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-border-subtle px-6 py-4">
      <div className="relative max-w-sm flex-1">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
          <Icon d={I.search} size={16} />
        </span>
        <input
          type="search"
          placeholder="Cari guru, pegawai, atau kelas..."
          className="w-full rounded-full border border-border-subtle bg-surface-card py-2 pl-9 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="hidden h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-border-subtle text-text-muted transition-all duration-200 hover:bg-surface hover:text-text-primary active:scale-95 sm:inline-flex"
          aria-label="Notifikasi"
        >
          <Icon d={I.bell} size={16} />
        </button>
        <div className="flex items-center gap-3 pl-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-900 text-xs font-semibold text-text-inverse">
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="hidden leading-tight sm:block">
            <p className="text-sm font-medium text-text-primary">{user?.name || 'User'}</p>
            <p className="text-xs text-text-muted">{ROLE_LABEL[role] || role}</p>
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
    <div className="relative min-h-screen bg-surface p-2 sm:p-3">
      {/* Background blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-brand-500/25 blur-3xl" />
        <div className="absolute -right-40 top-1/3 h-[32rem] w-[32rem] rounded-full bg-brand-900/15 blur-3xl" />
        <div className="absolute bottom-[-10rem] left-1/3 h-[26rem] w-[26rem] rounded-full bg-brand-200/40 blur-3xl" />
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
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-card bg-surface-card shadow-card">
          <div className="flex items-center gap-3 border-b border-border-subtle px-4 py-3 lg:hidden">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle text-text-muted transition hover:bg-surface"
              aria-label="Buka menu"
            >
              <Icon d={I.menu} size={18} />
            </button>
                            <span className="text-sm font-semibold text-text-primary">SIKAP</span>
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
