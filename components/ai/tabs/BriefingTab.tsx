import React from 'react';
import InsightCard from '../InsightCard';
import type { BriefingResponse } from '../../../types/ai';

interface Props {
  briefing: BriefingResponse | null;
  isLoading: boolean;
  error: string | null;
}

const HealthRing: React.FC<{ score: number }> = ({ score }) => {
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="#e2e8f0" strokeWidth="6" className="dark:stroke-white/10" />
        <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 36 36)" style={{ transition: 'stroke-dasharray 1s ease' }} />
        <text x="36" y="40" textAnchor="middle" fontSize="14" fontWeight="bold" fill={color}>{score}</text>
      </svg>
      <span className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500">Org Health</span>
    </div>
  );
};

const BriefingTab: React.FC<Props> = ({ briefing, isLoading, error }) => {
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
        </div>
      </div>

      {/* Insight groups */}
      {Object.entries(byType).map(([type, items]) =>
        items.length > 0 ? (
          <div key={type} className="space-y-2">
            {items.map(insight => <InsightCard key={insight.id} insight={insight} />)}
          </div>
        ) : null
      )}
    </div>
  );
};

export default BriefingTab;
