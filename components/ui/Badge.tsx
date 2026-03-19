import React from 'react';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'default';
    size?: 'sm' | 'md';
    className?: string;
}

const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', size = 'md', className }) => {
    const variants = {
        primary: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
        secondary: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
        success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        danger: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
        info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        default: 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-500 border-slate-200 dark:border-white/10'
    };

    const sizes = {
        sm: 'px-2 py-0.5 text-[8px]',
        md: 'px-2.5 py-1 text-[10px]'
    };

    return (
        <span className={`inline-flex items-center font-black uppercase tracking-wider border rounded-lg ${variants[variant]} ${sizes[size]} ${className ?? ''}`}>
            {children}
        </span>
    );
};

export default Badge;
