import apiClient from './apiClient';

export async function absenPegawai(formData) {
  const { data } = await apiClient.post('/absensi/pegawai', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
}

export async function riwayatAbsensi(params = {}) {
  const { data } = await apiClient.get('/absensi/pegawai', { params });
  return data.data;
}

export async function absenManual(payload) {
  const { data } = await apiClient.post('/absensi/manual', payload);
  return data.data;
}

export async function slotHariIni() {
  const { data } = await apiClient.get('/absensi-siswa/slot');
  return data;
}

export async function daftarSiswaSlot(slotId) {
  const { data } = await apiClient.get(`/absensi-siswa/${slotId}/siswa`);
  return data.data;
}

export async function submitAbsensiSiswa(payload) {
  const { data } = await apiClient.post('/absensi-siswa', payload);
  return data.data;
}

export async function releaseSlot(slotId) {
  const { data } = await apiClient.post(`/absensi-siswa/${slotId}/release`);
  return data;
}

export async function claimSlot(slotId) {
  const { data } = await apiClient.post(`/absensi-siswa/${slotId}/claim`);
  return data;
}
