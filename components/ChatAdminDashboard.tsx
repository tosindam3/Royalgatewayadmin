
import React, { useState } from 'react';
import GlassCard from './GlassCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useChatAnalytics, useMessageActivity, useBlockedKeywords, useAddBlockedKeyword, useDeleteBlockedKeyword } from '../hooks/useChat';

const ChatAdminDashboard: React.FC = () => {
  const [newKeyword, setNewKeyword] = useState('');
  const [keywordAction, setKeywordAction] = useState<'block' | 'flag' | 'warn'>('block');

  const { data: analytics, isLoading: analyticsLoading } = useChatAnalytics();
  const { data: messageActivity = [], isLoading: activityLoading } = useMessageActivity(7);
  const { data: blockedKeywords = [], isLoading: keywordsLoading } = useBlockedKeywords();
  
  const addKeywordMutation = useAddBlockedKeyword();
  const deleteKeywordMutation = useDeleteBlockedKeyword();

  const handleAddKeyword = async () => {
    if (!newKeyword.trim()) return;

    await addKeywordMutation.mutateAsync({
      keyword: newKeyword.trim(),
      action: keywordAction,
    });

    setNewKeyword('');
  };

  const handleDeleteKeyword = (keywordId: number) => {
    if (confirm('Are you sure you want to remove this keyword?')) {
      deleteKeywordMutation.mutate(keywordId);
    }
  };

  // Transform message activity data for chart
  const chartData = messageActivity.map(item => ({
    name: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    val: item.count,
  }));
  return (
    <div className="space-y-6 animate-in fade-in duration-500 overflow-y-auto pr-2 no-scrollbar">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-white uppercase tracking-tight">Chat Admin <span className="text-slate-500 font-normal italic">Dashboard</span></h2>
      </div>

      {analyticsLoading ? (
        <div className="text-center text-slate-500 py-8">Loading analytics...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Active Users', val: analytics?.active_users || 0, sub: `Total: ${analytics?.total_channels || 0} channels`, icon: '👤', color: 'text-emerald-400' },
              { label: 'Active Channels', val: analytics?.total_channels || 0, sub: 'Across organization', icon: '💬', color: 'text-blue-400' },
              { label: 'Total Messages', val: analytics?.total_messages || 0, sub: `${analytics?.messages_today || 0} today`, icon: '📈', color: 'text-[#8252e9]' },
            ].map((s, i) => (
              <GlassCard key={i} className="!p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[24px] font-black text-white">{s.val.toLocaleString()}</p>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{s.label}</p>
                  </div>
                  <span className="text-xl opacity-40">{s.icon}</span>
                </div>
                <p className={`text-[8px] font-bold uppercase mt-2 ${s.color}`}>{s.sub}</p>
              </GlassCard>
            ))}
          </div>

          <GlassCard title="Chat Analytics" action={<span className="text-[9px] font-black text-slate-500 uppercase">Last 7 Days ›</span>}>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Message Activity</p>
            {activityLoading ? (
              <div className="h-48 flex items-center justify-center text-slate-500">Loading chart...</div>
            ) : (
              <div className="h-48 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%" debounce={50}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#64748b' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                    <Bar dataKey="val" fill="#8252e9" radius={[4, 4, 0, 0]} opacity={0.6} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </GlassCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard title="Top Channels" action={<span className="text-[8px] font-black text-blue-400 uppercase">View All</span>}>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[8px] font-black text-slate-500 uppercase border-b border-white/5">
                      <th className="py-2">Channel</th>
                      <th className="py-2">Members</th>
                      <th className="py-2">Messages</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {analytics?.top_channels?.slice(0, 5).map((ch, i) => (
                      <tr key={i} className="text-[10px] text-slate-300">
                        <td className="py-3 font-bold text-white"># {ch.name}</td>
                        <td className="py-3">{ch.members?.length || 0}</td>
                        <td className="py-3">{ch.messages_count || 0}</td>
                      </tr>
                    )) || (
                      <tr>
                        <td colSpan={3} className="py-4 text-center text-slate-500 text-[10px]">No data available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </GlassCard>

            <GlassCard title="Monitoring & Profanity Filter">
              {keywordsLoading ? (
                <div className="text-center text-slate-500 py-4">Loading keywords...</div>
              ) : (
                <>
                  <div className="space-y-3 max-h-48 overflow-y-auto no-scrollbar">
                    {blockedKeywords.length === 0 ? (
                      <p className="text-[10px] text-slate-500 text-center py-4">No blocked keywords yet</p>
                    ) : (
                      blockedKeywords.map((keyword) => (
                        <div key={keyword.id} className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
                          <span className="text-[10px] font-mono text-slate-400">{keyword.keyword}</span>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded ${
                              keyword.action === 'block' ? 'bg-rose-500/10 text-rose-500' :
                              keyword.action === 'flag' ? 'bg-yellow-500/10 text-yellow-500' :
                              'bg-blue-500/10 text-blue-500'
                            }`}>
                              {keyword.action}
                            </span>
                            <button
                              onClick={() => handleDeleteKeyword(keyword.id)}
                              className="text-slate-500 hover:text-red-500 transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
                        placeholder="Enter keyword..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white outline-none focus:border-[#8252e9]/50"
                      />
                      <select
                        value={keywordAction}
                        onChange={(e) => setKeywordAction(e.target.value as any)}
                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-[10px] text-white outline-none"
                      >
                        <option value="block">Block</option>
                        <option value="flag">Flag</option>
                        <option value="warn">Warn</option>
                      </select>
                    </div>
                    <button
                      onClick={handleAddKeyword}
                      disabled={!newKeyword.trim() || addKeywordMutation.isPending}
                      className="w-full py-2 bg-[#8252e9] text-white text-[9px] font-black uppercase tracking-widest rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {addKeywordMutation.isPending ? 'Adding...' : 'Add New Trigger'}
                    </button>
                  </div>
                </>
              )}
            </GlassCard>
          </div>

          <GlassCard title="Compliance Settings">
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-[10px] font-bold text-slate-300 uppercase">Data Retention</span>
              <select className="bg-white/5 text-[10px] text-white p-1 rounded outline-none border border-white/10">
                <option>180 days</option>
                <option>1 year</option>
                <option>Forever</option>
              </select>
            </div>
            <div className="flex justify-between items-center py-4">
              <span className="text-[10px] font-bold text-slate-300 uppercase">Profanity Filter</span>
              <div className="w-8 h-4 bg-emerald-500 rounded-full p-0.5 flex justify-end">
                <div className="w-3 h-3 bg-white rounded-full" />
              </div>
            </div>
          </GlassCard>
        </>
      )}
    </div>
  );
};

export default ChatAdminDashboard;
