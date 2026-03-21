import React from 'react';
import type { TrendsResponse } from '../../../types/ai';

interface Props {
  trends: TrendsResponse | null;
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
}

const TrendsTab: React.FC<Props> = ({ trends, isLoading, error, onRetry }) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-slate-100 dark:bg-white/5 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <p className="text-4xl mb-2">⚠</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">{error}</p>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-brand-primary/10 text-brand-primary rounded-xl text-xs font-bold hover:bg-brand-primary/20 transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!trends || (trends.news.length === 0 && trends.hr_insights.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
        <p className="text-4xl mb-2">🔭</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">Scanning for trends...</p>
        {!isLoading && onRetry && (
           <button
            onClick={onRetry}
            className="mt-4 px-4 py-2 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-white/10 transition-all underline"
           >
            Refresh manually
           </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Industry News */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
          Industry News
        </p>
        <div className="grid grid-cols-1 gap-4">
          {trends.news.map((item, i) => (
            <a
              key={i}
              href={item.url !== '#' ? item.url : undefined}
              target={item.url !== '#' ? '_blank' : undefined}
              rel="noreferrer"
              className={`group relative block bg-white/50 dark:bg-white/5 backdrop-blur-md border border-slate-200/50 dark:border-white/10 rounded-3xl p-4 sm:p-6 transition-all duration-300 ${item.url !== '#' ? 'hover:shadow-2xl hover:shadow-brand-primary/10 hover:-translate-y-1 cursor-pointer' : ''}`}
            >
              <div className="flex items-start justify-between gap-4">
                <p className="text-base font-bold text-slate-900 dark:text-white leading-tight group-hover:text-brand-primary transition-colors">{item.title}</p>
                {item.url !== '#' && <span className="text-slate-400 group-hover:text-brand-primary text-lg transition-colors flex-shrink-0">↗</span>}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed font-medium line-clamp-2">{item.description}</p>
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary bg-brand-primary/5 px-2 py-0.5 rounded-full">{item.source}</span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{item.published}</span>
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
        <div className="grid grid-cols-1 gap-3">
          {trends.hr_insights.map((item, i) => (
            <div key={i} className="flex gap-4 bg-slate-50/50 dark:bg-white/5 backdrop-blur-sm border border-slate-100 dark:border-white/10 rounded-3xl p-4 sm:p-5 hover:border-brand-primary/30 transition-colors">
              <div className="w-10 h-10 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary text-xl flex-shrink-0">
                ✦
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-brand-primary mb-1">{item.category}</p>
                <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">{item.insight}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrendsTab;
