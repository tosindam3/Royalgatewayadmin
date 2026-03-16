import React from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    BarChart, Bar
} from 'recharts';
import Badge from '../../ui/Badge';
import { TrendingUp, Award, Target, Building2 } from 'lucide-react';

interface PersonalAnalyticsProps {
    data: any;
}

export const PersonalAnalytics: React.FC<PersonalAnalyticsProps> = ({ data }) => {
    if (!data) {
        return (
            <div className="flex items-center justify-center h-64 bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-white/5 transition-all">
                <p className="text-slate-500 dark:text-slate-400 font-medium">No analytics data available yet. Complete an evaluation to see your stats.</p>
            </div>
        );
    }

    const {
        current_score,
        rating,
        department_average,
        organization_average,
        history,
        latest_breakdown
    } = data;

    // Theme detection helper (simple version for chart colors)
    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? '#334155' : '#e2e8f0';
    const tooltipBg = isDark ? '#1e293b' : '#ffffff';
    const tooltipBorder = isDark ? '#334155' : '#e2e8f0';

    // Format history for Line Chart
    const historyData = history?.map((h: any) => ({
        name: h.period,
        'My Score': h.score,
        'Dept Average': h.dept_avg,
    })) || [];

    // Format breakdown for Radar Chart
    const skillData = latest_breakdown?.map((b: any) => ({
        subject: b.field_label || b.field_id,
        A: b.score,
        fullMark: 100,
    })) || [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase">My Performance Intelligence</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Track your growth and compare your strategic standing</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 p-6 rounded-2xl relative overflow-hidden group shadow-sm hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity">
                        <Award className="w-16 h-16 text-purple-600 dark:text-purple-500" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Current Score</p>
                    <div className="flex items-end gap-3">
                        <h3 className="text-4xl font-black text-slate-900 dark:text-white">{current_score || 0}%</h3>
                        {rating && (
                            <Badge variant="secondary" className="mb-1 opacity-90">
                                {rating.label}
                            </Badge>
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 p-6 rounded-2xl relative overflow-hidden group shadow-sm hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity">
                        <TrendingUp className="w-16 h-16 text-blue-600 dark:text-blue-500" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Trend Status</p>
                    <h3 className="text-xl font-black mt-2 uppercase italic tracking-tighter">
                        {historyData.length > 1 && historyData[historyData.length - 1]['My Score'] >= historyData[historyData.length - 2]['My Score']
                            ? <span className="text-emerald-600 dark:text-emerald-500 flex items-center gap-2">Improving <TrendingUp className="w-5 h-5" /></span>
                            : <span className="text-orange-600 dark:text-orange-500 flex items-center gap-2">Declining <TrendingUp className="w-5 h-5 rotate-180" /></span>
                        }
                    </h3>
                </div>

                <div className="bg-white dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 p-6 rounded-2xl relative overflow-hidden group shadow-sm hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity">
                        <Target className="w-16 h-16 text-emerald-600 dark:text-emerald-500" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">vs Dept Average</p>
                    <h3 className="text-4xl font-black text-slate-900 dark:text-white">
                        {current_score >= department_average ? '+' : ''}{(current_score - department_average).toFixed(1)}%
                    </h3>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-bold uppercase tracking-tighter">Dept Avg: {department_average}%</p>
                </div>

                <div className="bg-white dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 p-6 rounded-2xl relative overflow-hidden group shadow-sm hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity">
                        <Building2 className="w-16 h-16 text-orange-600 dark:text-orange-500" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">vs Org Average</p>
                    <h3 className="text-4xl font-black text-slate-900 dark:text-white">
                        {current_score >= organization_average ? '+' : ''}{(current_score - organization_average).toFixed(1)}%
                    </h3>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-bold uppercase tracking-tighter">Org Avg: {organization_average}%</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Trend Chart */}
                <div className="bg-white dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-sm">
                    <h3 className="text-xs font-black text-slate-900 dark:text-white mb-6 uppercase tracking-[0.2em] italic">Historical Performance Trend</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={historyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                                <XAxis dataKey="name" stroke={textColor} fontSize={10} fontWeight={900} tickLine={false} axisLine={false} />
                                <YAxis stroke={textColor} fontSize={10} fontWeight={900} tickLine={false} axisLine={false} domain={[0, 100]} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '12px', color: isDark ? '#fff' : '#000', fontSize: '10px', fontWeight: 'bold' }}
                                    itemStyle={{ color: isDark ? '#fff' : '#000' }}
                                />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'black', paddingTop: '20px' }} />
                                <Line type="monotone" dataKey="My Score" stroke="#8b5cf6" strokeWidth={4} dot={{ r: 5, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8, strokeWidth: 0 }} />
                                <Line type="monotone" dataKey="Dept Average" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Skill Breakdown */}
                <div className="bg-white dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-sm">
                    <h3 className="text-xs font-black text-slate-900 dark:text-white mb-6 uppercase tracking-[0.2em] italic">Latest Skill Breakdown</h3>
                    <div className="h-80">
                        {skillData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={skillData}>
                                    <PolarGrid stroke={gridColor} />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: textColor, fontSize: 10, fontWeight: 900 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: textColor, fontSize: 8, fontWeight: 'bold' }} axisLine={false} />
                                    <Radar name="Score" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={isDark ? 0.3 : 0.4} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '12px', color: isDark ? '#fff' : '#000', fontSize: '10px', fontWeight: 'bold' }}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-widest">
                                No breakdown data available
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
