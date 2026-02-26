
import React, { useState } from 'react';
import GlassCard from '../components/GlassCard';
import { User, RiskLevel, SecurityAlert } from '../types';

const USERS_DATA: User[] = [
  { id: '1', name: 'Alex Rivera', email: 'alex@hr360.io', role: 'SUPER_ADMIN' as any, avatar: 'https://picsum.photos/40?sig=1', department: 'Executive', status: 'ONLINE', riskScore: 5, riskLevel: 'LOW', deviceBound: true },
  { id: '2', name: 'Sarah Connor', email: 's.connor@hr360.io', role: 'MANAGER' as any, avatar: 'https://picsum.photos/40?sig=2', department: 'Operations', status: 'AWAY', riskScore: 42, riskLevel: 'MEDIUM', deviceBound: true },
  { id: '3', name: 'Kyle Reese', email: 'k.reese@hr360.io', role: 'EMPLOYEE' as any, avatar: 'https://picsum.photos/40?sig=3', department: 'Security', status: 'OFFLINE', riskScore: 89, riskLevel: 'CRITICAL', deviceBound: false },
  { id: '4', name: 'Ellen Ripley', email: 'ripley@hr360.io', role: 'ADMIN' as any, avatar: 'https://picsum.photos/40?sig=4', department: 'Fleet', status: 'ONLINE', riskScore: 12, riskLevel: 'LOW', deviceBound: true },
];

const ALERTS_DATA: SecurityAlert[] = [
  { id: 'a1', type: 'GEO_SPOOF', severity: 'HIGH', message: 'Kyle Reese attempted clock-in 20km outside geofence.', timestamp: '10 mins ago' },
  { id: 'a2', type: 'DEVICE_MISMATCH', severity: 'MEDIUM', message: 'New device detected for Sarah Connor.', timestamp: '1h ago' },
];

const RiskBadge: React.FC<{ score: number; level: RiskLevel }> = ({ score, level }) => {
  const colors = {
    LOW: 'text-emerald-400 bg-emerald-500/10',
    MEDIUM: 'text-orange-400 bg-orange-500/10',
    HIGH: 'text-red-400 bg-red-500/10',
    CRITICAL: 'text-rose-500 bg-rose-600/20 border border-rose-500/30'
  };
  
  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${colors[level]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      {level}: {score}
    </div>
  );
};

