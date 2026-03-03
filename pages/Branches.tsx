import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import GlassCard from '../components/GlassCard';
import { Branch } from '../types';
import { organizationService, BranchFormData } from '../services/organizationService';
import DepartmentsTab from '../components/branches/DepartmentsTab';

const TIMEZONES = [
  'UTC', 'America/Los_Angeles', 'America/New_York', 'Europe/London', 'Europe/Paris', 'Africa/Lagos', 'Asia/Dubai', 'Asia/Singapore'
];

const Branches: React.FC = () => {
  const queryClient = useQueryClient();
  const [view, setView] = useState<'LIST' | 'FORM' | 'DETAIL'>('LIST');
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [detailTab, setDetailTab] = useState<'Overview' | 'Employees' | 'Departments' | 'Devices' | 'Overrides' | 'Audit'>('Overview');

  // React Query: Main List
  const { data: branches = [], isLoading: isListLoading } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: () => organizationService.getBranches({ per_page: 'all' }),
    staleTime: 60000,
  });

  const selectedBranch = useMemo(() =>
    branches.find((b: Branch) => String(b.id) === selectedBranchId) || null
    , [branches, selectedBranchId]);

  // React Query: Sub-Resources (Detail View)
  const { data: employeesData, isLoading: isEmployeesLoading } = useQuery({
    queryKey: ['branch-employees', selectedBranchId],
    queryFn: () => organizationService.getBranchEmployees(selectedBranchId!),
    enabled: !!selectedBranchId && detailTab === 'Employees',
  });

  const employees = employeesData?.employees || [];

  // Filtered Data for List View
  const filteredBranches = useMemo(() => {
    return branches.filter((b: Branch) => {
      const matchesSearch = searchTerm === '' ||
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'All' || b.type === filterType;
      const matchesStatus = filterStatus === 'All' || b.status.toLowerCase() === filterStatus.toLowerCase();
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [branches, searchTerm, filterType, filterStatus]);

  // Form State
  const [formBranch, setFormBranch] = useState<Partial<BranchFormData & { id?: string }>>({});

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: BranchFormData) => organizationService.createBranch(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setView('LIST');
      setFormBranch({});
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BranchFormData> }) =>
      organizationService.updateBranch(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setView('LIST');
      setFormBranch({});
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => organizationService.deleteBranch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
  });

  const handleEdit = (branch: Branch) => {
    setFormBranch({
      id: String(branch.id),
      name: branch.name,
      code: branch.code,
      type: branch.type,
      is_hq: branch.is_hq,
      location: branch.location,
      address: branch.address,
      city: branch.city,
      country: branch.country,
      timezone: branch.timezone,
      status: branch.status.toLowerCase() as 'active' | 'inactive',
      manager_id: branch.manager_id,
      latitude: branch.latitude,
      longitude: branch.longitude,
    });
    setView('FORM');
  };

  const handleCreate = () => {
    setFormBranch({ type: 'Regional', status: 'active', is_hq: false, timezone: 'UTC' });
    setView('FORM');
  };

  const handleSubmit = () => {
    const { id, ...data } = formBranch;
    if (id) {
      updateMutation.mutate({ id, data: data as BranchFormData });
    } else {
      createMutation.mutate(data as BranchFormData);
    }
  };

  const handleViewDetail = (id: string | number) => {
    setSelectedBranchId(String(id));
    setDetailTab('Overview');
    setView('DETAIL');
  };

  const handleArchive = (id: string | number) => {
    if (confirm('Are you sure you want to delete this branch?')) {
      deleteMutation.mutate(String(id));
    }
  };

  if (view === 'FORM') {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
        <div className="flex justify-between items-center px-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">
              {formBranch.id ? 'Edit' : 'Add New'} <span className="text-[#8252e9]">Branch</span>
            </h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-500 font-black uppercase tracking-[0.2em] mt-1 italic">Branch Information Management</p>
          </div>
          <button
            onClick={() => setView('LIST')}
            className="px-4 py-2 bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all"
          >
            Cancel
          </button>
        </div>

        <GlassCard className="!p-8 border-t-4 border-t-[#8252e9]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Display Name</label>
                <input
                  type="text"
                  value={formBranch.name || ''}
                  onChange={e => setFormBranch({ ...formBranch, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-3.5 text-sm text-slate-900 dark:text-white focus:border-[#8252e9] outline-none transition-all"
                  placeholder="e.g. London Tech Center"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Branch Code</label>
                  <input
                    type="text"
                    value={formBranch.code || ''}
                    onChange={e => setFormBranch({ ...formBranch, code: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3.5 text-sm text-slate-900 dark:text-white font-mono uppercase focus:border-[#8252e9] outline-none"
                    placeholder="LON-01"
                    disabled={!!formBranch.id}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Timezone</label>
                  <select
                    value={formBranch.timezone || 'UTC'}
                    onChange={e => setFormBranch({ ...formBranch, timezone: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3.5 text-xs text-slate-900 dark:text-white focus:border-[#8252e9] outline-none appearance-none cursor-pointer"
                  >
                    {TIMEZONES.map(tz => <option key={tz} value={tz} className="bg-white dark:bg-[#0d0a1a]">{tz}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Primary Address</label>
                <textarea
                  value={formBranch.address || ''}
                  onChange={e => setFormBranch({ ...formBranch, address: e.target.value })}
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-3.5 text-sm text-slate-900 dark:text-white focus:border-[#8252e9] outline-none transition-all resize-none"
                  placeholder="Full street address..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">City</label>
                  <input
                    type="text"
                    value={formBranch.city || ''}
                    onChange={e => setFormBranch({ ...formBranch, city: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3.5 text-sm text-slate-900 dark:text-white focus:border-[#8252e9] outline-none"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Country</label>
                  <input
                    type="text"
                    value={formBranch.country || ''}
                    onChange={e => setFormBranch({ ...formBranch, country: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3.5 text-sm text-slate-900 dark:text-white focus:border-[#8252e9] outline-none"
                    placeholder="Country"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Latitude</label>
                    <input
                      type="number"
                      step="0.00000001"
                      value={formBranch.latitude || ''}
                      onChange={e => setFormBranch({ ...formBranch, latitude: parseFloat(e.target.value) })}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3.5 text-sm text-slate-900 dark:text-white focus:border-[#8252e9] outline-none"
                      placeholder="e.g. 6.5244"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Longitude</label>
                    <input
                      type="number"
                      step="0.00000001"
                      value={formBranch.longitude || ''}
                      onChange={e => setFormBranch({ ...formBranch, longitude: parseFloat(e.target.value) })}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3.5 text-sm text-slate-900 dark:text-white focus:border-[#8252e9] outline-none"
                      placeholder="e.g. 3.3792"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Branch Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {['HQ', 'Regional', 'Satellite', 'Virtual'].map(t => (
                    <button
                      key={t}
                      onClick={() => setFormBranch({ ...formBranch, type: t as any })}
                      className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${formBranch.type === t ? 'bg-[#8252e9] border-transparent text-white shadow-lg' : 'bg-white/5 border-white/5 text-slate-500'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-6 bg-amber-500/5 border border-amber-500/20 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-white uppercase italic">Designate as Headquarters</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase">Primary office location</p>
                  </div>
                  <button
                    onClick={() => setFormBranch({ ...formBranch, is_hq: !formBranch.is_hq })}
                    className={`w-12 h-6 rounded-full p-1 transition-all flex items-center ${formBranch.is_hq ? 'bg-amber-500 justify-end' : 'bg-slate-700 justify-start'}`}
                  >
                    <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                  </button>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Status</label>
                <div className="grid grid-cols-2 gap-3">
                  {['active', 'inactive'].map(s => (
                    <button
                      key={s}
                      onClick={() => setFormBranch({ ...formBranch, status: s as any })}
                      className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${formBranch.status === s ? 'bg-emerald-500 border-transparent text-white shadow-lg' : 'bg-white/5 border-white/5 text-slate-500'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-12 pt-8 border-t border-slate-200 dark:border-white/5">
            <button onClick={() => setView('LIST')} className="px-8 py-3.5 text-slate-500 hover:text-white font-black text-[11px] uppercase tracking-widest transition-all">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-12 py-3.5 bg-emerald-500 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Branch'}
            </button>
          </div>
        </GlassCard>
      </div>
    );
  }

  if (view === 'DETAIL' && selectedBranch) {
    return (
      <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
        <div className="flex items-center gap-4">
          <button onClick={() => setView('LIST')} className="p-3 bg-white/5 rounded-2xl text-slate-500 hover:text-white transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth="3" /></svg>
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-black text-white uppercase italic tracking-tight">{selectedBranch.name}</h2>
              <span className="px-3 py-1 bg-[#8252e9]/10 border border-[#8252e9]/20 text-[#8252e9] text-[10px] font-black uppercase rounded-full">{selectedBranch.code}</span>
            </div>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1 italic">
              {selectedBranch.city}, {selectedBranch.country} • {selectedBranch.manager_name || 'No Manager'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="lg:col-span-1 space-y-6">
            <GlassCard title="Branch Information" className="!p-5 border-l-4 border-l-[#8252e9]">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-2xl shadow-inner">🏢</div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Branch Type</p>
                    <p className="text-sm font-bold text-white tracking-tight">{selectedBranch.type}</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-white/5 space-y-3">
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Physical Address</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{selectedBranch.address || selectedBranch.location}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Timezone</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{selectedBranch.timezone}</p>
                  </div>
                  {(selectedBranch.latitude || selectedBranch.longitude) && (
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Coordinates</p>
                      <p className="text-xs font-mono text-slate-600 dark:text-slate-400 mt-1">
                        {selectedBranch.latitude ?? 'N/A'}, {selectedBranch.longitude ?? 'N/A'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>

            <GlassCard title="Employees" className="!p-5">
              <div className="text-center p-4">
                <p className="text-4xl font-black text-slate-900 dark:text-white">{selectedBranch.employee_count}</p>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2">Employees</p>
              </div>
            </GlassCard>
          </aside>

          <main className="lg:col-span-3 space-y-6">
            <div className="flex gap-2 border-b border-white/5 overflow-x-auto no-scrollbar">
              {['Overview', 'Employees', 'Departments'].map((t: any) => (
                <button
                  key={t}
                  onClick={() => setDetailTab(t)}
                  className={`pb-4 px-6 text-[10px] font-black uppercase tracking-widest relative transition-all whitespace-nowrap ${detailTab === t ? 'text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  {t}
                  {detailTab === t && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#8252e9] shadow-[0_0_12px_#8252e9]" />}
                </button>
              ))}
            </div>

            <div className="animate-in fade-in duration-500">
              {detailTab === 'Overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <GlassCard title="Branch Information">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                        <span className="text-xs text-slate-600 dark:text-slate-400 uppercase">Type</span>
                        <span className="text-sm font-black text-slate-900 dark:text-white">{selectedBranch.type}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                        <span className="text-xs text-slate-600 dark:text-slate-400 uppercase">Status</span>
                        <span className={`text-sm font-black ${selectedBranch.status === 'active' ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {selectedBranch.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                        <span className="text-xs text-slate-600 dark:text-slate-400 uppercase">Employees</span>
                        <span className="text-sm font-black text-slate-900 dark:text-white">{selectedBranch.employee_count}</span>
                      </div>
                    </div>
                  </GlassCard>
                </div>
              )}

              {detailTab === 'Employees' && (
                <GlassCard className="!p-0 overflow-hidden">
                  <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-white/[0.01]">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Branch Employees</h4>
                  </div>
                  {isEmployeesLoading ? (
                    <div className="p-12 text-center animate-pulse text-slate-500 uppercase text-[10px] font-black italic">Loading employees...</div>
                  ) : employees.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 uppercase text-[10px] font-black italic">No employees assigned</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-[9px] font-black text-slate-500 uppercase border-b border-slate-100 dark:border-white/5">
                            <th className="px-6 py-4">Employee</th>
                            <th className="px-6 py-4">Position</th>
                            <th className="px-6 py-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                          {employees.map((emp: any) => (
                            <tr key={emp.id} className="hover:bg-slate-50 dark:bg-white/[0.02] transition-colors group">
                              <td className="px-6 py-4">
                                <p className="text-xs font-bold text-slate-900 dark:text-white">{emp.full_name || `${emp.first_name} ${emp.last_name}`}</p>
                                <p className="text-[9px] text-slate-500 font-mono italic mt-0.5">{emp.email}</p>
                              </td>
                              <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400 font-medium">{emp.designation?.name || 'N/A'}</td>
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
              )}

              {detailTab === 'Departments' && (
                <DepartmentsTab branchId={selectedBranchId!} />
              )}
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight uppercase italic">Branch <span className="text-[#8252e9]">Management</span></h2>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1 italic">Manage Office Locations & Branch Network</p>
        </div>
        <button
          onClick={handleCreate}
          className="px-6 py-3 bg-[#8252e9] text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-[#8252e9]/20 active:scale-95 transition-all"
        >
          + Add Branch
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className="lg:col-span-1 space-y-6">
          <GlassCard title="Search & Filter" className="!p-5">
            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Search</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Name or code..."
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:border-[#8252e9] outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {['All', 'HQ', 'Regional', 'Satellite'].map(t => (
                    <button
                      key={t}
                      onClick={() => setFilterType(t)}
                      className={`py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${filterType === t ? 'bg-white/10 border-[#8252e9] text-slate-900 dark:text-white' : 'bg-white/5 border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {['All', 'Active', 'Inactive'].map(s => (
                    <button
                      key={s}
                      onClick={() => setFilterStatus(s)}
                      className={`py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${filterStatus === s ? 'bg-white/10 border-[#8252e9] text-slate-900 dark:text-white' : 'bg-white/5 border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>
        </aside>

        <main className="lg:col-span-3">
          <GlassCard className="!p-0 overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] border-slate-100 dark:border-white/5">
            <div className="overflow-x-auto no-scrollbar">
              {isListLoading ? (
                <div className="p-6 space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center gap-4 p-4">
                      <div className="w-11 h-11 bg-white/10 rounded-2xl"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-white/10 rounded w-1/4"></div>
                        <div className="h-3 bg-white/10 rounded w-1/6"></div>
                      </div>
                      <div className="h-6 bg-white/10 rounded w-20"></div>
                      <div className="h-6 bg-white/10 rounded w-16"></div>
                      <div className="flex gap-2">
                        <div className="w-10 h-10 bg-white/10 rounded-xl"></div>
                        <div className="w-10 h-10 bg-white/10 rounded-xl"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredBranches.length === 0 ? (
                <div className="p-20 text-center">
                  <div className="text-6xl mb-4">🏢</div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-2">No branches found</p>
                  <p className="text-slate-500 text-xs mb-6">Get started by adding your first branch location</p>
                  <button
                    onClick={handleCreate}
                    className="px-6 py-3 bg-[#8252e9] text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-[#8252e9]/20 active:scale-95 transition-all"
                  >
                    + Add First Branch
                  </button>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-500 text-[9px] uppercase font-black tracking-[0.25em] border-b border-white/5 bg-slate-50/50 dark:bg-white/[0.01]">
                      <th className="px-6 py-5">Branch Details</th>
                      <th className="px-6 py-5">Type</th>
                      <th className="px-6 py-5">Employees</th>
                      <th className="px-6 py-5">Status</th>
                      <th className="px-6 py-5 text-right pr-8">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {filteredBranches.map((branch: Branch) => (
                      <tr key={branch.id} className="group hover:bg-slate-100 dark:bg-white/[0.03] transition-all cursor-pointer" onClick={() => handleViewDetail(branch.id)}>
                        <td className="px-6 py-6">
                          <div className="flex items-center gap-4">
                            <div className={`w-11 h-11 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-xl transition-all group-hover:border-[#8252e9]/50 ${branch.is_hq ? 'shadow-[0_0_15px_rgba(130,82,233,0.3)]' : ''}`}>
                              {branch.type === 'HQ' ? '🏢' : '🏗️'}
                            </div>
                            <div>
                              <p className="text-xs font-black text-white uppercase tracking-tight flex items-center gap-2">
                                {branch.name}
                                {branch.is_hq && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]" />}
                              </p>
                              <p className="text-[9px] font-mono text-slate-500 mt-1 uppercase tracking-tighter">{branch.code} • {branch.city || branch.location}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest border border-white/5 bg-white/5 px-2 py-0.5 rounded">{branch.type}</span>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-slate-900 dark:text-white">{branch.employee_count}</span>
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Employees</span>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${branch.status.toLowerCase() === 'active' ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]' : 'bg-slate-500'}`} />
                            <span className={`text-[9px] font-black uppercase tracking-widest ${branch.status.toLowerCase() === 'active' ? 'text-emerald-400' : 'text-slate-500'}`}>{branch.status}</span>
                          </div>
                        </td>
                        <td className="px-6 py-6 text-right pr-8">
                          <div className="flex justify-end gap-3" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => handleEdit(branch)}
                              className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all shadow-sm"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeWidth="2.5" /></svg>
                            </button>
                            <button
                              onClick={() => handleArchive(branch.id)}
                              className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2.5" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="p-5 border-t border-white/5 bg-slate-50/50 dark:bg-white/[0.01] flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest italic">
              <div className="flex gap-4 items-center">
                <span>Showing {filteredBranches.length} branches</span>
              </div>
            </div>
          </GlassCard>
        </main>
      </div>
    </div>
  );
};

export default Branches;
