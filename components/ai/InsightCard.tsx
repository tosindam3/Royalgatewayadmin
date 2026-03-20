import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { InsightItem } from '../../types/ai';
import InsightFocusView from './InsightFocusView';

const typeConfig = {
  descriptive:  { label: 'Descriptive',  badge: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',  bar: 'bg-slate-400' },
  diagnostic:   { label: 'Diagnostic',   badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400', bar: 'bg-amber-500' },
  predictive:   { label: 'Predictive',   badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',    bar: 'bg-blue-500' },
  prescriptive: { label: 'Prescriptive', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400', bar: 'bg-emerald-500' },
};

const severityConfig = {
  info:     { icon: 'ℹ', color: 'text-slate-400' },
  warning:  { icon: '⚠', color: 'text-amber-500' },
  critical: { icon: '✕', color: 'text-red-500' },
  positive: { icon: '✓', color: 'text-emerald-500' },
};

interface Props {
  insight: InsightItem;
  onClose?: () => void;
}

const InsightCard: React.FC<Props> = ({ insight, onClose }) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [showFocus, setShowFocus] = useState(false);
  const tc = typeConfig[insight.type];
  const sc = severityConfig[insight.severity];
  const hasDetail = !!insight.detail || !!insight.action;

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (insight.action?.href) {
      if (onClose) onClose();
      navigate(insight.action.href);
    }
  };

  return (
    <>
      <div className={`group relative flex gap-3 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-[28px] p-5 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-brand-primary/5 hover:-translate-y-1 cursor-pointer overflow-hidden`}
        onClick={() => setShowFocus(true)}>
        
        {/* Hover Glow Effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-tr from-brand-primary/5 via-transparent to-transparent transition-opacity duration-500" />

      {/* Left accent bar */}
      <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-full ${tc.bar}`} />

      <div className="pl-2 flex-1 min-w-0">
        {/* Top row */}
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${tc.badge}`}>
            {tc.label}
          </span>
          <span className={`text-xs ${sc.color}`}>{sc.icon}</span>
        </div>

        {/* Headline */}
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug line-clamp-1">
          {insight.headline}
        </p>

        {/* Summary */}
        <p className={`text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
          {insight.summary}
        </p>

        {/* Expanded detail */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/10 space-y-2 animate-modal-in">
            {insight.detail && (
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {insight.detail}
              </p>
            )}
            {insight.action && (
              <button
                onClick={handleAction}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline"
              >
                {insight.action.label} →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Expand chevron */}
      {hasDetail && (
        <div className={`flex-shrink-0 text-slate-300 dark:text-slate-600 text-xs transition-transform duration-200 self-start mt-1 ${expanded ? 'rotate-180' : ''}`}>
          ▾
        </div>
      )}
      </div>

      {/* Focus View Portal-like Modal */}
      {showFocus && (
        <InsightFocusView 
          insight={insight} 
          onClose={() => setShowFocus(false)}
          onNavigate={onClose}
        />
      )}
    </>
  );
};

export default InsightCard;
