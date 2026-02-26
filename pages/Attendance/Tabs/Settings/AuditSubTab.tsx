import React from 'react';
import GlassCard from '../../../../components/GlassCard';
import {
    History,
    Search,
    User,
    Settings,
    Map,
    Shield,
    Smartphone,
    Eye
} from 'lucide-react';

const AuditSubTab: React.FC = () => {
    // Mock data as audit service isn't fully wired yet
    const logs = [
        { id: '1', date: '2026-02-25 14:30', actor: 'Sarah Admin', area: 'GEOFENCE', action: 'CREATE', summary: 'Added HQ Office Geofence (Radius: 200m)' },
        { id: '2', date: '2026-02-25 10:15', actor: 'John HR', area: 'POLICY', action: 'UPDATE', summary: 'Changed Late Threshold from 10m to 15m' },
        { id: '3', date: '2026-02-24 16:45', actor: 'System', area: 'BIOMETRIC', action: 'SYNC', summary: 'Batch sync completed for 4 devices (1,240 records)' },
        { id: '4', date: '2026-02-24 09:00', actor: 'Sarah Admin', area: 'IP', action: 'ACTIVATE', summary: 'Enabled global IP restriction for Web panel' },
    ];

    const getAreaIcon = (area: string) => {
        switch (area) {
            case 'GEOFENCE': return <Map className="w-3.5 h-3.5" />;
            case 'IP': return <Shield className="w-3.5 h-3.5" />;
            case 'BIOMETRIC': return <Smartphone className="w-3.5 h-3.5" />;
            case 'POLICY': return <Settings className="w-3.5 h-3.5" />;
            default: return <History className="w-3.5 h-3.5" />;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <GlassCard title="Configuration Audit Trail">
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search audit logs..."
                                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/10 transition-all font-medium"
                            />
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                            {['ALL', 'GEOFENCE', 'IP', 'BIOMETRIC', 'POLICY'].map(filter => (
                                <button
                                    key={filter}
                                    className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${filter === 'ALL'
                                        ? 'bg-purple-500 border-purple-500 text-white shadow-lg shadow-purple-500/20'
                                        : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 hover:border-purple-500/50 hover:text-purple-500'
                                        }`}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-white/5 uppercase text-[10px] font-black tracking-widest text-slate-400">
                                    <th className="px-4 py-3">Timestamp</th>
                                    <th className="px-4 py-3">Actor</th>
                                    <th className="px-4 py-3">Area</th>
                                    <th className="px-4 py-3">Action</th>
                                    <th className="px-4 py-3">Summary</th>
                                    <th className="px-4 py-3 text-right">View</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-white/5 text-[11px]">
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-4 py-4">
                                            <p className="font-bold text-slate-500 tabular-nums">{log.date}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center">
                                                    <User className="w-3 h-3 text-slate-400" />
                                                </div>
                                                <span className="font-black uppercase tracking-tight text-slate-900 dark:text-white">{log.actor}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2 px-2 py-1 bg-slate-100 dark:bg-white/10 rounded-lg w-fit">
                                                {getAreaIcon(log.area)}
                                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{log.area}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${log.action === 'CREATE' ? 'bg-emerald-500/10 text-emerald-600' :
                                                log.action === 'UPDATE' ? 'bg-amber-500/10 text-amber-600' :
                                                    log.action === 'ACTIVATE' ? 'bg-purple-500/10 text-purple-600' :
                                                        'bg-slate-500/10 text-slate-500'
                                                }`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="font-medium text-slate-600 dark:text-slate-400 truncate max-w-xs">{log.summary}</p>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <button className="p-2 hover:bg-purple-500/10 hover:text-purple-500 rounded-lg transition-all text-slate-400">
                                                <Eye className="w-3.5 h-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
};

export default AuditSubTab;
