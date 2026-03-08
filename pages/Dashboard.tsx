
import React, { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import AIInsight from '../components/AIInsight';
// Fixed: Imported useSearchParams from 'react-router' to resolve missing export error.
import { useSearchParams } from 'react-router';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  LineChart, Line, Legend
} from 'recharts';
import { UserRole } from '../types';
// Gemini service disabled due to OAuth2 authentication requirements
// import { generateHRAssistantResponse } from '../services/geminiService';

const attendanceData = [
  { name: 'Present', value: 323, color: '#4c49d8' },
  { name: 'Late', value: 32, color: '#f59e0b' },
  { name: 'Absent', value: 16, color: '#ef4444' },
  { name: 'Remote', value: 11, color: '#10b981' },
];

const executiveTrendData = [
  { name: 'Jan', rev: 1200000, cost: 480000 },
  { name: 'Feb', rev: 1350000, cost: 495000 },
  { name: 'Mar', rev: 1300000, cost: 510000 },
  { name: 'Apr', rev: 1550000, cost: 540000 },
  { name: 'May', rev: 1680000, cost: 552000 },
];

const Dashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeView = (searchParams.get('tab') as 'overview' | 'executive') || 'overview';

  const [aiInsight, setAiInsight] = useState<string>('');
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);

  const setActiveView = (view: 'overview' | 'executive') => {
    if (view === 'overview') {
      searchParams.delete('tab');
    } else {
      searchParams.set('tab', view);
    }
    setSearchParams(searchParams);
  };

  const fetchInsight = async () => {
    setIsLoadingInsight(true);
    try {
      // Gemini service disabled - using static insights
      setAiInsight(activeView === 'executive'
        ? "Strategic focus remains on R&D scaling. Bench strength for leadership roles improved by 12% this quarter."
        : "Organization operating at 92% efficiency. Retention risks are localized to IT department.");
    } catch (e) {
      setAiInsight("AI Engine offline. Manual data audit recommended.");
    } finally {
      setIsLoadingInsight(false);
    }
  };

  useEffect(() => {
    fetchInsight();
  }, [activeView]);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/10 pb-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">
            Control <span className="text-[#8252e9]">{activeView === 'executive' ? 'Executive' : 'Nexus'}</span>
          </h2>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1">
            {activeView === 'executive' ? 'Strategic Talent Capital Intelligence' : 'Real-time Organizational Intelligence'}
          </p>
        </div>

        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
          {(['overview', 'executive'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setActiveView(v)}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === v ? 'bg-[#8252e9] text-white shadow-xl scale-[1.02]' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {activeView === 'overview' ? (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Headcount', val: '382', delta: '+12', color: 'text-white' },
              { label: 'Retention', val: '94.2%', delta: '+1.5%', color: 'text-emerald-400' },
              { label: 'Burnout Index', val: '2.1', delta: 'Low', color: 'text-blue-400' },
              { label: 'Open Req', val: '14', delta: '-2', color: 'text-amber-400' },
            ].map((s, i) => (
              <GlassCard key={i} className="!p-6 border-l-4 border-l-[#8252e9] hover:bg-white/[0.04] transition-all">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{s.label}</span>
                  <span className={`text-[9px] font-bold px-2 py-1 rounded-md bg-white/5 ${s.delta.includes('+') ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {s.delta}
                  </span>
                </div>
                <h3 className={`text-3xl font-black ${s.color}`}>{s.val}</h3>
              </GlassCard>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              <GlassCard title="Talent Distribution" action={<button className="text-[10px] font-black text-[#8252e9] uppercase tracking-widest hover:underline">View Deep Data ›</button>}>
                <div className="h-[300px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[
                      { name: 'Jan', val: 320 }, { name: 'Feb', val: 340 }, { name: 'Mar', val: 335 },
                      { name: 'Apr', val: 360 }, { name: 'May', val: 382 }
                    ]}>
                      <defs>
                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8252e9" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#8252e9" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis hide />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }} />
                      <Area type="monotone" dataKey="val" stroke="#8252e9" strokeWidth={3} fill="url(#chartGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <GlassCard title="AI Strategic Summary">
                  <AIInsight content={aiInsight} isLoading={isLoadingInsight} onRefresh={fetchInsight} />
                </GlassCard>
                <GlassCard title="Attendance Health">
                  <div className="flex h-48 items-center w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={attendanceData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                          {attendanceData.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 flex-shrink-0 pr-4">
                      {attendanceData.map((d, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{d.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </GlassCard>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-8">
              <GlassCard title="Upcoming Milestones">
                <div className="space-y-6">
                  {[
                    { t: 'Q2 Performance Cycle', d: 'Starts in 4 days', i: '🎯', c: 'border-blue-500' },
                    { t: 'Compliance Audit', d: 'May 14, 2024', i: '⚖️', c: 'border-amber-500' },
                    { t: 'Annual Townhall', d: 'June 01, 2024', i: '🎙️', c: 'border-purple-500' },
                  ].map((item, i) => (
                    <div key={i} className={`p-4 rounded-2xl bg-white/5 border-l-4 ${item.c} group hover:bg-white/[0.08] transition-all cursor-pointer`}>
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-black text-white uppercase tracking-tight">{item.t}</h4>
                        <span className="text-xl">{item.i}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase">{item.d}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>

              <div className="p-8 rounded-[32px] bg-gradient-to-br from-[#8252e9] to-[#4c49d8] shadow-2xl relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                <h4 className="text-lg font-black text-white italic mb-2">Enterprise Plan</h4>
                <p className="text-white/70 text-xs leading-relaxed mb-6 font-medium">Unlock predictive talent forecasting and multi-tenant payroll governance.</p>
                <button className="w-full py-3 bg-white text-[#8252e9] rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-0.98 transition-all">Upgrade Now</button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Monthly Burn Rate', val: '$540.2K', delta: '+2.1%', color: 'text-rose-400', icon: '🔥' },
              { label: 'Profit per Head', val: '$12,450', delta: '+8.4%', color: 'text-emerald-400', icon: '🏦' },
              { label: 'Strategic Alignment', val: '88%', delta: 'On Track', color: 'text-blue-400', icon: '🎯' },
              { label: 'Bench Strength', val: '64%', delta: '+12%', color: 'text-purple-400', icon: '♟️' },
            ].map((s, i) => (
              <GlassCard key={i} className="!p-6 border-t-4 border-t-[#8252e9] hover:bg-white/[0.04] transition-all">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xl">{s.icon}</span>
                  <span className={`text-[9px] font-black px-2 py-1 rounded-md bg-white/5 uppercase tracking-widest ${s.delta.includes('+') && s.color !== 'text-rose-400' ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {s.delta}
                  </span>
                </div>
                <h3 className={`text-3xl font-black ${s.color}`}>{s.val}</h3>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">{s.label}</p>
              </GlassCard>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-9 space-y-8">
              <GlassCard title="Revenue vs Talent Cost Efficiency" action={<button className="text-[10px] font-black text-emerald-400 uppercase tracking-widest hover:underline">Download Executive PDF ›</button>}>
                <div className="h-[350px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={executiveTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `$${v / 1000}k`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }}
                        itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: '900', paddingBottom: '20px' }} />
                      <Line type="monotone" name="Gross Revenue" dataKey="rev" stroke="#10b981" strokeWidth={4} dot={{ r: 4 }} />
                      <Line type="monotone" name="Workforce Cost" dataKey="cost" stroke="#8252e9" strokeWidth={4} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <GlassCard title="Executive Briefing (AI Generated)">
                  <AIInsight content={aiInsight} isLoading={isLoadingInsight} onRefresh={fetchInsight} />
                </GlassCard>
                <GlassCard title="Leadership Pipeline Health">
                  <div className="space-y-6 pt-4">
                    {[
                      { role: 'Product Leadership', readiness: 92, color: 'bg-emerald-500' },
                      { role: 'Engineering Management', readiness: 45, color: 'bg-rose-500' },
                      { role: 'Sales Leadership', readiness: 78, color: 'bg-blue-500' },
                      { role: 'Ops Governance', readiness: 60, color: 'bg-[#8252e9]' },
                    ].map((item, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <span>{item.role}</span>
                          <span className="text-white">{item.readiness}% Ready</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className={`h-full ${item.color} shadow-[0_0_8px_currentColor]`} style={{ width: `${item.readiness}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </div>
            </div>

            <div className="lg:col-span-3 space-y-8">
              <GlassCard title="Strategic Risks" className="border-l-4 border-l-rose-500/50">
                <div className="space-y-4">
                  <div className="p-4 bg-rose-500/5 rounded-2xl border border-rose-500/10">
                    <p className="text-[10px] font-black text-rose-500 uppercase mb-1">Critical Exit Risk</p>
                    <p className="text-xs font-bold text-white">2 Key Engineering Architects showing high exit markers.</p>
                  </div>
                  <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10">
                    <p className="text-[10px] font-black text-amber-500 uppercase mb-1">Compliance Barrier</p>
                    <p className="text-xs font-bold text-white">New regional legislation affects 12% of remote workforce.</p>
                  </div>
                </div>
              </GlassCard>

              <GlassCard title="Top Priority OKRs" action={<span className="text-[#8252e9] font-black">›</span>}>
                <div className="space-y-6 pt-2">
                  {[
                    { t: 'Series B Readiness', p: 85, i: 'text-emerald-400' },
                    { t: 'Product-Market Alignment', p: 42, i: 'text-amber-400' },
                    { t: 'Global Compliance Audit', p: 10, i: 'text-rose-400' },
                  ].map((okr, i) => (
                    <div key={i} className="group cursor-pointer">
                      <div className="flex justify-between mb-2">
                        <span className="text-xs font-bold text-white group-hover:text-[#8252e9] transition-colors">{okr.t}</span>
                        <span className={`text-xs font-black ${okr.i}`}>{okr.p}%</span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full">
                        <div className={`h-full bg-[#8252e9] transition-all duration-1000`} style={{ width: `${okr.p}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
