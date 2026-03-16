/**
 * Utility to check if the current user has a specific permission.
 * Permissions are expected in the format: 'module.action' (e.g., 'chat.admin')
 */
export const hasPermission = (permission: string): boolean => {
  const userStr = localStorage.getItem('royalgateway_user');
  if (!userStr) return false;

  try {
    const user = JSON.parse(userStr);
    
    // Super Admin & CEO Bypass (if roles are available directly)
    const isAdmin = user.roles?.some((role: any) => 
      ['super_admin', 'ceo', 'admin'].includes(role.name)
    );
    if (isAdmin) return true;

    // Check granular permissions
    return user.roles?.some((role: any) => 
      role.permissions?.some((p: any) => p.name === permission)
    );
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
};

/**
 * Check if user has any of the specified roles
 */
export const hasRole = (roleNames: string[]): boolean => {
  const userStr = localStorage.getItem('royalgateway_user');
  if (!userStr) return false;

  try {
    const user = JSON.parse(userStr);
    return user.roles?.some((role: any) => roleNames.includes(role.name));
  } catch {
    return false;
  }
};
