import React, { useState, useEffect, useMemo } from 'react';
import GlassCard from '../components/GlassCard';
import MetricCard from '../components/ui/MetricCard';
import AIInsight from '../components/AIInsight';
import Skeleton from '../components/Skeleton';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { UserRole } from '../types';
import { generateHRAssistantResponse } from '../services/geminiService';
import { dashboardService } from '../services/dashboardService';
import AnalysisDetailModal from '../components/dashboard/AnalysisDetailModal';
import { getTooltipStyles } from '../utils/chartTheme';
import { useBrandSettings } from '../hooks/useBrandSettings';

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(UserRole.EMPLOYEE);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Brand settings hook
  const { brandSettings } = useBrandSettings();

  // Interactive Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalData, setModalData] = useState<any>(null);
  const [modalRec, setModalRec] = useState('');

  // Theme detection for tooltips
  const isDark = document.documentElement.classList.contains('dark');
  const tooltipStyles = getTooltipStyles(isDark);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const data = await dashboardService.getIntelligence();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to fetch dashboard intelligence', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('royalgateway_user') || '{}');
    if (storedUser.id) {
      setUser(storedUser);
      const roleName = storedUser.roles?.[0]?.name?.toUpperCase() || 'EMPLOYEE';
      if (roleName.includes('SUPER_ADMIN')) setCurrentUserRole(UserRole.SUPER_ADMIN);
      else if (roleName.includes('HR_MANAGER')) setCurrentUserRole(UserRole.MANAGER);
      else if (roleName.includes('BRANCH_MANAGER')) setCurrentUserRole(UserRole.MANAGER);
      else if (roleName.includes('ADMIN')) setCurrentUserRole(UserRole.ADMIN);
      else setCurrentUserRole(UserRole.EMPLOYEE);

      fetchDashboardData();
    }
  }, []);

  const fetchInsight = async () => {
    if (!dashboardData) return;
    setIsLoadingInsight(true);
    try {
      const stats = dashboardData.stats.map((s: any) => `${s.label}: ${s.val}`).join(', ');
      const context = `Dashboard View: ${currentUserRole}. Current Stats: ${stats}.`;
      const response = await generateHRAssistantResponse("Provide a 1-sentence strategic insight for the organizational health based on these real-time metrics.", context);
      setAiInsight(response || "Organization operating at optimal capacity. Focus on maintaining current retention trajectory.");
    } catch (e) {
      setAiInsight("AI Engine analysis temporarily unavailable. Synchronizing data stacks...");
    } finally {
      setIsLoadingInsight(false);
    }
  };

  useEffect(() => {
    if (dashboardData) fetchInsight();
  }, [dashboardData, currentUserRole]);

  const handleStatClick = (label: string, value: string) => {
    setModalTitle(label);
    setModalData({
      stats: [
        { label: 'Current ' + label, value: value, color: 'text-[#8252e9]' },
        { label: 'Target', value: label === 'Retention' ? '98%' : 'N/A', color: 'text-emerald-500' },
        { label: 'Industry Avg', value: '85%', color: 'text-slate-400' }
      ]
    });
    setModalRec(`Real-time audit for ${label} shows a reading of ${value}. Strategic recommendation: Implement pulse surveys to validate this metric against regional benchmarks.`);
    setIsModalOpen(true);
  };

  const dashboardLabel = useMemo(() => {
    if (currentUserRole === UserRole.SUPER_ADMIN || currentUserRole === UserRole.ADMIN) return 'Nexus Global';
    if (currentUserRole === UserRole.MANAGER) return 'Management Hub';
    return 'Personal Nexus';
  }, [currentUserRole]);

  const subLabel = useMemo(() => {
    if (currentUserRole === UserRole.SUPER_ADMIN || currentUserRole === UserRole.ADMIN) return 'Real-time Organizational Intelligence';
    if (currentUserRole === UserRole.MANAGER) return 'Branch & Team Performance Oversight';
    return 'Personal Performance & Career Trajectory';
  }, [currentUserRole]);

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 dark:border-white/10 pb-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
            Control <span className="text-brand-primary">{dashboardLabel}</span>
          </h2>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1">
            {subLabel}
          </p>
        </div>

        <div className="px-4 py-2 bg-brand-primary-10 border border-brand-primary/20 rounded-2xl text-[10px] font-black text-brand-primary uppercase tracking-widest">
          Role: {currentUserRole} {user?.department?.name ? `• ${user.department.name}` : ''}
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          [1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)
        ) : (
          dashboardData?.stats.map((s: any, i: number) => {
            // Determine color based on metric type
            const getMetricColor = (label: string) => {
              if (label.toLowerCase().includes('retention')) return 'success';
              if (label.toLowerCase().includes('burnout') || label.toLowerCase().includes('turnover')) return 'warning';
              if (label.toLowerCase().includes('headcount') || label.toLowerCase().includes('employees')) return 'info';
              return 'primary';
            };

            // Determine trend based on delta
            const getTrend = (delta: string) => {
              if (delta.includes('+')) return 'up';
              if (delta.includes('-')) return 'down';
              return 'neutral';
            };

            return (
              <MetricCard
                key={i}
                title={s.label}
                value={s.val}
                delta={s.delta}
                trend={getTrend(s.delta)}
                color={getMetricColor(s.label)}
                onClick={() => handleStatClick(s.label, s.val)}
              />
            );
          })
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          {/* Main Chart Section - Talent & Turnover */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <GlassCard
              title="Talent Trends"
              className="cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
              onClick={() => handleStatClick('Talent Trends', 'Live Data Sync')}
              action={<button className="text-[10px] font-black text-brand-primary uppercase tracking-widest hover:underline">View Historical ›</button>}
            >
              <div className="h-[250px] w-full mt-4">
                {isLoading ? (
                  <Skeleton className="w-full h-full rounded-xl" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dashboardData?.talent_trends}>
                      <defs>
                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--brand-primary)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#00000008" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis hide />
                      <Tooltip {...tooltipStyles} />
                      <Area type="monotone" dataKey="val" stroke="var(--brand-primary)" strokeWidth={3} fill="url(#chartGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </GlassCard>

            {currentUserRole !== UserRole.EMPLOYEE && (
              <GlassCard
                title="Turnover Dynamics"
                onClick={() => handleStatClick('Turnover', 'Operational Flow')}
              >
                <div className="h-[250px] w-full mt-4">
                  {isLoading ? (
                    <Skeleton className="w-full h-full rounded-xl" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dashboardData?.turnover_data}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="val"
                          stroke="none"
                        >
                          {dashboardData?.turnover_data?.map((e: any, i: number) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 mt-2 justify-center">
                  {dashboardData?.turnover_data?.map((d: any, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-[9px] font-bold text-slate-500 uppercase">{d.name}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
          </div>

          {/* Hiring Funnel & Analytics Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {currentUserRole !== UserRole.EMPLOYEE && (
              <GlassCard title="Hiring Funnel (Discovery)">
                <div className="space-y-4 py-2">
                  {isLoading ? (
                    [1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10 w-full rounded-xl" />)
                  ) : (
                    dashboardData?.hiring_funnel?.map((item: any, i: number) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-[8px] text-slate-900 dark:text-white font-black">{item.val}%</span>
                            {item.label}
                          </div>
                          <span>{item.current}</span>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                          <div className={`h-full ${item.color} opacity-40 transition-all duration-1000`} style={{ width: `${item.val}%` }} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </GlassCard>
            )}

            {currentUserRole !== UserRole.EMPLOYEE && (
              <GlassCard title="Absenteeism Trend">
                <div className="h-[200px] w-full mt-4">
                  {isLoading ? (
                    <Skeleton className="w-full h-full rounded-xl" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dashboardData?.absenteeism}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#00000008" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} />
                        <YAxis hide />
                        <Tooltip {...tooltipStyles} />
                        <Area type="monotone" dataKey="rate" stroke="#ef4444" strokeWidth={2} fill="#ef444410" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <p className="text-[9px] text-slate-400 font-bold uppercase text-center mt-2 italic">Avg Rate: 2.7% • Targeted Reduction -15%</p>
              </GlassCard>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <GlassCard
              title="AI Strategic Summary"
              className="border-t-2 border-t-brand-primary/30 hover:bg-brand-primary-10 cursor-pointer transition-all"
              onClick={() => handleStatClick('AI Strategic Intelligence', aiInsight)}
            >
              <AIInsight content={aiInsight} isLoading={isLoadingInsight} onRefresh={fetchInsight} />
            </GlassCard>

            <GlassCard
              title="Attendance Health"
              className="cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
              onClick={() => handleStatClick('Attendance Health', 'Live Synchronization')}
            >
              <div className="flex h-48 items-center w-full">
                {isLoading ? (
                  <Skeleton className="w-full h-full rounded-full max-w-[150px] mx-auto" />
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={dashboardData?.attendance_health} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                          {dashboardData?.attendance_health.map((e: any, i: number) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 flex-shrink-0 pr-4">
                      {dashboardData?.attendance_health.map((d: any, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                          <span className="text-[10px] font-bold text-slate-500 uppercase">{d.name}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </GlassCard>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          {/* Demographics Card */}
          {currentUserRole !== UserRole.EMPLOYEE && (
            <GlassCard title="Demographics Insight">
              {isLoading ? (
                <Skeleton className="h-48 w-full rounded-3xl" />
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-around py-4">
                    {dashboardData?.demographics?.gender.map((g: any, i: number) => (
                      <div key={i} className="text-center">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl mb-2 ${g.name === 'Male' ? 'bg-blue-500/10 text-blue-500' : 'bg-rose-500/10 text-rose-500'}`}>
                          {g.name === 'Male' ? '👨' : '👩'}
                        </div>
                        <p className="text-xl font-black text-slate-900 dark:text-white">{g.pct}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{g.name}</p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-white/5">
                    {dashboardData?.demographics?.age_groups.map((age: any, i: number) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{age.name} Yrs</span>
                        <div className="flex-1 mx-4 h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-primary" style={{ width: `${age.value}%` }} />
                        </div>
                        <span className="text-[10px] font-black text-slate-900 dark:text-white">{age.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </GlassCard>
          )}

          <GlassCard title="Upcoming Milestones">
            <div className="space-y-6">
              {isLoading ? (
                [1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)
              ) : (
                dashboardData?.milestones?.map((item: any, i: number) => (
                  <div key={i} className={`p-4 rounded-2xl bg-black/5 dark:bg-white/5 border-l-4 ${item.c} group hover:bg-brand-primary-10 transition-all cursor-pointer`}>
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{item.t}</h4>
                      <span className="text-xl">{item.i}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase">{item.d}</p>
                  </div>
                ))
              )}
            </div>
          </GlassCard>

          {/* Optimization Pulse */}
          {currentUserRole !== UserRole.EMPLOYEE && (
            <div className="p-8 rounded-[32px] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  🚀
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight italic">Optimization Pulse</h4>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Automated efficiency tracking</p>
                </div>
              </div>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-2 w-full" />
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Process Velocity</span>
                      <span className="text-sm font-black text-emerald-500">{dashboardData?.optimization_pulse?.velocity}</span>
                    </div>
                    <div className="h-1 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 shadow-[0_0_8px_#10b981]"
                        style={{ width: `${dashboardData?.optimization_pulse?.progress}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed mt-6 italic">
                    "{dashboardData?.optimization_pulse?.insight}"
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <AnalysisDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalTitle}
        data={modalData}
        recommendations={modalRec}
      />
    </div>
  );
};

export default Dashboard;
