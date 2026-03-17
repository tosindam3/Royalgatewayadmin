import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { useChartTheme } from '../../../utils/chartTheme';
import CardShell from './CardShell';
import type { TalentTrendsResponse } from '../../../types/dashboard';

interface Props {
  data: TalentTrendsResponse;
}

const HeadcountChart: React.FC<Props> = ({ data }) => {
  const { tooltip, axis, grid } = useChartTheme();

  if (!data.headcount.length) {
    return (
      <CardShell title="Headcount Over Time">
        <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-10">No data available</p>
      </CardShell>
    );
  }

  return (
    <CardShell title="Headcount Over Time" action="View Details →">
      <ResponsiveContainer width="100%" height={190}>
        <AreaChart data={data.headcount} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="hcGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="var(--brand-primary)" stopOpacity={0.15} />
              <stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...grid} vertical={false} />
          <XAxis dataKey="month" tick={axis} axisLine={false} tickLine={false} />
          <YAxis tick={axis} axisLine={false} tickLine={false} />
          <Tooltip {...tooltip} />
          <Area
            type="monotone"
            dataKey="count"
            name="Headcount"
            stroke="var(--brand-primary)"
            strokeWidth={2}
            fill="url(#hcGrad)"
            dot={false}
            activeDot={{ r: 4, fill: 'var(--brand-primary)', strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </CardShell>
  );
};

export default HeadcountChart;
