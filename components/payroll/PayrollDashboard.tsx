import React from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import GlassCard from '../GlassCard';
import Button from '../ui/Button';
import { payrollApi } from '../../services/payrollService';
import { formatCurrency } from '../../utils/currency';
import { useCurrency } from '../../hooks/useCurrency';

interface PayrollDashboardProps {
    onSendToFinance: () => void;
    onCreatePayroll: () => void;
}

// ─── Skeleton components ─────────────────────────────────────────────────────
const SkeletonBox = ({ className = '' }: { className?: string }) => (
    <div className={`animate-pulse bg-slate-300 dark:bg-white/10 rounded-2xl ${className}`} />
);

const DashboardSkeleton = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-[32px] p-6 space-y-3">
                    <SkeletonBox className="h-3 w-24" />
                    <SkeletonBox className="h-8 w-32" />
                    <SkeletonBox className="h-3 w-20" />
                </div>
            ))}
        </div>
        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-[32px] p-6">
                <SkeletonBox className="h-4 w-32 mb-8" />
                <SkeletonBox className="h-[260px]" />
            </div>
            <div className="lg:col-span-4 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-[32px] p-6">
                <SkeletonBox className="h-4 w-28 mb-8" />
                <SkeletonBox className="h-[200px] rounded-full mx-auto w-[200px]" />
            </div>
        </div>
        {/* Table */}
        <div className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-[32px] overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-white/5">
                <SkeletonBox className="h-4 w-36" />
            </div>
            {[...Array(3)].map((_, i) => (
                <div key={i} className="px-6 py-4 flex gap-8 border-b border-slate-50 dark:border-white/5">
                    <SkeletonBox className="h-4 w-28 flex-1" />
                    <SkeletonBox className="h-4 w-24 flex-1" />
                    <SkeletonBox className="h-4 w-12" />
                    <SkeletonBox className="h-4 w-24" />
                    <SkeletonBox className="h-4 w-14" />
                </div>
            ))}
        </div>
    </div>
);

// ─── Error state ──────────────────────────────────────────────────────────────
const DashboardError = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
    <div className="py-20 flex flex-col items-center justify-center gap-6 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center text-3xl">⚠️</div>
        <div>
            <p className="text-sm font-black text-rose-500 uppercase tracking-widest">Dashboard Unavailable</p>
            <p className="text-xs text-slate-500 mt-2 max-w-xs">{message}</p>
        </div>
        <Button variant="secondary" onClick={onRetry}>Retry</Button>
    </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
