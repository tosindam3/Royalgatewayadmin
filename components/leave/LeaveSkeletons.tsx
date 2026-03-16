import React from 'react';

export const StatsCardSkeleton: React.FC = () => (
  <div className="p-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl animate-pulse">
    <div className="flex justify-between items-start mb-2">
      <div className="h-8 w-16 bg-slate-300 dark:bg-white/5 rounded" />
      <div className="h-6 w-6 bg-slate-300 dark:bg-white/5 rounded-lg" />
    </div>
    <div className="h-4 w-32 bg-slate-300 dark:bg-white/5 rounded mb-2" />
    <div className="h-3 w-24 bg-slate-300 dark:bg-white/5 rounded" />
  </div>
);

export const TableRowSkeleton: React.FC = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-slate-300 dark:bg-white/5 rounded-full" />
        <div className="space-y-2">
          <div className="h-3 w-32 bg-slate-300 dark:bg-white/5 rounded" />
          <div className="h-2 w-24 bg-slate-300 dark:bg-white/5 rounded" />
        </div>
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="h-3 w-24 bg-slate-300 dark:bg-white/5 rounded" />
    </td>
    <td className="px-6 py-4">
      <div className="space-y-1">
        <div className="h-3 w-16 bg-slate-300 dark:bg-white/5 rounded" />
        <div className="h-2 w-28 bg-slate-300 dark:bg-white/5 rounded" />
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="h-5 w-20 bg-slate-300 dark:bg-white/5 rounded-full" />
    </td>
    <td className="px-6 py-4">
      <div className="h-3 w-24 bg-slate-300 dark:bg-white/5 rounded" />
    </td>
    <td className="px-6 py-4 text-right">
      <div className="h-3 w-20 bg-slate-300 dark:bg-white/5 rounded ml-auto" />
    </td>
  </tr>
);

export const PendingRequestSkeleton: React.FC = () => (
  <div className="p-3 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl animate-pulse">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-slate-300 dark:bg-white/5 rounded-full" />
        <div className="space-y-2">
          <div className="h-3 w-28 bg-slate-300 dark:bg-white/5 rounded" />
          <div className="h-2 w-20 bg-slate-300 dark:bg-white/5 rounded" />
        </div>
      </div>
      <div className="flex gap-1">
        <div className="h-6 w-16 bg-slate-300 dark:bg-white/5 rounded" />
        <div className="h-6 w-16 bg-slate-300 dark:bg-white/5 rounded" />
      </div>
    </div>
  </div>
);

export const BalanceRowSkeleton: React.FC = () => (
  <tr className="animate-pulse">
    <td className="px-4 py-4">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 bg-slate-300 dark:bg-white/5 rounded-full" />
        <div className="h-3 w-32 bg-slate-300 dark:bg-white/5 rounded" />
      </div>
    </td>
    <td className="px-4 py-4">
      <div className="h-3 w-24 bg-slate-300 dark:bg-white/5 rounded" />
    </td>
    <td className="px-4 py-4">
      <div className="h-5 w-16 bg-slate-300 dark:bg-white/5 rounded-full" />
    </td>
    <td className="px-4 py-4">
      <div className="h-3 w-16 bg-slate-300 dark:bg-white/5 rounded" />
    </td>
    <td className="px-4 py-4 text-right">
      <div className="h-3 w-20 bg-slate-300 dark:bg-white/5 rounded ml-auto" />
    </td>
  </tr>
);

export const PolicyCardSkeleton: React.FC = () => (
  <div className="p-6 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl animate-pulse">
    <div className="h-4 w-32 bg-slate-300 dark:bg-white/5 rounded mb-4" />
    <div className="space-y-3">
      <div className="flex justify-between">
        <div className="h-3 w-24 bg-slate-300 dark:bg-white/5 rounded" />
        <div className="h-3 w-16 bg-slate-300 dark:bg-white/5 rounded" />
      </div>
      <div className="flex justify-between">
        <div className="h-3 w-28 bg-slate-300 dark:bg-white/5 rounded" />
        <div className="h-3 w-20 bg-slate-300 dark:bg-white/5 rounded" />
      </div>
      <div className="flex justify-between pb-4">
        <div className="h-3 w-24 bg-slate-300 dark:bg-white/5 rounded" />
        <div className="h-3 w-16 bg-slate-300 dark:bg-white/5 rounded" />
      </div>
      <div className="pt-4 border-t border-slate-200 dark:border-white/5">
        <div className="h-3 w-full bg-slate-300 dark:bg-white/5 rounded" />
      </div>
    </div>
  </div>
);

export const HolidayCardSkeleton: React.FC = () => (
  <div className="p-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl animate-pulse">
    <div className="flex items-center gap-6">
      <div className="w-16 h-16 bg-slate-300 dark:bg-white/5 rounded-xl" />
      <div className="flex-1 space-y-2">
        <div className="flex justify-between items-center">
          <div className="h-4 w-40 bg-slate-300 dark:bg-white/5 rounded" />
          <div className="h-5 w-20 bg-slate-300 dark:bg-white/5 rounded-full" />
        </div>
        <div className="h-3 w-full bg-slate-300 dark:bg-white/5 rounded" />
      </div>
    </div>
  </div>
);

export const CalendarSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="grid grid-cols-7 gap-px bg-slate-300 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
        <div
          key={d}
          className="bg-white dark:bg-[#0f172a] p-3 text-center text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-white/5"
        >
          {d}
        </div>
      ))}
      {Array.from({ length: 35 }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-[#0f172a] h-20 p-2 border-r border-b border-slate-200 dark:border-white/5"
        >
          <div className="h-4 w-4 bg-slate-300 dark:bg-white/5 rounded" />
        </div>
      ))}
    </div>
  </div>
);
