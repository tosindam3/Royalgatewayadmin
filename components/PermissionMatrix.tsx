import React, { useState, useEffect } from 'react';
import { Permission } from '../services/rbacService';
import Button from './ui/Button';

interface PermissionMatrixProps {
    permissions: Record<string, Permission[]>;
    selectedPermissions: Record<number, string>; // permission_id -> scope_level
    onPermissionsChange: (permissions: Record<number, string>) => void;
    onSave: () => void;
    onCancel: () => void;
    isSaving?: boolean;
}

const PermissionMatrix: React.FC<PermissionMatrixProps> = ({
    permissions,
    selectedPermissions,
    onPermissionsChange,
    onSave,
    onCancel,
    isSaving = false,
}) => {
    const [localPermissions, setLocalPermissions] = useState(selectedPermissions);
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

    useEffect(() => {
        setLocalPermissions(selectedPermissions);
        // Expand all modules by default
        setExpandedModules(new Set(Object.keys(permissions)));
    }, [selectedPermissions, permissions]);

    const handleScopeChange = (permissionId: number, scope: string | null) => {
        const updated = { ...localPermissions };
        if (scope === null) {
            delete updated[permissionId];
        } else {
            updated[permissionId] = scope;
        }
        setLocalPermissions(updated);
        onPermissionsChange(updated);
    };

    const toggleModule = (module: string) => {
        const newExpanded = new Set(expandedModules);
        if (newExpanded.has(module)) {
            newExpanded.delete(module);
        } else {
            newExpanded.add(module);
        }
        setExpandedModules(newExpanded);
    };

    const selectAllInModule = (module: string, scope: string) => {
        const updated = { ...localPermissions };
        permissions[module].forEach(permission => {
            if (permission.available_scopes.includes(scope)) {
                updated[permission.id] = scope;
            }
        });
        setLocalPermissions(updated);
        onPermissionsChange(updated);
    };

    const clearModule = (module: string) => {
        const updated = { ...localPermissions };
        permissions[module].forEach(permission => {
            delete updated[permission.id];
        });
        setLocalPermissions(updated);
        onPermissionsChange(updated);
    };

    const scopes = ['all', 'branch', 'department', 'team', 'self'];
    const scopeColors: Record<string, string> = {
        all: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
        branch: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
        department: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30',
        team: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
        self: 'bg-slate-500/20 text-slate-500 border-slate-500/30',
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase">Permission Matrix</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        Select permissions and their scope levels for this role
                    </p>
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                    <span className="font-bold text-purple-500">{Object.keys(localPermissions).length}</span> permissions selected
                </div>
            </div>

            {/* Scope Legend */}
            <div className="flex flex-wrap gap-2 p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider mr-2">Scopes:</span>
                {scopes.map(scope => (
                    <span
                        key={scope}
                        className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase border ${scopeColors[scope]}`}
                    >
                        {scope}
                    </span>
                ))}
            </div>

            {/* Permission Modules */}
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {Object.entries(permissions).map(([module, modulePermissions]) => (
                    <div key={module} className="bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5 overflow-hidden">
                        {/* Module Header */}
                        <div className="p-4 bg-slate-100 dark:bg-white/5 border-b border-slate-200 dark:border-white/5 flex justify-between items-center">
                            <button
                                onClick={() => toggleModule(module)}
                                className="flex items-center gap-2 flex-1 text-left"
                            >
                                <svg
                                    className={`w-4 h-4 text-slate-600 dark:text-slate-400 transition-transform ${expandedModules.has(module) ? 'rotate-90' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                                <span className="text-sm font-black text-slate-900 dark:text-white uppercase">{module}</span>
                                <span className="text-[9px] text-slate-500 font-bold">
                                    ({(modulePermissions as Permission[]).filter(p => localPermissions[p.id]).length}/{(modulePermissions as Permission[]).length})
                                </span>
                            </button>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => selectAllInModule(module, 'all')}
                                    className="text-[9px] font-bold text-purple-500 hover:text-purple-400 uppercase"
                                >
                                    All Scope
                                </button>
                                <button
                                    onClick={() => clearModule(module)}
                                    className="text-[9px] font-bold text-slate-500 hover:text-slate-400 uppercase"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>

                        {/* Module Permissions */}
                        {expandedModules.has(module) && (
                            <div className="p-4 space-y-3">
                                {(modulePermissions as Permission[]).map(permission => (
                                    <div
                                        key={permission.id}
                                        className="flex items-center justify-between p-3 bg-white dark:bg-white/5 rounded-lg hover:bg-slate-50 dark:hover:bg-white/10 transition-all border border-slate-200 dark:border-transparent"
                                    >
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                                                {permission.display_name}
                                            </p>
                                            <p className="text-[9px] text-slate-500 font-bold uppercase">
                                                {permission.name}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            {permission.available_scopes.map(scope => {
                                                const isSelected = localPermissions[permission.id] === scope;
                                                return (
                                                    <button
                                                        key={scope}
                                                        onClick={() => handleScopeChange(
                                                            permission.id,
                                                            isSelected ? null : scope
                                                        )}
                                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase border transition-all ${
                                                            isSelected
                                                                ? scopeColors[scope]
                                                                : 'bg-slate-100 dark:bg-white/5 text-slate-500 border-slate-300 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10'
                                                        }`}
                                                    >
                                                        {scope}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4 border-t border-slate-200 dark:border-white/5">
                <Button
                    onClick={onSave}
                    isLoading={isSaving}
                    className="bg-purple-500 hover:bg-purple-600"
                >
                    Save Permissions
                </Button>
                <Button
                    variant="ghost"
                    onClick={onCancel}
                    disabled={isSaving}
                >
                    Cancel
                </Button>
            </div>
        </div>
    );
};

export default PermissionMatrix;
