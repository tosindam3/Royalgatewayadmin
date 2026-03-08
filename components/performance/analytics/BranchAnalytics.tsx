import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line
} from 'recharts';
import Badge from '../../ui/Badge';
import { Building2, Users, Trophy, Target } from 'lucide-react';

interface BranchAnalyticsProps {
    data: any;
}

export const BranchAnalytics: React.FC<BranchAnalyticsProps> = ({ data }) => {
    if (!data) {
        return (
            <div className="flex items-center justify-center h-64 bg-slate-800/50 rounded-2xl border border-white/5">
                <p className="text-slate-400">No branch analytics data available yet.</p>
            </div>
        );
    }

    const {
        branch_average,
        organization_average,
        department_comparisons,
        top_performers,
        total_submissions
    } = data;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">Branch Overview</h2>
                    <p className="text-slate-400 mt-1">Compare department performance and view top talent</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Building2 className="w-16 h-16 text-blue-500" />
                    </div>
                    <p className="text-slate-400 text-sm font-medium mb-1">Branch Average Score</p>
                    <div className="flex items-end gap-3">
                        <h3 className="text-4xl font-black text-white">{branch_average || 0}%</h3>
                        <Badge variant={branch_average >= organization_average ? 'success' : 'warning'} className="mb-1">
                            {branch_average >= organization_average ? 'Above Org Avg' : 'Below Org Avg'}
                        </Badge>
                    </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Target className="w-16 h-16 text-emerald-500" />
                    </div>
                    <p className="text-slate-400 text-sm font-medium mb-1">Organization Average</p>
                    <h3 className="text-4xl font-black text-white">{organization_average || 0}%</h3>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Users className="w-16 h-16 text-purple-500" />
                    </div>
                    <p className="text-slate-400 text-sm font-medium mb-1">Total Submissions</p>
                    <h3 className="text-4xl font-black text-white">{total_submissions || 0}</h3>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Department Comparison Chart */}
                <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 p-6 rounded-2xl lg:col-span-2">
                    <h3 className="text-lg font-bold text-white mb-6">Department Average Scores</h3>
                    <div className="h-80">
                        {department_comparisons && department_comparisons.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={department_comparisons} margin={{ top: 5, right: 0, bottom: 5, left: -20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis dataKey="department" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                                        cursor={{ fill: '#334155', opacity: 0.4 }}
                                    />
                                    <Bar dataKey="average_score" name="Average Score" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-500">
                                No department data available
                            </div>
                        )}
                    </div>
                </div>

                {/* Top Performers List */}
                <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 p-6 rounded-2xl">
                    <div className="flex items-center gap-2 mb-6">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        <h3 className="text-lg font-bold text-white">Top Talent</h3>
                    </div>
                    <div className="space-y-4">
                        {top_performers && top_performers.length > 0 ? (
                            top_performers.map((performer: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-sm text-slate-300">
                                            #{idx + 1}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">{performer.name}</p>
                                            <p className="text-xs text-slate-400">{performer.department}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-emerald-400">{performer.score}%</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-slate-500 text-sm text-center py-4">No top performers yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
