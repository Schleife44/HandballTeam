import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowLeftRight, Sword, Shield, AlertCircle, UserPlus } from 'lucide-react';
import useStore from '../../../store/useStore';

const PlayerActionGrid = ({ onPlayerSelect, lineup, activeSwap, mode, suspensions, activeMatch, onAddPlayer }) => {
  const { squad } = useStore();
  const [searchQuery, setSearchQuery] = useState('');

  const isNeutral = !!activeMatch?.customHomeName;

  const getTeamColor = (team) => {
    if (team === 'home') return activeMatch?.customHomeName ? '#6366f1' : (squad.settings?.homeColor || '#84cc16');
    return activeMatch?.customAwayName ? '#f43f5e' : (squad.settings?.awayColor || '#3f3f46');
  };

  const getTeamName = (team) => {
    if (team === 'home') return activeMatch?.customHomeName || squad.settings?.homeName || 'Heim';
    return activeMatch?.customAwayName || squad.settings?.awayName || 'Gast';
  };

  const renderTeamSection = (team) => {
    const teamColor = getTeamColor(team);
    const teamName = getTeamName(team);
    
    // In Neutral Mode, don't show the own team's roster
    const isNeutralTeam = (team === 'home' && activeMatch?.customHomeName) || (team === 'away' && activeMatch?.customAwayName);
    
    let allTeamPlayers = (squad[team] || []).filter(p => !p.isInactive && (
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.number.includes(searchQuery)
    ));

    // In Neutral mode, we hide the permanent roster but show guests, quick-adds and synced opponents
    if (isNeutralTeam) {
      allTeamPlayers = allTeamPlayers.filter(p => 
        p.isTemporary || 
        p.isGuest || 
        p.id?.startsWith('quick_') || 
        p.id?.startsWith('opp_') || 
        p.id?.startsWith('guest_')
      );
    } else if (team === 'home') {
      // In Normal mode for HOME team, show regular roster + session-only players added THIS session
      allTeamPlayers = allTeamPlayers.filter(p => 
        !p.id?.startsWith('opp_') && // Never show opponents in home
        (!p.id?.startsWith('quick_') || p.isTemporary) && // Only show quick-adds if they are marked temporary (fresh)
        (!p.id?.startsWith('guest_') || p.isTemporary)    // Only show guests if they are marked temporary (fresh)
      );
    }

    allTeamPlayers.sort((a, b) => {
      const numA = parseInt(a.number) || 0;
      const numB = parseInt(b.number) || 0;
      return numA - numB;
    });

    const fieldPlayers = allTeamPlayers.filter(p => lineup[team]?.includes(p.id));
    const benchPlayers = allTeamPlayers.filter(p => !lineup[team]?.includes(p.id));

    const renderPlayerCard = (player, isField) => {
      const isSelectedForSwap = activeSwap && activeSwap.id === player.id;
      const isActiveGoalkeeper = activeMatch?.activeGoalkeeperId === player.id;
      const isGoalkeeper = player.position === 'TW' || player.isGoalkeeper === true;
      const isSimple = mode === 'SIMPLE';
      const suspension = suspensions?.find(s => s.playerId === player.id);

      const formatSuspensionTime = (sec) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
      };
      
      return (
        <motion.button
          key={player.id}
          layout
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            e.stopPropagation();
            onPlayerSelect({ ...player, team, teamColor });
          }}
          className={`flex flex-col items-center justify-center p-1.5 rounded-2xl border transition-all group relative overflow-hidden pointer-events-auto
            ${isField || isSimple ? 'bg-zinc-900/40 border-zinc-800 w-16 h-16 lg:w-auto lg:h-auto lg:p-4' : 'bg-black/20 border-zinc-900/50 scale-95 opacity-80 w-14 h-14 lg:w-auto lg:h-auto lg:p-4'}
            ${isSelectedForSwap ? 'border-brand ring-2 ring-brand/20 bg-brand/5' : 'hover:border-zinc-700'}
            ${suspension ? 'border-orange-500 bg-orange-500/10 shadow-[0_0_15px_rgba(249,115,22,0.4)]' : ''}`}
        >
          {isGoalkeeper && (
            <div className="absolute top-1 left-1 lg:top-2 lg:left-2 flex items-center gap-1 z-10">
              <span className={`text-[6px] lg:text-[8px] font-black px-1.5 py-0.5 rounded-md transition-all ${isActiveGoalkeeper ? 'bg-brand text-black shadow-[0_0_12px_#84cc16] scale-110 font-black' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'}`}>
                TW
              </span>
            </div>
          )}
          {suspension && (
            <div className="absolute top-1 right-1 lg:top-2 lg:right-2 flex flex-col items-end z-10">
              <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
              <span className="text-[6px] lg:text-[8px] font-black text-orange-500 mt-0.5">{formatSuspensionTime(suspension.remainingSeconds)}</span>
            </div>
          )}
          <div 
            className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity"
            style={{ 
              background: `radial-gradient(circle at top right, ${teamColor}, transparent)` 
            }}
          />

          <div 
            className={`flex items-center justify-center font-black italic tracking-tighter transition-all
              ${isField || isSimple ? 'w-full text-lg lg:text-md' : 'w-full text-base lg:text-xs opacity-60'}`}
            style={{ color: teamColor }}
          >
            {player.number}
          </div>
          
          <div className="text-center w-full truncate mt-auto">
            <p className={`font-black text-zinc-100 uppercase tracking-tighter truncate px-0.5 ${isField || isSimple ? 'text-[6px] lg:text-[8px]' : 'text-[5px] opacity-40'}`}>
              {player.name || 'P'}
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
        <div className="flex items-center gap-2 lg:gap-3 px-2 lg:px-4 py-1 lg:py-2 bg-zinc-900/30 border border-zinc-800/50 rounded-lg lg:rounded-2xl shadow-sm">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: teamColor, boxShadow: `0 0 10px ${teamColor}` }} />
          <h4 className="text-[7px] lg:text-[10px] font-black uppercase italic tracking-widest text-zinc-400 truncate">
            {teamName}
          </h4>
        </div>

        {mode === 'SIMPLE' ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-1.5">
            <AnimatePresence mode="popLayout">
              {allTeamPlayers.map(p => renderPlayerCard(p, true))}

              {/* Add Player Card */}
              <motion.button
                key={`add_${team}`}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onAddPlayer(team)}
                className="flex flex-col items-center justify-center p-1.5 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/10 hover:bg-zinc-800/50 hover:border-zinc-600 transition-all w-16 h-16 lg:w-auto lg:h-auto lg:p-4 group relative"
              >
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                <UserPlus size={20} className="text-zinc-600 group-hover:text-zinc-400 group-hover:scale-110 transition-all relative z-10" />
                <span className="text-[6px] lg:text-[8px] font-black text-zinc-700 group-hover:text-zinc-500 uppercase tracking-widest mt-1 relative z-10">Hinzufügen</span>
              </motion.button>
            </AnimatePresence>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Field Players */}
            <div className="space-y-1">
              <div className="flex items-center gap-1 px-0.5 lg:px-2">
                <div className="w-1 h-1 rounded-full bg-brand animate-pulse" />
                <span className="text-[6px] lg:text-[8px] font-black uppercase tracking-widest text-zinc-500">Feld</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-1.5">
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
            <div className="space-y-1">
              <div className="flex items-center gap-1 px-0.5 lg:px-2">
                <div className="w-1 h-1 rounded-full bg-zinc-700" />
                <span className="text-[6px] lg:text-[8px] font-black uppercase tracking-widest text-zinc-600">Bank</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-1.5 opacity-60">
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
    <div className="space-y-4 lg:space-y-8">
      {/* Search - Hidden on Mobile to save space */}
      <div className="hidden lg:flex items-center gap-4 bg-black/40 border border-zinc-800 rounded-3xl px-6 py-4 focus-within:border-brand transition-all">
        <Search size={20} className="text-zinc-500" />
        <input 
          type="text" 
          placeholder="Spieler suchen..." 
          className="bg-transparent border-none outline-none text-zinc-100 text-sm font-bold w-full"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Two Columns for Teams - 2 cols on mobile, 2 cols on desktop with more gap */}
      <div className="grid grid-cols-2 lg:grid-cols-2 gap-2 lg:gap-12 relative">
        {renderTeamSection('home')}
        
        {/* Divider for Visual Clarity on Desktop */}
        <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-zinc-800 to-transparent -translate-x-1/2 pointer-events-none" />
        
        {renderTeamSection('away')}
      </div>
    </div>
  );
};

export default PlayerActionGrid;
