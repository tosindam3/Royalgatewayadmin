import React, { useState } from 'react';
import { useOvertimeRecords } from '../../../hooks/useAttendanceData';
import AttendanceSkeleton from '../../../components/ui/AttendanceSkeleton';
import GlassCard from '../../../components/GlassCard';
import { Clock, TrendingUp, Calendar } from 'lucide-react';

const OvertimeTab: React.FC = () => {
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setDate(1)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    const { data: records = [], isLoading, error } = useOvertimeRecords(dateRange.start, dateRange.end);

    if (isLoading) {
        return <AttendanceSkeleton type="table" />;
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <p className="text-red-500 font-medium mb-2">Failed to load overtime records</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Please try again later</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white">
                    Overtime Management
                </h2>
                <div className="flex items-center gap-2">
                    <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="px-3 py-1.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                    <span className="text-gray-500">to</span>
                    <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="px-3 py-1.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                </div>
            </div>

            <GlassCard>
                {records.length === 0 ? (
                    <div className="text-center py-12">
                        <Clock className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            No Overtime Records
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Overtime hours will be tracked and displayed here
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
                                        Date
                                    </th>
                                    <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
                                        Regular Hours
                                    </th>
                                    <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
                                        Overtime Hours
                                    </th>
                                    <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.map((record: any) => (
                                    <tr key={record.id} className="border-b border-gray-100 dark:border-white/5">
                                        <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                                            {record.employee_name}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                                            {record.date}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                                            {record.regular_hours}h
                                        </td>
                                        <td className="py-3 px-4 text-sm font-medium text-orange-600 dark:text-orange-400">
                                            {record.overtime_hours}h
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                                record.status === 'approved' 
                                                    ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                                    : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
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

export default OvertimeTab;
