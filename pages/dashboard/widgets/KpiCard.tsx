import React, { useState } from 'react';

export interface KpiDetail {
  heading: string;
  description?: string;
  rows: { label: string; value: string | number; color?: string }[];
  footer?: string;
}

interface KpiCardProps {
  label: string;
  value: string | number;
  delta?: number;
  color?: 'brand' | 'emerald' | 'amber' | 'red';
  subtext?: string;
  details?: KpiDetail;
}

const colorMap = {
  brand:   'text-brand-primary',
  emerald: 'text-emerald-500',
  amber:   'text-amber-500',
  red:     'text-red-500',
};

const borderMap = {
  brand:   'border-l-brand-primary',
  emerald: 'border-l-emerald-500',
  amber:   'border-l-amber-500',
  red:     'border-l-red-500',
};

const KpiCard: React.FC<KpiCardProps> = ({ label, value, delta, color = 'brand', subtext, details }) => {
  const [open, setOpen] = useState(false);
  const valueColor = colorMap[color];
  const borderColor = borderMap[color];
  const deltaPositive = delta !== undefined && delta >= 0;

  return (
    <>
      <div
        className={`bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 border-l-4 ${borderColor} rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 ${details ? 'cursor-pointer hover:-translate-y-0.5 active:translate-y-0' : ''}`}
        onClick={() => details && setOpen(true)}
        role={details ? 'button' : undefined}
        tabIndex={details ? 0 : undefined}
        onKeyDown={e => details && e.key === 'Enter' && setOpen(true)}
        aria-label={details ? `View ${label} details` : undefined}
      >
        <div className="flex items-start justify-between mb-3">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 leading-tight">
            {label}
          </span>
          <div className="flex items-center gap-1.5">
            {delta !== undefined && (
              <span className={`text-[10px] font-bold leading-tight ${deltaPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                {deltaPositive ? '+' : ''}{delta}
              </span>
            )}
            {details && (
              <span className="text-[9px] text-slate-300 dark:text-slate-600">↗</span>
            )}
          </div>
        </div>

        <p className={`text-3xl md:text-4xl font-bold tracking-tight leading-none ${valueColor}`}>
          {value}
        </p>

        {subtext && (
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 uppercase tracking-wide">
            {subtext}
          </p>
        )}
      </div>

      {/* Detail Modal */}
      {details && open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={() => setOpen(false)}
          />

          {/* Centered modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="pointer-events-auto w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-modal-in">

              {/* Colored top bar */}
              <div className={`h-1.5 w-full bg-gradient-to-r from-brand-primary to-brand-primary/40`} />

              {/* Header */}
              <div className="px-6 pt-5 pb-4 border-b border-slate-100 dark:border-white/10 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    {label}
                  </p>
                  <p className={`text-5xl font-black tracking-tight mt-1 ${valueColor}`}>{value}</p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-2">{details.heading}</p>
                  {details.description && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{details.description}</p>
                  )}
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/20 transition-all text-sm"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              {/* Rows */}
              <div className="px-6 py-3 divide-y divide-slate-50 dark:divide-white/5">
                {details.rows.map((row, i) => (
                  <div key={i} className="flex items-center justify-between py-3">
                    <span className="text-sm text-slate-500 dark:text-slate-400">{row.label}</span>
                    <span className={`text-sm font-bold ${row.color ?? valueColor}`}>{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Footer */}
              {details.footer && (
                <div className="px-6 py-4 bg-slate-50 dark:bg-white/5 border-t border-slate-100 dark:border-white/10">
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">{details.footer}</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default KpiCard;
