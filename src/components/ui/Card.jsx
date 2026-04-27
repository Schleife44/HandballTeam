import React from 'react';
import { twMerge } from 'tailwind-merge';

/**
 * Standardized Card Component for Sechsmeter
 */
const Card = ({ 
  children, 
  className,
  variant = 'glass',
  noPadding = false,
  ...props 
}) => {
  const baseStyles = "rounded-[2.5rem] border transition-all duration-300";
  
  const variants = {
    glass: "bg-zinc-900/40 border-zinc-800 backdrop-blur-xl",
    solid: "bg-zinc-950 border-zinc-900",
    gradient: "bg-gradient-to-br from-zinc-900 to-black border-white/5 shadow-2xl",
    brand: "bg-brand/5 border-brand/20 shadow-[0_0_50px_rgba(132,204,22,0.05)]",
  };

  return (
    <div 
      className={twMerge(
        baseStyles, 
        variants[variant], 
        !noPadding && "p-8",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
