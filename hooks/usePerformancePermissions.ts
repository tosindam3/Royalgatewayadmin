import { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { rbacService } from '../services/rbacService';

export const usePerformancePermissions = (currentUserRole: UserRole) => {
    const [permissions, setPermissions] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadPermissions = async () => {
            try {
                const user = JSON.parse(localStorage.getItem('royalgateway_user') || '{}');
                if (user.id) {
                    const userPerms = await rbacService.getUserPermissions(user.id);
                    setPermissions(userPerms);
                }
            } catch (error) {
                console.error('Failed to load user permissions:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadPermissions();
    }, []);

    const hasPermission = (permission: string, requiredScope: string = 'self') => {
        if (currentUserRole === UserRole.SUPER_ADMIN) return true;

        const userScope = permissions[permission];
        if (!userScope) return false;

        // Scope hierarchy: all > branch > department > team > self
        const scopeOrder = ['self', 'team', 'department', 'branch', 'all'];
        return scopeOrder.indexOf(userScope) >= scopeOrder.indexOf(requiredScope);
    };

    return {
        permissions,
        isLoading,
        hasPermission,
        canManageForms: hasPermission('performance.manage_forms', 'department'),
        canViewAnalytics: hasPermission('performance.view', 'department'),
        canAdminAll: currentUserRole === UserRole.SUPER_ADMIN || currentUserRole === UserRole.ADMIN,
    };
};