const Identity: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'audit' | 'policies'>('users');

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Identity & Access</h2>
          <p className="text-slate-400 mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
            AI-Enhanced RBAC & Security Monitoring Active
          </p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white/5 border border-white/10 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-white/10 transition-all">
            Security Policies
          </button>
          <button className="gradient-bg text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-purple-500/30 hover:scale-105 transition-all">
            + Provision User
          </button>
        </div>
      </header>

      {/* Smart Alerts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ALERTS_DATA.map((alert) => (
          <div key={alert.id} className="glass rounded-[20px] p-5 border-l-4 border-l-rose-500 flex items-start gap-4">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-rose-500 text-xs font-bold uppercase tracking-widest">AI Smart Alert: {alert.type}</span>
                <span className="text-slate-500 text-[10px]">{alert.timestamp}</span>
              </div>
              <p className="text-white text-sm font-medium leading-relaxed">{alert.message}</p>
              <div className="mt-3 flex gap-2">
                <button className="text-[10px] font-bold text-white px-2 py-1 bg-white/5 rounded hover:bg-white/10">INVESTIGATE</button>
                <button className="text-[10px] font-bold text-slate-400 px-2 py-1 hover:text-white">DISMISS</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="flex border-b border-white/10">
            {['Users', 'Audit Logs', 'Permissions'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase() as any)}
                className={`px-6 py-3 text-sm font-bold transition-all relative ${activeTab === tab.toLowerCase() ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {tab}
                {activeTab === tab.toLowerCase() && <div className="absolute bottom-0 left-0 w-full h-0.5 gradient-bg shadow-[0_0_10px_#8252e9]" />}
              </button>
            ))}
          </div>

          <GlassCard className="!p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/[0.02] border-b border-white/10">
                  <tr className="text-slate-400 text-[11px] uppercase tracking-widest font-bold">
                    <th className="px-6 py-5">User Profile</th>
                    <th className="px-6 py-5">Role & Dept</th>
                    <th className="px-6 py-5">AI Risk Factor</th>
                    <th className="px-6 py-5">Device Binding</th>
                    <th className="px-6 py-5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {USERS_DATA.map((user) => (
                    <tr key={user.id} className="hover:bg-white/[0.03] transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <img src={user.avatar} className="w-10 h-10 rounded-2xl border-2 border-white/10 object-cover" alt={user.name} />
                            {/* Live/Offline Status Indicators */}
                            <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#0f172a] shadow-sm flex items-center justify-center
                              ${user.status === 'ONLINE' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 
                                user.status === 'AWAY' ? 'bg-orange-500' : 'bg-slate-400'}`}>
                              {user.status === 'ONLINE' && <span className="w-full h-full rounded-full bg-green-500 animate-ping absolute opacity-75" />}
                            </div>
                          </div>
                          <div>
                            <p className="text-white font-bold text-sm tracking-tight">{user.name}</p>
                            <p className="text-slate-500 text-xs">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-slate-200 text-xs font-bold uppercase tracking-wide">{user.role.replace('_', ' ')}</p>
                        <p className="text-slate-500 text-xs">{user.department}</p>
                      </td>
                      <td className="px-6 py-5">
                        <RiskBadge score={user.riskScore} level={user.riskLevel} />
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <svg className={`w-4 h-4 ${user.deviceBound ? 'text-emerald-400' : 'text-slate-600'}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.9L10 1.55l7.834 3.35a1 1 0 01.666.945V10c0 5.825-4.139 10.285-8.5 10.285S2.166 15.825 2.166 10V5.845a1 1 0 01.666-.945zM10 3.333L3.834 5.974V10c0 4.92 3.392 8.619 6.166 8.619 2.774 0 6.166-3.699 6.166-8.619V5.974L10 3.333z" clipRule="evenodd" /></svg>
                          <span className={`text-xs font-bold ${user.deviceBound ? 'text-emerald-400/80' : 'text-slate-500'}`}>
                            {user.deviceBound ? 'Hardware Linked' : 'Unlinked'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex gap-2">
                          <button className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                          <button className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>

        <div className="space-y-6">
          <GlassCard title="Security Pulse">
            <div className="text-center pb-6 border-b border-white/5 mb-6">
              <div className="text-6xl font-black text-white mb-2 tracking-tighter">98<span className="text-2xl text-[#8252e9]">%</span></div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Overall Compliance</p>
            </div>
            <div className="space-y-4">
               {[
                 { label: '2FA Adoption', value: 92, color: 'bg-green-500' },
                 { label: 'Device Binding', value: 78, color: 'bg-[#8252e9]' },
                 { label: 'Least Privilege', value: 100, color: 'bg-blue-400' },
               ].map((metric) => (
                 <div key={metric.label}>
                   <div className="flex justify-between text-[11px] font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                     <span>{metric.label}</span>
                     <span>{metric.value}%</span>
                   </div>
                   <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                     <div className={`h-full ${metric.color} shadow-[0_0_10px_rgba(130,82,233,0.3)] transition-all duration-1000`} style={{ width: `${metric.value}%` }} />
                   </div>
                 </div>
               ))}
            </div>
          </GlassCard>

          <GlassCard title="Audit Trail" className="!bg-purple-900/5 border-[#8252e9]/20">
            <div className="space-y-4">
              {[
                { action: 'RBAC Escalated', user: 'Admin', time: '14:20' },
                { action: 'Policy Override', user: 'Ellen R.', time: '11:05' },
                { action: 'MFA Disabled', user: 'Kyle R.', time: '09:42' },
              ].map((log, i) => (
                <div key={i} className="flex justify-between items-center text-xs">
                  <div>
                    <p className="text-slate-200 font-bold tracking-tight">{log.action}</p>
                    <p className="text-slate-500">by {log.user}</p>
                  </div>
                  <span className="text-[10px] text-slate-600 font-mono">{log.time}</span>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-2.5 text-xs font-bold text-[#8252e9] hover:text-white transition-colors uppercase tracking-widest">
              Full Security Logs
            </button>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default Identity;
