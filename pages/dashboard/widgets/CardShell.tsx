import React from 'react';

interface CardShellProps {
  title: string;
  /** Rendered as a small brand-colored link/text on the right of the header */
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Brand-bg variant for QuickActionsWidget */
  accent?: boolean;
}

const CardShell: React.FC<CardShellProps> = ({ title, action, children, className = '', accent = false }) => {
  if (accent) {
    return (
      <div className={`bg-brand-primary rounded-2xl p-6 text-white shadow-sm hover:shadow-md transition-shadow ${className}`}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-black italic uppercase tracking-widest text-white/90">{title}</h3>
          {action}
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</h3>
        {action && (
          <span className="text-[11px] font-medium text-brand-primary cursor-pointer hover:underline">
            {action}
          </span>
        )}
      </div>
      {children}
    </div>
  );
};

export default CardShell;
