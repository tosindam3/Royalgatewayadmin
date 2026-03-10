import api from './apiClient';

export interface BiometricDevice {
  id?: number;
  device_name: string;
  device_serial?: string;
  ip_address: string;
  port: number;
  location?: string;
  workplace_id?: number;
  is_active?: boolean;
}

export interface ImportStats {
  total: number;
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export const attendanceApi = {
  // Biometric Devices
  async getDevices() {
    const response = await api.get('/hr-core/biometric-devices');
    return response.data;
  },

  async createDevice(device: BiometricDevice) {
    const response = await api.post('/hr-core/biometric-devices', device);
    return response.data;
  },

  async updateDevice(id: number, device: Partial<BiometricDevice>) {
    const response = await api.put(`/hr-core/biometric-devices/${id}`, device);
    return response.data;
  },

  async deleteDevice(id: number) {
    const response = await api.delete(`/hr-core/biometric-devices/${id}`);
    return response.data;
  },

  async testConnection(id: number) {
    const response = await api.post(`/hr-core/biometric-devices/${id}/test`);
    return response.data;
  },

  async syncDevice(id: number) {
    const response = await api.post(`/hr-core/biometric-devices/${id}/sync`);
    return response.data;
  },

  async syncAllDevices() {
    const response = await api.post('/hr-core/biometric-devices/sync-all');
    return response.data;
  },

  // Attendance Import
  async importFile(file: File, source: string = 'usb') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('source', source);

    const response = await api.post('/hr-core/attendance/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getImportHistory() {
    const response = await api.get('/hr-core/attendance/import/history');
    return response.data;
  },
};
