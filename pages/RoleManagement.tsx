import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rbacService, Role, Permission } from '../services/rbacService';
import GlassCard from '../components/GlassCard';
import Button from '../components/ui/Button';
import PermissionMatrix from '../components/PermissionMatrix';
import { CardSkeleton } from '../components/ui/Skeleton';
import { toast } from 'sonner';

const RoleManagement: React.FC = () => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'roles' | 'permissions'>('roles');
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
    const [selectedPermissions, setSelectedPermissions] = useState<Record<number, string>>({});
    const [formData, setFormData] = useState({
        name: '',
        display_name: '',
        description: '',
        default_scope: 'self' as const,
    });

    const { data: rolesData, isLoading: isRolesLoading } = useQuery({
        queryKey: ['roles'],
        queryFn: () => rbacService.getRoles({ paginate: 'false' })
    });

    const { data: permissionMatrix, isLoading: isPermissionsLoading } = useQuery({
        queryKey: ['permission-matrix'],
        queryFn: () => rbacService.getPermissionMatrix(),
        enabled: activeTab === 'permissions'
    });

    const { data: rolePermissions, isLoading: isRolePermsLoading } = useQuery({
        queryKey: ['role-permissions', selectedRole?.id],
        queryFn: async () => {
            const perms = await rbacService.getRolePermissions(selectedRole!.id);
            // Convert to Record<number, string> format
            const permMap: Record<number, string> = {};
            perms.forEach(p => {
                if (p.scope_level) {
                    permMap[p.id] = p.scope_level;
                }
            });
            setSelectedPermissions(permMap);
            return perms;
        },
        enabled: !!selectedRole && isPermissionModalOpen
    });

    const createMutation = useMutation({
        mutationFn: (data: typeof formData) => rbacService.createRole(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            toast.success('Role Created', { description: 'New role has been created successfully.' });
            setIsCreateModalOpen(false);
            resetForm();
        },
        onError: (error: any) => {
            toast.error('Failed to create role', { description: error.message });
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<Role> }) =>
            rbacService.updateRole(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            toast.success('Role Updated', { description: 'Role has been updated successfully.' });
            setIsCreateModalOpen(false);
            setSelectedRole(null);
            resetForm();
        },
        onError: (error: any) => {
            toast.error('Failed to update role', { description: error.message });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => rbacService.deleteRole(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            toast.success('Role Deleted', { description: 'Role has been removed from the system.' });
        },
        onError: (error: any) => {
            toast.error('Failed to delete role', { description: error.message });
        }
    });

    const assignPermissionsMutation = useMutation({
        mutationFn: ({ roleId, permissions }: { roleId: number; permissions: any[] }) =>
            rbacService.assignPermissions(roleId, permissions),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
            toast.success('Permissions Updated', { description: 'Role permissions have been updated.' });
            setIsPermissionModalOpen(false);
            setSelectedRole(null);
            setSelectedPermissions({});
        },
        onError: (error: any) => {
            toast.error('Failed to update permissions', { description: error.message });
        }
    });

    const handleSavePermissions = () => {
        if (!selectedRole) return;
        
        const permissions = Object.entries(selectedPermissions).map(([permId, scope]) => ({
            permission_id: parseInt(permId),
            scope_level: scope
        }));

        assignPermissionsMutation.mutate({ roleId: selectedRole.id, permissions });
    };

    const resetForm = () => {
        setFormData({
            name: '',
            display_name: '',
            description: '',
            default_scope: 'self',
        });
    };

    const handleSubmit = () => {
        if (selectedRole) {
            updateMutation.mutate({ id: selectedRole.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleEdit = (role: Role) => {
        setSelectedRole(role);
        setFormData({
            name: role.name,
            display_name: role.display_name,
            description: role.description || '',
            default_scope: role.default_scope,
        });
        setIsCreateModalOpen(true);
    };

    const handleDelete = (role: Role) => {
        if (role.is_system) {
            const confirmed = confirm(
                `⚠️ WARNING: "${role.display_name}" is a SYSTEM ROLE!\n\n` +
                `Deleting this role may affect system functionality and users assigned to it.\n\n` +
                `Are you absolutely sure you want to delete this role?`
            );
            if (!confirmed) return;
        }
        
        const finalConfirm = confirm(
            `Are you sure you want to delete the role "${role.display_name}"?\n\n` +
            `This action cannot be undone.`
        );
        
        if (finalConfirm) {
            deleteMutation.mutate(role.id);
        }
    };

    const tabs = [
        { key: 'roles', label: 'Roles', count: rolesData?.length || 0 },
        { key: 'permissions', label: 'Permissions', count: null },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
                        Role <span className="text-purple-500">Management</span>
                    </h1>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-2 italic">
                        Access Control & Permission Hub
                    </p>
                </div>
                {activeTab === 'roles' && (
                    <Button
                        onClick={() => {
                            setSelectedRole(null);
                            resetForm();
                            setIsCreateModalOpen(true);
                        }}
                        className="px-8 py-4 rounded-2xl shadow-2xl shadow-purple-500/20"
                    >
                        + Create Role
                    </Button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-8 border-b border-slate-200 dark:border-white/5">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as any)}
                        className={`pb-4 text-[10px] font-black uppercase tracking-[0.2em] relative transition-all flex items-center gap-2 ${
                            activeTab === tab.key 
                                ? 'text-slate-900 dark:text-white' 
                                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                        }`}
                    >
                        {tab.label}
                        {tab.count !== null && (
                            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-500 text-[8px] font-black">
                                {tab.count}
                            </span>
                        )}
                        {activeTab === tab.key && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.5)]" />
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="animate-in slide-in-from-bottom-2 duration-500">
                {activeTab === 'roles' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {isRolesLoading ? (
                            <>
                                <CardSkeleton /> <CardSkeleton /> <CardSkeleton />
                            </>
                        ) : rolesData && rolesData.length > 0 ? (
                            rolesData.map((role) => (
                                <GlassCard key={role.id} className="!p-6 hover:bg-white/[0.05] transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="text-lg font-black text-white uppercase">
                                                    {role.display_name}
                                                </h3>
                                                {role.is_system && (
                                                    <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-500 text-[8px] font-black uppercase border border-blue-500/20">
                                                        System
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-3">
                                                {role.name}
                                            </p>
                                            {role.description && (
                                                <p className="text-xs text-slate-400 mb-4">
                                                    {role.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
                                        <div>
                                            <p className="text-[9px] text-slate-500 font-bold uppercase mb-1">Default Scope</p>
                                            <span className="px-2 py-1 rounded-lg bg-purple-500/10 text-purple-500 text-[9px] font-black uppercase border border-purple-500/20">
                                                {role.default_scope}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-[9px] text-slate-500 font-bold uppercase mb-1">Permissions</p>
                                            <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase border border-emerald-500/20">
                                                {role.permissions?.length || 0}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-[9px] text-slate-500 font-bold uppercase mb-1">Status</p>
                                            <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase border ${
                                                role.is_active
                                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                    : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                                            }`}>
                                                {role.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedRole(role);
                                                setIsPermissionModalOpen(true);
                                            }}
                                            className="flex-1 text-[9px] bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 border border-purple-500/30"
                                        >
                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                            </svg>
                                            Permissions
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEdit(role)}
                                            className="text-[9px] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
                                        >
                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                            Edit
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(role)}
                                            className="text-rose-500 hover:bg-rose-500/10 text-[9px]"
                                        >
                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            Delete
                                        </Button>
                                    </div>
                                </GlassCard>
                            ))
                        ) : (
                            <div className="col-span-3 text-center py-20">
                                <p className="text-slate-500 text-sm font-bold uppercase italic">
                                    No roles found
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'permissions' && (
                    <div className="space-y-6">
                        {/* Info Banner */}
                        <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                            <div className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <h4 className="text-sm font-black text-purple-500 uppercase mb-1">System Permissions</h4>
                                    <p className="text-xs text-slate-400">
                                        These are all available permissions in the system. To assign permissions to a role, go to the Roles tab, 
                                        select a role, and click the "Permissions" button. Each permission can be assigned with different scope levels 
                                        (All, Branch, Department, Team, or Self).
                                    </p>
                                </div>
                            </div>
                        </div>

                        {isPermissionsLoading ? (
                            <>
                                <CardSkeleton /> <CardSkeleton />
                            </>
                        ) : permissionMatrix ? (
                            Object.entries(permissionMatrix).map(([module, permissions]) => (
                                <GlassCard key={module} className="!p-6">
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase mb-4 border-l-4 border-purple-500 pl-3">
                                        {module}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {permissions.map((permission: Permission) => (
                                            <div
                                                key={permission.id}
                                                className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5"
                                            >
                                                <p className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                                                    {permission.display_name}
                                                </p>
                                                <p className="text-[9px] text-slate-500 dark:text-slate-500 font-bold uppercase mb-2">
                                                    {permission.name}
                                                </p>
                                                <div className="flex flex-wrap gap-1">
                                                    {permission.available_scopes.map((scope) => (
                                                        <span
                                                            key={scope}
                                                            className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-500 text-[8px] font-black uppercase border border-purple-500/20"
                                                        >
                                                            {scope}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </GlassCard>
                            ))
                        ) : (
                            <div className="text-center py-20">
                                <p className="text-slate-500 text-sm font-bold uppercase italic">
                                    No permissions found
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Create/Edit Role Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300 p-6">
                    <div className="absolute inset-0" onClick={() => setIsCreateModalOpen(false)} />
                    <div className="w-full max-w-2xl bg-white dark:bg-[#0d0a1a] shadow-2xl rounded-[40px] border border-slate-200 dark:border-white/10 animate-in zoom-in-95 duration-500 flex flex-col relative overflow-hidden max-h-[90vh]">
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-500/10 blur-[100px] rounded-full -mr-40 -mt-40 pointer-events-none" />

                        {/* Header */}
                        <div className="p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-white/[0.02] relative z-10">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
                                    {selectedRole ? 'Update' : 'Create'} <span className="text-purple-500">Role</span>
                                </h3>
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1">
                                    Role Configuration
                                </p>
                            </div>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="p-3 bg-white dark:bg-white/5 rounded-2xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm border border-slate-200 dark:border-white/10"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path d="M6 18L18 6M6 6l12 12" strokeWidth="3" />
                                </svg>
                            </button>
                        </div>

                        {/* Form */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-2 uppercase">Role Name (Code)</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., hr_manager"
                                    disabled={selectedRole?.is_system}
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-2 uppercase">Display Name</label>
                                <input
                                    type="text"
                                    value={formData.display_name}
                                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                                    placeholder="e.g., HR Manager"
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-2 uppercase">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Role description..."
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 min-h-[80px] resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-2 uppercase">Default Scope</label>
                                <select
                                    value={formData.default_scope}
                                    onChange={(e) => setFormData({ ...formData, default_scope: e.target.value as any })}
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                >
                                    <option value="all" className="bg-white dark:bg-slate-800">All (Organization-wide)</option>
                                    <option value="branch" className="bg-white dark:bg-slate-800">Branch</option>
                                    <option value="department" className="bg-white dark:bg-slate-800">Department</option>
                                    <option value="team" className="bg-white dark:bg-slate-800">Team</option>
                                    <option value="self" className="bg-white dark:bg-slate-800">Self</option>
                                </select>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-8 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                            <div className="flex gap-4">
                                <Button
                                    onClick={handleSubmit}
                                    isLoading={createMutation.isPending || updateMutation.isPending}
                                    className="bg-purple-500 hover:bg-purple-600"
                                >
                                    {selectedRole ? 'Update Role' : 'Create Role'}
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => setIsCreateModalOpen(false)}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Permission Assignment Modal */}
            {isPermissionModalOpen && selectedRole && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300 p-6">
                    <div className="absolute inset-0" onClick={() => {
                        setIsPermissionModalOpen(false);
                        setSelectedPermissions({});
                    }} />
                    <div className="w-full max-w-6xl bg-white dark:bg-[#0d0a1a] shadow-2xl rounded-[40px] border border-slate-200 dark:border-white/10 animate-in zoom-in-95 duration-500 flex flex-col relative overflow-hidden max-h-[90vh]">
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-500/10 blur-[100px] rounded-full -mr-40 -mt-40 pointer-events-none" />

                        {/* Header */}
                        <div className="p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-white/[0.02] relative z-10">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
                                    Permissions for <span className="text-purple-500">{selectedRole.display_name}</span>
                                </h3>
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1">
                                    Assign Permissions & Scopes
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setIsPermissionModalOpen(false);
                                    setSelectedPermissions({});
                                }}
                                className="p-3 bg-white dark:bg-white/5 rounded-2xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm border border-slate-200 dark:border-white/10"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path d="M6 18L18 6M6 6l12 12" strokeWidth="3" />
                                </svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-8">
                            {isRolePermsLoading || !permissionMatrix ? (
                                <div className="space-y-4">
                                    <CardSkeleton />
                                    <CardSkeleton />
                                    <CardSkeleton />
                                </div>
                            ) : (
                                <PermissionMatrix
                                    permissions={permissionMatrix}
                                    selectedPermissions={selectedPermissions}
                                    onPermissionsChange={setSelectedPermissions}
                                    onSave={handleSavePermissions}
                                    onCancel={() => {
                                        setIsPermissionModalOpen(false);
                                        setSelectedPermissions({});
                                    }}
                                    isSaving={assignPermissionsMutation.isPending}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoleManagement;
