import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Sword } from 'lucide-react';

const MatchScoreboard = ({ homeScore, awayScore, homeName, awayName, homeColor, awayColor, phase }) => {
  const getPhaseLabel = (phase) => {
    switch (phase) {
      case 'PRE_GAME': return 'Spielvorbereitung';
      case 'FIRST_HALF': return '1. Halbzeit';
      case 'HALF_TIME': return 'Halbzeitpause';
      case 'SECOND_HALF': return '2. Halbzeit';
      case 'ENDED': return 'Spiel Beendet';
      default: return 'Live';
    }
  };

  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
      {/* Background Decorative Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand/5 via-transparent to-zinc-900/50 opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
      
      <div className="relative flex items-center justify-between gap-8">
        {/* Home Team */}
        <div className="flex-1 flex flex-col items-end text-right">
          <div className="flex items-center gap-4 mb-2">
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-zinc-100">{homeName}</h3>
            <div className="p-3 rounded-2xl border" style={{ backgroundColor: `${homeColor}15`, borderColor: `${homeColor}30`, color: homeColor }}>
              <Sword size={24} />
            </div>
          </div>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Heim-Mannschaft</p>
        </div>

        {/* Score Display */}
        <div className="flex flex-col items-center gap-4 px-12 border-x border-zinc-800/50">
          <div className="px-4 py-1.5 bg-brand/10 border border-brand/20 rounded-full">
            <span className="text-[10px] font-black text-brand uppercase tracking-widest animate-pulse">
              {getPhaseLabel(phase)}
            </span>
          </div>
          
          <div className="flex items-center gap-6">
            <motion.span 
              key={`home-${homeScore}`}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-7xl font-black italic tracking-tighter text-zinc-100 tabular-nums"
            >
              {homeScore}
            </motion.span>
            <span className="text-4xl font-black text-zinc-700">:</span>
            <motion.span 
              key={`away-${awayScore}`}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-7xl font-black italic tracking-tighter text-zinc-100 tabular-nums"
            >
              {awayScore}
            </motion.span>
          </div>
        </div>

        {/* Away Team */}
        <div className="flex-1 flex flex-col items-start">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 rounded-2xl border" style={{ backgroundColor: `${awayColor}15`, borderColor: `${awayColor}30`, color: awayColor }}>
              <Shield size={24} />
            </div>
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-zinc-100">{awayName}</h3>
          </div>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Gast-Mannschaft</p>
        </div>
      </div>
    </div>
  );
};

export default MatchScoreboard;
