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
        <KpiCard label="Total Employees"   value={qs.total_employees}   delta={qs.delta.employees} color="brand" />
        <KpiCard label="Present Today"     value={qs.present_today}     color="emerald" />
        <KpiCard label="On Leave"          value={qs.on_leave}          color="amber" />
        <KpiCard label="Pending Approvals" value={qs.pending_approvals} color="brand" />
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
