import React from 'react';
import { useNavigate } from 'react-router';
import CardShell from './CardShell';
import { UserRole } from '../../../types';

interface Props {
  role: UserRole;
}

const actionsByRole: Record<UserRole, { label: string; route: string }[]> = {
  [UserRole.SUPER_ADMIN]: [
    { label: 'Run Payroll',       route: '/payroll' },
    { label: 'Manage Employees',  route: '/employees' },
    { label: 'View Performance',  route: '/performance' },
  ],
  [UserRole.ADMIN]: [
    { label: 'Approve Leaves',    route: '/leave' },
    { label: 'Manage Employees',  route: '/employees' },
    { label: 'Pending Approvals', route: '/approvals' },
  ],
  [UserRole.MANAGER]: [
    { label: 'Team Attendance',   route: '/attendance' },
    { label: 'Pending Approvals', route: '/approvals' },
    { label: 'Performance',       route: '/performance' },
  ],
  [UserRole.EMPLOYEE]: [
    { label: 'Apply for Leave',   route: '/leave' },
    { label: 'My Attendance',     route: '/me/attendance' },
    { label: 'My Performance',    route: '/performance' },
  ],
};

const QuickActionsWidget: React.FC<Props> = ({ role }) => {
  const navigate = useNavigate();
  const actions = actionsByRole[role] ?? actionsByRole[UserRole.EMPLOYEE];

  return (
    <CardShell title="Quick Actions" accent>
      <div className="space-y-2.5">
        {actions.map(action => (
          <button
            key={action.label}
            onClick={() => navigate(action.route)}
            className="w-full bg-white/95 hover:bg-white text-brand-primary text-xs font-bold py-3 px-4 rounded-xl transition-colors text-left tracking-wide"
          >
            {action.label}
          </button>
        ))}
      </div>
    </CardShell>
  );
};

export default QuickActionsWidget;
