import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useChartTheme } from '../../../utils/chartTheme';
import CardShell from './CardShell';
import type { DemographicsResponse } from '../../../types/dashboard';

interface Props {
  data: DemographicsResponse;
}

const COLORS = ['var(--brand-primary)', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const DemographicsChart: React.FC<Props> = ({ data }) => {
  const { tooltip } = useChartTheme();
  const chartData = data.employment_type.filter(d => d.value > 0);

  if (!chartData.length) {
    return (
      <CardShell title="Employee Demographics">
        <p className="text-slate-400 text-sm text-center py-8">No data available</p>
      </CardShell>
    );
  }

  return (
    <CardShell title="Employee Demographics">
      <div className="flex items-center gap-4">
        <ResponsiveContainer width={110} height={110}>
          <PieChart>
            <Pie data={chartData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value" strokeWidth={0}>
              {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip {...tooltip} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-1.5">
          {chartData.map((item, i) => (
            <div key={item.label} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-slate-500 dark:text-slate-400 capitalize">{item.label}</span>
              </div>
              <span className="font-semibold text-slate-700 dark:text-slate-200">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </CardShell>
  );
};

export default DemographicsChart;
