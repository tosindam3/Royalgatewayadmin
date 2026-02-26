
import React, { useState } from 'react';
import GlassCard from '../components/GlassCard';

interface MemoItem {
  id: string;
  sender: string;
  role: string;
  time: string;
  subject: string;
  snippet: string;
  avatar: string;
  isUnread?: boolean;
}

const MEMO_LIST: MemoItem[] = [
  { id: 'm1', sender: 'Amanda Ward', role: 'HR Specialist', time: '4:30 PM', subject: 'Updated Part-Time Policy', snippet: 'Daily Exporve/Pr36App.co...', avatar: 'https://picsum.photos/40?sig=amanda', isUnread: false },
  { id: 'm2', sender: 'Kelly Robinson', role: 'Marketing', time: '3:15 PM', subject: 'Marketing Campaign Updates', snippet: 'The campaign launch strategy...', avatar: 'https://picsum.photos/40?sig=kelly' },
  { id: 'm3', sender: 'Brian Clark', role: 'Engineering', time: '1:54 PM', subject: 'Architecture Review', snippet: 'Ariel Down loading Gestasaitons...', avatar: 'https://picsum.photos/40?sig=brian' },
  { id: 'm4', sender: 'Internal Communication', role: 'System', time: '7:00 PM', subject: 'Training Signup Reminder', snippet: 'Please complete your training...', avatar: 'https://picsum.photos/40?sig=system' },
  { id: 'm5', sender: 'Olivia White', role: 'Finance', time: 'Yesterday', subject: 'Budget Approval', snippet: 'Budget Approval for Team Event...', avatar: 'https://picsum.photos/40?sig=olivia' },
  { id: 'm6', sender: 'Michael Carter', role: 'HR', time: 'Yesterday', subject: 'Recognition Program', snippet: 'Employee Recognition Program...', avatar: 'https://picsum.photos/40?sig=michael' },
];

const CHAT_LOG = [
  { id: 'c1', sender: 'Amanda Ward', msg: 'Hi all, I\'ve attached the revised policy.', time: '4:30 PM', avatar: 'https://picsum.photos/32?sig=amanda' },
  { id: 'c2', sender: 'Brian Clark', msg: 'emily.johnson@hr360app.com...', time: '4:30 PM', avatar: 'https://picsum.photos/32?sig=brian' },
  { id: 'c3', sender: 'John Smith', msg: 'Yvos hegili he bening thy support eaed, I\'l, sairt:his ortveroring checked, after the meeting.', time: '8:38 PM', avatar: 'https://picsum.photos/32?sig=john' },
  { id: 'c4', sender: 'Kelly Robinson', msg: 'The votrusen the sftae week for the product sourch, reedance it websance.', time: '2:14 PM', avatar: 'https://picsum.photos/32?sig=kelly' },
  { id: 'c5', sender: 'Tom Green', msg: 'Suit is Reviewing, the updated Stdee new.', time: '2:15 PM', avatar: 'https://picsum.photos/32?sig=tom' },
];

