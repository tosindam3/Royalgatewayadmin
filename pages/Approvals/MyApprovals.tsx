import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { approvalService, ApprovalRequest } from '../../services/approvalService';
import GlassCard from '../../components/GlassCard';
import Button from '../../components/ui/Button';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { toast } from 'sonner';

const MyApprovals: React.FC = () => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
    const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
    const [actionComment, setActionComment] = useState('');
    const [showActionModal, setShowActionModal] = useState<'approve' | 'reject' | null>(null);

    const { data: statistics, isLoading: isStatsLoading } = useQuery({
        queryKey: ['approval-statistics'],
        queryFn: () => approvalService.getStatistics()
    });

    const { data: pendingApprovals, isLoading: isPendingLoading } = useQuery({
        queryKey: ['pending-approvals'],
        queryFn: () => approvalService.getPendingApprovals(),
        enabled: activeTab === 'pending'
    });

    const { data: historyData, isLoading: isHistoryLoading } = useQuery({
        queryKey: ['approval-history'],
        queryFn: () => approvalService.getHistory(),
        enabled: activeTab === 'history'
    });

    const approveMutation = useMutation({
        mutationFn: ({ id, comment }: { id: number; comment?: string }) =>
            approvalService.approve(id, comment),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
            queryClient.invalidateQueries({ queryKey: ['approval-statistics'] });
            queryClient.invalidateQueries({ queryKey: ['approval-history'] });
            toast.success('Request Approved', { description: 'The request has been approved successfully.' });
            setShowActionModal(null);
            setSelectedRequest(null);
            setActionComment('');
        },
        onError: (error: any) => {
            toast.error('Failed to approve', { description: error.message });
        }
    });

    const rejectMutation = useMutation({
        mutationFn: ({ id, comment }: { id: number; comment: string }) =>
            approvalService.reject(id, comment),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
            queryClient.invalidateQueries({ queryKey: ['approval-statistics'] });
            queryClient.invalidateQueries({ queryKey: ['approval-history'] });
            toast.success('Request Rejected', { description: 'The request has been rejected.' });
            setShowActionModal(null);
            setSelectedRequest(null);
            setActionComment('');
        },
        onError: (error: any) => {
            toast.error('Failed to reject', { description: error.message });
        }
    });

    const handleApprove = () => {
        if (selectedRequest) {
            approveMutation.mutate({ id: selectedRequest.id, comment: actionComment });
        }
    };

    const handleReject = () => {
        if (selectedRequest && actionComment.trim()) {
            rejectMutation.mutate({ id: selectedRequest.id, comment: actionComment });
        } else {
            toast.error('Comment required', { description: 'Please provide a reason for rejection.' });
        }
    };

    const getStatusColor = (status: string) => {
        const colors = {
            pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
            approved: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
            rejected: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
            cancelled: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
        };
        return colors[status as keyof typeof colors] || colors.pending;
    };

    const tabs = [
        { key: 'pending', label: 'Pending Approvals', count: statistics?.pending_approvals || 0 },
        { key: 'history', label: 'History', count: null },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
                    My <span className="text-purple-500">Approvals</span>
                </h1>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-2 italic">
                    Approval Request Management Hub
                </p>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {isStatsLoading ? (
                    <>
                        <CardSkeleton /> <CardSkeleton /> <CardSkeleton /> <CardSkeleton />
                    </>
                ) : (
                    <>
                        <GlassCard className="!p-6 border-l-4 border-l-amber-500">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Pending</p>
                            <p className="text-2xl font-black text-amber-500">{statistics?.pending_approvals || 0}</p>
                        </GlassCard>
                        <GlassCard className="!p-6 border-l-4 border-l-blue-500">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">My Requests</p>
                            <p className="text-2xl font-black text-blue-500">{statistics?.my_pending_requests || 0}</p>
                        </GlassCard>
                        <GlassCard className="!p-6 border-l-4 border-l-emerald-500">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Approved</p>
                            <p className="text-2xl font-black text-emerald-500">{statistics?.approved_by_me || 0}</p>
                        </GlassCard>
                        <GlassCard className="!p-6 border-l-4 border-l-rose-500">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Rejected</p>
                            <p className="text-2xl font-black text-rose-500">{statistics?.rejected_by_me || 0}</p>
                        </GlassCard>
                    </>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-8 border-b border-white/5">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as any)}
                        className={`pb-4 text-[10px] font-black uppercase tracking-[0.2em] relative transition-all flex items-center gap-2 ${
                            activeTab === tab.key ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        {tab.label}
                        {tab.count !== null && (
                            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-500 text-[8px] font-black">
                                {tab.count}
                            </span>
                        )}
                        {activeTab === tab.key && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.5)]" />
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="animate-in slide-in-from-bottom-2 duration-500">
                {activeTab === 'pending' && (
                    <div className="space-y-4">
                        {isPendingLoading ? (
                            <>
                                <CardSkeleton /> <CardSkeleton /> <CardSkeleton />
                            </>
                        ) : pendingApprovals && pendingApprovals.length > 0 ? (
                            pendingApprovals.map((request) => (
                                <GlassCard key={request.id} className="!p-6 hover:bg-white/[0.05] transition-all">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-xs font-black text-purple-500">
                                                    {request.request_number}
                                                </span>
                                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border ${getStatusColor(request.status)}`}>
                                                    {request.status}
                                                </span>
                                                <span className="text-[9px] text-slate-500 font-bold uppercase">
                                                    Step {request.current_step}
                                                </span>
                                            </div>
                                            <h3 className="text-sm font-bold text-white mb-1">
                                                {request.workflow?.name}
                                            </h3>
                                            <p className="text-xs text-slate-400 mb-3">
                                                Requested by {request.requester?.name} • {new Date(request.submitted_at).toLocaleDateString()}
                                            </p>
                                            {request.requester_comment && (
                                                <p className="text-xs text-slate-300 italic bg-white/5 p-3 rounded-lg">
                                                    "{request.requester_comment}"
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedRequest(request);
                                                    setShowActionModal('approve');
                                                }}
                                                className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500"
                                            >
                                                Approve
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedRequest(request);
                                                    setShowActionModal('reject');
                                                }}
                                                className="text-rose-500 hover:bg-rose-500/10"
                                            >
                                                Reject
                                            </Button>
                                        </div>
                                    </div>
                                </GlassCard>
                            ))
                        ) : (
                            <div className="text-center py-20">
                                <p className="text-slate-500 text-sm font-bold uppercase italic">
                                    No pending approvals
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="space-y-4">
                        {isHistoryLoading ? (
                            <>
                                <CardSkeleton /> <CardSkeleton /> <CardSkeleton />
                            </>
                        ) : historyData?.data && historyData.data.length > 0 ? (
                            historyData.data.map((request) => (
                                <GlassCard key={request.id} className="!p-6">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-xs font-black text-purple-500">
                                                    {request.request_number}
                                                </span>
                                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border ${getStatusColor(request.status)}`}>
                                                    {request.status}
                                                </span>
                                            </div>
                                            <h3 className="text-sm font-bold text-white mb-1">
                                                {request.workflow?.name}
                                            </h3>
                                            <p className="text-xs text-slate-400">
                                                {new Date(request.submitted_at).toLocaleDateString()} - {request.completed_at ? new Date(request.completed_at).toLocaleDateString() : 'In Progress'}
                                            </p>
                                        </div>
                                    </div>
                                </GlassCard>
                            ))
                        ) : (
                            <div className="text-center py-20">
                                <p className="text-slate-500 text-sm font-bold uppercase italic">
                                    No approval history
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Action Modal */}
            {showActionModal && selectedRequest && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="absolute inset-0" onClick={() => setShowActionModal(null)} />
                    <div className="w-full max-w-md bg-white dark:bg-[#0d0a1a] shadow-2xl rounded-[32px] border border-slate-200 dark:border-white/10 animate-in zoom-in-95 duration-300 p-8 relative">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic mb-2">
                            {showActionModal === 'approve' ? 'Approve' : 'Reject'} <span className="text-purple-500">Request</span>
                        </h3>
                        <p className="text-xs text-slate-500 mb-6">
                            {selectedRequest.request_number} - {selectedRequest.workflow?.name}
                        </p>

                        <div className="mb-6">
                            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">
                                Comment {showActionModal === 'reject' && <span className="text-rose-500">*</span>}
                            </label>
                            <textarea
                                value={actionComment}
                                onChange={(e) => setActionComment(e.target.value)}
                                placeholder={showActionModal === 'approve' ? 'Optional comment...' : 'Reason for rejection...'}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 min-h-[100px]"
                            />
                        </div>

                        <div className="flex gap-3">
                            <Button
                                onClick={showActionModal === 'approve' ? handleApprove : handleReject}
                                isLoading={approveMutation.isPending || rejectMutation.isPending}
                                className={showActionModal === 'approve' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600'}
                            >
                                {showActionModal === 'approve' ? 'Approve' : 'Reject'}
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setShowActionModal(null);
                                    setActionComment('');
                                }}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyApprovals;
