import React from 'react';
import GlassCard from '../components/GlassCard';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { performanceService } from '../services/performanceService';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
    Plus, Search, Copy, Edit, Trash2, ArrowLeft,
    FileText, Layers, Globe, Landmark, Building2,
    CheckCircle2, Clock, Archive, MoreVertical,
    ChevronRight, AlertCircle, RefreshCw
} from 'lucide-react';
import { usePerformancePermissions } from '../hooks/usePerformancePermissions';
import { UserRole } from '../types';
import TemplateScopeModal from '../components/performance/TemplateScopeModal';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface PerformanceSettingsProps {
    userRole?: UserRole;
}

const PerformanceSettings: React.FC<PerformanceSettingsProps> = ({ userRole: initialUserRole }) => {
    const navigate = useNavigate();
    const [userRole, setUserRole] = React.useState<UserRole | null>(initialUserRole || null);

    React.useEffect(() => {
        if (!initialUserRole) {
            const user = JSON.parse(localStorage.getItem('royalgateway_user') || '{}');
            const roles = user.roles || [];

            if (Array.isArray(roles) && typeof roles[0] === 'object') {
                const roleNames = roles.map((r: any) => r.name.toLowerCase().replace(/\s+/g, '_'));
                if (roleNames.includes('super_admin')) setUserRole(UserRole.SUPER_ADMIN);
                else if (roleNames.includes('admin') || roleNames.includes('hr_admin')) setUserRole(UserRole.ADMIN);
                else if (roleNames.includes('manager')) setUserRole(UserRole.MANAGER);
                else setUserRole(UserRole.EMPLOYEE);
            } else {
                setUserRole(UserRole.EMPLOYEE);
            }
        }
    }, [initialUserRole]);

    const { canAdminAll } = usePerformancePermissions(userRole as UserRole);

    const [isLoading, setIsLoading] = React.useState(true);
    const [configs, setConfigs] = React.useState<any[]>([]);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [filterStatus, setFilterStatus] = React.useState<'all' | 'draft' | 'published' | 'archived'>('all');

    const [scopeModalOpen, setScopeModalOpen] = React.useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
    const [formToDelete, setFormToDelete] = React.useState<any>(null);
    const [isActionLoading, setIsActionLoading] = React.useState(false);

    React.useEffect(() => {
        loadConfigs();
    }, []);

    const loadConfigs = async () => {
        try {
            setIsLoading(true);
            const data = await performanceService.getConfigs();
            setConfigs(data || []);
        } catch (error) {
            console.error('Failed to load configs:', error);
            toast.error('Failed to load performance configurations');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateClick = () => {
        setScopeModalOpen(true);
    };

    const handleScopeConfirm = (scope: string, targetId?: number) => {
        setScopeModalOpen(false);
        const params = new URLSearchParams();
        params.set('scope', scope);
        if (targetId) params.set('targetId', targetId.toString());
        navigate(`/performance/builder/create?${params.toString()}`);
    };

    const handlePublish = async (id: number) => {
        try {
            setIsActionLoading(true);
            await performanceService.publishConfig(id);
            toast.success('Template published successfully');
            loadConfigs();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to publish template');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleArchive = async (id: number) => {
        try {
            setIsActionLoading(true);
            await performanceService.archiveConfig(id);
            toast.success('Template archived');
            loadConfigs();
        } catch (error) {
            toast.error('Failed to archive template');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleRevert = async (id: number) => {
        try {
            setIsActionLoading(true);
            await performanceService.revertConfig(id);
            toast.success('Template reverted to draft');
            loadConfigs();
        } catch (error) {
            toast.error('Failed to revert template');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleClone = async (id: number) => {
        try {
            setIsActionLoading(true);
            const response = await performanceService.cloneConfig(id);
            toast.success('Template cloned as draft');
            loadConfigs();
            // Optional: navigate to the new clone
            // navigate(`/performance/builder/edit/${response.id}`);
        } catch (error) {
            toast.error('Failed to clone template');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleDeleteClick = (config: any) => {
        if (config.status !== 'draft') {
            toast.error('Only draft templates can be deleted directly. Archive or revert to draft first.');
            return;
        }
        setFormToDelete(config);
        setDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!formToDelete) return;
        try {
            setIsActionLoading(true);
            await performanceService.deleteConfig(formToDelete.id);
            toast.success('Template deleted');
            setDeleteModalOpen(false);
            loadConfigs();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to delete template');
        } finally {
            setIsActionLoading(false);
        }
    };

    const filteredConfigs = React.useMemo(() => {
        return configs.filter(config => {
            const matchesSearch = config.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                config.id.toString().includes(searchQuery);
            const matchesStatus = filterStatus === 'all' || config.status === filterStatus;
            return matchesSearch && matchesStatus;
        });
    }, [configs, searchQuery, filterStatus]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'published': return <Badge variant="success" size="sm"><CheckCircle2 className="w-2.5 h-2.5 mr-1" /> Published</Badge>;
            case 'archived': return <Badge variant="warning" size="sm"><Archive className="w-2.5 h-2.5 mr-1" /> Archived</Badge>;
            default: return <Badge variant="default" size="sm"><Clock className="w-2.5 h-2.5 mr-1" /> Draft</Badge>;
        }
    };

    const getScopeBadge = (config: any) => {
        switch (config.scope) {
            case 'global': return <Badge variant="warning"><Globe className="w-3 h-3 mr-1" /> Global</Badge>;
            case 'branch': return <Badge variant="info"><Landmark className="w-3 h-3 mr-1" /> Branch: {config.branch?.name || 'N/A'}</Badge>;
            default: return <Badge variant="primary"><Building2 className="w-3 h-3 mr-1" /> Dept: {config.department?.name || 'N/A'}</Badge>;
        }
    };

    if (userRole === null) {
        return (
            <div className="p-20 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-white/10 border-t-purple-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!canAdminAll) return <div className="p-20 text-center uppercase font-black opacity-20">Access Denied</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <button
                        onClick={() => navigate('/performance')}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-purple-500 transition-colors mb-4"
                    >
                        <ArrowLeft className="w-3 h-3" /> Back to Performance
                    </button>
                    <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
                        Evaluation <span className="text-purple-500 underline decoration-purple-500/30">Templates</span>
                    </h2>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-2 italic">
                        Lifecycle Management & Governance
                    </p>
                </div>
                <Button onClick={handleCreateClick} size="lg" className="rounded-3xl shadow-2xl shadow-purple-500/20 group">
                    <Plus className="w-5 h-5 mr-1 group-hover:rotate-90 transition-transform" /> Create New Template
                </Button>
            </div>

            {/* Filters */}
            <GlassCard className="!p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by template name or ID..."
                            className="w-full bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-white/10">
                        {(['all', 'draft', 'published', 'archived'] as const).map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    filterStatus === status
                                        ? "bg-white dark:bg-white/10 text-purple-600 dark:text-purple-400 shadow-sm"
                                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                )}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
            </GlassCard>

            {/* Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 rounded-[32px] bg-slate-100 dark:bg-white/5 animate-pulse border border-slate-200 dark:border-white/10" />
                    ))}
                </div>
            ) : filteredConfigs.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 dark:bg-white/5 rounded-[40px] border border-dashed border-slate-200 dark:border-white/10">
                    <FileText className="w-12 h-12 text-slate-300 dark:text-white/10 mx-auto mb-4" />
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No templates found</p>
                    <Button variant="ghost" className="mt-4" onClick={() => { setSearchQuery(''); setFilterStatus('all'); }}>Clear Filters</Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredConfigs.map((config) => (
                        <div
                            key={config.id}
                            className="group relative bg-white dark:bg-slate-900/40 rounded-[32px] border border-slate-200 dark:border-white/10 p-6 flex flex-col hover:border-purple-500/50 transition-all duration-500 shadow-sm hover:shadow-2xl hover:shadow-purple-500/5 overflow-hidden"
                        >
                            {/* Status Header */}
                            <div className="flex justify-between items-start mb-4">
                                {getStatusBadge(config.status)}
                                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleClone(config.id)}
                                        className="p-2 bg-slate-100 dark:bg-white/5 rounded-xl hover:bg-purple-500 hover:text-white transition-all text-slate-500"
                                        title="Clone Template"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(config)}
                                        className="p-2 bg-slate-100 dark:bg-white/5 rounded-xl hover:bg-rose-500 hover:text-white transition-all text-slate-500"
                                        title="Delete Template"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1">
                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight mb-2 group-hover:text-purple-500 transition-colors">
                                    {config.name}
                                </h3>
                                <p className="text-xs text-slate-500 font-bold line-clamp-2 mb-4 leading-relaxed">
                                    {config.description || 'No description provided.'}
                                </p>

                                <div className="flex flex-wrap gap-2 mb-6">
                                    {getScopeBadge(config)}
                                </div>

                                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-white/5 flex items-center justify-center border border-slate-200 dark:border-white/10">
                                            <Layers className="w-4 h-4 text-purple-500" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sections</p>
                                            <p className="text-sm font-black text-slate-900 dark:text-white">{config.sections?.length || 0}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-white/5 flex items-center justify-center border border-slate-200 dark:border-white/10">
                                            <FileText className="w-4 h-4 text-emerald-500" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scoreable</p>
                                            <p className="text-sm font-black text-slate-900 dark:text-white">
                                                {config.sections?.reduce((acc: number, s: any) => acc + (s.questions?.filter((q: any) => q.is_scoreable)?.length || 0), 0)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="mt-8 flex gap-3">
                                <Button
                                    className="flex-1 rounded-2xl bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-white/20 border-none px-0"
                                    onClick={() => navigate(`/performance/builder/edit/${config.id}`)}
                                >
                                    <Edit className="w-4 h-4 mr-2" /> Edit
                                </Button>

                                {config.status === 'draft' ? (
                                    <Button
                                        className="flex-[1.5] rounded-2xl shadow-lg shadow-purple-500/20 px-0"
                                        onClick={() => handlePublish(config.id)}
                                        isLoading={isActionLoading}
                                    >
                                        <CheckCircle2 className="w-4 h-4 mr-2" /> Publish
                                    </Button>
                                ) : config.status === 'published' ? (
                                    <Button
                                        variant="warning"
                                        className="flex-[1.5] rounded-2xl shadow-lg shadow-amber-500/20 px-0"
                                        onClick={() => handleArchive(config.id)}
                                        isLoading={isActionLoading}
                                    >
                                        <Archive className="w-4 h-4 mr-2" /> Archive
                                    </Button>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        className="flex-[1.5] rounded-2xl border border-dashed border-slate-300 dark:border-white/20 px-0"
                                        onClick={() => handleRevert(config.id)}
                                        isLoading={isActionLoading}
                                    >
                                        <RefreshCw className="w-4 h-4 mr-2" /> Revert to Draft
                                    </Button>
                                )}
                            </div>

                            {/* Decorative ID */}
                            <div className="absolute top-1/2 -right-4 -translate-y-1/2 text-8xl font-black text-slate-900/5 pointer-events-none select-none italic">
                                {config.id}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modals */}
            <TemplateScopeModal
                isOpen={scopeModalOpen}
                onClose={() => setScopeModalOpen(false)}
                onConfirm={handleScopeConfirm}
            />

            <Modal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Delete Template"
                footer={(
                    <div className="flex justify-end gap-3 p-6 pt-0">
                        <Button variant="ghost" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
                        <Button variant="danger" onClick={handleDeleteConfirm} isLoading={isActionLoading} className="rounded-xl px-8 shadow-lg shadow-rose-500/20">
                            Confirm Delete
                        </Button>
                    </div>
                )}
            >
                <div className="space-y-4">
                    <div className="p-4 bg-rose-500 text-white rounded-2xl flex gap-3">
                        <AlertCircle className="w-6 h-6 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-black uppercase tracking-tight">Serious Restriction</p>
                            <p className="text-xs font-bold opacity-90 mt-1 leading-relaxed">
                                You can only delete templates that are in DRAFT status. This action is irreversible. All historical data linked to this template ID will lose its reference metadata.
                            </p>
                        </div>
                    </div>
                    <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-[24px] border border-slate-200 dark:border-white/10 relative overflow-hidden">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 relative z-10">Deleting Template:</p>
                        <p className="text-xl font-black text-slate-900 dark:text-white uppercase italic relative z-10">{formToDelete?.name}</p>
                        <Trash2 className="absolute -bottom-4 -right-4 w-24 h-24 text-slate-900/5 rotate-12" />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default PerformanceSettings;
