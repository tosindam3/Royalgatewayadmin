import React from 'react';
import CardShell from './CardShell';
import type { TeamMemberAttendance } from '../../../types/dashboard';

interface Props {
  data: TeamMemberAttendance[];
}

const statusConfig = {
  present:  { label: 'Present',  cls: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10' },
  late:     { label: 'Late',     cls: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10' },
  absent:   { label: 'Absent',   cls: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10' },
  on_leave: { label: 'On Leave', cls: 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/10' },
};

const TeamAttendanceWidget: React.FC<Props> = ({ data }) => {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <CardShell title="Team Attendance" action={today}>
      {data.length === 0 ? (
        <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-6">No team data available</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {data.map(member => {
            const cfg = statusConfig[member.status] ?? statusConfig.absent;
            const initials = member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
            return (
              <div key={member.id} className="flex items-center gap-3 border-l-2 border-brand-primary pl-3 py-0.5">
                {member.avatar ? (
                  <img src={member.avatar} alt={member.name} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-brand-primary/15 text-brand-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                    {initials}
                  </div>
                )}
                <span className="flex-1 text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{member.name}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg flex-shrink-0 ${cfg.cls}`}>
                  {cfg.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </CardShell>
  );
};

export default TeamAttendanceWidget;
