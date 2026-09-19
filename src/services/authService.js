import apiClient from './apiClient';

export async function login(email, password) {
  const { data } = await apiClient.post('/login', { email, password });
  return data;
}

export async function logout() {
  await apiClient.post('/logout');
}

export async function me() {
  const { data } = await apiClient.get('/me');
  return data.data;
}

export async function updateProfile(payload) {
  const { data } = await apiClient.put('/profile', payload);
  return data.data;
}

export async function updatePassword(payload) {
  const { data } = await apiClient.put('/profile/password', payload);
  return data;
}
