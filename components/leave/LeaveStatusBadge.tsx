import React from 'react';
import { LeaveRequestStatus } from '../../types/leave';

interface LeaveStatusBadgeProps {
  status: LeaveRequestStatus;
}

const LeaveStatusBadge: React.FC<LeaveStatusBadgeProps> = ({ status }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'draft':
        return 'bg-slate-100 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400';
      case 'pending':
        return 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400';
      case 'approved':
        return 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
      case 'rejected':
        return 'bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400';
      case 'cancelled':
        return 'bg-slate-100 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400';
      default:
        return 'bg-slate-100 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400';
    }
  };

  return (
    <span
      className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${getStatusStyles()}`}
    >
      {status}
    </span>
  );
};

export default LeaveStatusBadge;
