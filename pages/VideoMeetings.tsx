
import React, { useState } from 'react';
import GlassCard from '../components/GlassCard';
import Button from '../components/ui/Button';

const MEETINGS = [
    { id: 'm1', title: 'Q2 Planning Sync', host: 'Alex Rivera', time: '10:00 AM', duration: '45 min', attendees: 8, status: 'Live', avatar: 'https://picsum.photos/40?sig=m1' },
    { id: 'm2', title: 'Engineering Standup', host: 'Ethan Parker', time: '11:30 AM', duration: '15 min', attendees: 12, status: 'Upcoming', avatar: 'https://picsum.photos/40?sig=m2' },
    { id: 'm3', title: 'HR Policy Review', host: 'Amanda Ward', time: '2:00 PM', duration: '60 min', attendees: 5, status: 'Upcoming', avatar: 'https://picsum.photos/40?sig=m3' },
    { id: 'm4', title: 'Client Demo — Acme Corp', host: 'Sarah Mitchell', time: '4:00 PM', duration: '30 min', attendees: 4, status: 'Scheduled', avatar: 'https://picsum.photos/40?sig=m4' },
];

const CHAT_MESSAGES = [
    { id: 'c1', sender: 'Alex Rivera', msg: 'Ready for the Q2 planning call?', time: '9:55 AM', avatar: 'https://picsum.photos/32?sig=c1' },
    { id: 'c2', sender: 'Ethan Parker', msg: 'Yes! Sharing the deck now.', time: '9:57 AM', avatar: 'https://picsum.photos/32?sig=c2' },
    { id: 'c3', sender: 'Tom Green', msg: "Looking forward to it. I'll start the onboarding activities after.", time: '10:04 AM', avatar: 'https://picsum.photos/32?sig=c3' },
];

const VideoMeetings: React.FC = () => {
    const [chatInput, setChatInput] = useState('');

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">
                        Video <span className="text-blue-500">Meetings</span>
                    </h2>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1">Collaborative Intelligence Workspace</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="secondary" size="sm">Schedule Meeting</Button>
                    <Button size="sm" className="bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/20">+ New Meeting</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Meetings Today', val: '4', icon: '📅', color: 'border-l-blue-500' },
                    { label: 'Live Now', val: '1', icon: '🔴', color: 'border-l-rose-500' },
                    { label: 'Participants', val: '29', icon: '👥', color: 'border-l-purple-500' },
                    { label: 'Hours Logged', val: '6.5h', icon: '⏱️', color: 'border-l-emerald-500' },
                ].map((s, i) => (
                    <GlassCard key={i} className={`!p-5 border-l-4 ${s.color}`}>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{s.label}</p>
                        <div className="flex items-center justify-between">
                            <p className="text-2xl font-black text-slate-900 dark:text-white">{s.val}</p>
                            <span className="text-2xl">{s.icon}</span>
                        </div>
                    </GlassCard>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 space-y-6">
                    {/* Live Meeting Banner */}
                    <GlassCard className="!p-0 overflow-hidden border-blue-500/20">
                        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-6 flex flex-col md:flex-row items-center gap-6">
                            <div className="relative flex-shrink-0">
                                <div className="w-20 h-20 rounded-[28px] bg-blue-500/20 border-2 border-blue-500/40 flex items-center justify-center text-4xl">📡</div>
                                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500" />
                                </span>
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <div className="flex items-center gap-2 justify-center md:justify-start mb-1">
                                    <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[8px] font-black uppercase tracking-widest">● LIVE</span>
                                </div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white">Q2 Planning Sync</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Hosted by Alex Rivera • 8 participants • Started 10:00 AM</p>
                            </div>
                            <div className="flex gap-3">
                                <button className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-black text-[11px] uppercase tracking-widest rounded-xl shadow-lg shadow-blue-500/30 transition-all">Join Now</button>
                            </div>
                        </div>
                    </GlassCard>

                    {/* Meeting List */}
                    <GlassCard title="Today's Schedule" action={<button className="text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-900 dark:hover:text-white">View Calendar ›</button>}>
                        <div className="space-y-3">
                            {MEETINGS.map((m) => (
                                <div key={m.id} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-white/[0.02] rounded-2xl border border-slate-100 dark:border-white/5 hover:border-blue-500/30 transition-all group">
                                    <img src={m.avatar} className="w-10 h-10 rounded-xl border border-white/10" alt="" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black text-slate-900 dark:text-white truncate">{m.title}</p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">{m.host} • {m.time} • {m.duration}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[9px] font-black text-slate-400 uppercase">👥 {m.attendees}</span>
                                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border ${m.status === 'Live' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                                                m.status === 'Upcoming' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                    'bg-slate-500/10 text-slate-500 border-slate-500/20'
                                            }`}>{m.status}</span>
                                        <button className="opacity-0 group-hover:opacity-100 px-4 py-1.5 bg-blue-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-all">Join</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </div>

                <div className="lg:col-span-4">
                    <GlassCard title="Meeting Chat" className="h-full flex flex-col">
                        <div className="flex-1 space-y-4 min-h-[300px] overflow-y-auto no-scrollbar">
                            {CHAT_MESSAGES.map((msg) => (
                                <div key={msg.id} className="flex items-start gap-3">
                                    <img src={msg.avatar} className="w-8 h-8 rounded-lg border border-white/10 flex-shrink-0" alt="" />
                                    <div>
                                        <div className="flex items-baseline gap-2">
                                            <p className="text-[11px] font-black text-slate-900 dark:text-white">{msg.sender}</p>
                                            <p className="text-[9px] text-slate-500 font-bold">{msg.time}</p>
                                        </div>
                                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{msg.msg}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 flex gap-2">
                            <input
                                type="text"
                                placeholder="Type a message..."
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500/50 transition-all"
                            />
                            <button className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-black transition-all">Send</button>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
};

export default VideoMeetings;
