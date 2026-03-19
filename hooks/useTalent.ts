import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import talentApi from '../services/talentApi';
import { showSuccessToast, showErrorToast } from '../utils/toastUtils';
import type { JobOpening, Application } from '../types/talent';

export const useTalent = () => {
  const queryClient = useQueryClient();

  // Jobs with 5-minute stale time
  const jobs = useQuery({
    queryKey: ['talent', 'jobs'],
    queryFn: () => talentApi.getJobs(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    select: (data) => data.data || data,
  });

  // Job statistics
  const jobStats = useQuery({
    queryKey: ['talent', 'jobs', 'statistics'],
    queryFn: talentApi.getJobStatistics,
    staleTime: 5 * 60 * 1000,
  });

  // My applications with 2-minute stale time
  const myApplications = useQuery({
    queryKey: ['talent', 'applications', 'me'],
    queryFn: talentApi.getMyApplications,
    staleTime: 2 * 60 * 1000,
  });

  // Pipeline statistics
  const pipelineStats = useQuery({
    queryKey: ['talent', 'applications', 'statistics'],
    queryFn: talentApi.getPipelineStatistics,
    staleTime: 5 * 60 * 1000,
  });

  // Apply for job with optimistic update
  const applyForJob = useMutation({
    mutationFn: ({ jobId, data }: { jobId: string | number; data: any }) =>
      talentApi.applyForJob(jobId, data),
    onMutate: async ({ jobId }) => {
      await queryClient.cancelQueries({ queryKey: ['talent', 'applications', 'me'] });
      const previous = queryClient.getQueryData(['talent', 'applications', 'me']);

      queryClient.setQueryData(['talent', 'applications', 'me'], (old: any) => [
        ...(old || []),
        {
          id: 'temp',
          job_opening_id: jobId,
          stage: 'applied',
          status: 'active',
          applied_date: new Date().toISOString(),
        },
      ]);

      return { previous };
    },
    onSuccess: () => {
      showSuccessToast('Application submitted successfully');
      queryClient.invalidateQueries({ queryKey: ['talent', 'applications'] });
      queryClient.invalidateQueries({ queryKey: ['talent', 'jobs'] });
    },
    onError: (err: any, _vars, context: any) => {
      queryClient.setQueryData(['talent', 'applications', 'me'], context?.previous);
      showErrorToast(err?.response?.data?.message || 'Failed to submit application');
    },
  });

  // Create job
  const createJob = useMutation({
    mutationFn: (data: Partial<JobOpening>) => talentApi.createJob(data),
    onSuccess: () => {
      showSuccessToast('Job opening created successfully');
      queryClient.invalidateQueries({ queryKey: ['talent', 'jobs'] });
    },
    onError: (err: any) => {
      showErrorToast(err?.response?.data?.message || 'Failed to create job opening');
    },
  });

  // Update job
  const updateJob = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: Partial<JobOpening> }) =>
      talentApi.updateJob(id, data),
    onSuccess: () => {
      showSuccessToast('Job opening updated successfully');
      queryClient.invalidateQueries({ queryKey: ['talent', 'jobs'] });
    },
    onError: (err: any) => {
      showErrorToast(err?.response?.data?.message || 'Failed to update job opening');
    },
  });

  // Delete job
  const deleteJob = useMutation({
    mutationFn: (id: string | number) => talentApi.deleteJob(id),
    onSuccess: () => {
      showSuccessToast('Job opening deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['talent', 'jobs'] });
    },
    onError: (err: any) => {
      showErrorToast(err?.response?.data?.message || 'Failed to delete job opening');
    },
  });

  // Update application stage
  const updateApplicationStage = useMutation({
    mutationFn: ({ id, stage }: { id: number; stage: string }) =>
      talentApi.updateApplicationStage(id, stage),
    onSuccess: () => {
      showSuccessToast('Application stage updated successfully');
      queryClient.invalidateQueries({ queryKey: ['talent', 'applications'] });
      queryClient.invalidateQueries({ queryKey: ['talent', 'jobs'] });
    },
    onError: (err: any) => {
      showErrorToast(err?.response?.data?.message || 'Failed to update application stage');
    },
  });

  return {
    // Data
    jobs: jobs.data || [],
    jobStats: jobStats.data,
    myApplications: myApplications.data || [],
    pipelineStats: pipelineStats.data,

    // Loading states
    isLoading: jobs.isLoading || myApplications.isLoading,
    isLoadingStats: jobStats.isLoading || pipelineStats.isLoading,

    // Mutations
    applyForJob,
    createJob,
    updateJob,
    deleteJob,
    updateApplicationStage,

    // Refetch functions
    refetch: {
      jobs: jobs.refetch,
      jobStats: jobStats.refetch,
      applications: myApplications.refetch,
      pipelineStats: pipelineStats.refetch,
    },
  };
};
