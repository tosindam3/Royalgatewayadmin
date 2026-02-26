import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { attendanceService } from '../services/attendanceService';
import { GeofenceZone, IPWhitelistEntry, BiometricDevice } from '../types';
import { toast } from 'sonner';

export function useGeofences(branchId?: string) {
    return useQuery({
        queryKey: ['attendance', 'settings', 'geofences', branchId],
        queryFn: () => attendanceService.getGeofences({ branch_id: branchId }),
    });
}

export function useCreateGeofence() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => attendanceService.createGeofence(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['attendance', 'settings', 'geofences'] });
            toast.success('Geofence created successfully');
        },
    });
}

export function useUpdateGeofence() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => attendanceService.updateGeofence(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['attendance', 'settings', 'geofences'] });
            toast.success('Geofence updated');
        },
    });
}

export function useDeleteGeofence() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => attendanceService.deleteGeofence(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['attendance', 'settings', 'geofences'] });
            toast.success('Geofence removed');
        },
    });
}

export function useIPWhitelist() {
    return useQuery({
        queryKey: ['attendance', 'settings', 'ip-whitelist'],
        queryFn: () => attendanceService.getIPWhitelist(),
    });
}

export function useMyIP() {
    return useQuery({
        queryKey: ['attendance', 'settings', 'my-ip'],
        queryFn: () => attendanceService.getMyIP(),
    });
}

export function useBiometricDevices() {
    return useQuery({
        queryKey: ['attendance', 'settings', 'biometric', 'devices'],
        queryFn: () => attendanceService.getDevices(),
    });
}

export function useSyncDevice() {
    return useMutation({
        mutationFn: (id: string | number) => attendanceService.syncDevice(id),
        onSuccess: () => {
            toast.success('Device sync initiated');
        },
    });
}
