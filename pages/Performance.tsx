
import React, { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import FormBuilder from '../components/FormBuilder';
import EvaluationForm from '../components/EvaluationForm';
import { FormTemplate, NotificationType } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { summarizePerformance } from '../services/geminiService';

const teamPerformanceData = [
  { name: 'Eng', kpi: 88, behavioral: 92, attendance: 95, avg: 91 },
  { name: 'Sales', kpi: 72, behavioral: 85, attendance: 88, avg: 81 },
  { name: 'Mark', kpi: 78, behavioral: 80, attendance: 90, avg: 82 },
  { name: 'HR', kpi: 95, behavioral: 98, attendance: 99, avg: 97 },
  { name: 'Ops', kpi: 65, behavioral: 70, attendance: 82, avg: 72 },
];

interface PerformanceProps {
  onNotify?: (title: string, message: string, type: NotificationType) => void;
}

const Performance: React.FC<PerformanceProps> = ({ onNotify }) => {
  const [activeTab, setActiveTab] = useState('Performance Dashboard');
  const [view, setView] = useState<'DASHBOARD' | 'BUILDER' | 'EVALUATION'>('DASHBOARD');
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);
  const [activeEmployee, setActiveEmployee] = useState<string | null>(null);
  
  const [templates, setTemplates] = useState<FormTemplate[]>([
    {
      id: 'default-1',
      title: 'Standard Q1 Appraisal',
      description: 'The standard quarterly performance review for all employees.',
      createdAt: '2024-01-01',
      fields: [
        { id: '1', type: 'RATING', label: 'Technical Execution', required: true, weight: 40 },
        { id: '2', type: 'PARAGRAPH', label: 'Key Achievements', required: true, weight: 30 },
        { id: '3', type: 'MULTIPLE_CHOICE', label: 'Collaboration Level', options: ['Low', 'Normal', 'Exemplary'], required: true, weight: 30 }
      ]
    }
  ]);

  const [aiSummary, setAiSummary] = useState<string>('Analyzing organizational trends...');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    handleGenerateAISummary();
  }, []);

  const handleGenerateAISummary = async () => {
    setIsGenerating(true);
    try {
      const summary = await summarizePerformance(teamPerformanceData);
      setAiSummary(summary || 'No summary available.');
    } catch (error) {
      setAiSummary('Failed to generate AI insight.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLaunchCycle = () => {
    if (onNotify) {
      onNotify(
        'Cycle Event: Q2 Appraisal Launched',
        'System has initialized the Q2 appraisal period for 400 nodes. Managers notified via secure channel.',
        'CYCLE_EVENT'
      );
    }
  };

  const handleEvaluationSubmit = (employeeName: string) => {
    if (onNotify) {
      onNotify(
        'Evaluation Completed',
        `The appraisal for ${employeeName} has been submitted and encrypted in the document vault.`,
        'EVALUATION_COMPLETE'
      );
    }
    setView('DASHBOARD');
  };

  const tabs = ['Performance Dashboard', 'Review Cycles', 'Goals & OKRs', 'Evaluations', 'Appraisals', 'Reporting', 'Settings'];

  if (view === 'BUILDER') {
    return (
      <FormBuilder 
        initialTemplate={selectedTemplate || undefined}
        onBack={() => setView('DASHBOARD')}
        onSave={(t) => {
          setTemplates(prev => [...prev, t]);
          setView('DASHBOARD');
        }}
      />
    );
  }

  if (view === 'EVALUATION' && activeEmployee) {
    return (
      <EvaluationForm 
        template={selectedTemplate || templates[0]}
        employeeName={activeEmployee}
        onClose={() => setView('DASHBOARD')}
        onSubmit={() => handleEvaluationSubmit(activeEmployee)}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight uppercase italic">Performance Intelligence</h2>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1">Holistic Talent Assessment & Strategic Alignment</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => { setSelectedTemplate(null); setView('BUILDER'); }}
            className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all"
          >
            + Create Template
          </button>
          <button 
            onClick={handleLaunchCycle}
            className="px-5 py-2.5 bg-[#8252e9] hover:bg-[#6d39e0] text-white font-black text-[11px] uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-purple-500/20 active:scale-95"
          >
            Launch New Cycle
          </button>
        </div>
      </div>

      <div className="flex gap-8 border-b border-white/5 pb-0 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 text-[10px] font-black uppercase tracking-widest relative transition-all whitespace-nowrap ${activeTab === tab ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {tab}
            {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#8252e9] shadow-[0_0_8px_#8252e9]" />}
          </button>
        ))}
      </div>

      <div className="animate-in slide-in-from-bottom-2 duration-500">
        {activeTab === 'Performance Dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'Org Health Score', val: '86.5', delta: '+2.1%', color: 'text-emerald-400', icon: '💎' },
                { label: 'Completion Rate', val: '94%', delta: 'Goal: 100%', color: 'text-blue-400', icon: '🎯' },
                { label: 'Top Performers', val: '42', delta: '11% of workforce', color: 'text-[#8252e9]', icon: '⭐' },
                { label: 'Risk of Turnover', val: 'LOW', delta: 'AI Prediction', color: 'text-emerald-500', icon: '🛡️' },
              ].map((s, idx) => (
                <GlassCard key={idx} className="!p-4 border-l-4 border-white/5 hover:border-white/20 transition-all">
                  <div className="flex justify-between items-start">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{s.label}</p>
                    <span className="text-xl opacity-60">{s.icon}</span>
                  </div>
                  <p className={`text-2xl font-black mt-1 ${s.color}`}>{s.val}</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">{s.delta}</p>
                </GlassCard>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8">
                 <GlassCard title="Organization Competency Levels">
                    <div className="h-72 mt-4">
                       <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={teamPerformanceData}>
                             <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                             <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} />
                             <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} />
                             <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }} />
                             <Bar dataKey="kpi" fill="#4c49d8" radius={[4, 4, 0, 0]} />
                             <Bar dataKey="behavioral" fill="#8252e9" radius={[4, 4, 0, 0]} />
                          </BarChart>
                       </ResponsiveContainer>
                    </div>
                 </GlassCard>
              </div>
              <div className="lg:col-span-4">
                 <GlassCard title="AI Strategic Insights" className="!bg-[#8252e9]/5 border-[#8252e9]/20">
                    <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
                       <p className={`text-xs text-slate-300 leading-relaxed italic ${isGenerating ? 'animate-pulse' : ''}`}>
                         {aiSummary}
                       </p>
                    </div>
                 </GlassCard>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Evaluations' && (
          <GlassCard className="!p-0 overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 bg-white/[0.01]">
                      <tr>
                         <th className="px-6 py-5">Employee Identity</th>
                         <th className="px-6 py-5">Department</th>
                         <th className="px-6 py-5">Status</th>
                         <th className="px-6 py-5 text-right">Action</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                      {[
                        { name: 'Ethan Parker', dept: 'Engineering', status: 'Pending', avatar: 'https://picsum.photos/40?sig=p1' },
                        { name: 'Sarah Connor', dept: 'HR', status: 'Pending', avatar: 'https://picsum.photos/40?sig=p2' },
                        { name: 'Kyle Reese', dept: 'Security', status: 'Completed', avatar: 'https://picsum.photos/40?sig=p3' },
                      ].map((emp, i) => (
                        <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                           <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                 <img src={emp.avatar} className="w-9 h-9 rounded-lg border border-white/10" alt="" />
                                 <div>
                                    <p className="text-xs font-bold text-white tracking-tight">{emp.name}</p>
                                    <p className="text-[9px] text-slate-500 font-bold uppercase">EMP-00{i+1}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-5 text-xs text-slate-400">{emp.dept}</td>
                           <td className="px-6 py-5">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${emp.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                 {emp.status}
                              </span>
                           </td>
                           <td className="px-6 py-5 text-right">
                              <button 
                                onClick={() => { setActiveEmployee(emp.name); setView('EVALUATION'); }}
                                className="text-[10px] font-black text-white uppercase tracking-widest bg-white/5 hover:bg-white/10 px-4 py-1.5 rounded-lg transition-all"
                              >
                                {emp.status === 'Completed' ? 'View Results' : 'Fill Evaluation'}
                              </button>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
};

export default Performance;
