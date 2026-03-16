
import React, { useState } from 'react';
import {
  DashboardView,
  JobOpeningsView,
  CandidatesView,
  OnboardingView,
  OrientationView,
  SettingsView
} from '../components/TalentSubViews';

type TalentTab = 'dashboard' | 'jobs' | 'candidates' | 'onboarding' | 'settings';

const TalentManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TalentTab>('jobs');
  const user = JSON.parse(localStorage.getItem('royalgateway_user') || '{}');
  const isManagement = user.primary_role_id <= 3; // HR Admin, Manager, CEO

  const allTabs: { id: TalentTab; label: string; icon: string; managementOnly?: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', managementOnly: true },
    { id: 'jobs', label: 'Job Openings', icon: '💼' },
    { id: 'candidates', label: 'Candidates', icon: '👤', managementOnly: true },
    { id: 'onboarding', label: 'Orientation', icon: '🎓' },
    { id: 'settings', label: 'Settings', icon: '⚙️', managementOnly: true },
  ];

  const tabs = allTabs.filter(tab => !tab.managementOnly || isManagement);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardView />;
      case 'jobs': return <JobOpeningsView />;
      case 'candidates': return <CandidatesView />;
      case 'onboarding': return isManagement ? <OnboardingView /> : <OrientationView />;
      case 'settings': return <SettingsView />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase italic flex items-center gap-3">
            Talent <span className="text-slate-500 font-normal">Management</span>
            <span className="px-2 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/20 text-[10px] text-orange-400 non-italic font-bold tracking-widest uppercase">
              Enterprise
            </span>
          </h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Foundational Intelligence Layer</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all">
            Export Report
          </button>
          <button className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-black text-[11px] uppercase tracking-widest rounded-xl shadow-lg shadow-orange-500/20 active:scale-95 transition-all">
            + Action Item
          </button>
        </div>
      </div>

      {/* Modern Tab Bar */}
      <div className="flex items-center p-1 bg-white/5 border border-white/10 rounded-2xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300
              ${activeTab === tab.id
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                : 'text-slate-500 hover:text-white hover:bg-white/5'}
            `}
          >
            <span className={`${activeTab === tab.id ? 'opacity-100' : 'opacity-40 grayscale group-hover:opacity-100'}`}>
              {tab.icon}
            </span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active Content View */}
      <div className="min-h-[600px]">
        {renderActiveView()}
      </div>
    </div>
  );
};

export default TalentManagement;
