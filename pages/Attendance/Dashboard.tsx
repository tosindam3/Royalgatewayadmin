import { useState, useEffect, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useTodayStatus, useCheckIn, useCheckOut, useAttendanceHistory } from '../../hooks/useAttendance';
import { Clock, MapPin, CheckCircle, XCircle, Calendar, RefreshCcw } from 'lucide-react';
import { attendanceService } from '../../services/attendanceService';
import { toast } from 'sonner';

// Skeleton shown while data loads
function LogsSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-16 bg-gray-100 dark:bg-white/5 rounded-lg" />
      ))}
    </div>
  );
}

// Sync button component
function SyncButton() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [offlineCount, setOfflineCount] = useState(0);

  useEffect(() => {
    const logs = JSON.parse(localStorage.getItem('attendance_offline_logs') || '[]');
    setOfflineCount(logs.length);
  }, []);

  const handleSync = async () => {
    if (offlineCount === 0) return;
    setIsSyncing(true);
    try {
      await attendanceService.syncOfflineLogs();
      const logs = JSON.parse(localStorage.getItem('attendance_offline_logs') || '[]');
      setOfflineCount(logs.length);
      if (logs.length === 0) {
        toast.success('All offline logs synced successfully');
      }
    } catch (e) {
      toast.error('Failed to sync some logs');
    } finally {
      setIsSyncing(false);
    }
  };

  if (offlineCount === 0) return null;

  return (
    <button
      onClick={handleSync}
      disabled={isSyncing}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg text-xs font-bold uppercase transition-all hover:bg-amber-100 disabled:opacity-50"
    >
      <RefreshCcw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
      {isSyncing ? 'Syncing...' : `${offlineCount} Pending`}
    </button>
  );
}

// Recent logs component
function RecentLogs() {
  const { data: logs, isLoading } = useAttendanceHistory(undefined, undefined, 30);
  
  if (isLoading) return <LogsSkeleton />;
  
  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No attendance records yet</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-200 dark:divide-white/5">
      {logs.map((log: any) => (
        <li key={log.id} className="py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {log.check_type === 'check_in' ? (
              <CheckCircle className={`w-5 h-5 ${log.status === 'late' ? 'text-amber-500' : 'text-green-600'}`} />
            ) : (
              <XCircle className={`w-5 h-5 ${log.status === 'early_exit' ? 'text-amber-500' : 'text-red-500'}`} />
            )}
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm text-gray-900 dark:text-white">
                  {log.check_type === 'check_in' ? 'Check In' : 'Check Out'}
                </p>
                {log.status && log.status !== 'on_time' && (
                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                    log.status === 'late' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {log.status.replace('_', ' ')}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(log.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 capitalize">
            {log.source.replace('_', ' ')}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function Dashboard() {
  const { data: status, isLoading: statusLoading } = useTodayStatus();
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const { checked_in, checked_out, check_in_time, check_out_time } = status ?? {};

  const handleCheckIn = () => {
    setIsGettingLocation(true);
    
    // Get geolocation if available
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const fd = new FormData();
          fd.append('latitude', position.coords.latitude.toString());
          fd.append('longitude', position.coords.longitude.toString());
          try {
            await checkIn.mutateAsync(fd);
          } catch (e: any) {
            toast.info(e.message);
          } finally {
            setIsGettingLocation(false);
          }
        },
        async () => {
          const fd = new FormData();
          try {
            await checkIn.mutateAsync(fd);
          } catch (e: any) {
            toast.info(e.message);
          } finally {
            setIsGettingLocation(false);
          }
        }
      );
    } else {
      const fd = new FormData();
      checkIn.mutate(fd);
      setIsGettingLocation(false);
    }
  };

  const handleCheckOut = () => {
    setIsGettingLocation(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const fd = new FormData();
          fd.append('latitude', position.coords.latitude.toString());
          fd.append('longitude', position.coords.longitude.toString());
          try {
            await checkOut.mutateAsync(fd);
          } catch (e: any) {
            toast.info(e.message);
          } finally {
            setIsGettingLocation(false);
          }
        },
        async () => {
          const fd = new FormData();
          try {
            await checkOut.mutateAsync(fd);
          } catch (e: any) {
            toast.info(e.message);
          } finally {
            setIsGettingLocation(false);
          }
        }
      );
    } else {
      const fd = new FormData();
      checkOut.mutate(fd);
      setIsGettingLocation(false);
    }
  };

  if (statusLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-white/5 rounded w-1/4 mb-6"></div>
          <div className="h-48 bg-gray-200 dark:bg-white/5 rounded-xl mb-6"></div>
          <div className="h-64 bg-gray-200 dark:bg-white/5 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Attendance</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Calendar className="w-4 h-4" />
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Status Card */}
      <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Today's Status</p>
          </div>
          
          <SyncButton />
        </div>

        <div className="space-y-4">
          {/* Action Buttons */}
          <div className="flex gap-3">
            {!checked_in && (
              <button
                onClick={handleCheckIn}
                disabled={checkIn.isPending || isGettingLocation}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {checkIn.isPending || isGettingLocation ? 'Checking in…' : 'Check In'}
              </button>
            )}
            {checked_in && !checked_out && (
              <button
                onClick={handleCheckOut}
                disabled={checkOut.isPending || isGettingLocation}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {checkOut.isPending || isGettingLocation ? 'Checking out…' : 'Check Out'}
              </button>
            )}
            {checked_in && checked_out && (
              <div className="flex-1 text-center py-3 px-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg font-medium">
                ✓ Day Complete
              </div>
            )}
          </div>

          {/* Time Display */}
          {check_in_time && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-white/10">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Check In</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {new Date(check_in_time).toLocaleTimeString()}
                </p>
              </div>
              {check_out_time && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Check Out</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(check_out_time).toLocaleTimeString()}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recent Logs */}
      <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Recent Activity</h2>
        <ErrorBoundary fallback={<p className="text-red-500 text-sm">Failed to load logs.</p>}>
          <Suspense fallback={<LogsSkeleton />}>
            <RecentLogs />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}
