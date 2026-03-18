import apiClient from './apiClient';
import {
    AttendanceAggregate,
    AttendancePolicy,
    GeofenceZone,
    IPWhitelistEntry,
    BiometricDevice,
    AttendanceAuditLog,
    RawPunch
} from '../types';

export const attendanceService = {
    // Mobile/Self-Service Endpoints
    getTodayStatus: async () => apiClient.get('/hr-core/attendance/today'),
    
    async getOrgSettings(prefix?: string) {
        const response = await apiClient.get('/payroll/settings', { params: { prefix: prefix ?? undefined } });
        return response.data;
    },

    checkIn: async (payload: FormData) => {
        try {
            return await apiClient.post('/hr-core/attendance/check-in', payload);
        } catch (error: any) {
            if (!navigator.onLine) {
                attendanceService.saveOfflineLog('check_in', payload);
                throw new Error('Offline: Check-in saved and will sync when online.');
            }
            throw error;
        }
    },

    checkOut: async (payload: FormData) => {
        try {
            return await apiClient.post('/hr-core/attendance/check-out', payload);
        } catch (error: any) {
            if (!navigator.onLine) {
                this.saveOfflineLog('check_out', payload);
                throw new Error('Offline: Check-out saved and will sync when online.');
            }
            throw error;
        }
    },

    getHistory: async (params: any) => apiClient.get('/hr-core/attendance/history', { params }),
    getLive: async (): Promise<any[]> => apiClient.get('/hr-core/attendance/live'),
    getOverview: async (): Promise<any> => apiClient.get('/hr-core/attendance/overview'),
    getDailySummary: async (date?: string): Promise<any> =>
        apiClient.get('/hr-core/attendance/daily-summary', { params: { date } }),
    getOvertime: async (params?: any): Promise<any[]> =>
        apiClient.get('/hr-core/attendance/overtime', { params }),

    // Offline Persistence
    saveOfflineLog: (type: 'check_in' | 'check_out', payload: FormData) => {
        const logs = JSON.parse(localStorage.getItem('attendance_offline_logs') || '[]');
        const entry = {
            type,
            timestamp: new Date().toISOString(),
            latitude: payload.get('latitude'),
            longitude: payload.get('longitude'),
            sync_status: 'pending'
        };
        logs.push(entry);
        localStorage.setItem('attendance_offline_logs', JSON.stringify(logs));
    },

    syncOfflineLogs: async () => {
        const logs = JSON.parse(localStorage.getItem('attendance_offline_logs') || '[]');
        if (logs.length === 0) return;

        for (const log of logs) {
            try {
                const fd = new FormData();
                fd.append('latitude', log.latitude);
                fd.append('longitude', log.longitude);
                fd.append('timestamp', log.timestamp); // Backend must support this for backfilling
                fd.append('source', 'mobile_app');

                const endpoint = log.type === 'check_in' ? '/hr-core/attendance/check-in' : '/hr-core/attendance/check-out';
                await apiClient.post(endpoint, fd);
                
                // Remove synced log
                const currentLogs = JSON.parse(localStorage.getItem('attendance_offline_logs') || '[]');
                const filtered = currentLogs.filter((l: any) => l.timestamp !== log.timestamp);
                localStorage.setItem('attendance_offline_logs', JSON.stringify(filtered));
            } catch (e) {
                console.error('Failed to sync offline log:', e);
            }
        }
    },

    // Admin/Settings Endpoints
    getSettings: async (): Promise<AttendancePolicy> => apiClient.get('/hr-core/attendance/settings'),
    updateSettings: async (data: Partial<AttendancePolicy>) => apiClient.put('/hr-core/attendance/settings', data),

    // Geofencing
    getGeofences: async (params?: any): Promise<GeofenceZone[]> => apiClient.get('/hr-core/attendance/settings/geofences', { params }),
    createGeofence: async (data: any) => apiClient.post('/hr-core/attendance/settings/geofences', data),
    updateGeofence: async (id: string, data: any) => apiClient.put(`/hr-core/attendance/settings/geofences/${id}`, data),
    deleteGeofence: async (id: string) => apiClient.delete(`/hr-core/attendance/settings/geofences/${id}`),
    testGeofence: async (payload: { latitude: number; longitude: number }) =>
        apiClient.post('/hr-core/attendance/settings/geofences/test', payload),

    // IP Whitelisting
    getIPWhitelist: async (params?: any): Promise<IPWhitelistEntry[]> =>
        apiClient.get('/hr-core/attendance/settings/ip-whitelist', { params }),
    createIPEntry: async (data: any) => apiClient.post('/hr-core/attendance/settings/ip-whitelist', data),
    updateIPEntry: async (id: string, data: any) => apiClient.put(`/hr-core/attendance/settings/ip-whitelist/${id}`, data),
    deleteIPEntry: async (id: string) => apiClient.delete(`/hr-core/attendance/settings/ip-whitelist/${id}`),
    getMyIP: async (): Promise<{ ip: string }> => apiClient.get('/hr-core/attendance/settings/my-ip'),

    // Biometric Devices
    getDevices: async (params?: any): Promise<BiometricDevice[]> =>
        apiClient.get('/hr-core/attendance/settings/biometric/devices', { params }),
    createDevice: async (data: any) => apiClient.post('/hr-core/attendance/settings/biometric/devices', data),
    updateDevice: async (id: string | number, data: any) => apiClient.put(`/hr-core/attendance/settings/biometric/devices/${id}`, data),
    deleteDevice: async (id: string | number) => apiClient.delete(`/hr-core/attendance/settings/biometric/devices/${id}`),
    testDeviceConnection: async (id: string | number) => apiClient.post(`/hr-core/attendance/settings/biometric/devices/${id}/test`),
    syncDevice: async (id: string | number) => apiClient.post(`/hr-core/attendance/settings/biometric/devices/${id}/sync`),

    // Audit
    getAuditLogs: async (params?: any): Promise<AttendanceAuditLog[]> =>
        apiClient.get('/hr-core/attendance/settings/audit', { params }),

    // ===== SUMMARY TAB (Monthly Aggregates) =====
    getSummaryKpis: async (month: string, filters: any = {}): Promise<any> =>
        apiClient.get('/hr-core/attendance/summary/kpis', { params: { month, ...filters } }),

    getSummaryTable: async (month: string, filters: any = {}, page: number = 1, pageSize: number = 50): Promise<any> =>
        apiClient.get('/hr-core/attendance/summary', { params: { month, page, pageSize, ...filters } }),

    getEmployeeMonthDetail: async (employeeId: number, month: string): Promise<any> =>
        apiClient.get(`/hr-core/attendance/summary/${employeeId}`, { params: { month } }),

    getRecordDetails: async (recordId: number): Promise<any> =>
        apiClient.get(`/hr-core/attendance/records/${recordId}/details`),

    exportSummary: async (month: string, filters: any = {}): Promise<any> =>
        apiClient.post('/hr-core/attendance/summary/export', { month, ...filters }),
};
