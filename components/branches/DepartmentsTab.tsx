import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import GlassCard from '../GlassCard';
import { Department } from '../../types';
import { organizationService, DepartmentFormData } from '../../services/organizationService';

interface DepartmentsTabProps {
  branchId: string;
}

const DepartmentsTab: React.FC<DepartmentsTabProps> = ({ branchId }) => {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formDept, setFormDept] = useState<Partial<DepartmentFormData & { id?: string }>>({});

  // Fetch all departments and filter by branch
  const { data: deptsResponse, isLoading } = useQuery({
    queryKey: ['departments', branchId],
    queryFn: () => organizationService.getDepartments({ per_page: 'all' }),
    staleTime: 60000,
  });

  const allDepartments = Array.isArray(deptsResponse) ? deptsResponse : deptsResponse?.data || [];
  const departments = allDepartments.filter((d: Department) => String(d.branch_id) === branchId);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: DepartmentFormData) => organizationService.createDepartment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setIsFormOpen(false);
      setFormDept({});
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DepartmentFormData> }) => 
      organizationService.updateDepartment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setIsFormOpen(false);
      setFormDept({});
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => organizationService.deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });

  const handleCreate = () => {
    setFormDept({ branch_id: Number(branchId) });
    setIsFormOpen(true);
  };

  const handleEdit = (dept: Department) => {
    setFormDept({
      id: String(dept.id),
      name: dept.name,
      code: dept.code,
      branch_id: dept.branch_id || Number(branchId),
    });
    setIsFormOpen(true);
  };

  const handleSubmit = () => {
    const { id, ...data } = formDept;
    if (id) {
      updateMutation.mutate({ id, data: data as DepartmentFormData });
    } else {
      createMutation.mutate(data as DepartmentFormData);
    }
  };

  const handleDelete = (id: string | number) => {
    if (confirm('Are you sure you want to delete this department?')) {
      deleteMutation.mutate(String(id));
    }
  };

  if (isFormOpen) {
    return (
      <GlassCard className="!p-8 border-t-4 border-t-[#8252e9]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-white uppercase italic">
            {formDept.id ? 'Edit' : 'Create'} Department
          </h3>
          <button 
            onClick={() => {
              setIsFormOpen(false);
              setFormDept({});
            }}
            className="px-4 py-2 bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all"
          >
            Cancel
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Department Name</label>
            <input 
              type="text" 
              value={formDept.name || ''} 
              onChange={e => setFormDept({...formDept, name: e.target.value})}
              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-3.5 text-sm text-slate-900 dark:text-white focus:border-[#8252e9] outline-none transition-all" 
              placeholder="e.g. Engineering" 
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Department Code</label>
            <input 
              type="text" 
              value={formDept.code || ''}
              onChange={e => setFormDept({...formDept, code: e.target.value})}
              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-3.5 text-sm text-slate-900 dark:text-white font-mono uppercase focus:border-[#8252e9] outline-none" 
              placeholder="DEPT-ENG" 
              disabled={!!formDept.id}
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-slate-200 dark:border-white/5">
          <button 
            onClick={() => {
              setIsFormOpen(false);
              setFormDept({});
            }} 
            className="px-8 py-3.5 text-slate-500 hover:text-white font-black text-[11px] uppercase tracking-widest transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={createMutation.isPending || updateMutation.isPending}
            className="px-12 py-3.5 bg-emerald-500 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Department'}
          </button>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="!p-0 overflow-hidden">
      <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-white/[0.01]">
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Branch Departments</h4>
        <button 
          onClick={handleCreate}
          className="px-4 py-2 bg-[#8252e9] text-white font-black text-[9px] uppercase tracking-widest rounded-xl shadow-lg shadow-[#8252e9]/20 active:scale-95 transition-all"
        >
          + Add Department
        </button>
      </div>

      {isLoading ? (
        <div className="p-12 text-center animate-pulse text-slate-500 uppercase text-[10px] font-black italic">Loading departments...</div>
      ) : departments.length === 0 ? (
        <div className="p-12 text-center">
          <div className="text-5xl mb-4">📁</div>
          <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-2">No departments yet</p>
          <p className="text-slate-500 text-xs mb-6">Create departments to organize employees in this branch</p>
          <button 
            onClick={handleCreate}
            className="px-6 py-3 bg-[#8252e9] text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-[#8252e9]/20 active:scale-95 transition-all"
          >
            + Create First Department
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[9px] font-black text-slate-500 uppercase border-b border-slate-100 dark:border-white/5">
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Employees</th>
                <th className="px-6 py-4 text-right pr-8">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {departments.map((dept: Department) => (
                <tr key={dept.id} className="hover:bg-slate-50 dark:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <p className="text-xs font-black text-white uppercase">{dept.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[9px] font-mono text-slate-600 dark:text-slate-400 uppercase">{dept.code}</p>
                  </td>
                  <td className="px-6 py-4 text-sm font-black text-slate-900 dark:text-white">0</td>
                  <td className="px-6 py-4 text-right pr-8">
                    <div className="flex justify-end gap-3">
                      <button 
                        onClick={() => handleEdit(dept)}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeWidth="2.5" /></svg>
                      </button>
                      <button 
                        onClick={() => handleDelete(dept.id)}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"
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

      <div className="p-5 border-t border-white/5 bg-slate-50/50 dark:bg-white/[0.01] text-[10px] font-black text-slate-500 uppercase tracking-widest italic">
        {departments.length} {departments.length === 1 ? 'department' : 'departments'}
      </div>
    </GlassCard>
  );
};

export default DepartmentsTab;
