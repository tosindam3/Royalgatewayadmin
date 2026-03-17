import React from 'react';

interface KpiCardProps {
  label: string;
  value: string | number;
  delta?: number;
  color?: 'brand' | 'emerald' | 'amber' | 'red';
  subtext?: string;
}

const colorMap = {
  brand:   'text-brand-primary',
  emerald: 'text-emerald-500',
  amber:   'text-amber-500',
  red:     'text-red-500',
};

const KpiCard: React.FC<KpiCardProps> = ({ label, value, delta, color = 'brand', subtext }) => {
  const valueColor = colorMap[color];
  const deltaPositive = delta !== undefined && delta >= 0;

  return (
    <div className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      {/* Label row with inline delta — no pill, just tiny text */}
      <div className="flex items-start justify-between mb-3">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 leading-tight">
          {label}
        </span>
        {delta !== undefined && (
          <span className={`text-[10px] font-bold leading-tight ${deltaPositive ? 'text-emerald-500' : 'text-red-500'}`}>
            {deltaPositive ? '+' : ''}{delta}
          </span>
        )}
      </div>

      {/* Large brand-colored value — no left stripe */}
      <p className={`text-3xl md:text-4xl font-bold tracking-tight leading-none ${valueColor}`}>
        {value}
      </p>

      {subtext && (
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 uppercase tracking-wide">
          {subtext}
        </p>
      )}
    </div>
  );
};

export default KpiCard;
