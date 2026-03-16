import React from 'react';
import GlassCard from '../../GlassCard';
import { Target, Calendar, CheckSquare, Sparkles } from 'lucide-react';

interface EmployeeSummaryProps {
  data: {
    performance: {
      latest_score: number;
      target: number;
      status: string;
    };
    attendance: {
      days_present: number;
      total_days: number;
      percentage: number;
    };
    tasks: {
      pending_count: number;
      next_due: string | null;
    };
    ai_advisory: {
      message: string;
      sentiment: string;
      recommendation_link: string;
    };
  };
}

const EmployeeSummaryWidget: React.FC<EmployeeSummaryProps> = ({ data }) => {
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Performance Score */}
      <GlassCard className="relative overflow-hidden group">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <Target className="w-5 h-5 text-purple-500" />
          </div>
          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
            data.performance.latest_score >= 80 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
          }`}>
            {data.performance.status}
          </span>
        </div>
        <div className="space-y-1">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Performance Score</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
              {data.performance.latest_score}%
            </span>
            <span className="text-xs text-slate-400 font-bold">/ {data.performance.target}%</span>
          </div>
        </div>
        <div className="mt-4 h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-purple-500 rounded-full transition-all duration-1000"
            style={{ width: `${data.performance.latest_score}%` }}
          />
        </div>
      </GlassCard>

      {/* Attendance Summary */}
      <GlassCard>
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Calendar className="w-5 h-5 text-blue-500" />
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">MTD</span>
        </div>
        <div className="space-y-1">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Attendance Health</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
              {data.attendance.percentage}%
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase">
             {data.attendance.days_present} of {data.attendance.total_days} work days
          </p>
        </div>
      </GlassCard>

      {/* Pending Tasks */}
      <GlassCard>
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-orange-500/10 rounded-lg">
            <CheckSquare className="w-5 h-5 text-orange-500" />
          </div>
          <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest font-bold">
            Action Req
          </span>
        </div>
        <div className="space-y-1">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pending Tasks</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
              {data.tasks.pending_count}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase leading-none">
            {data.tasks.next_due ? `Next due: ${data.tasks.next_due}` : 'No upcoming deadlines'}
          </p>
        </div>
      </GlassCard>

      {/* AI Advisory */}
      <GlassCard className="bg-gradient-to-br from-purple-500/5 to-indigo-500/5 border-purple-500/20">
        <div className="flex justify-between items-start mb-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg">
            <Sparkles className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/50 animate-pulse delay-75" />
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/20 animate-pulse delay-150" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">AI Performance Advisory</h3>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed italic">
            "{data.ai_advisory.message}"
          </p>
          <a 
            href={data.ai_advisory.recommendation_link}
            className="inline-block text-[9px] font-black text-indigo-500 uppercase tracking-widest hover:underline mt-2"
          >
            view recommendation →
          </a>
        </div>
      </GlassCard>
    </div>
  );
};

export default EmployeeSummaryWidget;
