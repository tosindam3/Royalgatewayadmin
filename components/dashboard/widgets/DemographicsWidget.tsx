import React from 'react';
import { useQuery } from '@tanstack/react-query';
import GlassCard from '../../GlassCard';
import Skeleton from '../../Skeleton';
import { dashboardService } from '../../../services/dashboardService';

interface DemographicsWidgetProps {
  endpoint: string;
}

const DemographicsWidget: React.FC<DemographicsWidgetProps> = ({ endpoint }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['demographics', endpoint],
    queryFn: () => dashboardService.getMetric(endpoint) as unknown as Promise<any>,
    staleTime: 600000, // 10 minutes
  });

  if (isLoading) return <Skeleton className="h-48 w-full rounded-3xl" />;
  if (error || !data) return <div className="h-48 flex items-center justify-center text-xs text-slate-400 font-bold uppercase">Data Locked</div>;

  return (
    <GlassCard title="Demographics Insight">
      <div className="space-y-6 mt-4">
        <div className="flex items-center justify-around py-4">
          {data.gender?.map((g: any, i: number) => (
            <div key={i} className="text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl mb-2 ${g.name === 'Male' ? 'bg-blue-500/10 text-blue-500' : 'bg-rose-500/10 text-rose-500'}`}>
                {g.name === 'Male' ? '👨' : '👩'}
              </div>
              <p className="text-xl font-black text-slate-900 dark:text-white">{g.pct || '0%'}</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{g.name}</p>
            </div>
          ))}
        </div>
        <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-white/5">
          {data.age_groups?.map((age: any, i: number) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{age.name} Yrs</span>
              <div className="flex-1 mx-4 h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-brand-primary" style={{ width: `${age.value}%` }} />
              </div>
              <span className="text-[10px] font-black text-slate-900 dark:text-white">{age.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
};

export default DemographicsWidget;
