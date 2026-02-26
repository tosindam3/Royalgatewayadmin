
import React, { useState } from 'react';
import GlassCard from './GlassCard';

const PINNED = [
  { name: 'Kelly Robinson', msg: 'Kanate qoterant', time: '9:13 AM', typing: true, avatar: 'https://picsum.photos/40?sig=c1' },
  { name: 'A/V Room', msg: 'Emily Johnson - Lask so-lernecad ptach: 5 ...', time: '9:12 AM', avatar: 'https://picsum.photos/40?sig=c2' },
  { name: 'Annual Conference 2024', msg: 'Ahaniso. Martk to meetices is oeriodtfost 613 AM', time: '9:02 AM', avatar: 'https://picsum.photos/40?sig=c3' },
];

const RECENT = [
  { name: 'Samantha Lee', msg: 'Hiss wit lay hearve agrtawed', time: '9:02 AM', avatar: 'https://picsum.photos/40?sig=c4', role: 'HR Admin' },
  { name: 'Sarah Mitchell', msg: 'aogireccs - Niew', time: '5:22 AM', avatar: 'https://picsum.photos/40?sig=c5', reaction: '👍' },
  { name: 'Sales Team', msg: 'Monnell Carter product deme questions', time: '15/PA leea', avatar: 'https://picsum.photos/40?sig=c6' },
];

const ChatInterface: React.FC = () => {
  const [selectedChat, setSelectedChat] = useState('Kelly Robinson');

  return (
    <div className="flex h-full gap-6 animate-in fade-in duration-500">
      {/* Chat Sidebar */}
      <div className="w-80 flex flex-col gap-4">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search or start a new chat..." 
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#8252e9]/50 transition-all"
          />
        </div>
        
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-6">
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 px-2">Pinned</p>
            <div className="space-y-1">
              {PINNED.map((chat, i) => (
                <button 
                  key={i} 
                  onClick={() => setSelectedChat(chat.name)}
                  className={`w-full flex gap-3 p-3 rounded-2xl transition-all text-left group ${selectedChat === chat.name ? 'bg-white/10 border border-white/5' : 'hover:bg-white/[0.02]'}`}
                >
                  <div className="relative shrink-0">
                    <img src={chat.avatar} className="w-10 h-10 rounded-xl border border-white/10" alt="" />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-[#0f172a] rounded-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <p className="text-xs font-black text-white truncate">{chat.name}</p>
                      <span className="text-[8px] text-slate-500 font-bold uppercase">{chat.time}</span>
                    </div>
                    <p className={`text-[10px] truncate mt-0.5 ${chat.typing ? 'text-emerald-400 font-bold italic' : 'text-slate-500'}`}>
                      {chat.typing ? 'Typing...' : chat.msg}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 px-2">Recent</p>
            <div className="space-y-1">
              {RECENT.map((chat, i) => (
                <button key={i} className="w-full flex gap-3 p-3 rounded-2xl hover:bg-white/[0.02] transition-all text-left">
                  <img src={chat.avatar} className="w-10 h-10 rounded-xl border border-white/10 opacity-60" alt="" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <p className="text-xs font-black text-slate-400 truncate">{chat.name}</p>
                      <span className="text-[8px] text-slate-600 font-bold">{chat.time}</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <p className="text-[10px] text-slate-600 truncate mt-0.5">{chat.msg}</p>
                       {chat.reaction && <span className="text-xs">{chat.reaction}</span>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Window */}
      <div className="flex-1 flex flex-col bg-white/[0.02] border border-white/5 rounded-[32px] overflow-hidden">
        {/* Chat Header */}
        <div className="p-6 bg-gradient-to-r from-[#8252e9]/10 to-transparent border-b border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img src="https://picsum.photos/40?sig=c1" className="w-10 h-10 rounded-xl border-2 border-[#8252e9]/30" alt="" />
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#1e293b] rounded-full shadow-lg" />
            </div>
            <div>
              <h4 className="text-sm font-black text-white">{selectedChat}</h4>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Search or Meeting on Historical</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2.5 bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" strokeWidth="2" /></svg>
            </button>
            <button className="p-2.5 bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" strokeWidth="2" /></svg>
            </button>
            <button className="p-2.5 text-slate-600">
               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
            </button>
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat opacity-90">
          
          <div className="flex flex-col gap-2 max-w-[80%]">
             <div className="bg-white/5 border border-white/5 p-3 rounded-2xl rounded-tl-none space-y-3">
               <div className="flex items-center gap-3 p-2 bg-[#0f172a]/40 rounded-xl border border-white/5">
                  <div className="w-8 h-8 bg-blue-500/20 rounded flex items-center justify-center text-xs">📄</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-white truncate">Project, coffening.pdf</p>
                    <p className="text-[8px] text-slate-500 font-bold uppercase">3.3 MB • 9:12 AM</p>
                  </div>
               </div>
               <div className="flex items-center gap-3 p-2 bg-[#0f172a]/40 rounded-xl border border-white/5">
                  <div className="w-8 h-8 bg-indigo-500/20 rounded flex items-center justify-center text-xs">📝</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-white truncate">Report. docx</p>
                    <p className="text-[8px] text-slate-500 font-bold uppercase">1.25 MB • 9:12 AM</p>
                  </div>
               </div>
             </div>
          </div>

          <div className="flex flex-col items-end gap-2">
             <div className="gradient-bg text-white p-3.5 px-5 rounded-[24px] rounded-br-none shadow-xl">
               <p className="text-xs font-medium">Got it. I'll review it right now. 👍</p>
             </div>
             <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mr-2">9:27 AM</span>
          </div>

          <div className="flex gap-4 max-w-[80%]">
             <img src="https://picsum.photos/40?sig=c1" className="w-8 h-8 rounded-full border border-white/10 self-end" alt="" />
             <div className="flex-1 space-y-2">
                <div className="bg-white/5 border border-white/5 p-4 rounded-[24px] rounded-bl-none">
                  <div className="flex items-center gap-3">
                    <button className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs">▶</button>
                    <div className="flex-1 h-1 bg-white/10 rounded-full relative">
                       <div className="absolute inset-0 w-2/3 bg-white/30 rounded-full" />
                       <div className="absolute top-1/2 left-2/3 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow" />
                    </div>
                    <span className="text-[8px] font-mono text-slate-500">0:21</span>
                  </div>
                </div>
             </div>
          </div>

          <div className="flex justify-center">
             <div className="px-4 py-1 bg-white/5 rounded-full border border-white/10">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Emily jonnsod nes ▾</span>
             </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="p-6 bg-black/20 border-t border-white/5">
          <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-[24px] px-6 py-2 shadow-2xl focus-within:border-[#8252e9]/50 transition-all">
            <button className="text-slate-500 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" /></svg>
            </button>
            <input 
              type="text" 
              placeholder="Type a message..." 
              className="flex-1 bg-transparent border-none text-xs text-white placeholder-slate-600 outline-none py-3"
            />
            <div className="flex items-center gap-3">
               <button className="text-slate-500 hover:text-white transition-colors">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" strokeWidth="2" /></svg>
               </button>
               <button className="text-slate-500 hover:text-white transition-colors">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 18.5a6.5 6.5 0 100-13 6.5 6.5 0 000 13zM12 11v3m0-6h.01" strokeWidth="2" /></svg>
               </button>
               <button className="w-10 h-10 gradient-bg rounded-full flex items-center justify-center text-white shadow-lg shadow-purple-500/20 active:scale-90 transition-all">
                 <svg className="w-4 h-4 transform rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
