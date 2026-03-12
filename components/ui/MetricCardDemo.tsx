import React from 'react';
import MetricCard from './MetricCard';

const MetricCardDemo: React.FC = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
          Dynamic Brand Color Metric Cards
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          These cards automatically adapt to your organization's brand colors set in the brand settings.
        </p>
      </div>

      {/* Primary Brand Color Cards */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Primary Brand Color (Dynamic)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Headcount"
            value="342"
            delta="+12"
            trend="up"
            color="primary"
            onClick={() => console.log('Headcount clicked')}
          />
          <MetricCard
            title="Retention"
            value="94.2%"
            delta="+1.2%"
            trend="up"
            color="primary"
          />
          <MetricCard
            title="Burnout Index"
            value="2.1"
            delta="-0.3"
            trend="down"
            color="primary"
          />
          <MetricCard
            title="Open Req"
            value="14"
            delta="+2"
            trend="up"
            color="primary"
          />
        </div>
      </div>

      {/* Different Color Variants */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Color Variants
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Active Employees"
            value="298"
            delta="+5"
            trend="up"
            color="success"
          />
          <MetricCard
            title="Pending Reviews"
            value="23"
            delta="+8"
            trend="up"
            color="warning"
          />
          <MetricCard
            title="New Hires"
            value="12"
            delta="+3"
            trend="up"
            color="info"
          />
          <MetricCard
            title="Satisfaction"
            value="4.7"
            delta="+0.2"
            trend="up"
            color="success"
          />
        </div>
      </div>

      {/* Different Trends */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Trend Indicators
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="Performance Score"
            value="87.5"
            delta="+2.3"
            trend="up"
            color="success"
          />
          <MetricCard
            title="Absenteeism"
            value="3.2%"
            delta="-0.8%"
            trend="down"
            color="warning"
          />
          <MetricCard
            title="Training Hours"
            value="156"
            delta="0"
            trend="neutral"
            color="info"
          />
        </div>
      </div>

      {/* Cards without deltas */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Simple Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <MetricCard
            title="Total Departments"
            value="8"
            color="primary"
          />
          <MetricCard
            title="Office Locations"
            value="3"
            color="info"
          />
          <MetricCard
            title="Active Projects"
            value="24"
            color="success"
          />
          <MetricCard
            title="Certifications"
            value="156"
            color="warning"
          />
        </div>
      </div>
    </div>
  );
};

export default MetricCardDemo;