const MemoSystem: React.FC = () => {
  const [selectedMemoId, setSelectedMemoId] = useState('m1');

  return (
    <div className="h-[calc(100vh-140px)] flex bg-[#0f172a] rounded-[32px] overflow-hidden border border-white/5 animate-in fade-in duration-700">
      {/* Left Sidebar: Filters */}
      <aside className="w-56 bg-white/[0.02] border-r border-white/5 flex flex-col p-6 space-y-8">
        <div className="space-y-4">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2.5"/></svg>
            <input type="text" placeholder="Search..." className="w-full bg-white/5 border border-white/10 rounded-xl py-1.5 pl-9 pr-3 text-[11px] text-white focus:outline-none focus:border-[#8252e9]/50 transition-all" />
          </div>
          <nav className="space-y-1">
            {[
              { label: 'Inbox', icon: '📥', badge: 35, active: true },
              { label: 'Starred', icon: '⭐' },
              { label: 'Sent', icon: '📤' },
              { label: 'Drafts', icon: '📝', badge: 2 },
              { label: 'Scheduled', icon: '📅' },
              { label: 'Trash', icon: '🗑️' },
            ].map((item) => (
              <button key={item.label} className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${item.active ? 'bg-[#8252e9]/10 text-white' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-sm grayscale opacity-60">{item.icon}</span>
                  {item.label}
                </div>
                {item.badge && <span className="bg-[#4c49d8] text-white text-[9px] px-1.5 py-0.5 rounded-md">{item.badge}</span>}
              </button>
            ))}
          </nav>
        </div>

        <div className="pt-4 border-t border-white/5">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4 px-3">Memo System</p>
          <div className="space-y-1">
            {['Dashboard', 'People', 'Time & Attendance', 'Leave Management', 'Payroll', 'Performance'].map((nav) => (
              <button key={nav} className="w-full text-left px-3 py-2 text-[11px] font-bold text-slate-500 hover:text-white transition-all uppercase tracking-tight">{nav}</button>
            ))}
          </div>
        </div>
      </aside>

      {/* Middle Pane: Memo List */}
      <aside className="w-[320px] border-r border-white/5 flex flex-col p-6 bg-white/[0.01]">
        <div className="flex items-center gap-2 mb-6">
          <button className="flex-1 py-2.5 bg-[#f59e0b] hover:bg-[#d97706] text-white font-black text-[11px] uppercase tracking-widest rounded-xl shadow-lg shadow-orange-500/20 transition-all">
            + New Memo
          </button>
          <button className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-400">•••</button>
        </div>

        <div className="flex justify-between items-center mb-4 px-2">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            Ongoing <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="2"/></svg>
          </p>
          <button className="text-slate-600 hover:text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 12h.01M12 12h.01M19 12h.01" strokeWidth="2"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar space-y-1">
          {MEMO_LIST.map((memo) => (
            <button 
              key={memo.id} 
              onClick={() => setSelectedMemoId(memo.id)}
              className={`w-full text-left p-4 rounded-[20px] transition-all group border-2 ${selectedMemoId === memo.id ? 'bg-[#8252e9]/5 border-[#8252e9]/20' : 'hover:bg-white/[0.02] border-transparent'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img src={memo.avatar} className="w-8 h-8 rounded-full border border-white/10" alt="" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#0f172a] rounded-full" />
                  </div>
                  <div>
                    <p className={`text-xs font-black tracking-tight ${selectedMemoId === memo.id ? 'text-white' : 'text-slate-300'}`}>{memo.sender}</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase">{memo.time}</p>
                  </div>
                </div>
              </div>
              <p className={`text-[10px] font-black uppercase tracking-widest truncate mb-1 ${selectedMemoId === memo.id ? 'text-[#8252e9]' : 'text-slate-400'}`}>{memo.subject}</p>
              <p className="text-[10px] text-slate-600 truncate">{memo.snippet}</p>
            </button>
          ))}
        </div>
      </aside>

      {/* Main Content: Memo Detail */}
      <main className="flex-1 flex flex-col bg-[#0f172a] relative">
        <div className="p-8 border-b border-white/5 flex justify-between items-center">
          <h3 className="text-xl font-black text-white tracking-tight uppercase italic">Updated Part-Time Policy</h3>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white flex items-center gap-2">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 10h10a8 8 0 018 8v2M3 10l5 5m-5-5l5-5" strokeWidth="2.5"/></svg> Reply
            </button>
            <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white flex items-center gap-2">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 10h10a8 8 0 018 8v2M3 10l5 5m-5-5l5-5" strokeWidth="2.5"/></svg> Reply All
            </button>
            <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white flex items-center gap-2">
              Forward <svg className="w-3.5 h-3.5 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 10h10a8 8 0 018 8v2M3 10l5 5m-5-5l5-5" strokeWidth="2.5"/></svg>
            </button>
            <button className="p-2 text-slate-600 hover:text-white">•••</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-12 space-y-10 no-scrollbar">
          {/* Memo Metadata */}
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <img src="https://picsum.photos/64?sig=amanda" className="w-12 h-12 rounded-[18px] border-2 border-[#8252e9]/30" alt="" />
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-black text-white">Amanda Ward</h4>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">HR Specialist</span>
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">HR Admin</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">To: <span className="text-slate-300 font-bold uppercase text-[10px] tracking-widest">HR Team, All Staff</span></p>
                <div className="flex items-center gap-2 mt-1">
                   <p className="text-[10px] text-slate-500">Cc: <span className="text-slate-400 font-mono italic">Emily Johnson &lt;emily.johnson@hr360app.com&gt;</span></p>
                   <button className="text-slate-600"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" strokeWidth="2"/></svg></button>
                </div>
              </div>
            </div>
            <span className="text-xs font-black text-slate-600 tracking-widest uppercase">4:30 PM</span>
          </div>

          {/* Memo Body */}
          <div className="space-y-6 max-w-2xl">
            <p className="text-sm font-bold text-white tracking-tight">Dear Team,</p>
            <p className="text-sm text-slate-400 leading-relaxed">Today a <span className="text-white italic">part-time policy</span>:</p>
            <ul className="space-y-6">
              <li className="flex gap-4">
                <div className="w-1.5 h-1.5 rounded-full bg-[#8252e9] mt-2 shrink-0" />
                <div>
                  <p className="text-sm font-black text-white uppercase tracking-tight">Maximum weekly hours</p>
                  <p className="text-xs text-slate-500 mt-1">Has the dat today, uttenting.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-1.5 h-1.5 rounded-full bg-[#8252e9] mt-2 shrink-0" />
                <div>
                  <p className="text-sm font-black text-white uppercase tracking-tight">Pro-rated leave Benefits</p>
                  <p className="text-xs text-slate-500 mt-1">Anharic your correct to theariing the reectarget-indt bssed on hours-worked weekly.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-1.5 h-1.5 rounded-full bg-[#8252e9] mt-2 shrink-0" />
                <div>
                  <p className="text-sm font-black text-white uppercase tracking-tight">Health Insurance Eigibility</p>
                  <p className="text-xs text-slate-500 mt-1">Exgissility to sierted forn eayout Heath tnat mese the min mum hours orterts.</p>
                </div>
              </li>
            </ul>
            <p className="text-sm text-slate-400 leading-relaxed pt-4">Thank you for your attention and help in making this transition smooth.</p>
            <div className="pt-8">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Best regards,</p>
              <p className="text-sm font-black text-white uppercase tracking-widest mt-1">Amanda Ward</p>
              <p className="text-[10px] text-slate-600 font-bold uppercase tracking-tight">HR Specialist</p>
            </div>
          </div>

          {/* Attachments */}
          <div className="pt-8 border-t border-white/5 max-w-2xl">
            <div className="p-4 bg-white/5 border border-white/10 rounded-[24px] flex items-center gap-4 group hover:border-[#8252e9]/30 transition-all">
               <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">📄</div>
               <div className="flex-1">
                  <p className="text-xs font-black text-white uppercase tracking-tight">PartTime_Policy_Update.docx</p>
                  <p className="text-[10px] text-slate-600 font-bold uppercase">1.2 MB</p>
               </div>
               <div className="flex gap-3">
                  <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-[#8252e9]">Download</button>
                  <button className="text-[10px] font-black text-[#8252e9] uppercase tracking-widest hover:underline">open</button>
               </div>
            </div>
          </div>

          {/* Bottom Call Controls Overlay */}
          <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-[#1e293b]/90 backdrop-blur-2xl border border-white/10 p-3 rounded-[28px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] z-50">
             <div className="flex gap-1.5 px-3 border-r border-white/10">
                <img src="https://picsum.photos/32?sig=c1" className="w-8 h-8 rounded-xl border-2 border-white/5" alt="" />
                <img src="https://picsum.photos/32?sig=c2" className="w-8 h-8 rounded-xl border-2 border-white/5" alt="" />
                <img src="https://picsum.photos/32?sig=c3" className="w-8 h-8 rounded-xl border-2 border-white/5" alt="" />
             </div>
             <div className="flex items-center gap-2">
                <button className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white transition-all">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" strokeWidth="2"/></svg>
                </button>
                <button className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white transition-all">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" strokeWidth="2"/></svg>
                </button>
                <button className="w-10 h-10 bg-[#8252e9]/20 text-[#8252e9] rounded-2xl flex items-center justify-center">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" strokeWidth="2"/></svg>
                </button>
             </div>
             <button className="px-6 py-2 bg-rose-500 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-rose-500/20 active:scale-95 transition-all">Leave</button>
          </div>

          <div className="flex gap-4 pt-12 border-t border-white/5 max-w-2xl">
             <button className="flex-1 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white flex items-center justify-center gap-2 transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 10h10a8 8 0 018 8v2M3 10l5 5m-5-5l5-5" strokeWidth="2"/></svg> Reply
             </button>
             <button className="flex-1 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white flex items-center justify-center gap-2 transition-all">
                Forward <svg className="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 10h10a8 8 0 018 8v2M3 10l5 5m-5-5l5-5" strokeWidth="2"/></svg>
             </button>
          </div>
        </div>
      </main>

      {/* Right Sidebar: Contextual Chat */}
      <aside className="w-80 bg-white/[0.01] border-l border-white/5 flex flex-col p-6 space-y-6">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[11px] font-black text-white uppercase tracking-widest">People <span className="text-slate-500 ml-1">(5)</span></h3>
            <button className="text-slate-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 13l-3 3m0 0l-3-3m3 3V8m0 13a9 9 0 110-18 9 9 0 010 18z" strokeWidth="2"/></svg></button>
          </div>
          <div className="flex items-center gap-3 p-2 bg-white/5 rounded-[20px] border border-white/5 relative group cursor-pointer">
            <img src="https://picsum.photos/32?sig=amanda" className="w-8 h-8 rounded-xl border border-white/10" alt="" />
            <div className="flex-1">
              <p className="text-[11px] font-black text-white uppercase">Amanda Ward</p>
              <p className="text-[9px] text-slate-500 font-bold uppercase">HR Specialist</p>
            </div>
            <button className="text-slate-600 hover:text-white">⭐</button>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0 border-t border-white/5 pt-6">
          <div className="flex justify-between items-center mb-4 px-2">
            <h3 className="text-[11px] font-black text-white uppercase tracking-widest">Chat</h3>
            <div className="flex gap-2">
               <button className="px-2 py-0.5 bg-white/5 rounded text-[8px] font-black uppercase text-slate-500 border border-white/10">Untread</button>
               <button className="px-2 py-0.5 bg-rose-500/10 rounded text-[8px] font-black uppercase text-rose-500 border border-rose-500/20">Delete</button>
               <button className="text-slate-600">▾</button>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">Reople (2) ▾ <span className="ml-auto text-slate-700 text-base">+</span></p>
            <div className="space-y-6 overflow-y-auto no-scrollbar pr-1">
              {CHAT_LOG.map((chat) => (
                <div key={chat.id} className="group animate-in slide-in-from-right-2 duration-300">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <img src={chat.avatar} className="w-6 h-6 rounded-lg border border-white/5" alt="" />
                      <p className="text-[10px] font-black text-white uppercase tracking-tight">{chat.sender}</p>
                    </div>
                    <span className="text-[8px] text-slate-600 font-bold">{chat.time}</span>
                  </div>
                  <div className="pl-8 relative">
                     <p className="text-[10px] text-slate-400 font-medium leading-relaxed group-hover:text-slate-300 transition-colors">{chat.msg}</p>
                     {chat.id === 'c1' && <div className="absolute left-6 top-0 w-[1.5px] h-full bg-[#8252e9]/20" />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto pt-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center gap-3 shadow-2xl focus-within:border-[#8252e9]/50 transition-all">
              <input 
                type="text" 
                placeholder="Write a message..." 
                className="bg-transparent border-none text-[10px] text-white flex-1 outline-none font-medium placeholder-slate-600 py-0.5"
              />
              <button className="text-slate-500 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 18.5a6.5 6.5 0 100-13 6.5 6.5 0 000 13zM12 11v3m0-6h.01" strokeWidth="2"/></svg>
              </button>
            </div>
            <div className="flex items-center justify-between mt-3 px-1">
               <div className="flex gap-1.5">
                 <button className="text-slate-600 hover:text-white transition-colors"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeWidth="2.5"/></svg></button>
               </div>
               <button className="text-slate-600 hover:text-white transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth="2"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeWidth="2"/></svg></button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default MemoSystem;
