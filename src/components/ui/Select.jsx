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
            "w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl px-6 py-4 text-sm font-black text-zinc-100 outline-none focus:border-brand/50 transition-all appearance-none cursor-pointer",
            error && "border-red-500/50 focus:border-red-500",
            className
          )}
          style={props.value ? { fontFamily: props.value } : {}}
          {...props}
        >
          {children}
          {options.map((opt) => (
            <option 
              key={opt.value} 
              value={opt.value} 
              style={{ fontFamily: opt.value, backgroundColor: '#18181b', color: '#fff' }}
            >
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown 
          size={16} 
          className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-brand pointer-events-none transition-colors" 
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

export default Select;
