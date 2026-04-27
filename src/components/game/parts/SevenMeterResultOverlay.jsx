import React from 'react';
import { motion } from 'framer-motion';
import { Target, Shield, X, Trophy } from 'lucide-react';

const SevenMeterResultOverlay = ({ shooter, onResult, onCancel }) => {
  const options = [
    { id: '7M_GOAL', label: '7m Tor', icon: <Trophy size={20} />, color: 'bg-brand text-black shadow-brand/20' },
    { id: '7M_SAVE', label: 'Gehalten', icon: <Shield size={20} />, color: 'bg-zinc-800 text-zinc-300' },
    { id: '7M_MISS', label: 'Fehlwurf', icon: <X size={20} />, color: 'bg-zinc-800 text-zinc-300' },
  ];

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand/10 border border-brand/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-brand">
            <Target size={32} />
          </div>
          <h3 className="text-xl font-black italic uppercase tracking-tighter text-zinc-100">7m Ergebnis</h3>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">
            Schütze: #{shooter.number} {shooter.name}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => onResult(opt.id)}
              className={`flex items-center justify-between p-5 rounded-2xl transition-all active:scale-95 ${opt.color}`}
            >
              <div className="flex items-center gap-4">
                {opt.icon}
                <span className="text-xs font-black uppercase tracking-widest">{opt.label}</span>
              </div>
            </button>
          ))}
        </div>

        <button 
          onClick={onCancel}
          className="w-full mt-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] hover:text-zinc-100 transition-colors"
        >
          Abbrechen
        </button>
      </motion.div>
    </div>
  );
};

export default SevenMeterResultOverlay;
