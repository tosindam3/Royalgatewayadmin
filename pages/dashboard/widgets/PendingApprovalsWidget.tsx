import React from 'react';
import CardShell from './CardShell';
import type { PendingApprovalItem } from '../../../types/dashboard';

interface Props {
  data: PendingApprovalItem[];
}

const PendingApprovalsWidget: React.FC<Props> = ({ data }) => {
  const items = data.slice(0, 5);

  return (
    <CardShell
      title="Pending Approvals"
      action={data.length > 0 ? `${data.length} pending` : undefined}
    >
      {items.length === 0 ? (
        <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-6">No pending approvals</p>
      ) : (
        <div className="space-y-2.5">
          {items.map(item => (
            <div
              key={item.id}
              className="flex items-center gap-3 border-l-2 border-brand-primary pl-3 py-1"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{item.requester}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide mt-0.5">
                  {item.type} · {item.request_number}
                </p>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 flex-shrink-0 tabular-nums">
                {new Date(item.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          ))}
        </div>
      )}
    </CardShell>
  );
};

export default PendingApprovalsWidget;
