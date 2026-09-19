import apiClient from './apiClient';

export async function listKodeAdmin() {
  const { data } = await apiClient.get('/instansi/kode-admin');
  return data;
}

export async function listInstansi() {
  const { data } = await apiClient.get('/instansi');
  return data.data;
}

export async function createInstansi(payload) {
  const { data } = await apiClient.post('/instansi', payload);
  return data.data;
}

export async function updateInstansi(id, payload) {
  const { data } = await apiClient.put(`/instansi/${id}`, payload);
  return data.data;
}

export async function deleteInstansi(id) {
  await apiClient.delete(`/instansi/${id}`);
}

export async function listAdmin() {
  const { data } = await apiClient.get('/admin');
  return data.data;
}

export async function createAdmin(payload) {
  const { data } = await apiClient.post('/admin', payload);
  return data.data;
}

export async function updateAdmin(id, payload) {
  const { data } = await apiClient.put(`/admin/${id}`, payload);
  return data.data;
}

export async function deleteAdmin(id) {
  await apiClient.delete(`/admin/${id}`);
}

export async function listUsers() {
  const { data } = await apiClient.get('/users');
  return data.data;
}

export async function createUser(payload) {
  const { data } = await apiClient.post('/users', payload);
  return data.data;
}

export async function updateUser(id, payload) {
  const { data } = await apiClient.put(`/users/${id}`, payload);
  return data.data;
}

export async function deleteUser(id) {
  await apiClient.delete(`/users/${id}`);
}
