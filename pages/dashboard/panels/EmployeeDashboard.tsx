import React from 'react';
import KpiCard from '../widgets/KpiCard';
import MyAttendanceSummary from '../widgets/MyAttendanceSummary';
import MyLeaveBalanceWidget from '../widgets/MyLeaveBalanceWidget';
import PersonalScoreCard from '../widgets/PersonalScoreCard';
import QuickActionsWidget from '../widgets/QuickActionsWidget';
import { WidgetErrorBoundary } from '../widgets/WidgetError';
import { UserRole } from '../../../types';
import type { useDashboard } from '../useDashboard';

type DashboardData = ReturnType<typeof useDashboard>;

interface Props {
  data: DashboardData;
}

const clockStatusLabel: Record<string, string> = {
  clocked_in:  'Clocked In',
  clocked_out: 'Clocked Out',
  not_started: 'Not Started',
};

const EmployeeDashboard: React.FC<Props> = ({ data }) => {
  const { mySummary: ms, personalPerformance: pp, refetch } = data;

  const clockLabel = clockStatusLabel[ms.clock_status] ?? 'Unknown';
  const clockSubtext = ms.clock_in_time ? `Since ${ms.clock_in_time}` : undefined;

  return (
    <div className="space-y-6">
      <div className="mb-2">
        <h1 className="text-3xl md:text-4xl font-black italic text-brand-primary tracking-tight leading-none">
          My Dashboard
        </h1>
        <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-1.5">
          Personal Overview
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Days Present"
          value={ms.days_present}
          color="emerald"
          subtext="This month"
        />
        <KpiCard
          label="Days Absent"
          value={ms.days_absent}
          color="red"
          subtext="This month"
        />
        <KpiCard
          label="Leave Balance"
          value={ms.leave_balance_total}
          color="brand"
          subtext="Days remaining"
        />
        <KpiCard
          label="My Score"
          value={pp.has_submission ? `${pp.current_score}%` : '—'}
          color="brand"
          subtext={pp.rating?.label ?? 'No evaluation yet'}
        />
      </div>

      {/* Clock status banner */}
      {ms.clock_status !== 'not_started' && (
        <div className={`rounded-2xl px-5 py-3 flex items-center gap-3 border ${
          ms.clock_status === 'clocked_in'
            ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'
            : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10'
        }`}>
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${ms.clock_status === 'clocked_in' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{clockLabel}</span>
          {clockSubtext && <span className="text-xs text-slate-400 dark:text-slate-500">{clockSubtext}</span>}
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WidgetErrorBoundary title="My Attendance" onRetry={refetch.mySummary}>
          <MyAttendanceSummary data={ms} />
        </WidgetErrorBoundary>
        <WidgetErrorBoundary title="Leave Balance" onRetry={refetch.leaveBalances}>
          <MyLeaveBalanceWidget data={data.leaveBalances} />
        </WidgetErrorBoundary>
      </div>

      {/* Performance + Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WidgetErrorBoundary title="My Performance Score" onRetry={refetch.personalPerformance}>
          <PersonalScoreCard data={pp} />
        </WidgetErrorBoundary>
        <QuickActionsWidget role={UserRole.EMPLOYEE} />
      </div>
    </div>
  );
};

export default EmployeeDashboard;
