import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import GlassCard from '../components/GlassCard';
import LeaveStatsCard from '../components/leave/LeaveStatsCard';
import LeaveStatusBadge from '../components/leave/LeaveStatusBadge';
import {
  StatsCardSkeleton,
  TableRowSkeleton,
  PendingRequestSkeleton,
  BalanceRowSkeleton,
  PolicyCardSkeleton,
  HolidayCardSkeleton,
  CalendarSkeleton,
} from '../components/leave/LeaveSkeletons';
import { leaveApi } from '../services/leaveService';
import { LeaveRequest, LeaveRequestStatus } from '../types/leave';
import { format, parseISO } from 'date-fns';

const Leave: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('Leave Dashboard');
  const [selectedStatus, setSelectedStatus] = useState<LeaveRequestStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const perPage = 15;

  // ==================== QUERIES ====================

  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['leave-dashboard-stats'],
    queryFn: () => leaveApi.getDashboardStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: leaveTypes = [], isLoading: typesLoading } = useQuery({
    queryKey: ['leave-types'],
    queryFn: () => leaveApi.getLeaveTypes(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  const { data: requestsData, isLoading: requestsLoading } = useQuery({
    queryKey: ['leave-requests', selectedStatus, currentPage],
    queryFn: () =>
      leaveApi.getLeaveRequests({
        status: selectedStatus === 'all' ? undefined : selectedStatus,
        page: currentPage,
        per_page: perPage,
      }),
    enabled: activeTab === 'Leave Dashboard' || activeTab === 'Leave Requests',
  });

  const { data: balances = [], isLoading: balancesLoading } = useQuery({
    queryKey: ['leave-balances', new Date().getFullYear()],
    queryFn: () =>
      leaveApi.getLeaveBalances({
        year: new Date().getFullYear(),
      }),
    enabled: activeTab === 'Leave Dashboard',
  });

  // ==================== MUTATIONS ====================

  const approveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: number; notes?: string }) =>
      leaveApi.approveLeaveRequest(id, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['leave-dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
      toast.success('Leave request approved successfully');
    },
    onError: () => {
      toast.error('Failed to approve leave request');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      leaveApi.rejectLeaveRequest(id, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['leave-dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
      toast.success('Leave request rejected');
    },
    onError: () => {
      toast.error('Failed to reject leave request');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      leaveApi.cancelLeaveRequest(id, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['leave-dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
      toast.success('Leave request cancelled');
    },
    onError: () => {
      toast.error('Failed to cancel leave request');
    },
  });

  // ==================== HANDLERS ====================

  const handleApprove = (id: number) => {
    if (confirm('Are you sure you want to approve this leave request?')) {
      approveMutation.mutate({ id, notes: 'Approved as per company policy' });
    }
  };

  const handleReject = (id: number) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason) {
      rejectMutation.mutate({ id, reason });
    }
  };

  const handleCancel = (id: number) => {
    const reason = prompt('Please provide a reason for cancellation:');
    if (reason) {
      cancelMutation.mutate({ id, reason });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  const formatDateRange = (start: string, end: string) => {
    try {
      return `${format(parseISO(start), 'MMM dd')} - ${format(parseISO(end), 'MMM dd')}`;
    } catch {
      return `${start} - ${end}`;
    }
  };

  // ==================== COMPUTED VALUES ====================

  const requests = requestsData?.data || [];
  const requestsMeta = requestsData?.meta;
  const pendingRequests = requests.filter((r) => r.status === 'pending').slice(0, 5);

  const tabs = [
    'Leave Dashboard',
    'Leave Requests',
    'Leave Policies',
    'Absence Tracking',
    'Holiday Calendar',
  ];

  // ==================== RENDER ====================

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Leave Management
            </h2>
            <span className="text-slate-400 dark:text-slate-500 font-medium text-lg">{activeTab}</span>
          </div>
        </div>
        <button
          onClick={() => setShowApplyModal(true)}
          className="px-6 py-2.5 bg-[#f59e0b] hover:bg-[#d97706] text-white font-black text-[11px] uppercase tracking-widest rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-95"
        >
          Apply Leave &gt;
        </button>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-8 border-b border-slate-200 dark:border-white/5 pb-0 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 text-[10px] font-black uppercase tracking-widest relative transition-all whitespace-nowrap ${
              activeTab === tab ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#8252e9] shadow-[0_0_8px_#8252e9]" />
            )}
          </button>
        ))}
      </div>

      {/* Main Content Areas */}
      <div className="animate-in slide-in-from-bottom-2 duration-500">
        {activeTab === 'Leave Dashboard' && (
          <div className="space-y-6">
            {/* Summary Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {statsLoading ? (
                <>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StatsCardSkeleton key={i} />
                  ))}
                </>
              ) : (
                <>
                  <LeaveStatsCard
                    label="Employees on Leave Today"
                    value={dashboardStats?.on_leave_today || 0}
                    icon="📁"
                    color="border-l-emerald-500"
                    action="View List"
                  />
                  <LeaveStatsCard
                    label="Pending Leave Requests"
                    value={dashboardStats?.pending_requests || 0}
                    icon="📝"
                    color="border-l-amber-500"
                    action="View List"
                    onClick={() => {
                      setActiveTab('Leave Requests');
                      setSelectedStatus('pending');
                    }}
                  />
                  <LeaveStatsCard
                    label="Approved This Month"
                    value={dashboardStats?.approved_this_month || 0}
                    icon="🔥"
                    color="border-l-purple-500"
                  />
                  <LeaveStatsCard
                    label="Rejected This Month"
                    value={dashboardStats?.rejected_this_month || 0}
                    icon="🚫"
                    color="border-l-rose-500"
                  />
                  <LeaveStatsCard
                    label="Upcoming Leaves Next 7 Days"
                    value={dashboardStats?.upcoming_leaves || 0}
                    icon="📅"
                    color="border-l-blue-500"
                    action="View List"
                  />
                </>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8 space-y-6">
                {/* Leave Balance Overview */}
                <GlassCard
                  title="Leave Balance Overview"
                  action={
                    <button className="text-[10px] font-black text-[#8252e9] uppercase tracking-widest border border-[#8252e9]/20 px-3 py-1.5 rounded-lg">
                      Export CSV
                    </button>
                  }
                >
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-white/5">
                          <th className="px-4 py-4">Employee</th>
                          <th className="px-4 py-4">Department</th>
                          <th className="px-4 py-4">Leave Type</th>
                          <th className="px-4 py-4">Usage</th>
                          <th className="px-4 py-4 text-right">Available</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                        {balancesLoading ? (
                          <>
                            {Array.from({ length: 5 }).map((_, i) => (
                              <BalanceRowSkeleton key={i} />
                            ))}
                          </>
                        ) : balances.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">
                              No leave balances found
                            </td>
                          </tr>
                        ) : (
                          balances.slice(0, 10).map((balance) => (
                            <tr
                              key={balance.id}
                              className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                            >
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                                    {balance.employee?.full_name?.charAt(0) || 'E'}
                                  </div>
                                  <span className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">
                                    {balance.employee?.full_name || 'Unknown'}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-xs text-slate-500 dark:text-slate-400">
                                {balance.employee?.department?.name || 'N/A'}
                              </td>
                              <td className="px-4 py-4">
                                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                  {balance.leave_type?.name || 'Unknown'}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-xs font-bold text-slate-900 dark:text-white">
                                {balance.used} / {balance.total_allocated} days
                              </td>
                              <td className="px-4 py-4 text-xs text-right font-mono">
                                <span
                                  className={
                                    Number(balance.available) < 0
                                      ? 'text-rose-500 dark:text-rose-400'
                                      : 'text-emerald-600 dark:text-emerald-400'
                                  }
                                >
                                  {Number(balance.available).toFixed(1)} days
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </GlassCard>
              </div>

              <div className="lg:col-span-4 space-y-6">
                {/* Pending Requests */}
                <GlassCard
                  title="Pending Requests"
                  action={
                    <span className="text-slate-500 font-black text-sm">
                      {dashboardStats?.pending_requests || 0}
                    </span>
                  }
                >
                  <div className="space-y-4">
                    {requestsLoading ? (
                      <>
                        {Array.from({ length: 3 }).map((_, i) => (
                          <PendingRequestSkeleton key={i} />
                        ))}
                      </>
                    ) : pendingRequests.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 text-sm">
                        No pending requests
                      </div>
                    ) : (
                      pendingRequests.map((req) => (
                        <div
                          key={req.id}
                          className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold">
                              {req.employee?.full_name?.charAt(0) || 'E'}
                            </div>
                            <div>
                              <p className="text-[11px] font-black text-white">
                                {req.employee?.full_name || 'Unknown'}
                              </p>
                              <p className="text-[9px] text-slate-500 font-bold uppercase">
                                {formatDateRange(req.start_date, req.end_date)}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleApprove(req.id)}
                              disabled={approveMutation.isPending}
                              className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[8px] font-black rounded uppercase transition-colors disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(req.id)}
                              disabled={rejectMutation.isPending}
                              className="px-2 py-1 bg-rose-500 hover:bg-rose-600 text-white text-[8px] font-black rounded uppercase transition-colors disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </GlassCard>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Leave Requests' && (
          <GlassCard className="!p-0 overflow-hidden">
            <div className="p-4 border-b border-white/5 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-3">
                {(['all', 'pending', 'approved', 'rejected'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setSelectedStatus(s);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 border rounded-lg text-[10px] font-black uppercase transition-all ${
                      selectedStatus === s
                        ? 'bg-[#8252e9] border-[#8252e9] text-white'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {s === 'all' ? 'All Status' : s}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 bg-white/[0.01]">
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">Leave Type</th>
                    <th className="px-6 py-4">Duration</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Applied On</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {requestsLoading ? (
                    <>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <TableRowSkeleton key={i} />
                      ))}
                    </>
                  ) : requests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                        No leave requests found
                      </td>
                    </tr>
                  ) : (
                    requests.map((req) => (
                      <tr
                        key={req.id}
                        className="hover:bg-white/[0.02] transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                              {req.employee?.full_name?.charAt(0) || 'E'}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white tracking-tight">
                                {req.employee?.full_name || 'Unknown'}
                              </p>
                              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                                {req.employee?.department?.name || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-bold text-slate-300">
                            {req.leave_type?.name || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs font-black text-white">
                            {req.total_days} Days
                          </div>
                          <div className="text-[9px] text-slate-500 font-bold">
                            {formatDateRange(req.start_date, req.end_date)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <LeaveStatusBadge status={req.status} />
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400 font-mono tracking-tighter">
                          {formatDate(req.created_at)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {req.status === 'pending' && (
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleApprove(req.id)}
                                className="text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:underline"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(req.id)}
                                className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {requestsMeta && requestsMeta.last_page > 1 && (
              <div className="p-4 border-t border-white/5 flex justify-between items-center">
                <div className="text-xs text-slate-500">
                  Showing {requestsMeta.from} to {requestsMeta.to} of {requestsMeta.total}{' '}
                  requests
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 bg-white/5 border border-white/10 rounded text-[10px] font-bold text-slate-400 hover:text-white disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-[10px] font-bold text-white">
                    Page {currentPage} of {requestsMeta.last_page}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(requestsMeta.last_page, p + 1))}
                    disabled={currentPage === requestsMeta.last_page}
                    className="px-3 py-1 bg-white/5 border border-white/10 rounded text-[10px] font-bold text-slate-400 hover:text-white disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </GlassCard>
        )}

        {activeTab === 'Leave Policies' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {typesLoading ? (
              <>
                {Array.from({ length: 6 }).map((_, i) => (
                  <PolicyCardSkeleton key={i} />
                ))}
              </>
            ) : leaveTypes.length === 0 ? (
              <div className="col-span-full text-center py-12 text-slate-500">
                No leave policies configured
              </div>
            ) : (
              leaveTypes.map((policy, i) => {
                const colors = [
                  'border-t-blue-500',
                  'border-t-emerald-500',
                  'border-t-amber-500',
                  'border-t-purple-500',
                  'border-t-rose-500',
                  'border-t-slate-500',
                ];
                return (
                  <GlassCard key={policy.id} className={`border-t-4 ${colors[i % colors.length]}`}>
                    <h4 className="text-sm font-black text-white uppercase tracking-tight mb-4">
                      {policy.name}
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-slate-500 uppercase tracking-widest">
                          Yearly Quota
                        </span>
                        <span className="text-white">{policy.default_days_per_year} Days</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-slate-500 uppercase tracking-widest">
                          Accrual Method
                        </span>
                        <span className="text-slate-300 capitalize">
                          {policy.accrual_method.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-bold pb-4">
                        <span className="text-slate-500 uppercase tracking-widest">
                          Carry Forward
                        </span>
                        <span className="text-slate-300">
                          {policy.is_carry_forward
                            ? `Max ${policy.max_carry_forward_days || 0} days`
                            : 'Non-cumulative'}
                        </span>
                      </div>
                      <button className="w-full pt-4 border-t border-white/5 text-[10px] font-black text-[#8252e9] uppercase tracking-widest hover:text-white transition-colors">
                        View Policy Details
                      </button>
                    </div>
                  </GlassCard>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'Absence Tracking' && (
          <div className="space-y-6">
            <div className="text-center py-12 text-slate-500">
              <div className="text-4xl mb-4">📊</div>
              <p className="text-lg font-bold">Absence Tracking Coming Soon</p>
              <p className="text-sm mt-2">
                Advanced analytics and absence patterns will be available here
              </p>
            </div>
          </div>
        )}

        {activeTab === 'Holiday Calendar' && (
          <div className="space-y-6">
            <div className="text-center py-12 text-slate-500">
              <div className="text-4xl mb-4">📅</div>
              <p className="text-lg font-bold">Holiday Calendar Coming Soon</p>
              <p className="text-sm mt-2">
                View and manage company holidays and observances
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leave;
