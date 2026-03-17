import React from 'react';
import { ICONS } from '../constants';
import MetricCard from '../components/ui/MetricCard';

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Employees"
          value="0"
          icon={<ICONS.People />}
          trend={{ value: 0, isPositive: true }}
        />
        <MetricCard
          title="Present Today"
          value="0"
          icon={<ICONS.Leave />}
          trend={{ value: 0, isPositive: true }}
        />
        <MetricCard
          title="On Leave"
          value="0"
          icon={<ICONS.Leave />}
          trend={{ value: 0, isPositive: false }}
        />
        <MetricCard
          title="Pending Approvals"
          value="0"
          icon={<ICONS.Performance />}
          trend={{ value: 0, isPositive: true }}
        />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Welcome to HR360</h2>
        <p className="text-slate-600 dark:text-slate-400">
          Your dashboard is ready. Start managing your workforce efficiently.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
