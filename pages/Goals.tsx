
import React, { useState } from 'react';
import GlassCard from '../components/GlassCard';
import { Objective, KeyResult, OKRStatus } from '../types';
import { suggestKeyResults } from '../services/geminiService';

const MOCK_OBJECTIVES: Objective[] = [
  {
    id: 'obj-1',
    title: 'Scale Infrastructure to 1M DAU',
    ownerId: 'u-1',
    ownerName: 'Ethan Parker',
    ownerAvatar: 'https://picsum.photos/40?sig=10',
    category: 'Strategic',
    status: 'ON_TRACK',
    startDate: '2024-01-01',
    endDate: '2024-06-30',
    keyResults: [
      { id: 'kr-1', description: 'Achieve 99.99% uptime for core services', targetValue: 99.99, currentValue: 99.95, unit: '%', weight: 40 },
      { id: 'kr-2', description: 'Reduce p99 latency to <100ms', targetValue: 100, currentValue: 120, unit: 'ms', weight: 30 },
      { id: 'kr-3', description: 'Implement auto-scaling for 5 additional services', targetValue: 5, currentValue: 3, unit: 'services', weight: 30 }
    ]
  },
  {
    id: 'obj-2',
    title: 'Optimize Talent Acquisition Velocity',
    ownerId: 'u-2',
    ownerName: 'Sarah Connor',
    ownerAvatar: 'https://picsum.photos/40?sig=11',
    category: 'Operational',
    status: 'AT_RISK',
    startDate: '2024-01-15',
    endDate: '2024-04-15',
    keyResults: [
      { id: 'kr-4', description: 'Reduce Time-to-Hire to 21 days', targetValue: 21, currentValue: 28, unit: 'days', weight: 50 },
      { id: 'kr-5', description: 'Improve Candidate NPS to 4.5/5', targetValue: 4.5, currentValue: 4.2, unit: 'score', weight: 50 }
    ]
  }
];

