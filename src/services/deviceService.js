import apiClient from './apiClient';

export async function registerDevice() {
  const { data } = await apiClient.post('/device/register');
  return data;
}

export async function requestDeviceChange(payload) {
  const { data } = await apiClient.post('/device/change-request', payload);
  return data;
}

export async function checkDeviceStatus() {
  const { data } = await apiClient.get('/device/status');
  return data;
}

export async function getDeviceRequests() {
  const { data } = await apiClient.get('/device-requests');
  return data;
}

export async function approveDeviceRequest(id) {
  const { data } = await apiClient.post(`/device-requests/${id}/approve`);
  return data;
}

export async function rejectDeviceRequest(id, note) {
  const { data } = await apiClient.post(`/device-requests/${id}/reject`, { note });
  return data;
}

export async function getDevices() {
  const { data } = await apiClient.get('/devices');
  return data;
}

export async function revokeDevice(id) {
  const { data } = await apiClient.post(`/devices/${id}/revoke`);
  return data;
}

export async function getDeviceAuditLogs() {
  const { data } = await apiClient.get('/device-audit-logs');
  return data;
}
