import React, { useState, useEffect } from 'react';
import GlassCard from '../GlassCard';
import { Goal, PerformanceKeyResult } from '../../types/performance';
import performanceService from '../../services/performanceService';
import { suggestKeyResults } from '../../services/geminiService';
import Skeleton from '../Skeleton';

interface GoalsTabProps {
  onNotify?: (title: string, message: string, type: string) => void;
}

const GoalsTab: React.FC<GoalsTabProps> = ({ onNotify }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'company' | 'department' | 'team' | 'individual'>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [isAiArchitecting, setIsAiArchitecting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'individual' as const,
    start_date: '',
    end_date: '',
    key_results: [
      { description: '', target_value: '', unit: '', weight: 100 }
    ]
  });

  useEffect(() => {
    loadGoals();
  }, [activeFilter]);

  const loadGoals = async () => {
    try {
      setIsLoading(true);
      const filters = activeFilter !== 'all' ? { type: activeFilter } : {};
      const goalsData = await performanceService.fetchGoals(filters);
      setGoals(goalsData);
    } catch (error) {
      console.error('Failed to load goals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.start_date || !formData.end_date) {
      return;
    }

    try {
      setIsCreating(true);
      const newGoal = await performanceService.createGoal({
        title: formData.title,
        description: formData.description,
        owner_id: 1, // This would come from current user context
        type: formData.type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        key_results: formData.key_results
          .filter(kr => kr.description && kr.target_value)
          .map(kr => ({
            description: kr.description,
            target_value: parseFloat(kr.target_value),
            unit: kr.unit || 'units',
            weight: kr.weight
          }))
      });

      setGoals(prev => [newGoal, ...prev]);
      setShowCreateModal(false);
      resetForm();

      if (onNotify) {
        onNotify('Goal Created', `${newGoal.title} has been created successfully.`, 'success');
      }
    } catch (error) {
      console.error('Failed to create goal:', error);
      if (onNotify) {
        onNotify('Error', 'Failed to create goal.', 'error');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleAiArchitect = async () => {
    if (!formData.title.trim()) {
      if (onNotify) onNotify('Input Required', 'Please enter a goal title for AI to architect.', 'warning');
      return;
    }

    setIsAiArchitecting(true);
    try {
      const krs = await suggestKeyResults(formData.title);
      if (krs && krs.length > 0) {
        setFormData(prev => ({
          ...prev,
          key_results: krs.map((kr: any) => ({
            description: kr.description,
            target_value: kr.targetValue.toString(),
            unit: kr.unit,
            weight: Math.floor(100 / krs.length)
          }))
        }));
        if (onNotify) onNotify('AI Architect', 'Key results suggested based on your goal title.', 'success');
      }
    } catch (error) {
      console.error("AI Architect failed:", error);
      if (onNotify) onNotify('AI Error', 'Failed to generate suggestions. Please try manual entry.', 'error');
    } finally {
      setIsAiArchitecting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'individual',
      start_date: '',
      end_date: '',
      key_results: [{ description: '', target_value: '', unit: '', weight: 100 }]
    });
  };

  const addKeyResult = () => {
    setFormData(prev => ({
      ...prev,
      key_results: [...prev.key_results, { description: '', target_value: '', unit: '', weight: 100 }]
    }));
  };

  const removeKeyResult = (index: number) => {
    setFormData(prev => ({
      ...prev,
      key_results: prev.key_results.filter((_, i) => i !== index)
    }));
  };

  const updateKeyResult = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      key_results: prev.key_results.map((kr, i) =>
        i === index ? { ...kr, [field]: value } : kr
      )
    }));
  };

  const handleUpdateKeyResult = async (goalId: number, keyResultId: number, currentValue: number, note?: string) => {
    try {
      await performanceService.updateKeyResult(goalId, keyResultId, currentValue, note);

      // Refresh goals to get updated progress
      loadGoals();

      if (onNotify) {
        onNotify('Progress Updated', 'Key result progress has been updated.', 'success');
      }
    } catch (error) {
      console.error('Failed to update key result:', error);
      if (onNotify) {
        onNotify('Error', 'Failed to update progress.', 'error');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/10 text-emerald-400';
      case 'completed': return 'bg-blue-500/10 text-blue-400';
      case 'cancelled': return 'bg-red-500/10 text-red-400';
      default: return 'bg-slate-500/10 text-slate-400';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-emerald-500';
    if (progress >= 60) return 'bg-yellow-500';
    if (progress >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'company': return '🏢';
      case 'department': return '🏬';
      case 'team': return '👥';
      default: return '👤';
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
          <Skeleton variant="rectangle" width={120} height={42} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <GlassCard key={i} className="!p-4 overflow-hidden relative">
              <Skeleton variant="text" width="50%" height={10} className="mb-2" />
              <div className="flex items-baseline gap-2">
                <Skeleton variant="text" width="30%" height={24} />
                <Skeleton variant="text" width="40%" height={10} />
              </div>
            </GlassCard>
          ))}
        </div>
        <div className="flex gap-2 mb-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="rectangle" width={80} height={32} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-9 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <GlassCard key={i} className="relative overflow-hidden">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-60 space-y-4">
                    <div className="flex items-center gap-3">
                      <Skeleton variant="rectangle" width={40} height={40} />
                      <div className="space-y-2">
                        <Skeleton variant="text" width={80} height={12} />
                        <Skeleton variant="text" width={50} height={8} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Skeleton variant="text" width="40%" height={10} />
                      <Skeleton variant="text" width="60%" height={12} />
                    </div>
                  </div>
                  <div className="flex-1 space-y-4">
                    <Skeleton variant="text" width="70%" height={20} />
                    <Skeleton variant="text" width="90%" height={12} />
                    <Skeleton variant="rectangle" width="100%" height={12} />
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
          <aside className="lg:col-span-3 space-y-4">
            <Skeleton variant="rectangle" width="100%" height={120} />
            <Skeleton variant="rectangle" width="100%" height={80} />
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-black text-white">Goals & OKRs</h3>
          <p className="text-xs text-slate-400 mt-1">Objectives and Key Results for strategic alignment</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-[#8252e9] text-white font-black text-[11px] uppercase tracking-widest rounded-xl shadow-lg shadow-purple-500/20 hover:bg-[#6d39e0] transition-all"
        >
          + Create Goal
        </button>
      </div>

      {/* Stats Row Ported from Goals.tsx */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { l: 'Completion Rate', v: '72%', d: 'Org-wide average', c: 'text-[#8252e9]' },
          { l: 'Strategic Impact', v: 'High', d: 'Alignment health', c: 'text-emerald-400' },
          { l: 'Behind Schedule', v: '4', d: 'Objectives at risk', c: 'text-rose-400' },
          { l: 'Days Remaining', v: '42', d: 'Cycle Q2 2024', c: 'text-blue-400' }
        ].map((s, i) => (
          <GlassCard key={i} className="!p-4 hover:border-white/20 transition-all group">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-300 transition-colors">{s.l}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-2xl font-black ${s.c}`}>{s.v}</span>
              <span className="text-[9px] text-slate-600 font-bold uppercase">{s.d}</span>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-white/5 pb-4">
        {[
          { key: 'all', label: 'All Goals', icon: '📋' },
          { key: 'company', label: 'Company', icon: '🏢' },
          { key: 'department', label: 'Department', icon: '🏬' },
          { key: 'team', label: 'Team', icon: '👥' },
          { key: 'individual', label: 'Individual', icon: '👤' },
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

      {goals.length === 0 ? (
        <GlassCard className="text-center py-12">
          <div className="text-6xl mb-4">🎯</div>
          <h4 className="text-xl font-bold text-white mb-2">No Goals Found</h4>
          <p className="text-slate-400 mb-6">
            {activeFilter === 'all'
              ? 'Create your first goal to start tracking progress'
              : `No ${activeFilter} goals found. Try a different filter or create a new goal.`
            }
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-[#8252e9] text-white font-bold text-sm rounded-xl hover:bg-[#6d39e0] transition-all"
          >
            Create First Goal
          </button>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-9 space-y-4">
            {goals.map((goal) => (
              <GlassCard key={goal.id} className="relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 text-6xl select-none group-hover:opacity-10 transition-opacity">🎯</div>

                <div className="flex flex-col md:flex-row gap-6">
                  {/* Left: Metadata */}
                  <div className="md:w-60 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl border border-white/10 bg-gradient-to-br from-[#8252e9] to-[#6d39e0] flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-purple-500/20">
                        {goal.owner ? `${goal.owner.first_name[0]}${goal.owner.last_name[0]}` : '👤'}
                      </div>
                      <div>
                        <p className="text-xs font-black text-white leading-tight">{goal.owner ? `${goal.owner.first_name} ${goal.owner.last_name}` : 'No Owner'}</p>
                        <p className={`text-[9px] font-black uppercase tracking-widest ${getStatusColor(goal.status).split(' ')[1]}`}>{goal.status}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Goal Class</p>
                      <p className="text-[10px] font-bold text-slate-200 flex items-center gap-1">
                        <span>{getTypeIcon(goal.type)}</span> {goal.type.toUpperCase()}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Governance Period</p>
                      <p className="text-[9px] font-mono text-slate-400">{formatDate(goal.start_date)} → {formatDate(goal.end_date)}</p>
                    </div>
                  </div>

                  {/* Right: Content & Key Results */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <h4 className="text-lg font-black text-white tracking-tight leading-tight">{goal.title}</h4>
                      {goal.description && (
                        <p className="text-xs text-slate-400 mt-2 line-clamp-2">{goal.description}</p>
                      )}

                      <div className="flex items-center gap-4 mt-4">
                        <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden shadow-inner border border-white/5">
                          <div
                            className={`h-full transition-all duration-1000 ${getProgressColor(goal.progress)} shadow-lg`}
                            style={{ width: `${goal.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-black text-white">{goal.progress}%</span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-4 border-t border-white/5">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Key Results Architecture</p>
                      {goal.key_results?.map((kr) => (
                        <div key={kr.id} className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] transition-all">
                          <div className="flex justify-between items-start mb-2">
                            <p className="text-[11px] text-slate-300 font-medium leading-relaxed max-w-md">{kr.description}</p>
                            <div className="text-right">
                              <p className="text-[10px] font-black text-white">{kr.current_value} / {kr.target_value} {kr.unit}</p>
                              <p className="text-[8px] font-black text-slate-600 uppercase">Weight: {kr.weight}%</p>
                            </div>
                          </div>
                          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#8252e9] shadow-[0_0_8px_#8252e9]"
                              style={{ width: `${kr.progress_percentage || 0}%` }}
                            />
                          </div>

                          <div className="flex gap-2 mt-3">
                            <input
                              type="number"
                              placeholder="Edit actual value..."
                              className="flex-1 bg-white/5 border border-white/5 rounded-lg px-3 py-1 text-[10px] text-white outline-none focus:border-[#8252e9] transition-all"
                              defaultValue={kr.current_value}
                              onBlur={(e) => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val) && val !== kr.current_value) {
                                  handleUpdateKeyResult(goal.id, kr.id, val);
                                }
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => setSelectedGoal(goal)}
                        className="px-4 py-1.5 bg-white/5 border border-white/5 rounded-lg text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all"
                      >
                        Full Analytics
                      </button>
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>

          <aside className="lg:col-span-3 space-y-4">
            <GlassCard title="Strategic Alignment Tree" className="!p-4 bg-purple-500/5 border-purple-500/20">
              <div className="p-6 border-2 border-dashed border-white/5 rounded-2xl text-center">
                <span className="text-2xl mb-2 block">🌿</span>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-relaxed">
                  Cascading visual tree active in Production build
                </p>
              </div>
            </GlassCard>

            <GlassCard title="Insights" className="!p-4">
              <div className="space-y-3">
                <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">Pro-Tip</p>
                  <p className="text-[10px] text-slate-300 mt-1">Focus on Key Results with weights {'>'} 30% to maximize strategic impact this quarter.</p>
                </div>
              </div>
            </GlassCard>
          </aside>
        </div>
      )}

      {/* Create Goal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md">
          <div className="absolute inset-0" onClick={() => setShowCreateModal(false)} />
          <div className="max-w-2xl w-full bg-[#0d0a1a] rounded-[32px] p-8 border border-white/10 shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-white">Create New Goal</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" strokeWidth="2" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">Goal Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#8252e9] transition-all"
                  placeholder="Increase customer satisfaction"
                  required
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleAiArchitect}
                  disabled={isAiArchitecting || !formData.title}
                  className="flex-1 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-emerald-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isAiArchitecting ? (
                    <>
                      <div className="w-3 h-3 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
                      Architecting...
                    </>
                  ) : (
                    <>✨ Suggest Key Results via Gemini</>
                  )}
                </button>
                <div className="flex-1 text-[9px] text-slate-500 font-bold uppercase leading-tight">
                  AI will analyze your title and architect measurable benchmarks.
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#8252e9] transition-all resize-none"
                  rows={3}
                  placeholder="Detailed description of the goal..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">Goal Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#8252e9] transition-all"
                  >
                    <option value="individual" className="bg-[#0d0a1a]">Individual</option>
                    <option value="team" className="bg-[#0d0a1a]">Team</option>
                    <option value="department" className="bg-[#0d0a1a]">Department</option>
                    <option value="company" className="bg-[#0d0a1a]">Company</option>
                  </select>
                </div>
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
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-xs font-bold text-slate-300">Key Results</label>
                  <button
                    type="button"
                    onClick={addKeyResult}
                    className="px-3 py-1 bg-[#8252e9] text-white text-xs font-bold rounded hover:bg-[#6d39e0] transition-all"
                  >
                    + Add Key Result
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.key_results.map((kr, index) => (
                    <div key={index} className="bg-white/5 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-bold text-white">Key Result {index + 1}</span>
                        {formData.key_results.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeKeyResult(index)}
                            className="text-red-400 hover:text-red-300 text-xs"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <input
                          type="text"
                          value={kr.description}
                          onChange={(e) => updateKeyResult(index, 'description', e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#8252e9] transition-all"
                          placeholder="Achieve NPS score of 80"
                        />

                        <div className="grid grid-cols-3 gap-3">
                          <input
                            type="number"
                            value={kr.target_value}
                            onChange={(e) => updateKeyResult(index, 'target_value', e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#8252e9] transition-all"
                            placeholder="Target"
                          />
                          <input
                            type="text"
                            value={kr.unit}
                            onChange={(e) => updateKeyResult(index, 'unit', e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#8252e9] transition-all"
                            placeholder="Unit (score, %, etc.)"
                          />
                          <input
                            type="number"
                            value={kr.weight}
                            onChange={(e) => updateKeyResult(index, 'weight', parseInt(e.target.value) || 100)}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#8252e9] transition-all"
                            placeholder="Weight %"
                            min="0"
                            max="100"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
                    'Create Goal'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalsTab;