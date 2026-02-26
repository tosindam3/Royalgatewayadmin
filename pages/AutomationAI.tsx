
import React, { useState } from 'react';
import GlassCard from '../components/GlassCard';

const WORKFLOWS = [
  { id: 1, title: 'Automatic Onboarding Task Assignment', desc: 'Automatically assign onboarding tasks to new hires.', details: 'New Hires | 2 days ago | Last run 1 hour', active: true, color: 'text-purple-400' },
  { id: 2, title: 'Leave Approval Automation', desc: 'Automatically send employee it requests to managers for approval.', details: 'All Employees | 1 week ago | Last run yesterday', active: true, color: 'text-emerald-400' },
  { id: 3, title: 'Timesheet Reminder', desc: 'Delivers automatic reminders for employees to submit timesheets every Friday at 3 PM.', details: 'All Employees | 3 weeks ago | Last run 2 days ago', active: true, color: 'text-blue-400' },
  { id: 4, title: 'Payroll Cutoff Notifications', desc: 'Send notifications to payroll Admin and managers when payroll cutoff is nearing.', details: 'Payroll Admin | 2 months ago | Last run just now', active: true, color: 'text-amber-400' },
];

const PROCESS_STEPS = [
  { label: 'New Hire Onboarding', icon: '📋' },
  { label: 'Offer Letter', icon: '📝' },
  { label: 'Leave Request', icon: '🏖️' },
  { label: 'Incomplete Timesheets', icon: '⌛' },
  { label: 'Payments', icon: '💰' },
  { label: 'Reminder Messages', icon: '✉️' },
  { label: 'Cutoff Alerts', icon: '📢' },
];

const AI_TOOLS = [
  { title: 'AI Chat Assistant', desc: 'Answer employees HR queries and provide HR assistance within chat.', action: 'Launch', icon: '🤖' },
  { title: 'Smart Resume Screener', desc: 'Automatically screen and rank incoming job applications using AI.', action: 'Manage Rules', icon: '📄' },
  { title: 'Retention Risk Analysis', desc: 'Identify employees with high turnover risk based on HR data analysis.', action: 'View Dashboard', icon: '📈' },
];

