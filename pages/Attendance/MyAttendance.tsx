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
  status?: string;
}

interface AttendanceLog {
  id: number;
  check_type: 'check_in' | 'check_out';
  timestamp: string;
  source: string;
  location_lat?: number;
  location_lng?: number;
  verified: boolean;
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
  const { data: historyData, isLoading } = useQuery({
    queryKey: ['my-attendance', 'history', selectedMonth],
    queryFn: async () => {
      const startDate = format(startOfMonth(parseISO(selectedMonth + '-01')), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(parseISO(selectedMonth + '-01')), 'yyyy-MM-dd');
      
      const response = await apiClient.get('/hr-core/attendance/history', {
        params: { start_date: startDate, end_date: endDate }
      });
      // apiClient already unwraps the response, so response is the data
      return (response as unknown as AttendanceLog[]) || [];
    },
  });

  // Fetch today's status
  const { data: todayStatus } = useQuery({
    queryKey: ['my-attendance', 'today'],
    queryFn: async () => {
      const response = await apiClient.get('/hr-core/attendance/today');
      // apiClient already unwraps the response, so response is the data
      return (response as unknown as TodayStatus) || { checked_in: false, checked_out: false, worked_hours: 0 };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Process attendance data
  const processedData = React.useMemo(() => {
    if (!historyData || !Array.isArray(historyData)) {
      return { days: [], stats: null };
    }

    const logs = historyData as AttendanceLog[];
    const monthStart = startOfMonth(parseISO(selectedMonth + '-01'));
    const monthEnd = endOfMonth(parseISO(selectedMonth + '-01'));
    const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Group logs by date
    const logsByDate = logs.reduce((acc, log) => {
      const date = format(parseISO(log.timestamp), 'yyyy-MM-dd');
      if (!acc[date]) acc[date] = [];
      acc[date].push(log);
      return acc;
    }, {} as Record<string, AttendanceLog[]>);

    // Create day attendance records
    const days: DayAttendance[] = allDays.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayLogs = logsByDate[dateStr] || [];
      
      const checkIn = dayLogs.find(l => l.check_type === 'check_in');
      const checkOut = dayLogs.find(l => l.check_type === 'check_out');

      let status: DayAttendance['status'] = 'absent';
      let workedHours = 0;
      let lateMinutes = 0;

      if (checkIn && checkOut) {
        status = 'present';
        const checkInTime = parseISO(checkIn.timestamp);
        const checkOutTime = parseISO(checkOut.timestamp);
        workedHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
        
        // Calculate late (assuming 9 AM start)
        const checkInHour = checkInTime.getHours();
        const checkInMinute = checkInTime.getMinutes();
        if (checkInHour > 9 || (checkInHour === 9 && checkInMinute > 15)) {
          lateMinutes = (checkInHour - 9) * 60 + checkInMinute - 15;
          status = 'late';
        }
      } else if (checkIn) {
        status = 'partial';
      }

      return {
        date: dateStr,
        status,
        check_in: checkIn?.timestamp,
        check_out: checkOut?.timestamp,
        worked_hours: workedHours,
        late_minutes: lateMinutes,
        source: checkIn?.source,
      };
    });

    // Calculate stats
    const presentDays = days.filter(d => d.status === 'present' || d.status === 'late').length;
    const absentDays = days.filter(d => d.status === 'absent').length;
    const lateDays = days.filter(d => d.status === 'late').length;
    const totalHours = days.reduce((sum, d) => sum + (d.worked_hours || 0), 0);

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
      case 'present': return 'bg-green-100 text-green-800 border-green-200';
      case 'late': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'partial': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'absent': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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
            <div className="h-8 w-48 bg-gray-200 rounded"></div>
            <div className="h-4 w-64 bg-gray-200 rounded mt-2"></div>
          </div>
          <div className="h-10 w-40 bg-gray-200 rounded"></div>
        </div>

        {/* Today's Status Skeleton */}
        <div className="bg-gray-200 rounded-lg h-32"></div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-gray-200 rounded-lg h-24"></div>
          ))}
        </div>

        {/* Calendar Skeleton */}
        <div className="bg-gray-200 rounded-lg h-96"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Attendance</h1>
          <p className="text-gray-600 mt-1">Track your attendance history and statistics</p>
        </div>
        
        {/* Month Selector */}
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Today's Status Card */}
      {todayStatus && (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Today's Status</h3>
              <div className="space-y-2">
                {todayStatus.checked_in ? (
                  <>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5" />
                      <span>Checked in at {format(parseISO(todayStatus.check_in_time), 'h:mm a')}</span>
                    </div>
                    {todayStatus.checked_out ? (
                      <div className="flex items-center space-x-2">
                        <Clock className="w-5 h-5" />
                        <span>Checked out at {format(parseISO(todayStatus.check_out_time), 'h:mm a')}</span>
                      </div>
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
              <div className="text-sm opacity-90">Hours Today</div>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Statistics */}
      {processedData.stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Present Days</p>
                <p className="text-2xl font-bold text-green-600">{processedData.stats.present_days}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Absent Days</p>
                <p className="text-2xl font-bold text-red-600">{processedData.stats.absent_days}</p>
              </div>
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Late Days</p>
                <p className="text-2xl font-bold text-yellow-600">{processedData.stats.late_days}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Hours</p>
                <p className="text-2xl font-bold text-blue-600">{processedData.stats.total_hours.toFixed(1)}h</p>
              </div>
              <TrendingUp className="w-10 h-10 text-blue-500" />
            </div>
          </div>
        </div>
      )}

      {/* Calendar View */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Attendance Calendar</h3>
          
          <div className="grid grid-cols-7 gap-2">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
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
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">
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
                    <span className="text-sm text-gray-600">
                      Source: {dayData.source}
                    </span>
                  )}
                </div>

                {dayData.check_in && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Check In</p>
                      <p className="text-lg font-semibold">{format(parseISO(dayData.check_in), 'h:mm a')}</p>
                    </div>
                    {dayData.check_out && (
                      <div>
                        <p className="text-sm text-gray-600">Check Out</p>
                        <p className="text-lg font-semibold">{format(parseISO(dayData.check_out), 'h:mm a')}</p>
                      </div>
                    )}
                  </div>
                )}

                {dayData.worked_hours && (
                  <div>
                    <p className="text-sm text-gray-600">Hours Worked</p>
                    <p className="text-lg font-semibold">{dayData.worked_hours.toFixed(2)} hours</p>
                  </div>
                )}

                {dayData.late_minutes && dayData.late_minutes > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
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
