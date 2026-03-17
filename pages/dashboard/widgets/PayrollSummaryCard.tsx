import React from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, CartesianGrid, XAxis } from 'recharts';
import { useChartTheme } from '../../../utils/chartTheme';
import CardShell from './CardShell';
import type { PayrollSummaryResponse } from '../../../types/dashboard';
import { formatCurrency } from '../../../utils/currency';

interface Props {
  data: PayrollSummaryResponse;
}

const PayrollSummaryCard: React.FC<Props> = ({ data }) => {
  const { tooltip, axis, grid } = useChartTheme();
  const fmt = (v: number) => formatCurrency(v);

  return (
    <CardShell title="Payroll Summary" action="View Runs →">
      {/* Large net pay — same scale as KPI card */}
      <p className="text-3xl md:text-4xl font-bold tracking-tight leading-none text-brand-primary">
        {fmt(data.monthly_payroll)}
      </p>
      <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-1.5 mb-4">
        Current Period Net
      </p>

      {/* Sub-row stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: 'Employees', value: String(data.total_employees) },
          { label: 'Active Runs', value: String(data.active_runs) },
          { label: 'Avg Pay', value: fmt(data.average_pay) },
        ].map(item => (
          <div key={item.label} className="bg-slate-50 dark:bg-white/5 rounded-xl p-2.5 text-center">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{item.value}</p>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wide mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Sparkline history */}
      {data.history.length > 0 && (
        <ResponsiveContainer width="100%" height={55}>
          <AreaChart data={data.history} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="payGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="var(--brand-primary)" stopOpacity={0.15} />
                <stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid {...grid} vertical={false} />
            <XAxis dataKey="period" tick={axis} axisLine={false} tickLine={false} />
            <Tooltip {...tooltip} formatter={(v: any) => fmt(Number(v))} />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="var(--brand-primary)"
              strokeWidth={1.5}
              fill="url(#payGrad)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </CardShell>
  );
};

export default PayrollSummaryCard;
