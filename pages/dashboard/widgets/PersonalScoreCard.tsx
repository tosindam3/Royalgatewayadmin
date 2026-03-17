import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useChartTheme } from '../../../utils/chartTheme';
import CardShell from './CardShell';
import type { PersonalPerformanceResponse } from '../../../types/dashboard';

interface Props {
  data: PersonalPerformanceResponse;
}

const PersonalScoreCard: React.FC<Props> = ({ data }) => {
  const { tooltip, axis, grid } = useChartTheme();

  if (!data.has_submission) {
    return (
      <CardShell title="My Performance Score">
        <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-8">No evaluation submitted yet</p>
      </CardShell>
    );
  }

  const scoreColor = data.rating?.color ?? 'var(--brand-primary)';

  return (
    <CardShell title="My Performance Score">
      {/* Score + rating badge */}
      <div className="flex items-start gap-5 mb-5">
        <div>
          <p className="text-4xl font-bold tracking-tight leading-none" style={{ color: scoreColor }}>
            {data.current_score}%
          </p>
          {data.rating && (
            <span
              className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-lg mt-2 uppercase tracking-wide"
              style={{
                backgroundColor: data.rating.bgColor,
                color: data.rating.color,
                border: `1px solid ${data.rating.borderColor}`,
              }}
            >
              {data.rating.label}
            </span>
          )}
        </div>

        {/* Comparison bars */}
        <div className="flex-1 space-y-2 pt-1">
          {[
            { label: 'My Score',  value: data.current_score,       color: scoreColor },
            { label: 'Dept Avg',  value: data.department_average,  color: '#f59e0b' },
            { label: 'Org Avg',   value: data.organization_average, color: '#94a3b8' },
          ].map(item => (
            <div key={item.label}>
              <div className="flex justify-between text-[10px] mb-0.5">
                <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wide">{item.label}</span>
                <span className="font-bold text-slate-700 dark:text-slate-200 tabular-nums">{item.value}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${item.value}%`, backgroundColor: item.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trend line */}
      {data.history.length > 1 && (
        <ResponsiveContainer width="100%" height={70}>
          <LineChart data={data.history} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <CartesianGrid {...grid} vertical={false} />
            <XAxis dataKey="period" tick={axis} axisLine={false} tickLine={false} />
            <Tooltip {...tooltip} />
            <Line
              type="monotone"
              dataKey="score"
              stroke={scoreColor}
              strokeWidth={2}
              dot={false}
              name="My Score"
              activeDot={{ r: 3, strokeWidth: 0 }}
            />
            <Line
              type="monotone"
              dataKey="dept_avg"
              stroke="#f59e0b"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="4 2"
              name="Dept Avg"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </CardShell>
  );
};

export default PersonalScoreCard;
