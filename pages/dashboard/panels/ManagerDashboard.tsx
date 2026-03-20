import React from 'react';
import KpiCard from '../widgets/KpiCard';
import AttendancePulse from '../widgets/AttendancePulse';
import TeamAttendanceWidget from '../widgets/TeamAttendanceWidget';
import PendingApprovalsWidget from '../widgets/PendingApprovalsWidget';
import TopPerformersWidget from '../widgets/TopPerformersWidget';
import PerformanceSnapshotWidget from '../widgets/PerformanceSnapshotWidget';
import QuickActionsWidget from '../widgets/QuickActionsWidget';
import { WidgetErrorBoundary } from '../widgets/WidgetError';
import { UserRole } from '../../../types';
import type { useDashboard } from '../useDashboard';

type DashboardData = ReturnType<typeof useDashboard>;

interface Props {
  data: DashboardData;
}

const ManagerDashboard: React.FC<Props> = ({ data }) => {
  const { quickStats: qs, refetch } = data;

  return (
    <div className="space-y-6">
      <div className="mb-2">
        <h1 className="text-3xl md:text-4xl font-black italic text-brand-primary tracking-tight leading-none">
          Manager Dashboard
        </h1>
        <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-1.5">
          Team Overview
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard
          label="Team Size" value={qs.total_employees} color="brand"
          details={{
            heading: 'Team Composition',
            description: 'Your direct team headcount.',
            rows: [
              { label: 'Team Size',        value: qs.total_employees },
              { label: 'Present Today',    value: qs.present_today },
              { label: 'On Leave',         value: qs.on_leave },
              { label: 'Attendance Rate',  value: qs.total_employees > 0 ? `${Math.round((qs.present_today / qs.total_employees) * 100)}%` : '—' },
            ],
          }}
        />
        <KpiCard
          label="Present Today" value={qs.present_today} color="emerald"
          details={{
            heading: 'Attendance Snapshot',
            description: "Today's team attendance.",
            rows: [
              { label: 'Present',          value: qs.present_today, color: 'text-emerald-500' },
              { label: 'On Leave',         value: qs.on_leave,      color: 'text-amber-500' },
              { label: 'Absent / Unknown', value: Math.max(0, qs.total_employees - qs.present_today - qs.on_leave), color: 'text-red-500' },
            ],
          }}
        />
        <KpiCard
          label="Pending Approvals" value={qs.pending_approvals} color="amber"
          details={{
            heading: 'Approval Queue',
            description: 'Team requests awaiting your action.',
            rows: [
              { label: 'Total Pending', value: qs.pending_approvals, color: 'text-amber-500' },
            ],
            footer: 'Visit the Approvals section to action these requests.',
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WidgetErrorBoundary title="Team Attendance" onRetry={refetch.teamAttendance}>
          <TeamAttendanceWidget data={data.teamAttendance} />
        </WidgetErrorBoundary>
        <WidgetErrorBoundary title="Attendance Pulse" onRetry={refetch.attendancePulse}>
          <AttendancePulse data={data.attendancePulse} />
        </WidgetErrorBoundary>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WidgetErrorBoundary title="Pending Approvals" onRetry={refetch.pendingApprovals}>
          <PendingApprovalsWidget data={data.pendingApprovals} />
        </WidgetErrorBoundary>
        <WidgetErrorBoundary title="Top Performers" onRetry={refetch.topPerformers}>
          <TopPerformersWidget data={data.topPerformers} />
        </WidgetErrorBoundary>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WidgetErrorBoundary title="Performance Snapshot">
          <PerformanceSnapshotWidget
            orgAvgScore={0}
            topPerformersCount={data.topPerformers.length}
          />
        </WidgetErrorBoundary>
        <QuickActionsWidget role={UserRole.MANAGER} />
      </div>
    </div>
  );
};

export default ManagerDashboard;
