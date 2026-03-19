// Permission utility functions

export interface User {
  id: number;
  name: string;
  email: string;
  permissions?: Record<string, string>;
  roles?: any[];
  primary_role_id?: number;
  [key: string]: any;
}

export const hasPermission = (
  user: User | null,
  permission: string,
  requiredScope: 'self' | 'team' | 'department' | 'branch' | 'all' = 'self'
): boolean => {
  if (!user) return false;

  // Check if user has permission with sufficient scope
  const userPermissions = user.permissions || {};
  const userScope = userPermissions[permission];

  if (!userScope) return false;

  const scopeHierarchy: Record<string, number> = {
    all: 5,
    branch: 4,
    department: 3,
    team: 2,
    self: 1,
    none: 0,
  };

  return (scopeHierarchy[userScope] || 0) >= (scopeHierarchy[requiredScope] || 0);
};

export const getUserScope = (user: User | null, permission: string): string => {
  if (!user) return 'none';
  const userPermissions = user.permissions || {};
  return userPermissions[permission] || 'none';
};

export const canViewAllData = (user: User | null, permission: string): boolean => {
  return hasPermission(user, permission, 'all');
};

export const canViewDepartmentData = (user: User | null, permission: string): boolean => {
  return hasPermission(user, permission, 'department');
};

export const canViewBranchData = (user: User | null, permission: string): boolean => {
  return hasPermission(user, permission, 'branch');
};
