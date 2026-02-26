
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import GlassCard from '../components/GlassCard';
import { payrollApi } from '../services/payrollService';
import { 
  PayrollPeriod, 
  PayrollRun, 
  PayrollLine, 
  PayrollRunStatus,
  ApprovalStatus
} from '../types';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const Payroll: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Periods' | 'Wizard' | 'Approvals' | 'Settings'>('Dashboard');
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedLine, setSelectedLine] = useState<PayrollLine | null>(null);

  const { data: periods = [] } = useQuery({ queryKey: ['payroll-periods'], queryFn: payrollApi.getPeriods });
  const { data: runs = [] } = useQuery({ queryKey: ['payroll-runs'], queryFn: () => payrollApi.getRuns('p-1'), enabled: activeTab === 'Dashboard' || activeTab === 'Approvals' });
  const { data: lines = [] } = useQuery({ queryKey: ['payroll-lines', selectedRunId], queryFn: () => payrollApi.getLines(selectedRunId!), enabled: !!selectedRunId && wizardStep === 3 });

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 dark:border-white/5 pb-6">
        <div><h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">Global <span className="text-[#8252e9]">Payroll</span></h2><p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1 italic">Enterprise Financial Governance</p></div>
        <div className="flex bg-slate-50 dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-white/10">
          {(['Dashboard', 'Periods', 'Approvals', 'Settings'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-[#8252e9] text-white shadow-xl' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}>{tab}</button>
          ))}
        </div>
      </div>

      <div className="animate-in slide-in-from-bottom-2 duration-500">
        {activeTab === 'Dashboard' && (
           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { l: 'Pending Approvals', v: '2', c: 'text-amber-500' },
                { l: 'Last Run Total', v: '$450.2K', c: 'text-slate-900 dark:text-white' },
                { l: 'Variance', v: '+2.4%', c: 'text-rose-500' },
                { l: 'Audit Ready', v: '100%', c: 'text-emerald-500' },
              ].map((s, i) => (
                <GlassCard key={i} className="!p-5 border-l-4 border-l-[#8252e9]">
                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{s.l}</p>
                   <p className={`text-2xl font-black ${s.c}`}>{s.v}</p>
                </GlassCard>
              ))}
           </div>
        )}
        {/* Other dashboard views simplified for brevity */}
      </div>

      {/* CENTERED PAYROLL LINE MODAL */}
      {selectedLine && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300 p-6">
           <div className="absolute inset-0" onClick={() => setSelectedLine(null)} />
           <div className="w-full max-w-xl bg-white dark:bg-[#0d0a1a] shadow-2xl border border-slate-200 dark:border-white/10 animate-in zoom-in-95 duration-500 flex flex-col rounded-[40px] relative overflow-hidden max-h-[90vh]">
              <div className="p-10 border-b border-slate-100 dark:border-white/5 flex justify-between items-start bg-gradient-to-br from-[#8252e9]/5 to-transparent dark:from-[#8252e9]/10">
                 <div className="flex gap-6 items-center">
                    <img src={selectedLine.avatar} className="w-20 h-20 rounded-[32px] border-4 border-white dark:border-white/10 shadow-2xl" />
                    <div>
                       <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">{selectedLine.employeeName}</h3>
                       <p className="text-[10px] text-[#8252e9] font-black uppercase tracking-widest mt-1">Identity Node: {selectedLine.employeeId}</p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedLine(null)} className="p-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/10 transition-all text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-sm">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="3"/></svg>
                 </button>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar p-10 space-y-10">
                 <section>
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-6 border-l-2 border-[#8252e9] pl-3">Compensation Structure</h4>
                    <div className="grid grid-cols-2 gap-px bg-slate-200 dark:bg-white/10 rounded-[32px] overflow-hidden border border-slate-200 dark:border-white/10">
                       <div className="bg-white dark:bg-[#0d0a1a] p-6">
                          <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Gross Pay</p>
                          <p className="text-xl font-black text-slate-900 dark:text-white">{formatCurrency(selectedLine.grossPay)}</p>
                       </div>
                       <div className="bg-white dark:bg-[#0d0a1a] p-6">
                          <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Net Payable</p>
                          <p className="text-xl font-black text-emerald-500">{formatCurrency(selectedLine.netPay)}</p>
                       </div>
                    </div>
                 </section>
                 <section className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-6 border-l-2 border-[#8252e9] pl-3">Calculated Impacts</h4>
                    {[{l:'Base Salary', v:selectedLine.baseSalary, c:'text-slate-900 dark:text-white'}, {l:'Impacts', v:-selectedLine.latePenalty, c:'text-rose-500'}].map((item, i) => (
                      <div key={i} className="flex justify-between items-center p-4 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition-colors border border-transparent hover:border-slate-200 dark:hover:border-white/10">
                         <span className="text-xs font-bold text-slate-500">{item.l}</span>
                         <span className={`text-sm font-black ${item.c}`}>{formatCurrency(item.v)}</span>
                      </div>
                    ))}
                 </section>
              </div>
              <div className="p-10 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 flex gap-4">
                 <button className="flex-1 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm">Audit Records</button>
                 <button className="flex-1 py-4 bg-[#8252e9] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-purple-500/20 transition-all">Download Payslip</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Payroll;
