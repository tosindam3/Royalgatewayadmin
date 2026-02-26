import React from 'react';
import GlassCard from '../GlassCard';
import { LucideIcon } from 'lucide-react';

interface SummaryKpiCardProps {
    label: string;
    value: number | string;
    icon: LucideIcon;
    color?: string;
    suffix?: string;
    trend?: 'up' | 'down' | 'stable';
    isLoading?: boolean;
}

const SummaryKpiCard: React.FC<SummaryKpiCardProps> = ({
    label,
    value,
    icon: Icon,
    color = 'text-blue-600',
    suffix = '',
    trend,
    isLoading = false,
}) => {
    if (isLoading) {
        return (
            <GlassCard>
                <div className="animate-pulse">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-xl" />
                        <div className="flex-1">
                            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-20 mb-2" />
                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24" />
                        </div>
                    </div>
                </div>
            </GlassCard>
        );
    }

    return (
        <GlassCard>
            <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl bg-slate-100 dark:bg-white/5 ${color}`}>
                    <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            {value}{suffix}
                        </p>
                        {trend && (
                            <span className={`text-xs ${
                                trend === 'up' ? 'text-green-600' : 
                                trend === 'down' ? 'text-red-600' : 
                                'text-gray-600'
                            }`}>
                                {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">{label}</p>
                </div>
            </div>
        </GlassCard>
    );
};

export default SummaryKpiCard;
