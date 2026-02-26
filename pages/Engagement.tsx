
import React from 'react';
import GlassCard from '../components/GlassCard';

const RECOGNITION_FEED = [
    { id: 1, sender: 'Sarah Mitchell', role: 'Sales Manager', time: '1 hour ago', message: 'Great work on the new website launch, Jay! Your creativity and dedication really shined through.', kudos: 12, avatar: 'https://picsum.photos/40?sig=s1', reactions: ['🚀', '👏', '🔥'] },
    { id: 2, sender: 'Kelly Robinson', role: 'Marketing Manager', time: '3 hours ago', message: 'Outstanding effort on finishing the budget docs, Daniel! Your dedication and strategic thinking really made a difference.', kudos: 31, avatar: 'https://picsum.photos/40?sig=k1', reactions: ['💎', '🎯'] },
    { id: 3, sender: 'Emma Wilson', role: 'Sales Director', time: '1 day ago', message: 'Fantastic job on the new project graphics, Sofia! Your creativity and attention to detail were amazing.', kudos: 18, avatar: 'https://picsum.photos/40?sig=e1', reactions: ['✨', '🙌'] },
];

const REWARDS = [
    { title: '$25 Gift Card', cost: 300, icon: '💳', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
    { title: 'Movie Tickets', cost: 250, icon: '🎟️', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    { title: 'Extra Day Off', cost: 4200, icon: '🏖️', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    { title: 'Wireless Earbuds', cost: 500, icon: '🎧', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
];

const Engagement: React.FC = () => {
    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">
                        Engagement <span className="text-slate-400 font-normal">Dashboard</span>
                    </h2>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1">People Experience & Culture Hub</p>
                </div>
                <button className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-black text-[11px] uppercase tracking-widest rounded-xl shadow-lg shadow-orange-500/20 active:scale-95 transition-all">
                    Give Recognition
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                    { label: 'Recognitions Given', val: '48', footer: '15 this week', icon: '⭐', color: 'text-blue-400' },
                    { label: 'Awards Redeemed', val: '16', footer: '+15% vs last 30 days', icon: '🏆', color: 'text-orange-400' },
                    { label: 'Kudos Points', val: '220', footer: 'in Q2 2024', icon: '😊', color: 'text-emerald-400' },
                    { label: 'Polls Published', val: '5', footer: 'All Time', icon: '📊', color: 'text-purple-400' },
                    { label: 'Active Days', val: '5', footer: 'This Month', icon: '🗓️', color: 'text-slate-400' },
                ].map((stat, i) => (
                    <GlassCard key={i} className="!p-4 border-white/5 hover:bg-white/[0.04] transition-all relative overflow-hidden group">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[28px] font-black text-slate-900 dark:text-white">{stat.val}</p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{stat.label}</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl grayscale opacity-40 group-hover:opacity-100 transition-all">{stat.icon}</div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5">
                            <span className="text-[9px] font-black uppercase tracking-widest text-purple-500">{stat.footer}</span>
                        </div>
                    </GlassCard>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-8 space-y-6">
                    <GlassCard title="Survey Overview" action={<button className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all">Export ▾</button>}>
                        <div className="space-y-6">
                            <div>
                                <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">How satisfied are you with the company's remote work policy?</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase">Posted 5 days ago • 20 Responses</p>
                            </div>
                            <div className="space-y-4">
                                {[
                                    { label: 'Dissatisfied', val: 4, color: 'bg-rose-500' },
                                    { label: 'Slightly Dissatisfied', val: 15, color: 'bg-orange-500' },
                                    { label: 'Satisfied', val: 51, color: 'bg-emerald-500' },
                                    { label: 'Very Satisfied', val: 22, color: 'bg-blue-500' },
                                    { label: 'Neutral', val: 8, color: 'bg-slate-500' },
                                ].map((opt, i) => (
                                    <div key={i} className="space-y-1.5">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                            <span className="text-slate-400 flex items-center gap-2"><div className={`w-1.5 h-1.5 rounded-full ${opt.color}`} />{opt.label}</span>
                                            <span className="text-slate-900 dark:text-white">{opt.val}%</span>
                                        </div>
                                        <div className="h-2.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                            <div className={`h-full ${opt.color} opacity-60`} style={{ width: `${opt.val}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard title="Employee Recognition Feed" action={<button className="text-[10px] font-black text-blue-400 uppercase tracking-widest hover:underline">View All ›</button>}>
                        <div className="space-y-6">
                            {RECOGNITION_FEED.map((item) => (
                                <div key={item.id} className="flex gap-4 p-4 rounded-[24px] bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-all">
                                    <img src={item.avatar} className="w-10 h-10 rounded-xl border border-white/10" alt="" />
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-sm font-black text-slate-900 dark:text-white">{item.sender}</p>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{item.role} • {item.time}</p>
                                            </div>
                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 rounded-lg border border-purple-500/20">
                                                <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest">{item.kudos} Kudos</span>
                                            </div>
                                        </div>
                                        <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic border-l-2 border-purple-500/30 pl-4 py-1">"{item.message}"</p>
                                        <div className="mt-4 flex gap-2">
                                            {item.reactions.map((r, ri) => (
                                                <button key={ri} className="px-2 py-1 bg-slate-100 dark:bg-white/5 rounded-lg text-xs hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">{r}</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </div>

                <div className="lg:col-span-4 space-y-6">
                    <GlassCard title="Employee of the Month">
                        <div className="flex flex-col items-center text-center">
                            <div className="relative mb-4">
                                <div className="absolute inset-0 bg-orange-500 blur-2xl opacity-20 rounded-full animate-pulse" />
                                <img src="https://picsum.photos/100?sig=eom" className="w-24 h-24 rounded-[32px] border-2 border-orange-500 relative z-10 object-cover" alt="" />
                                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-xl z-20 shadow-lg">🏆</div>
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white">John Smith</h3>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1">Sales Associate</p>
                            <div className="grid grid-cols-2 gap-3 w-full mt-6">
                                <div className="p-3 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Kudos</p>
                                    <p className="text-sm font-black text-slate-900 dark:text-white">780</p>
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Rating Score</p>
                                    <p className="text-sm font-black text-slate-900 dark:text-white">9.8</p>
                                </div>
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard title="Rewards Catalog">
                        <div className="grid grid-cols-2 gap-3">
                            {REWARDS.map((reward, i) => (
                                <div key={i} className={`p-4 rounded-2xl border flex flex-col items-center text-center group cursor-pointer transition-all hover:scale-[1.02] ${reward.color}`}>
                                    <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">{reward.icon}</div>
                                    <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">{reward.title}</h4>
                                    <p className="text-xs font-black text-slate-900 dark:text-white mb-3">{reward.cost} Kudos</p>
                                    <button className="w-full py-1.5 bg-white/20 dark:bg-white/10 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-white/30 transition-all">Redeem</button>
                                </div>
                            ))}
                        </div>
                    </GlassCard>

                    <GlassCard title="Upcoming Birthdays">
                        <div className="space-y-4">
                            {[
                                { name: 'Michael Carter', date: 'April 18 (Tomorrow)', avatar: 'https://picsum.photos/32?sig=b1' },
                                { name: 'Emma Wilson', date: 'April 25 (5 days)', avatar: 'https://picsum.photos/32?sig=b2' },
                                { name: 'Jacob Lewis', date: 'April 30 (12 days)', avatar: 'https://picsum.photos/32?sig=b3' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 group">
                                    <img src={item.avatar} className="w-8 h-8 rounded-lg border border-white/10" alt="" />
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">{item.name}</p>
                                        <p className="text-[9px] text-slate-500 font-bold uppercase">{item.date}</p>
                                    </div>
                                    <button className="opacity-0 group-hover:opacity-100 transition-opacity text-lg">🎈</button>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
};

export default Engagement;
