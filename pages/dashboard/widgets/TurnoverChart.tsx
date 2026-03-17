import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useChartTheme } from '../../../utils/chartTheme';
import CardShell from './CardShell';
import type { TalentTrendsResponse } from '../../../types/dashboard';

interface Props {
  data: TalentTrendsResponse;
  turnoverRate?: number;
}

const TurnoverChart: React.FC<Props> = ({ data, turnoverRate }) => {
  const { tooltip, axis } = useChartTheme();

  if (!data.turnover.length || data.turnover[0]?.category === 'No Data') {
    return (
      <CardShell title="Employee Turnover">
        <p className="text-slate-400 text-sm text-center py-8">No turnover data available</p>
      </CardShell>
    );
  }

  return (
    <CardShell
      title="Employee Turnover"
      action={turnoverRate !== undefined ? (
        <span className={`text-[10px] font-semibold ${turnoverRate > 10 ? 'text-red-500' : 'text-emerald-500'}`}>
          {turnoverRate}% rate
        </span>
      ) : undefined}
    >
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data.turnover} layout="vertical" margin={{ top: 0, right: 4, left: 0, bottom: 0 }}>
          <XAxis type="number" tick={axis} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="category" tick={axis} axisLine={false} tickLine={false} width={70} />
          <Tooltip {...tooltip} />
          <Bar dataKey="count" name="Employees" radius={[0, 4, 4, 0]}>
            {data.turnover.map((_, i) => (
              <Cell key={i} fill="var(--brand-primary)" fillOpacity={0.8 - i * 0.1} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </CardShell>
  );
};

export default TurnoverChart;
