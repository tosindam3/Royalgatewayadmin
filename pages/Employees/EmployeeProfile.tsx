import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeService } from '../../services/employeeService';
import { ProfileHeaderSkeleton } from '../../components/ui/Skeleton';
import GlassCard from '../../components/GlassCard';
import Button from '../../components/ui/Button';
import AddEmployeeModal from '../../components/modals/AddEmployeeModal';
import { EmployeeStatus } from '../../types';
import { toast } from 'sonner';

const EmployeeProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('Overview');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [openActionsMenu, setOpenActionsMenu] = useState(false);

    const { data: employee, isLoading } = useQuery({
        queryKey: ['employee', id],
        queryFn: () => employeeService.getById(id!),
        enabled: !!id
    });

    const deleteMutation = useMutation({
        mutationFn: () => employeeService.delete(id!),
        onSuccess: () => {
            toast.success('Employee Deleted', { description: 'Employee has been removed from the system.' });
            navigate('/employees');
        },
        onError: (error: any) => {
            toast.error('Failed to delete employee', { description: error.message });
        }
    });

    const statusMutation = useMutation({
        mutationFn: (status: EmployeeStatus) => employeeService.updateStatus(id!, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employee', id] });
            queryClient.invalidateQueries({ queryKey: ['employee-directory'] });
            queryClient.invalidateQueries({ queryKey: ['employee-metrics'] });
            toast.success('Status Updated', { description: 'Employee status has been changed successfully.' });
        },
        onError: (error: any) => {
            toast.error('Failed to update status', { description: error.message });
        }
    });

    if (isLoading) return <ProfileHeaderSkeleton />;
    if (!employee) return (
        <div className="p-20 text-center">
            <p className="uppercase font-black text-slate-500 italic text-xl mb-4">Target Identity Not Found</p>
            <Button onClick={() => navigate('/employees')}>← Back to Directory</Button>
        </div>
    );

    const tabs = ['Overview', 'Personal', 'Job', 'Compensation', 'Onboarding', 'Documents'];

    const statusColors = {
        active: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        probation: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        suspended: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
        terminated: 'bg-slate-500/10 text-slate-500 border-slate-500/20'
    };

    const handleStatusChange = (newStatus: EmployeeStatus) => {
        if (confirm(`Are you sure you want to change status to ${newStatus}?`)) {
            statusMutation.mutate(newStatus);
        }
    };

    const handleDelete = () => {
        if (confirm(`Are you sure you want to delete ${employee?.first_name} ${employee?.last_name}? This action cannot be undone.`)) {
            deleteMutation.mutate();
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button 
                    onClick={() => navigate('/employees')}
                    className="p-3 bg-white dark:bg-white/5 rounded-2xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm border border-slate-200 dark:border-white/10"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
                        Employee <span className="text-purple-500">Profile</span>
                    </h1>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1">Identity Intelligence Nexus</p>
                </div>
            </div>

            {/* Profile Header */}
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start p-8 bg-white/[0.03] rounded-[40px] border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-transparent to-transparent" />
                <div className="w-32 h-32 rounded-[40px] bg-purple-500/10 border-4 border-white/10 shadow-2xl overflow-hidden flex items-center justify-center">
                    {employee.avatar ? (
                        <img src={employee.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-4xl font-black text-purple-500">
                            {employee.first_name[0]}{employee.last_name[0]}
                        </span>
                    )}
                </div>
                <div className="flex-1 text-center md:text-left space-y-4">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
                            {employee.first_name} {employee.last_name}
                        </h1>
                        <p className="text-[10px] text-purple-500 font-black uppercase tracking-[0.4em] mt-1">
                            {employee.designation?.name} • {employee.employee_code}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                        <span className="px-4 py-1.5 rounded-2xl bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-slate-400">
                            {employee.department?.name}
                        </span>
                        <span className="px-4 py-1.5 rounded-2xl bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-slate-400">
                            {employee.employment_type}
                        </span>
                        <span className="px-4 py-1.5 rounded-2xl bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-slate-400">
                            {employee.work_mode}
                        </span>
                        <span className={`px-4 py-1.5 rounded-2xl text-[9px] font-black uppercase tracking-widest border ${statusColors[employee.status]}`}>
                            {employee.status}
                        </span>
                    </div>
                </div>
                <div className="flex gap-2 relative">
                    <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => setIsEditModalOpen(true)}
                    >
                        Edit Profile
                    </Button>
                    <div className="relative">
                        <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setOpenActionsMenu(!openActionsMenu)}
                        >
                            •••
                        </Button>
                        {openActionsMenu && (
                            <>
                                <div 
                                    className="fixed inset-0 z-10" 
                                    onClick={() => setOpenActionsMenu(false)}
                                />
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <button
                                        onClick={() => {
                                            setIsEditModalOpen(true);
                                            setOpenActionsMenu(false);
                                        }}
                                        className="w-full px-4 py-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors flex items-center gap-2"
                                    >
                                        <span>✏️</span> Edit Profile
                                    </button>
                                    <button
                                        onClick={() => {
                                            toast.info('Export', { description: 'Export feature coming soon' });
                                            setOpenActionsMenu(false);
                                        }}
                                        className="w-full px-4 py-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors flex items-center gap-2"
                                    >
                                        <span>📄</span> Export Profile
                                    </button>
                                    <button
                                        onClick={() => {
                                            toast.info('Print', { description: 'Print feature coming soon' });
                                            setOpenActionsMenu(false);
                                        }}
                                        className="w-full px-4 py-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors flex items-center gap-2"
                                    >
                                        <span>🖨️</span> Print Profile
                                    </button>
                                    <div className="border-t border-slate-200 dark:border-white/10" />
                                    <button
                                        onClick={() => {
                                            handleStatusChange('suspended');
                                            setOpenActionsMenu(false);
                                        }}
                                        className="w-full px-4 py-3 text-left text-xs font-bold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors flex items-center gap-2"
                                    >
                                        <span>⏸️</span> Suspend Employee
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleDelete();
                                            setOpenActionsMenu(false);
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
            </div>

            {/* Tabs */}
            <div className="flex gap-8 border-b border-white/5 overflow-x-auto no-scrollbar">
                {tabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-4 text-[10px] font-black uppercase tracking-[0.2em] relative transition-all whitespace-nowrap ${
                            activeTab === tab ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        {tab}
                        {activeTab === tab && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.5)]" />
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="animate-in slide-in-from-bottom-2 duration-500" key={activeTab}>
                {activeTab === 'Overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <GlassCard className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest border-l-2 border-purple-500 pl-3">
                                Contact Intel
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Email</p>
                                    <p className="text-xs font-bold text-white">{employee.email}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Phone</p>
                                    <p className="text-xs font-bold text-slate-400">{employee.phone || 'N/A'}</p>
                                </div>
                            </div>
                        </GlassCard>

                        <GlassCard className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest border-l-2 border-purple-500 pl-3">
                                Organization
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Branch</p>
                                    <p className="text-xs font-bold text-white">{employee.branch?.name || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Manager</p>
                                    <p className="text-xs font-bold text-slate-400">{employee.manager?.full_name || 'N/A'}</p>
                                </div>
                            </div>
                        </GlassCard>

                        <GlassCard className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest border-l-2 border-purple-500 pl-3">
                                Employment
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Hire Date</p>
                                    <p className="text-xs font-bold text-white">
                                        {new Date(employee.hire_date).toLocaleDateString('en-US', { 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric' 
                                        })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Tenure</p>
                                    <p className="text-xs font-bold text-slate-400">
                                        {Math.floor((new Date().getTime() - new Date(employee.hire_date).getTime()) / (1000 * 60 * 60 * 24 * 365))} years
                                    </p>
                                </div>
                            </div>
                        </GlassCard>
                    </div>
                )}

                {activeTab === 'Personal' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <GlassCard className="space-y-6">
                            <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest border-l-2 border-purple-500 pl-3">
                                Personal Information
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Date of Birth</p>
                                    <p className="text-sm font-bold text-white">
                                        {employee.dob ? new Date(employee.dob).toLocaleDateString('en-US', { 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric' 
                                        }) : 'N/A'}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Blood Group</p>
                                        <p className="text-2xl font-black text-white">{employee.blood_group || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Genotype</p>
                                        <p className="text-2xl font-black text-white">{employee.genotype || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>

                        <GlassCard className="space-y-6">
                            <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest border-l-2 border-purple-500 pl-3">
                                Academic Background
                            </h3>
                            <div className="p-6 bg-gradient-to-br from-blue-500/5 to-transparent border border-blue-500/10 rounded-2xl">
                                <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest mb-3 italic">Verified Credentials</p>
                                <p className="text-sm font-bold text-white leading-relaxed">
                                    {employee.academics || 'No academic information provided'}
                                </p>
                            </div>
                        </GlassCard>
                    </div>
                )}

                {activeTab === 'Job' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <GlassCard className="space-y-6">
                            <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest border-l-2 border-purple-500 pl-3">
                                Position Details
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Designation</p>
                                    <p className="text-lg font-black text-white">{employee.designation?.name}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Department</p>
                                    <p className="text-sm font-bold text-slate-400">{employee.department?.name}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Branch</p>
                                    <p className="text-sm font-bold text-slate-400">{employee.branch?.name}</p>
                                </div>
                            </div>
                        </GlassCard>

                        <GlassCard className="space-y-6">
                            <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest border-l-2 border-purple-500 pl-3">
                                Employment Terms
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Employment Type</p>
                                    <p className="text-sm font-bold text-white capitalize">{employee.employment_type}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Work Mode</p>
                                    <p className="text-sm font-bold text-white capitalize">{employee.work_mode}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Status</p>
                                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border ${statusColors[employee.status]}`}>
                                        {employee.status}
                                    </span>
                                </div>
                            </div>
                        </GlassCard>

                        <GlassCard className="md:col-span-2 space-y-6">
                            <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest border-l-2 border-purple-500 pl-3">
                                Reporting Structure
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                                    <p className="text-[9px] font-black text-slate-500 uppercase mb-3">Reports To</p>
                                    <p className="text-sm font-bold text-white">{employee.manager?.full_name || 'No Manager Assigned'}</p>
                                </div>
                                <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                                    <p className="text-[9px] font-black text-slate-500 uppercase mb-3">Direct Reports</p>
                                    <p className="text-sm font-bold text-white">0 Subordinates</p>
                                </div>
                            </div>
                        </GlassCard>
                    </div>
                )}

                {activeTab === 'Compensation' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <GlassCard className="space-y-6">
                            <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest border-l-2 border-purple-500 pl-3">
                                Salary Information
                            </h3>
                            <div className="p-8 bg-gradient-to-br from-emerald-500/5 to-transparent border border-emerald-500/10 rounded-2xl text-center">
                                <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mb-2">Annual Compensation</p>
                                <p className="text-4xl font-black text-white">$85,000</p>
                                <p className="text-[9px] text-slate-500 font-bold uppercase mt-2">Base Salary</p>
                            </div>
                        </GlassCard>

                        <GlassCard className="space-y-6">
                            <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest border-l-2 border-purple-500 pl-3">
                                Benefits Package
                            </h3>
                            <div className="space-y-3">
                                {['Health Insurance', 'Dental Coverage', '401(k) Matching', 'Paid Time Off'].map((benefit, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                                        <span className="text-emerald-500">✓</span>
                                        <span className="text-xs font-bold text-white">{benefit}</span>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>

                        <GlassCard className="md:col-span-2 space-y-6">
                            <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest border-l-2 border-purple-500 pl-3">
                                Compensation History
                            </h3>
                            <div className="space-y-3">
                                {[
                                    { date: 'Jan 2024', amount: '$85,000', type: 'Annual Review Increase' },
                                    { date: 'Jan 2023', amount: '$78,000', type: 'Promotion Adjustment' },
                                    { date: 'Jun 2022', amount: '$72,000', type: 'Initial Offer' }
                                ].map((item, i) => (
                                    <div key={i} className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                                        <div>
                                            <p className="text-xs font-bold text-white">{item.type}</p>
                                            <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">{item.date}</p>
                                        </div>
                                        <p className="text-lg font-black text-emerald-500">{item.amount}</p>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                    </div>
                )}

                {activeTab === 'Onboarding' && (
                    <div className="space-y-6">
                        <GlassCard className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest border-l-2 border-purple-500 pl-3">
                                    Onboarding Progress
                                </h3>
                                <span className="text-2xl font-black text-emerald-500">100%</span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 w-full" />
                            </div>
                        </GlassCard>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                { task: 'Complete HR Documentation', status: 'done', date: 'Completed Jan 15, 2023' },
                                { task: 'IT Equipment Setup', status: 'done', date: 'Completed Jan 15, 2023' },
                                { task: 'Department Orientation', status: 'done', date: 'Completed Jan 16, 2023' },
                                { task: 'Security Training', status: 'done', date: 'Completed Jan 17, 2023' }
                            ].map((item, i) => (
                                <GlassCard key={i} className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center flex-shrink-0">
                                            <span className="text-emerald-500 text-xs">✓</span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-white">{item.task}</p>
                                            <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">{item.date}</p>
                                        </div>
                                    </div>
                                </GlassCard>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'Documents' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-black uppercase text-slate-500 tracking-widest">Employee Documents</h3>
                            <Button size="sm">+ Upload Document</Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                { name: 'Employment Contract', type: 'PDF', size: '2.4 MB', date: 'Jan 15, 2023' },
                                { name: 'Tax Forms (W-4)', type: 'PDF', size: '156 KB', date: 'Jan 15, 2023' },
                                { name: 'Direct Deposit Form', type: 'PDF', size: '89 KB', date: 'Jan 15, 2023' },
                                { name: 'Background Check', type: 'PDF', size: '1.2 MB', date: 'Jan 10, 2023' },
                                { name: 'Resume', type: 'PDF', size: '345 KB', date: 'Dec 20, 2022' },
                                { name: 'Certifications', type: 'PDF', size: '678 KB', date: 'Jan 15, 2023' }
                            ].map((doc, i) => (
                                <GlassCard key={i} className="space-y-4 hover:bg-white/[0.05] transition-all cursor-pointer">
                                    <div className="flex items-start gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                                            <span className="text-red-500 text-xs font-black">PDF</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-white truncate">{doc.name}</p>
                                            <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">{doc.size} • {doc.date}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" className="flex-1 text-[9px]">View</Button>
                                        <Button variant="ghost" size="sm" className="flex-1 text-[9px]">Download</Button>
                                    </div>
                                </GlassCard>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <AddEmployeeModal 
                isOpen={isEditModalOpen} 
                onClose={() => setIsEditModalOpen(false)}
                employee={employee}
            />
        </div>
    );
};

export default EmployeeProfile;
