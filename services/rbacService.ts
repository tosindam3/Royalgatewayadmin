import apiClient from './apiClient';

export interface Role {
    id: number;
    name: string;
    display_name: string;
    description?: string;
    default_scope: 'all' | 'branch' | 'department' | 'team' | 'self';
    is_system: boolean;
    is_active: boolean;
    permissions?: Permission[];
    users_count?: number;
}

export interface Permission {
    id: number;
    name: string;
    display_name: string;
    module: string;
    action: string;
    description?: string;
    available_scopes: string[];
    scope_level?: string;
}

export interface RolePermissionAssignment {
    permission_id: number;
    scope_level: string;
}

export const rbacService = {
    // Roles
    getRoles: async (params?: any): Promise<Role[]> => {
        return apiClient.get('/rbac/roles', { params });
    },

    getRole: async (id: number): Promise<Role> => {
        return apiClient.get(`/rbac/roles/${id}`);
    },

    createRole: async (data: Partial<Role>): Promise<Role> => {
        return apiClient.post('/rbac/roles', data);
    },

    updateRole: async (id: number, data: Partial<Role>): Promise<Role> => {
        return apiClient.put(`/rbac/roles/${id}`, data);
    },

    deleteRole: async (id: number): Promise<void> => {
        return apiClient.delete(`/rbac/roles/${id}`);
    },

    getRolePermissions: async (id: number): Promise<Permission[]> => {
        return apiClient.get(`/rbac/roles/${id}/permissions`);
    },

    assignPermissions: async (roleId: number, permissions: RolePermissionAssignment[]): Promise<Role> => {
        return apiClient.post(`/rbac/roles/${roleId}/permissions`, { permissions });
    },

    getRoleUsers: async (id: number): Promise<any[]> => {
        return apiClient.get(`/rbac/roles/${id}/users`);
    },

    // Permissions
    getPermissions: async (params?: any): Promise<Permission[]> => {
        return apiClient.get('/rbac/permissions', { params });
    },

    getPermissionsGrouped: async (): Promise<Record<string, Permission[]>> => {
        return apiClient.get('/rbac/permissions/grouped');
    },

    getPermissionMatrix: async (): Promise<Record<string, Permission[]>> => {
        return apiClient.get('/rbac/permissions/matrix');
    },

    getModules: async (): Promise<string[]> => {
        return apiClient.get('/rbac/permissions/modules');
    },

    // User Roles
    getUserRoles: async (userId: number): Promise<{ roles: Role[], primary_role: Role }> => {
        return apiClient.get(`/rbac/users/${userId}/roles`);
    },

    assignRolesToUser: async (userId: number, roleIds: number[], primaryRoleId?: number): Promise<any> => {
        return apiClient.post(`/rbac/users/${userId}/roles`, {
            role_ids: roleIds,
            primary_role_id: primaryRoleId
        });
    },

    removeRoleFromUser: async (userId: number, roleId: number): Promise<any> => {
        return apiClient.delete(`/rbac/users/${userId}/roles/${roleId}`);
    },

    getUserPermissions: async (userId: number): Promise<Record<string, string>> => {
        return apiClient.get(`/rbac/users/${userId}/permissions`);
    },

    checkPermission: async (userId: number, permission: string, scope?: string): Promise<{ has_permission: boolean, user_scope: string }> => {
        return apiClient.post(`/rbac/users/${userId}/check-permission`, { permission, scope });
    },

    bulkAssignRole: async (userIds: number[], roleId: number): Promise<void> => {
        return apiClient.post('/rbac/bulk-assign-role', { user_ids: userIds, role_id: roleId });
    },
};
