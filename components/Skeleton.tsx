import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circle' | 'rectangle';
    width?: string | number;
    height?: string | number;
    animate?: boolean;
}

const Skeleton: React.FC<SkeletonProps> = ({
    className = '',
    variant = 'rectangle',
    width,
    height,
    animate = true,
}) => {
    const baseClasses = 'bg-slate-300 dark:bg-white/5 relative overflow-hidden';
    const animationClass = animate ? 'after:absolute after:inset-0 after:-translate-x-full after:bg-gradient-to-r after:from-transparent after:via-white/60 dark:after:via-white/5 after:to-transparent after:animate-shimmer' : '';

    const variantClasses = {
        text: 'h-3 w-full rounded',
        circle: 'rounded-full',
        rectangle: 'rounded-xl',
    };

    const style: React.CSSProperties = {
        width: width,
        height: height,
    };

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${animationClass} ${className}`}
            style={style}
        />
    );
};

export default Skeleton;
