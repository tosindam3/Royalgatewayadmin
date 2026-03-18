import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { useChartTheme } from '../../../utils/chartTheme';
import CardShell from './CardShell';
import type { PersonalSummaryResponse } from '../../../types/dashboard';

interface Props {
  data: PersonalSummaryResponse;
}

const MyAttendanceSummary: React.FC<Props> = ({ data }) => {
  const { tooltip, axis, grid } = useChartTheme();
  const month = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Safety check for attendance_by_week
  const weeklyData = data?.attendance_by_week || [];

  return (
    <CardShell title="My Attendance" action={month}>
      {weeklyData.length === 0 ? (
        <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-8">No attendance data this month</p>
      ) : (
        <ResponsiveContainer width="100%" height={170}>
          <BarChart data={weeklyData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barSize={10}>
            <CartesianGrid {...grid} vertical={false} />
            <XAxis dataKey="week" tick={axis} axisLine={false} tickLine={false} />
            <YAxis tick={axis} axisLine={false} tickLine={false} />
            <Tooltip {...tooltip} />
            <Legend
              wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
              iconType="circle"
              iconSize={6}
            />
            <Bar dataKey="present" name="Present" fill="var(--brand-primary)" radius={[3, 3, 0, 0]} />
            <Bar dataKey="late"    name="Late"    fill="#f59e0b"              radius={[3, 3, 0, 0]} />
            <Bar dataKey="absent"  name="Absent"  fill="#ef4444"              radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </CardShell>
  );
};

export default MyAttendanceSummary;
