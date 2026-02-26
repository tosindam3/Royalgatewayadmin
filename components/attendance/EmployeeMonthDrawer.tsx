import React, { useState } from 'react';
import { X, User, Building, Calendar, Eye } from 'lucide-react';
import { useEmployeeMonthDetail } from '../../hooks/useAttendanceData';
import GlassCard from '../GlassCard';
import SummaryKpiCard from './SummaryKpiCard';
import AnomalyChip from './AnomalyChip';
import GeofenceBadge from './GeofenceBadge';
import SourcesBadge from './SourcesBadge';
import DayDetailsModal from './DayDetailsModal';

interface EmployeeMonthDrawerProps {
    employeeId: number;
    employeeName: string;
    month: string;
    onClose: () => void;
}

const EmployeeMonthDrawer: React.FC<EmployeeMonthDrawerProps> = ({
    employeeId,
    employeeName,
    month,
    onClose,
}) => {
    const { data, isLoading, error } = useEmployeeMonthDetail(employeeId, month);
    const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);

    const formatTime = (isoString: string | null) => {
        if (!isoString) return '—';
        return new Date(isoString).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        });
    };

    const formatMinutes = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    const formatHours = (minutes: number) => {
        return (minutes / 60).toFixed(1);
    };

    return (
        <>
            <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 overflow-y-auto">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-6xl my-auto max-h-[85vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/10 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-lg">
                            {employeeName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                {employeeName}
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-gray-400">
                                {new Date(month + '-01').toLocaleDateString('en-US', { 
                                    month: 'long',
                                    year: 'numeric'
                                })}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/50 dark:hover:bg-white/5 rounded-xl transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {isLoading && (
                        <div className="space-y-4">
                            <div className="animate-pulse space-y-4">
                                <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl" />
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl" />
                                    <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl" />
                                    <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl" />
                                </div>
                                <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded-xl" />
                            </div>
                        </div>
                    )}

                    {error && (
                        <GlassCard>
                            <div className="text-center py-12">
                                <p className="text-red-500 font-medium mb-2">Failed to load employee details</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Please try again later</p>
                            </div>
                        </GlassCard>
                    )}

                    {data && (
                        <>
                            {/* Employee Info Card */}
                            <GlassCard>
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-400">
                                            <User className="w-4 h-4" />
                                            <span>Staff ID: {data.employee.staff_id}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-400">
                                            <Building className="w-4 h-4" />
                                            <span>{data.employee.department} • {data.employee.branch}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-400">
                                            <Calendar className="w-4 h-4" />
                                            <span>{data.kpis.working_days} working days</span>
                                        </div>
                                    </div>
                                    
                                    {/* Anomaly Chips */}
                                    <div className="flex flex-wrap gap-2 justify-end">
                                        {data.anomalies.missing_punches > 0 && (
                                            <AnomalyChip type="missing_punch" count={data.anomalies.missing_punches} />
                                        )}
                                        {data.anomalies.geofence_fails > 0 && (
                                            <AnomalyChip type="geofence_fail" count={data.anomalies.geofence_fails} />
                                        )}
                                        {data.anomalies.duplicates > 0 && (
                                            <AnomalyChip type="duplicate" count={data.anomalies.duplicates} />
                                        )}
                                        {data.anomalies.edited > 0 && (
                                            <AnomalyChip type="edited" count={data.anomalies.edited} />
                                        )}
                                    </div>
                                </div>
                            </GlassCard>

                            {/* KPI Cards */}
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="bg-white dark:bg-white/5 rounded-xl p-4 border border-gray-200 dark:border-white/10">
                                    <p className="text-xs text-slate-500 dark:text-gray-400 mb-1">Present Days</p>
                                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                        {data.kpis.present_days}
                                    </p>
                                </div>
                                <div className="bg-white dark:bg-white/5 rounded-xl p-4 border border-gray-200 dark:border-white/10">
                                    <p className="text-xs text-slate-500 dark:text-gray-400 mb-1">Absent Days</p>
                                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                                        {data.kpis.absent_days}
                                    </p>
                                </div>
                                <div className="bg-white dark:bg-white/5 rounded-xl p-4 border border-gray-200 dark:border-white/10">
                                    <p className="text-xs text-slate-500 dark:text-gray-400 mb-1">Late Minutes</p>
                                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                        {data.kpis.late_minutes}
                                    </p>
                                </div>
                                <div className="bg-white dark:bg-white/5 rounded-xl p-4 border border-gray-200 dark:border-white/10">
                                    <p className="text-xs text-slate-500 dark:text-gray-400 mb-1">Overtime</p>
                                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                        {formatMinutes(data.kpis.overtime_minutes)}
                                    </p>
                                </div>
                                <div className="bg-white dark:bg-white/5 rounded-xl p-4 border border-gray-200 dark:border-white/10">
                                    <p className="text-xs text-slate-500 dark:text-gray-400 mb-1">Worked Hours</p>
                                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                        {formatHours(data.kpis.worked_minutes)}h
                                    </p>
                                </div>
                                <div className="bg-white dark:bg-white/5 rounded-xl p-4 border border-gray-200 dark:border-white/10">
                                    <p className="text-xs text-slate-500 dark:text-gray-400 mb-2">Sources</p>
                                    <SourcesBadge sources={data.kpis.sources} compact />
                                </div>
                            </div>

                            {/* Daily Breakdown Table */}
                            <GlassCard>
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
                                    Daily Breakdown
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-200 dark:border-white/10">
                                                <th className="text-left py-3 px-2 text-xs font-bold uppercase text-gray-600 dark:text-gray-400">Date</th>
                                                <th className="text-left py-3 px-2 text-xs font-bold uppercase text-gray-600 dark:text-gray-400">Shift</th>
                                                <th className="text-left py-3 px-2 text-xs font-bold uppercase text-gray-600 dark:text-gray-400">In</th>
                                                <th className="text-left py-3 px-2 text-xs font-bold uppercase text-gray-600 dark:text-gray-400">Out</th>
                                                <th className="text-left py-3 px-2 text-xs font-bold uppercase text-gray-600 dark:text-gray-400">Worked</th>
                                                <th className="text-left py-3 px-2 text-xs font-bold uppercase text-gray-600 dark:text-gray-400">Late</th>
                                                <th className="text-left py-3 px-2 text-xs font-bold uppercase text-gray-600 dark:text-gray-400">OT</th>
                                                <th className="text-left py-3 px-2 text-xs font-bold uppercase text-gray-600 dark:text-gray-400">Status</th>
                                                <th className="text-center py-3 px-2 text-xs font-bold uppercase text-gray-600 dark:text-gray-400">Geo</th>
                                                <th className="text-left py-3 px-2 text-xs font-bold uppercase text-gray-600 dark:text-gray-400">Source</th>
                                                <th className="text-center py-3 px-2 text-xs font-bold uppercase text-gray-600 dark:text-gray-400">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.days.map((day: any) => (
                                                <tr key={day.id} className="border-b border-gray-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5">
                                                    <td className="py-3 px-2 text-slate-900 dark:text-white font-medium">
                                                        {new Date(day.work_date).toLocaleDateString('en-US', { 
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                    </td>
                                                    <td className="py-3 px-2 text-slate-600 dark:text-gray-400">
                                                        {day.shift_name}
                                                    </td>
                                                    <td className="py-3 px-2 text-slate-600 dark:text-gray-400 font-mono text-xs">
                                                        {formatTime(day.clock_in_at)}
                                                    </td>
                                                    <td className="py-3 px-2 text-slate-600 dark:text-gray-400 font-mono text-xs">
                                                        {formatTime(day.clock_out_at)}
                                                    </td>
                                                    <td className="py-3 px-2 text-slate-600 dark:text-gray-400">
                                                        {formatMinutes(day.worked_minutes)}
                                                    </td>
                                                    <td className="py-3 px-2 text-orange-600 dark:text-orange-400">
                                                        {day.late_minutes > 0 ? formatMinutes(day.late_minutes) : '—'}
                                                    </td>
                                                    <td className="py-3 px-2 text-blue-600 dark:text-blue-400">
                                                        {day.overtime_minutes > 0 ? formatMinutes(day.overtime_minutes) : '—'}
                                                    </td>
                                                    <td className="py-3 px-2">
                                                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                                            day.status === 'present' 
                                                                ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                                                : day.status === 'partial'
                                                                ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                                                                : day.status === 'leave'
                                                                ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                                                                : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                                                        }`}>
                                                            {day.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-2">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <GeofenceBadge status={day.geofence.in} />
                                                            <span className="text-gray-400">/</span>
                                                            <GeofenceBadge status={day.geofence.out} />
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-2 text-xs text-slate-600 dark:text-gray-400">
                                                        {day.source.in || '—'} / {day.source.out || '—'}
                                                    </td>
                                                    <td className="py-3 px-2 text-center">
                                                        <button
                                                            onClick={() => setSelectedRecordId(day.id)}
                                                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                                                        >
                                                            <Eye className="w-3 h-3" />
                                                            View
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </GlassCard>
                        </>
                    )}
                </div>
            </div>
            </div>

            {/* Day Details Modal */}
            {selectedRecordId && (
                <DayDetailsModal
                    recordId={selectedRecordId}
                    onClose={() => setSelectedRecordId(null)}
                />
            )}
        </>
    );
};

export default EmployeeMonthDrawer;
