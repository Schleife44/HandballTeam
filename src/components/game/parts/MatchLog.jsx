import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Trophy, AlertTriangle, Zap } from 'lucide-react';

const MatchLog = ({ log }) => {
  const getActionIcon = (type) => {
    switch (type) {
      case 'GOAL': return <Trophy size={14} className="text-brand" />;
      case 'YELLOW': 
      case 'TWO_MIN':
      case 'RED': return <AlertTriangle size={14} className="text-orange-500" />;
      default: return <Zap size={14} className="text-zinc-500" />;
    }
  };

  const getActionLabel = (type) => {
    const labels = {
      GOAL: 'Tor',
      MISS: 'Fehlwurf',
      POST: 'Pfosten/Latte',
      SAVE: 'Gehalten',
      YELLOW: 'Gelbe Karte',
      TWO_MIN: '2 Minuten',
      RED: 'Rote Karte',
      ASSIST: 'Assist',
      STEAL: 'Steal',
      BLOCK: 'Block',
      FOUL: 'Techn. Fehler'
    };
    return labels[type] || type;
  };

  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8 backdrop-blur-xl h-full flex flex-col">
      <div className="flex items-center gap-3 mb-8 pb-4 border-b border-zinc-800">
        <Clock size={16} className="text-brand" />
        <h3 className="text-sm font-black uppercase italic text-zinc-100">Spiel-Protokoll</h3>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-3 no-scrollbar">
        <AnimatePresence initial={false}>
          {log.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 opacity-20">
              <Clock size={48} />
              <p className="text-[10px] font-black uppercase tracking-widest">Warten auf Anpfiff...</p>
            </div>
          ) : (
            log.map((entry, index) => (
              <motion.div
                key={entry.timestamp}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-4 p-4 bg-black/20 border border-zinc-800/50 rounded-2xl group hover:border-zinc-700 transition-all"
              >
                <span className="text-[10px] font-black text-zinc-500 tabular-nums w-12">{entry.time}</span>
                
                <div className="p-2 bg-zinc-800 rounded-lg">
                  {getActionIcon(entry.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-zinc-100 uppercase truncate">#{entry.playerNumber} {entry.playerName}</span>
                    <span className="text-[8px] font-black px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-500 uppercase tracking-widest">{entry.score}</span>
                  </div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">{getActionLabel(entry.type)}</p>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MatchLog;
