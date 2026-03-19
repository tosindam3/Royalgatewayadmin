import React, { useState } from 'react';
import JobCard from './JobCard';
import Skeleton from '../Skeleton';
import { Search, Filter, Briefcase } from 'lucide-react';
import type { JobOpening } from '../../types/talent';

interface JobListProps {
  jobs: JobOpening[];
  isLoading?: boolean;
  onApply?: (jobId: string | number) => void;
  onView?: (jobId: string | number) => void;
  showApplyButton?: boolean;
}

const JobList: React.FC<JobListProps> = ({
  jobs,
  isLoading = false,
  onApply,
  onView,
  showApplyButton = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterType, setFilterType] = useState('');

  // Get unique departments
  const departments = Array.from(
    new Set(jobs.map((job) => job.department?.name).filter(Boolean))
  );

  // Filter jobs
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      !searchQuery ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDepartment =
      !filterDepartment || job.department?.name === filterDepartment;

    const matchesType = !filterType || job.employment_type === filterType;

    return matchesSearch && matchesDepartment && matchesType;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-6 glass rounded-2xl border border-white/10">
            <div className="flex items-start gap-4">
              <div className="flex-1 space-y-3">
                <Skeleton variant="text" width="60%" height={20} />
                <Skeleton variant="text" width="40%" height={14} />
                <Skeleton variant="text" width="80%" height={12} />
              </div>
              <Skeleton variant="rectangle" width={120} height={40} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search jobs by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
          />
        </div>

        {/* Department Filter */}
        <select
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value)}
          className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all cursor-pointer"
        >
          <option value="">All Departments</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>

        {/* Type Filter */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all cursor-pointer"
        >
          <option value="">All Types</option>
          <option value="full_time">Full Time</option>
          <option value="part_time">Part Time</option>
          <option value="contract">Contract</option>
          <option value="intern">Intern</option>
        </select>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
          {filteredJobs.length} {filteredJobs.length === 1 ? 'position' : 'positions'} found
        </p>
        {(searchQuery || filterDepartment || filterType) && (
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterDepartment('');
              setFilterType('');
            }}
            className="text-xs font-bold text-orange-500 hover:text-orange-600 uppercase tracking-wider"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Job Cards */}
      {filteredJobs.length === 0 ? (
        <div className="text-center py-16">
          <Briefcase className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase mb-2">
            No Positions Found
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {searchQuery || filterDepartment || filterType
              ? 'Try adjusting your filters'
              : 'Check back later for new opportunities'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onApply={onApply}
              onView={onView}
              showApplyButton={showApplyButton}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default JobList;
