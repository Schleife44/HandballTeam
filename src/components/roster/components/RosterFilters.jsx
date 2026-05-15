import React from 'react';

const RosterFilters = ({ filter, setFilter, corePlayers }) => {
  const filterOptions = [
    {id: 'all', label: 'Alle', count: corePlayers.length},
    {id: 'active', label: 'Aktiv', count: corePlayers.filter(p => !p.isInactive).length},
    {id: 'inactive', label: 'Inaktiv', count: corePlayers.filter(p => p.isInactive).length},
    {id: 'LA', label: 'LA', count: corePlayers.filter(p => !p.isInactive && (p.position === 'LA' || p.position2 === 'LA')).length},
    {id: 'RL', label: 'RL', count: corePlayers.filter(p => !p.isInactive && (p.position === 'RL' || p.position2 === 'RL')).length},
    {id: 'RM', label: 'RM', count: corePlayers.filter(p => !p.isInactive && (p.position === 'RM' || p.position2 === 'RM')).length},
    {id: 'RR', label: 'RR', count: corePlayers.filter(p => !p.isInactive && (p.position === 'RR' || p.position2 === 'RR')).length},
    {id: 'RA', label: 'RA', count: corePlayers.filter(p => !p.isInactive && (p.position === 'RA' || p.position2 === 'RA')).length},
    {id: 'KM', label: 'KM', count: corePlayers.filter(p => !p.isInactive && (p.position === 'KM' || p.position2 === 'KM')).length},
    {id: 'TW', label: 'TW', count: corePlayers.filter(p => !p.isInactive && (p.position === 'TW' || p.position2 === 'TW' || p.isGoalkeeper)).length},
    {id: 'AB', label: 'AB', count: corePlayers.filter(p => !p.isInactive && (p.position === 'AB' || p.position2 === 'AB')).length}
  ];

  return (
    <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar pb-2">
      {filterOptions.map(btn => (
        <button
          key={btn.id}
          onClick={() => setFilter(btn.id)}
          className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap
            ${filter === btn.id 
              ? 'bg-brand/10 border-brand/50 text-brand shadow-[0_0_15px_rgba(132,204,22,0.1)]' 
              : 'bg-zinc-950/40 border-white/5 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'}`}
        >
          {btn.label} <span className="ml-2 opacity-40 font-bold">{btn.count}</span>
        </button>
      ))}
    </div>
  );
};

export default RosterFilters;
