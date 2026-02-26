import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import GlassCard from '../components/GlassCard';
import { Designation } from '../types';
import { organizationService, DesignationFormData } from '../services/organizationService';

const Designations: React.FC = () => {
  const queryClient = useQueryClient();
  const [view, setView] = useState<'LIST' | 'FORM' | 'DETAIL'>('LIST');
  const [selectedDesigId, setSelectedDesigId] = useState<string | null>(null);
  
  // Search State
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch designations
  const { data: desigsResponse, isLoading } = useQuery({
    queryKey: ['designations'],
    queryFn: () => organizationService.getDesignations({ per_page: 'all' }),
    staleTime: 60000,
  });

  const designations = Array.isArray(desigsResponse) ? desigsResponse : desigsResponse?.data || [];

  const selectedDesig = useMemo(() => 
    designations.find((d: Designation) => String(d.id) === selectedDesigId) || null
  , [designations, selectedDesigId]);

  // Fetch employees for detail view
  const { data: employeesData, isLoading: isEmployeesLoading } = useQuery({
    queryKey: ['desig-employees', selectedDesigId],
    queryFn: () => organizationService.getDesignationEmployees(selectedDesigId!),
    enabled: !!selectedDesigId && view === 'DETAIL',
  });

  const employees = employeesData?.employees || [];

  // Filtered designations
  const filteredDesigs = useMemo(() => {
    return designations.filter((d: Designation) => {
      const matchesSearch = searchTerm === '' || 
                           d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           d.code.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [designations, searchTerm]);

  // Form state
  const [formDesig, setFormDesig] = useState<Partial<DesignationFormData & { id?: string }>>({});

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: DesignationFormData) => organizationService.createDesignation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designations'] });
      setView('LIST');
      setFormDesig({});
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DesignationFormData> }) => 
      organizationService.updateDesignation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designations'] });
      setView('LIST');
      setFormDesig({});
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => organizationService.deleteDesignation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designations'] });
    },
  });

  const handleEdit = (desig: Designation) => {
    setFormDesig({
      id: String(desig.id),
      name: desig.name,
      code: desig.code,
    });
    setView('FORM');
  };

  const handleCreate = () => {
    setFormDesig({});
    setView('FORM');
  };

  const handleSubmit = () => {
    const { id, ...data } = formDesig;
    if (id) {
      updateMutation.mutate({ id, data: data as DesignationFormData });
    } else {
      createMutation.mutate(data as DesignationFormData);
    }
  };

  const handleViewDetail = (id: string | number) => {
    setSelectedDesigId(String(id));
    setView('DETAIL');
  };

  const handleDelete = (id: string | number) => {
    if (confirm('Are you sure you want to delete this designation?')) {
      deleteMutation.mutate(String(id));
    }
  };

  if (view === 'FORM') {
    return (
      <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
        <div className="flex justify-between items-center px-4">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight uppercase italic">
              {formDesig.id ? 'Edit' : 'Create'} <span className="text-[#8252e9]">Designation</span>
            </h2>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1 italic">Job Title & Position Management</p>
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
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Designation Name</label>
              <input 
                type="text" 
                value={formDesig.name || ''} 
                onChange={e => setFormDesig({...formDesig, name: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-3.5 text-sm text-white focus:border-[#8252e9] outline-none transition-all" 
                placeholder="e.g. Senior Software Engineer" 
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Designation Code</label>
              <input 
                type="text" 
                value={formDesig.code || ''}
                onChange={e => setFormDesig({...formDesig, code: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-3.5 text-sm text-white font-mono uppercase focus:border-[#8252e9] outline-none" 
                placeholder="DES-SSE" 
                disabled={!!formDesig.id}
              />
            </div>

            <div className="p-6 bg-blue-500/5 border border-blue-500/20 rounded-3xl">
              <p className="text-xs text-blue-400 font-bold uppercase mb-2">💡 Tip</p>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Designations represent job titles and positions in your organization. They help categorize employees by their role and responsibilities.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-12 pt-8 border-t border-white/5">
            <button onClick={() => setView('LIST')} className="px-8 py-3.5 text-slate-500 hover:text-white font-black text-[11px] uppercase tracking-widest transition-all">Cancel</button>
            <button 
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-12 py-3.5 bg-emerald-500 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Designation'}
            </button>
          </div>
        </GlassCard>
      </div>
    );
  }

  if (view === 'DETAIL' && selectedDesig) {
    return (
      <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
        <div className="flex items-center gap-4">
          <button onClick={() => setView('LIST')} className="p-3 bg-white/5 rounded-2xl text-slate-500 hover:text-white transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth="3" /></svg>
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-black text-white uppercase italic tracking-tight">{selectedDesig.name}</h2>
              <span className="px-3 py-1 bg-[#8252e9]/10 border border-[#8252e9]/20 text-[#8252e9] text-[10px] font-black uppercase rounded-full">{selectedDesig.code}</span>
            </div>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1 italic">
              Job Title & Position
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="lg:col-span-1">
            <GlassCard title="Statistics" className="!p-5">
              <div className="text-center p-4">
                <p className="text-4xl font-black text-white">{employees.length}</p>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2">Employees</p>
              </div>
            </GlassCard>
          </aside>

          <main className="lg:col-span-3">
            <GlassCard className="!p-0 overflow-hidden">
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Employees with this Designation</h4>
              </div>
              {isEmployeesLoading ? (
                <div className="p-12 text-center animate-pulse text-slate-500 uppercase text-[10px] font-black italic">Loading...</div>
              ) : employees.length === 0 ? (
                <div className="p-12 text-center text-slate-500 uppercase text-[10px] font-black italic">No employees with this designation</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[9px] font-black text-slate-500 uppercase border-b border-white/5">
                        <th className="px-6 py-4">Employee</th>
                        <th className="px-6 py-4">Branch</th>
                        <th className="px-6 py-4">Department</th>
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
                          <td className="px-6 py-4 text-xs text-slate-400">{emp.branch?.name || 'N/A'}</td>
                          <td className="px-6 py-4 text-xs text-slate-400">{emp.department?.name || 'N/A'}</td>
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
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight uppercase italic">Designation <span className="text-[#8252e9]">Management</span></h2>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1 italic">Job Titles & Positions</p>
        </div>
        <button 
          onClick={handleCreate}
          className="px-6 py-3 bg-[#8252e9] text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-[#8252e9]/20 active:scale-95 transition-all"
        >
          + Create Designation
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className="lg:col-span-1">
          <GlassCard title="Search" className="!p-5">
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
                      <th className="px-6 py-5">Designation</th>
                      <th className="px-6 py-5">Code</th>
                      <th className="px-6 py-5">Employees</th>
                      <th className="px-6 py-5 text-right pr-8">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredDesigs.map((desig: Designation) => (
                      <tr key={desig.id} className="group hover:bg-white/[0.03] transition-all cursor-pointer" onClick={() => handleViewDetail(desig.id)}>
                        <td className="px-6 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#8252e9]/10 flex items-center justify-center text-lg">
                              💼
                            </div>
                            <p className="text-xs font-black text-white uppercase">{desig.name}</p>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <span className="text-[10px] font-mono text-slate-400 uppercase">{desig.code}</span>
                        </td>
                        <td className="px-6 py-6">
                          <span className="text-sm font-black text-white">0</span>
                        </td>
                        <td className="px-6 py-6 text-right pr-8">
                          <div className="flex justify-end gap-3" onClick={e => e.stopPropagation()}>
                            <button 
                              onClick={() => handleEdit(desig)}
                              className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeWidth="2.5" /></svg>
                            </button>
                            <button 
                              onClick={() => handleDelete(desig.id)}
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
              Showing {filteredDesigs.length} designations
            </div>
          </GlassCard>
        </main>
      </div>
    </div>
  );
};

export default Designations;
