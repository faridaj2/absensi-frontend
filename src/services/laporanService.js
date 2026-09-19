import apiClient from './apiClient';

export async function laporanPegawai(params = {}) {
  const { data } = await apiClient.get('/laporan/pegawai', { params });
  return data.data;
}

export async function laporanSiswa(params = {}) {
  const { data } = await apiClient.get('/laporan/siswa', { params });
  return data.data;
}

export async function filterLaporanSiswa() {
  const { data } = await apiClient.get('/laporan/siswa/filter');
  return data;
}

// (dihapus) laporanAktivitasGuru — tidak dipakai lagi

export async function laporanRekapGuru(params = {}) {
  const { data } = await apiClient.get('/laporan/rekap-guru', { params });
  return data;
}

export async function monitorHariIni(params = {}) {
  const { data } = await apiClient.get('/monitor/hari-ini', { params });
  return data;
}
