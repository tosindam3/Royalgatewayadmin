import React from 'react';
import { useAttendanceOverview } from '../../../hooks/useAttendanceData';
import AttendanceSkeleton from '../../../components/ui/AttendanceSkeleton';
import GlassCard from '../../../components/GlassCard';
import { Users, UserX, Clock, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const OverviewTab: React.FC = () => {
    const { data, isLoading, error } = useAttendanceOverview();

    if (isLoading) {
        return <AttendanceSkeleton type="overview" />;
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <p className="text-red-500 font-medium mb-2">Failed to load overview data</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Please try again later</p>
                </div>
            </div>
        );
    }

    const stats = [
        { label: 'Present Today', value: data?.todayPresent || 0, icon: Users, color: 'text-green-600' },
        { label: 'Absent Today', value: data?.todayAbsent || 0, icon: UserX, color: 'text-red-500' },
        { label: 'Late Arrivals', value: data?.todayLate || 0, icon: Clock, color: 'text-orange-500' },
        { label: 'On Leave', value: data?.todayOnLeave || 0, icon: Calendar, color: 'text-blue-500' },
    ];

    // Calculate attendance rate
    const totalEmployees = data?.totalEmployees || 0;
    const attendanceRate = totalEmployees > 0 
        ? ((data?.todayPresent || 0) / totalEmployees * 100).toFixed(1)
        : 0;

    // Format weekly trend data for chart
    const weeklyTrendData = data?.weeklyTrend?.map((item: any) => ({
        date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        present: item.present,
    })) || [];

    // Calculate trend direction
    const getTrendDirection = () => {
        if (!weeklyTrendData || weeklyTrendData.length < 2) return null;
        const recent = weeklyTrendData[weeklyTrendData.length - 1]?.present || 0;
        const previous = weeklyTrendData[weeklyTrendData.length - 2]?.present || 0;
        return recent > previous ? 'up' : recent < previous ? 'down' : 'stable';
    };

    const trendDirection = getTrendDirection();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white">
                    Overview & Analytics
                </h2>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <GlassCard key={stat.label}>
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl bg-slate-100 dark:bg-white/5 ${stat.color}`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                                <p className="text-xs text-slate-500 dark:text-gray-400">{stat.label}</p>
                            </div>
                        </div>
                    </GlassCard>
                ))}
            </div>

            {/* Attendance Rate & Weekly Trend */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Attendance Rate Card */}
                <GlassCard>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-600 dark:text-gray-400">Attendance Rate</p>
                            {trendDirection === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
                            {trendDirection === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
                        </div>
                        <div className="flex items-baseline gap-2">
                            <p className="text-4xl font-bold text-slate-900 dark:text-white">{attendanceRate}%</p>
                            <p className="text-sm text-slate-500 dark:text-gray-400">
                                {data?.todayPresent || 0} / {totalEmployees}
                            </p>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-3">
                            <div 
                                className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${attendanceRate}%` }}
                            />
                        </div>
                    </div>
                </GlassCard>

                {/* Weekly Trend Chart */}
                <GlassCard className="lg:col-span-2">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">7-Day Attendance Trend</h3>
                            <span className="text-xs text-slate-500 dark:text-gray-400">Last 7 days</span>
                        </div>
                        {weeklyTrendData.length > 0 ? (
                            <div className="h-48 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={weeklyTrendData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                        <XAxis 
                                            dataKey="date" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fontSize: 11, fill: '#64748b' }} 
                                        />
                                        <YAxis 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fontSize: 11, fill: '#64748b' }}
                                        />
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: '#1e293b', 
                                                border: 'none', 
                                                borderRadius: '8px',
                                                fontSize: '12px'
                                            }} 
                                        />
                                        <Line 
                                            type="monotone" 
                                            dataKey="present" 
                                            stroke="#10b981" 
                                            strokeWidth={3} 
                                            dot={{ r: 4, fill: '#10b981' }}
                                            activeDot={{ r: 6 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-48 flex items-center justify-center text-sm text-slate-500 dark:text-gray-400">
                                No trend data available
                            </div>
                        )}
                    </div>
                </GlassCard>
            </div>

            {/* Quick Insights */}
            <GlassCard>
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Today's Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                            <p className="text-xs text-slate-500 dark:text-gray-400">Total Employees</p>
                            <p className="text-lg font-bold text-slate-900 dark:text-white">{totalEmployees}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-slate-500 dark:text-gray-400">Checked In</p>
                            <p className="text-lg font-bold text-green-600">{data?.todayPresent || 0}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-slate-500 dark:text-gray-400">Not Checked In</p>
                            <p className="text-lg font-bold text-red-500">{data?.todayAbsent || 0}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-slate-500 dark:text-gray-400">Late Check-ins</p>
                            <p className="text-lg font-bold text-orange-500">{data?.todayLate || 0}</p>
                        </div>
                    </div>
                </div>
            </GlassCard>

            {/* Late Arrivals Details */}
            {data?.lateArrivals && data.lateArrivals.length > 0 && (
                <GlassCard>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Late Arrivals Today</h3>
                            <span className="text-xs px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-full">
                                {data.lateArrivals.length} employee{data.lateArrivals.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                        <div className="space-y-2">
                            {data.lateArrivals.map((arrival: any, index: number) => (
                                <div 
                                    key={index}
                                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 rounded-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                                            <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                {arrival.employee_name}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-gray-400">
                                                Checked in at {arrival.check_in_time}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                                            +{arrival.late_minutes}m
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-gray-400">late</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </GlassCard>
            )}

            {/* Empty State */}
            {data?.todayPresent === 0 && data?.todayAbsent === 0 && (
                <GlassCard>
                    <div className="text-center py-12">
                        <Users className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            No Attendance Data Yet
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Attendance records will appear here once employees start checking in
                        </p>
                    </div>
                </GlassCard>
            )}
        </div>
    );
};

export default OverviewTab;
