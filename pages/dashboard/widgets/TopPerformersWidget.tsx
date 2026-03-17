import React from 'react';
import CardShell from './CardShell';
import type { TopPerformer } from '../../../types/dashboard';

interface Props {
  data: TopPerformer[];
}

const medals = ['🥇', '🥈', '🥉'];

const TopPerformersWidget: React.FC<Props> = ({ data }) => {
  const items = data.slice(0, 5);

  return (
    <CardShell title="Top Performers" action="View All →">
      {items.length === 0 ? (
        <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-6">No performance data yet</p>
      ) : (
        <div className="space-y-2.5">
          {items.map((p, i) => (
            <div key={i} className="flex items-center gap-3 border-l-2 border-brand-primary pl-3 py-1">
              <span className="text-base flex-shrink-0 w-5 text-center">{medals[i] ?? `#${i + 1}`}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{p.name}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide mt-0.5">{p.department}</p>
              </div>
              <span className="text-xs font-bold text-brand-primary flex-shrink-0 tabular-nums">{p.score}%</span>
            </div>
          ))}
        </div>
      )}
    </CardShell>
  );
};

export default TopPerformersWidget;
