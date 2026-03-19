import React from 'react';
import GlassCard from '../GlassCard';
import Badge from '../ui/Badge';
import Skeleton from '../Skeleton';
import { Briefcase, Calendar, TrendingUp } from 'lucide-react';
import type { Application } from '../../types/talent';

interface MyApplicationsProps {
  applications: Application[];
  isLoading?: boolean;
}

const MyApplications: React.FC<MyApplicationsProps> = ({ applications, isLoading = false }) => {
  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'applied': return 'secondary';
      case 'screening': return 'info';
      case 'technical': return 'warning';
      case 'interview': return 'primary';
      case 'offer': return 'success';
      case 'hired': return 'success';
      case 'rejected': return 'error';
      default: return 'secondary';
    }
  };

  const getStageLabel = (stage: string) => {
    return stage.charAt(0).toUpperCase() + stage.slice(1);
  };

  const getStatusIcon = (stage: string) => {
    switch (stage) {
      case 'hired': return '🎉';
      case 'offer': return '📝';
      case 'interview': return '👥';
      case 'technical': return '💻';
      case 'screening': return '🔍';
      case 'rejected': return '❌';
      default: return '📋';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <GlassCard key={i} className="p-6">
            <div className="flex items-center gap-4">
              <Skeleton variant="circle" width={48} height={48} />
              <div className="flex-1 space-y-2">
                <Skeleton variant="text" width="60%" height={16} />
                <Skeleton variant="text" width="40%" height={12} />
              </div>
              <Skeleton variant="rectangle" width={80} height={24} />
            </div>
          </GlassCard>
        ))}
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <GlassCard className="p-12">
        <div className="text-center">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase mb-2">
            No Applications Yet
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Browse open positions and submit your first application
          </p>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      {applications.map((application) => (
        <GlassCard
          key={application.id}
          className="p-6 hover:bg-white/[0.03] transition-all group"
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-2xl">
                {getStatusIcon(application.stage)}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex-1">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase truncate">
                    {application.jobOpening?.title || 'Position'}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                      <Briefcase className="w-3 h-3" />
                      {application.jobOpening?.department?.name || 'General'}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                      <Calendar className="w-3 h-3" />
                      Applied {new Date(application.applied_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <Badge
                  variant={getStageColor(application.stage)}
                  className="uppercase text-[9px] font-black whitespace-nowrap"
                >
                  {getStageLabel(application.stage)}
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Application Progress
                  </span>
                  <span className="text-xs font-black text-orange-500">
                    {application.stage === 'hired' ? '100%' : 
                     application.stage === 'offer' ? '80%' :
                     application.stage === 'interview' ? '60%' :
                     application.stage === 'technical' ? '40%' :
                     application.stage === 'screening' ? '20%' : '10%'}
                  </span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      application.stage === 'rejected'
                        ? 'bg-red-500'
                        : 'bg-gradient-to-r from-orange-500 to-pink-500'
                    }`}
                    style={{
                      width:
                        application.stage === 'hired' ? '100%' :
                        application.stage === 'offer' ? '80%' :
                        application.stage === 'interview' ? '60%' :
                        application.stage === 'technical' ? '40%' :
                        application.stage === 'screening' ? '20%' : '10%',
                    }}
                  />
                </div>
              </div>

              {/* Timeline Steps */}
              <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2">
                {['applied', 'screening', 'technical', 'interview', 'offer', 'hired'].map((step, index) => {
                  const stages = ['applied', 'screening', 'technical', 'interview', 'offer', 'hired'];
                  const currentIndex = stages.indexOf(application.stage);
                  const isActive = index <= currentIndex;
                  const isCurrent = step === application.stage;

                  return (
                    <div key={step} className="flex items-center">
                      <div
                        className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                          isCurrent
                            ? 'bg-orange-500 text-white'
                            : isActive
                            ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400'
                            : 'bg-slate-100 dark:bg-white/5 text-slate-400'
                        }`}
                      >
                        {step}
                      </div>
                      {index < 5 && (
                        <div
                          className={`w-4 h-0.5 mx-1 ${
                            isActive ? 'bg-orange-500' : 'bg-slate-200 dark:bg-white/10'
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
};

export default MyApplications;
