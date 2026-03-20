import React, { useState, useEffect } from 'react';
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

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 md:p-6 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-2xl max-h-[88vh] bg-white/90 dark:bg-[#0d0a1a]/95 backdrop-blur-xl rounded-[40px] border border-slate-200 dark:border-white/10 shadow-2xl animate-in zoom-in-95 duration-500 flex flex-col overflow-hidden">

          {/* Gradient top bar */}
          <div className="h-1 w-full bg-gradient-to-r from-brand-primary via-purple-400 to-brand-primary/30 flex-shrink-0" />

          {/* Header */}
          <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              {/* Orb */}
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-brand-primary/10 dark:bg-brand-primary/20 flex items-center justify-center">
                  <span className="text-brand-primary text-lg">✦</span>
                </div>
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-[#0d0a1a]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-black italic uppercase tracking-widest text-brand-primary">AI Advisor</h2>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary">
                    {roleBadge[user?.role ?? 'employee'] ?? 'Employee'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
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
          <div className="px-6 flex gap-1 border-b border-slate-100 dark:border-white/10 flex-shrink-0">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative text-xs font-semibold px-3 py-2.5 transition-colors duration-150 ${
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
          <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0">
            {activeTab === 'briefing' && (
              <BriefingTab
                briefing={advisor.briefing}
                isLoading={advisor.isLoadingBriefing}
                error={advisor.error}
              />
            )}
            {activeTab === 'insights' && (
              <InsightsTab insights={advisor.briefing?.insights ?? []} />
            )}
            {activeTab === 'trends' && (
              <TrendsTab trends={advisor.trends} isLoading={advisor.isLoadingTrends} />
            )}
            {activeTab === 'ask' && (
              <AskTab
                messages={advisor.chatMessages}
                isStreaming={advisor.isStreaming}
                geminiEnabled={advisor.geminiEnabled}
                onSend={advisor.sendMessage}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AIAdvisorModal;
