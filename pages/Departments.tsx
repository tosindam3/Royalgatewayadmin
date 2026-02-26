import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import GlassCard from '../components/GlassCard';
import { Department } from '../types';
import { organizationService, DepartmentFormData } from '../services/organizationService';

const Departments: React.FC = () => {
  const queryClient = useQueryClient();
  const [view, setView] = useState<'LIST' | 'FORM' | 'DETAIL'>('LIST');
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBranch, setFilterBranch] = useState('All');

  // Fetch branches for filter
  const { data: branchesResponse } = useQuery({
    queryKey: ['branches'],
    queryFn: () => organizationService.getBranches({ per_page: 'all' }),
  });

  const branches = Array.isArray(branchesResponse) ? branchesResponse : branchesResponse?.data || [];

  // Fetch departments
  const { data: deptsResponse, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => organizationService.getDepartments({ per_page: 'all' }),
    staleTime: 60000,
  });

  const departments = Array.isArray(deptsResponse) ? deptsResponse : deptsResponse?.data || [];

  const selectedDept = useMemo(() => 
    departments.find((d: Department) => String(d.id) === selectedDeptId) || null
  , [departments, selectedDeptId]);

  // Fetch employees for detail view
  const { data: employeesData, isLoading: isEmployeesLoading } = useQuery({
    queryKey: ['dept-employees', selectedDeptId],
    queryFn: () => organizationService.getDepartmentEmployees(selectedDeptId!),
    enabled: !!selectedDeptId && view === 'DETAIL',
  });

  const employees = employeesData?.employees || [];

  // Filtered departments
  const filteredDepts = useMemo(() => {
    return departments.filter((d: Department) => {
      const matchesSearch = searchTerm === '' || 
                           d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           d.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBranch = filterBranch === 'All' || String(d.branch_id) === filterBranch;
      return matchesSearch && matchesBranch;
    });
  }, [departments, searchTerm, filterBranch]);

  // Form state
  const [formDept, setFormDept] = useState<Partial<DepartmentFormData & { id?: string }>>({});

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: DepartmentFormData) => organizationService.createDepartment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setView('LIST');
      setFormDept({});
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DepartmentFormData> }) => 
      organizationService.updateDepartment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setView('LIST');
      setFormDept({});
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => organizationService.deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });

  const handleEdit = (dept: Department) => {
    setFormDept({
      id: String(dept.id),
      name: dept.name,
      code: dept.code,
      branch_id: dept.branch_id || 0,
    });
    setView('FORM');
  };

  const handleCreate = () => {
    setFormDept({});
    setView('FORM');
  };

  const handleSubmit = () => {
    const { id, ...data } = formDept;
    if (id) {
      updateMutation.mutate({ id, data: data as DepartmentFormData });
    } else {
      createMutation.mutate(data as DepartmentFormData);
    }
  };

  const handleViewDetail = (id: string | number) => {
    setSelectedDeptId(String(id));
    setView('DETAIL');
  };

  const handleDelete = (id: string | number) => {
    if (confirm('Are you sure you want to delete this department?')) {
      deleteMutation.mutate(String(id));
    }
  };

  if (view === 'FORM') {
    return (
      <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
        <div className="flex justify-between items-center px-4">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight uppercase italic">
              {formDept.id ? 'Edit' : 'Create'} <span className="text-[#8252e9]">Department</span>
            </h2>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1 italic">Organizational Unit Management</p>
          </div>
          <button 
            onClick={() => setView('LIST')}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-400 font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all"
          >
            Cancel
          </button>
        </div>

        <GlassCard className="!p-8 border-t-4 border-t-[#8252e9]">
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Department Name</label>
              <input 
                type="text" 
                value={formDept.name || ''} 
                onChange={e => setFormDept({...formDept, name: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-3.5 text-sm text-white focus:border-[#8252e9] outline-none transition-all" 
                placeholder="e.g. Engineering" 
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Department Code</label>
              <input 
                type="text" 
                value={formDept.code || ''}
                onChange={e => setFormDept({...formDept, code: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-3.5 text-sm text-white font-mono uppercase focus:border-[#8252e9] outline-none" 
                placeholder="DEPT-ENG" 
                disabled={!!formDept.id}
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Branch</label>
              <select 
                value={formDept.branch_id || ''}
                onChange={e => setFormDept({...formDept, branch_id: Number(e.target.value)})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-3.5 text-sm text-white focus:border-[#8252e9] outline-none appearance-none cursor-pointer"
              >
                <option value="">Select Branch</option>
                {branches.map((b: any) => (
                  <option key={b.id} value={b.id} className="bg-[#0d0a1a]">{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-12 pt-8 border-t border-white/5">
            <button onClick={() => setView('LIST')} className="px-8 py-3.5 text-slate-500 hover:text-white font-black text-[11px] uppercase tracking-widest transition-all">Cancel</button>
            <button 
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-12 py-3.5 bg-emerald-500 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Department'}
            </button>
          </div>
        </GlassCard>
      </div>
    );
  }

  if (view === 'DETAIL' && selectedDept) {
    return (
      <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
        <div className="flex items-center gap-4">
          <button onClick={() => setView('LIST')} className="p-3 bg-white/5 rounded-2xl text-slate-500 hover:text-white transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth="3" /></svg>
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-black text-white uppercase italic tracking-tight">{selectedDept.name}</h2>
              <span className="px-3 py-1 bg-[#8252e9]/10 border border-[#8252e9]/20 text-[#8252e9] text-[10px] font-black uppercase rounded-full">{selectedDept.code}</span>
            </div>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1 italic">
              Branch: {selectedDept.branch?.name || 'N/A'}
            </p>
          </div>
        </div>

        <GlassCard className="!p-0 overflow-hidden">
          <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Department Employees</h4>
          </div>
          {isEmployeesLoading ? (
            <div className="p-12 text-center animate-pulse text-slate-500 uppercase text-[10px] font-black italic">Loading...</div>
          ) : employees.length === 0 ? (
            <div className="p-12 text-center text-slate-500 uppercase text-[10px] font-black italic">No employees assigned</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[9px] font-black text-slate-500 uppercase border-b border-white/5">
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">Designation</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {employees.map((emp: any) => (
                    <tr key={emp.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-white">{emp.full_name || `${emp.first_name} ${emp.last_name}`}</p>
                        <p className="text-[9px] text-slate-500 font-mono italic mt-0.5">{emp.email}</p>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">{emp.designation?.name || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className="text-[8px] font-black text-emerald-400 border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 rounded-full uppercase">{emp.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight uppercase italic">Department <span className="text-[#8252e9]">Management</span></h2>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1 italic">Organizational Units & Teams</p>
        </div>
        <button 
          onClick={handleCreate}
          className="px-6 py-3 bg-[#8252e9] text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-[#8252e9]/20 active:scale-95 transition-all"
        >
          + Create Department
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className="lg:col-span-1 space-y-6">
          <GlassCard title="Filters" className="!p-5">
            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Search</label>
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Name or code..." 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:border-[#8252e9] outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Branch</label>
                <select 
                  value={filterBranch}
                  onChange={e => setFilterBranch(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#8252e9] outline-none appearance-none cursor-pointer"
                >
                  <option value="All" className="bg-[#0d0a1a]">All Branches</option>
                  {branches.map((b: any) => (
                    <option key={b.id} value={b.id} className="bg-[#0d0a1a]">{b.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </GlassCard>
        </aside>

        <main className="lg:col-span-3">
          <GlassCard className="!p-0 overflow-hidden">
            {isLoading ? (
              <div className="p-20 text-center text-slate-500 uppercase text-xs font-black italic animate-pulse">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-500 text-[9px] uppercase font-black tracking-[0.25em] border-b border-white/5 bg-white/[0.01]">
                      <th className="px-6 py-5">Department</th>
                      <th className="px-6 py-5">Branch</th>
                      <th className="px-6 py-5">Employees</th>
                      <th className="px-6 py-5 text-right pr-8">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredDepts.map((dept: Department) => (
                      <tr key={dept.id} className="group hover:bg-white/[0.03] transition-all cursor-pointer" onClick={() => handleViewDetail(dept.id)}>
                        <td className="px-6 py-6">
                          <p className="text-xs font-black text-white uppercase">{dept.name}</p>
                          <p className="text-[9px] font-mono text-slate-500 mt-1 uppercase">{dept.code}</p>
                        </td>
                        <td className="px-6 py-6 text-xs text-slate-400">{dept.branch?.name || 'N/A'}</td>
                        <td className="px-6 py-6 text-sm font-black text-white">0</td>
                        <td className="px-6 py-6 text-right pr-8">
                          <div className="flex justify-end gap-3" onClick={e => e.stopPropagation()}>
                            <button 
                              onClick={() => handleEdit(dept)}
                              className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeWidth="2.5" /></svg>
                            </button>
                            <button 
                              onClick={() => handleDelete(dept.id)}
                              className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2.5" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="p-5 border-t border-white/5 bg-white/[0.01] text-[10px] font-black text-slate-500 uppercase tracking-widest italic">
              Showing {filteredDepts.length} departments
            </div>
          </GlassCard>
        </main>
      </div>
    </div>
  );
};

export default Departments;
