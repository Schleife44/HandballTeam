import React from 'react';
import { motion } from 'framer-motion';
import { User, Target, X } from 'lucide-react';

const SevenMeterShooterOverlay = ({ players, onSelect, onCancel }) => {
  return (
    <div className="fixed inset-0 z-[610] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-[3rem] p-8 shadow-3xl"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand/10 border border-brand/20 rounded-2xl flex items-center justify-center text-brand">
              <User size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black italic uppercase tracking-tighter text-zinc-100">Wer wirft den 7m?</h3>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Schützen auswählen</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-zinc-800 rounded-xl transition-colors text-zinc-500">
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {players.map((player) => (
            <button
              key={player.id}
              onClick={() => onSelect(player)}
              className="flex flex-col items-center gap-2 p-4 bg-zinc-800/50 border border-zinc-700/50 rounded-2xl hover:bg-brand/10 hover:border-brand/40 transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-black text-zinc-400 group-hover:bg-brand group-hover:text-black transition-colors">
                #{player.number}
              </div>
              <span className="text-[10px] font-bold text-zinc-100 truncate w-full text-center">
                {player.name.split(' ').pop()}
              </span>
            </button>
          ))}
        </div>

        <button 
          onClick={onCancel}
          className="w-full mt-8 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] hover:text-zinc-100 transition-colors"
        >
          Abbrechen
        </button>
      </motion.div>
    </div>
  );
};

export default SevenMeterShooterOverlay;
