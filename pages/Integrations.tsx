
import React, { useState } from 'react';
import GlassCard from '../components/GlassCard';

const RECOMMENDED = [
  { name: 'Zoom', category: 'HR Video Meetings', status: 'Installed', time: '0m', tasks: '12 Tasks', action: 'Unomate', icon: '📹', color: 'bg-blue-500' },
  { name: 'Slack', category: 'HR Team Chat', status: 'Installed', time: '10m', tasks: '100 Requests Approval', action: 'Installed', icon: '💬', color: 'bg-[#4A154B]' },
  { name: 'Microsoft Teams', category: 'HR Team Chat', status: 'Active', time: 'Now', tasks: 'Sync Data', action: 'Sync Data', icon: '👥', color: 'bg-[#6264A7]', badge: 'NEW' },
];

const LINKED_INTEGRATIONS = [
  { name: 'Zoom', category: 'HR Video Meetings', sync: 'Syncs daily', realtime: true, icon: '📹' },
  { name: 'Slack', category: 'HR Team Chat', sync: 'Syncs in real-time', realtime: true, icon: '💬' },
  { name: 'Microsoft Teams', category: 'HR Team Chat', sync: 'Syncs in real-time', realtime: true, icon: '👥' },
  { name: 'QuickBooks', category: 'Payroll – Every Saturday', sync: 'Syncs in real-time', realtime: false, icon: '💹' },
  { name: 'Workday', category: 'HR & People Data', sync: 'Syncs morning', realtime: false, icon: '🏢' },
  { name: 'DocuSign', category: 'Digital Signatures', sync: 'Syncs daily', realtime: true, icon: '✍️' },
  { name: 'Paycor', category: 'Payroll - Weekly', sync: 'Syncs morning', realtime: false, icon: '💰' },
  { name: 'Greenhouse', category: 'Recruitment Tools', sync: 'Syncs morning', realtime: false, icon: '🌱' },
];

const ACTIVITY = [
  { user: 'Emily Johnson', action: 'About a microsoft HR Team Chat', time: '2 days ago', avatar: 'https://picsum.photos/32?sig=a1' },
  { user: 'System', action: 'Zoom synced today at 11:32 AM', time: 'Today', type: 'sync' },
];

