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
            <div className="flex items-center justify-center h-64 bg-slate-800/50 rounded-2xl border border-white/5">
                <p className="text-slate-400">No analytics data available yet. Complete an evaluation to see your stats.</p>
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
                    <h2 className="text-2xl font-black text-white tracking-tight">My Performance Analytics</h2>
                    <p className="text-slate-400 mt-1">Track your growth and compare your standing</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Award className="w-16 h-16 text-purple-500" />
                    </div>
                    <p className="text-slate-400 text-sm font-medium mb-1">Current Score</p>
                    <div className="flex items-end gap-3">
                        <h3 className="text-4xl font-black text-white">{current_score || 0}%</h3>
                        {rating && (
                            <Badge variant="secondary" className="mb-1">
                                {rating.label}
                            </Badge>
                        )}
                    </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp className="w-16 h-16 text-blue-500" />
                    </div>
                    <p className="text-slate-400 text-sm font-medium mb-1">Trend</p>
                    <h3 className="text-2xl font-black text-white mt-2">
                        {historyData.length > 1 && historyData[historyData.length - 1]['My Score'] >= historyData[historyData.length - 2]['My Score']
                            ? <span className="text-green-500 flex items-center gap-2">Improving <TrendingUp className="w-5 h-5" /></span>
                            : <span className="text-orange-500 flex items-center gap-2">Declining <TrendingUp className="w-5 h-5 rotate-180" /></span>
                        }
                    </h3>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Target className="w-16 h-16 text-emerald-500" />
                    </div>
                    <p className="text-slate-400 text-sm font-medium mb-1">vs Dept Average</p>
                    <h3 className="text-4xl font-black text-white">
                        {current_score >= department_average ? '+' : ''}{(current_score - department_average).toFixed(1)}%
                    </h3>
                    <p className="text-xs text-slate-500 mt-2">Dept Avg: {department_average}%</p>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Building2 className="w-16 h-16 text-orange-500" />
                    </div>
                    <p className="text-slate-400 text-sm font-medium mb-1">vs Org Average</p>
                    <h3 className="text-4xl font-black text-white">
                        {current_score >= organization_average ? '+' : ''}{(current_score - organization_average).toFixed(1)}%
                    </h3>
                    <p className="text-xs text-slate-500 mt-2">Org Avg: {organization_average}%</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Trend Chart */}
                <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 p-6 rounded-2xl">
                    <h3 className="text-lg font-bold text-white mb-6">Historical Performance Trend</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={historyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend iconType="circle" />
                                <Line type="monotone" dataKey="My Score" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                                <Line type="monotone" dataKey="Dept Average" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Skill Breakdown */}
                <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 p-6 rounded-2xl">
                    <h3 className="text-lg font-bold text-white mb-6">Latest Skill Breakdown</h3>
                    <div className="h-80">
                        {skillData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={skillData}>
                                    <PolarGrid stroke="#334155" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b' }} axisLine={false} />
                                    <Radar name="Score" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                                        itemStyle={{ color: '#10b981' }}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-500">
                                No breakdown data available
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
