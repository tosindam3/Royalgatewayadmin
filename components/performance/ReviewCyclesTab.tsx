import React, { useState, useEffect } from 'react';
import GlassCard from '../GlassCard';
import { ReviewCycle, EvaluationTemplate } from '../../types/performance';
import performanceService from '../../services/performanceService';
import Skeleton from '../Skeleton';

interface ReviewCyclesTabProps {
  onNotify?: (title: string, message: string, type: string) => void;
}

const ReviewCyclesTab: React.FC<ReviewCyclesTabProps> = ({ onNotify }) => {
  const [cycles, setCycles] = useState<ReviewCycle[]>([]);
  const [templates, setTemplates] = useState<EvaluationTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<ReviewCycle | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loadingDetailsId, setLoadingDetailsId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    template_id: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [cyclesData, templatesData] = await Promise.all([
        performanceService.fetchCycles(),
        performanceService.fetchTemplates(),
      ]);
      setCycles(cyclesData);
      setTemplates(templatesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.start_date || !formData.end_date || !formData.template_id) {
      return;
    }

    try {
      setIsCreating(true);
      const newCycle = await performanceService.createCycle({
        name: formData.name,
        description: formData.description,
        start_date: formData.start_date,
        end_date: formData.end_date,
        template_id: parseInt(formData.template_id),
      });

      setCycles(prev => [newCycle, ...prev]);
      setShowCreateModal(false);
      setFormData({ name: '', description: '', start_date: '', end_date: '', template_id: '' });

      if (onNotify) {
        onNotify('Review Cycle Created', `${newCycle.name} has been created successfully.`, 'success');
      }
    } catch (error) {
      console.error('Failed to create cycle:', error);
      if (onNotify) {
        onNotify('Error', 'Failed to create review cycle.', 'error');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleLaunchCycle = async (cycle: ReviewCycle) => {
    try {
      // For now, launch with all active employees (this would be a modal in real implementation)
      await performanceService.launchCycle(cycle.id, [1, 2, 3, 4, 5]); // Mock employee IDs

      // Update local state
      setCycles(prev => prev.map(c =>
        c.id === cycle.id ? { ...c, status: 'active' as const } : c
      ));

      if (onNotify) {
        onNotify('Cycle Launched', `${cycle.name} has been launched successfully.`, 'success');
      }
    } catch (error) {
      console.error('Failed to launch cycle:', error);
      if (onNotify) {
        onNotify('Error', 'Failed to launch review cycle.', 'error');
      }
    }
  };

  const handleViewDetails = async (cycle: ReviewCycle) => {
    try {
      setLoadingDetailsId(cycle.id);
      // Simulate/Real fetch for deeper details if needed
      await new Promise(resolve => setTimeout(resolve, 800));
      setSelectedCycle(cycle);
    } catch (error) {
      console.error('Failed to load details:', error);
    } finally {
      setLoadingDetailsId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/10 text-emerald-400';
      case 'closed': return 'bg-slate-500/10 text-slate-400';
      default: return 'bg-blue-500/10 text-blue-400';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton variant="text" width={180} height={32} />
          <Skeleton variant="rectangle" width={120} height={40} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <GlassCard key={i} className="relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <Skeleton variant="text" width="60%" height={24} />
                <Skeleton variant="rectangle" width={50} height={20} />
              </div>
              <Skeleton variant="text" width="90%" height={14} className="mb-2" />
              <Skeleton variant="text" width="70%" height={14} className="mb-4" />
              <div className="space-y-3 mb-4">
                <div className="flex justify-between"><Skeleton variant="text" width="30%" height={10} /><Skeleton variant="text" width="40%" height={10} /></div>
                <div className="flex justify-between"><Skeleton variant="text" width="30%" height={10} /><Skeleton variant="text" width="40%" height={10} /></div>
              </div>
              <div className="flex gap-2">
                <Skeleton variant="rectangle" width="100%" height={32} />
                <Skeleton variant="rectangle" width="100%" height={32} />
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
          <h3 className="text-2xl font-black text-white">Review Cycles</h3>
          <p className="text-xs text-slate-400 mt-1">Manage performance review cycles and track progress</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-[#8252e9] text-white font-black text-[11px] uppercase tracking-widest rounded-xl shadow-lg shadow-purple-500/20 hover:bg-[#6d39e0] transition-all"
        >
          + Create Cycle
        </button>
      </div>

      {cycles.length === 0 ? (
        <GlassCard className="text-center py-12">
          <div className="text-6xl mb-4">🔄</div>
          <h4 className="text-xl font-bold text-white mb-2">No Review Cycles</h4>
          <p className="text-slate-400 mb-6">Create your first performance review cycle to get started</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-[#8252e9] text-white font-bold text-sm rounded-xl hover:bg-[#6d39e0] transition-all"
          >
            Create First Cycle
          </button>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cycles.map((cycle) => (
            <GlassCard key={cycle.id} className="relative">
              <div className="flex justify-between items-start mb-4">
                <h4 className="text-lg font-bold text-white">{cycle.name}</h4>
                <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${getStatusColor(cycle.status)}`}>
                  {cycle.status}
                </span>
              </div>

              {cycle.description && (
                <p className="text-sm text-slate-300 mb-4">{cycle.description}</p>
              )}

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Start Date:</span>
                  <span className="text-white">{formatDate(cycle.start_date)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">End Date:</span>
                  <span className="text-white">{formatDate(cycle.end_date)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Template:</span>
                  <span className="text-white">{cycle.template?.title || 'N/A'}</span>
                </div>
                {cycle.completion_rate !== undefined && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Progress:</span>
                    <span className="text-white">{cycle.completion_rate}%</span>
                  </div>
                )}
              </div>

              {cycle.completion_rate !== undefined && (
                <div className="mb-4">
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#8252e9] transition-all duration-500"
                      style={{ width: `${cycle.completion_rate}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                {cycle.status === 'draft' && (
                  <button
                    onClick={() => handleLaunchCycle(cycle)}
                    className="flex-1 px-3 py-2 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-lg hover:bg-emerald-500/20 transition-all"
                  >
                    Launch
                  </button>
                )}
                <button
                  onClick={() => handleViewDetails(cycle)}
                  disabled={loadingDetailsId === cycle.id}
                  className="flex-1 px-3 py-2 bg-white/5 text-white text-xs font-bold rounded-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  {loadingDetailsId === cycle.id ? (
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'View Details'
                  )}
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Create Cycle Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md">
          <div className="absolute inset-0" onClick={() => setShowCreateModal(false)} />
          <div className="max-w-md w-full bg-[#0d0a1a] rounded-[32px] p-8 border border-white/10 shadow-2xl relative z-10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-white">Create Review Cycle</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" strokeWidth="2" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateCycle} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">Cycle Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#8252e9] transition-all"
                  placeholder="Q1 2026 Performance Review"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#8252e9] transition-all resize-none"
                  rows={3}
                  placeholder="Optional description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#8252e9] transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">End Date</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#8252e9] transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">Evaluation Template</label>
                <select
                  value={formData.template_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, template_id: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#8252e9] transition-all"
                  required
                >
                  <option value="">Select a template</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id} className="bg-[#0d0a1a]">
                      {template.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 bg-white/5 text-slate-300 font-bold text-sm rounded-xl hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 py-3 bg-[#8252e9] text-white font-bold text-sm rounded-xl hover:bg-[#6d39e0] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Cycle'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Cycle Details View/Modal */}
      {selectedCycle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md">
          <div className="absolute inset-0" onClick={() => setSelectedCycle(null)} />
          <div className="max-w-2xl w-full bg-[#0d0a1a] rounded-[32px] p-8 border border-white/10 shadow-2xl relative z-10 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-black text-white">{selectedCycle.name}</h3>
                <span className={`mt-2 inline-block px-2 py-1 rounded text-[10px] font-black uppercase ${getStatusColor(selectedCycle.status)}`}>
                  {selectedCycle.status}
                </span>
              </div>
              <button
                onClick={() => setSelectedCycle(null)}
                className="p-2 bg-white/5 rounded-full text-slate-400 hover:text-white transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" strokeWidth="2" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Timeline</p>
                  <p className="text-sm text-slate-300">{formatDate(selectedCycle.start_date)} - {formatDate(selectedCycle.end_date)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Template</p>
                  <p className="text-sm text-slate-300">{selectedCycle.template?.title || 'N/A'}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Completion Progress</p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#8252e9]"
                      style={{ width: `${selectedCycle.completion_rate || 0}%` }}
                    />
                  </div>
                  <span className="text-xl font-black text-white">{selectedCycle.completion_rate || 0}%</span>
                </div>
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 mb-8">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Description</p>
              <p className="text-sm text-slate-300 leading-relaxed italic">
                {selectedCycle.description || 'No description provided for this review cycle.'}
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setSelectedCycle(null)}
                className="flex-1 py-4 bg-white/5 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-all"
              >
                Close View
              </button>
              {selectedCycle.status === 'draft' && (
                <button
                  onClick={() => { handleLaunchCycle(selectedCycle); setSelectedCycle(null); }}
                  className="flex-1 py-4 bg-[#8252e9] text-white font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-[#6d39e0] transition-all shadow-lg shadow-purple-500/20"
                >
                  Launch Cycle Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewCyclesTab;