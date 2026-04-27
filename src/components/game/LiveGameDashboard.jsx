import React, { useState, useEffect } from 'react';
import MatchScoreboard from './parts/MatchScoreboard';
import MatchTimer from './parts/MatchTimer';
import PlayerActionGrid from './parts/PlayerActionGrid';
import ActionOverlay from './parts/ActionOverlay';
import MatchLog from './parts/MatchLog';
import ShotDetailsModal from './parts/ShotDetailsModal';
import SevenMeterResultOverlay from './parts/SevenMeterResultOverlay';
import SevenMeterShooterOverlay from './parts/SevenMeterShooterOverlay';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Zap, Layers, ChevronRight, X, UserPlus, Shield } from 'lucide-react';

// Store
import useStore from '../../store/useStore';

// UI
import Button from '../ui/Button';
import Card from '../ui/Card';

const LiveGameDashboard = () => {
  const { 
    squad, 
    activeMatch, 
    initMatch, 
    updateMatchScore, 
    updateMatchLineup, 
    addMatchSuspension, 
    updateMatchSuspensions,
    addToMatchLog,
    toggleEmptyGoal
  } = useStore();

  const { settings: squadSettings, home, away } = squad;
  
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [activeShotAction, setActiveShotAction] = useState(null);
  const [swapPending, setSwapPending] = useState(null);
  const [sevenMeterFlow, setSevenMeterFlow] = useState(null); // { earner, shooter, step: 'shooter' | 'result' }


  const formatTime = (totalMs) => {
    const totalSeconds = Math.floor(totalMs / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAction = (actionId, extraData = null) => {
    const playerToUse = selectedPlayer || (activeShotAction?.player) || (sevenMeterFlow?.shooter);
    if (!playerToUse) return;

    // Start 7m Flow
    if (actionId === 'GET_7M' || actionId === 'GET_7M_2MIN') {
      // 1. Log the earner
      const earnerLog = {
        timestamp: Math.floor(Date.now() / 1000),
        time: formatTime(activeMatch.timer.elapsedMs),
        matchTimeMs: activeMatch.timer.elapsedMs,
        type: actionId,
        playerNumber: playerToUse.number,
        playerName: playerToUse.name,
        team: playerToUse.team,
        score: `${activeMatch.score.home}:${activeMatch.score.away}`
      };
      addToMatchLog(earnerLog);

      // 2. Start shooter selection
      setSevenMeterFlow({ earner: playerToUse, step: 'shooter' });
      setSelectedPlayer(null);
      return;
    }

    const shotActions = ['GOAL', 'MISS', 'BLOCKED', 'SAVE', '7M_GOAL', '7M_SAVE', '7M_MISS'];
    if (shotActions.includes(actionId) && !extraData) {
      setActiveShotAction({ player: playerToUse, actionId });
      setSelectedPlayer(null);
      setSevenMeterFlow(null); // Reset flow
      return;
    }

    const getActionLabel = (id) => {
      switch(id) {
        case 'GOAL': return 'Tor';
        case 'MISS': return 'Fehlwurf';
        case 'SAVE': return 'Gehalten';
        case 'BLOCKED': return 'Block';
        case '7M_GOAL': return '7m Tor';
        case '7M_SAVE': return '7m Gehalten';
        case '7M_MISS': return '7m Fehlwurf';
        case 'TWO_MIN': return '2 Minuten';
        case 'YELLOW': return 'Gelbe Karte';
        case 'RED': return 'Rote Karte';
        case 'BLUE': return 'Blaue Karte';
        case 'GET_7M': return '7m rausgeholt';
        case 'GET_7M_2MIN': return '7m + 2min rausgeholt';
        default: return id;
      }
    };

    const isHomePlayer = home?.some(p => p.id === playerToUse.id);
    const finalIsHome = isHomePlayer;

    let newScore = { ...activeMatch.score };

    const newLogEntry = {
      timestamp: Math.floor(Date.now() / 1000), // Unix timestamp in seconds (Handball.net style)
      time: formatTime(activeMatch.timer.elapsedMs),
      matchTimeMs: activeMatch.timer.elapsedMs, // Internal high-resolution time
      type: actionId,
      isOpponent: !finalIsHome,
      playerId: playerToUse.id,
      playerNumber: playerToUse.number,
      playerName: playerToUse.name,
      team: finalIsHome ? 'home' : 'away',
      action: getActionLabel(actionId), // Human readable for stats/legacy
      score: `${newScore.home}:${newScore.away}`,
      details: actionId.startsWith('7M') ? {
        ...extraData,
        fieldPos: { x: 50, y: 35 } // Force precise coordinates for 7m heatmap
      } : extraData,
      isEmptyGoal: activeMatch.isEmptyGoal && !finalIsHome
    };

    if (actionId === 'GOAL' || actionId === '7M_GOAL') {
      if (finalIsHome) newScore.home += 1;
      else newScore.away += 1;
      newLogEntry.score = `${newScore.home}:${newScore.away}`;
      updateMatchScore(newScore.home, newScore.away);
    }

    if (actionId === 'TWO_MIN') {
      addMatchSuspension({
        playerId: playerToUse.id,
        team: playerToUse.team,
        remainingSeconds: 120,
        playerNumber: playerToUse.number,
        playerName: playerToUse.name
      });
    }

    // Auto-remove from lineup for RED/BLUE/TWO_MIN
    if (actionId === 'RED' || actionId === 'BLUE' || actionId === 'TWO_MIN') {
      const currentLineup = activeMatch.lineup[playerToUse.team] || [];
      const newLineup = currentLineup.filter(id => id !== playerToUse.id);
      updateMatchLineup(playerToUse.team, newLineup);
    }

    addToMatchLog(newLogEntry);
    setSelectedPlayer(null);
    setActiveShotAction(null);
    setSevenMeterFlow(null);
  };

  const handlePlayerClick = (player) => {
    // 7m Flow: Shooter selection
    if (sevenMeterFlow?.step === 'shooter') {
      if (player.team !== sevenMeterFlow.earner.team) return; // Must be same team
      setSevenMeterFlow({ ...sevenMeterFlow, shooter: player, step: 'result' });
      return;
    }

    if (activeMatch.mode === 'SIMPLE') {
      setSelectedPlayer(player);
      return;
    }
    if (swapPending && swapPending.team === player.team) {
      const isFieldPlayer = activeMatch.lineup[player.team].includes(player.id);
      if (swapPending.isBench && isFieldPlayer) {
        const newLineup = [...activeMatch.lineup[player.team]].filter(id => id !== player.id);
        newLineup.push(swapPending.id);
        updateMatchLineup(player.team, newLineup);
        setSwapPending(null);
        return;
      }
    }
    const isFieldPlayer = activeMatch.lineup[player.team].includes(player.id);
    if (isFieldPlayer) setSelectedPlayer(player);
    else setSwapPending({ ...player, isBench: true });
  };

  if (!activeMatch || !activeMatch.mode) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 lg:p-6 space-y-12 lg:space-y-16 animate-in fade-in zoom-in-95 duration-700">
        <div className="text-center space-y-4">
          <h2 className="text-4xl lg:text-6xl font-black tracking-tighter uppercase italic text-zinc-100">Spielmodus wählen</h2>
          <p className="text-zinc-500 text-xs lg:text-sm font-black uppercase tracking-[0.4em] opacity-50">Wie möchtest du das Spiel erfassen?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10 w-full max-w-5xl">
          {/* EINFACH MODE */}
          <button 
            onClick={() => initMatch('SIMPLE')} 
            className="group relative h-[300px] lg:h-[350px] bg-gradient-to-br from-brand/20 to-transparent border border-brand/20 rounded-[2.5rem] lg:rounded-[3.5rem] text-left p-8 lg:p-12 overflow-hidden transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-brand/10"
          >
            <motion.div 
              initial={{ x: 60, y: 60, scale: 0.8, opacity: 0, rotate: 20 }}
              animate={{ x: 0, y: 0, scale: 1, opacity: 1, rotate: 12 }}
              transition={{ type: "spring", damping: 20, stiffness: 200 }}
              className="absolute -right-10 -bottom-10 text-brand/5 group-hover:text-brand/10 transition-all group-hover:rotate-6 group-hover:scale-110 duration-700 pointer-events-none"
            >
              <Zap size={280} fill="currentColor" />
            </motion.div>
            
            <div className="relative z-10 h-full flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <span className="w-2.5 h-2.5 rounded-full bg-brand animate-pulse shadow-[0_0_10px_rgba(132,204,22,0.5)]" />
                <span className="text-[10px] font-black uppercase text-brand tracking-[0.2em]">Ready for Action</span>
              </div>
              
              <h3 className="text-3xl lg:text-4xl font-black text-white uppercase italic mb-4 leading-none">Einfach</h3>
              <p className="text-sm font-bold text-zinc-500 uppercase leading-relaxed max-w-[240px] opacity-80 group-hover:opacity-100 transition-opacity">
                Direkte Erfassung ohne Bank-Management. Ideal für schnelles Tippen am Spielfeldrand.
              </p>

              <div className="mt-auto">
                <div className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand text-black rounded-full text-[10px] font-black uppercase tracking-widest group-hover:scale-105 transition-all shadow-lg shadow-brand/20">
                  Auswählen <ChevronRight size={14} />
                </div>
              </div>
            </div>
          </button>

          {/* KOMPLEX MODE */}
          <button 
            onClick={() => initMatch('COMPLEX')} 
            className="group relative h-[300px] lg:h-[350px] bg-gradient-to-br from-zinc-100/10 to-transparent border border-zinc-100/10 rounded-[2.5rem] lg:rounded-[3.5rem] text-left p-8 lg:p-12 overflow-hidden transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-white/5"
          >
            <motion.div 
              initial={{ x: 60, y: 60, scale: 0.8, opacity: 0, rotate: 20 }}
              animate={{ x: 0, y: 0, scale: 1, opacity: 1, rotate: 12 }}
              transition={{ type: "spring", damping: 20, stiffness: 200, delay: 0.05 }}
              className="absolute -right-10 -bottom-10 text-zinc-100/5 group-hover:text-zinc-100/10 transition-all group-hover:rotate-6 group-hover:scale-110 duration-700 pointer-events-none"
            >
              <Shield size={280} fill="currentColor" />
            </motion.div>
            
            <div className="relative z-10 h-full flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-400 animate-pulse" />
                <span className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">Expert Mode</span>
              </div>
              
              <h3 className="text-3xl lg:text-4xl font-black text-zinc-100 uppercase italic mb-4 leading-none">Komplex</h3>
              <p className="text-sm font-bold text-zinc-500 uppercase leading-relaxed max-w-[240px] opacity-80 group-hover:opacity-100 transition-opacity">
                Mit Aufstellung, Bank und Einsatzzeiten. Volle taktische Kontrolle für tiefe Analysen.
              </p>

              <div className="mt-auto">
                <div className="inline-flex items-center gap-2 px-6 py-2.5 bg-zinc-100 text-black rounded-full text-[10px] font-black uppercase tracking-widest group-hover:scale-105 transition-all shadow-lg shadow-white/10">
                  Auswählen <ChevronRight size={14} />
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:gap-8 min-h-full pb-32 lg:pb-20 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 items-start">
        <div className="lg:col-span-8">
          <MatchScoreboard 
            homeScore={activeMatch.score.home} 
            awayScore={activeMatch.score.away} 
            homeName={squadSettings?.homeName || 'Heim'} 
            awayName={squadSettings?.awayName || 'Gegner'} 
            homeColor={squadSettings?.homeColor || '#84cc16'} 
            awayColor={squadSettings?.awayColor || '#3f3f46'} 
            phase={activeMatch.timer?.phase} 
          />
        </div>
        <div className="lg:col-span-4">
          <MatchTimer />
        </div>
      </div>

      <AnimatePresence>
        {activeMatch.suspensions.length > 0 && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="flex flex-wrap gap-2 lg:gap-3 overflow-hidden">
            {activeMatch.suspensions.map(s => (
              <div key={`${s.team}-${s.playerId}`} className="flex items-center gap-2 lg:gap-3 px-3 py-2 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                <AlertCircle size={12} lg:size={14} className="text-orange-500" />
                <span className="text-[9px] lg:text-[10px] font-black text-orange-500 uppercase">#{s.playerNumber} {s.playerName}</span>
                <span className="text-[9px] lg:text-[10px] font-black text-zinc-100 tabular-nums">{formatTime(s.remainingSeconds * 1000)}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 2xl:grid-cols-12 gap-6 lg:gap-8 items-start">
        <div className="2xl:col-span-9">
          <Card className="p-4 lg:p-8 relative overflow-hidden">
            <div className="relative z-10">
              {activeMatch.mode === 'COMPLEX' && (
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-all ${activeMatch.isEmptyGoal ? 'bg-red-500' : 'bg-zinc-800'}`} onClick={() => toggleEmptyGoal()}>
                      <div className={`w-4 h-4 bg-white rounded-full transition-all ${activeMatch.isEmptyGoal ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase text-zinc-100 tracking-wider">Leeres Tor</span>
                      <span className="text-[8px] font-bold text-zinc-500 uppercase">7. Feldspieler aktiv</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {sevenMeterFlow?.step === 'shooter' && (
                      <div className="flex items-center gap-3 px-4 py-2 bg-brand/20 border border-brand/40 rounded-2xl animate-pulse shadow-[0_0_15px_rgba(132,204,22,0.2)]">
                        <Target size={14} className="text-brand" />
                        <span className="text-[10px] font-black text-brand uppercase tracking-widest">7m Schützen wählen...</span>
                        <button onClick={() => setSevenMeterFlow(null)} className="text-zinc-500 hover:text-white ml-2"><X size={14} /></button>
                      </div>
                    )}

                    {swapPending && !sevenMeterFlow && (
                      <div className="flex items-center gap-3 px-4 py-2 bg-brand/10 border border-brand/20 rounded-2xl animate-pulse">
                        <UserPlus size={14} className="text-brand" />
                        <span className="text-[10px] font-black text-brand uppercase tracking-widest">#{swapPending.number} einwechseln...</span>
                        <button onClick={() => setSwapPending(null)} className="text-zinc-500 hover:text-white ml-2"><X size={14} /></button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeMatch.mode === 'SIMPLE' && swapPending && (
                <div className="flex items-center justify-between mb-6 px-4 py-2 bg-brand/10 border border-brand/20 rounded-2xl animate-pulse">
                  <div className="flex items-center gap-3">
                    <UserPlus size={14} className="text-brand" />
                    <span className="text-[10px] font-black text-brand uppercase tracking-widest">#{swapPending.number} wählen...</span>
                  </div>
                  <button onClick={() => setSwapPending(null)} className="text-zinc-500 hover:text-white"><X size={14} /></button>
                </div>
              )}

              <PlayerActionGrid 
                onPlayerSelect={handlePlayerClick} 
                lineup={activeMatch.lineup} 
                activeSwap={swapPending} 
                mode={activeMatch.mode} 
              />
            </div>
          </Card>
        </div>
        <div className="2xl:col-span-3 h-[400px] lg:h-[700px]"><MatchLog log={activeMatch.gameLog} /></div>
      </div>

      <AnimatePresence>
        {selectedPlayer && (
          <ActionOverlay player={selectedPlayer} onClose={() => setSelectedPlayer(null)} onAction={handleAction} />
        )}
        {sevenMeterFlow?.step === 'shooter' && (
          <SevenMeterShooterOverlay 
            players={squad[sevenMeterFlow.earner.team] || []}
            onSelect={(player) => setSevenMeterFlow({ ...sevenMeterFlow, shooter: player, step: 'result' })}
            onCancel={() => setSevenMeterFlow(null)}
          />
        )}
        {sevenMeterFlow?.step === 'result' && (
          <SevenMeterResultOverlay 
            shooter={sevenMeterFlow.shooter} 
            onResult={(res) => handleAction(res)}
            onCancel={() => setSevenMeterFlow(null)}
          />
        )}
        {activeShotAction && (
          <ShotDetailsModal 
            player={activeShotAction.player} 
            action={activeShotAction.actionId} 
            squad={squad}
            onSave={(data) => handleAction(activeShotAction.actionId, data)}
            onCancel={() => setActiveShotAction(null)}
            isZoneMode={squadSettings.isZoneMode}
            isSevenMeter={activeShotAction.actionId.startsWith('7M')}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default LiveGameDashboard;
