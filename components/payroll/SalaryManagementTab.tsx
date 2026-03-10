import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import GlassCard from '../GlassCard';
import Button from '../ui/Button';
import { payrollApi } from '../../services/payrollService';
import { employeeService } from '../../services/employeeService';
import { SalaryStructure, EmployeeSalary, Employee, PayrollItem } from '../../types';

const SalaryManagementTab: React.FC = () => {
    const queryClient = useQueryClient();
    const [activeSubTab, setActiveSubTab] = useState<'Mappings' | 'Structures'>('Mappings');
    const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
    const [isConfigureModalOpen, setIsConfigureModalOpen] = useState(false);
    const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);
    const [selectedMappingId, setSelectedMappingId] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<'view' | 'edit' | null>(null);
    const [selectedStructure, setSelectedStructure] = useState<SalaryStructure | null>(null);

    // Form States
    const [structureForm, setStructureForm] = useState<Partial<SalaryStructure>>({
        name: '',
        description: '',
        earnings_components: [],
        deductions_components: []
    });

    const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
    const [selectedStructureId, setSelectedStructureId] = useState<number | null>(null);
    const [baseSalary, setBaseSalary] = useState(0);
    const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);

    // Queries
    const { data: structures } = useQuery({
        queryKey: ['payroll-structures'],
        queryFn: () => payrollApi.getStructures(),
        initialData: []
    });

    const { data: mappings } = useQuery({
        queryKey: ['employee-salaries'],
        queryFn: () => payrollApi.getEmployeeSalaries(),
        initialData: []
    });

    const { data: payrollItems } = useQuery({
        queryKey: ['payroll-items'],
        queryFn: () => payrollApi.getPayItems(),
        initialData: []
    });

    const { data: employeesResponse } = useQuery({
        queryKey: ['employees'],
        queryFn: () => employeeService.getDirectory(),
    });
    const employees = employeesResponse?.data || [];

    const selectedMapping = mappings.find(m => m.id === selectedMappingId);

    // Mock data for integrated preview (should ideally come from backend)
    const attendanceStats = { penalty_amount: 150, late_minutes: 45, absent_days: 1 };
    const performanceStats = { adjustment_amount: 250, score: 4.2, bonus_multiplier: 0.1 };

    // Mutations
    const structureMutation = useMutation({
        mutationFn: (data: Partial<SalaryStructure>) =>
            data.id ? payrollApi.updateStructure(data.id, data) : payrollApi.createStructure(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payroll-structures'] });
            setIsStructureModalOpen(false);
            setIsConfigureModalOpen(false);
            setStructureForm({ name: '', description: '', earnings_components: [], deductions_components: [] });
        }
    });

    const deleteStructureMutation = useMutation({
        mutationFn: (id: number) => payrollApi.deleteStructure(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payroll-structures'] });
        },
        onError: (err: any) => {
            alert(err.response?.data?.error || 'Failed to delete structure. It might be assigned to employees.');
        }
    });

    const toggleComponent = (type: 'earnings' | 'deductions', id: number) => {
        const field = type === 'earnings' ? 'earnings_components' : 'deductions_components';
        setStructureForm(prev => {
            const current = (prev[field] as number[]) || [];
            const updated = current.includes(id)
                ? current.filter(cid => cid !== id)
                : [...current, id];
            return { ...prev, [field]: updated };
        });
    };

    const assignMutation = useMutation({
        mutationFn: (data: { employee_id: number; salary_structure_id: number; base_salary: number; effective_date: string }) =>
            payrollApi.assignSalaryStructure(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employee-salaries'] });
            setIsMappingModalOpen(false);
            resetForm();
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => payrollApi.deleteEmployeeSalary(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employee-salaries'] });
            alert('Mapping deleted successfully');
        }
    });

    const updateMappingMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => payrollApi.updateEmployeeSalaryMapping(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employee-salaries'] });
            setSelectedMappingId(null);
            setViewMode(null);
        }
    });

    const resetForm = () => {
        setSelectedEmployeeId(null);
        setSelectedStructureId(null);
        setBaseSalary(0);
        setEffectiveDate(new Date().toISOString().split('T')[0]);
    };

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Sub-Tabs */}
            <div className="flex gap-6 border-b border-white/5 pb-4">
                {['Mappings', 'Structures'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveSubTab(tab as any)}
                        className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeSubTab === tab ? 'text-[#8252e9] border-b-2 border-[#8252e9]' : 'text-slate-500 hover:text-white'
                            }`}
                    >
                        {tab === 'Mappings' ? 'Employee Mappings' : 'Salary Structures'}
                    </button>
                ))}
            </div>

            {activeSubTab === 'Mappings' ? (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-black text-white italic uppercase tracking-tight">Employee Compensation</h3>
                        <Button
                            variant="primary"
                            onClick={() => setIsMappingModalOpen(true)}
                        >
                            + Assign Structure
                        </Button>
                    </div>

                    <GlassCard className="!p-0 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-white/5">
                                <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    <th className="px-6 py-4">Employee</th>
                                    <th className="px-6 py-4">Structure</th>
                                    <th className="px-6 py-4">Base Salary</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {mappings.map((mapping: EmployeeSalary) => (
                                    <tr key={mapping.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] font-black text-blue-400">
                                                    {mapping.employee?.first_name?.charAt(0) || 'E'}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-white uppercase">{mapping.employee?.first_name} {mapping.employee?.last_name}</p>
                                                    <p className="text-[9px] text-slate-500 font-bold uppercase">{mapping.employee?.employee_code}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold text-[#8252e9]">{mapping.salary_structure?.name}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs font-black text-white">{formatCurrency(mapping.base_salary)}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${mapping.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>
                                                {mapping.is_active ? 'Active' : 'Superseded'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-4">
                                            <button
                                                onClick={() => { setSelectedMappingId(mapping.id); setViewMode('view'); }}
                                                className="text-[9px] font-black text-emerald-500 hover:text-emerald-400 uppercase tracking-widest transition-all"
                                            >
                                                View
                                            </button>
                                            <button
                                                onClick={() => { setSelectedMappingId(mapping.id); setViewMode('edit'); }}
                                                className="text-[9px] font-black text-blue-500 hover:text-blue-400 uppercase tracking-widest transition-all"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => { if (confirm('Delete this mapping?')) deleteMutation.mutate(mapping.id); }}
                                                className="text-[9px] font-black text-rose-500 hover:text-rose-400 uppercase tracking-widest transition-all"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </GlassCard>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {structures.map((s) => (
                        <GlassCard key={s.id} className="!p-6 relative group overflow-hidden">
                            <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#8252e9]/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="text-lg font-black text-white italic">{s.name}</h4>
                                <button
                                    onClick={() => { if (confirm('Delete structure?')) deleteStructureMutation.mutate(s.id); }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-rose-500 hover:text-rose-400 p-1"
                                >
                                    🗑️
                                </button>
                            </div>
                            <p className="text-[10px] text-slate-500 font-bold mb-6 line-clamp-2">{s.description || 'No description provided.'}</p>

                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                                    <span className="text-slate-400">Earnings</span>
                                    <span className="text-emerald-500">{s.earnings_components.length} components</span>
                                </div>
                                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                                    <span className="text-slate-400">Deductions</span>
                                    <span className="text-rose-500">{s.deductions_components.length} components</span>
                                </div>
                            </div>

                            <Button
                                variant="secondary"
                                className="w-full"
                                onClick={() => {
                                    setSelectedStructure(s);
                                    setStructureForm(s);
                                    setIsConfigureModalOpen(true);
                                }}
                            >
                                Configure Grade
                            </Button>
                        </GlassCard>
                    ))}
                    <button
                        onClick={() => {
                            setStructureForm({ name: '', description: '', earnings_components: [], deductions_components: [] });
                            setIsStructureModalOpen(true);
                        }}
                        className="h-full min-h-[200px] border-2 border-dashed border-white/10 rounded-[32px] flex flex-col items-center justify-center gap-4 hover:border-[#8252e9]/50 hover:bg-[#8252e9]/5 transition-all group"
                    >
                        <span className="text-4xl grayscale group-hover:grayscale-0 transition-all">➕</span>
                        <span className="text-[10px] font-black text-slate-500 group-hover:text-white uppercase tracking-widest">New Structure</span>
                    </button>
                </div>
            )}

            {/* Structure Add/Edit Modal */}
            {isStructureModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0" onClick={() => setIsStructureModalOpen(false)} />
                    <div className="w-full max-w-lg bg-[#0d0a1a] border border-white/10 rounded-[40px] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-500">
                        <div className="p-10">
                            <h3 className="text-2xl font-black text-white italic mb-6">Create Salary Structure</h3>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Structure Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Senior Management"
                                        value={structureForm.name}
                                        onChange={(e) => setStructureForm({ ...structureForm, name: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:border-[#8252e9] focus:outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Description</label>
                                    <textarea
                                        placeholder="Enter details about this pay grade..."
                                        value={structureForm.description}
                                        onChange={(e) => setStructureForm({ ...structureForm, description: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:border-[#8252e9] focus:outline-none h-24"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 mt-10">
                                <Button variant="secondary" onClick={() => setIsStructureModalOpen(false)} className="flex-1">Cancel</Button>
                                <Button
                                    variant="primary"
                                    onClick={() => structureMutation.mutate(structureForm)}
                                    isLoading={structureMutation.isPending}
                                    disabled={!structureForm.name}
                                    className="flex-1"
                                >
                                    Create Structure
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Configure Components Modal */}
            {isConfigureModalOpen && selectedStructure && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0" onClick={() => setIsConfigureModalOpen(false)} />
                    <div className="w-full max-w-2xl bg-[#0d0a1a] border border-white/10 rounded-[40px] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-500">
                        <div className="p-10">
                            <h3 className="text-2xl font-black text-white italic mb-2 uppercase tracking-tight">Configure {selectedStructure.name}</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-8">Select pay components enabled for this grade</p>

                            <div className="space-y-8 max-h-[50vh] overflow-y-auto no-scrollbar pr-4">
                                {/* Earnings Section */}
                                <div>
                                    <h4 className="text-[10px] font-black text-[#10b981] uppercase tracking-[0.2em] mb-4 border-l-2 border-[#10b981] pl-3">Earnings Components</h4>
                                    <div className="grid grid-cols-1 gap-2">
                                        {payrollItems.filter(i => i.type === 'earning').map(item => {
                                            const isSelected = structureForm.earnings_components?.includes(item.id);
                                            return (
                                                <div
                                                    key={item.id}
                                                    onClick={() => toggleComponent('earnings', item.id)}
                                                    className={`p-4 rounded-2xl border transition-all flex justify-between items-center cursor-pointer ${isSelected ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/5 border-white/5 opacity-50 hover:opacity-80'}`}
                                                >
                                                    <div>
                                                        <p className="text-xs font-black text-white uppercase">{item.name}</p>
                                                        <p className="text-[9px] text-slate-500 font-bold uppercase">{item.code} • {item.method}</p>
                                                    </div>
                                                    <div className={`w-5 h-5 rounded-lg border flex items-center justify-center ${isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-white/20'}`}>
                                                        {isSelected && '✓'}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Deductions Section */}
                                <div>
                                    <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-4 border-l-2 border-rose-500 pl-3">Deductions Components</h4>
                                    <div className="grid grid-cols-1 gap-2">
                                        {payrollItems.filter(i => i.type === 'deduction').map(item => {
                                            const isSelected = structureForm.deductions_components?.includes(item.id);
                                            return (
                                                <div
                                                    key={item.id}
                                                    onClick={() => toggleComponent('deductions', item.id)}
                                                    className={`p-4 rounded-2xl border transition-all flex justify-between items-center cursor-pointer ${isSelected ? 'bg-rose-500/10 border-rose-500/20' : 'bg-white/5 border-white/5 opacity-50 hover:opacity-80'}`}
                                                >
                                                    <div>
                                                        <p className="text-xs font-black text-white uppercase">{item.name}</p>
                                                        <p className="text-[9px] text-slate-500 font-bold uppercase">{item.code} • {item.method}</p>
                                                    </div>
                                                    <div className={`w-5 h-5 rounded-lg border flex items-center justify-center ${isSelected ? 'bg-rose-500 border-rose-500 text-white' : 'border-white/20'}`}>
                                                        {isSelected && '✓'}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 mt-10">
                                <Button variant="secondary" onClick={() => setIsConfigureModalOpen(false)} className="flex-1">Cancel</Button>
                                <Button
                                    variant="primary"
                                    onClick={() => structureMutation.mutate(structureForm)}
                                    isLoading={structureMutation.isPending}
                                    className="flex-1 shadow-lg shadow-[#8252e9]/20"
                                >
                                    Save Configuration
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Modal */}
            {isMappingModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0" onClick={() => setIsMappingModalOpen(false)} />
                    <div className="w-full max-w-lg bg-[#0d0a1a] border border-white/10 rounded-[40px] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-500">
                        <div className="p-10">
                            <h3 className="text-2xl font-black text-white italic mb-6">Assign Salary Structure</h3>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select Employee</label>
                                    <select
                                        onChange={(e) => setSelectedEmployeeId(Number(e.target.value))}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:border-[#8252e9] focus:outline-none"
                                    >
                                        <option value="">Choose an employee...</option>
                                        {employees.map((e: any) => (
                                            <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.employee_code})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select Structure (Pay Grade)</label>
                                    <select
                                        onChange={(e) => setSelectedStructureId(Number(e.target.value))}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:border-[#8252e9] focus:outline-none"
                                    >
                                        <option value="">Choose a structure...</option>
                                        {structures.map((s) => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Base Salary ($)</label>
                                        <input
                                            type="number"
                                            placeholder="e.g. 5000"
                                            onChange={(e) => setBaseSalary(Number(e.target.value))}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:border-[#8252e9] focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Effective Date</label>
                                        <input
                                            type="date"
                                            value={effectiveDate}
                                            onChange={(e) => setEffectiveDate(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:border-[#8252e9] focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 mt-10">
                                <Button variant="secondary" onClick={() => setIsMappingModalOpen(false)} className="flex-1">Cancel</Button>
                                <Button
                                    variant="primary"
                                    onClick={() => assignMutation.mutate({
                                        employee_id: selectedEmployeeId!,
                                        salary_structure_id: selectedStructureId!,
                                        base_salary: baseSalary,
                                        effective_date: effectiveDate
                                    })}
                                    isLoading={assignMutation.isPending}
                                    disabled={!selectedEmployeeId || !selectedStructureId}
                                    className="flex-1"
                                >
                                    Assign Now
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Detailed View/Edit Mapping Modal */}
            {viewMode && selectedMapping && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0" onClick={() => { setSelectedMappingId(null); setViewMode(null); }} />
                    <div className="w-full max-w-2xl bg-[#0d0a1a] border border-white/10 rounded-[40px] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-500">
                        <div className="p-10">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">
                                        {viewMode === 'view' ? 'Compensation Detail' : 'Edit Mapping'}
                                    </h3>
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">
                                        {selectedMapping.employee?.first_name} {selectedMapping.employee?.last_name} • {selectedMapping.employee?.employee_code}
                                    </p>
                                </div>
                                <button onClick={() => { setSelectedMappingId(null); setViewMode(null); }} className="text-slate-500 hover:text-white transition-colors">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path d="M6 18L18 6M6 6l12 12" strokeWidth="2.5" />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-8 max-h-[60vh] overflow-y-auto no-scrollbar pr-4">
                                {/* Base Config */}
                                <section className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Base Salary ($)</label>
                                        <input
                                            type="number"
                                            defaultValue={selectedMapping.base_salary}
                                            readOnly={viewMode === 'view'}
                                            id="base_salary_input"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:border-[#8252e9] focus:outline-none disabled:opacity-50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Effective Date</label>
                                        <input
                                            type="date"
                                            defaultValue={new Date(selectedMapping.effective_date).toISOString().split('T')[0]}
                                            readOnly={viewMode === 'view'}
                                            id="effective_date_input"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:border-[#8252e9] focus:outline-none disabled:opacity-50"
                                        />
                                    </div>
                                </section>

                                {/* Components Breakdown */}
                                <section>
                                    <h4 className="text-[10px] font-black text-[#8252e9] uppercase tracking-[0.2em] mb-4 border-l-2 border-[#8252e9] pl-3">Salary Components</h4>
                                    <div className="space-y-2">
                                        {payrollItems.filter(i =>
                                            selectedMapping.salary_structure?.earnings_components.includes(i.id) ||
                                            selectedMapping.salary_structure?.deductions_components.includes(i.id)
                                        ).map(item => (
                                            <div key={item.id} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                                                <div>
                                                    <p className="text-xs font-black text-white uppercase">{item.name}</p>
                                                    <p className="text-[9px] text-slate-500 font-bold uppercase">{item.method}</p>
                                                </div>
                                                <p className={`text-xs font-black ${item.type === 'earning' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    {item.type === 'earning' ? '+' : '-'}{item.method === 'fixed' ? formatCurrency(item.default_value) : `${item.default_value}%`}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* External Penalties & Performance (Integrated) */}
                                <section className="grid grid-cols-2 gap-4">
                                    <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-lg">⏰</span>
                                            <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Attendance Penalties</h4>
                                        </div>
                                        <p className="text-xl font-black text-white">-{formatCurrency(attendanceStats.penalty_amount)}</p>
                                        <p className="text-[9px] text-slate-500 mt-1 uppercase font-bold">{attendanceStats.late_minutes}m Late • {attendanceStats.absent_days}d Absent</p>
                                    </div>
                                    <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-lg">⭐</span>
                                            <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Performance Bonus</h4>
                                        </div>
                                        <p className="text-xl font-black text-white">+{formatCurrency(performanceStats.adjustment_amount)}</p>
                                        <p className="text-[9px] text-slate-500 mt-1 uppercase font-bold">Score: {performanceStats.score}/5.0 • {(performanceStats.bonus_multiplier * 100)}% Multiplier</p>
                                    </div>
                                </section>

                                {/* Final Total Calculation Preview */}
                                <section className="p-8 bg-gradient-to-br from-[#8252e9]/20 to-transparent border border-[#8252e9]/20 rounded-[32px]">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-[10px] font-black text-[#8252e9] uppercase tracking-widest mb-1">Estimated Net Pay</p>
                                            <p className="text-3xl font-black text-white italic tracking-tighter">
                                                {formatCurrency(selectedMapping.base_salary - attendanceStats.penalty_amount + performanceStats.adjustment_amount)}
                                            </p>
                                        </div>
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">
                                            Aggregated monthly preview
                                        </span>
                                    </div>
                                </section>
                            </div>

                            <div className="flex gap-4 mt-10">
                                <Button
                                    variant="secondary"
                                    onClick={() => { setSelectedMappingId(null); setViewMode(null); }}
                                    className="flex-1"
                                >
                                    Close
                                </Button>
                                {viewMode === 'edit' && (
                                    <Button
                                        variant="primary"
                                        onClick={() => {
                                            const base = (document.getElementById('base_salary_input') as HTMLInputElement).value;
                                            const date = (document.getElementById('effective_date_input') as HTMLInputElement).value;
                                            updateMappingMutation.mutate({
                                                id: selectedMapping.id,
                                                data: { base_salary: Number(base), effective_date: date }
                                            });
                                        }}
                                        isLoading={updateMappingMutation.isPending}
                                        className="flex-1 shadow-lg shadow-[#8252e9]/20"
                                    >
                                        Save Changes
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalaryManagementTab;
