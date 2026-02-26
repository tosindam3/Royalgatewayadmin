
import React from 'react';
import GlassCard from '../components/GlassCard';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell, LineChart, Line
} from 'recharts';

const headcountData = [
  { name: 'Oct', count: 425 },
  { name: 'Dec', count: 428 },
  { name: 'Dec', count: 432 },
  { name: 'Jan', count: 428 },
  { name: 'Feb', count: 430 },
  { name: 'Mar', count: 435 },
];

const leaveData = [
  { name: 'Engineering', annual: 10, sick: 15, casual: 5, maternity: 2 },
  { name: 'S4SS', annual: 20, sick: 5, casual: 10, maternity: 5 },
  { name: 'Marketing', annual: 15, sick: 10, casual: 15, maternity: 8 },
  { name: 'IT', annual: 12, sick: 12, casual: 8, maternity: 4 },
];

const absenteeismData = [
  { name: 'Jan', rate: 2.5 },
  { name: 'Feb', rate: 3.1 },
  { name: 'Mar', rate: 2.8 },
];

const turnoverData = [
  { name: 'Promoted', val: 100, color: '#4c49d8' },
  { name: 'Involuntary Exit', val: 45, color: '#f59e0b' },
  { name: 'Offers Made', val: 35, color: '#10b981' },
  { name: 'Hired', val: 55, color: '#8252e9' },
];

