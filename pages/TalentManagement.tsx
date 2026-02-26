
import React from 'react';
import GlassCard from '../components/GlassCard';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell
} from 'recharts';

const CANDIDATE_STATS = [
  { name: 'New Applicants', count: 248, color: '#4c49d8' },
  { name: 'Screening', count: 12, color: '#8252e9' },
  { name: 'Month Gata9', count: 12, color: '#f59e0b' },
  { name: 'Interviews', count: 3, color: '#10b981' },
  { name: 'Done Merged', count: 2, color: '#94a3b8' },
];

const CANDIDATE_CHART_DATA = [
  { name: 'Now Intes', val: 40 },
  { name: '25%', val: 30 },
  { name: 'Sate', val: 25 },
  { name: 'Cocatal', val: 35 },
  { name: 'Aanages', val: 80 },
  { name: 'New', val: 70 },
];

const JOB_OPENINGS = [
  { title: 'Software Engineer', openings: 2, applicants: 36, updated: '15 mins ago', status: 'Interview', statusColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { title: 'Marketing Specialist', openings: 1, applicants: 18, updated: '1 day ago', status: 'Shortlisted', statusColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { title: 'Product Manager', openings: 1, applicants: 12, updated: '2 days ago', status: 'Open', statusColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { title: 'Sales Associate', openings: 2, applicants: 14, updated: '3 days ago', status: 'Open', statusColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { title: 'Technical Support', openings: 1, applicants: 8, updated: '5 days ago', status: 'Open', statusColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
];

const ONBOARDING_PROGRESS = [
  { title: 'New Hire Lortentation', dept: 'All Departments', hires: 20, remaining: 59, expiry: '01/01/2025', progress: 76, avatar: 'https://picsum.photos/32?sig=h1' },
  { title: 'Sales Team Ramplop', dept: 'Sales Aecoult', hires: 20, remaining: 45, expiry: '01/01/2025', progress: 50, avatar: 'https://picsum.photos/32?sig=h2' },
  { title: 'Software Engineering Onboarding', dept: 'Engineering', hires: 20, remaining: 12, expiry: '01/01/2025', progress: 40, avatar: 'https://picsum.photos/32?sig=h3' },
  { title: 'Customer Support Training', dept: 'IT Teams', hires: 20, remaining: 10, expiry: '01/01/2025', progress: 20, avatar: 'https://picsum.photos/32?sig=h4' },
];

const TalentManagement: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase italic">Talent Management <span className="text-slate-500 font-normal">Dashboard</span></h2>
        </div>
        <button className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-black text-[11px] uppercase tracking-widest rounded-xl shadow-lg shadow-orange-500/20 active:scale-95 transition-all">
          + Add Candidate
        </button>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Active Job Openings', val: '14', footer: 'View All ›', icon: '💼', color: 'text-blue-400' },
          { label: 'New Applicants', val: '68', footer: '+25% vs last 30 days', icon: '👤', color: 'text-emerald-400' },
          { label: 'Interviews Scheduled Today', val: '5', footer: 'Today: 3', icon: '📅', color: 'text-rose-400' },
          { label: 'Active Onboarding Programs', val: '8', footer: 'Front: 6', icon: '🎓', color: 'text-purple-400' },
          { label: 'Active Onshore Days', val: '8', footer: 'View List', icon: '🏝️', color: 'text-blue-500' },
        ].map((stat, i) => (
          <GlassCard key={i} className="!p-4 border-white/5 hover:bg-white/[0.04] transition-all relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[28px] font-black text-white">{stat.val}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{stat.label}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl grayscale opacity-40 group-hover:opacity-100 transition-all">
                {stat.icon}
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5">
              <span className={`text-[9px] font-black uppercase tracking-widest ${stat.color === 'text-emerald-400' ? 'text-emerald-400' : 'text-[#8252e9]'} cursor-pointer hover:underline`}>
                {stat.footer}
              </span>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Section */}
        <div className="lg:col-span-8 space-y-6">
          {/* Active Job Openings Table */}
          <GlassCard 
            title="Active Job Openings" 
            action={
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all">+ Create Job</button>
                <button className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all">Export ▾</button>
              </div>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                    <th className="px-2 py-4">Job Title</th>
                    <th className="px-2 py-4">Openings</th>
                    <th className="px-2 py-4">Applicants</th>
                    <th className="px-2 py-4">Last Updated ▾</th>
                    <th className="px-2 py-4">Status</th>
                    <th className="px-2 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {JOB_OPENINGS.map((job, i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-2 py-4">
                        <p className="text-xs font-bold text-white tracking-tight">{job.title}</p>
                      </td>
                      <td className="px-2 py-4 text-xs font-bold text-slate-300">{job.openings}</td>
                      <td className="px-2 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{job.applicants}</span>
                          <div className="w-4 h-4 rounded bg-white/10 flex items-center justify-center text-[8px]">👤</div>
                        </div>
                      </td>
                      <td className="px-2 py-4 text-[10px] text-slate-500 font-bold uppercase">{job.updated}</td>
                      <td className="px-2 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border ${job.statusColor}`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="px-2 py-4 text-right">
                        <button className="text-slate-600 hover:text-white transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="3"/></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>

          {/* Onboarding Table Section */}
          <GlassCard 
            title="Active Onboarding" 
            className="!p-0 overflow-hidden"
            action={
              <div className="flex gap-4 items-center">
                 <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">New Hiros</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Detayl: 2</span>
                 </div>
                 <button className="text-slate-500 hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" strokeWidth="2"/></svg>
                 </button>
              </div>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/[0.01]">
                  <tr className="text-[8px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                    <th className="px-6 py-4">Job Title</th>
                    <th className="px-6 py-4">Department ▾</th>
                    <th className="px-6 py-4">New Hires</th>
                    <th className="px-6 py-4">Remaining</th>
                    <th className="px-6 py-4">Expiry Date</th>
                    <th className="px-6 py-4">Progress</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {ONBOARDING_PROGRESS.map((item, i) => (
                    <tr key={i} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={item.avatar} className="w-6 h-6 rounded-lg border border-white/10" alt="" />
                          <span className="text-[10px] font-bold text-white tracking-tight leading-tight">{item.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[8px] font-black text-slate-500 uppercase">{item.dept}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold text-slate-300">{item.hires} • 59</span>
                      </td>
                      <td className="px-6 py-4">
                         <div className="w-12 h-4 bg-white/5 rounded-full overflow-hidden relative border border-white/5">
                            <div className="h-full bg-blue-500/40" style={{ width: '40%' }} />
                            <span className="absolute inset-0 flex items-center justify-center text-[7px] font-black text-blue-300">00%</span>
                         </div>
                      </td>
                      <td className="px-6 py-4 text-[9px] font-mono text-slate-500">{item.expiry}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           <span className="text-[9px] font-black text-white">{item.progress}%</span>
                           <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-[#8252e9]" style={{ width: `${item.progress}%` }} />
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-slate-600 hover:text-white transition-colors">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="3"/></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-4 flex justify-center items-center gap-4 border-t border-white/5 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                 <span>1 – 3 of 20</span>
                 <div className="flex gap-1">
                    <button className="w-6 h-6 flex items-center justify-center bg-white/5 rounded-lg">‹</button>
                    <button className="w-6 h-6 flex items-center justify-center bg-white/5 rounded-lg">›</button>
                 </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <GlassCard title="Candidate Summary" action={<button className="text-[9px] font-black text-slate-500 uppercase bg-white/5 px-2 py-1 rounded-lg">All Clest Today ▾</button>}>
            <div className="grid grid-cols-5 gap-2 mb-6">
               {CANDIDATE_STATS.map((stat, i) => (
                 <div key={i} className="text-center">
                    <p className="text-lg font-black text-white">{stat.count}</p>
                    <p className="text-[7px] text-slate-500 uppercase font-black leading-tight break-words">{stat.name}</p>
                 </div>
               ))}
            </div>
            
            {/* Funnel visualization */}
            <div className="flex h-12 gap-px rounded-xl overflow-hidden mb-6 border border-white/5">
               {CANDIDATE_STATS.map((stat, i) => (
                 <div 
                  key={i} 
                  className="h-full relative flex items-center justify-center group" 
                  style={{ backgroundColor: stat.color, opacity: 1 - (i * 0.15), flex: 5 - i }}
                 >
                    <div className="hidden group-hover:block absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 text-[8px] font-black text-white rounded whitespace-nowrap z-10 border border-white/10">
                       {stat.name}: {stat.count}
                    </div>
                 </div>
               ))}
            </div>

            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={CANDIDATE_CHART_DATA}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 7, fill: '#64748b' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '10px' }} />
                  <Bar dataKey="val" radius={[4, 4, 0, 0]}>
                    {CANDIDATE_CHART_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 4 ? '#f59e0b' : '#8252e9'} opacity={0.6} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-end mt-2">
               <button className="text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">Date Rengs ›</button>
            </div>
          </GlassCard>

          <GlassCard title="Onboarding Progress" action={<button className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-lg">Export ▾</button>}>
            <p className="text-[10px] font-bold text-white uppercase tracking-tight mb-4">Onboarding Checklist Completeness</p>
            <div className="space-y-6">
               {[
                 { label: 'Documents Signed', progress: 92, color: 'bg-emerald-500' },
                 { label: 'Hardware Setup', progress: 66, color: 'bg-blue-500' },
                 { label: 'Knowledge Base Access', progress: 90, color: 'bg-purple-500' },
                 { label: 'Security Training', progress: 30, color: 'bg-rose-500' },
               ].map((item, i) => (
                 <div key={i} className="space-y-2">
                    <div className="flex justify-between text-[8px] font-black uppercase text-slate-400">
                       <span>{item.label}</span>
                       <span className="text-white">{item.progress}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                       <div className={`h-full ${item.color} opacity-60`} style={{ width: `${item.progress}%` }} />
                    </div>
                 </div>
               ))}
            </div>
          </GlassCard>

          <GlassCard title="Recently Hired" action={<button className="text-[9px] font-black text-blue-400 uppercase tracking-widest hover:underline">View All ›</button>}>
            <div className="space-y-4">
               {[
                 { name: 'Diolip Kapper', pos: 'Product Manager', time: '25 mins ago', avatar: 'https://picsum.photos/32?sig=rec1' },
                 { name: 'Amanda Ward', pos: 'Sales Associate', time: '1 day ago', avatar: 'https://picsum.photos/32?sig=rec2' },
               ].map((hire, i) => (
                 <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors">
                    <img src={hire.avatar} className="w-8 h-8 rounded-lg border border-white/10" alt="" />
                    <div className="flex-1">
                       <p className="text-xs font-bold text-white leading-tight">{hire.name}</p>
                       <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tight mt-0.5">{hire.pos}</p>
                    </div>
                    <span className="text-[8px] font-black text-slate-600 uppercase whitespace-nowrap">{hire.time}</span>
                 </div>
               ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default TalentManagement;
