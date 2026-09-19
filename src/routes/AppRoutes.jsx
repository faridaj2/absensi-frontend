import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AppLayout from '../components/layout/AppLayout';
import Login from '../pages/auth/Login';
import InstansiPage from '../pages/superadmin/InstansiPage';
import AdminPage from '../pages/superadmin/AdminPage';
import JadwalPage from '../pages/admin/JadwalPage';
import LokasiPage from '../pages/admin/LokasiPage';
import MapelPage from '../pages/admin/MapelPage';
import KelasPage from '../pages/admin/KelasPage';
import SiswaPage from '../pages/admin/SiswaPage';
import GuruPegawaiPage from '../pages/admin/GuruPegawaiPage';
import JadwalPelajaranPage from '../pages/admin/JadwalPelajaranPage';
import JadwalPelajaranCetakPage from '../pages/admin/JadwalPelajaranCetakPage';
import IzinManualPage from '../pages/admin/IzinManualPage';
import AbsenPage from '../pages/absensi/AbsenPage';
import AbsenSiswaPage from '../pages/guru/AbsenSiswaPage';
import RiwayatPage from '../pages/absensi/RiwayatPage';
import LaporanPage from '../pages/laporan/LaporanPage';
import LaporanCetakPage from '../pages/laporan/LaporanCetakPage';
import LaporanGuruCetakPage from '../pages/laporan/LaporanGuruCetakPage';
import MonitorPage from '../pages/monitor/MonitorPage';
import PengaturanPage from '../pages/pengaturan/PengaturanPage';
import BantuanPage from '../pages/bantuan/BantuanPage';

const HOME = {
  superadmin: '/instansi',
  admin: '/jadwal',
  guru: '/absen',
  pegawai: '/absen',
};

function RequireAuth({ children }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function RequireRole({ roles, children }) {
  const { user, role } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!roles.includes(role)) {
    return <Navigate to={HOME[role] || '/login'} replace />;
  }
  return children;
}

function Home() {
  const { role } = useAuth();
  return <Navigate to={HOME[role] || '/login'} replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/laporan/cetak"
        element={
          <RequireRole roles={['superadmin', 'admin', 'guru']}>
            <LaporanCetakPage />
          </RequireRole>
        }
      />
      <Route
        path="/laporan/cetak-guru"
        element={
          <RequireRole roles={['superadmin', 'admin']}>
            <LaporanGuruCetakPage />
          </RequireRole>
        }
      />
      <Route
        path="/jadwal-pelajaran/cetak"
        element={
          <RequireRole roles={['superadmin', 'admin']}>
            <JadwalPelajaranCetakPage />
          </RequireRole>
        }
      />
      <Route
        path="/"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Home />} />
        <Route path="instansi" element={<RequireRole roles={['superadmin']}><InstansiPage /></RequireRole>} />
        <Route path="admin" element={<RequireRole roles={['superadmin']}><AdminPage /></RequireRole>} />
        <Route path="jadwal" element={<RequireRole roles={['admin']}><JadwalPage /></RequireRole>} />
        <Route path="lokasi" element={<RequireRole roles={['admin']}><LokasiPage /></RequireRole>} />
        <Route path="mapel" element={<RequireRole roles={['admin']}><MapelPage /></RequireRole>} />
        <Route path="kelas" element={<RequireRole roles={['admin']}><KelasPage /></RequireRole>} />
        <Route path="siswa" element={<RequireRole roles={['admin']}><SiswaPage /></RequireRole>} />
        <Route path="guru-pegawai" element={<RequireRole roles={['admin']}><GuruPegawaiPage /></RequireRole>} />
        <Route path="jadwal-pelajaran" element={<RequireRole roles={['admin']}><JadwalPelajaranPage /></RequireRole>} />
        <Route path="izin-manual" element={<RequireRole roles={['admin']}><IzinManualPage /></RequireRole>} />
        <Route path="monitor" element={<RequireRole roles={['admin', 'superadmin']}><MonitorPage /></RequireRole>} />
        <Route path="absen" element={<RequireRole roles={['guru', 'pegawai']}><AbsenPage /></RequireRole>} />
        <Route path="absen-siswa" element={<RequireRole roles={['guru']}><AbsenSiswaPage /></RequireRole>} />
        <Route path="riwayat" element={<RequireRole roles={['guru', 'pegawai']}><RiwayatPage /></RequireRole>} />
        <Route path="laporan" element={<RequireRole roles={['superadmin', 'admin', 'guru']}><LaporanPage /></RequireRole>} />
        <Route path="pengaturan" element={<RequireAuth><PengaturanPage /></RequireAuth>} />
        <Route path="bantuan" element={<RequireAuth><BantuanPage /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
