
import React, { useState } from 'react';
import GlassCard from '../components/GlassCard';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  AreaChart, Area
} from 'recharts';

const LEAVE_STATS = [
  { label: 'Employees on Leave Today', val: '12', icon: '📁', action: 'View List', color: 'border-l-emerald-500' },
  { label: 'Pending Leave Requests', val: '8', icon: '📝', action: 'View List', color: 'border-l-amber-500' },
  { label: 'Approved This Month', val: '54', delta: '+15 from last month', icon: '🔥', color: 'border-l-purple-500' },
  { label: 'Rejected Requests', val: '5', delta: '-2 from last month', icon: '🚫', color: 'border-l-rose-500' },
  { label: 'Upcoming Leaves Next 7 Days', val: '16', icon: '📅', action: 'View List', color: 'border-l-blue-500' },
];

const PENDING_REQUESTS = [
  { id: 1, name: 'Kelly Robinson', type: 'Annual Leave', avatar: 'https://picsum.photos/40?sig=k1', dates: 'Apr 20 - Apr 25' },
  { id: 2, name: 'Amanda Ward', type: 'Sick Leave', avatar: 'https://picsum.photos/40?sig=a1', dates: 'Apr 18 - Apr 19' },
  { id: 3, name: 'Robert Davis', type: 'Casual Leave', avatar: 'https://picsum.photos/40?sig=r1', dates: 'May 02 - May 05' },
  { id: 4, name: 'Michael Carter', type: 'Maternity', avatar: 'https://picsum.photos/40?sig=m1', dates: 'Jun 10 - Sep 10' },
  { id: 5, name: 'Sarah Mitchell', type: 'Annual Leave', avatar: 'https://picsum.photos/40?sig=s1', dates: 'Apr 28 - May 02' },
];

const LEAVE_BALANCE_DATA = [
  { name: 'Brian Clark', dept: 'Marketing', type: 'Annual', duration: '20 days', usage: 3, expiry: '01/01/2025', avatar: 'https://picsum.photos/40?sig=b1' },
  { name: 'Kelly Robinson', dept: 'Marketing', type: 'Annual', duration: '20 days', usage: 8, expiry: '01/01/2025', avatar: 'https://picsum.photos/40?sig=k2' },
  { name: 'John Smith', dept: 'Engineering', type: 'Annual', duration: '20 days', usage: 11, expiry: '01/01/2025', avatar: 'https://picsum.photos/40?sig=j1' },
  { name: 'Enna Wilson', dept: 'Marketing', type: 'Casual', duration: '20 days', usage: 9, expiry: '01/01/2025', avatar: 'https://picsum.photos/40?sig=e1' },
  { name: 'Lisa Martin', dept: 'Engineering', type: 'Annual', duration: '20 days', usage: 15, expiry: '01/01/2025', avatar: 'https://picsum.photos/40?sig=l1' },
];

const ANALYTICS_PIE = [
  { name: 'Annual', value: 200, color: '#4c49d8' },
  { name: 'Sick', value: 80, color: '#f59e0b' },
  { name: 'Casual', value: 60, color: '#10b981' },
  { name: 'Maternity', value: 35, color: '#ef4444' },
];

const ANALYTICS_BAR = [
  { name: 'Eng', value: 75, fill: '#4c49d8' },
  { name: 'Sales', value: 45, fill: '#8252e9' },
  { name: 'Mkt', value: 90, fill: '#10b981' },
  { name: 'HR', value: 30, fill: '#f59e0b' },
];

