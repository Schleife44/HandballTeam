import React from 'react';
import { twMerge } from 'tailwind-merge';

/**
 * Standardized Input Component for Sechsmeter
 */
const Input = ({ 
  label,
  error,
  className,
  wrapperClassName,
  icon: Icon,
  ...props 
}) => {
  return (
    <div className={twMerge("flex flex-col gap-2", wrapperClassName)}>
      {label && (
        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] px-4">
          {label}
        </label>
      )}
      <div className="relative group">
        {Icon && (
          <Icon 
            size={18} 
            className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-brand transition-colors" 
          />
        )}
        <input 
          className={twMerge(
            "w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl px-6 py-4 text-sm font-black text-zinc-100 outline-none focus:border-brand/50 transition-all placeholder:text-zinc-700",
            Icon && "pl-14",
            error && "border-red-500/50 focus:border-red-500",
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest px-4">
          {error}
        </span>
      )}
    </div>
  );
};

export default Input;
