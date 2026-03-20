import React from 'react';
import KpiCard from '../widgets/KpiCard';
import HeadcountChart from '../widgets/HeadcountChart';
import AttendancePulse from '../widgets/AttendancePulse';
import TurnoverChart from '../widgets/TurnoverChart';
import DemographicsChart from '../widgets/DemographicsChart';
import PayrollSummaryCard from '../widgets/PayrollSummaryCard';
import PendingApprovalsWidget from '../widgets/PendingApprovalsWidget';
import TopPerformersWidget from '../widgets/TopPerformersWidget';
import PerformanceSnapshotWidget from '../widgets/PerformanceSnapshotWidget';
import HiringFunnelWidget from '../widgets/HiringFunnelWidget';
import QuickActionsWidget from '../widgets/QuickActionsWidget';
import { WidgetErrorBoundary } from '../widgets/WidgetError';
import { UserRole } from '../../../types';
import type { useDashboard } from '../useDashboard';

type DashboardData = ReturnType<typeof useDashboard>;

interface Props {
  data: DashboardData;
}

const ExecutiveDashboard: React.FC<Props> = ({ data }) => {
  const { quickStats: qs, refetch } = data;

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div className="mb-2">
        <h1 className="text-3xl md:text-4xl font-black italic text-brand-primary tracking-tight leading-none">
          Executive Dashboard
        </h1>
        <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-1.5">
          Organisation Overview
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Employees" value={qs.total_employees} delta={qs.delta.employees} color="brand"
          details={{
            heading: 'Workforce Breakdown',
            description: 'Organisation-wide headcount summary.',
            rows: [
              { label: 'Total Headcount', value: qs.total_employees },
              { label: 'Present Today',   value: qs.present_today },
              { label: 'On Leave',        value: qs.on_leave },
              { label: 'Avg Tenure',      value: `${qs.avg_tenure_years.toFixed(1)} yrs` },
              { label: 'Active Openings', value: qs.active_openings },
              { label: 'Turnover Rate',   value: `${qs.turnover_rate}%`, color: qs.turnover_rate > 10 ? 'text-red-500' : 'text-emerald-500' },
            ],
            footer: `Delta vs last period: ${qs.delta.employees >= 0 ? '+' : ''}${qs.delta.employees} employees`,
          }}
        />
        <KpiCard
          label="Present Today" value={qs.present_today} color="emerald"
          details={{
            heading: 'Attendance Snapshot',
            description: "Today's attendance across all employees.",
            rows: [
              { label: 'Present',          value: qs.present_today, color: 'text-emerald-500' },
              { label: 'On Leave',         value: qs.on_leave,      color: 'text-amber-500' },
              { label: 'Absent / Unknown', value: Math.max(0, qs.total_employees - qs.present_today - qs.on_leave), color: 'text-red-500' },
              { label: 'Attendance Rate',  value: qs.total_employees > 0 ? `${Math.round((qs.present_today / qs.total_employees) * 100)}%` : '—' },
            ],
          }}
        />
        <KpiCard
          label="On Leave" value={qs.on_leave} color="amber"
          details={{
            heading: 'Leave Overview',
            description: 'Employees currently on approved leave.',
            rows: [
              { label: 'On Leave Today',   value: qs.on_leave, color: 'text-amber-500' },
              { label: 'Pending Requests', value: qs.pending_approvals },
              { label: '% of Workforce',   value: qs.total_employees > 0 ? `${Math.round((qs.on_leave / qs.total_employees) * 100)}%` : '—' },
            ],
          }}
        />
        <KpiCard
          label="Pending Approvals" value={qs.pending_approvals} color="brand"
          details={{
            heading: 'Approval Queue',
            description: 'Requests awaiting action.',
            rows: [
              { label: 'Total Pending', value: qs.pending_approvals },
            ],
            footer: 'Visit the Approvals section to action these requests.',
          }}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WidgetErrorBoundary title="Headcount Chart" onRetry={refetch.talentTrends}>
          <HeadcountChart data={data.talentTrends} />
        </WidgetErrorBoundary>
        <WidgetErrorBoundary title="Attendance Pulse" onRetry={refetch.attendancePulse}>
          <AttendancePulse data={data.attendancePulse} />
        </WidgetErrorBoundary>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <WidgetErrorBoundary title="Turnover Chart" onRetry={refetch.talentTrends}>
          <TurnoverChart data={data.talentTrends} turnoverRate={qs.turnover_rate} />
        </WidgetErrorBoundary>
        <WidgetErrorBoundary title="Demographics" onRetry={refetch.demographics}>
          <DemographicsChart data={data.demographics} />
        </WidgetErrorBoundary>
        <WidgetErrorBoundary title="Payroll Summary" onRetry={refetch.payrollSummary}>
          <PayrollSummaryCard data={data.payrollSummary} />
        </WidgetErrorBoundary>
      </div>

      {/* Lists Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <WidgetErrorBoundary title="Pending Approvals" onRetry={refetch.pendingApprovals}>
          <PendingApprovalsWidget data={data.pendingApprovals} />
        </WidgetErrorBoundary>
        <WidgetErrorBoundary title="Top Performers" onRetry={refetch.topPerformers}>
          <TopPerformersWidget data={data.topPerformers} />
        </WidgetErrorBoundary>
        <WidgetErrorBoundary title="Hiring Funnel" onRetry={refetch.talentTrends}>
          <HiringFunnelWidget data={data.talentTrends} />
        </WidgetErrorBoundary>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <WidgetErrorBoundary title="Performance Snapshot">
          <PerformanceSnapshotWidget
            orgAvgScore={0}
            topPerformersCount={data.topPerformers.length}
          />
        </WidgetErrorBoundary>
        <div className="lg:col-span-2">
          <QuickActionsWidget role={UserRole.SUPER_ADMIN} />
        </div>
      </div>
    </div>
  );
};

export default ExecutiveDashboard;
