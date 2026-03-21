import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import BriefingTab from './tabs/BriefingTab';
import InsightsTab from './tabs/InsightsTab';
import TrendsTab from './tabs/TrendsTab';
import AskTab from './tabs/AskTab';
import { useAIAdvisor } from '../../hooks/useAIAdvisor';

interface Props {
  onClose: () => void;
}

type Tab = 'briefing' | 'insights' | 'trends' | 'ask';

const TABS: { key: Tab; label: string }[] = [
  { key: 'briefing',  label: 'Briefing' },
  { key: 'insights',  label: 'Insights' },
  { key: 'trends',    label: 'Trends' },
  { key: 'ask',       label: 'Ask' },
];

const AIAdvisorModal: React.FC<Props> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('briefing');
  const advisor = useAIAdvisor();

  // Read user from localStorage (same pattern as the rest of the app)
  const user = (() => {
    try { return JSON.parse(localStorage.getItem('royalgateway_user') || '{}'); }
    catch { return {}; }
  })();

  // Load briefing on mount
  useEffect(() => {
    advisor.loadBriefing();
  }, []);

  // Load trends when tab is first visited
  useEffect(() => {
    if (activeTab === 'trends') advisor.loadTrends();
  }, [activeTab]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const roleBadge: Record<string, string> = {
    super_admin: 'Executive',
    admin:       'HR Admin',
    manager:     'Manager',
    employee:    'Employee',
  };

  const modalContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[998] bg-slate-950/40 backdrop-blur-xl animate-in fade-in duration-500"
        onClick={onClose}
      />
      
      {/* Neural Glow Background (Fixed relative to the modal viewport) */}
      <div className="fixed inset-0 pointer-events-none z-[999] overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-brand-primary/20 rounded-full blur-[160px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/20 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Modal Container */}
      <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center sm:p-4 md:p-8 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-5xl h-[95dvh] sm:h-full sm:max-h-[90vh] bg-white/40 dark:bg-[#060411]/60 backdrop-blur-3xl rounded-t-[32px] sm:rounded-[56px] border border-white/30 dark:border-white/10 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.6)] animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-500 flex flex-col overflow-hidden">



          {/* Gradient top bar */}
          <div className="h-1 w-full bg-gradient-to-r from-brand-primary via-purple-400 to-brand-primary/30 flex-shrink-0" />

          {/* Header */}
          <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-4 flex items-start justify-between gap-4 flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              {/* Orb */}
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-brand-primary/10 dark:bg-brand-primary/20 flex items-center justify-center">
                  <span className="text-brand-primary text-lg">✦</span>
                </div>
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-[#0d0a1a]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-black italic uppercase tracking-widest text-brand-primary">AI Advisor</h2>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary flex-shrink-0">
                    {roleBadge[user?.role ?? 'employee'] ?? 'Employee'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  {greeting()}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}. Here's your briefing.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/20 transition-all text-sm"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Tab bar */}
          <div className="px-4 sm:px-6 flex gap-1 border-b border-slate-100 dark:border-white/10 flex-shrink-0 overflow-x-auto scrollbar-hide">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex-shrink-0 text-xs font-semibold px-3 py-2.5 transition-colors duration-150 ${
                  activeTab === tab.key
                    ? 'text-brand-primary'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                {tab.label}
                {tab.key === 'ask' && !advisor.geminiEnabled && (
                  <span className="ml-1 text-[9px] text-slate-300 dark:text-slate-600">✕</span>
                )}
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div key={activeTab} className="flex-1 overflow-y-auto px-4 py-4 sm:px-10 sm:py-8 min-h-0 animate-in fade-in slide-in-from-right-4 duration-500">
            {activeTab === 'briefing' && (
              <BriefingTab
                briefing={advisor.briefing}
                isLoading={advisor.isLoadingBriefing}
                error={advisor.error}
                onClose={onClose}
              />
            )}
            {activeTab === 'insights' && (
              <InsightsTab insights={advisor.briefing?.insights ?? []} />
            )}
            {activeTab === 'trends' && (
              <TrendsTab 
                trends={advisor.trends} 
                isLoading={advisor.isLoadingTrends} 
                error={advisor.error}
                onRetry={advisor.loadTrends}
              />
            )}
            {activeTab === 'ask' && (
              <AskTab
                messages={advisor.chatMessages}
                isStreaming={advisor.isStreaming}
                geminiEnabled={advisor.geminiEnabled}
                onSend={advisor.sendMessage}
                onStop={advisor.stopStreaming}
                onReset={advisor.resetChat}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
};

export default AIAdvisorModal;
