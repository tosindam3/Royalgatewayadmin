import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  delta?: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
  onClick?: () => void;
  color?: 'primary' | 'success' | 'warning' | 'info';
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  delta,
  trend = 'neutral',
  className = '',
  onClick,
  color = 'primary'
}) => {
  const getColorClasses = () => {
    switch (color) {
      case 'success':
        return {
          border: 'border-l-emerald-500',
          accent: 'text-emerald-500',
          bg: 'hover:bg-emerald-500/5',
          indicator: 'bg-emerald-500'
        };
      case 'warning':
        return {
          border: 'border-l-amber-500',
          accent: 'text-amber-500',
          bg: 'hover:bg-amber-500/5',
          indicator: 'bg-amber-500'
        };
      case 'info':
        return {
          border: 'border-l-blue-500',
          accent: 'text-blue-500',
          bg: 'hover:bg-blue-500/5',
          indicator: 'bg-blue-500'
        };
      default:
        return {
          border: 'border-l-brand-primary',
          accent: 'text-brand-primary',
          bg: 'hover:bg-brand-primary-10',
          indicator: 'bg-brand-primary'
        };
    }
  };

  const colors = getColorClasses();

  const getTrendIcon = () => {
    if (trend === 'up') return '↗';
    if (trend === 'down') return '↘';
    return '→';
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-emerald-500';
    if (trend === 'down') return 'text-red-500';
    return 'text-slate-400';
  };

  return (
    <div
      className={`
        relative overflow-hidden
        bg-white dark:bg-white/5 
        border border-slate-200 dark:border-white/10 
        ${colors.border}
        rounded-2xl p-6 
        shadow-sm hover:shadow-md
        ${colors.bg}
        transition-all duration-300 
        cursor-pointer group
        ${className}
      `}
      onClick={onClick}
    >
      {/* Top section with title and trend */}
      <div className="flex justify-between items-start mb-4">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          {title}
        </span>
        {delta && (
          <div className={`
            flex items-center gap-1 
            px-2 py-1 
            rounded-lg 
            bg-slate-50 dark:bg-white/5
            ${getTrendColor()}
            text-xs font-medium
          `}>
            <span className="text-xs">{getTrendIcon()}</span>
            {delta}
          </div>
        )}
      </div>

      {/* Main value */}
      <div className="mb-4">
        <h3 className={`text-3xl font-bold ${colors.accent} tracking-tight`}>
          {value}
        </h3>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 dark:bg-white/5">
        <div 
          className={`
            h-full ${colors.indicator} 
            w-0 group-hover:w-full 
            transition-all duration-500 ease-out
          `} 
        />
      </div>

      {/* Subtle brand color glow on hover */}
      <div className={`
        absolute inset-0 
        ${color === 'primary' ? 'bg-brand-primary-10' : ''}
        ${color === 'success' ? 'bg-emerald-500/10' : ''}
        ${color === 'warning' ? 'bg-amber-500/10' : ''}
        ${color === 'info' ? 'bg-blue-500/10' : ''}
        opacity-0 group-hover:opacity-100 
        transition-opacity duration-300 
        rounded-2xl
      `} />
    </div>
  );
};

export default MetricCard;