const Integrations: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Installed Apps');

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase italic">Integrations</h2>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest mr-4">
              <span>Actions :</span>
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg hover:text-white transition-all italic">
                <span className="text-blue-400">☁️</span> Installed Apps
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg hover:text-white transition-all italic">
                <span className="text-rose-400">🔔</span> Pending Requests (0)
              </button>
           </div>
           <button className="px-6 py-2.5 bg-orange-500/90 hover:bg-orange-600 text-white font-black text-[11px] uppercase tracking-widest rounded-xl shadow-lg shadow-orange-500/20 active:scale-95 transition-all">
             Add Integration
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-6">
          <GlassCard className="!p-0 overflow-hidden">
            <div className="p-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
               <div className="flex items-center gap-4">
                  <h3 className="text-base font-black text-white tracking-tight uppercase">10 Active Workflows</h3>
                  <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                     <span className="text-[8px] font-black text-emerald-400 uppercase tracking-tighter">System Active</span>
                     <div className="w-8 h-4 bg-emerald-500 rounded-full relative p-0.5">
                        <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow-sm" />
                     </div>
                  </div>
               </div>
               <div className="flex gap-1">
                  {['Installed Apps', 'Pending Requests', 'Status History', 'Integration Settings'].map((t) => (
                    <button 
                      key={t}
                      onClick={() => setActiveTab(t)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-[#8252e9] text-white shadow-lg shadow-purple-500/10' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      {t}
                    </button>
                  ))}
               </div>
            </div>

            <div className="p-6 space-y-6">
               <div className="flex justify-between items-center mb-2">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Recommended Integrations</p>
                  <div className="flex items-center gap-2">
                     <span className="text-[9px] font-bold text-slate-500 uppercase">Filter Apotes</span>
                     <select className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-[9px] font-black text-white uppercase outline-none">
                        <option>All</option>
                     </select>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {RECOMMENDED.map((app, i) => (
                    <div key={i} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl relative group hover:bg-white/[0.04] transition-all">
                       {app.badge && <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-orange-500 text-white text-[7px] font-black uppercase rounded italic rotate-3 tracking-tighter">{app.badge}</span>}
                       <div className="flex gap-3 mb-6">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${app.color} group-hover:scale-110 transition-transform shadow-lg`}>
                             {app.icon}
                          </div>
                          <div>
                             <h4 className="text-sm font-black text-white tracking-tight">{app.name}</h4>
                             <p className="text-[9px] text-slate-500 font-bold uppercase">{app.category}</p>
                          </div>
                          <div className="ml-auto flex flex-col items-end">
                             <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center text-[8px] text-emerald-400">✓</div>
                          </div>
                       </div>
                       <div className="space-y-3">
                          <div className="flex justify-between text-[9px] font-bold uppercase text-slate-500">
                             <span>Installed</span>
                             <span className="text-emerald-400">● {app.time}</span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-white/5">
                             <div className="flex items-center gap-1.5">
                                <span className="text-xs">📋</span>
                                <span className="text-[8px] font-black text-slate-400 uppercase">{app.tasks}</span>
                             </div>
                             <button className="text-[9px] font-black text-[#8252e9] uppercase tracking-widest hover:underline">{app.action}</button>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            <div className="p-6 border-t border-white/5">
               <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-4">
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">My Linked Integrations</p>
                     <div className="flex p-1 bg-white/5 rounded-lg border border-white/10">
                        <button className="px-2 py-0.5 bg-[#8252e9] text-white text-[8px] font-black uppercase rounded">Active (10)</button>
                        <button className="px-2 py-0.5 text-slate-500 text-[8px] font-black uppercase rounded">All 144</button>
                     </div>
                  </div>
                  <button className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1 hover:text-white">
                     Modify <span className="text-xs">▾</span>
                  </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {LINKED_INTEGRATIONS.map((app, i) => (
                    <div key={i} className="p-4 bg-white/[0.02] border border-white/10 rounded-2xl hover:bg-white/[0.04] transition-all group">
                       <div className="flex justify-between items-start mb-4">
                          <div className="flex gap-3">
                             <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-xl grayscale group-hover:grayscale-0 group-hover:bg-white/10 transition-all">
                                {app.icon}
                             </div>
                             <div>
                                <h5 className="text-xs font-black text-white uppercase tracking-tight">{app.name}</h5>
                                <p className="text-[8px] text-slate-500 font-bold uppercase">{app.category}</p>
                             </div>
                          </div>
                          <button className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[8px] font-black text-slate-400 uppercase tracking-widest hover:text-white flex items-center gap-2 transition-all group/btn">
                             {app.name === 'Slack' || app.name === 'Zoom' ? (
                                <>
                                  <span className="text-[10px]">1</span> Manage
                                </>
                             ) : (
                                <>
                                  <span className="text-xs opacity-60">☁️</span> Sync Data
                                </>
                             )}
                          </button>
                       </div>
                       <div className="flex items-center gap-4 text-[8px] font-black text-slate-600 uppercase tracking-widest">
                          <span className="flex items-center gap-1.5">🌀 {app.sync}</span>
                          <span className="flex items-center gap-1.5">💠 Sync in real-time</span>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </GlassCard>
        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-4 space-y-6">
          <GlassCard title="Browse Integrations">
             <div className="space-y-6">
                {[
                  { t: 'Communication Tools', s: 'Answer employee questions and provide HR assistance within chat.', i: '💬' },
                  { t: 'Smart Resume Screener', s: 'Automatically screen and rank incoming job applications using AI.', i: '📄' },
                  { t: 'Retention Risk Analysis', s: 'Identify employees with high turnover risk based on HR data analysis.', i: '📉' },
                ].map((item, i) => (
                  <div key={i} className="space-y-3 pb-6 border-b border-white/5 last:border-0 last:pb-0">
                     <div className="flex items-start justify-between group cursor-pointer">
                        <div className="flex gap-3">
                           <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center text-xl">
                              {item.i}
                           </div>
                           <div className="flex-1">
                              <h5 className="text-[11px] font-black text-white uppercase tracking-tight group-hover:text-blue-400 transition-colors">{item.t}</h5>
                              <p className="text-[9px] text-slate-500 leading-relaxed mt-1">{item.s}</p>
                           </div>
                        </div>
                        <span className="text-slate-600">›</span>
                     </div>
                     <button className="w-full py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-500 hover:text-white transition-all">
                        {i === 0 ? 'Launch' : i === 1 ? 'Manage Rules' : 'View Dashboard'}
                     </button>
                  </div>
                ))}
             </div>
          </GlassCard>

          <GlassCard title="Integrations Activity" action={<span className="text-slate-500 font-black">›</span>}>
             <div className="space-y-6">
                {ACTIVITY.map((act, i) => (
                  <div key={i} className="flex gap-4 group">
                     {act.type === 'sync' ? (
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                           <span className="text-xs">🔄</span>
                        </div>
                     ) : (
                        <img src={act.avatar} className="w-8 h-8 rounded-lg border border-white/10 shrink-0" alt="" />
                     )}
                     <div className="flex-1">
                        <div className="flex justify-between items-start">
                           <p className="text-[11px] font-black text-white uppercase tracking-tight">{act.user}</p>
                           <span className="text-[8px] text-slate-600 font-bold">{act.time}</span>
                        </div>
                        <p className="text-[9px] text-slate-500 mt-1 font-bold italic leading-tight">{act.action}</p>
                     </div>
                     <span className="text-slate-700">›</span>
                  </div>
                ))}
             </div>
          </GlassCard>

          <GlassCard className="!p-0 overflow-hidden relative border border-emerald-500/10">
             <div className="p-6 bg-gradient-to-br from-emerald-500/5 to-transparent">
                <div className="flex gap-3 items-start mb-6">
                   <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-lg">🤖</div>
                   <div>
                      <div className="flex items-center gap-4">
                        <h4 className="text-xs font-black text-white uppercase tracking-tight">Va HR Assistant</h4>
                        <div className="flex gap-1 items-center px-1.5 py-0.5 bg-white/5 rounded border border-white/5">
                           <span className="text-[7px] text-slate-500 font-black">30</span>
                           <span className="text-[7px] text-slate-500 font-black italic">/ EN</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold mt-1">Hi Emily; How can I assist you today?</p>
                   </div>
                </div>
                <div className="space-y-2">
                   <button className="w-full text-left p-2.5 bg-white/5 border border-white/5 rounded-xl text-[9px] text-slate-400 font-bold leading-relaxed flex items-start gap-2 hover:bg-white/10 transition-all group">
                      <span className="grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all mt-0.5">🪄</span>
                      We il need to conduct a retention risk analysis for the Sales Department.
                   </button>
                   <button className="w-full text-left p-2.5 bg-white/5 border border-white/5 rounded-xl text-[9px] text-slate-400 font-bold leading-relaxed flex items-start gap-2 hover:bg-white/10 transition-all group">
                      <span className="grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all mt-0.5">📅</span>
                      Schedule a leave reminder for the Sales Team.
                   </button>
                   <button className="w-full text-left p-2.5 bg-white/5 border border-white/5 rounded-xl text-[9px] text-slate-400 font-bold leading-relaxed flex items-start gap-2 hover:bg-white/10 transition-all group">
                      <span className="grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all mt-0.5">🎓</span>
                      Generate an onboarding task list for our new QA batch.
                   </button>
                </div>
             </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default Integrations;
