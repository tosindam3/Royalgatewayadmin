import React from 'react';
import GlassCard from '../GlassCard';
import Badge from '../ui/Badge';
import { Briefcase, MapPin, Users, Calendar } from 'lucide-react';
import type { JobOpening } from '../../types/talent';

interface JobCardProps {
  job: JobOpening;
  onApply?: (jobId: string | number) => void;
  onView?: (jobId: string | number) => void;
  showApplyButton?: boolean;
  showActions?: boolean;
}

const JobCard: React.FC<JobCardProps> = ({
  job,
  onApply,
  onView,
  showApplyButton = true,
  showActions = false,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'draft':
        return 'warning';
      case 'on_hold':
        return 'secondary';
      case 'closed':
        return 'error';
      default:
        return 'secondary';
    }
  };

  const getEmploymentTypeLabel = (type: string) => {
    return type.replace('_', ' ').toUpperCase();
  };

  return (
    <GlassCard className="hover:bg-white/[0.03] transition-all cursor-pointer group">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        {/* Left: Job Info */}
        <div className="flex-1 space-y-3" onClick={() => onView?.(job.id)}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight uppercase">
                {job.title}
              </h3>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  <Briefcase className="w-3 h-3" />
                  {job.department?.name || 'General'}
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  <MapPin className="w-3 h-3" />
                  {job.location}
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  <Users className="w-3 h-3" />
                  {job.applicants_count || 0} Applied
                </span>
              </div>
            </div>

            <Badge variant={getStatusColor(job.status)} className="uppercase text-[9px] font-black ml-2">
              {job.status}
            </Badge>
          </div>

          {/* Description Preview */}
          {job.description && (
            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
              {job.description}
            </p>
          )}

          {/* Meta Info */}
          <div className="flex items-center gap-4 text-[9px] text-slate-500 dark:text-slate-600 font-bold uppercase tracking-widest">
            {job.posted_date && (
              <>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Posted: {new Date(job.posted_date).toLocaleDateString()}
                </span>
                <span>•</span>
              </>
            )}
            <span>{getEmploymentTypeLabel(job.employment_type)}</span>
            <span>•</span>
            <span>{job.experience_level} Level</span>
            {job.openings > 1 && (
              <>
                <span>•</span>
                <span>{job.openings} Positions</span>
              </>
            )}
          </div>
        </div>

        {/* Right: Action */}
        {showApplyButton && job.status === 'active' && (
          <div className="flex items-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onApply?.(job.id);
              }}
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-black text-[11px] uppercase tracking-widest rounded-xl shadow-lg shadow-orange-500/20 active:scale-95 transition-all whitespace-nowrap"
            >
              Apply Now
            </button>
          </div>
        )}
      </div>
    </GlassCard>
  );
};

export default JobCard;
