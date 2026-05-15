import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Button from '../../ui/Button';
import HeatmapView from './HeatmapView';
import PlayerStatsView from './PlayerStatsView';

const MatchAnalysis = ({ match, onBack }) => {
  const [tab, setTab] = useState('heatmap');
  
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
      <header className="flex items-center gap-6">
        <Button variant="ghost" size="icon" icon={ArrowLeft} onClick={onBack} />
        <div>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-zinc-100">vs. {match.opponent}</h2>
          <p className="text-[10px] font-black text-brand uppercase tracking-widest mt-1">Spiel-Analyse vom {match.dateStr}</p>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="flex p-1 bg-zinc-900/50 border border-zinc-800 rounded-2xl w-fit">
        {['heatmap', 'players', 'timeline'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
              ${tab === t ? 'bg-brand text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            {t === 'heatmap' ? 'Heatmap' : t === 'players' ? 'Spieler' : 'Verlauf'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'heatmap' && <HeatmapView key="heatmap" stats={match.stats} />}
        {tab === 'players' && <PlayerStatsView key="players" stats={match.stats.playerStats} />}
      </AnimatePresence>
    </div>
  );
};

export default MatchAnalysis;
