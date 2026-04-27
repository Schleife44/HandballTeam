import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Standardized Button Component for Sechsmeter
 */
const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className, 
  icon: Icon,
  isLoading = false,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center gap-2 font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-brand text-black shadow-[0_0_20px_rgba(132,204,22,0.15)] hover:shadow-[0_0_40px_rgba(132,204,22,0.4)] hover:scale-[1.03] hover:-translate-y-0.5",
    brand: "bg-brand text-black shadow-[0_0_20px_rgba(132,204,22,0.15)] hover:shadow-[0_0_40px_rgba(132,204,22,0.4)] hover:scale-[1.03] hover:-translate-y-0.5",
    secondary: "bg-zinc-100 text-black hover:bg-white hover:scale-[1.03] hover:-translate-y-0.5 shadow-lg",
    outline: "bg-transparent border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-500 hover:bg-white/5 hover:scale-[1.03]",
    ghost: "bg-transparent text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800/50 hover:scale-[1.05]",
    danger: "bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-600 hover:text-white hover:scale-[1.03] shadow-[0_0_30px_rgba(239,68,68,0.2)]",
    brandGhost: "bg-brand/10 border border-brand/20 text-brand hover:bg-brand hover:text-black hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(132,204,22,0.3)]",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-[9px] rounded-lg",
    md: "px-6 py-3 text-[10px] rounded-xl",
    lg: "px-8 py-4 text-xs rounded-2xl",
    xl: "px-10 py-5 text-sm rounded-[1.5rem]",
    icon: "p-2.5 rounded-xl",
  };

  return (
    <button 
      className={twMerge(baseStyles, variants[variant], sizes[size], className)}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : Icon && <Icon size={size === 'sm' ? 14 : 18} strokeWidth={3} />}
      {children}
    </button>
  );
};

export default Button;
