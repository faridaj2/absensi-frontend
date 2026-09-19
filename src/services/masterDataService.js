import apiClient from './apiClient';

export async function listJadwal() {
  const { data } = await apiClient.get('/jadwal');
  return data.data;
}

export async function simpanJadwal(payload) {
  const { data } = await apiClient.post('/jadwal', payload);
  return data.data;
}

export async function updateJadwal(id, payload) {
  const { data } = await apiClient.put(`/jadwal/${id}`, payload);
  return data.data;
}

export async function hapusJadwal(id) {
  await apiClient.delete(`/jadwal/${id}`);
}

export async function listLokasi() {
  const { data } = await apiClient.get('/lokasi');
  return data.data;
}

export async function simpanLokasi(payload) {
  const { data } = await apiClient.post('/lokasi', payload);
  return data.data;
}

export async function listMapel() {
  const { data } = await apiClient.get('/mapel');
  return data.data;
}

export async function simpanMapel(payload) {
  const { data } = await apiClient.post('/mapel', payload);
  return data.data;
}

export async function updateMapel(id, payload) {
  const { data } = await apiClient.put(`/mapel/${id}`, payload);
  return data.data;
}

export async function hapusMapel(id) {
  await apiClient.delete(`/mapel/${id}`);
}

export async function listAssignment(params = {}) {
  const { data } = await apiClient.get('/guru-mapel-kelas', { params });
  return data.data;
}

export async function simpanAssignment(payload) {
  const { data } = await apiClient.post('/guru-mapel-kelas', payload);
  return data.data;
}

export async function updateAssignment(id, payload) {
  const { data } = await apiClient.put(`/guru-mapel-kelas/${id}`, payload);
  return data.data;
}

export async function hapusAssignment(id) {
  await apiClient.delete(`/guru-mapel-kelas/${id}`);
}

export async function listKelas() {
  const { data } = await apiClient.get('/kelas');
  return data.data;
}

export async function simpanKelas(payload) {
  const { data } = await apiClient.post('/kelas', payload);
  return data.data;
}

export async function updateKelas(id, payload) {
  const { data } = await apiClient.put(`/kelas/${id}`, payload);
  return data.data;
}

export async function hapusKelas(id) {
  await apiClient.delete(`/kelas/${id}`);
}

export async function syncKelas() {
  const { data } = await apiClient.post('/kelas/sync');
  return data;
}

export async function listSiswa(kelasId) {
  const { data } = await apiClient.get(`/siswa/kelas/${kelasId}`);
  return data.data;
}
