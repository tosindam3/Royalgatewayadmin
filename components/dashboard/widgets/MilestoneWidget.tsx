import React from 'react';
import GlassCard from '../../GlassCard';

interface MilestoneWidgetProps {
  data: any[];
}

const MilestoneWidget: React.FC<MilestoneWidgetProps> = ({ data }) => {
  return (
    <GlassCard title="Upcoming Milestones">
      <div className="space-y-6 mt-4">
        {data?.map((item: any, i: number) => (
          <div key={i} className={`p-4 rounded-2xl bg-black/5 dark:bg-white/5 border-l-4 ${item.c} group hover:bg-brand-primary-10 transition-all cursor-pointer`}>
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{item.t}</h4>
              <span className="text-xl">{item.i}</span>
            </div>
            <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase">{item.d}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

export default MilestoneWidget;
