import React, { useState } from 'react';
import InsightCard from '../InsightCard';
import type { InsightItem, InsightType } from '../../../types/ai';

interface Props {
  insights: InsightItem[];
}

const tabs: { key: InsightType | 'all'; label: string; color: string }[] = [
  { key: 'all',          label: 'All',          color: 'text-slate-600 dark:text-slate-300' },
  { key: 'descriptive',  label: 'Descriptive',  color: 'text-slate-500' },
  { key: 'diagnostic',   label: 'Diagnostic',   color: 'text-amber-600' },
  { key: 'predictive',   label: 'Predictive',   color: 'text-blue-600' },
  { key: 'prescriptive', label: 'Prescriptive', color: 'text-emerald-600' },
];

const InsightsTab: React.FC<Props> = ({ insights }) => {
  const [active, setActive] = useState<InsightType | 'all'>('all');

  const filtered = active === 'all' ? insights : insights.filter(i => i.type === active);

  return (
    <div className="space-y-4">
      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={`text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-all duration-150 ${
              active === t.key
                ? 'bg-brand-primary text-white border-brand-primary'
                : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-brand-primary/50'
            }`}
          >
            {t.label}
            <span className="ml-1 opacity-60">
              {t.key === 'all' ? insights.length : insights.filter(i => i.type === t.key).length}
            </span>
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-8">No insights in this category.</p>
        ) : (
          filtered.map(insight => <InsightCard key={insight.id} insight={insight} />)
        )}
      </div>
    </div>
  );
};

export default InsightsTab;
