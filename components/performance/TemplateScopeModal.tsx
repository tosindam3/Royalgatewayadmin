import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { organizationService, Branch } from '../../services/organizationService';
import { Department } from '../../types';
import { Building2, Landmark, Globe, Check, ChevronRight } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface TemplateScopeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (scope: 'global' | 'branch' | 'department', targetId?: number) => void;
    initialScope?: 'global' | 'branch' | 'department';
    initialTargetId?: number;
}

const TemplateScopeModal: React.FC<TemplateScopeModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    initialScope = 'department',
    initialTargetId
}) => {
    const [scope, setScope] = React.useState<'global' | 'branch' | 'department'>(initialScope);
    const [branches, setBranches] = React.useState<Branch[]>([]);
    const [departments, setDepartments] = React.useState<Department[]>([]);
    const [selectedBranchId, setSelectedBranchId] = React.useState<number | undefined>(
        initialScope === 'branch' ? initialTargetId : undefined
    );
    const [selectedDeptId, setSelectedDeptId] = React.useState<number | undefined>(
        initialScope === 'department' ? initialTargetId : undefined
    );
    const [isLoading, setIsLoading] = React.useState(false);

    React.useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const [branchesData, deptsData] = await Promise.all([
                organizationService.getBranches({ per_page: 'all' }),
                organizationService.getDepartments({ per_page: 'all' })
            ]);
            setBranches(branchesData || []);
            setDepartments(deptsData || []);
        } catch (error) {
            console.error('Failed to load scope data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirm = () => {
        let targetId: number | undefined;
        if (scope === 'department') targetId = selectedDeptId;
        if (scope === 'branch') targetId = selectedBranchId;

        onConfirm(scope, targetId);
    };

    const isValid =
        scope === 'global' ||
        (scope === 'branch' && selectedBranchId) ||
        (scope === 'department' && selectedDeptId);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Set Template Scope"
            size="md"
            footer={(
                <div className="flex justify-end gap-3 p-6 pt-0">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button
                        disabled={!isValid || isLoading}
                        onClick={handleConfirm}
                        className="rounded-xl px-8 shadow-lg shadow-purple-500/20"
                    >
                        Continue to Editor
                    </Button>
                </div>
            )}
        >
            <div className="space-y-6 p-1">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Select visibility scope:</p>

                <div className="grid grid-cols-1 gap-3">
                    {/* Global Scope */}
                    <button
                        onClick={() => setScope('global')}
                        className={cn(
                            "flex items-center gap-4 p-4 rounded-2xl border transition-all text-left",
                            scope === 'global'
                                ? "bg-purple-500/5 border-purple-500 shadow-sm"
                                : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"
                        )}
                    >
                        <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                            scope === 'global' ? "bg-purple-500 text-white" : "bg-slate-100 dark:bg-white/10 text-slate-500"
                        )}>
                            <Globe className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h4 className={cn(
                                "font-black uppercase tracking-tight text-sm",
                                scope === 'global' ? "text-purple-600 dark:text-purple-400" : "text-slate-900 dark:text-white"
                            )}>Global Scope</h4>
                            <p className="text-xs text-slate-500 font-bold leading-relaxed mt-0.5">Available fallback for all employees in the organization.</p>
                        </div>
                        {scope === 'global' && <Check className="w-5 h-5 text-purple-500" />}
                    </button>

                    {/* Branch Scope */}
                    <button
                        onClick={() => setScope('branch')}
                        className={cn(
                            "flex items-center gap-4 p-4 rounded-2xl border transition-all text-left",
                            scope === 'branch'
                                ? "bg-purple-500/5 border-purple-500 shadow-sm"
                                : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"
                        )}
                    >
                        <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                            scope === 'branch' ? "bg-purple-500 text-white" : "bg-slate-100 dark:bg-white/10 text-slate-500"
                        )}>
                            <Landmark className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h4 className={cn(
                                "font-black uppercase tracking-tight text-sm",
                                scope === 'branch' ? "text-purple-600 dark:text-purple-400" : "text-slate-900 dark:text-white"
                            )}>Branch Specific</h4>
                            <p className="text-xs text-slate-500 font-bold leading-relaxed mt-0.5">Overrides global template for employees in chosen branch.</p>
                        </div>
                        {scope === 'branch' && <Check className="w-5 h-5 text-purple-500" />}
                    </button>

                    {scope === 'branch' && (
                        <div className="pl-16 pr-4 pb-2 animate-in slide-in-from-top-2 duration-300">
                            <select
                                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                value={selectedBranchId || ''}
                                onChange={(e) => setSelectedBranchId(Number(e.target.value))}
                            >
                                <option value="">Select a branch...</option>
                                {branches.map(b => (
                                    <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Department Scope */}
                    <button
                        onClick={() => setScope('department')}
                        className={cn(
                            "flex items-center gap-4 p-4 rounded-2xl border transition-all text-left",
                            scope === 'department'
                                ? "bg-purple-500/5 border-purple-500 shadow-sm"
                                : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"
                        )}
                    >
                        <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                            scope === 'department' ? "bg-purple-500 text-white" : "bg-slate-100 dark:bg-white/10 text-slate-500"
                        )}>
                            <Building2 className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h4 className={cn(
                                "font-black uppercase tracking-tight text-sm",
                                scope === 'department' ? "text-purple-600 dark:text-purple-400" : "text-slate-900 dark:text-white"
                            )}>Department Specific</h4>
                            <p className="text-xs text-slate-500 font-bold leading-relaxed mt-0.5">Highest priority. Only visible to the selected department.</p>
                        </div>
                        {scope === 'department' && <Check className="w-5 h-5 text-purple-500" />}
                    </button>

                    {scope === 'department' && (
                        <div className="pl-16 pr-4 pb-2 animate-in slide-in-from-top-2 duration-300">
                            <select
                                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                value={selectedDeptId || ''}
                                onChange={(e) => setSelectedDeptId(Number(e.target.value))}
                            >
                                <option value="">Select a department...</option>
                                {departments.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 flex gap-3 text-slate-500 italic">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5 flex-shrink-0" />
                    <p className="text-xs font-bold leading-relaxed">
                        Note: Employees will always see the most specific published template. Department templates override branch templates, which override global templates.
                    </p>
                </div>
            </div>
        </Modal>
    );
};

export default TemplateScopeModal;
