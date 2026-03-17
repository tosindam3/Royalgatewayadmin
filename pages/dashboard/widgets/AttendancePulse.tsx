import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useChartTheme } from '../../../utils/chartTheme';
import CardShell from './CardShell';
import type { AttendancePulseResponse } from '../../../types/dashboard';

interface Props {
  data: AttendancePulseResponse;
}

const COLORS = ['var(--brand-primary)', '#10b981', '#f59e0b', '#ef4444'];

const AttendancePulse: React.FC<Props> = ({ data }) => {
  const { tooltip } = useChartTheme();

  const chartData = [
    { name: 'Present',  value: Math.max(0, data.present - data.late) },
    { name: 'On Time',  value: data.present > 0 ? Math.max(0, data.present - data.late) : 0 },
    { name: 'Late',     value: data.late },
    { name: 'Absent',   value: data.absent },
  ].filter(d => d.value > 0);

  if (!data.total) {
    return (
      <CardShell title="Attendance Health">
        <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-10">No attendance data today</p>
      </CardShell>
    );
  }

  const legendItems = [
    { label: 'Present',  value: data.present,  color: COLORS[0] },
    { label: 'Late',     value: data.late,     color: COLORS[2] },
    { label: 'Absent',   value: data.absent,   color: COLORS[3] },
    { label: 'On Leave', value: data.on_leave, color: '#94a3b8' },
  ];

  return (
    <CardShell title="Attendance Health">
      <div className="flex items-center gap-5">
        {/* Donut chart */}
        <div className="flex-shrink-0">
          <ResponsiveContainer width={110} height={110}>
            <PieChart>
              <Pie
                data={chartData.length ? chartData : [{ name: 'No Data', value: 1 }]}
                cx="50%"
                cy="50%"
                innerRadius={32}
                outerRadius={52}
                dataKey="value"
                strokeWidth={0}
              >
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...tooltip} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend — dot + label + count */}
        <div className="flex-1 space-y-2">
          {legendItems.map(item => (
            <div key={item.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-[11px] text-slate-500 dark:text-slate-400">{item.label}</span>
              </div>
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 tabular-nums">{item.value}</span>
            </div>
          ))}
          <div className="pt-1.5 border-t border-slate-100 dark:border-white/10">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide">
              {data.percentage_present}% present rate
            </span>
          </div>
        </div>
      </div>
    </CardShell>
  );
};

export default AttendancePulse;
