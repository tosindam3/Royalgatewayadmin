import React, { useState } from 'react';
import GlassCard from '../../../../components/GlassCard';
import { useBiometricDevices, useSyncDevice } from '../../../../hooks/useAttendanceSettings';
import {
    Smartphone,
    Plus,
    RefreshCw,
    Settings,
    Cpu,
    Activity,
    Database,
    Clock,
    Wifi,
    WifiOff,
    ChevronRight,
    AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

const BiometricSubTab: React.FC = () => {
    const { data: devices = [], isLoading } = useBiometricDevices();
    const syncMutation = useSyncDevice();
    const [activeSegment, setActiveSegment] = useState<'devices' | 'rules'>('devices');

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Segments */}
            <div className="flex items-center gap-1 p-1 bg-slate-100/50 dark:bg-white/5 rounded-2xl border border-slate-200/50 dark:border-white/10 w-fit">
                <button
                    onClick={() => setActiveSegment('devices')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSegment === 'devices'
                            ? 'bg-white dark:bg-white/10 text-purple-500 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                >
                    <Cpu className="w-3.5 h-3.5" />
                    Devices Inventory
                </button>
                <button
                    onClick={() => setActiveSegment('rules')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSegment === 'rules'
                            ? 'bg-white dark:bg-white/10 text-purple-500 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                >
                    <Settings className="w-3.5 h-3.5" />
                    Import & Sync Rules
                </button>
            </div>

            {activeSegment === 'devices' ? (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2 space-y-6">
                        <GlassCard
                            title="Active Terminals"
                            action={
                                <button className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-600 transition-all shadow-lg shadow-purple-500/20">
                                    <Plus className="w-3.5 h-3.5" />
                                    Register Device
                                </button>
                            }
                        >
                            <div className="divide-y divide-slate-100 dark:divide-white/5">
                                {devices.map((device) => (
                                    <div key={device.id} className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-all p-4 rounded-2xl -mx-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-2xl ${device.status === 'ONLINE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                                    {device.status === 'ONLINE' ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{device.deviceName}</p>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                            <Database className="w-3 h-3" /> {device.model}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                            <Activity className="w-3 h-3" /> {device.ipAddress}:{device.port}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="text-right mr-4 hidden md:block">
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Last Sync</p>
                                                    <p className="text-[11px] font-bold text-slate-900 dark:text-white mt-0.5">{device.lastSync || 'Never'}</p>
                                                </div>
                                                <button
                                                    onClick={() => syncMutation.mutate(device.id)}
                                                    className="p-2.5 bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-purple-500 hover:bg-purple-500/10 rounded-xl transition-all"
                                                    title="Sync Now"
                                                >
                                                    <RefreshCw className={`w-4 h-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                                                </button>
                                                <button className="p-2.5 bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl transition-all">
                                                    <ChevronRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {devices.length === 0 && !isLoading && (
                                    <div className="py-20 text-center space-y-3">
                                        <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200 dark:border-white/10">
                                            <Smartphone className="w-10 h-10 text-slate-200" />
                                        </div>
                                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight italic">No Terminals Registered</p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Commence device onboarding to begin data collation</p>
                                    </div>
                                )}
                            </div>
                        </GlassCard>
                    </div>

                    <div className="space-y-6">
                        <GlassCard title="Sync Diagnostics">
                            <div className="space-y-4">
                                <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                                    <div className="flex items-center gap-3 mb-2">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                        <p className="text-xs font-black uppercase tracking-tight text-emerald-600">Protocol Status</p>
                                    </div>
                                    <p className="text-[11px] text-emerald-600/80 font-medium leading-relaxed">
                                        Binary ZKTeco socket handshake established. TCP fallback active.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Logs</p>
                                        <p className="text-xl font-black text-slate-900 dark:text-white italic">14.2k</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Queue Load</p>
                                        <p className="text-xl font-black text-slate-900 dark:text-white italic">0%</p>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>

                        <div className="p-6 bg-amber-500/5 border border-amber-500/20 rounded-3xl space-y-4">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-500" />
                                <p className="text-xs font-black uppercase tracking-tight text-amber-600">Deduplication Alert</p>
                            </div>
                            <p className="text-[11px] text-amber-600/80 font-medium leading-relaxed">
                                Rules are currently set to ignore duplicate events within a 60-second window to prevent relay glitches.
                            </p>
                            <button className="text-[10px] font-black uppercase tracking-widest text-amber-600 hover:text-amber-700 transition-all">
                                Modify Rule Configuration →
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <GlassCard title="Time Normalization">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 cursor-pointer hover:border-purple-500/50 transition-all">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white italic">Round to Nearest Minute</p>
                                    <p className="text-[10px] text-slate-500">Strip seconds from imported timestamps</p>
                                </div>
                                <div className="w-10 h-6 rounded-full bg-purple-500 relative">
                                    <div className="absolute top-1 left-5 w-4 h-4 rounded-full bg-white" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Dedupe Window (Seconds)</label>
                                <div className="flex items-center gap-4">
                                    <input type="range" className="flex-1 accent-purple-500" min="0" max="300" step="10" defaultValue="60" />
                                    <span className="text-[11px] font-black text-slate-900 dark:text-white w-12 text-center">60s</span>
                                </div>
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard title="Auto-Pairing Rules">
                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="flex-1 p-4 bg-purple-500/5 border border-purple-500/20 rounded-2xl">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-purple-600 mb-1 leading-none">Algorithm</p>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white">Strict Chronological</p>
                                </div>
                                <div className="flex-1 p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 leading-none">Fallback</p>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white italic">Missing Out: Auto</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <Database className="w-4 h-4 text-purple-500" />
                                    <p className="text-[11px] text-slate-500 leading-relaxed">
                                        Pairs consecutive "IN" and "OUT" events. If an "OUT" is missing, the system uses the 11:59:59 PM limit or the shift end time based on policy.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
};

const CheckCircle2 = (props: any) => <Activity {...props} />; // Placeholder as CheckCircle2 isn't in lucide-react sometimes in older versions

export default BiometricSubTab;
