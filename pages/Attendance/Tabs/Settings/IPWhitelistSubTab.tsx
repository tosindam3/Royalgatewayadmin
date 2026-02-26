import React, { useState } from 'react';
import GlassCard from '../../../../components/GlassCard';
import { useIPWhitelist, useMyIP } from '../../../../hooks/useAttendanceSettings';
import {
    Shield,
    Plus,
    Trash2,
    Edit2,
    ToggleLeft,
    ToggleRight,
    Network,
    Copy,
    CheckCircle2,
    Lock,
    Globe
} from 'lucide-react';
import { toast } from 'sonner';

const IPWhitelistSubTab: React.FC = () => {
    const { data: whitelist = [], isLoading } = useIPWhitelist();
    const { data: myIpData } = useMyIP();
    const [isIpEnforced, setIsIpEnforced] = useState(true);

    const copyIp = (ip: string) => {
        navigator.clipboard.writeText(ip);
        toast.success('IP address copied to clipboard');
    };

    return (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Left Panel: Global Policy */}
            <div className="xl:col-span-4 space-y-6">
                <GlassCard title="Global IP Policy">
                    <div className="space-y-6">
                        <div className={`p-5 rounded-2xl border transition-all ${isIpEnforced
                                ? 'bg-purple-500/5 border-purple-500/20'
                                : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10'
                            }`}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl ${isIpEnforced ? 'bg-purple-500 text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-500'}`}>
                                        <Lock className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white italic">IP Restriction</p>
                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{isIpEnforced ? 'Access Highly Secure' : 'Access Mode: Open'}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsIpEnforced(!isIpEnforced)}
                                    className={`w-12 h-6 rounded-full transition-all relative ${isIpEnforced ? 'bg-purple-500' : 'bg-slate-300 dark:bg-white/10'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isIpEnforced ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                                When enabled, users can only clock-in/out from registered office networks.
                                Biometric devices are exempt from this policy.
                            </p>
                        </div>

                        <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-purple-500" />
                                    <p className="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white">Your Connection</p>
                                </div>
                                <span className="text-[9px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-full uppercase tracking-widest flex items-center gap-1">
                                    <CheckCircle2 className="w-2.5 h-2.5" /> Stable
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white dark:bg-white/10 rounded-xl border border-slate-100 dark:border-white/5">
                                <p className="text-sm font-black text-slate-900 dark:text-white font-mono">{myIpData?.ip || 'Detecting...'}</p>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => copyIp(myIpData?.ip || '')} className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-all text-slate-400 hover:text-purple-500">
                                        <Copy className="w-3.5 h-3.5" />
                                    </button>
                                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-purple-600 transition-all">
                                        Whitelist
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* Right Panel: Whitelist Table */}
            <div className="xl:col-span-8">
                <GlassCard
                    title="Safe Network Registry"
                    action={
                        <button className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-600 transition-all shadow-lg shadow-purple-500/20">
                            <Plus className="w-3.5 h-3.5" />
                            Add Trusted IP
                        </button>
                    }
                >
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-white/5 uppercase text-[10px] font-black tracking-widest text-slate-400">
                                    <th className="px-4 py-3">Network Label</th>
                                    <th className="px-4 py-3">CIDR / IP Range</th>
                                    <th className="px-4 py-3">Branch</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                                {whitelist.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-purple-500/5 text-purple-500 rounded-xl group-hover:bg-purple-500 group-hover:text-white transition-all">
                                                    <Network className="w-3.5 h-3.5" />
                                                </div>
                                                <p className="text-xs font-bold text-slate-900 dark:text-white">{entry.label}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-[10px] font-black text-slate-500 font-mono tracking-tight">{entry.value}</span>
                                        </td>
                                        <td className="px-4 py-4 uppercase text-[9px] font-extrabold text-slate-400">
                                            {entry.branchId === 'all' ? 'Organization Wide' : `Branch ID: ${entry.branchId}`}
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${entry.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'
                                                }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${entry.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
                                                {entry.isActive ? 'Active' : 'Standby'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                <button className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all text-slate-400 hover:text-purple-500"><Edit2 className="w-3.5 h-3.5" /></button>
                                                <button className="p-2 hover:bg-red-500/5 rounded-xl transition-all text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {whitelist.length === 0 && !isLoading && (
                            <div className="py-20 text-center space-y-3">
                                <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200 dark:border-white/10">
                                    <Shield className="w-8 h-8 text-slate-300" />
                                </div>
                                <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight italic">No Trusted Networks Found</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Register your office IP ranges to begin enforcement</p>
                            </div>
                        )}
                    </div>
                </GlassCard>
            </div>
        </div>
    );
};

export default IPWhitelistSubTab;
