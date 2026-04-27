import React from 'react';

const SeasonSelector = ({ seasons, selectedSeason, onSelect }) => {
  return (
    <div className="flex items-center gap-2 p-1 bg-zinc-900/50 border border-zinc-800 rounded-2xl w-fit overflow-x-auto no-scrollbar">
      {seasons.map(season => (
        <button
          key={season}
          onClick={() => onSelect(season)}
          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
            ${selectedSeason === season 
              ? 'bg-zinc-800 text-white shadow-lg ring-1 ring-white/5' 
              : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Saison {season}
        </button>
      ))}
    </div>
  );
};

export default SeasonSelector;
