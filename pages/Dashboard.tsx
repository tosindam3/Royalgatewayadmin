import React, { lazy, Suspense } from 'react';
import { UserRole, type UserPermissions } from '../types';
import { useDashboard } from './dashboard/useDashboard';
import DashboardSkeleton from './dashboard/DashboardSkeleton';

const ExecutiveDashboard = lazy(() => import('./dashboard/panels/ExecutiveDashboard'));
const HRAdminDashboard   = lazy(() => import('./dashboard/panels/HRAdminDashboard'));
const ManagerDashboard   = lazy(() => import('./dashboard/panels/ManagerDashboard'));
const EmployeeDashboard  = lazy(() => import('./dashboard/panels/EmployeeDashboard'));

interface DashboardProps {
  userRole: UserRole;
  userPermissions: string[];
  userProfile?: { name: string; employee_id?: string | number };
}

const Dashboard: React.FC<DashboardProps> = ({ userRole, userPermissions }) => {
  const data = useDashboard(userRole, null);
  const { view, isLoading } = data;

  if (isLoading) {
    return <DashboardSkeleton view={view} />;
  }

  return (
    <Suspense fallback={<DashboardSkeleton view={view} />}>
      {view === 'executive' && <ExecutiveDashboard data={data} />}
      {view === 'hr_admin'  && <HRAdminDashboard   data={data} />}
      {view === 'manager'   && <ManagerDashboard    data={data} />}
      {view === 'employee'  && <EmployeeDashboard   data={data} />}
    </Suspense>
  );
};

export default Dashboard;
