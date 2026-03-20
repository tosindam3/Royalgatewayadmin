import React from 'react';
import InsightCard from '../InsightCard';
import type { BriefingResponse } from '../../../types/ai';

interface Props {
  briefing: BriefingResponse | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
}

const HealthRing: React.FC<{ score: number }> = ({ score }) => {
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  const r = 30;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg width="84" height="84" viewBox="0 0 84 84" className="drop-shadow-[0_0_12px_rgba(0,0,0,0.1)]">
          <circle cx="42" cy="42" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" className="dark:stroke-white/5" />
          <circle cx="42" cy="42" r={r} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            transform="rotate(-90 42 42)" style={{ transition: 'stroke-dasharray 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
          <text x="42" y="47" textAnchor="middle" fontSize="18" fontWeight="900" fill={color} className="font-mono">{score}%</text>
        </svg>
      </div>
      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Org Health</span>
    </div>
  );
};

const BriefingTab: React.FC<Props> = ({ briefing, isLoading, error, onClose }) => {
  if (isLoading) {
    return (
      <div className="space-y-3 p-1">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-slate-100 dark:bg-white/5 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-2xl mb-2">⚠</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{error}</p>
      </div>
    );
  }

  if (!briefing) return null;

  const byType = {
    descriptive:  briefing.insights.filter(i => i.type === 'descriptive'),
    diagnostic:   briefing.insights.filter(i => i.type === 'diagnostic'),
    predictive:   briefing.insights.filter(i => i.type === 'predictive'),
    prescriptive: briefing.insights.filter(i => i.type === 'prescriptive'),
  };

  return (
    <div className="space-y-5">
      {/* Health score */}
      <div className="flex items-center gap-4 bg-slate-50 dark:bg-white/5 rounded-2xl p-4">
        <HealthRing score={briefing.health_score} />
        <div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Organisation Health Score</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Composite of attendance, retention, performance and approvals.
          </p>
          <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-1">
            Updated {new Date(briefing.generated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          {briefing.gemini_enabled && briefing.is_enriched === false && (
            <div className="mt-4 p-3 bg-brand-primary/5 dark:bg-brand-primary/10 border border-brand-primary/10 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce" />
              </div>
              <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest">
                Strategic AI Analyst is enriching your briefing...
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Insight groups */}
      {briefing.insights.length > 0 ? (
        Object.entries(byType).map(([type, items]) =>
          items.length > 0 ? (
            <div key={type} className="space-y-4">
              {items.map(insight => (
                <InsightCard 
                  key={insight.id} 
                  insight={insight} 
                  onClose={onClose} 
                />
              ))}
            </div>
          ) : null
        )
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
          <p className="text-4xl mb-2">✨</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Your AI Analyst is still gathering data.</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Check back soon for personalized organizational insights.</p>
        </div>
      )}
    </div>
  );
};

export default BriefingTab;
