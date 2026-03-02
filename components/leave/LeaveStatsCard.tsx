import React from 'react';
import GlassCard from '../GlassCard';

interface LeaveStatsCardProps {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  delta?: string;
  action?: string;
  onClick?: () => void;
}

const LeaveStatsCard: React.FC<LeaveStatsCardProps> = ({
  label,
  value,
  icon,
  color,
  delta,
  action,
  onClick,
}) => {
  return (
    <GlassCard
      className={`!p-4 border-l-4 ${color} hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-all ${
        onClick ? 'cursor-pointer' : 'cursor-default'
      }`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-3xl font-black text-slate-900 dark:text-white">{value}</span>
        <span className="p-1.5 bg-slate-100 dark:bg-white/5 rounded-lg text-lg grayscale opacity-60">
          {icon}
        </span>
      </div>
      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight leading-tight mb-2 h-6 flex items-center">
        {label}
      </p>
      {delta ? (
        <p className="text-[9px] font-bold text-amber-600 dark:text-amber-500/80">{delta}</p>
      ) : action ? (
        <button className="text-[9px] font-black text-[#8252e9] uppercase tracking-widest hover:underline">
          {action} &gt;
        </button>
      ) : null}
    </GlassCard>
  );
};

export default LeaveStatsCard;
