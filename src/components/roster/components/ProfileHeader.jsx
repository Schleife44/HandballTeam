import React from 'react';
import { ChevronLeft, X } from 'lucide-react';

const ProfileHeader = ({ 
  playerName, 
  playerNumber, 
  photoURL, 
  teamColor, 
  selectedSeason, 
  setSelectedSeason, 
  availableSeasons, 
  onBack,
  onClose,
  backLabel = "Zurück"
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        {onBack && (
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors group"
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-black uppercase tracking-widest">{backLabel}</span>
          </button>
        )}
        {onClose && (
          <button 
            onClick={onClose}
            className="p-3 hover:bg-zinc-800 rounded-2xl transition-all text-zinc-400 ml-auto"
          >
            <X size={24} />
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div 
            className="w-20 h-20 rounded-[2rem] flex items-center justify-center text-3xl font-black italic shadow-2xl overflow-hidden flex-shrink-0"
            style={{ backgroundColor: `${teamColor}20`, color: teamColor, border: `1px solid ${teamColor}40` }}
          >
            {photoURL ? (
              <img src={photoURL} alt={playerName} className="w-full h-full object-cover" />
            ) : (
              playerNumber
            )}
          </div>
          <div>
            <h1 className="text-4xl font-black text-white uppercase italic leading-none">{playerName}</h1>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] mt-3">Spieler-Performance-Analyse</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-zinc-900/50 p-1.5 rounded-[1.25rem] border border-zinc-800/50 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedSeason('all')}
            className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap
              ${selectedSeason === 'all' 
                ? 'bg-zinc-800 text-white shadow-lg shadow-black/20' 
                : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Alle Saisons
          </button>
          {availableSeasons?.map(season => (
            <button
              key={season}
              onClick={() => setSelectedSeason(season)}
              className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap
                ${selectedSeason === season 
                  ? 'bg-zinc-800 text-white shadow-lg shadow-black/20' 
                  : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Saison {season}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
