import { toast } from 'sonner';
import { playSuccessSound, playErrorSound, playWarningSound, playInfoSound } from './soundUtils';

// Track recent toasts to prevent duplicates
const recentToasts = new Map<string, number>();
const TOAST_DEBOUNCE_MS = 2000; // Don't show same message within 2 seconds

/**
 * Show a success toast with deduplication and sound
 */
export const showSuccessToast = (message: string) => {
  const now = Date.now();
  const lastShown = recentToasts.get(message);
  
  if (!lastShown || now - lastShown > TOAST_DEBOUNCE_MS) {
    recentToasts.set(message, now);
    toast.success(message);
    playSuccessSound();
    
    // Cleanup old entries
    setTimeout(() => recentToasts.delete(message), TOAST_DEBOUNCE_MS);
  }
};

/**
 * Show an error toast with deduplication and sound
 */
export const showErrorToast = (message: string) => {
  const now = Date.now();
  const lastShown = recentToasts.get(message);
  
  if (!lastShown || now - lastShown > TOAST_DEBOUNCE_MS) {
    recentToasts.set(message, now);
    toast.error(message);
    playErrorSound();
    
    // Cleanup old entries
    setTimeout(() => recentToasts.delete(message), TOAST_DEBOUNCE_MS);
  }
};

/**
 * Show an info toast with deduplication and sound
 */
export const showInfoToast = (message: string) => {
  const now = Date.now();
  const lastShown = recentToasts.get(message);
  
  if (!lastShown || now - lastShown > TOAST_DEBOUNCE_MS) {
    recentToasts.set(message, now);
    toast.info(message);
    playInfoSound();
    
    // Cleanup old entries
    setTimeout(() => recentToasts.delete(message), TOAST_DEBOUNCE_MS);
  }
};

/**
 * Show a warning toast with deduplication and sound
 */
export const showWarningToast = (message: string) => {
  const now = Date.now();
  const lastShown = recentToasts.get(message);
  
  if (!lastShown || now - lastShown > TOAST_DEBOUNCE_MS) {
    recentToasts.set(message, now);
    toast.warning(message);
    playWarningSound();
    
    // Cleanup old entries
    setTimeout(() => recentToasts.delete(message), TOAST_DEBOUNCE_MS);
  }
};
