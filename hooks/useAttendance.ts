import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { attendanceService } from '../services/attendanceService';
import { useAttendanceStore } from '../stores/attendanceStore';

export function useTodayStatus() {
  const setToday = useAttendanceStore(s => s.setToday);
  return useQuery({
    queryKey: ['attendance', 'today'],
    queryFn: async () => {
      const data: any = await attendanceService.getTodayStatus();
      setToday(data);
      return data;
    },
  });
}

export function useCheckIn() {
  const qc = useQueryClient();
  const { setSubmitting, setToday } = useAttendanceStore();
  return useMutation({
    mutationFn: (payload: FormData) => attendanceService.checkIn(payload),
    onMutate: () => setSubmitting(true),
    onSuccess: () => {
      // Optimistically update the store so the button flips immediately
      setToday({ checked_in: true, checked_out: false });
    },
    onSettled: () => {
      setSubmitting(false);
      qc.invalidateQueries({ queryKey: ['attendance', 'today'] });
      qc.invalidateQueries({ queryKey: ['attendance', 'live'] });
      qc.invalidateQueries({ queryKey: ['attendance', 'history'] });
    },
  });
}

export function useCheckOut() {
  const qc = useQueryClient();
  const { setSubmitting, setToday } = useAttendanceStore();
  return useMutation({
    mutationFn: (payload: FormData) => attendanceService.checkOut(payload),
    onMutate: () => setSubmitting(true),
    onSuccess: () => {
      // Optimistically update the store so the button flips immediately
      setToday({ checked_in: true, checked_out: true });
    },
    onSettled: () => {
      setSubmitting(false);
      qc.invalidateQueries({ queryKey: ['attendance', 'today'] });
      qc.invalidateQueries({ queryKey: ['attendance', 'live'] });
      qc.invalidateQueries({ queryKey: ['attendance', 'history'] });
    },
  });
}

export function useAttendanceHistory(startDate?: string, endDate?: string, limit = 30) {
  return useQuery({
    queryKey: ['attendance', 'history', startDate, endDate, limit],
    queryFn: () => attendanceService.getHistory({ start_date: startDate, end_date: endDate, limit }),
  });
}
