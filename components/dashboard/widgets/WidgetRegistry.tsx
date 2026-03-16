import React, { lazy, Suspense } from 'react';
import Skeleton from '../../Skeleton';

const MetricWidget = lazy(() => import('./MetricWidget'));
const TalentTrendWidget = lazy(() => import('./TalentTrendWidget'));
const AttendancePulseWidget = lazy(() => import('./AttendancePulseWidget'));
const MilestoneWidget = lazy(() => import('./MilestoneWidget'));
const DemographicsWidget = lazy(() => import('./DemographicsWidget'));
const EmployeeSummaryWidget = lazy(() => import('./EmployeeSummaryWidget'));

// Loading component for Suspense
const WidgetLoader = () => <Skeleton className="w-full h-full min-h-[200px] rounded-2xl" />;

export const WidgetRegistry: Record<string, React.FC<any>> = {
  'metric_group': (props) => (
    <Suspense fallback={<WidgetLoader />}>
      <MetricWidget {...props} />
    </Suspense>
  ),
  'chart_area': (props) => (
    <Suspense fallback={<WidgetLoader />}>
      <TalentTrendWidget {...props} />
    </Suspense>
  ),
  'chart_pie': (props) => (
    <Suspense fallback={<WidgetLoader />}>
      <AttendancePulseWidget {...props} />
    </Suspense>
  ),
  'list_milestones': (props) => (
    <Suspense fallback={<WidgetLoader />}>
      <MilestoneWidget {...props} />
    </Suspense>
  ),
  'demographics': (props) => (
    <Suspense fallback={<WidgetLoader />}>
      <DemographicsWidget {...props} />
    </Suspense>
  ),
  'employee_metrics': (props) => (
    <Suspense fallback={<WidgetLoader />}>
      <EmployeeSummaryWidget {...props} />
    </Suspense>
  ),
};

export const renderWidget = (widget: any) => {
  const WidgetComponent = WidgetRegistry[widget.type];
  if (!WidgetComponent || !widget.authorized) return null;

  const { key, type, authorized, className, ...componentProps } = widget;

  return (
    <div key={key} className={className || ''}>
      <WidgetComponent {...componentProps} />
    </div>
  );
};
