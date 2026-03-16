import React from 'react';
import { useQuery } from '@tanstack/react-query';
import MetricCard from '../../ui/MetricCard';
import Skeleton from '../../Skeleton';
import { dashboardService } from '../../../services/dashboardService';

interface MetricWidgetProps {
  endpoint: string;
  title: string;
}

const MetricWidget: React.FC<MetricWidgetProps> = ({ endpoint, title }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['metric', endpoint],
    queryFn: () => dashboardService.getMetric(endpoint) as Promise<any>,
    staleTime: 60000, // 1 minute
  });

  if (isLoading) {
    return <Skeleton className="h-32 rounded-2xl" />;
  }

  if (error || !data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 w-full">
        {[1, 2, 3, 4].map(i => (
           <div key={i} className="h-32 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 flex items-center justify-center text-[10px] text-slate-400 uppercase font-bold">
            Data Pending...
          </div>
        ))}
      </div>
    );
  }

  // If it's an array (typical for quick stats), render multiple cards
  if (Array.isArray(data)) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 w-full">
        {data.map((stat, i) => (
          <MetricCard
            key={i}
            title={stat.label}
            value={stat.val}
            delta={stat.delta}
            trend={stat.delta?.includes('+') ? 'up' : stat.delta?.includes('-') ? 'down' : 'neutral'}
            color={stat.color || 'primary'}
          />
        ))}
      </div>
    );
  }

  return (
    <MetricCard
      title={data.label || title}
      value={data.val}
      delta={data.delta}
      trend={data.delta?.includes('+') ? 'up' : data.delta?.includes('-') ? 'down' : 'neutral'}
      color={data.color || 'primary'}
      className="w-full"
    />
  );
};

export default MetricWidget;
