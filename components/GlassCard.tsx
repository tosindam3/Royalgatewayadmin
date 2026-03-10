
import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
  onClick?: () => void;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', title, action, onClick }) => {
  return (
    <div
      className={`glass rounded-[24px] border border-slate-200 dark:border-white/10 p-6 shadow-xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] bg-white/70 dark:bg-white/5 ${className}`}
      onClick={onClick}
    >
      {(title || action) && (
        <div className="flex items-center justify-between mb-6">
          {title && <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

export default GlassCard;
