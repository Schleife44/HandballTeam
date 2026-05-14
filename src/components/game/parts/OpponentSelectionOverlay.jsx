import React from 'react';
import { motion } from 'framer-motion';
import { User, AlertTriangle, X } from 'lucide-react';
import Button from '../../ui/Button';

const OpponentSelectionOverlay = ({ players, title, subtitle, onSelect, onCancel }) => {
  return (
    <div className="fixed inset-0 z-[610] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-[3rem] p-8 shadow-3xl"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center text-orange-500">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black italic uppercase tracking-tighter text-zinc-100">{title}</h3>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">{subtitle}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onCancel} 
            className="p-2 hover:bg-zinc-800 rounded-xl transition-colors text-zinc-500"
          >
            <X size={20} />
          </Button>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {players.map((player) => (
            <button
              key={player.id}
              onClick={() => onSelect(player)}
              className="flex flex-col items-center gap-2 p-4 bg-zinc-800/50 border border-zinc-700/50 rounded-2xl hover:bg-orange-500/10 hover:border-orange-500/40 transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-black text-zinc-400 group-hover:bg-orange-500 group-hover:text-black transition-colors">
                #{player.number}
              </div>
              <span className="text-[10px] font-bold text-zinc-100 truncate w-full text-center">
                {player.name ? player.name.split(' ').pop() : 'Spieler'}
              </span>
            </button>
          ))}
        </div>

        <Button 
          variant="ghost"
          onClick={onCancel}
          className="w-full mt-8"
        >
          Abbrechen
        </Button>
      </motion.div>
    </div>
  );
};

export default OpponentSelectionOverlay;