const Goals: React.FC = () => {
  const [objectives, setObjectives] = useState<Objective[]>(MOCK_OBJECTIVES);
  const [activeFilter, setActiveFilter] = useState('All');
  const [isAiArchitecting, setIsAiArchitecting] = useState(false);
  const [newObjectiveTitle, setNewObjectiveTitle] = useState('');

  const calculateProgress = (keyResults: KeyResult[]) => {
    const total = keyResults.reduce((acc, kr) => {
      // Logic: if current is 120 and target is 100 (for a 'lower is better' metric like latency)
      const progress = kr.unit === 'ms' || kr.unit === 'days' 
        ? Math.min(100, (kr.targetValue / kr.currentValue) * 100)
        : Math.min(100, (kr.currentValue / kr.targetValue) * 100);
      return acc + (progress * (kr.weight / 100));
    }, 0);
    return Math.round(total);
  };

  const getStatusColor = (status: OKRStatus) => {
    switch (status) {
      case 'ON_TRACK': return 'text-emerald-400';
      case 'AT_RISK': return 'text-rose-400';
      case 'COMPLETED': return 'text-blue-400';
      case 'BEHIND': return 'text-amber-400';
      default: return 'text-slate-400';
    }
  };

  const handleAiArchitect = async () => {
    if (!newObjectiveTitle.trim()) return;
    setIsAiArchitecting(true);
    try {
      const krs = await suggestKeyResults(newObjectiveTitle);
      const newObj: Objective = {
        id: `obj-${Math.random()}`,
        title: newObjectiveTitle,
        ownerId: 'u-1',
        ownerName: 'Emily Johnson',
        ownerAvatar: 'https://picsum.photos/40?sig=me',
        category: 'Growth',
        status: 'ON_TRACK',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '2024-12-31',
        keyResults: krs.map((kr: any, i: number) => ({
          ...kr,
          id: `kr-new-${i}`,
          currentValue: 0,
          weight: Math.floor(100 / krs.length)
        }))
      };
      setObjectives([newObj, ...objectives]);
      setNewObjectiveTitle('');
    } catch (error) {
      console.error("AI Architect failed:", error);
    } finally {
      setIsAiArchitecting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight uppercase italic">Strategic Goals & OKRs</h2>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8252e9] animate-pulse" />
            Active Governance Period: Q1-Q2 2024
          </p>
        </div>
        <div className="flex gap-3">
          <div className="relative group">
            <input 
              type="text" 
              placeholder="Architect new goal..." 
              value={newObjectiveTitle}
              onChange={(e) => setNewObjectiveTitle(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white w-64 focus:border-emerald-500/50 outline-none transition-all"
            />
            <button 
              onClick={handleAiArchitect}
              disabled={isAiArchitecting || !newObjectiveTitle}
              className="absolute right-2 top-1.5 p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all disabled:opacity-30"
            >
              {/* Fixed: replaced isAiGenerating with isAiArchitecting */}
              {isAiArchitecting ? '✨' : 'Suggest'}
            </button>
          </div>
          <button className="px-6 py-2.5 gradient-bg text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-xl shadow-purple-500/20 active:scale-95 transition-all">
            Manual Create
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { l: 'Completion Rate', v: '72%', d: 'Org-wide average', c: 'text-[#8252e9]' },
          { l: 'Strategic Impact', v: 'High', d: 'Alignment health', c: 'text-emerald-400' },
          { l: 'Behind Schedule', v: '4', d: 'Objectives at risk', c: 'text-rose-400' },
          { l: 'Days Remaining', v: '42', d: 'Cycle Q2 2024', c: 'text-blue-400' }
        ].map((s, i) => (
          <GlassCard key={i} className="!p-4 hover:border-white/20 transition-all group">
             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-300 transition-colors">{s.l}</p>
             <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-2xl font-black ${s.c}`}>{s.v}</span>
                <span className="text-[9px] text-slate-600 font-bold uppercase">{s.d}</span>
             </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Filters Sidebar */}
        <aside className="lg:col-span-3 space-y-6 sticky top-24">
          <GlassCard title="Perspective" className="!p-4">
            <div className="space-y-1">
              {['All Goals', 'Company Strategic', 'Engineering Team', 'My Objectives'].map(f => (
                <button 
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeFilter === f ? 'bg-[#8252e9] text-white shadow-lg' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </GlassCard>

          <GlassCard title="Alignment Tree" className="!p-4 opacity-50">
             <div className="p-8 border-2 border-dashed border-white/5 rounded-2xl text-center">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-relaxed">
                   Visual tree showing goal cascading will render here
                </p>
             </div>
          </GlassCard>
        </aside>

        {/* Objectives Feed */}
        <main className="lg:col-span-9 space-y-6">
          {objectives.map((obj) => {
            const progress = calculateProgress(obj.keyResults);
            return (
              <GlassCard key={obj.id} className="relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 text-6xl select-none group-hover:opacity-10 transition-opacity">🎯</div>
                
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Left: Metadata */}
                  <div className="md:w-64 space-y-4">
                    <div className="flex items-center gap-3">
                       <img src={obj.ownerAvatar} className="w-10 h-10 rounded-xl border border-white/10" alt={obj.ownerName} />
                       <div>
                          <p className="text-xs font-black text-white leading-tight">{obj.ownerName}</p>
                          <p className={`text-[9px] font-black uppercase tracking-widest ${getStatusColor(obj.status)}`}>{obj.status.replace('_', ' ')}</p>
                       </div>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Category</p>
                       <p className="text-xs font-bold text-slate-200">{obj.category}</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Period</p>
                       <p className="text-[10px] font-mono text-slate-400">{obj.startDate} → {obj.endDate}</p>
                    </div>
                  </div>

                  {/* Right: Content & Key Results */}
                  <div className="flex-1 space-y-6">
                    <div>
                      <h3 className="text-xl font-black text-white tracking-tight">{obj.title}</h3>
                      <div className="flex items-center gap-4 mt-4">
                        <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden shadow-inner">
                          <div 
                            className={`h-full transition-all duration-1000 ${progress > 70 ? 'bg-emerald-500 shadow-[0_0_12px_#10b981]' : progress > 40 ? 'bg-blue-500 shadow-[0_0_12px_#3b82f6]' : 'bg-rose-500'}`} 
                            style={{ width: `${progress}%` }} 
                          />
                        </div>
                        <span className="text-sm font-black text-white">{progress}%</span>
                      </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-white/5">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Key Results</p>
                      {obj.keyResults.map((kr) => {
                        const krProgress = kr.unit === 'ms' || kr.unit === 'days' 
                          ? Math.min(100, (kr.targetValue / kr.currentValue) * 100)
                          : Math.min(100, (kr.currentValue / kr.targetValue) * 100);
                        
                        return (
                          <div key={kr.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] transition-all">
                             <div className="flex justify-between items-start mb-2">
                                <p className="text-xs text-slate-300 font-medium leading-relaxed max-w-md">{kr.description}</p>
                                <div className="text-right">
                                   <p className="text-xs font-black text-white">{kr.currentValue} / {kr.targetValue} {kr.unit}</p>
                                   <p className="text-[9px] font-black text-slate-600 uppercase">Weight: {kr.weight}%</p>
                                </div>
                             </div>
                             <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-slate-500/50" style={{ width: `${krProgress}%` }} />
                             </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <button className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-all">
                         Update Progress
                      </button>
                      <button className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-all">
                         View Alignment
                      </button>
                    </div>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </main>
      </div>
    </div>
  );
};

export default Goals;
