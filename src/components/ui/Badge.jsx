import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Standardized Badge Component for Sechsmeter
 */
const Badge = ({ 
  children, 
  variant = 'brand', 
  className,
  isPulse = false,
  ...props 
}) => {
  const baseStyles = "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border inline-flex items-center gap-1.5";
  
  const variants = {
    brand: "bg-brand/10 text-brand border-brand/20 shadow-[0_0_15px_rgba(132,204,22,0.1)]",
    zinc: "bg-zinc-900 text-zinc-500 border-zinc-800",
    white: "bg-zinc-100 text-black border-transparent",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    red: "bg-red-500/10 text-red-500 border-red-500/20",
    orange: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  };

  return (
    <span 
      className={twMerge(
        baseStyles, 
        variants[variant], 
        isPulse && "animate-pulse",
        className
      )}
      {...props}
    >
      {isPulse && (
        <span className={clsx(
          "w-1.5 h-1.5 rounded-full",
          variant === 'brand' ? "bg-brand" : "bg-current"
        )} />
      )}
      {children}
    </span>
  );
};

export default Badge;
