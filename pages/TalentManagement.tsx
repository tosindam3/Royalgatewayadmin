
import React, { useState, useEffect } from 'react';
import { Briefcase } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import JobList from '../components/talent/JobList';
import MyApplications from '../components/talent/MyApplications';
import JobDetailsModal from '../components/talent/JobDetailsModal';
import ApplicationFormModal from '../components/talent/ApplicationFormModal';
import { useTalent } from '../hooks/useTalent';
import { hasPermission } from '../utils/permissions';
import type { JobOpening } from '../types/talent';
import {
  DashboardView,
  CandidatesView,
  OnboardingView,
  OrientationView,
  SettingsView
} from '../components/TalentSubViews';

type TalentTab = 'dashboard' | 'jobs' | 'applications' | 'candidates' | 'onboarding' | 'settings';

const TalentManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TalentTab>('jobs');
  const [user, setUser] = useState<any>(null);
  const [selectedJob, setSelectedJob] = useState<JobOpening | null>(null);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  const { jobs, myApplications, isLoading, applyForJob } = useTalent();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('royalgateway_user') || '{}');
    setUser(userData);
  }, []);

  if (!user) return null;

  // Permission-based tab visibility
  const canViewDashboard = hasPermission(user, 'onboarding.view', 'department');
  const canViewCandidates = hasPermission(user, 'onboarding.view', 'department');
  const canManageSettings = hasPermission(user, 'onboarding.update', 'all');

  const allTabs: { id: TalentTab; label: string; icon: string }[] = [
    canViewDashboard && { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'jobs', label: 'Job Openings', icon: '💼' },
    { id: 'applications', label: 'My Applications', icon: '📝' },
    canViewCandidates && { id: 'candidates', label: 'Candidates', icon: '👤' },
    { id: 'onboarding', label: 'Orientation', icon: '🎓' },
    canManageSettings && { id: 'settings', label: 'Settings', icon: '⚙️' },
  ].filter(Boolean) as { id: TalentTab; label: string; icon: string }[];

  const handleViewJob = (jobId: string | number) => {
    const job = jobs.find((j) => j.id === jobId);
    if (job) {
      setSelectedJob(job);
      setShowJobDetails(true);
    }
  };

  const handleApplyClick = (jobId: string | number) => {
    const job = jobs.find((j) => j.id === jobId);
    if (job) {
      setSelectedJob(job);
      setShowJobDetails(false);
      setShowApplicationForm(true);
    }
  };

  const handleSubmitApplication = async (data: any) => {
    if (!selectedJob) return;
    
    await applyForJob.mutateAsync({
      jobId: selectedJob.id,
      data,
    });
    
    setShowApplicationForm(false);
    setSelectedJob(null);
    setActiveTab('applications');
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'jobs':
        return (
          <JobList
            jobs={jobs}
            isLoading={isLoading}
            onApply={handleApplyClick}
            onView={handleViewJob}
            showApplyButton={true}
          />
        );
      case 'applications':
        return <MyApplications applications={myApplications} isLoading={isLoading} />;
      case 'candidates':
        return <CandidatesView />;
      case 'onboarding':
        return canViewCandidates ? <OnboardingView /> : <OrientationView />;
      case 'settings':
        return <SettingsView />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-orange-500" />
            Talent Management
          </h2>
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mt-1 ml-11">
            Recruitment & Onboarding Intelligence
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-700 dark:text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all">
            Export Report
          </button>
          {canManageSettings && (
            <button className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-black text-[11px] uppercase tracking-widest rounded-xl shadow-lg shadow-orange-500/20 active:scale-95 transition-all">
              + Action Item
            </button>
          )}
        </div>
      </div>

      {/* Modern Tab Bar */}
      <GlassCard className="p-1 max-w-fit">
        <nav className="flex space-x-1">
          {allTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <span className={activeTab === tab.id ? 'opacity-100' : 'opacity-40 grayscale'}>
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </nav>
      </GlassCard>

      {/* Active Content View */}
      <div className="min-h-[600px]">
        {renderActiveView()}
      </div>

      {/* Modals */}
      <JobDetailsModal
        job={selectedJob}
        isOpen={showJobDetails}
        onClose={() => {
          setShowJobDetails(false);
          setSelectedJob(null);
        }}
        onApply={() => {
          setShowJobDetails(false);
          setShowApplicationForm(true);
        }}
        showApplyButton={true}
      />

      <ApplicationFormModal
        job={selectedJob!}
        isOpen={showApplicationForm}
        onClose={() => {
          setShowApplicationForm(false);
          setSelectedJob(null);
        }}
        onSubmit={handleSubmitApplication}
        isSubmitting={applyForJob.isPending}
      />
    </div>
  );
};

export default TalentManagement;
