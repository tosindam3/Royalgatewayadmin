import React from 'react';
import type { DashboardView } from '../../types/dashboard';

const Pulse = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse bg-slate-200 dark:bg-white/10 rounded-xl ${className}`} />
);

const CardShell = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl p-6 shadow-sm ${className}`}>
    {children}
  </div>
);

const KpiSkeleton = () => (
  <CardShell>
    <Pulse className="h-3 w-24 mb-4" />
    <Pulse className="h-9 w-20 mb-2" />
    <Pulse className="h-2 w-16" />
  </CardShell>
);

const ChartSkeleton = ({ tall = false }: { tall?: boolean }) => (
  <CardShell>
    <div className="flex justify-between mb-4">
      <Pulse className="h-4 w-32" />
      <Pulse className="h-4 w-16" />
    </div>
    <Pulse className={tall ? 'h-52' : 'h-36'} />
  </CardShell>
);

const ListSkeleton = ({ rows = 4 }: { rows?: number }) => (
  <CardShell>
    <Pulse className="h-4 w-36 mb-4" />
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 mb-3">
        <Pulse className="h-8 w-8 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Pulse className="h-3 w-3/4" />
          <Pulse className="h-2 w-1/2" />
        </div>
        <Pulse className="h-6 w-14 rounded-lg" />
      </div>
    ))}
  </CardShell>
);

// Executive skeleton: 4 KPIs + 2 charts + 2 lists
const ExecutiveSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[0, 1, 2, 3].map(i => <KpiSkeleton key={i} />)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartSkeleton tall />
      <ChartSkeleton tall />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <ChartSkeleton />
      <ListSkeleton />
      <ListSkeleton />
    </div>
  </div>
);

// HR Admin skeleton: 4 KPIs + charts + list
const HRAdminSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[0, 1, 2, 3].map(i => <KpiSkeleton key={i} />)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <ChartSkeleton tall />
      <ChartSkeleton tall />
      <ListSkeleton />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartSkeleton />
      <ListSkeleton />
    </div>
  </div>
);

// Manager skeleton: 3 KPIs + team list + chart
const ManagerSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {[0, 1, 2].map(i => <KpiSkeleton key={i} />)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ListSkeleton rows={6} />
      <ChartSkeleton tall />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ListSkeleton />
      <ListSkeleton />
    </div>
  </div>
);

// Employee skeleton: 4 KPIs + personal charts
const EmployeeSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[0, 1, 2, 3].map(i => <KpiSkeleton key={i} />)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartSkeleton tall />
      <CardShell>
        <Pulse className="h-4 w-32 mb-4" />
        {[0, 1, 2].map(i => (
          <div key={i} className="mb-3">
            <div className="flex justify-between mb-1">
              <Pulse className="h-3 w-20" />
              <Pulse className="h-3 w-12" />
            </div>
            <Pulse className="h-2 w-full rounded-full" />
          </div>
        ))}
      </CardShell>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartSkeleton />
      <ListSkeleton rows={3} />
    </div>
  </div>
);

interface DashboardSkeletonProps {
  view: DashboardView;
}

const DashboardSkeleton: React.FC<DashboardSkeletonProps> = ({ view }) => {
  switch (view) {
    case 'executive': return <ExecutiveSkeleton />;
    case 'hr_admin':  return <HRAdminSkeleton />;
    case 'manager':   return <ManagerSkeleton />;
    default:          return <EmployeeSkeleton />;
  }
};

export default DashboardSkeleton;
