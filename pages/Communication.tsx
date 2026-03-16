
import React, { useState } from 'react';
import ChatInterface from '../components/ChatInterface';
import ChatAdminDashboard from '../components/ChatAdminDashboard';
import { UserRole } from '../types';

const Communication: React.FC = () => {
  const [activeView, setActiveView] = useState<'CHAT' | 'ADMIN'>('CHAT');
  
  const user = JSON.parse(localStorage.getItem('royalgateway_user') || '{}');
  const currentUserRole = user.primary_role_id;

  const isAdmin = currentUserRole === 1 || currentUserRole === 2; // Super Admin or Admin

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-700 overflow-hidden max-w-full">
      {/* Top Header & Context Toggle */}
      <div className="flex flex-row justify-between items-center gap-2 border-b border-white/5 pb-3 md:pb-6">
        <div>
           <div className="flex items-center gap-2 md:gap-3">
             <div className="w-8 h-8 md:w-9 md:h-9 gradient-bg rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/30 shrink-0">
               <span className="font-bold text-base md:text-lg text-white italic">H</span>
             </div>
            <h2 className="text-lg md:text-2xl font-black text-slate-800 dark:text-white tracking-tight uppercase italic">HR360 <span className="text-slate-500 font-normal">Chat</span></h2>
           </div>
        </div>

        {isAdmin && (
          <div className="flex p-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl">
            <button 
              onClick={() => setActiveView('CHAT')}
              className={`px-3 md:px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'CHAT' ? 'bg-[#8252e9] text-white shadow-lg' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}
            >
              Messaging
            </button>
            <button 
              onClick={() => setActiveView('ADMIN')}
              className={`px-3 md:px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'ADMIN' ? 'bg-[#8252e9] text-white shadow-lg' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}
            >
              Control Center
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        {activeView === 'ADMIN' ? (
          <ChatAdminDashboard />
        ) : (
          <ChatInterface />
        )}
      </div>
    </div>
  );
};

export default Communication;
