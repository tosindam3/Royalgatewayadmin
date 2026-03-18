import React, { useState, useEffect } from 'react';
import GlassCard from '../../../../components/GlassCard';
import {
    FileCheck,
    Clock,
    Hourglass,
    AlertTriangle,
    Calendar,
    Lock,
    Zap,
    Coffee,
    Save,
    CheckCircle2,
    XCircle,
    Info,
    TrendingUp,
    TrendingDown,
    UserMinus
} from 'lucide-react';
import { attendanceService } from '../../../../services/attendanceService';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const PoliciesSubTab: React.FC = () => {
    const queryClient = useQueryClient();
    const [localSettings, setLocalSettings] = useState<Record<string, any>>({});
    const [isDirty, setIsDirty] = useState(false);

    // Fetch settings
    const { data: settingsData, isLoading } = useQuery({
        queryKey: ['attendance-settings'],
        queryFn: () => attendanceService.getSettings()
    });

    const settings = settingsData?.data?.settings || {};
    const canManage = settingsData?.data?.can_manage || false;

    useEffect(() => {
        if (settings) {
            setLocalSettings(settings);
        }
    }, [settingsData]);

    const updateMutation = useMutation({
        mutationFn: (newSettings: Record<string, any>) => attendanceService.updateSettings(newSettings),
        onSuccess: (data) => {
            toast.success(data.message || 'Settings updated successfully');
            setIsDirty(false);
            queryClient.invalidateQueries({ queryKey: ['attendance-settings'] });
        },
        onError: () => {
            toast.error('Failed to update settings');
        }
    });

    const handleInputChange = (key: string, value: any) => {
        setLocalSettings(prev => ({ ...prev, [key]: value }));
        setIsDirty(true);
    };

    const handleSave = () => {
        updateMutation.mutate(localSettings);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
            </div>
        );
    }

    const renderPendingBadge = (key: string) => {
        if (settings[key]?.is_pending) {
            return (
                <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-500/20 text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-tighter italic">
                    <Hourglass className="w-2.5 h-2.5" /> Pending Review
                </span>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6">
            {isDirty && (
                <div className="fixed bottom-8 right-8 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <button
                        onClick={handleSave}
                        disabled={updateMutation.isPending}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-2xl shadow-xl shadow-purple-500/40 flex items-center gap-3 font-bold uppercase tracking-widest text-[10px] transition-all active:scale-95 disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {canManage ? 'Apply Rule Changes' : 'Submit for CEO Approval'}
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-6">
                    <GlassCard title="Working Hours & Grace" icon={<Clock className="w-4 h-4" />}>
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Work Start Time</label>
                                        {renderPendingBadge('attendance.work_start_time')}
                                    </div>
                                    <input
                                        type="time"
                                        value={localSettings['attendance.work_start_time']?.value || '09:00'}
                                        onChange={(e) => handleInputChange('attendance.work_start_time', e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Work End Time</label>
                                        {renderPendingBadge('attendance.work_end_time')}
                                    </div>
                                    <input
                                        type="time"
                                        value={localSettings['attendance.work_end_time']?.value || '17:00'}
                                        onChange={(e) => handleInputChange('attendance.work_end_time', e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Grace Period (Mins)</label>
                                        {renderPendingBadge('attendance.grace_period_minutes')}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            value={localSettings['attendance.grace_period_minutes']?.value || 15}
                                            onChange={(e) => handleInputChange('attendance.grace_period_minutes', parseInt(e.target.value))}
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
                                            readOnly
                                            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-400 italic"
                                        />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">HRS</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-2xl flex items-start gap-3">
                                <AlertTriangle className="w-4 h-4 text-purple-500 mt-0.5" />
                                <div>
                                    <p className="text-[11px] text-purple-600 font-bold uppercase italic tracking-tight">Enterprise Rule Active</p>
                                    <p className="text-[10px] text-purple-600/70 font-medium leading-relaxed mt-0.5">
                                        Lateness exceeding the grace period triggers an automated 1-hour rate deduction in the payroll module.
                                    </p>
                                </div>
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
                                <button
                                    onClick={() => handleInputChange('attendance.auto_approve_ot', !localSettings['attendance.auto_approve_ot']?.value)}
                                    className={`w-10 h-6 rounded-full transition-colors relative ${localSettings['attendance.auto_approve_ot']?.value ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-white/10'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${localSettings['attendance.auto_approve_ot']?.value ? 'left-5' : 'left-1'}`} />
                                </button>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Minimum OT Minutes</label>
                                <input
                                    type="range"
                                    className="w-full accent-purple-500"
                                    min="0"
                                    max="120"
                                    step="15"
                                    value={localSettings['attendance.min_ot_minutes']?.value || 30}
                                    onChange={(e) => handleInputChange('attendance.min_ot_minutes', parseInt(e.target.value))}
                                />
                                <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    <span>0m</span>
                                    <span className="text-purple-500 italic">Target: {localSettings['attendance.min_ot_minutes']?.value || 30}m</span>
                                    <span>120m</span>
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                </div>

                <div className="space-y-6">
                    <GlassCard title="Governance Notice" icon={<Lock className="w-4 h-4" />}>
                        <div className="space-y-4">
                            <div className="p-5 bg-amber-500/5 rounded-[2rem] border border-amber-500/20">
                                <div className="flex items-center gap-3 mb-3 text-amber-600">
                                    <Info className="w-4 h-4" />
                                    <p className="text-[10px] font-black uppercase tracking-widest italic">CEO Approval Protocol</p>
                                </div>
                                <p className="text-[11px] text-amber-700 leading-relaxed font-semibold italic">
                                    "Changes to organization settings, including grace periods and OT rules, must be authorized by a Superadmin or the CEO. HR Managers may propose changes, but they will not be active until approved."
                                </p>
                            </div>

                            <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-[2rem] border border-slate-200 dark:border-white/10">
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

                    <div className="p-8 bg-gradient-to-br from-[#8252e9] to-[#6366f1] rounded-[2.5rem] text-white flex flex-col justify-between shadow-2xl shadow-purple-500/20 relative overflow-hidden group min-h-[240px]">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <Calendar className="w-32 h-32" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tighter italic leading-none mb-2 underline decoration-white/20 underline-offset-4">Policy Impact <span className="text-white/60">Summary</span></h3>
                            <p className="text-[11px] text-white/70 font-bold uppercase tracking-widest">Active System Guardrails</p>
                        </div>
                        <ul className="mt-8 space-y-4">
                            <li className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white/90">
                                <div className="w-2 h-2 rounded-full bg-white shadow-sm shadow-white animate-pulse" />
                                {localSettings['attendance.grace_period_minutes']?.value || 15}m Late Grace Period
                            </li>
                            <li className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white/90">
                                <div className="w-2 h-2 rounded-full bg-white/40 shadow-sm" />
                                1hr Rate Late Penalty Active
                            </li>
                            <li className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white/90">
                                <div className="w-2 h-2 rounded-full bg-white/40 shadow-sm" />
                                CEO Approval Flow Enforcement
                            </li>
                        </ul>
                    </div>
                    
                    <GlassCard title="Performance & Absenteeism" icon={<TrendingUp className="w-4 h-4" />}>
                        <div className="space-y-6">
                            {/* Performance Bonus */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Performance Bonus</span>
                                    </div>
                                    <button
                                        onClick={() => handleInputChange('performance.bonus_enabled', !localSettings['performance.bonus_enabled']?.value)}
                                        className={`w-8 h-4 rounded-full transition-colors relative ${localSettings['performance.bonus_enabled']?.value ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-white/10'}`}
                                    >
                                        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all shadow-sm ${localSettings['performance.bonus_enabled']?.value ? 'left-4.5' : 'left-0.5'}`} />
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pl-5 border-l-2 border-slate-100 dark:border-white/5">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-bold uppercase tracking-tight text-slate-400">Score Threshold</label>
                                        <input
                                            type="number"
                                            value={localSettings['performance.bonus_threshold']?.value ?? 80}
                                            onChange={(e) => handleInputChange('performance.bonus_threshold', parseInt(e.target.value))}
                                            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-[11px] font-bold text-slate-900 dark:text-white"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-bold uppercase tracking-tight text-slate-400">Bonus %</label>
                                        <input
                                            type="number"
                                            value={localSettings['performance.bonus_percentage']?.value ?? 5}
                                            onChange={(e) => handleInputChange('performance.bonus_percentage', parseInt(e.target.value))}
                                            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-[11px] font-bold text-slate-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Performance Penalty */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Poor Performance Penalty</span>
                                    </div>
                                    <button
                                        onClick={() => handleInputChange('performance.penalty_enabled', !localSettings['performance.penalty_enabled']?.value)}
                                        className={`w-8 h-4 rounded-full transition-colors relative ${localSettings['performance.penalty_enabled']?.value ? 'bg-rose-500' : 'bg-slate-300 dark:bg-white/10'}`}
                                    >
                                        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all shadow-sm ${localSettings['performance.penalty_enabled']?.value ? 'left-4.5' : 'left-0.5'}`} />
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pl-5 border-l-2 border-slate-100 dark:border-white/5">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-bold uppercase tracking-tight text-slate-400">Score Below</label>
                                        <input
                                            type="number"
                                            value={localSettings['performance.penalty_threshold']?.value ?? 40}
                                            onChange={(e) => handleInputChange('performance.penalty_threshold', parseInt(e.target.value))}
                                            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-[11px] font-bold text-slate-900 dark:text-white"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-bold uppercase tracking-tight text-slate-400">Deduction %</label>
                                        <input
                                            type="number"
                                            value={localSettings['performance.penalty_percentage']?.value ?? 5}
                                            onChange={(e) => handleInputChange('performance.penalty_percentage', parseInt(e.target.value))}
                                            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-[11px] font-bold text-slate-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Absenteeism */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <UserMinus className="w-3.5 h-3.5 text-slate-500" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Absenteeism Impact</span>
                                </div>
                                <div className="pl-5 border-l-2 border-slate-100 dark:border-white/5">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-bold uppercase tracking-tight text-slate-400">Absent Penalty Multiplier (Days)</label>
                                        <input
                                            type="number"
                                            value={localSettings['attendance.absent_penalty_multiplier']?.value ?? 1}
                                            onChange={(e) => handleInputChange('attendance.absent_penalty_multiplier', parseFloat(e.target.value))}
                                            step="0.5"
                                            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-[11px] font-bold text-slate-900 dark:text-white"
                                        />
                                        <p className="text-[8px] text-slate-400 font-medium italic mt-1">
                                            Multiplier applied to the calculated daily rate for each day marked as absent.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
};

export default PoliciesSubTab;
