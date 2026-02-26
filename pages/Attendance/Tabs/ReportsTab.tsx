import React from 'react';
import { useAttendanceReports } from '../../../hooks/useAttendanceData';
import AttendanceSkeleton from '../../../components/ui/AttendanceSkeleton';
import GlassCard from '../../../components/GlassCard';
import { FileText, Download, Calendar, Users, Building, Clock } from 'lucide-react';

const ReportsTab: React.FC = () => {
    const { data, isLoading, error } = useAttendanceReports();

    if (isLoading) {
        return <AttendanceSkeleton type="table" />;
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <p className="text-red-500 font-medium mb-2">Failed to load reports</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Please try again later</p>
                </div>
            </div>
        );
    }

    const reportIcons: Record<string, any> = {
        monthly: Calendar,
        employee: Users,
        department: Building,
        'late-arrivals': Clock,
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white">
                    Attendance Reports
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data?.availableReports?.map((report: any) => {
                    const Icon = reportIcons[report.id] || FileText;
                    return (
                        <GlassCard key={report.id}>
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                                            {report.name}
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                            {report.description}
                                        </p>
                                        <button className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-xs font-medium transition-colors">
                                            <Download className="w-3 h-3" />
                                            Generate Report
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    );
                })}
            </div>

            {/* Custom Report Builder */}
            <GlassCard>
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        Custom Report Builder
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-400 mb-2">
                                Report Type
                            </label>
                            <select className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20">
                                <option>Select type...</option>
                                <option>Daily Summary</option>
                                <option>Weekly Summary</option>
                                <option>Monthly Summary</option>
                                <option>Custom Range</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-400 mb-2">
                                Start Date
                            </label>
                            <input
                                type="date"
                                className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-400 mb-2">
                                End Date
                            </label>
                            <input
                                type="date"
                                className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-sm font-medium transition-colors">
                            Generate Custom Report
                        </button>
                        <button className="px-4 py-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-900 dark:text-white rounded-xl text-sm font-medium transition-colors">
                            Reset
                        </button>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
};

export default ReportsTab;
