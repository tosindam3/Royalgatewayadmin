
import React, { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import FormBuilder from '../components/FormBuilder';
import EvaluationForm from '../components/EvaluationForm';
import ReviewCyclesTab from '../components/performance/ReviewCyclesTab';
import GoalsTab from '../components/performance/GoalsTab';
import AppraisalsTab from '../components/performance/AppraisalsTab';
import ReportingTab from '../components/performance/ReportingTab';
import SettingsTab from '../components/performance/SettingsTab';
import Skeleton from '../components/Skeleton';
import { FormTemplate, NotificationType } from '../types';
import {
  PerformanceDashboardKPIs,
  TeamPerformanceData,
  PendingEvaluation,
  EvaluationTemplate
} from '../types/performance';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { summarizePerformance } from '../services/geminiService';
import performanceService from '../services/performanceService';

interface PerformanceProps {
  onNotify?: (title: string, message: string, type: NotificationType) => void;
}

const Performance: React.FC<PerformanceProps> = ({ onNotify }) => {
  const [activeTab, setActiveTab] = useState('Performance Dashboard');
  const [view, setView] = useState<'DASHBOARD' | 'BUILDER' | 'EVALUATION'>('DASHBOARD');
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);
  const [activeEmployee, setActiveEmployee] = useState<string | null>(null);

  // API State
  const [dashboardKPIs, setDashboardKPIs] = useState<PerformanceDashboardKPIs | null>(null);
  const [teamPerformanceData, setTeamPerformanceData] = useState<TeamPerformanceData[]>([]);
  const [pendingEvaluations, setPendingEvaluations] = useState<PendingEvaluation[]>([]);
  const [templates, setTemplates] = useState<EvaluationTemplate[]>([]);

  // Loading States
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [isLoadingTeamData, setIsLoadingTeamData] = useState(true);
  const [isLoadingEvaluations, setIsLoadingEvaluations] = useState(true);

  // Error States
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [teamDataError, setTeamDataError] = useState<string | null>(null);

  const [aiSummary, setAiSummary] = useState<string>('Analyzing organizational trends...');
  const [isGenerating, setIsGenerating] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadDashboardData();
    loadTeamPerformanceData();
    loadPendingEvaluations();
    loadTemplates();
  }, []);

  // Load dashboard KPIs
  const loadDashboardData = async () => {
    try {
      setIsLoadingDashboard(true);
      setDashboardError(null);
      const kpis = await performanceService.fetchDashboardKPIs();
      setDashboardKPIs(kpis);
    } catch (error) {
      console.error('Failed to load dashboard KPIs:', error);
      setDashboardError(error instanceof Error ? error.message : 'Failed to load dashboard data');
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  // Load team performance data
  const loadTeamPerformanceData = async () => {
    try {
      setIsLoadingTeamData(true);
      setTeamDataError(null);
      const data = await performanceService.fetchTeamPerformance();
      setTeamPerformanceData(data);

      // Generate AI summary with real data
      if (data.length > 0) {
        handleGenerateAISummary(data);
      }
    } catch (error) {
      console.error('Failed to load team performance data:', error);
      setTeamDataError(error instanceof Error ? error.message : 'Failed to load team data');
      // Fallback to mock data for demo
      const mockData = [
        { name: 'Eng', kpi: 88, behavioral: 92, attendance: 95, avg: 91 },
        { name: 'Sales', kpi: 72, behavioral: 85, attendance: 88, avg: 81 },
        { name: 'Mark', kpi: 78, behavioral: 80, attendance: 90, avg: 82 },
        { name: 'HR', kpi: 95, behavioral: 98, attendance: 99, avg: 97 },
        { name: 'Ops', kpi: 65, behavioral: 70, attendance: 82, avg: 72 },
      ];
      setTeamPerformanceData(mockData);
      handleGenerateAISummary(mockData);
    } finally {
      setIsLoadingTeamData(false);
    }
  };

  // Load pending evaluations
  const loadPendingEvaluations = async () => {
    try {
      setIsLoadingEvaluations(true);
      const evaluations = await performanceService.fetchPendingEvaluations();
      setPendingEvaluations(evaluations);
    } catch (error) {
      console.error('Failed to load pending evaluations:', error);
      // Keep loading state for now, will show empty state
    } finally {
      setIsLoadingEvaluations(false);
    }
  };

  // Load templates
  const loadTemplates = async () => {
    try {
      const templateData = await performanceService.fetchTemplates();
      setTemplates(templateData);
    } catch (error) {
      console.error('Failed to load templates:', error);
      // Keep empty array, will show create template option
    }
  };

  const handleGenerateAISummary = async (data?: TeamPerformanceData[]) => {
    setIsGenerating(true);
    try {
      const dataToAnalyze = data || teamPerformanceData;
      const summary = await summarizePerformance(dataToAnalyze);
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
        <div className="animate-in slide-in-from-bottom-2 duration-500">
          <div className={activeTab === 'Performance Dashboard' ? 'block' : 'hidden'}>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {isLoadingDashboard ? (
                  // Loading skeleton
                  Array.from({ length: 4 }).map((_, idx) => (
                    <GlassCard key={idx} className="!p-4 border-l-4 border-white/5">
                      <div className="space-y-3">
                        <Skeleton variant="text" width="60%" height={10} />
                        <Skeleton variant="text" width="40%" height={24} />
                        <Skeleton variant="text" width="80%" height={8} />
                      </div>
                    </GlassCard>
                  ))
                ) : dashboardError ? (
                  // Error state
                  <div className="col-span-4">
                    <GlassCard className="!p-4 border-l-4 border-red-500/20">
                      <p className="text-red-400 text-sm">Failed to load dashboard data: {dashboardError}</p>
                      <button
                        onClick={loadDashboardData}
                        className="mt-2 px-3 py-1 bg-red-500/10 text-red-400 text-xs rounded hover:bg-red-500/20 transition-all"
                      >
                        Retry
                      </button>
                    </GlassCard>
                  </div>
                ) : dashboardKPIs ? (
                  // Real data
                  [
                    {
                      label: 'Org Health Score',
                      val: dashboardKPIs.org_health_score.toString(),
                      delta: `${dashboardKPIs.top_performers_percentage}% top performers`,
                      color: dashboardKPIs.org_health_score >= 80 ? 'text-emerald-400' : dashboardKPIs.org_health_score >= 60 ? 'text-yellow-400' : 'text-red-400',
                      icon: '💎'
                    },
                    {
                      label: 'Completion Rate',
                      val: `${dashboardKPIs.completion_rate}%`,
                      delta: 'Goal: 100%',
                      color: dashboardKPIs.completion_rate >= 90 ? 'text-emerald-400' : dashboardKPIs.completion_rate >= 70 ? 'text-yellow-400' : 'text-red-400',
                      icon: '🎯'
                    },
                    {
                      label: 'Top Performers',
                      val: dashboardKPIs.top_performers.toString(),
                      delta: `${dashboardKPIs.top_performers_percentage}% of workforce`,
                      color: 'text-[#8252e9]',
                      icon: '⭐'
                    },
                    {
                      label: 'Turnover Risk',
                      val: dashboardKPIs.turnover_risk,
                      delta: 'AI Prediction',
                      color: dashboardKPIs.turnover_risk === 'LOW' ? 'text-emerald-500' : dashboardKPIs.turnover_risk === 'MEDIUM' ? 'text-yellow-500' : 'text-red-500',
                      icon: '🛡️'
                    },
                  ].map((s, idx) => (
                    <GlassCard key={idx} className="!p-4 border-l-4 border-white/5 hover:border-white/20 transition-all">
                      <div className="flex justify-between items-start">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{s.label}</p>
                        <span className="text-xl opacity-60">{s.icon}</span>
                      </div>
                      <p className={`text-2xl font-black mt-1 ${s.color}`}>{s.val}</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">{s.delta}</p>
                    </GlassCard>
                  ))
                ) : null}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8">
                  <GlassCard title="Organization Competency Levels">
                    {isLoadingTeamData ? (
                      <div className="h-72 mt-4 space-y-4">
                        <div className="flex items-end gap-4 h-full pb-8">
                          {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2">
                              <div className="flex gap-1 items-end h-48 w-full justify-center">
                                <Skeleton variant="rectangle" width={16} height={`${30 + Math.random() * 60}%`} />
                                <Skeleton variant="rectangle" width={16} height={`${20 + Math.random() * 50}%`} />
                              </div>
                              <Skeleton variant="text" width="80%" height={8} />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : teamDataError ? (
                      <div className="h-72 mt-4 flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-red-400 text-sm mb-2">Failed to load team data</p>
                          <button
                            onClick={loadTeamPerformanceData}
                            className="px-3 py-1 bg-red-500/10 text-red-400 text-xs rounded hover:bg-red-500/20 transition-all"
                          >
                            Retry
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="h-72 min-h-[280px] mt-4">
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
                    )}
                  </GlassCard>
                </div>
                <div className="lg:col-span-4">
                  <GlassCard title="AI Strategic Insights" className="!bg-[#8252e9]/5 border-[#8252e9]/20">
                    <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
                      {isGenerating ? (
                        <div className="space-y-3">
                          <Skeleton variant="text" width="100%" height={12} />
                          <Skeleton variant="text" width="90%" height={12} />
                          <Skeleton variant="text" width="95%" height={12} />
                          <Skeleton variant="text" width="40%" height={12} />
                        </div>
                      ) : (
                        <p className="text-xs text-slate-300 leading-relaxed italic">
                          {aiSummary}
                        </p>
                      )}
                    </div>
                  </GlassCard>
                </div>
              </div>
            </div>
          </div>

          <div className={activeTab === 'Evaluations' ? 'block' : 'hidden'}>
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
                    {isLoadingEvaluations ? (
                      // Loading skeleton
                      Array.from({ length: 3 }).map((_, i) => (
                        <tr key={i}>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <Skeleton variant="circle" width={36} height={36} />
                              <div className="space-y-2">
                                <Skeleton variant="text" width={100} height={12} />
                                <Skeleton variant="text" width={60} height={8} />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <Skeleton variant="text" width={80} height={12} />
                          </td>
                          <td className="px-6 py-5">
                            <Skeleton variant="rectangle" width={60} height={16} />
                          </td>
                          <td className="px-6 py-5 text-right">
                            <Skeleton variant="rectangle" width={80} height={28} className="ml-auto" />
                          </td>
                        </tr>
                      ))
                    ) : pendingEvaluations.length === 0 ? (
                      // Empty state
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center">
                          <div className="text-slate-400">
                            <div className="text-4xl mb-4">📋</div>
                            <p className="text-sm font-medium">No pending evaluations</p>
                            <p className="text-xs mt-1">All evaluations are up to date</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      // Real data
                      pendingEvaluations.map((evaluation, i) => (
                        <tr key={evaluation.id} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg border border-white/10 bg-gradient-to-br from-[#8252e9] to-[#6d39e0] flex items-center justify-center text-white text-xs font-bold">
                                {evaluation.employee_name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-white tracking-tight">{evaluation.employee_name}</p>
                                <p className="text-[9px] text-slate-500 font-bold uppercase">{evaluation.employee_code}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-xs text-slate-400">{evaluation.department}</td>
                          <td className="px-6 py-5">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${evaluation.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                              evaluation.status === 'in_progress' ? 'bg-yellow-500/10 text-yellow-400' :
                                'bg-blue-500/10 text-blue-400'
                              }`}>
                              {evaluation.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <button
                              onClick={() => {
                                setActiveEmployee(evaluation.employee_name);
                                setView('EVALUATION');
                              }}
                              className="text-[10px] font-black text-white uppercase tracking-widest bg-white/5 hover:bg-white/10 px-4 py-1.5 rounded-lg transition-all"
                            >
                              {evaluation.status === 'completed' ? 'View Results' : 'Fill Evaluation'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </div>

          <div className={activeTab === 'Review Cycles' ? 'block' : 'hidden'}>
            <ReviewCyclesTab onNotify={onNotify} />
          </div>

          <div className={activeTab === 'Goals & OKRs' ? 'block' : 'hidden'}>
            <GoalsTab onNotify={onNotify} />
          </div>

          <div className={activeTab === 'Appraisals' ? 'block' : 'hidden'}>
            <AppraisalsTab onNotify={onNotify} />
          </div>

          <div className={activeTab === 'Reporting' ? 'block' : 'hidden'}>
            <ReportingTab onNotify={onNotify} />
          </div>

          <div className={activeTab === 'Settings' ? 'block' : 'hidden'}>
            <SettingsTab onNotify={onNotify} />
          </div>
        </div>      </div>
    </div>
  );
};

export default Performance;
