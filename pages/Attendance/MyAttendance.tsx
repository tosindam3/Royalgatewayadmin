import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Clock, TrendingUp, AlertCircle, 
  CheckCircle, XCircle, Timer
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from 'date-fns';

interface TodayStatus {
  checked_in: boolean;
  checked_out: boolean;
  check_in_time?: string;
  check_out_time?: string;
  worked_hours?: number;
  worked_minutes?: number;
  required_minutes?: number;
  completion_status?: 'complete' | 'partial' | 'working' | 'incomplete';
  late_minutes?: number;
  status?: string;
}

interface AttendanceRecord {
  id: number;
  date: string;
  check_in_time?: string;
  check_out_time?: string;
  worked_minutes: number;
  worked_hours: number;
  late_minutes: number;
  status: 'present' | 'absent' | 'partial' | 'late';
  source: string;
}

interface DayAttendance {
  date: string;
  status: 'present' | 'absent' | 'partial' | 'late';
  check_in?: string;
  check_out?: string;
  worked_hours?: number;
  late_minutes?: number;
  source?: string;
}

interface MonthlyStats {
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  total_hours: number;
  avg_check_in: string;
  avg_check_out: string;
}

export default function MyAttendance() {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Fetch monthly attendance history
  const { data: historyData, isLoading, error } = useQuery<AttendanceRecord[]>({
    queryKey: ['my-attendance', 'history', selectedMonth],
    queryFn: async () => {
      const startDate = format(startOfMonth(parseISO(selectedMonth + '-01')), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(parseISO(selectedMonth + '-01')), 'yyyy-MM-dd');
      
      console.log('Fetching attendance history:', { startDate, endDate });
      const response = await apiClient.get('/hr-core/attendance/history', {
        params: { start_date: startDate, end_date: endDate }
      });
      console.log('Attendance history response:', response);
      const data = response as unknown as AttendanceRecord[];
      return Array.isArray(data) ? data : [];
    },
  });

  // Fetch today's status
  const { data: todayStatus } = useQuery<TodayStatus>({
    queryKey: ['my-attendance', 'today'],
    queryFn: async () => {
      console.log('Fetching today status...');
      const response = await apiClient.get('/hr-core/attendance/today');
      console.log('Today status response:', response);
      const data = response as unknown as TodayStatus;
      return data || { checked_in: false, checked_out: false, worked_hours: 0 };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Process attendance data
  const processedData = React.useMemo(() => {
    if (!historyData || !Array.isArray(historyData) || historyData.length === 0) {
      // Return empty state with zero stats
      const monthStart = startOfMonth(parseISO(selectedMonth + '-01'));
      const monthEnd = endOfMonth(parseISO(selectedMonth + '-01'));
      const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
      
      const emptyDays: DayAttendance[] = allDays.map(day => ({
        date: format(day, 'yyyy-MM-dd'),
        status: 'absent',
        worked_hours: 0,
      }));
      
      return { 
        days: emptyDays, 
        stats: {
          total_days: allDays.length,
          present_days: 0,
          absent_days: allDays.length,
          late_days: 0,
          total_hours: 0,
          avg_check_in: '09:00',
          avg_check_out: '17:00',
        }
      };
    }

    const records = historyData as AttendanceRecord[];
    const monthStart = startOfMonth(parseISO(selectedMonth + '-01'));
    const monthEnd = endOfMonth(parseISO(selectedMonth + '-01'));
    const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Create a map of records by date
    const recordsByDate = records.reduce((acc, record) => {
      acc[record.date] = record;
      return acc;
    }, {} as Record<string, AttendanceRecord>);

    // Create day attendance records
    const days: DayAttendance[] = allDays.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const record = recordsByDate[dateStr];

      if (!record) {
        return {
          date: dateStr,
          status: 'absent',
          worked_hours: 0,
        };
      }

      return {
        date: dateStr,
        status: record.status,
        check_in: record.check_in_time,
        check_out: record.check_out_time,
        worked_hours: record.worked_hours,
        late_minutes: record.late_minutes,
        source: record.source,
      };
    });

    // Calculate stats from aggregated records
    const presentDays = records.filter(r => r.status === 'present' || r.status === 'partial').length;
    const absentDays = allDays.length - presentDays;
    const lateDays = records.filter(r => r.late_minutes > 0).length;
    const totalHours = records.reduce((sum, r) => sum + r.worked_hours, 0);

    console.log('Processed stats:', { presentDays, absentDays, lateDays, totalHours, totalDays: allDays.length });

    const stats: MonthlyStats = {
      total_days: allDays.length,
      present_days: presentDays,
      absent_days: absentDays,
      late_days: lateDays,
      total_hours: totalHours,
      avg_check_in: '09:00',
      avg_check_out: '17:00',
    };

    return { days, stats };
  }, [historyData, selectedMonth]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'late': return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      case 'partial': return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'absent': return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle className="w-4 h-4" />;
      case 'late': return <AlertCircle className="w-4 h-4" />;
      case 'partial': return <Timer className="w-4 h-4" />;
      case 'absent': return <XCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded mt-2"></div>
          </div>
          <div className="h-10 w-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>

        {/* Today's Status Skeleton */}
        <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-32"></div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-lg h-24"></div>
          ))}
        </div>

        {/* Calendar Skeleton */}
        <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-96"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-2">Failed to load attendance data</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Attendance</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Track your attendance history and statistics</p>
        </div>
        
        {/* Month Selector */}
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Today's Status Card */}
      {todayStatus && (
        <div className={`rounded-lg shadow-lg p-6 text-white ${
          todayStatus.completion_status === 'complete' 
            ? 'bg-gradient-to-r from-green-500 to-green-600' 
            : todayStatus.completion_status === 'partial'
            ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
            : todayStatus.completion_status === 'working'
            ? 'bg-gradient-to-r from-blue-500 to-blue-600'
            : 'bg-gradient-to-r from-gray-500 to-gray-600'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Today's Status</h3>
              <div className="space-y-2">
                {todayStatus.checked_in ? (
                  <>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5" />
                      <span>Checked in at {format(parseISO(todayStatus.check_in_time!), 'h:mm a')}</span>
                      {todayStatus.late_minutes && todayStatus.late_minutes > 0 && (
                        <span className="text-xs bg-white/20 px-2 py-1 rounded">
                          Late by {todayStatus.late_minutes}m
                        </span>
                      )}
                    </div>
                    {todayStatus.checked_out ? (
                      <>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-5 h-5" />
                          <span>Checked out at {format(parseISO(todayStatus.check_out_time!), 'h:mm a')}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {todayStatus.completion_status === 'complete' ? (
                            <>
                              <CheckCircle className="w-5 h-5" />
                              <span>Working hours fulfilled ✓</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-5 h-5" />
                              <span>Partial - {((todayStatus.worked_minutes || 0) / (todayStatus.required_minutes || 480) * 100).toFixed(0)}% of required hours</span>
                            </>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Timer className="w-5 h-5" />
                        <span>Currently working...</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5" />
                    <span>Not checked in yet</span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">
                {todayStatus.worked_hours ? `${todayStatus.worked_hours.toFixed(1)}h` : '0h'}
              </div>
              <div className="text-sm opacity-90">
                {todayStatus.required_minutes ? `of ${(todayStatus.required_minutes / 60).toFixed(0)}h required` : 'Hours Today'}
              </div>
              {todayStatus.completion_status === 'complete' && (
                <div className="mt-2">
                  <CheckCircle className="w-6 h-6 mx-auto" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Monthly Statistics */}
      {processedData.stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Present Days</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{processedData.stats.present_days}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500 dark:text-green-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Absent Days</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{processedData.stats.absent_days}</p>
              </div>
              <XCircle className="w-10 h-10 text-red-500 dark:text-red-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Late Days</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{processedData.stats.late_days}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-yellow-500 dark:text-yellow-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Hours</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{processedData.stats.total_hours.toFixed(1)}h</p>
              </div>
              <TrendingUp className="w-10 h-10 text-blue-500 dark:text-blue-400" />
            </div>
          </div>
        </div>
      )}

      {/* Calendar View */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Attendance Calendar</h3>
          
          <div className="grid grid-cols-7 gap-2">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-600 dark:text-gray-400 py-2">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {processedData.days.map((day, index) => {
              const date = parseISO(day.date);
              const dayOfWeek = date.getDay();
              
              // Add empty cells for first week
              if (index === 0) {
                return (
                  <React.Fragment key={day.date}>
                    {Array.from({ length: dayOfWeek }).map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-square" />
                    ))}
                    <button
                      onClick={() => setSelectedDate(day.date)}
                      className={`aspect-square border-2 rounded-lg p-2 hover:shadow-md transition-shadow ${getStatusColor(day.status)}`}
                    >
                      <div className="text-sm font-medium">{format(date, 'd')}</div>
                      <div className="flex justify-center mt-1">
                        {getStatusIcon(day.status)}
                      </div>
                    </button>
                  </React.Fragment>
                );
              }

              return (
                <button
                  key={day.date}
                  onClick={() => setSelectedDate(day.date)}
                  className={`aspect-square border-2 rounded-lg p-2 hover:shadow-md transition-shadow ${getStatusColor(day.status)}`}
                >
                  <div className="text-sm font-medium">{format(date, 'd')}</div>
                  <div className="flex justify-center mt-1">
                    {getStatusIcon(day.status)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Day Details */}
      {selectedDate && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            {format(parseISO(selectedDate), 'EEEE, MMMM d, yyyy')}
          </h3>
          
          {(() => {
            const dayData = processedData.days.find(d => d.date === selectedDate);
            if (!dayData) return null;

            return (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(dayData.status)}`}>
                    {dayData.status.toUpperCase()}
                  </span>
                  {dayData.source && (
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Source: {dayData.source}
                    </span>
                  )}
                </div>

                {dayData.check_in && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Check In</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{format(parseISO(dayData.check_in), 'h:mm a')}</p>
                    </div>
                    {dayData.check_out && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Check Out</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">{format(parseISO(dayData.check_out), 'h:mm a')}</p>
                      </div>
                    )}
                  </div>
                )}

                {dayData.worked_hours && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Hours Worked</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{dayData.worked_hours.toFixed(2)} hours</p>
                  </div>
                )}

                {dayData.late_minutes && dayData.late_minutes > 0 && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <p className="text-sm text-yellow-800 dark:text-yellow-400">
                      Late by {dayData.late_minutes} minutes
                    </p>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
