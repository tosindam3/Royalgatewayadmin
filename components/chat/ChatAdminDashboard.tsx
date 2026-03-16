import React, { useState, useEffect } from 'react';
import chatApi from '../../services/chatApi';
import GlassCard from '../GlassCard';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

interface ChatAdminDashboardProps {
  onClose: () => void;
}

const ChatAdminDashboard: React.FC<ChatAdminDashboardProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'keywords' | 'compliance'>('analytics');
  const [analytics, setAnalytics] = useState<any>(null);
  const [keywords, setKeywords] = useState<any[]>([]);
  const [compliance, setCompliance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newKeyword, setNewKeyword] = useState<{ keyword: string; action: 'block' | 'flag' | 'warn' }>({ 
    keyword: '', 
    action: 'block' 
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'analytics') {
        const data = await chatApi.getAnalytics();
        setAnalytics(data);
      } else if (activeTab === 'keywords') {
        const data = await chatApi.getBlockedKeywords();
        setKeywords(data);
      } else if (activeTab === 'compliance') {
        const data = await chatApi.getComplianceSettings();
        setCompliance(data);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to fetch ${activeTab}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await chatApi.addBlockedKeyword(newKeyword);
      toast.success('Keyword added');
      setNewKeyword({ keyword: '', action: 'block' });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add keyword');
    }
  };

  const handleDeleteKeyword = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    try {
      await chatApi.deleteBlockedKeyword(id);
      toast.success('Keyword removed');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete keyword');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-5xl h-[80vh] bg-[#0f172a] border border-white/10 rounded-[32px] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-purple-500/10 to-transparent">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Chat Command Center</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Management & Governance</p>
          </div>
          <button
            onClick={onClose}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all shadow-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-8 border-b border-white/5 bg-black/20">
          {[
            { id: 'analytics', label: 'Analytics', icon: '📊' },
            { id: 'keywords', label: 'Safety Filters', icon: '🛡️' },
            { id: 'compliance', label: 'Compliance', icon: '⚖️' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-8 py-5 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === tab.id ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-t-full shadow-[0_-4px_12px_rgba(168,85,247,0.4)]" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {activeTab === 'analytics' && analytics && (
                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-4 gap-6">
                    {[
                      { label: 'Total Messages', value: analytics.total_messages, icon: '💬', color: 'from-blue-500/20' },
                      { label: 'Active Users', value: analytics.active_users_24h, icon: '👤', color: 'from-green-500/20' },
                      { label: 'Public Channels', value: analytics.public_channels, icon: '🌍', color: 'from-purple-500/20' },
                      { label: 'Attachments', value: analytics.total_attachments, icon: '📎', color: 'from-orange-500/20' },
                    ].map((stat, i) => (
                      <div key={i} className={`p-6 bg-gradient-to-br ${stat.color} to-white/[0.02] border border-white/5 rounded-3xl`}>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black text-white">{stat.value}</span>
                          <span className="text-xl">{stat.icon}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <GlassCard className="p-6">
                      <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 border-b border-white/5 pb-4">Top Channels</h3>
                      <div className="space-y-4">
                        {analytics.top_channels?.map((c: any, i: number) => (
                          <div key={i} className="flex justify-between items-center group">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-black text-purple-500 w-4">#{(i + 1)}</span>
                              <span className="text-xs text-white font-medium group-hover:text-purple-400 transition-colors">#{c.name}</span>
                            </div>
                            <span className="text-[10px] font-black text-slate-500 bg-white/5 px-3 py-1 rounded-full">{c.messages_count} msgs</span>
                          </div>
                        ))}
                      </div>
                    </GlassCard>

                    <GlassCard className="p-6">
                      <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 border-b border-white/5 pb-4">Storage Usage</h3>
                      <div className="flex flex-col items-center justify-center h-48">
                        <div className="text-4xl font-black text-white mb-2">{analytics.storage_usage_formatted}</div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center max-w-[150px]">
                          Used by message attachments and media
                        </p>
                      </div>
                    </GlassCard>
                  </div>
                </div>
              )}

              {activeTab === 'keywords' && (
                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-3 gap-8">
                    <div className="col-span-1">
                      <GlassCard className="p-6 border-purple-500/20">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6">Prohibited List</h3>
                        <form onSubmit={handleAddKeyword} className="space-y-4">
                          <div>
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2 px-1">Exact Match Keyword</label>
                            <input
                              type="text"
                              value={newKeyword.keyword}
                              onChange={(e) => setNewKeyword({ ...newKeyword, keyword: e.target.value })}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-purple-500/50 transition-all"
                              placeholder="e.g. prohibited_word"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2 px-1">Automatic Action</label>
                            <select
                              value={newKeyword.action}
                              onChange={(e) => setNewKeyword({ ...newKeyword, action: e.target.value as 'block' | 'flag' | 'warn' })}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-purple-500/50 transition-all appearance-none"
                            >
                              <option value="block" className="bg-[#0f172a]">Block Completely</option>
                              <option value="warn" className="bg-[#0f172a]">Warn Staff</option>
                              <option value="flag" className="bg-[#0f172a]">Flag for Audit</option>
                            </select>
                          </div>
                          <button
                            type="submit"
                            className="w-full py-4 gradient-bg text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-purple-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                          >
                            Enforce Keyword
                          </button>
                        </form>
                      </GlassCard>
                    </div>

                    <div className="col-span-2">
                      <div className="grid grid-cols-2 gap-4">
                        {keywords.map((kw) => (
                          <div key={kw.id} className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl flex justify-between items-center group hover:bg-white/[0.05] transition-all">
                            <div>
                              <p className="text-xs font-bold text-white mb-1">"{kw.keyword}"</p>
                              <div className="flex gap-2">
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${kw.action === 'block' ? 'bg-red-500/20 text-red-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                                  {kw.action}
                                </span>
                                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter">by {kw.creator?.name}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteKeyword(kw.id)}
                              className="p-2 text-slate-600 hover:text-red-400 transition-colors"
                            >
                              🗑️
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'compliance' && compliance && (
                <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                  <GlassCard className="divide-y divide-white/5">
                    {[
                      { label: 'Data Retention', value: `${compliance.data_retention_days} Days`, desc: 'History automatic deletion period' },
                      { label: 'Max File Size', value: `${compliance.max_file_size_mb} MB`, desc: 'Attachment limit per upload' },
                      { label: 'Max Attachments', value: compliance.max_attachments_per_message, desc: 'Files allowed per message' },
                      { label: 'Safety Filter', value: compliance.profanity_filter_enabled ? 'Active' : 'Disabled', desc: 'AI-powered profanity detection' },
                    ].map((row, i) => (
                      <div key={i} className="p-6 flex justify-between items-center">
                        <div>
                          <p className="text-xs font-black text-white uppercase tracking-widest mb-1">{row.label}</p>
                          <p className="text-[10px] text-slate-500 font-medium">{row.desc}</p>
                        </div>
                        <div className="text-sm font-black text-purple-400 bg-purple-500/5 px-4 py-2 rounded-xl border border-purple-500/10">
                          {row.value}
                        </div>
                      </div>
                    ))}
                  </GlassCard>
                  <p className="text-[10px] text-center text-slate-600 font-bold uppercase tracking-widest">
                    These settings are managed in backend/config/chat.php
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatAdminDashboard;
