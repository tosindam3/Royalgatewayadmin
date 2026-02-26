import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  variant?: 'rect' | 'circle' | 'text';
}

const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  width,
  height,
  variant = 'rect'
}) => {
  const baseStyle: React.CSSProperties = {
    width: width,
    height: height,
  };

  const variantClass = {
    rect: 'rounded-xl',
    circle: 'rounded-full',
    text: 'rounded-md h-3 w-full'
  }[variant];

  return (
    <div
      style={baseStyle}
      className={`animate-pulse bg-slate-200/50 dark:bg-white/5 overflow-hidden relative ${variantClass} ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent" />
    </div>
  );
};


export const CardSkeleton: React.FC = () => (
  <div className="bg-white/5 border border-white/5 rounded-[32px] p-6 space-y-4">
    <Skeleton width="40%" height="12px" />
    <Skeleton width="70%" height="24px" />
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 4 }) => (
  <div className="w-full bg-white/5 border border-white/5 rounded-[32px] overflow-hidden">
    <div className="p-6 border-b border-white/5 flex gap-4">
      {Array(cols).fill(0).map((_, i) => (
        <Skeleton key={i} width={`${100 / cols}%`} height="16px" />
      ))}
    </div>
    <div className="p-6 space-y-4">
      {Array(rows).fill(0).map((_, i) => (
        <div key={i} className="flex gap-4 items-center">
          <Skeleton variant="circle" width="40px" height="40px" />
          <div className="flex-1 space-y-2">
            <Skeleton width="40%" height="10px" />
            <Skeleton width="20%" height="8px" />
          </div>
          <Skeleton width="80px" height="20px" />
        </div>
      ))}
    </div>
  </div>
);

export const ProfileHeaderSkeleton: React.FC = () => (
  <div className="flex flex-col md:flex-row gap-8 items-center md:items-start p-8 bg-white/5 rounded-[40px] border border-white/5 mb-8">
    <Skeleton width="128px" height="128px" className="!rounded-[40px]" />
    <div className="flex-1 space-y-4 text-center md:text-left">
      <div className="space-y-2">
        <Skeleton width="240px" height="32px" className="mx-auto md:mx-0" />
        <Skeleton width="160px" height="14px" className="mx-auto md:mx-0" />
      </div>
      <div className="flex flex-wrap gap-3 justify-center md:justify-start">
        <Skeleton width="100px" height="32px" />
        <Skeleton width="100px" height="32px" />
        <Skeleton width="100px" height="32px" />
      </div>
    </div>
  </div>
);

export const TabPanelSkeleton: React.FC = () => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
    <TableSkeleton rows={3} />
  </div>
);

export default Skeleton;