const Leave: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Leave Dashboard');

  const tabs = [
    'Leave Dashboard',
    'Leave Requests',
    'Leave Policies',
    'Absence Tracking',
    'Holiday Calendar'
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-white tracking-tight">Leave Management</h2>
            <span className="text-slate-500 font-medium text-lg">{activeTab}</span>
          </div>
        </div>
        <button className="px-6 py-2.5 bg-[#f59e0b] hover:bg-[#d97706] text-white font-black text-[11px] uppercase tracking-widest rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-95">
          Apply Leave &gt;
        </button>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-8 border-b border-white/5 pb-0 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 text-[10px] font-black uppercase tracking-widest relative transition-all whitespace-nowrap ${activeTab === tab ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {tab}
            {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#8252e9] shadow-[0_0_8px_#8252e9]" />}
          </button>
        ))}
      </div>

      {/* Main Content Areas */}
      <div className="animate-in slide-in-from-bottom-2 duration-500">
        
        {activeTab === 'Leave Dashboard' && (
          <div className="space-y-6">
            {/* Summary Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {LEAVE_STATS.map((stat, idx) => (
                <GlassCard key={idx} className={`!p-4 border-l-4 ${stat.color} hover:bg-white/[0.04] transition-all cursor-default`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-3xl font-black text-white">{stat.val}</span>
                    <span className="p-1.5 bg-white/5 rounded-lg text-lg grayscale opacity-60">{stat.icon}</span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight leading-tight mb-2 h-6 flex items-center">{stat.label}</p>
                  {stat.delta ? (
                    <p className="text-[9px] font-bold text-amber-500/80">{stat.delta}</p>
                  ) : (
                    <button className="text-[9px] font-black text-[#8252e9] uppercase tracking-widest hover:underline">{stat.action} &gt;</button>
                  )}
                </GlassCard>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8 space-y-6">
                <GlassCard title="April 2024" className="overflow-hidden" action={
                  <div className="flex gap-2">
                     {['Month', 'Week', 'Today'].map(p => (
                       <button key={p} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold text-slate-400 hover:text-white">{p}</button>
                     ))}
                  </div>
                }>
                  <div className="grid grid-cols-7 gap-px bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                     {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                       <div key={d} className="bg-[#0f172a] p-3 text-center text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">{d}</div>
                     ))}
                     {Array.from({ length: 35 }).map((_, i) => {
                       const day = i - 6;
                       const isTomLeave = day >= 15 && day <= 16;
                       const isSamLeave = day === 24;
                       const isToday = day === 23;
                       return (
                         <div key={i} className={`bg-[#0f172a] h-20 p-2 border-r border-b border-white/5 relative hover:bg-white/[0.01] transition-colors ${day <= 0 || day > 30 ? 'opacity-20' : ''}`}>
                            <span className={`text-[10px] font-bold ${isToday ? 'bg-[#f59e0b] text-white w-5 h-5 flex items-center justify-center rounded-full' : 'text-slate-500'}`}>{day > 0 && day <= 30 ? day : ''}</span>
                            {isTomLeave && day === 15 && (
                              <div className="absolute top-8 left-0 w-[200%] h-6 bg-slate-500/20 border-l-2 border-slate-400 rounded-r-lg z-10 p-1 flex items-center gap-1">
                                 <img src="https://picsum.photos/20?sig=tom" className="w-4 h-4 rounded-full" />
                                 <span className="text-[8px] font-black text-white truncate">Tom Green</span>
                              </div>
                            )}
                         </div>
                       );
                     })}
                  </div>
                </GlassCard>

                <GlassCard title="Leave Balance Overview" action={<button className="text-[10px] font-black text-[#8252e9] uppercase tracking-widest border border-[#8252e9]/20 px-3 py-1.5 rounded-lg">Export CSV</button>}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                             <th className="px-4 py-4">Employee</th>
                             <th className="px-4 py-4">Department</th>
                             <th className="px-4 py-4">Leave Type</th>
                             <th className="px-4 py-4">Usage</th>
                             <th className="px-4 py-4 text-right">Expiry Date</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-white/5">
                          {LEAVE_BALANCE_DATA.map((row, i) => (
                            <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                              <td className="px-4 py-4 flex items-center gap-3">
                                 <img src={row.avatar} className="w-7 h-7 rounded-full border border-white/10" />
                                 <span className="text-xs font-bold text-white tracking-tight">{row.name}</span>
                              </td>
                              <td className="px-4 py-4 text-xs text-slate-400">{row.dept}</td>
                              <td className="px-4 py-4">
                                 <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${row.type === 'Annual' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}>{row.type}</span>
                              </td>
                              <td className="px-4 py-4 text-xs font-bold text-white">{row.usage} days</td>
                              <td className="px-4 py-4 text-xs text-slate-500 text-right font-mono">{row.expiry}</td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                  </div>
                </GlassCard>
              </div>

              <div className="lg:col-span-4 space-y-6">
                <GlassCard title="Pending Requests" action={<span className="text-slate-500 font-black text-sm">8</span>}>
                   <div className="space-y-4">
                      {PENDING_REQUESTS.map((req) => (
                        <div key={req.id} className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <img src={req.avatar} className="w-9 h-9 rounded-full border border-white/10" alt="" />
                              <div>
                                 <p className="text-[11px] font-black text-white">{req.name}</p>
                                 <p className="text-[9px] text-slate-500 font-bold uppercase">{req.dates}</p>
                              </div>
                           </div>
                           <div className="flex gap-1">
                              <button className="px-2 py-1 bg-emerald-500 text-white text-[8px] font-black rounded uppercase">Approve</button>
                              <button className="px-2 py-1 bg-rose-500 text-white text-[8px] font-black rounded uppercase">Reject</button>
                           </div>
                        </div>
                      ))}
                   </div>
                </GlassCard>

                <GlassCard title="Leave Analytics">
                   <div className="h-48 relative">
                      <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                            <Pie data={ANALYTICS_PIE} innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value" stroke="none">
                               {ANALYTICS_PIE.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                            </Pie>
                            <Tooltip />
                         </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                         <span className="text-2xl font-black text-white">375</span>
                         <span className="text-[8px] text-slate-500 font-black uppercase">Total Days</span>
                      </div>
                   </div>
                </GlassCard>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Leave Requests' && (
          <GlassCard className="!p-0 overflow-hidden">
             <div className="p-4 border-b border-white/5 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-3">
                   {['All Status', 'Pending', 'Approved', 'Rejected'].map(s => (
                     <button key={s} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black uppercase text-slate-400 hover:text-white transition-all">{s}</button>
                   ))}
                </div>
                <div className="relative">
                   <input type="text" placeholder="Search requests..." className="bg-white/5 border border-white/10 rounded-lg py-1.5 px-4 text-[11px] text-slate-300 w-64 focus:outline-none focus:border-[#8252e9]/50" />
                </div>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead>
                      <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 bg-white/[0.01]">
                         <th className="px-6 py-4">Employee</th>
                         <th className="px-6 py-4">Leave Type</th>
                         <th className="px-6 py-4">Duration</th>
                         <th className="px-6 py-4">Status</th>
                         <th className="px-6 py-4">Applied On</th>
                         <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                      {[1,2,3,4,5,6].map(i => (
                        <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                           <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                 <img src={`https://picsum.photos/40?sig=req${i}`} className="w-8 h-8 rounded-full border border-white/10" />
                                 <div>
                                    <p className="text-xs font-bold text-white tracking-tight">Employee Name</p>
                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Engineering</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <span className="text-xs font-bold text-slate-300">Annual Leave</span>
                           </td>
                           <td className="px-6 py-4">
                              <div className="text-xs font-black text-white">5 Days</div>
                              <div className="text-[9px] text-slate-500 font-bold">Apr 15 - Apr 19</div>
                           </td>
                           <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${i % 2 === 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                 {i % 2 === 0 ? 'Approved' : 'Pending'}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-xs text-slate-400 font-mono tracking-tighter">Apr 02, 2024</td>
                           <td className="px-6 py-4 text-right">
                              <button className="text-[10px] font-black text-[#8252e9] uppercase tracking-widest hover:underline">Review Request</button>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </GlassCard>
        )}

        {activeTab === 'Leave Policies' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {[
               { title: 'Annual Leave', quota: '25 Days', accrual: 'Monthly (2.08 days)', carry: 'Max 10 days', color: 'border-t-blue-500' },
               { title: 'Sick Leave', quota: '12 Days', accrual: 'Annual upfront', carry: 'Non-cumulative', color: 'border-t-emerald-500' },
               { title: 'Casual Leave', quota: '8 Days', accrual: 'Pro-rata', carry: 'Non-cumulative', color: 'border-t-amber-500' },
               { title: 'Maternity Leave', quota: '90 Days', accrual: 'Per incident', carry: 'N/A', color: 'border-t-purple-500' },
               { title: 'Paternity Leave', quota: '10 Days', accrual: 'Per incident', carry: 'N/A', color: 'border-t-rose-500' },
               { title: 'Study Leave', quota: '5 Days', accrual: 'Approval based', carry: 'N/A', color: 'border-t-slate-500' },
             ].map((policy, i) => (
               <GlassCard key={i} className={`border-t-4 ${policy.color}`}>
                  <h4 className="text-sm font-black text-white uppercase tracking-tight mb-4">{policy.title}</h4>
                  <div className="space-y-3">
                     <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-slate-500 uppercase tracking-widest">Yearly Quota</span>
                        <span className="text-white">{policy.quota}</span>
                     </div>
                     <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-slate-500 uppercase tracking-widest">Accrual Method</span>
                        <span className="text-slate-300">{policy.accrual}</span>
                     </div>
                     <div className="flex justify-between items-center text-[10px] font-bold pb-4">
                        <span className="text-slate-500 uppercase tracking-widest">Carry Forward</span>
                        <span className="text-slate-300">{policy.carry}</span>
                     </div>
                     <button className="w-full pt-4 border-t border-white/5 text-[10px] font-black text-[#8252e9] uppercase tracking-widest hover:text-white transition-colors">Edit Policy Details</button>
                  </div>
               </GlassCard>
             ))}
          </div>
        )}

        {activeTab === 'Absence Tracking' && (
          <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <GlassCard title="Unplanned Absence Rate" className="text-center">
                   <div className="text-4xl font-black text-rose-500 my-2">4.2%</div>
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Target: &lt;3%</p>
                </GlassCard>
                <GlassCard title="Absenteeism Heatmap" className="md:col-span-2">
                   <div className="h-24 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Presence Trends across days of the week
                   </div>
                </GlassCard>
             </div>
             
             <GlassCard title="Staffing Coverage Matrix (Real-time)" className="!p-0 overflow-hidden">
                <div className="overflow-x-auto no-scrollbar">
                   <div className="min-w-[1000px] p-6">
                      <div className="flex gap-1 mb-2">
                         <div className="w-48 flex-shrink-0" />
                         {Array.from({length: 31}).map((_, i) => (
                           <div key={i} className="flex-1 text-center text-[9px] font-black text-slate-600 uppercase">{i+1}</div>
                         ))}
                      </div>
                      {['Engineering', 'Sales', 'Marketing', 'Customer Success'].map((dept, i) => (
                        <div key={dept} className="flex gap-1 mb-1 items-center">
                           <div className="w-48 flex-shrink-0 text-[10px] font-black text-white uppercase tracking-widest border-r border-white/5 mr-2">{dept}</div>
                           {Array.from({length: 31}).map((_, j) => {
                             const isWeekend = j % 7 >= 5;
                             const hasAbsence = Math.random() > 0.9;
                             return (
                               <div key={j} className={`flex-1 h-6 rounded-sm ${isWeekend ? 'bg-white/5' : hasAbsence ? 'bg-rose-500/40 border border-rose-500/20' : 'bg-emerald-500/10 border border-emerald-500/5'}`} />
                             );
                           })}
                        </div>
                      ))}
                   </div>
                </div>
                <div className="p-4 border-t border-white/5 bg-white/[0.01] flex justify-between items-center">
                   <div className="flex gap-4">
                      <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-sm bg-emerald-500/40" /> <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Fully Staffed</span></div>
                      <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-sm bg-rose-500/40" /> <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Understaffed Warning</span></div>
                   </div>
                </div>
             </GlassCard>
          </div>
        )}

        {activeTab === 'Holiday Calendar' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div className="lg:col-span-2">
                <GlassCard title="2024 Global Holidays">
                   <div className="space-y-2">
                      {[
                        { date: 'Jan 01', name: 'New Year\'s Day', type: 'Global', desc: 'Mandatory non-working day across all branches.' },
                        { date: 'Mar 29', name: 'Good Friday', type: 'Regional', desc: 'Observed in EU and Americas branches.' },
                        { date: 'Apr 01', name: 'Easter Monday', type: 'Regional', desc: 'Observed in EU and Americas branches.' },
                        { date: 'May 01', name: 'Labor Day', type: 'Global', desc: 'Mandatory non-working day.' },
                        { date: 'Jul 04', name: 'Independence Day', type: 'USA Only', desc: 'Observed in US branches only.' },
                        { date: 'Dec 25', name: 'Christmas Day', type: 'Global', desc: 'Year-end holiday closure.' },
                      ].map((holiday, i) => (
                        <div key={i} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-6 hover:bg-white/[0.04] transition-all">
                           <div className="w-16 h-16 rounded-xl bg-[#8252e9]/10 border border-[#8252e9]/20 flex flex-col items-center justify-center">
                              <span className="text-[9px] font-black text-[#8252e9] uppercase tracking-widest">{holiday.date.split(' ')[0]}</span>
                              <span className="text-xl font-black text-white">{holiday.date.split(' ')[1]}</span>
                           </div>
                           <div className="flex-1">
                              <div className="flex justify-between items-center mb-1">
                                 <h5 className="text-sm font-bold text-white tracking-tight">{holiday.name}</h5>
                                 <span className="px-2 py-0.5 bg-white/5 rounded text-[8px] font-black uppercase text-slate-500 border border-white/10">{holiday.type}</span>
                              </div>
                              <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-1">{holiday.desc}</p>
                           </div>
                        </div>
                      ))}
                   </div>
                </GlassCard>
             </div>
             <div className="space-y-6">
                <GlassCard title="Next Holiday Pulse" className="!bg-[#8252e9]/10 border-[#8252e9]/20 text-center !p-10">
                   <div className="text-5xl mb-4">🎉</div>
                   <h4 className="text-xl font-black text-white tracking-tight mb-1">Labor Day</h4>
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-6">In 12 Days (May 01)</p>
                   <div className="h-1 bg-white/5 rounded-full overflow-hidden mb-8">
                      <div className="h-full bg-emerald-500" style={{ width: '82%' }} />
                   </div>
                   <button className="w-full py-2.5 bg-white text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-all shadow-xl">Announce To Team</button>
                </GlassCard>
                <GlassCard title="Holiday Compliance">
                   <p className="text-[11px] text-slate-400 leading-relaxed mb-4">Ensure all regional specific mandatory holidays are synced with branch-specific attendance rules.</p>
                   <button className="w-full py-2 bg-white/5 rounded-xl text-[10px] font-black uppercase text-slate-400 border border-white/10">Manage Branch Rules</button>
                </GlassCard>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leave;
