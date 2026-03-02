import React, { useState, useEffect } from 'react';
import GlassCard from '../GlassCard';
import { EvaluationResponse } from '../../types/performance';
import performanceService from '../../services/performanceService';
import Skeleton from '../Skeleton';

interface AppraisalsTabProps {
  onNotify?: (title: string, message: string, type: string) => void;
}

const AppraisalsTab: React.FC<AppraisalsTabProps> = ({ onNotify }) => {
  const [evaluations, setEvaluations] = useState<EvaluationResponse[]>([]);
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'completed' | 'needs_review'>('all');
  const [selectedEvaluation, setSelectedEvaluation] = useState<EvaluationResponse | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeFilter]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [evaluationsData, reviewsData] = await Promise.all([
        performanceService.fetchEvaluations(
          activeFilter !== 'all' ? { status: activeFilter } : {}
        ),
        performanceService.fetchPendingReviews()
      ]);
      setEvaluations(evaluationsData);
      setPendingReviews(reviewsData);
    } catch (error) {
      console.error('Failed to load appraisals data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (evaluation: EvaluationResponse) => {
    try {
      setIsProcessing(true);
      await performanceService.approveEvaluation(evaluation.id, feedback);

      setEvaluations(prev => prev.map(e =>
        e.id === evaluation.id
          ? { ...e, status: 'approved' as const, feedback }
          : e
      ));

      setShowFeedbackModal(false);
      setSelectedEvaluation(null);
      setFeedback('');

      if (onNotify) {
        onNotify('Evaluation Approved', `${evaluation.employee?.first_name}'s evaluation has been approved.`, 'success');
      }
    } catch (error) {
      console.error('Failed to approve evaluation:', error);
      if (onNotify) {
        onNotify('Error', 'Failed to approve evaluation.', 'error');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (evaluation: EvaluationResponse) => {
    if (!feedback.trim()) {
      if (onNotify) {
        onNotify('Feedback Required', 'Please provide feedback when rejecting an evaluation.', 'warning');
      }
      return;
    }

    try {
      setIsProcessing(true);
      await performanceService.rejectEvaluation(evaluation.id, feedback);

      setEvaluations(prev => prev.map(e =>
        e.id === evaluation.id
          ? { ...e, status: 'rejected' as const, feedback }
          : e
      ));

      setShowFeedbackModal(false);
      setSelectedEvaluation(null);
      setFeedback('');

      if (onNotify) {
        onNotify('Evaluation Rejected', `${evaluation.employee?.first_name}'s evaluation has been rejected.`, 'warning');
      }
    } catch (error) {
      console.error('Failed to reject evaluation:', error);
      if (onNotify) {
        onNotify('Error', 'Failed to reject evaluation.', 'error');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-emerald-500/10 text-emerald-400';
      case 'rejected': return 'bg-red-500/10 text-red-400';
      case 'submitted': return 'bg-blue-500/10 text-blue-400';
      case 'submitted_to_manager': return 'bg-yellow-500/10 text-yellow-400';
      case 'submitted_to_admin': return 'bg-purple-500/10 text-purple-400';
      default: return 'bg-slate-500/10 text-slate-400';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400';
    if (score >= 80) return 'text-blue-400';
    if (score >= 70) return 'text-yellow-400';
    if (score >= 60) return 'text-orange-400';
    return 'text-red-400';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton variant="text" width={220} height={32} />
        </div>
        <div className="flex gap-2 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rectangle" width={100} height={36} />
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <GlassCard key={i} className="relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <Skeleton variant="rectangle" width={48} height={48} />
                  <div className="space-y-2">
                    <Skeleton variant="text" width={140} height={16} />
                    <Skeleton variant="text" width={100} height={10} />
                  </div>
                </div>
                <Skeleton variant="rectangle" width={60} height={20} />
              </div>
              <Skeleton variant="rectangle" width="100%" height={80} className="mb-4" />
              <div className="flex gap-2">
                <Skeleton variant="rectangle" width="100%" height={36} />
                <Skeleton variant="rectangle" width={80} height={36} />
                <Skeleton variant="rectangle" width={80} height={36} />
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-black text-white">Performance Appraisals</h3>
          <p className="text-xs text-slate-400 mt-1">Review and approve employee evaluations</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-bold text-white">{pendingReviews.length}</div>
            <div className="text-xs text-slate-400">Pending Reviews</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-white/5 pb-4">
        {[
          { key: 'all', label: 'All Appraisals', icon: '📋' },
          { key: 'needs_review', label: 'Needs Review', icon: '⏳' },
          { key: 'completed', label: 'Completed', icon: '✅' },
          { key: 'pending', label: 'Pending', icon: '🔄' },
        ].map((filter) => (
          <button
            key={filter.key}
            onClick={() => setActiveFilter(filter.key as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeFilter === filter.key
                ? 'bg-[#8252e9] text-white'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
          >
            <span>{filter.icon}</span>
            {filter.label}
          </button>
        ))}
      </div>

      {evaluations.length === 0 ? (
        <GlassCard className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h4 className="text-xl font-bold text-white mb-2">No Appraisals Found</h4>
          <p className="text-slate-400">
            {activeFilter === 'all'
              ? 'No performance appraisals available yet'
              : `No ${activeFilter.replace('_', ' ')} appraisals found`
            }
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {evaluations.map((evaluation) => (
            <GlassCard key={evaluation.id} className="relative">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg border border-white/10 bg-gradient-to-br from-[#8252e9] to-[#6d39e0] flex items-center justify-center text-white text-sm font-bold">
                    {evaluation.employee?.first_name?.[0]}{evaluation.employee?.last_name?.[0]}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">
                      {evaluation.employee?.first_name} {evaluation.employee?.last_name}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {evaluation.employee?.department?.name} • {evaluation.template?.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      Submitted: {evaluation.submitted_at ? formatDate(evaluation.submitted_at) : 'Draft'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {evaluation.calculated_score && (
                    <div className="text-right">
                      <div className={`text-2xl font-black ${getScoreColor(evaluation.calculated_score)}`}>
                        {evaluation.calculated_score}%
                      </div>
                      <div className="text-xs text-slate-400">Score</div>
                    </div>
                  )}
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${getStatusColor(evaluation.status)}`}>
                    {evaluation.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {evaluation.feedback && (
                <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
                  <h5 className="text-sm font-bold text-white mb-2">Feedback</h5>
                  <p className="text-sm text-slate-300">{evaluation.feedback}</p>
                </div>
              )}

              {/* Evaluation Answers Preview */}
              {evaluation.answers && Object.keys(evaluation.answers).length > 0 && (
                <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
                  <h5 className="text-sm font-bold text-white mb-2">Response Summary</h5>
                  <div className="space-y-2">
                    {Object.entries(evaluation.answers).slice(0, 2).map(([key, value]) => (
                      <div key={key} className="text-xs">
                        <span className="text-slate-400">{key}:</span>
                        <span className="text-slate-300 ml-2">
                          {typeof value === 'string' ? value.substring(0, 100) + (value.length > 100 ? '...' : '') : String(value)}
                        </span>
                      </div>
                    ))}
                    {Object.keys(evaluation.answers).length > 2 && (
                      <p className="text-xs text-slate-500">
                        +{Object.keys(evaluation.answers).length - 2} more responses
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedEvaluation(evaluation)}
                  className="flex-1 px-3 py-2 bg-white/5 text-white text-xs font-bold rounded-lg hover:bg-white/10 transition-all"
                >
                  View Details
                </button>

                {['submitted', 'submitted_to_manager', 'submitted_to_admin'].includes(evaluation.status) && (
                  <>
                    <button
                      onClick={() => {
                        setSelectedEvaluation(evaluation);
                        setShowFeedbackModal(true);
                      }}
                      className="px-4 py-2 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-lg hover:bg-emerald-500/20 transition-all"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setSelectedEvaluation(evaluation);
                        setShowFeedbackModal(true);
                      }}
                      className="px-4 py-2 bg-red-500/10 text-red-400 text-xs font-bold rounded-lg hover:bg-red-500/20 transition-all"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && selectedEvaluation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md">
          <div className="absolute inset-0" onClick={() => setShowFeedbackModal(false)} />
          <div className="max-w-md w-full bg-[#0d0a1a] rounded-[32px] p-8 border border-white/10 shadow-2xl relative z-10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-white">Review Evaluation</h3>
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="text-slate-400 hover:text-white transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" strokeWidth="2" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg border border-white/10 bg-gradient-to-br from-[#8252e9] to-[#6d39e0] flex items-center justify-center text-white text-sm font-bold">
                  {selectedEvaluation.employee?.first_name?.[0]}{selectedEvaluation.employee?.last_name?.[0]}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">
                    {selectedEvaluation.employee?.first_name} {selectedEvaluation.employee?.last_name}
                  </h4>
                  <p className="text-xs text-slate-400">{selectedEvaluation.template?.title}</p>
                </div>
              </div>

              {selectedEvaluation.calculated_score && (
                <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className={`text-3xl font-black ${getScoreColor(selectedEvaluation.calculated_score)}`}>
                    {selectedEvaluation.calculated_score}%
                  </div>
                  <div className="text-xs text-slate-400">Overall Score</div>
                </div>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-300 mb-2">Feedback (Optional for approval, required for rejection)</label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#8252e9] transition-all resize-none"
                rows={4}
                placeholder="Provide feedback on the evaluation..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="flex-1 py-3 bg-white/5 text-slate-300 font-bold text-sm rounded-xl hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(selectedEvaluation)}
                disabled={isProcessing}
                className="flex-1 py-3 bg-red-500/20 text-red-400 font-bold text-sm rounded-xl hover:bg-red-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Reject'}
              </button>
              <button
                onClick={() => handleApprove(selectedEvaluation)}
                disabled={isProcessing}
                className="flex-1 py-3 bg-emerald-500/20 text-emerald-400 font-bold text-sm rounded-xl hover:bg-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppraisalsTab;