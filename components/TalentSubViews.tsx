
import React from 'react';
import GlassCard from './GlassCard';
import DataTable from './ui/DataTable';
import {
    BarChart, Bar, XAxis, Tooltip, ResponsiveContainer,
    Cell
} from 'recharts';

// --- Types & Mock Data ---

export interface JobOpening {
    id: string;
    title: string;
    department: string;
    location: string;
    openings: number;
    applicants: number;
    status: 'Active' | 'On Hold' | 'Draft' | 'Closed';
    posted: string;
}

export interface Candidate {
    id: string;
    name: string;
    role: string;
    stage: string;
    source: string;
    rating: number;
    applied: string;
    avatar: string;
}

export const CANDIDATE_STATS = [
    { name: 'New Applicants', count: 248, color: '#4c49d8' },
    { name: 'Screening', count: 12, color: '#8252e9' },
    { name: 'Technical', count: 12, color: '#f59e0b' },
    { name: 'Interviews', count: 3, color: '#10b981' },
    { name: 'Offers', count: 2, color: '#94a3b8' },
];

export const CANDIDATE_CHART_DATA = [
    { name: 'Mon', val: 40 }, { name: 'Tue', val: 30 }, { name: 'Wed', val: 25 },
    { name: 'Thu', val: 35 }, { name: 'Fri', val: 80 }, { name: 'Sat', val: 70 }, { name: 'Sun', val: 50 },
];

export const JOB_OPENINGS_DATA: JobOpening[] = [
    { id: 'JOB-001', title: 'Senior Software Engineer', department: 'Engineering', location: 'Remote', openings: 2, applicants: 156, status: 'Active', posted: '2024-03-01' },
    { id: 'JOB-002', title: 'Product Marketing Manager', department: 'Marketing', location: 'Lagos, NG', openings: 1, applicants: 42, status: 'Active', posted: '2024-03-05' },
    { id: 'JOB-003', title: 'UX Designer', department: 'Design', location: 'Remote', openings: 1, applicants: 89, status: 'On Hold', posted: '2024-02-28' },
    { id: 'JOB-004', title: 'HR Generalist', department: 'Operations', location: 'London, UK', openings: 1, applicants: 24, status: 'Draft', posted: '2024-03-08' },
];

export const CANDIDATES_DATA: Candidate[] = [
    { id: 'CAN-001', name: 'Alex Rivera', role: 'Senior Software Engineer', stage: 'Technical Interview', source: 'LinkedIn', rating: 4.5, applied: '2 days ago', avatar: 'https://i.pravatar.cc/150?u=alex' },
    { id: 'CAN-002', name: 'Sarah Chen', role: 'UX Designer', stage: 'Screening', source: 'Referral', rating: 4.8, applied: '5 hours ago', avatar: 'https://i.pravatar.cc/150?u=sarah' },
    { id: 'CAN-003', name: 'Michael Ogun', role: 'Product Manager', stage: 'Offer Sent', source: 'Indeed', rating: 4.2, applied: '1 week ago', avatar: 'https://i.pravatar.cc/150?u=michael' },
    { id: 'CAN-004', name: 'Elena Petrova', role: 'Software Engineer', stage: 'Rejected', source: 'Direct', rating: 3.0, applied: '3 days ago', avatar: 'https://i.pravatar.cc/150?u=elena' },
];

// --- Shared Internal Components ---

const ViewHeader: React.FC<{ title: string; count: number; onAdd?: () => void; addLabel?: string }> = ({ title, count, onAdd, addLabel }) => (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
                {title}
                <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    {count} Total
                </span>
            </h3>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
                <input
                    type="text"
                    placeholder="Search identity or requisition..."
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[11px] text-white w-full md:w-64 focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all placeholder:text-slate-600"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">🔍</span>
            </div>
            {onAdd && (
                <button
                    onClick={onAdd}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-orange-500/20 transition-all whitespace-nowrap"
                >
                    {addLabel || '+ Add'}
                </button>
            )}
        </div>
    </div>
);

// --- Main Views ---

