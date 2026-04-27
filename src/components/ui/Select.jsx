import React from 'react';
import { twMerge } from 'tailwind-merge';
import { ChevronDown } from 'lucide-react';

/**
 * Standardized Select Component for Sechsmeter
 */
const Select = ({ 
  label,
  error,
  options = [],
  children,
  className,
  wrapperClassName,
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
        <select 
          className={twMerge(
            "w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none focus:border-brand/50 transition-all cursor-pointer",
            error && "border-red-500/50 focus:border-red-500",
            className
          )}
          {...props}
        >
          {children}
          {options.map((opt) => (
            <option 
              key={opt.value} 
              value={opt.value} 
              className="bg-zinc-900 text-white"
            >
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest px-4">
          {error}
        </span>
      )}
    </div>
  );
};

export default Select;
