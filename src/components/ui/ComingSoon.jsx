import React from 'react';
import { motion } from 'framer-motion';
import { Layout, Construction, Zap, Timer } from 'lucide-react';

const ComingSoon = ({ moduleName = "Dieses Modul" }) => {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-[60vh] p-12 text-center overflow-hidden">
      {/* Animated Background Glow */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1] 
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        className="absolute w-[500px] h-[500px] bg-brand/20 rounded-full blur-[120px] -z-10"
      />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-8 max-w-2xl"
      >
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-brand/20 rounded-full blur-xl animate-pulse" />
            <div className="relative p-6 bg-zinc-900 border border-brand/30 rounded-[2.5rem] shadow-2xl">
              <Construction size={48} className="text-brand" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand/10 border border-brand/20 rounded-full">
            <Zap size={14} className="text-brand" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand">Migration in Progress</span>
          </div>
          
          <h2 className="text-5xl font-black italic uppercase tracking-tighter text-zinc-100 leading-none">
            Coming <span className="text-brand">Soon</span>
          </h2>
          
          <p className="text-zinc-500 font-medium text-lg">
            {moduleName} wird aktuell im Rahmen der <span className="text-zinc-300">React-Migration</span> neu aufgebaut und demnächst implementiert.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-8">
          <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-3xl backdrop-blur-sm">
            <div className="text-xl font-black text-zinc-100">85%</div>
            <div className="text-[8px] font-bold uppercase text-zinc-600 tracking-widest mt-1">Core Logic</div>
          </div>
          <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-3xl backdrop-blur-sm">
             <div className="text-xl font-black text-brand">V4</div>
             <div className="text-[8px] font-bold uppercase text-zinc-600 tracking-widest mt-1">UI Engine</div>
          </div>
          <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-3xl backdrop-blur-sm">
             <Timer size={20} className="mx-auto text-zinc-400" />
             <div className="text-[8px] font-bold uppercase text-zinc-600 tracking-widest mt-1">Standby</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ComingSoon;
