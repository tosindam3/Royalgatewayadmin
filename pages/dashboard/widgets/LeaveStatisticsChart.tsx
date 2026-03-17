import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useChartTheme } from '../../../utils/chartTheme';
import CardShell from './CardShell';

interface Props {
  // Passed from quick stats or a dedicated endpoint — shape: [{dept, approved, pending, rejected}]
  data: { dept: string; approved: number; pending: number; rejected: number }[];
}

const LeaveStatisticsChart: React.FC<Props> = ({ data }) => {
  const { tooltip, axis } = useChartTheme();

  if (!data.length) {
    return (
      <CardShell title="Leave Statistics">
        <p className="text-slate-400 text-sm text-center py-8">No leave data available</p>
      </CardShell>
    );
  }

  return (
    <CardShell title="Leave Statistics">
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <XAxis dataKey="dept" tick={axis} axisLine={false} tickLine={false} />
          <YAxis tick={axis} axisLine={false} tickLine={false} />
          <Tooltip {...tooltip} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <Bar dataKey="approved" name="Approved" fill="#10b981" stackId="a" radius={[0, 0, 0, 0]} />
          <Bar dataKey="pending"  name="Pending"  fill="#f59e0b" stackId="a" />
          <Bar dataKey="rejected" name="Rejected" fill="#ef4444" stackId="a" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </CardShell>
  );
};

export default LeaveStatisticsChart;