const Analytics: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase italic">Analytics <span className="text-slate-500 font-normal">Dashboard</span></h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <span className="text-lg">📅</span>
            Jan 25, 2024 – April 23, 2024
          </div>
          <div className="flex gap-2">
            <button className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeWidth="2"/></svg>
            </button>
            <button className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" strokeWidth="2"/></svg>
            </button>
            <button className="p-2.5 text-slate-500">•••</button>
          </div>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Employees', val: '425', delta: '+ 8 this month', icon: '👥', color: 'text-blue-400' },
          { label: 'Turnover Rate', val: '4.2%', delta: '+ 0.5% vs last month', icon: '🔄', color: 'text-orange-400' },
          { label: 'Average Tenure', val: '3.4 years', delta: '+ 1.3% week', icon: '⏳', color: 'text-emerald-400' },
          { label: 'Active Job Openings', val: '15', delta: '+ 3.10 result', icon: '💼', color: 'text-purple-400' },
        ].map((stat, i) => (
          <GlassCard key={i} className="!p-5 hover:bg-white/[0.04] transition-all group">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-3xl font-black text-white tracking-tighter">{stat.val}</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{stat.label}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl grayscale opacity-40 group-hover:opacity-100 transition-all">
                {stat.icon}
              </div>
            </div>
            <p className={`text-[9px] font-black uppercase tracking-tight mt-4 ${stat.delta.includes('+') ? 'text-emerald-400' : 'text-rose-400'}`}>
              {stat.delta}
            </p>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Charts Column */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Headcount Over Time */}
            <GlassCard title="Headcount Over Time" action={<span className="text-[9px] font-black text-slate-500 uppercase">March: 435</span>}>
              <div className="h-48 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={headcountData}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8252e9" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8252e9" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} domain={['dataMin - 10', 'dataMax + 10']} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }} />
                    <Area type="monotone" dataKey="count" stroke="#8252e9" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            {/* Employee Turnover Reasons */}
            <GlassCard title="Employee Turnover" action={<button className="px-2 py-1 bg-blue-500 text-white text-[8px] font-black uppercase rounded">Turnover Rate: 4.2%</button>}>
              <div className="h-48 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={turnoverData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" horizontal={false} />
                    <XAxis type="number" axisLine={false} tickLine={false} hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} width={80} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }} />
                    <Bar dataKey="val" radius={[0, 4, 4, 0]}>
                      {turnoverData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} opacity={0.6} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Hiring Funnel */}
            <GlassCard title="Hiring Funnel">
              <div className="space-y-4 py-2">
                {[
                  { label: 'New Applicants', val: 100, current: 248, color: 'bg-blue-500' },
                  { label: 'Involuntary Exit', val: 33.8, current: 47, color: 'bg-orange-500' },
                  { label: 'Retirement', val: 19.1, current: 15, color: 'bg-emerald-500' },
                ].map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-[8px] text-white font-black">{item.val}%</span>
                        {item.label}
                      </div>
                      <span>{item.current}</span>
                    </div>
                    <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <div className={`h-full ${item.color} opacity-40 transition-all duration-1000`} style={{ width: `${item.val}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Leave Statistics */}
            <GlassCard title="Leave Statistics">
              <div className="h-48 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={leaveData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#64748b' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }} />
                    <Bar dataKey="annual" stackId="a" fill="#4c49d8" opacity={0.6} />
                    <Bar dataKey="sick" stackId="a" fill="#f59e0b" opacity={0.6} />
                    <Bar dataKey="casual" stackId="a" fill="#10b981" opacity={0.6} />
                    <Bar dataKey="maternity" stackId="a" fill="#ef4444" opacity={0.6} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-4 mt-4 justify-center">
                {[{l:'Annual', c:'#4c49d8'}, {l:'Sick', c:'#f59e0b'}, {l:'Casual', c:'#10b981'}, {l:'Maternity', c:'#ef4444'}].map(leg => (
                  <div key={leg.l} className="flex items-center gap-1.5 text-[8px] font-black text-slate-500 uppercase tracking-widest">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: leg.c }} />
                    {leg.l}
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Employee Demographics */}
             <GlassCard title="Employee Demographics" action={<span className="text-[9px] font-black text-slate-500 uppercase">4.8 10% ▾</span>}>
                <div className="flex items-center justify-center gap-8 py-4 relative">
                   <div className="flex items-center relative h-32 w-48">
                      <div className="w-24 h-24 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-[10px] font-black text-blue-400 z-10">
                        52.5%<br/>Mext
                      </div>
                      <div className="w-24 h-24 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-[10px] font-black text-rose-400 absolute left-16 z-20">
                        47.5%<br/>Plenme
                      </div>
                   </div>
                   <div className="space-y-3">
                      {[
                        { l: 'Gender', c: 'bg-emerald-400' },
                        { l: 'Age - 9.2%', c: 'bg-orange-400' },
                        { l: 'Reurement - 19 9%', c: 'bg-rose-400' },
                      ].map((d, i) => (
                        <div key={i} className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                           <div className={`w-2 h-2 rounded-full ${d.c}`} />
                           {d.l}
                        </div>
                      ))}
                   </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-4 bg-white/5 p-3 rounded-2xl">
                   <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-xl">📄</div>
                   <div className="flex-1">
                      <p className="text-[10px] font-black text-white uppercase tracking-tight">PariTimePolicy_Update.docx</p>
                      <p className="text-[8px] text-slate-600 font-bold uppercase">2.2 MB • 1.2 MB</p>
                   </div>
                   <button className="text-[8px] font-black text-[#8252e9] uppercase tracking-widest hover:underline">Download ▾</button>
                </div>
             </GlassCard>

             {/* Absenteeism Rate */}
             <GlassCard title="Absenteeism Rate">
                <div className="flex justify-between items-center mb-6">
                   <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Average Absenteeism Rate</p>
                      <p className="text-xl font-black text-white">2.7%</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Average Days Absent</p>
                      <p className="text-xl font-black text-white">3.1</p>
                   </div>
                </div>
                <div className="h-32 w-full">
                   <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={absenteeismData}>
                        <defs>
                          <linearGradient id="colorAbs" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4c49d8" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#4c49d8" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" hide />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }} />
                        <Area type="monotone" dataKey="rate" stroke="#4c49d8" strokeWidth={2} fill="url(#colorAbs)" dot={{ r: 4, fill: '#4c49d8' }} />
                      </AreaChart>
                   </ResponsiveContainer>
                </div>
                <div className="flex justify-between mt-4 text-[8px] font-black text-slate-600 uppercase tracking-[0.2em]">
                   <span>Jan</span>
                   <span>Feb</span>
                   <span>Mar</span>
                </div>
             </GlassCard>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Reports */}
          <GlassCard title="Quick Reports" action={<span className="text-xl">📊</span>}>
            <div className="space-y-1">
              {[
                { l: 'Aging Breakdown', i: '📊' },
                { l: 'Performance Tiends', i: '📈' },
                { l: 'Heedcoa by Department', i: '🏢' },
                { l: 'Overtine Analysis', i: '⏱️' },
                { l: 'Employee Secsibation', i: '👤' },
                { l: 'Turnover by Department', i: '🏗️' },
                { l: 'Diversity & Lactuson', i: '🌈' },
                { l: 'Payrol Summary', i: '💰' },
              ].map((rep, i) => (
                <button key={i} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all text-left group">
                   <span className="text-xs grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100">{rep.i}</span>
                   <span className="text-[10px] font-bold text-slate-400 group-hover:text-white uppercase tracking-tight">{rep.l}</span>
                </button>
              ))}
            </div>
          </GlassCard>

          {/* Top Performers */}
          <GlassCard title="Top Performers" action={<button className="text-slate-500">•••</button>}>
            <div className="space-y-4">
              {[
                { t: 'Sales/Turnover by Dep...', s: 'saftmation 1 loona ago', i: '✉️' },
                { t: 'Rehiring Analysis', s: 'prthmatioin day ago', i: '📧' },
                { t: 'Demographics Report', s: 'prhmaloci 0 dag ago', i: '📑' },
              ].map((perf, i) => (
                <div key={i} className="flex gap-4 items-start p-3 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] transition-all cursor-pointer">
                   <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-400">{perf.i}</div>
                   <div>
                      <h5 className="text-[11px] font-black text-white uppercase tracking-tight">{perf.t}</h5>
                      <p className="text-[9px] text-slate-500 mt-1 font-bold">{perf.s}</p>
                   </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Analytics Activity */}
          <GlassCard title="Analytics Activity" action={<span className="text-slate-500 font-black">›</span>}>
             <div className="space-y-6">
                {[
                  { t: 'Sales/Turnover by Depart...', s: 'pothmation 1 loona ago', c: 'bg-blue-500' },
                  { t: 'Rehiring Analysis', s: 'pothmatioin day ago', c: 'bg-orange-500' },
                ].map((act, i) => (
                  <div key={i} className="flex gap-4 group">
                     <div className={`w-8 h-8 rounded-lg ${act.c}/20 flex items-center justify-center shrink-0`}>
                        <div className={`w-2 h-2 rounded-full ${act.c}`} />
                     </div>
                     <div className="flex-1">
                        <p className="text-[11px] font-black text-white uppercase tracking-tight">{act.t}</p>
                        <p className="text-[9px] text-slate-600 mt-1 font-bold">{act.s}</p>
                     </div>
                  </div>
                ))}
             </div>
             <div className="mt-8 pt-6 border-t border-white/5 flex gap-2">
                <button className="flex-1 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-all">Search Jrptions ▾</button>
                <button className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-500 hover:text-white transition-all">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeWidth="2"/></svg>
                </button>
             </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