export const DashboardView: React.FC = () => {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                    { label: 'Active Job Openings', val: '14', footer: 'View All ›', icon: '💼', color: 'text-blue-400' },
                    { label: 'New Applicants', val: '68', footer: '+25% vs last 30 d', icon: '👤', color: 'text-emerald-400' },
                    { label: 'Today Interviews', val: '5', footer: 'Focus: Tech', icon: '📅', color: 'text-rose-400' },
                    { label: 'Onboarding', val: '8', footer: 'Pending: 2', icon: '🎓', color: 'text-purple-400' },
                    { label: 'Time to Hire', val: '18d', footer: 'Avg last 90d', icon: '⚡', color: 'text-blue-500' },
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
                            <span className={`text-[9px] font-black uppercase tracking-widest ${stat.color} cursor-pointer hover:underline`}>
                                {stat.footer}
                            </span>
                        </div>
                    </GlassCard>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-8 space-y-6">
                    <GlassCard title="Hiring Velocity Trends">
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={CANDIDATE_CHART_DATA}>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '11px', color: '#fff' }} />
                                    <Bar dataKey="val" radius={[6, 6, 0, 0]}>
                                        {CANDIDATE_CHART_DATA.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 4 ? '#f59e0b' : '#8252e9'} opacity={0.8} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </GlassCard>

                    <GlassCard title="Critical Applications" action={<button className="text-[10px] font-black text-blue-400 uppercase tracking-widest">View All ›</button>}>
                        <div className="divide-y divide-white/5">
                            {CANDIDATES_DATA.slice(0, 3).map((candidate, i) => (
                                <div key={i} className="py-4 flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <img src={candidate.avatar} className="w-10 h-10 rounded-xl border border-white/10" alt="" />
                                        <div>
                                            <p className="text-xs font-bold text-white">{candidate.name}</p>
                                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{candidate.role}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-[8px] font-black uppercase tracking-widest">
                                            {candidate.stage}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </div>

                <div className="lg:col-span-4 space-y-6">
                    <GlassCard title="Talent Source Distribution">
                        <div className="space-y-4">
                            {[
                                { label: 'LinkedIn', val: 124, color: 'bg-blue-600' },
                                { label: 'Indeed', val: 86, color: 'bg-blue-400' },
                                { label: 'Referrals', val: 32, color: 'bg-orange-500' },
                            ].map((source, i) => (
                                <div key={i} className="space-y-1.5">
                                    <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                        <span>{source.label}</span>
                                        <span className="text-white">{source.val}</span>
                                    </div>
                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div className={`h-full ${source.color}`} style={{ width: `${(source.val / 248) * 100}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GlassCard>

                    <GlassCard title="Talent Funnel">
                        <div className="flex flex-col gap-2">
                            {CANDIDATE_STATS.map((stat, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/5 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stat.color }} />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.name}</span>
                                    </div>
                                    <span className="text-xs font-black text-white">{stat.count}</span>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
};

export const JobOpeningsView: React.FC = () => {
    const columns = [
        {
            header: 'Job Description',
            key: 'title',
            render: (job: JobOpening) => (
                <div>
                    <p className="text-xs font-bold text-white tracking-tight uppercase">{job.title}</p>
                    <p className="text-[9px] text-slate-500 font-bold tracking-widest uppercase mt-0.5">{job.id} • {job.location}</p>
                </div>
            )
        },
        {
            header: 'Department',
            key: 'department',
            render: (job: JobOpening) => <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{job.department}</span>
        },
        {
            header: 'Applicants / Caps',
            key: 'metrics',
            align: 'center' as const,
            render: (job: JobOpening) => (
                <div className="flex items-center justify-center gap-4">
                    <div><p className="text-[10px] font-bold text-white leading-none">{job.applicants}</p><p className="text-[8px] text-slate-600 uppercase font-black">Apps</p></div>
                    <div><p className="text-[10px] font-bold text-white leading-none">{job.openings}</p><p className="text-[8px] text-slate-600 uppercase font-black">Open</p></div>
                </div>
            )
        },
        {
            header: 'Status',
            key: 'status',
            align: 'right' as const,
            render: (job: JobOpening) => (
                <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase border ${job.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        job.status === 'On Hold' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                            'bg-slate-500/10 text-slate-400 border-slate-500/20'
                    }`}>
                    {job.status}
                </span>
            )
        }
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ViewHeader title="Active Requisitions" count={JOB_OPENINGS_DATA.length} addLabel="+ Create Requisition" onAdd={() => { }} />
            <DataTable
                data={JOB_OPENINGS_DATA}
                columns={columns}
                pagination={{ currentPage: 1, totalPages: 5, onPageChange: () => { } }}
            />
        </div>
    );
};

export const CandidatesView: React.FC = () => {
    const columns = [
        {
            header: 'Candidate / Identity',
            key: 'name',
            render: (can: Candidate) => (
                <div className="flex items-center gap-3">
                    <img src={can.avatar} className="w-10 h-10 rounded-xl border border-white/10" alt="" />
                    <div>
                        <p className="text-xs font-bold text-white tracking-tight">{can.name}</p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">{can.id}</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Applied Role',
            key: 'role',
            render: (can: Candidate) => (
                <div>
                    <p className="text-[10px] font-black text-white uppercase tracking-widest">{can.role}</p>
                    <p className="text-[8px] text-slate-500 font-bold uppercase mt-1">Via {can.source}</p>
                </div>
            )
        },
        {
            header: 'Pipeline Stage',
            key: 'stage',
            render: (can: Candidate) => (
                <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase border ${can.stage.includes('Offer') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        can.stage === 'Rejected' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                            'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}>
                    {can.stage}
                </span>
            )
        },
        {
            header: 'Intelligence Score',
            key: 'rating',
            align: 'right' as const,
            render: (can: Candidate) => (
                <div className="flex items-center justify-end gap-2">
                    <div className="flex gap-px">
                        {[1, 2, 3, 4, 5].map(s => (
                            <div key={s} className={`w-0.5 h-3 rounded-full ${s <= Math.floor(can.rating) ? 'bg-orange-500' : 'bg-white/10'}`} />
                        ))}
                    </div>
                    <span className="text-[10px] font-black text-orange-400">{can.rating}</span>
                </div>
            )
        }
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ViewHeader title="Candidate Directory" count={CANDIDATES_DATA.length} addLabel="+ Propose Candidate" onAdd={() => { }} />
            <DataTable
                data={CANDIDATES_DATA}
                columns={columns}
                pagination={{ currentPage: 1, totalPages: 12, onPageChange: () => { } }}
            />
        </div>
    );
};

export const OnboardingView: React.FC = () => {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ViewHeader title="Onboarding Intelligence" count={3} addLabel="+ Initiate Onboarding" onAdd={() => { }} />
            <div className="grid grid-cols-1 gap-4">
                {[
                    { name: 'Alex Rivera', role: 'Senior Software Engineer', start: '2024-04-15', progress: 85, status: 'On Track' },
                    { name: 'Sarah Chen', role: 'Head of Product', start: '2024-04-20', progress: 40, status: 'Delayed' },
                ].map((item, i) => (
                    <GlassCard key={i} className="!p-6 border-white/5 hover:bg-white/[0.03] transition-all">
                        <div className="flex flex-col md:flex-row md:items-center gap-6">
                            <div className="flex items-center gap-4 min-w-[200px]">
                                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-xl">👤</div>
                                <div><p className="text-sm font-black text-white">{item.name}</p><p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{item.role}</p></div>
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-2"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Onboarding Progress</span><span className="text-[10px] font-black text-white">{item.progress}%</span></div>
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                    <div className="h-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]" style={{ width: `${item.progress}%` }} />
                                </div>
                            </div>
                            <div className="flex items-center gap-6 min-w-[300px] justify-end">
                                <div className="text-right">
                                    <p className="text-xs font-black text-white">{item.start}</p>
                                    <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">Entry Date</p>
                                </div>
                                <span className={`px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest ${item.status === 'On Track' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>{item.status}</span>
                                <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest transition-all">Manage</button>
                            </div>
                        </div>
                    </GlassCard>
                ))}
            </div>
        </div>
    );
};

export const SettingsView: React.FC = () => {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard title="Workflow Automation Templates">
                <div className="space-y-3">
                    {['Standard Hiring Pipeline', 'Executive Search Flow', 'Software Engineering Assessment'].map(t => (
                        <div key={t} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between group hover:bg-white/5 transition-all cursor-pointer">
                            <div><p className="text-xs font-bold text-white">{t}</p><p className="text-[9px] text-slate-600 font-bold uppercase mt-0.5 tracking-widest">7 Phases • 4 Logic Hooks</p></div>
                            <span className="text-lg opacity-40 group-hover:opacity-100 transition-opacity">›</span>
                        </div>
                    ))}
                </div>
            </GlassCard>
            <GlassCard title="Intelligence Notifications">
                <div className="space-y-4">
                    {[
                        { label: 'Application Received Confirmation', enabled: true },
                        { label: 'Interview Intelligence Summary', enabled: true },
                        { label: 'Weekly Hiring Velocity Digest', enabled: false },
                    ].map((n, i) => (
                        <div key={i} className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-400">{n.label}</span>
                            <div className={`w-10 h-5 rounded-full relative transition-all cursor-pointer ${n.enabled ? 'bg-orange-500' : 'bg-white/10'}`}>
                                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${n.enabled ? 'left-6' : 'left-1'}`} />
                            </div>
                        </div>
                    ))}
                </div>
            </GlassCard>
        </div>
    );
};
