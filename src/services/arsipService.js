import apiClient from './apiClient';

export const arsipService = {
  getAll: async () => {
    const res = await apiClient.get('/arsip-laporan');
    return res.data;
  },
  generate: async (periode) => {
    const res = await apiClient.post('/arsip-laporan', { periode });
    return res.data;
  },
  delete: async (periode) => {
    const res = await apiClient.delete(`/arsip-laporan/${periode}`);
    return res.data;
  }
};
