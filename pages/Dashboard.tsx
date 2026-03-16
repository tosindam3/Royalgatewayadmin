import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';
import { renderWidget } from '../components/dashboard/widgets/WidgetRegistry';
import Skeleton from '../components/Skeleton';
import AIInsight from '../components/AIInsight';
import GlassCard from '../components/GlassCard';
import { generateHRAssistantResponse } from '../services/geminiService';
import AnalysisDetailModal from '../components/dashboard/AnalysisDetailModal';
import apiClient from '../services/apiClient';

const Dashboard: React.FC = () => {
  const [aiInsight, setAiInsight] = useState<string>('');
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalData, setModalData] = useState<any>(null);
  const [modalRec, setModalRec] = useState('');

  const [selectedPeriod, setSelectedPeriod] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM

  const { data: manifest, isLoading: isLoadingManifest } = useQuery({
    queryKey: ['dashboard-manifest'],
    queryFn: () => dashboardService.getManifest() as unknown as any,
    staleTime: 30000,
  });

  // Fetch employee summary data when the manifest says it's needed
  const widgets: any[] = Array.isArray(manifest?.widgets) ? manifest.widgets : [];
  // isEmployee: backend sets is_management=false for non-management roles,
  // also cross-check that the employee_metrics widget is authorized
  const isEmployee = manifest && !manifest?.meta?.is_management;
  const employeeWidget = widgets.find((w: any) => w.type === 'employee_metrics');
  const employeeEndpoint = employeeWidget?.endpoint;
  const employeeWidgetAuthorized = employeeWidget?.authorized === true;

  const { data: employeeSummary, isLoading: isLoadingEmployeeSummary, error: employeeSummaryError } = useQuery({
    queryKey: ['employee-summary', selectedPeriod],
    queryFn: () => apiClient.get(`${employeeEndpoint}?period=${selectedPeriod}`) as unknown as any,
    enabled: !!isEmployee && !!employeeEndpoint && employeeWidgetAuthorized,
    staleTime: 60000,
    retry: 1,
  });

  const fetchInsight = async () => {
    if (!manifest) return;
    setIsLoadingInsight(true);
    try {
      const response = await generateHRAssistantResponse(
        "Provide a 1-sentence strategic insight for organizational health based on the current dashboard context.",
        `User Role: ${manifest.meta?.user_role}. Dashboard Type: ${manifest.layout}.`
      );
      setAiInsight(response || "Organization operating at optimal capacity.");
    } catch {
      setAiInsight("AI Engine analysis temporarily unavailable.");
    } finally {
      setIsLoadingInsight(false);
    }
  };

  useEffect(() => {
    if (manifest) fetchInsight();
  }, [manifest]);

  const handleStatClick = (label: string, value: string) => {
    setModalTitle(label);
    setModalData({
      stats: [
        { label: 'Current ' + label, value, color: 'text-[#8252e9]' },
        { label: 'Target', value: '98%', color: 'text-emerald-500' },
        { label: 'Industry Avg', value: '85%', color: 'text-slate-400' }
      ]
    });
    setModalRec(`Real-time audit for ${label} shows a reading of ${value}. Recommendation: Monitor trends against regional benchmarks.`);
    setIsModalOpen(true);
  };

  if (isLoadingManifest) {
    return (
      <div className="space-y-8 pb-10">
        <Skeleton className="h-20 w-1/3 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="h-[300px] rounded-2xl" />
          <Skeleton className="h-[300px] rounded-2xl" />
        </div>
      </div>
    );
  }

  const dashboardLabel = manifest?.meta?.is_management ? 'Nexus Global' : 'Personal Nexus';
  const subLabel = manifest?.meta?.is_management ? 'Real-time Organizational Intelligence' : `${employeeSummary?.period || 'Performance Tracking'}`;

  // Helper to get past 6 months for the selector
  const periods = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return {
      value: d.toISOString().substring(0, 7),
      label: d.toLocaleString('default', { month: 'long', year: 'numeric' })
    };
  });

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-slate-200 dark:border-white/10 pb-4 md:pb-6">
        <div className="flex-1">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
            Control <span className="text-brand-primary">{dashboardLabel}</span>
          </h2>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1">
            {subLabel}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isEmployee && (
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-brand-primary transition-all"
            >
              {periods.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          )}
          <div className="px-3 md:px-4 py-2 bg-brand-primary-10 border border-brand-primary/20 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black text-brand-primary uppercase tracking-widest whitespace-nowrap">
            Auth: {manifest?.meta?.user_role}
          </div>
        </div>
      </div>

      {/* Employee Dashboard */}
      {isEmployee ? (
        <div className="space-y-8">
          {/* Employee Summary Metrics */}
          {isLoadingEmployeeSummary ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-36 rounded-2xl" />)}
            </div>
          ) : employeeSummaryError ? (
            <div className="p-4 rounded-2xl border border-dashed border-amber-400/40 bg-amber-500/5 text-[11px] text-amber-500 font-bold uppercase tracking-widest">
              Employee profile not linked to this account. Contact HR to resolve.
            </div>
          ) : employeeSummary ? (
            widgets
              .filter((w: any) => w.type === 'employee_metrics' && w.authorized)
              .map((w: any) => renderWidget({ ...w, data: employeeSummary }))
          ) : null}

          {/* Milestones */}
          {widgets.filter((w: any) => w.type === 'list_milestones').map(renderWidget)}

          {/* AI Advisory */}
          <GlassCard title="AI Performance Advisory" className="border-t-2 border-t-brand-primary/30">
            <AIInsight content={aiInsight} isLoading={isLoadingInsight} onRefresh={fetchInsight} />
          </GlassCard>
        </div>
      ) : (
        /* Management Dashboard */
        <div className="space-y-12">
          {widgets.filter((w: any) => w.type === 'metric_group' || w.type === 'employee_metrics').map(renderWidget)}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
            <div className="lg:col-span-8 space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {widgets.filter((w: any) => w.type === 'chart_area').map(renderWidget)}
                {widgets.filter((w: any) => w.type === 'chart_pie').map(renderWidget)}
              </div>
              <GlassCard title="AI Strategic Summary" className="border-t-2 border-t-brand-primary/30">
                <AIInsight content={aiInsight} isLoading={isLoadingInsight} onRefresh={fetchInsight} />
              </GlassCard>
            </div>
            <div className="lg:col-span-4 space-y-8">
              {widgets.filter((w: any) => w.type === 'demographics' || w.type === 'list_milestones').map(renderWidget)}
            </div>
          </div>
        </div>
      )}

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