const PayrollDashboard: React.FC<PayrollDashboardProps> = ({ onSendToFinance, onCreatePayroll }) => {
    // Load currency settings
    useCurrency();
    
    const { data: metricsResponse, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['payroll-metrics'],
        queryFn: () => payrollApi.getMetrics(),
        retry: 1,
        staleTime: 60000, // 1 min
    });

    if (isLoading) return <DashboardSkeleton />;

    if (isError) {
        const errMsg = (error as any)?.response?.data?.message
            || (error as any)?.message
            || 'Unable to load payroll metrics. Please check server logs.';
        return <DashboardError message={errMsg} onRetry={() => refetch()} />;
    }

    const metrics = metricsResponse?.data || {
        stats: { monthly_payroll: 0, total_employees: 0, average_pay: 0, active_runs: 0 },
        history: [],
        distribution: [],
        recent_runs: []
    };

    const chartData = (metrics.history || []).map((h: any) => ({
        name: h.period,
        amount: Number(h.amount)
    }));

    const pieColors = ['#8252e9', '#10b981', '#f59e0b', '#ef4444'];
    const pieData = (metrics.distribution || []).map((d: any, index: number) => ({
        name: d.type,
        value: Number(d.count),
        color: pieColors[index % pieColors.length]
    }));

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Top Banner & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex-1 w-full p-6 rounded-[32px] bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-4 right-6 text-4xl opacity-20 transition-transform group-hover:scale-125 duration-500">🏆</div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1 uppercase tracking-tight italic">
                        Payroll Intelligence
                    </h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                        Live monitoring of organization compensation and liquidity
                    </p>
                </div>
                <div className="flex gap-4 shrink-0">
                    <Button
                        variant="secondary"
                        onClick={() => alert('Exporting payroll data...')}
                    >
                        <span>📥</span> Export Payroll
                    </Button>
                    <Button
                        variant="primary"
                        onClick={onCreatePayroll}
                        className="!bg-teal-500 hover:!bg-teal-600 shadow-teal-500/20"
                    >
                        <span>+</span> Create Payroll
                    </Button>
                </div>
            </div>

            {/* KPI Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Monthly Payroll', val: formatCurrency(metrics.stats?.monthly_payroll ?? 0), color: '#8252e9', sub: 'Net disbursement' },
                    { label: 'Average Pay', val: formatCurrency(metrics.stats?.average_pay ?? 0), color: '#10b981', sub: 'Per workforce' },
                    { label: 'Headcount', val: (metrics.stats?.total_employees ?? 0).toString(), color: '#3b82f6', sub: 'Active employees' },
                    { label: 'Pending Runs', val: (metrics.stats?.active_runs ?? 0).toString(), color: '#f59e0b', sub: 'Approvals needed' },
                ].map((stat, i) => (
                    <GlassCard key={i} className="!p-6 relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-24 h-24 opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" style={{ backgroundColor: stat.color }} />
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                        <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter mb-4 italic">{stat.val}</h4>
                        <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                            {stat.sub}
                        </div>
                    </GlassCard>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Payment History Chart */}
                <div className="lg:col-span-8">
                    <GlassCard className="h-full">
                        <div className="flex justify-between items-center mb-8">
                            <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] italic border-l-2 border-[#8252e9] pl-3">Payment History</h4>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-[#8252e9]" />
                                    <span className="text-[9px] font-black text-slate-500 uppercase">Monthly Net</span>
                                </div>
                            </div>
                        </div>
                        {chartData.length > 0 ? (
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8252e9" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#8252e9" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }}
                                            dy={10}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                            itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}
                                            formatter={(val: any) => formatCurrency(Number(val))}
                                        />
                                        <Area type="monotone" dataKey="amount" stroke="#8252e9" strokeWidth={4} fillOpacity={1} fill="url(#colorAmt)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-slate-500 text-[10px] font-black uppercase tracking-widest opacity-40 italic">
                                No approved payroll runs yet — data will appear here
                            </div>
                        )}
                    </GlassCard>
                </div>

                {/* Employee Distribution */}
                <div className="lg:col-span-4">
                    <GlassCard className="h-full">
                        <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] italic border-l-2 border-emerald-500 pl-3 mb-8">Workforce Mix</h4>
                        {pieData.length > 0 ? (
                            <>
                                <div className="h-[200px] w-full relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {pieData.map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-2xl font-black text-white">{metrics.stats?.total_employees ?? 0}</span>
                                        <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Total</span>
                                    </div>
                                </div>
                                <div className="space-y-3 mt-6">
                                    {pieData.map((type: any) => (
                                        <div key={type.name} className="flex justify-between items-center group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: type.color }} />
                                                <span className="text-[10px] font-black text-slate-500 group-hover:text-white uppercase transition-colors">{type.name}</span>
                                            </div>
                                            <span className="text-[10px] font-black text-white">{type.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="h-[200px] flex items-center justify-center text-slate-500 text-[10px] font-black uppercase tracking-widest opacity-40 italic">
                                No employee data available
                            </div>
                        )}
                    </GlassCard>
                </div>
            </div>

            {/* Recent Activity Table */}
            <GlassCard className="!p-0 overflow-hidden">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] italic border-l-2 border-amber-500 pl-3">Approved Transitions</h4>
                    <button className="text-[10px] font-black text-[#8252e9] hover:underline uppercase tracking-widest" onClick={() => onSendToFinance()}>Request Financial Review</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/5">
                            <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                <th className="px-6 py-4">Period</th>
                                <th className="px-6 py-4">Approval Date</th>
                                <th className="px-6 py-4 text-center">Employees</th>
                                <th className="px-6 py-4">Total Amount</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {(metrics.recent_runs || []).length > 0 ? metrics.recent_runs.map((run: any) => (
                                <tr key={run.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-4">
                                        <p className="text-xs font-black text-white uppercase tracking-tight group-hover:text-[#8252e9] transition-colors">{run.name}</p>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-bold text-slate-400">{run.date}</td>
                                    <td className="px-6 py-4 text-xs font-bold text-white text-center">{run.employees}</td>
                                    <td className="px-6 py-4 text-xs font-black text-emerald-500">{formatCurrency(Number(run.amount))}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-[9px] font-black text-blue-500 hover:text-blue-400 uppercase tracking-widest transition-all">Details</button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest italic opacity-50">
                                        No approved payroll runs yet — approve a run to see it here
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </GlassCard>
        </div>
    );
};

export default PayrollDashboard;
