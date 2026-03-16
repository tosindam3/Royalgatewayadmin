import React from 'react';
import { useQuery } from '@tanstack/react-query';
import GlassCard from '../../GlassCard';
import Skeleton from '../../Skeleton';
import { dashboardService } from '../../../services/dashboardService';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { getTooltipStyles } from '../../../utils/chartTheme';

interface TalentTrendWidgetProps {
  endpoint: string;
}

const TalentTrendWidget: React.FC<TalentTrendWidgetProps> = ({ endpoint }) => {
  const isDark = document.documentElement.classList.contains('dark');
  const tooltipStyles = getTooltipStyles(isDark);

  const { data, isLoading, error } = useQuery({
    queryKey: ['talent-trends', endpoint],
    queryFn: () => dashboardService.getMetric(endpoint) as unknown as Promise<any[]>,
    staleTime: 300000, // 5 minutes
  });

  return (
    <GlassCard
      title="Talent Trends"
      className="cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
      action={<button className="text-[10px] font-black text-brand-primary uppercase tracking-widest hover:underline">View Historical ›</button>}
    >
      <div className="h-[250px] w-full mt-4">
        {isLoading ? (
          <Skeleton className="w-full h-full rounded-xl" />
        ) : error ? (
          <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 font-bold uppercase">Error loading trends</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--brand-primary)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#00000008" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis hide />
              <Tooltip {...tooltipStyles} />
              <Area type="monotone" dataKey="val" stroke="var(--brand-primary)" strokeWidth={3} fill="url(#chartGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </GlassCard>
  );
};

export default TalentTrendWidget;
