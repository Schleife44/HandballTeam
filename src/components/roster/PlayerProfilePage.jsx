import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';

// Hooks
import { usePlayerStats } from '../../hooks/usePlayerStats';
import useStore from '../../store/useStore';

// UI
import Button from '../ui/Button';

// Modular Components
import ProfileHeader from './components/ProfileHeader';
import ProfileStatsGrid from './components/ProfileStatsGrid';
import ProfileCharts from './components/ProfileCharts';

const PlayerProfilePage = () => {
  const { playerName } = useParams();
  const navigate = useNavigate();
  const { squad } = useStore();
  const [selectedSeason, setSelectedSeason] = useState('all');
  
  const teamColor = squad?.settings?.homeColor || '#84cc16';
  const player = (squad?.home || []).find(p => p.name === playerName) || { name: playerName, number: '?' };
  const stats = usePlayerStats(playerName, selectedSeason);

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-20 h-20 bg-zinc-800/50 rounded-full flex items-center justify-center mb-6">
          <Activity size={32} className="text-zinc-600" />
        </div>
        <h3 className="text-xl font-black text-white uppercase italic mb-2">Keine Daten verfügbar</h3>
        <p className="text-zinc-500 text-xs font-bold uppercase leading-relaxed max-w-sm">
          Für {playerName} wurden noch keine Spiele in der Historie aufgezeichnet.
        </p>
        <Button 
          onClick={() => navigate('/roster')}
          className="mt-8 px-8 py-4"
        >
          Zurück zum Kader
        </Button>
      </div>
    );
  }

  const linkedMember = (squad?.allMembers || []).find(m => m.playerName === playerName);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 max-w-[1400px] mx-auto">
      {/* HEADER SECTION */}
      <ProfileHeader 
        playerName={player.name}
        playerNumber={player.number}
        photoURL={linkedMember?.photoURL}
        teamColor={teamColor}
        selectedSeason={selectedSeason}
        setSelectedSeason={setSelectedSeason}
        availableSeasons={stats?.availableSeasons}
        onBack={() => navigate('/roster')}
      />

      {/* TOP STATS GRID */}
      <ProfileStatsGrid summary={stats.summary} />

      {/* CHARTS SECTION */}
      <ProfileCharts 
        timeline={stats.timeline} 
        teamColor={teamColor} 
        selectedSeason={selectedSeason} 
      />

      {/* FOOTER NOTE */}
      <div className="p-12 border-t border-zinc-800/50 mt-8">
        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest text-center">
          Die Daten basieren auf allen archivierten Spielen dieser Saison.
        </p>
      </div>
    </div>
  );
};

export default PlayerProfilePage;
