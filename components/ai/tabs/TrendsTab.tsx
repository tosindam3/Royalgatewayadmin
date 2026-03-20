import React from 'react';
import type { TrendsResponse } from '../../../types/ai';

interface Props {
  trends: TrendsResponse | null;
  isLoading: boolean;
}

const TrendsTab: React.FC<Props> = ({ trends, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-slate-100 dark:bg-white/5 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!trends) return null;

  return (
    <div className="space-y-6">
      {/* Industry News */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
          Industry News
        </p>
        <div className="space-y-2">
          {trends.news.map((item, i) => (
            <a
              key={i}
              href={item.url !== '#' ? item.url : undefined}
              target={item.url !== '#' ? '_blank' : undefined}
              rel="noreferrer"
              className={`block bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl p-4 transition-all duration-150 ${item.url !== '#' ? 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer' : ''}`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug">{item.title}</p>
                {item.url !== '#' && <span className="text-slate-300 dark:text-slate-600 text-xs flex-shrink-0">↗</span>}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{item.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] text-slate-400 dark:text-slate-500">{item.source}</span>
                <span className="text-[10px] text-slate-300 dark:text-slate-600">·</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">{item.published}</span>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* HR Best Practices */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
          HR Best Practices
        </p>
        <div className="space-y-2">
          {trends.hr_insights.map((item, i) => (
            <div key={i} className="flex gap-3 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl p-4">
              <span className="text-brand-primary text-lg flex-shrink-0">✦</span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-brand-primary mb-1">{item.category}</p>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{item.insight}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrendsTab;
