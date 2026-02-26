import React, { useState } from 'react';
import { useAttendanceCorrections } from '../../../hooks/useAttendanceData';
import AttendanceSkeleton from '../../../components/ui/AttendanceSkeleton';
import GlassCard from '../../../components/GlassCard';
import { CheckSquare, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

const CorrectionsTab: React.FC = () => {
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const { data: corrections = [], isLoading, error } = useAttendanceCorrections(statusFilter === 'all' ? undefined : statusFilter);

    if (isLoading) {
        return <AttendanceSkeleton type="table" />;
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <p className="text-red-500 font-medium mb-2">Failed to load corrections</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Please try again later</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white">
                    Attendance Corrections
                </h2>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-1.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                </select>
            </div>

            <GlassCard>
                {corrections.length === 0 ? (
                    <div className="text-center py-12">
                        <CheckSquare className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            No Correction Requests
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Attendance correction requests will appear here
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
                                        Type
                                    </th>
                                    <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
                                        Reason
                                    </th>
                                    <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
                                        Status
                                    </th>
                                    <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {corrections.map((correction: any) => (
                                    <tr key={correction.id} className="border-b border-gray-100 dark:border-white/5">
                                        <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                                            {correction.employee_name}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                                            {correction.date}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                                            {correction.type}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                                            {correction.reason}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                                correction.status === 'approved' 
                                                    ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                                    : correction.status === 'rejected'
                                                    ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                                                    : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                                            }`}>
                                                {correction.status === 'approved' && <CheckCircle className="w-3 h-3" />}
                                                {correction.status === 'rejected' && <XCircle className="w-3 h-3" />}
                                                {correction.status === 'pending' && <AlertCircle className="w-3 h-3" />}
                                                {correction.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            {correction.status === 'pending' && (
                                                <div className="flex gap-2">
                                                    <button className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded text-xs font-medium hover:bg-green-200 dark:hover:bg-green-900/30">
                                                        Approve
                                                    </button>
                                                    <button className="px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded text-xs font-medium hover:bg-red-200 dark:hover:bg-red-900/30">
                                                        Reject
                                                    </button>
                                                </div>
                                            )}
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

export default CorrectionsTab;
