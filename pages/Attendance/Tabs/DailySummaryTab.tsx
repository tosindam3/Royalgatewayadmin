import React, { useState } from 'react';
import { useDailySummary } from '../../../hooks/useAttendanceData';
import AttendanceSkeleton from '../../../components/ui/AttendanceSkeleton';
import GlassCard from '../../../components/GlassCard';
import { Calendar, Users, UserCheck, UserX, Clock } from 'lucide-react';

const DailySummaryTab: React.FC = () => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const { data, isLoading, error } = useDailySummary(selectedDate);

    if (isLoading) {
        return <AttendanceSkeleton type="table" />;
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <p className="text-red-500 font-medium mb-2">Failed to load daily summary</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Please try again later</p>
                </div>
            </div>
        );
    }

    const summaryCards = [
        { label: 'Total Employees', value: data?.totalEmployees || 0, icon: Users, color: 'text-blue-600' },
        { label: 'Present', value: data?.present || 0, icon: UserCheck, color: 'text-green-600' },
        { label: 'Absent', value: data?.absent || 0, icon: UserX, color: 'text-red-500' },
        { label: 'Late', value: data?.late || 0, icon: Clock, color: 'text-orange-500' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white">
                    Daily Summary
                </h2>
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="px-3 py-1.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {summaryCards.map((card) => (
                    <GlassCard key={card.label}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg bg-slate-100 dark:bg-white/5 ${card.color}`}>
                                <card.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">{card.value}</p>
                                <p className="text-xs text-slate-500 dark:text-gray-400">{card.label}</p>
                            </div>
                        </div>
                    </GlassCard>
                ))}
            </div>

            {/* Records Table */}
            <GlassCard>
                {!data?.records || data.records.length === 0 ? (
                    <div className="text-center py-12">
                        <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            No Records for {selectedDate}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Select a different date to view attendance records
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
                                        Department
                                    </th>
                                    <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
                                        Check In
                                    </th>
                                    <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
                                        Check Out
                                    </th>
                                    <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
                                        Hours
                                    </th>
                                    <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.records.map((record: any) => (
                                    <tr key={record.id} className="border-b border-gray-100 dark:border-white/5">
                                        <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                                            {record.employee_name}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                                            {record.department}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                                            {record.check_in || '-'}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                                            {record.check_out || '-'}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                                            {record.hours || '-'}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                                record.status === 'present' 
                                                    ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                                    : record.status === 'late'
                                                    ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
                                                    : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                                            }`}>
                                                {record.status}
                                            </span>
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

export default DailySummaryTab;
