import React from 'react';
import GlassCard from '../../components/GlassCard';
import { useTodayStatus, useAttendanceHistory } from '../../hooks/useAttendance';
import {
    History,
    MapPin,
    Shield,
    Monitor,
    Calendar,
    Clock,
    ChevronRight,
    HelpCircle,
    FileText
} from 'lucide-react';

const MyAttendance: React.FC = () => {
    const { data: today } = useTodayStatus();
    const { data: history = [] } = useAttendanceHistory();

    return (
        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="flex items-center justify-between">
                <h1 className="text-4xl font-black tracking-tighter uppercase italic text-slate-900 dark:text-white">
                    My <span className="text-purple-500">Attendance</span>
                </h1>
                <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-purple-500 hover:border-purple-500/50 transition-all shadow-sm">
                        <Calendar className="w-4 h-4" />
                        February 2026
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3 bg-purple-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-purple-600 transition-all shadow-xl shadow-purple-500/20">
                        <FileText className="w-4 h-4" />
                        Monthly Report
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Stats & Policies */}
                <div className="lg:col-span-4 space-y-8">
                    <GlassCard title="My Compliance Hub">
                        <div className="space-y-6">
                            <div className="p-5 bg-purple-500/5 border border-purple-500/20 rounded-[2rem] relative overflow-hidden group">
                                <div className="absolute -right-8 -bottom-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
                                    <Shield className="w-32 h-32" />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-500 mb-3 leading-none">Access Policy</p>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold text-slate-500">Geofence Enforcement</span>
                                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold text-slate-500">IP Whitelisting</span>
                                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold text-slate-500">Late Grace Period</span>
                                        <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">15 Mins</span>
                                    </div>
                                </div>
                                <button className="mt-5 w-full py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-purple-500 transition-all">
                                    View Full Policy Documentation
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/10 text-center">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Avg Start</p>
                                    <p className="text-lg font-black text-slate-900 dark:text-white italic tracking-tighter">09:05 AM</p>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/10 text-center">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Punctuality</p>
                                    <p className="text-lg font-black text-emerald-500 italic tracking-tighter">98%</p>
                                </div>
                            </div>
                        </div>
                    </GlassCard>

                    <div className="p-6 bg-slate-100 dark:bg-white/5 rounded-[2.5rem] border border-slate-200 dark:border-white/10">
                        <div className="flex items-center gap-3 mb-4">
                            <HelpCircle className="w-5 h-5 text-purple-500" />
                            <h3 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">Help & Support</h3>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                            Having issues with geofencing? Ensure "High Accuracy" is enabled in your browser settings or contact HR support.
                        </p>
                    </div>
                </div>

                {/* Right: History Timeline */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    <GlassCard
                        title="Attendance Timeline"
                        icon={<History className="w-4 h-4 text-purple-500" />}
                    >
                        <div className="space-y-2">
                            {[
                                { date: 'Today, Feb 25', status: 'Present', in: '08:58 AM', out: '-', color: 'emerald' },
                                { date: 'Yesterday, Feb 24', status: 'Present', in: '09:02 AM', out: '05:30 PM', color: 'emerald' },
                                { date: 'Monday, Feb 23', status: 'Late', in: '09:25 AM', out: '06:10 PM', color: 'amber' },
                                { date: 'Friday, Feb 20', status: 'Present', in: '08:55 AM', out: '05:05 PM', color: 'emerald' },
                            ].map((day, idx) => (
                                <div key={idx} className="group hover:bg-slate-50 dark:hover:bg-white/5 p-4 rounded-3xl transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-white/10 flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className="text-center w-20">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 leading-none">{day.date.split(',')[0]}</p>
                                            <p className="text-sm font-black text-slate-900 dark:text-white italic leading-none">{day.date.split(',')[1]}</p>
                                        </div>
                                        <div className="h-10 w-[1px] bg-slate-200 dark:bg-white/10 hidden md:block" />
                                        <div>
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${day.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                                                }`}>
                                                {day.status}
                                            </span>
                                            <div className="flex items-center gap-4 mt-1.5 font-bold text-[11px] text-slate-500 uppercase tracking-widest">
                                                <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> IN: {day.in}</span>
                                                <span className="flex items-center gap-1.5 text-slate-300 dark:text-slate-600"><Clock className="w-3 h-3" /> OUT: {day.out}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="p-3 bg-slate-100 dark:bg-white/5 text-slate-400 group-hover:text-purple-500 group-hover:bg-purple-500/10 rounded-2xl transition-all opacity-0 group-hover:opacity-100">
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-6 py-4 bg-slate-50 dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/10 rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all">
                            Load Previous History Node
                        </button>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
};

export default MyAttendance;
