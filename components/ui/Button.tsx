import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'emerald' | 'amber';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    loadingText?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    loadingText,
    leftIcon,
    rightIcon,
    className = "",
    disabled,
    ...props
}) => {
    const baseStyles = "relative flex items-center justify-center gap-2 font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer";

    const variants = {
        primary: "bg-[var(--brand-primary)] text-white shadow-xl shadow-purple-500/20 hover:scale-[1.02]",
        secondary: "bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white",
        danger: "bg-rose-500 text-white shadow-xl shadow-rose-500/20 hover:scale-[1.02]",
        ghost: "bg-transparent hover:bg-slate-50 dark:hover:bg-white/5 text-slate-500 hover:text-slate-900 dark:hover:text-white",
        emerald: "bg-emerald-500 text-white shadow-xl shadow-emerald-500/20 hover:scale-[1.02]",
        amber: "bg-[#eab308] text-slate-900 shadow-xl shadow-yellow-500/20 hover:scale-[1.02]"
    };

    const sizes = {
        sm: "px-4 py-2 text-[8px] rounded-lg",
        md: "px-6 py-3 text-[10px] rounded-xl",
        lg: "px-10 py-4 text-[11px] rounded-2xl"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={isLoading || disabled}
            {...props}
        >

            {isLoading ? (
                <>
                    <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {loadingText && <span>{loadingText}</span>}
                </>
            ) : (
                <>
                    {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
                    <span>{children}</span>
                    {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
                </>
            )}
        </button>
    );
};

export default Button;
