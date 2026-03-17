import React from 'react';
import CardShell from './CardShell';
import type { LeaveBalanceItem } from '../../../types/dashboard';

interface Props {
  data: LeaveBalanceItem[];
}

const MyLeaveBalanceWidget: React.FC<Props> = ({ data }) => {
  if (!data.length) {
    return (
      <CardShell title="Leave Balance">
        <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-6">No leave balances found</p>
      </CardShell>
    );
  }

  return (
    <CardShell title="Leave Balance" action="Apply →">
      <div className="space-y-4">
        {data.slice(0, 5).map((item: any) => {
          const total = item.total_allocated ?? item.total ?? 1;
          const used  = item.used ?? 0;
          const avail = item.available ?? (total - used);
          const pct   = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
          const type  = item.leave_type?.name ?? item.type ?? 'Leave';

          return (
            <div key={type}>
              <div className="flex justify-between items-baseline mb-1.5">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{type}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 tabular-nums">
                  {used} used · <span className="font-semibold text-slate-600 dark:text-slate-300">{avail} left</span>
                </span>
              </div>
              {/* Progress bar: brand-color fill on slate track */}
              <div className="h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-primary rounded-full transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </CardShell>
  );
};

export default MyLeaveBalanceWidget;
