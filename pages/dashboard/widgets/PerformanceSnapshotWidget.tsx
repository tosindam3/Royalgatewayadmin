import React from 'react';
import CardShell from './CardShell';

interface Props {
  orgAvgScore: number;
  topPerformersCount?: number;
  completionRate?: number;
}

const PerformanceSnapshotWidget: React.FC<Props> = ({ orgAvgScore, topPerformersCount, completionRate }) => {
  return (
    <CardShell title="Performance Overview" action="View All →">
      {/* Large org avg score — KPI style */}
      <p className="text-3xl md:text-4xl font-bold tracking-tight leading-none text-brand-primary">
        {orgAvgScore}%
      </p>
      <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-1.5 mb-4">
        Org Avg Score
      </p>

      <div className="space-y-3">
        {completionRate !== undefined && (
          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wide">Completion Rate</span>
              <span className="font-bold text-slate-700 dark:text-slate-200 tabular-nums">{completionRate}%</span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-brand-primary rounded-full transition-all duration-700" style={{ width: `${completionRate}%` }} />
            </div>
          </div>
        )}
        {topPerformersCount !== undefined && (
          <div className="flex justify-between items-center pt-1 border-t border-slate-100 dark:border-white/10">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">Top Performers</span>
            <span className="text-sm font-bold text-emerald-500 tabular-nums">{topPerformersCount}</span>
          </div>
        )}
      </div>
    </CardShell>
  );
};

export default PerformanceSnapshotWidget;