const AutomationAI: React.FC = () => {
  const [isSystemActive, setIsSystemActive] = useState(true);

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase italic">AI & <span className="text-slate-500 font-normal">Automation</span></h2>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex gap-2">
            <button className="p-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" strokeWidth="2"/></svg>
            </button>
            <button className="p-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" strokeWidth="2"/></svg>
            </button>
          </div>
          <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl border transition-all ${isSystemActive ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/5 border-white/10'}`}>
            <span className={`text-[10px] font-black uppercase tracking-widest ${isSystemActive ? 'text-emerald-400' : 'text-slate-500'}`}>{isSystemActive ? 'Active' : 'Disabled'}</span>
            <button 
              onClick={() => setIsSystemActive(!isSystemActive)}
              className={`w-10 h-5 rounded-full relative transition-colors ${isSystemActive ? 'bg-emerald-500' : 'bg-slate-700'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${isSystemActive ? 'left-[22px]' : 'left-1'}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Automation Area */}
        <div className="lg:col-span-8 space-y-6">
          <GlassCard 
            title="Automation Workflows" 
            action={
              <div className="flex gap-3">
                <select className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase outline-none">
                  <option>Select Time Period</option>
                </select>
                <div className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  📅 0024 – April 23, 2024
                </div>
              </div>
            }
          >
            <div className="space-y-4">
              {WORKFLOWS.map((wf) => (
                <div key={wf.id} className="p-5 bg-white/[0.02] border border-white/5 rounded-[24px] hover:bg-white/[0.04] transition-all group">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl grayscale group-hover:grayscale-0 transition-all ${wf.color.replace('text-', 'bg-').replace('400', '500/10')}`}>
                        {wf.id === 1 ? '🎓' : wf.id === 2 ? '🏖️' : wf.id === 3 ? '⌛' : '💰'}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white tracking-tight">{wf.title}</h4>
                        <p className="text-xs text-slate-400 mt-1">{wf.desc}</p>
                        <div className="flex items-center gap-4 mt-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                           <span className="flex items-center gap-1">📍 {wf.details.split('|')[0]}</span>
                           <span className="flex items-center gap-1">🕒 {wf.details.split('|')[1]}</span>
                           <span className="flex items-center gap-1">🔄 {wf.details.split('|')[2]}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded-full border border-white/10">
                       <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter ml-1">OM</span>
                       <div className="w-6 h-3 bg-emerald-500 rounded-full relative">
                          <div className="absolute right-0.5 top-0.5 w-2 h-2 bg-white rounded-full" />
                       </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Flow Visualization */}
          <GlassCard title="Automated Triggers and Actions">
            <div className="relative pt-4 pb-8 overflow-x-auto no-scrollbar">
               <div className="flex items-center gap-2 min-w-[800px]">
                  {PROCESS_STEPS.map((step, i) => (
                    <React.Fragment key={i}>
                      <div className="flex flex-col items-center gap-3 w-32 group">
                        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl group-hover:border-[#8252e9]/50 group-hover:scale-110 transition-all relative">
                           {step.icon}
                           {i === 0 && <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#8252e9] rounded-full border-2 border-[#0f172a] shadow-[0_0_8px_#8252e9]" />}
                        </div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight text-center leading-tight h-8 px-2">{step.label}</p>
                      </div>
                      {i < PROCESS_STEPS.length - 1 && (
                        <div className="flex-1 flex justify-center text-slate-700">
                           {i === 5 ? <span className="text-xs">⟷</span> : <span className="text-xs">⟶</span>}
                        </div>
                      )}
                    </React.Fragment>
                  ))}
               </div>
            </div>
            <div className="flex justify-end gap-3 mt-4 border-t border-white/5 pt-4">
               <button className="text-slate-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeWidth="2.5"/></svg></button>
               <button className="text-slate-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" strokeWidth="2"/></svg></button>
               <button className="text-slate-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" strokeWidth="2"/></svg></button>
               <button className="text-slate-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeWidth="2"/></svg></button>
            </div>
          </GlassCard>

          {/* HR Assistant Main Panel */}
          <GlassCard>
             <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-2xl border border-emerald-500/30">🤖</div>
                <div className="flex-1 space-y-4">
                   <div>
                      <h3 className="text-base font-black text-white italic">Va HR Assistant</h3>
                      <p className="text-xs text-slate-400">Hi Emily; How can I asist you today?</p>
                   </div>
                   <div className="space-y-2">
                      <button className="w-full text-left p-3.5 bg-white/5 border border-white/10 rounded-[18px] text-[11px] text-slate-300 font-bold hover:bg-white/10 transition-all flex items-center gap-3">
                         <span className="text-sm">🪄</span> We il need to conduct a retention risk analysis for the Sales Department
                      </button>
                      <button className="w-full text-left p-3.5 bg-white/5 border border-white/10 rounded-[18px] text-[11px] text-slate-300 font-bold hover:bg-white/10 transition-all flex items-center gap-3">
                         <span className="text-sm">⏳</span> Schedule a leave reminder for the Sales Teem
                      </button>
                   </div>
                </div>
                <button className="text-slate-600 h-fit">•••</button>
             </div>
          </GlassCard>
        </div>

        {/* AI Tools & Insights Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <GlassCard title="AI Tools & Insights">
            <div className="space-y-6">
              {AI_TOOLS.map((tool, i) => (
                <div key={i} className="space-y-3 pb-6 border-b border-white/5 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl grayscale opacity-60">{tool.icon}</div>
                      <div>
                        <h5 className="text-[11px] font-black text-white uppercase tracking-tight">{tool.title}</h5>
                        <p className="text-[10px] text-slate-500 leading-relaxed mt-1">{tool.desc}</p>
                      </div>
                    </div>
                    {i === 0 && <span className="text-[#8252e9] text-xs">+</span>}
                  </div>
                  <button className="w-full py-2 bg-[#8252e9]/10 text-[#8252e9] text-[9px] font-black uppercase tracking-widest rounded-xl border border-[#8252e9]/20 hover:bg-[#8252e9] hover:text-white transition-all">
                    {tool.action}
                  </button>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="!p-0 overflow-hidden">
             <div className="p-6 bg-gradient-to-br from-emerald-500/10 to-transparent">
                <div className="flex gap-3 items-start mb-6">
                   <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-lg">🤖</div>
                   <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-tight">Va HR Assistant</h4>
                      <p className="text-[10px] text-slate-500 font-bold mt-1">Hi Emily; How can I assist you today?</p>
                   </div>
                </div>
                <div className="space-y-3">
                   <button className="w-full text-left p-3 bg-white/5 border border-white/5 rounded-xl text-[9px] text-slate-400 font-bold leading-relaxed flex items-start gap-2 hover:text-white transition-colors">
                      <span className="mt-0.5">🪄</span>
                      We il need to conduct a retention risk analysis for the Sales Department.
                   </button>
                   <button className="w-full text-left p-3 bg-white/5 border border-white/5 rounded-xl text-[9px] text-slate-400 font-bold leading-relaxed flex items-start gap-2 hover:text-white transition-colors">
                      <span className="mt-0.5">📄</span>
                      Schedule a leave reminder for the Sales Teem.
                   </button>
                   <button className="w-full text-left p-3 bg-white/5 border border-white/5 rounded-xl text-[9px] text-slate-400 font-bold leading-relaxed flex items-start gap-2 hover:text-white transition-colors">
                      <span className="mt-0.5">🎯</span>
                      Generate an onboarding task 1st for our new QA Fests.
                   </button>
                </div>
             </div>
             <button className="w-full p-4 flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-all border-t border-white/5">
                View All Suggestions <span className="text-lg">›</span>
             </button>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default AutomationAI;
