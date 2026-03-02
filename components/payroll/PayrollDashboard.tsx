import React from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import GlassCard from '../GlassCard';
import Button from '../ui/Button';
import { PayrollRun, PaginationMeta } from '../../types';

interface PayrollDashboardProps {
    runs: PayrollRun[];
    meta?: PaginationMeta;
    onSendToFinance: () => void;
    onCreatePayroll: () => void;
}

const paymentHistoryData = [
    { name: 'Nov', net: 45000 },
    { name: 'Dec', net: 38000 },
    { name: 'Jan', net: 32000 },
    { name: 'Feb', net: 48000 },
    { name: 'Mar', net: 65000 },
    { name: 'Apr', net: 62000 },
];

const employeeTypeData = [
    { name: 'Full Time', value: 40, color: '#3b82f6' },
    { name: 'Part Time', value: 40, color: '#f59e0b' },
    { name: 'Internship', value: 20, color: '#ef4444' },
];

const PayrollDashboard: React.FC<PayrollDashboardProps> = ({ runs, meta, onSendToFinance, onCreatePayroll }) => {
    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Top Banner & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex-1 w-full p-6 rounded-[32px] bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-4 right-6 text-4xl opacity-20 transition-transform group-hover:scale-125 duration-500">🏆</div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1 uppercase tracking-tight italic">
                        Welcome back! Let's make payroll
                    </h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                        You are more productive then last month
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
                    { label: 'Payroll Cost', val: '$52,500', delta: '+6%', up: true },
                    { label: 'Total Expense', val: '$22,500', delta: '+5%', up: true },
                    { label: 'Pending Payments', val: '$02,500', delta: '+4%', up: true },
                    { label: 'Total Payrolls', val: '120', delta: '-2%', up: false },
                ].map((stat, i) => (
                    <GlassCard key={i} className="!p-6 border-l-4 border-l-[#8252e9]/30 hover:bg-white/[0.04] transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            {/* Dot indicator matching image */}
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                        </div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{stat.label}</p>
                        <h4 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">{stat.val}</h4>
                        <div className={`flex items-center gap-2 text-[10px] font-bold ${stat.up ? 'text-emerald-500' : 'text-rose-500'}`}>
                            <span className="text-sm">{stat.up ? '↑' : '↓'}</span>
                            <span>{stat.delta} Since last month</span>
                        </div>
                    </GlassCard>
                ))}
            </div>

            {/* Filter Bar & Send to Finance */}
            <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-white/5 p-4 rounded-[28px] border border-white/5">
                <div className="flex flex-wrap gap-4 items-center">
                    <select className="bg-transparent text-[10px] font-black uppercase tracking-widest text-slate-400 focus:outline-none border-b border-white/10 pb-1">
                        <option>10/03/2025</option>
                    </select>
                    <select className="bg-transparent text-[10px] font-black uppercase tracking-widest text-slate-400 focus:outline-none border-b border-white/10 pb-1">
                        <option>Select Salary Type</option>
                    </select>
                    <select className="bg-transparent text-[10px] font-black uppercase tracking-widest text-slate-400 focus:outline-none border-b border-white/10 pb-1">
                        <option>Select Clients</option>
                    </select>
                    <select className="bg-transparent text-[10px] font-black uppercase tracking-widest text-slate-400 focus:outline-none border-b border-white/10 pb-1">
                        <option>Select User</option>
                    </select>
                </div>
                <Button
                    variant="secondary"
                    onClick={onSendToFinance}
                    className="w-full lg:w-auto px-8 !border-orange-500/50 !text-orange-500 hover:!bg-orange-500 hover:!text-white"
                >
                    Send To Finance Team <span>→</span>
                </Button>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Payment History Chart */}
                <div className="lg:col-span-8">
                    <GlassCard title="Payment History" action={<select className="text-[9px] font-black bg-white/5 border-none outline-none rounded-lg p-1 uppercase tracking-widest text-slate-500"><option>All Time</option></select>}>
                        <div className="h-[350px] w-full mt-6 relative group/chart">
                            {/* Fake Legend/Label like in image */}
                            <div className="absolute top-4 right-10 z-10 p-3 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 animate-in fade-in zoom-in duration-700">
                                <p className="text-[#10b981] text-xs font-black">N120, 245</p>
                                <p className="text-[9px] text-slate-500 font-bold uppercase">Feb 10,2025</p>
                            </div>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={paymentHistoryData}>
                                    <defs>
                                        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
                                    <YAxis hide />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ fontSize: '10px', fontWeight: '900', color: '#fff' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="net"
                                        stroke="#10b981"
                                        strokeWidth={4}
                                        dot={{ r: 6, fill: '#10b981', strokeWidth: 4, stroke: '#fff' }}
                                        activeDot={{ r: 8, strokeWidth: 0 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </GlassCard>
                </div>

                {/* Employee Type Chart */}
                <div className="lg:col-span-4">
                    <GlassCard title="Employee Type" action={<button className="text-slate-500">•••</button>}>
                        <div className="h-[300px] w-full mt-6 flex flex-col items-center justify-center">
                            <div className="relative w-full h-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={employeeTypeData}
                                            innerRadius={70}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {employeeTypeData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                {/* Center text */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-3xl font-black text-slate-900 dark:text-white">25</span>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Total</span>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-4 justify-center mt-4">
                                {employeeTypeData.map((d, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{d.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </div>

            {/* Employee List Table */}
            <GlassCard title="Employee List" action={<button className="text-[10px] font-black text-[#8252e9] uppercase tracking-widest flex items-center gap-2">See All 📄</button>}>
                <div className="mt-6 overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-separate border-spacing-y-3">
                        <thead>
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                <th className="pb-4 pl-4">Employee Name</th>
                                <th className="pb-4">Role</th>
                                <th className="pb-4">Date</th>
                                <th className="pb-4">Night Shift</th>
                                <th className="pb-4">Over Time</th>
                                <th className="pb-4">Salary</th>
                                <th className="pb-4">Status</th>
                                <th className="pb-4 pr-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="space-y-4">
                            {runs.length > 0 ? (
                                runs.slice(0, 5).map((run, i) => (
                                    <tr
                                        key={i}
                                        className="group bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-all rounded-2xl border border-transparent hover:border-white/10"
                                    >
                                        <td className="py-4 pl-4 rounded-l-2xl">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-[#8252e9]/20 flex items-center justify-center font-black text-[#8252e9] text-[10px]">
                                                    {run.prepared_by.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">Run #{run.id}</p>
                                                    <p className="text-[9px] text-slate-500 font-bold">{run.period_name}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 text-xs font-bold text-slate-500 uppercase">{run.prepared_by}</td>
                                        <td className="py-4 text-xs font-bold text-slate-500">{new Date().toLocaleDateString()}</td>
                                        <td className="py-4 text-xs font-black text-slate-900 dark:text-white">$ 0</td>
                                        <td className="py-4 text-xs font-bold text-slate-500">N/A</td>
                                        <td className="py-4 text-xs font-black text-slate-900 dark:text-white">{formatCurrency(run.total_net)}</td>
                                        <td className="py-4">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${run.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                                                }`}>
                                                {run.status}
                                            </span>
                                        </td>
                                        <td className="py-4 pr-4 rounded-r-2xl text-right">
                                            <Button variant="ghost" size="sm" onClick={() => alert('Download payslip for run #' + run.id)}>
                                                Download Pay...
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center text-slate-500 text-xs font-black uppercase tracking-widest italic opacity-50">
                                        No recent payroll data found
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
