import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../../components/GlassCard';
import Button from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { employeeService } from '../../services/employeeService';
import { Employee, EmployeeStatus } from '../../types';
import { toast } from 'sonner';
import AddEmployeeModal from '../../components/modals/AddEmployeeModal';

const EmployeeManagementPage: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<EmployeeStatus | ''>('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [statusChangeEmployee, setStatusChangeEmployee] = useState<Employee | null>(null);

    // Debounce search input
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1); // Reset to first page on new search
        }, 500);

        return () => clearTimeout(handler);
    }, [search]);

    const { data: metrics, isLoading: isMetricsLoading } = useQuery({
        queryKey: ['employee-metrics'],
        queryFn: () => employeeService.getMetrics()
    });

    const { data: directoryData, isLoading: isDirectoryLoading } = useQuery({
        queryKey: ['employee-directory', page, debouncedSearch, statusFilter],
        queryFn: () => employeeService.getDirectory({
            page,
            search: debouncedSearch,
            status: statusFilter,
            per_page: 10
        })
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => employeeService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employee-directory'] });
            queryClient.invalidateQueries({ queryKey: ['employee-metrics'] });
            toast.success('Employee Deleted', { description: 'Employee has been removed from the system.' });
        },
        onError: (error: any) => {
            toast.error('Failed to delete employee', { description: error.message });
        }
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: EmployeeStatus }) =>
            employeeService.updateStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employee-directory'] });
            queryClient.invalidateQueries({ queryKey: ['employee-metrics'] });
            toast.success('Status Updated', { description: 'Employee status has been changed successfully.' });
            setStatusChangeEmployee(null);
        },
        onError: (error: any) => {
            toast.error('Failed to update status', { description: error.message });
        }
    });

    const handleDelete = (employee: Employee) => {
        if (confirm(`Are you sure you want to delete ${employee.first_name} ${employee.last_name}? This action cannot be undone.`)) {
            deleteMutation.mutate(employee.id);
        }
    };

    const handleStatusChange = (employee: Employee, newStatus: EmployeeStatus) => {
        statusMutation.mutate({ id: employee.id, status: newStatus });
    };

    const columns = useMemo(() => [
        {
            key: 'name',
            header: 'Employee',
            render: (emp: Employee) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center font-black text-purple-500 overflow-hidden">
                        {emp.avatar ? <img src={emp.avatar} alt="" className="w-full h-full object-cover" /> : `${emp.first_name?.[0] || ''}${emp.last_name?.[0] || ''}`.toUpperCase() || '?'}
                    </div>
                    <div>
                        <p className="font-black text-slate-900 dark:text-white text-xs uppercase">{emp.first_name || 'Unknown'} {emp.last_name || 'Employee'}</p>
                        <p className="text-[10px] text-slate-500 font-bold">{emp.employee_code || 'N/A'}</p>
                    </div>
                </div>
            )
        },
        {
            key: 'designation',
            header: 'Position',
            render: (emp: Employee) => (
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{emp.designation?.name || 'Unassigned'}</span>
            )
        },
        {
            key: 'department',
            header: 'Department',
            render: (emp: Employee) => (
                <span className="text-[10px] font-black uppercase text-slate-500">{emp.department?.name || 'N/A'}</span>
            )
        },
        {
            key: 'status',
            header: 'Status',
            render: (emp: Employee) => {
                const colors = {
                    active: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
                    probation: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
                    suspended: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
                    terminated: 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                };
                return (
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border ${colors[emp.status]}`}>
                        {emp.status}
                    </span>
                );
            }
        },
        {
            key: 'actions',
            header: '',
            align: 'right' as const,
            render: (emp: Employee) => (
                <div className="flex justify-end gap-2 relative">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-[9px] font-black uppercase"
                        onClick={() => navigate(`/employees/${emp.id}`)}
                    >
                        View
                    </Button>
                    <div className="relative">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-400"
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === emp.id ? null : emp.id);
                            }}
                        >
                            •••
                        </Button>
                        {openMenuId === emp.id && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setOpenMenuId(null)}
                                />
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <button
                                        onClick={() => {
                                            setEditingEmployee(emp);
                                            setIsAddModalOpen(true);
                                            setOpenMenuId(null);
                                        }}
                                        className="w-full px-4 py-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors flex items-center gap-2"
                                    >
                                        <span>✏️</span> Edit Employee
                                    </button>
                                    <button
                                        onClick={() => {
                                            navigate(`/employees/${emp.id}`);
                                            setOpenMenuId(null);
                                        }}
                                        className="w-full px-4 py-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors flex items-center gap-2"
                                    >
                                        <span>👤</span> View Profile
                                    </button>
                                    <button
                                        onClick={() => {
                                            setStatusChangeEmployee(emp);
                                            setOpenMenuId(null);
                                        }}
                                        className="w-full px-4 py-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors flex items-center gap-2"
                                    >
                                        <span>🔄</span> Change Status
                                    </button>
                                    <div className="border-t border-slate-200 dark:border-white/10" />
                                    <button
                                        onClick={() => {
                                            handleDelete(emp);
                                            setOpenMenuId(null);
                                        }}
                                        className="w-full px-4 py-3 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors flex items-center gap-2"
                                    >
                                        <span>🗑️</span> Delete Employee
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )
        }
    ], [openMenuId, navigate]);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Employee <span className="text-purple-500">Directory</span></h1>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-2 italic">Global Workforce Governance Hub</p>
                </div>
                <Button
                    className="px-8 py-4 rounded-2xl shadow-2xl shadow-purple-500/20"
                    onClick={() => setIsAddModalOpen(true)}
                >
                    + Add New Employee
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {isMetricsLoading ? (
                    <>
                        <CardSkeleton /> <CardSkeleton /> <CardSkeleton /> <CardSkeleton />
                    </>
                ) : (
                    <>
                        <GlassCard className="!p-6 border-l-4 border-l-purple-500">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Strength</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white">{metrics?.total_employees || 0}</p>
                        </GlassCard>
                        <GlassCard className="!p-6 border-l-4 border-l-emerald-500">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Active Assets</p>
                            <p className="text-2xl font-black text-emerald-500">{metrics?.active_employees || 0}</p>
                        </GlassCard>
                        <GlassCard className="!p-6 border-l-4 border-l-amber-500">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">In Probation</p>
                            <p className="text-2xl font-black text-amber-500">{metrics?.probation_count || 0}</p>
                        </GlassCard>
                        <GlassCard className="!p-6 border-l-4 border-l-blue-500">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">New Hires (MTD)</p>
                            <p className="text-2xl font-black text-blue-500">{metrics?.new_hires_this_month || 0}</p>
                        </GlassCard>
                    </>
                )}
            </div>

            <GlassCard className="!p-4 bg-white/[0.02] border-white/5 flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[240px] relative">
                    <input
                        type="text"
                        placeholder="Search Intelligence Files..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white/5 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-[10px] font-black uppercase tracking-widest text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600">🔍</span>
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as EmployeeStatus)}
                    className="bg-white/5 border border-white/5 rounded-xl py-3 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 focus:outline-none transition-all"
                >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="probation">Probation</option>
                    <option value="suspended">Suspended</option>
                    <option value="terminated">Terminated</option>
                </select>
                <Button variant="secondary" className="px-6">Filter</Button>
            </GlassCard>

            <DataTable
                data={directoryData?.data || []}
                columns={columns}
                isLoading={isDirectoryLoading}
                emptyMessage="No employees found. Add your first employee to get started."
                pagination={{
                    currentPage: page,
                    totalPages: directoryData?.meta?.last_page || 1,
                    onPageChange: (p) => setPage(p)
                }}
            />

            <AddEmployeeModal
                isOpen={isAddModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false);
                    setEditingEmployee(null);
                }}
                employee={editingEmployee}
            />

            {/* Status Change Modal */}
            {statusChangeEmployee && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="absolute inset-0" onClick={() => setStatusChangeEmployee(null)} />
                    <div className="w-full max-w-md bg-white dark:bg-[#0d0a1a] shadow-2xl rounded-[32px] border border-slate-200 dark:border-white/10 animate-in zoom-in-95 duration-300 p-8 relative">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic mb-2">
                            Change <span className="text-purple-500">Status</span>
                        </h3>
                        <p className="text-xs text-slate-500 mb-6">
                            Update status for {statusChangeEmployee.first_name} {statusChangeEmployee.last_name}
                        </p>

                        <div className="space-y-3 mb-6">
                            {(['active', 'probation', 'suspended', 'terminated'] as EmployeeStatus[]).map((status) => (
                                <button
                                    key={status}
                                    onClick={() => handleStatusChange(statusChangeEmployee, status)}
                                    disabled={statusMutation.isPending}
                                    className={`w-full p-4 rounded-xl text-left text-sm font-bold transition-all border-2 ${statusChangeEmployee.status === status
                                        ? 'bg-purple-500/10 border-purple-500 text-purple-500'
                                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:border-white/20'
                                        } ${statusMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <span className="uppercase tracking-wider">{status}</span>
                                    {statusChangeEmployee.status === status && (
                                        <span className="ml-2 text-xs">(Current)</span>
                                    )}
                                </button>
                            ))}
                        </div>

                        <Button
                            variant="ghost"
                            onClick={() => setStatusChangeEmployee(null)}
                            className="w-full"
                            disabled={statusMutation.isPending}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default EmployeeManagementPage;
