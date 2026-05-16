import React, { useState } from 'react';
import { Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePlayerStats } from '../../../hooks/usePlayerStats';

// Modular Components (Reused from Profile)
import ProfileHeader from '../components/ProfileHeader';
import ProfileStatsGrid from '../components/ProfileStatsGrid';
import ProfileCharts from '../components/ProfileCharts';

const PlayerStatsModal = ({ player, onClose, teamColor }) => {
  const [selectedSeason, setSelectedSeason] = useState('all');
  const stats = usePlayerStats(player.name, selectedSeason);

  if (!stats || (stats.summary.totalGames === 0 && selectedSeason === 'all')) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] flex items-center justify-center p-6" onClick={onClose}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-zinc-900 border border-zinc-800 p-12 rounded-[2.5rem] text-center max-w-md"
          onClick={e => e.stopPropagation()}
        >
          <div className="w-20 h-20 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Activity size={32} className="text-zinc-600" />
          </div>
          <h3 className="text-xl font-black text-white uppercase italic mb-2">Keine Daten verfügbar</h3>
          <p className="text-zinc-500 text-xs font-bold uppercase leading-relaxed">
            Für {player.name} wurden noch keine Spiele in der Historie aufgezeichnet.
          </p>
          <button 
            onClick={onClose}
            className="mt-8 px-8 py-4 bg-zinc-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-700 transition-all"
          >
            Schließen
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[110] flex items-center justify-center p-4 md:p-10" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-zinc-950 border border-white/5 w-full max-w-5xl h-full max-h-[850px] rounded-[3rem] overflow-hidden flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* SHARED HEADER */}
        <div className="p-8 border-b border-white/5 bg-zinc-900/30">
          <ProfileHeader 
            playerName={player.name}
            playerNumber={player.number}
            photoURL={player.photoURL}
            teamColor={teamColor}
            selectedSeason={selectedSeason}
            setSelectedSeason={setSelectedSeason}
            availableSeasons={stats?.availableSeasons}
            onClose={onClose}
          />
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
          <ProfileStatsGrid summary={stats.summary} />
          <ProfileCharts 
            timeline={stats.timeline} 
            teamColor={teamColor} 
            selectedSeason={selectedSeason} 
          />
        </div>

        {/* FOOTER */}
        <div className="p-8 border-t border-white/5 bg-zinc-900/20">
          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest text-center">
            Die Daten basieren auf allen archivierten Spielen dieser Saison.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default PlayerStatsModal;
