import React from 'react';
import { motion } from 'framer-motion';

export default function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action, 
  variant = 'default' // 'default' or 'glass'
}) {
  return (
    <div className={`w-full flex flex-col items-center justify-center p-8 lg:p-12 text-center rounded-[2rem] lg:rounded-[3rem] border transition-all
      ${variant === 'glass' ? 'bg-zinc-900/30 backdrop-blur-md border-zinc-800/40' : 'bg-black/40 border-zinc-900/50'}
    `}>
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="w-20 h-20 lg:w-24 lg:h-24 bg-brand/5 border border-brand/20 rounded-full flex items-center justify-center text-brand mb-6"
      >
        {Icon && <Icon size={40} strokeWidth={1.5} />}
      </motion.div>
      
      <motion.h3 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-2xl lg:text-3xl font-black text-white uppercase italic tracking-tighter mb-2"
      >
        {title}
      </motion.h3>
      
      <motion.p 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-xs lg:text-sm font-bold text-zinc-500 max-w-md mx-auto leading-relaxed uppercase tracking-widest"
      >
        {description}
      </motion.p>

      {action && (
        <motion.div 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 w-full max-w-sm mx-auto"
        >
          {action}
        </motion.div>
      )}
    </div>
  );
}
