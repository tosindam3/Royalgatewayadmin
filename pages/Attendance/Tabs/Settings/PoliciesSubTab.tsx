import React from 'react';
import GlassCard from '../../../../components/GlassCard';
import {
    FileCheck,
    Clock,
    Hourglass,
    AlertTriangle,
    Calendar,
    Lock,
    Zap,
    Coffee
} from 'lucide-react';

const PoliciesSubTab: React.FC = () => {
    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-6">
                <GlassCard title="Working Hours & Grace" icon={<Clock className="w-4 h-4" />}>
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Work Start Time</label>
                                <input
                                    type="time"
                                    defaultValue="09:00"
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Work End Time</label>
                                <input
                                    type="time"
                                    defaultValue="17:00"
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Grace Period (Mins)</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number"
                                        defaultValue="15"
                                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white"
                                    />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">MINS</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Work Hours/Day</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number"
                                        defaultValue="8"
                                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white"
                                    />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">HRS</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Working Days</label>
                            <div className="flex gap-2">
                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                                    <button
                                        key={day}
                                        className={`flex-1 py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all ${
                                            index < 5
                                                ? 'bg-purple-500 text-white shadow-sm'
                                                : 'bg-slate-100 dark:bg-white/5 text-slate-400 border border-slate-200 dark:border-white/10'
                                        }`}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>
                            <p className="text-[10px] text-slate-500 mt-2">Click to toggle working days</p>
                        </div>

                        <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-2xl flex items-start gap-3">
                            <AlertTriangle className="w-4 h-4 text-purple-500 mt-0.5" />
                            <p className="text-[11px] text-purple-600 font-medium leading-relaxed">
                                Grace period affects "Late" status flagging but does not deduct from payable hours.
                            </p>
                        </div>
                    </div>
                </GlassCard>

                <GlassCard title="Overtime Policy" icon={<Zap className="w-4 h-4" />}>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-500 text-white rounded-xl">
                                    <FileCheck className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white italic">Auto-Approve OT</p>
                                    <p className="text-[10px] text-slate-500">Approve OT if within shift brackets</p>
                                </div>
                            </div>
                            <button className="w-10 h-6 rounded-full bg-slate-300 dark:bg-white/10 relative">
                                <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Minimum OT Minutes</label>
                            <input type="range" className="w-full accent-purple-500" min="0" max="120" step="15" defaultValue="30" />
                            <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                <span>0m</span>
                                <span className="text-purple-500">Current: 30m</span>
                                <span>120m</span>
                            </div>
                        </div>
                    </div>
                </GlassCard>
            </div>

            <div className="space-y-6">
                <GlassCard title="Break & Correction Rules" icon={<Coffee className="w-4 h-4" />}>
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tight italic">Mandatory Break Deduction</p>
                                    <p className="text-[10px] text-slate-500 mt-0.5">Automatically deduct 1 hour after 6 hours work</p>
                                </div>
                                <button className="w-10 h-6 rounded-full bg-emerald-500 relative shadow-inner">
                                    <div className="absolute top-1 left-5 w-4 h-4 rounded-full bg-white shadow-sm" />
                                </button>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tight italic">Correction Approval</p>
                                    <p className="text-[10px] text-slate-500 mt-0.5">Manager oversight required for all manual edits</p>
                                </div>
                                <button className="w-10 h-6 rounded-full bg-purple-500 relative">
                                    <div className="absolute top-1 left-5 w-4 h-4 rounded-full bg-white shadow-sm" />
                                </button>
                            </div>
                        </div>

                        <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10">
                            <div className="flex items-center gap-3 mb-4 text-purple-500">
                                <Lock className="w-4 h-4" />
                                <p className="text-[10px] font-black uppercase tracking-widest italic">Payroll Lock Period</p>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                                Attendance records are locked 3 days before the payroll cycle end. Manual corrections are blocked during this window.
                            </p>
                        </div>
                    </div>
                </GlassCard>

                <div className="p-8 bg-gradient-to-br from-[#8252e9] to-[#6366f1] rounded-[2rem] text-white flex flex-col justify-between shadow-2xl shadow-purple-500/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Calendar className="w-32 h-32" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black uppercase tracking-tighter italic leading-none mb-2">Policy Impact <span className="text-white/60">Summary</span></h3>
                        <p className="text-[11px] text-white/70 font-bold uppercase tracking-widest">Active System Guardrails</p>
                    </div>
                    <ul className="mt-8 space-y-3">
                        <li className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white/90">
                            <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm shadow-white" />
                            15m Late Grace Period
                        </li>
                        <li className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white/90">
                            <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm shadow-white" />
                            Strict Geofencing Active
                        </li>
                        <li className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white/90">
                            <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm shadow-white" />
                            IP Whitelisting Enabled
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default PoliciesSubTab;
