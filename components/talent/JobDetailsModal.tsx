import React from 'react';
import { X, Briefcase, MapPin, Calendar, Users, Clock } from 'lucide-react';
import Badge from '../ui/Badge';
import type { JobOpening } from '../../types/talent';

interface JobDetailsModalProps {
  job: JobOpening | null;
  isOpen: boolean;
  onClose: () => void;
  onApply?: () => void;
  showApplyButton?: boolean;
}

const JobDetailsModal: React.FC<JobDetailsModalProps> = ({
  job,
  isOpen,
  onClose,
  onApply,
  showApplyButton = true,
}) => {
  if (!isOpen || !job) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'draft': return 'warning';
      case 'on_hold': return 'secondary';
      case 'closed': return 'error';
      default: return 'secondary';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between p-6 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900">
          <div className="flex-1 pr-4">
            <div className="flex items-start gap-3 mb-3">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase flex-1">
                {job.title}
              </h2>
              <Badge variant={getStatusColor(job.status)} className="uppercase text-[9px] font-black">
                {job.status}
              </Badge>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Briefcase className="w-4 h-4" />
                {job.department?.name || 'General'}
              </span>
              <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <MapPin className="w-4 h-4" />
                {job.location}
              </span>
              <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Clock className="w-4 h-4" />
                {job.employment_type.replace('_', ' ')}
              </span>
              <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Users className="w-4 h-4" />
                {job.applicants_count || 0} Applicants
              </span>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Job Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Experience Level
              </p>
              <p className="text-sm font-black text-slate-900 dark:text-white uppercase">
                {job.experience_level}
              </p>
            </div>
            
            <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Openings
              </p>
              <p className="text-sm font-black text-slate-900 dark:text-white">
                {job.openings} {job.openings === 1 ? 'Position' : 'Positions'}
              </p>
            </div>
            
            {job.posted_date && (
              <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Posted Date
                </p>
                <p className="text-sm font-black text-slate-900 dark:text-white">
                  {new Date(job.posted_date).toLocaleDateString()}
                </p>
              </div>
            )}
            
            {job.closing_date && (
              <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Closing Date
                </p>
                <p className="text-sm font-black text-slate-900 dark:text-white">
                  {new Date(job.closing_date).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          {job.description && (
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase mb-3">
                Job Description
              </h3>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                  {job.description}
                </p>
              </div>
            </div>
          )}

          {/* Responsibilities */}
          {job.responsibilities && (
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase mb-3">
                Key Responsibilities
              </h3>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                  {job.responsibilities}
                </p>
              </div>
            </div>
          )}

          {/* Requirements */}
          {job.requirements && (
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase mb-3">
                Requirements
              </h3>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                  {job.requirements}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {showApplyButton && job.status === 'active' && (
          <div className="sticky bottom-0 p-6 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900">
            <button
              onClick={onApply}
              className="w-full px-6 py-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm uppercase tracking-widest rounded-xl shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all"
            >
              Apply for this Position
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobDetailsModal;
