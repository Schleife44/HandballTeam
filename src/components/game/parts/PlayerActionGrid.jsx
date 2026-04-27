import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowLeftRight, Sword, Shield } from 'lucide-react';
import useStore from '../../../store/useStore';

const PlayerActionGrid = ({ onPlayerSelect, lineup, activeSwap, mode }) => {
  const { squad } = useStore();
  const [searchQuery, setSearchQuery] = useState('');

  const getTeamColor = (team) => team === 'home' ? (squad.settings?.homeColor || '#84cc16') : (squad.settings?.awayColor || '#3f3f46');
  const getTeamName = (team) => team === 'home' ? (squad.settings?.homeName || 'Heim') : (squad.settings?.awayName || 'Gast');

  const renderTeamSection = (team) => {
    const teamColor = getTeamColor(team);
    const teamName = getTeamName(team);
    
    const allTeamPlayers = (squad[team] || []).filter(p => !p.isInactive && (
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.number.includes(searchQuery)
    ));

    const fieldPlayers = allTeamPlayers.filter(p => lineup[team]?.includes(p.id));
    const benchPlayers = allTeamPlayers.filter(p => !lineup[team]?.includes(p.id));

    const renderPlayerCard = (player, isField) => {
      const isSelectedForSwap = activeSwap && activeSwap.id === player.id;
      const isSimple = mode === 'SIMPLE';
      
      return (
        <motion.button
          key={player.id}
          layout
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onPlayerSelect({ ...player, team, teamColor })}
          className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all group relative overflow-hidden
            ${isField || isSimple ? 'bg-zinc-900/40 border-zinc-800' : 'bg-black/20 border-zinc-900/50 scale-95 opacity-80'}
            ${isSelectedForSwap ? 'border-brand ring-2 ring-brand/20 bg-brand/5' : 'hover:border-zinc-700'}`}
        >
          <div 
            className="absolute top-0 right-0 w-8 h-8 -mr-4 -mt-4 rounded-full blur-xl opacity-10 group-hover:opacity-30 transition-opacity"
            style={{ backgroundColor: teamColor }}
          />

          <div 
            className={`rounded-xl flex items-center justify-center font-black italic shadow-inner transition-all
              ${isField || isSimple ? 'w-10 h-10 text-md' : 'w-8 h-8 text-xs'}`}
            style={{ backgroundColor: `${teamColor}15`, color: teamColor, border: `1px solid ${teamColor}30` }}
          >
            {player.number}
          </div>
          
          <div className="text-center w-full">
            <p className={`font-black text-zinc-100 uppercase truncate px-1 ${isField || isSimple ? 'text-[9px]' : 'text-[7px]'}`}>
              {player.name || 'Spieler'}
            </p>
          </div>

          {activeSwap && isField && activeSwap.team === team && (
            <div className="absolute inset-0 bg-brand/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
              <ArrowLeftRight size={18} className="text-brand animate-pulse" />
            </div>
          )}
        </motion.button>
      );
    };

    return (
      <div className="flex-1 space-y-6">
        {/* Team Header */}
        <div className="flex items-center gap-3 px-4 py-2 bg-zinc-900/60 border border-zinc-800 rounded-2xl shadow-lg">
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${teamColor}15`, color: teamColor }}>
            {team === 'home' ? <Sword size={16} /> : <Shield size={16} />}
          </div>
          <h4 className="text-[10px] font-black uppercase italic tracking-tighter text-zinc-100 truncate">
            {teamName}
          </h4>
        </div>

        {mode === 'SIMPLE' ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            <AnimatePresence mode="popLayout">
              {allTeamPlayers.map(p => renderPlayerCard(p, true))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Field Players */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-2">
                <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Spielfeld</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                <AnimatePresence mode="popLayout">
                  {fieldPlayers.map(p => renderPlayerCard(p, true))}
                </AnimatePresence>
                {fieldPlayers.length === 0 && (
                  <div className="col-span-full py-4 border border-dashed border-zinc-800 rounded-xl flex items-center justify-center">
                    <p className="text-[8px] font-black text-zinc-700 uppercase">Leer</p>
                  </div>
                )}
              </div>
            </div>

            {/* Bench Players */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-2">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600">Bank</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 opacity-60">
                <AnimatePresence mode="popLayout">
                  {benchPlayers.map(p => renderPlayerCard(p, false))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Two Columns for Teams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {renderTeamSection('home')}
        
        {/* Divider for Visual Clarity on Desktop */}
        <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-zinc-800 to-transparent -translate-x-1/2 pointer-events-none" />
        
        {renderTeamSection('away')}
      </div>
    </div>
  );
};

export default PlayerActionGrid;
