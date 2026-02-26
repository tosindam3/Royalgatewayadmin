import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface TodayStatus {
  checked_in: boolean;
  checked_out: boolean;
  check_in_time: string | null;
  check_out_time: string | null;
  check_in_source: string | null;
  check_out_source: string | null;
}

interface AttendanceStore {
  today: TodayStatus | null;
  policy: import('../types').AttendancePolicy | null;
  isSubmitting: boolean;
  currentPosition: { lat: number; lng: number; accuracy: number } | null;
  isLocationAllowed: boolean;
  setToday: (s: Partial<TodayStatus>) => void;
  setPolicy: (p: import('../types').AttendancePolicy) => void;
  setSubmitting: (v: boolean) => void;
  setPosition: (pos: { lat: number; lng: number; accuracy: number } | null) => void;
  setLocationAllowed: (v: boolean) => void;
}

export const useAttendanceStore = create<AttendanceStore>()(
  immer(set => ({
    today: null,
    policy: null,
    isSubmitting: false,
    currentPosition: null,
    isLocationAllowed: false,
    setToday: status => set(state => {
      if (!state.today) {
        // If no existing state, initialise with sensible defaults
        state.today = {
          checked_in: false,
          checked_out: false,
          check_in_time: null,
          check_out_time: null,
          check_in_source: null,
          check_out_source: null,
          ...status as TodayStatus,
        };
      } else {
        // Merge partial update into existing state
        Object.assign(state.today, status);
      }
    }),
    setPolicy: p => set(state => { state.policy = p }),
    setSubmitting: v => set(state => { state.isSubmitting = v }),
    setPosition: pos => set(state => { state.currentPosition = pos }),
    setLocationAllowed: v => set(state => { state.isLocationAllowed = v }),
  }))
);
