import React from 'react';
import { useLiveAttendance } from '../../../hooks/useAttendanceData';
import AttendanceSkeleton from '../../../components/ui/AttendanceSkeleton';
import GlassCard from '../../../components/GlassCard';
import { Activity, CheckCircle, XCircle, Clock } from 'lucide-react';

const LiveAttendanceTab: React.FC = () => {
    const { data: records = [], isLoading, error } = useLiveAttendance();

    if (isLoading) {
        return <AttendanceSkeleton type="table" />;
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <p className="text-red-500 font-medium mb-2">Failed to load live attendance</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Please try again later</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white">
                    Live Attendance
                </h2>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-bold text-green-700 dark:text-green-400">LIVE</span>
                </div>
            </div>

            <GlassCard>
                {records.length === 0 ? (
                    <div className="text-center py-12">
                        <Activity className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            No Live Activity
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Real-time attendance updates will appear here
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-white/10">
                                    <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
                                        Employee
                                    </th>
                                    <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
                                        Status
                                    </th>
                                    <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
                                        Check In
                                    </th>
                                    <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
                                        Check Out
                                    </th>
                                    <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
                                        Duration
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.map((record: any) => (
                                    <tr key={record.id} className="border-b border-gray-100 dark:border-white/5">
                                        <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                                            {record.employee_name}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                                record.status === 'present' 
                                                    ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                                    : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400'
                                            }`}>
                                                {record.status === 'present' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                                {record.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                                            {record.check_in || '-'}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                                            {record.check_out || '-'}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                                            {record.duration || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </GlassCard>
        </div>
    );
};

export default LiveAttendanceTab;
