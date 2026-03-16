import React from 'react';
import { useQuery } from '@tanstack/react-query';
import GlassCard from '../../GlassCard';
import Skeleton from '../../Skeleton';
import { dashboardService } from '../../../services/dashboardService';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface AttendancePulseWidgetProps {
  endpoint: string;
}

const AttendancePulseWidget: React.FC<AttendancePulseWidgetProps> = ({ endpoint }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['attendance-pulse', endpoint],
    queryFn: () => dashboardService.getMetric(endpoint) as unknown as Promise<any[]>,
    staleTime: 60000, // 1 minute
  });

  return (
    <GlassCard title="Attendance Health">
      <div className="flex flex-col sm:flex-row h-48 items-center w-full mt-4">
        {isLoading ? (
          <Skeleton className="w-full h-full rounded-full max-w-[150px] mx-auto" />
        ) : error ? (
          <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 font-bold uppercase text-center">Connection Lost</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                  {data?.map((e: any, i: number) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 flex-shrink-0 pr-4 mt-4 sm:mt-0">
              {data?.map((d: any, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-[10px] font-bold text-slate-500 uppercase">{d.name}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </GlassCard>
  );
};

export default AttendancePulseWidget;
