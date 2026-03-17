import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useChartTheme } from '../../../utils/chartTheme';
import CardShell from './CardShell';
import type { TalentTrendsResponse } from '../../../types/dashboard';

interface Props {
  data: TalentTrendsResponse;
}

const HiringFunnelWidget: React.FC<Props> = ({ data }) => {
  const { tooltip, axis } = useChartTheme();

  if (!data.hiring_funnel.length) {
    return (
      <CardShell title="Hiring Funnel">
        <p className="text-slate-400 text-sm text-center py-8">No hiring data available</p>
      </CardShell>
    );
  }

  return (
    <CardShell title="Hiring Funnel">
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data.hiring_funnel} layout="vertical" margin={{ top: 0, right: 4, left: 0, bottom: 0 }}>
          <XAxis type="number" tick={axis} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="stage" tick={axis} axisLine={false} tickLine={false} width={80} />
          <Tooltip {...tooltip} />
          <Bar dataKey="count" name="Candidates" radius={[0, 4, 4, 0]}>
            {data.hiring_funnel.map((_, i) => (
              <Cell key={i} fill="var(--brand-primary)" fillOpacity={1 - i * 0.15} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </CardShell>
  );
};

export default HiringFunnelWidget;
