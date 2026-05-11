import React, { useState, useEffect, useRef } from 'react';
import MatchScoreboard from './parts/MatchScoreboard';
import MatchTimer from './parts/MatchTimer';
import PlayerActionGrid from './parts/PlayerActionGrid';
import ActionOverlay from './parts/ActionOverlay';
import MatchLog from './parts/MatchLog';
import ShotDetailsModal from './parts/ShotDetailsModal';
import SevenMeterResultOverlay from './parts/SevenMeterResultOverlay';
import SevenMeterShooterOverlay from './parts/SevenMeterShooterOverlay';
import OpponentSelectionOverlay from './parts/OpponentSelectionOverlay';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Zap, Layers, ChevronRight, X, UserPlus, Shield, Target, Play, Pause, SkipForward } from 'lucide-react';

// Store
import useStore from '../../store/useStore';

// UI
import Button from '../ui/Button';
import Card from '../ui/Card';

import { useLocation } from 'react-router-dom';

const LiveGameDashboard = () => {
  const location = useLocation();
  const { 
    activeMatch, 
    updateMatchTimer, 
    updateMatchScore, 
    updateMatchLineup, 
    addMatchSuspension, 
    updateMatchSuspensions,
    recordMatchAction,
    toggleEmptyGoal,
    addToMatchLog,
    squad,
    tickPlayingTime,
    initMatch,
    updateSettings,
    setSquadData
  } = useStore();

  const [isAutoSetupLoading, setIsAutoSetupLoading] = useState(false);
  const setupProcessedRef = useRef(false);

  useEffect(() => {
    let state = location.state;
    
    // PROACTIVE AUTO-DETECTION: If no state is passed, check if there's a game TODAY in the calendar
    if (!state && squad.calendarEvents?.length > 0) {
      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);
      const todaysEvent = squad.calendarEvents.find(e => {
        if (!e.date) return false;
        const eventDate = e.date instanceof Date ? e.date.toISOString().slice(0, 10) : String(e.date).slice(0, 10);
        return eventDate === todayStr && (e.type?.toUpperCase() === 'SPIEL' || e.type === 'game');
      });

      if (todaysEvent) {
        state = {
          hnetGameId: todaysEvent.hnetGameId || (todaysEvent.id?.includes('hnet_') ? todaysEvent.id.replace('hnet_', '') : null),
          opponent: todaysEvent.title.split('vs. ')[1] || todaysEvent.title.split(' - ')[1] || todaysEvent.title,
        };
      }
    }

    if (state?.hnetGameId && !setupProcessedRef.current) {
      setupProcessedRef.current = true;
      setIsAutoSetupLoading(true);
      
      const triggerSetup = async (gameId, opponentName) => {
        const { fetchGameData } = await import('../../services/handballNetService');
        try {
          const raw = await fetchGameData(gameId);
          const homeTeam = raw.teams.home.name;
          const myTeamName = squad.settings.homeName || "";
          const isOpponentHome = homeTeam.toLowerCase().includes(myTeamName.toLowerCase()) ? false : true;
          const opponentRaw = isOpponentHome ? raw.teams.home : raw.teams.away;
          
          const opponentRoster = (opponentRaw.lineup || []).map(p => ({
            id: `opp_${p.number}`,
            number: String(p.number),
            name: p.name,
            team: 'away'
          }));

          updateSettings({ awayName: opponentRaw.name || opponentName });
          setSquadData({ away: opponentRoster });
          console.log(`[AutoSetup] Loaded ${opponentRoster.length} players for ${opponentRaw.name}`);
        } catch (err) {
          console.error("[AutoSetup] Error:", err);
        } finally {
          setIsAutoSetupLoading(false);
        }
      };

      // If we have an ID, start immediately
      if (state.hnetGameId && state.hnetGameId !== 'null') {
        triggerSetup(state.hnetGameId, state.opponent);
      } 
      // NEW: If no ID but we have a teamId, search the schedule!
      else if (squad.settings.teamId) {
        import('../../services/handballNetService').then(async ({ fetchTeamSchedule }) => {
          try {
            const now = new Date();
            const todayStr = now.toISOString().slice(0, 10);
            const schedule = await fetchTeamSchedule(squad.settings.teamId);
            
            // Find today's game in the schedule
            const gameToday = schedule.find(g => g.startsAt?.slice(0, 10) === todayStr);
            
            if (gameToday && gameToday.id) {
              console.log(`[AutoSetup] Found game ID ${gameToday.id} in schedule for today!`);
              triggerSetup(gameToday.id, state.opponent);
            } else {
              setIsAutoSetupLoading(false);
            }
          } catch (err) {
            console.error("[AutoSetup] Schedule search error:", err);
            setIsAutoSetupLoading(false);
          }
        });
      } else {
        setIsAutoSetupLoading(false);
      }
    }
  }, [location.state, squad.calendarEvents, squad.settings.homeName, updateSettings, setSquadData]);

  const squadSettings = squad.settings || {};
  const { home, away } = squad;
  
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [activeShotAction, setActiveShotAction] = useState(null);
  const [swapPending, setSwapPending] = useState(null);
  const [sevenMeterFlow, setSevenMeterFlow] = useState(null); // { earner, shooter, step, opponent, type }
  const [foulFlow, setFoulFlow] = useState(null); // { type, earner, step }

  // --- GLOBAL TIMER LOGIC (Centralized here to ensure reliability on mobile) ---
  const lastTickRef = useRef(null);

  useEffect(() => {
    const { isPaused, phase, elapsedMs } = activeMatch?.timer || {};
    
    if (activeMatch && !isPaused && (phase === 'FIRST_HALF' || phase === 'SECOND_HALF')) {
      lastTickRef.current = Date.now();
      
      const interval = setInterval(() => {
        const now = Date.now();
        const delta = now - lastTickRef.current;
        lastTickRef.current = now;

        const currentMatch = useStore.getState().activeMatch;
        if (!currentMatch || currentMatch.timer.isPaused) return;

        // Get players on field for playing time tracking
        const onField = currentMatch.mode === 'COMPLEX' ? [
          ...(currentMatch.lineup?.home || []),
          ...(currentMatch.lineup?.away || [])
        ] : [];

        // Atomic update for Timer, Suspensions and Playing Time
        useStore.getState().tickMatch(delta, onField);
      }, 100); 

      return () => clearInterval(interval);
    }
  }, [activeMatch?.timer.isPaused, activeMatch?.timer.phase]);

  const formatTime = (totalMs) => {
    const totalSeconds = Math.floor(totalMs / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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

  const handleAction = (actionId, extraData = null) => {
    const playerToUse = selectedPlayer || (activeShotAction?.player) || (sevenMeterFlow?.shooter);
    if (!playerToUse) return;

    // Start 7m Flow
    if (actionId === 'GET_7M' || actionId === 'GET_7M_2MIN') {
      setSevenMeterFlow({ earner: playerToUse, step: 'opponent', type: actionId });
      setSelectedPlayer(null);
      return;
    }

    if (actionId === 'GET_2MIN') {
      setFoulFlow({ type: 'GET_2MIN', earner: playerToUse, step: 'opponent' });
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


    const isHomePlayer = home?.some(p => p.id === playerToUse.id);
    const finalIsHome = isHomePlayer;

    let newScore = { ...activeMatch.score };
    let scoreUpdate = null;

    if (actionId === 'GOAL' || actionId === '7M_GOAL') {
      if (finalIsHome) newScore.home += 1;
      else newScore.away += 1;
      scoreUpdate = { home: newScore.home, away: newScore.away };
    }

    const newLogEntry = {
      timestamp: Math.floor(Date.now() / 1000),
      time: formatTime(activeMatch.timer.elapsedMs),
      matchTimeMs: activeMatch.timer.elapsedMs,
      type: actionId,
      isOpponent: !finalIsHome,
      playerId: playerToUse.id,
      playerNumber: playerToUse.number,
      playerName: playerToUse.name,
      team: finalIsHome ? 'home' : 'away',
      action: getActionLabel(actionId),
      score: `${newScore.home}:${newScore.away}`,
      details: actionId.startsWith('7M') ? {
        ...extraData,
        fieldPos: { x: 50, y: 35 }
      } : extraData,
      isEmptyGoal: activeMatch.isEmptyGoal && !finalIsHome
    };

    if (actionId === 'TWO_MIN') {
      addMatchSuspension({
        playerId: playerToUse.id,
        team: playerToUse.team,
        remainingSeconds: 120,
        playerNumber: playerToUse.number,
        playerName: playerToUse.name
      });
    }

    if (actionId === 'RED' || actionId === 'BLUE' || actionId === 'TWO_MIN') {
      const currentLineup = activeMatch.lineup[playerToUse.team] || [];
      const newLineup = currentLineup.filter(id => id !== playerToUse.id);
      updateMatchLineup(playerToUse.team, newLineup);
    }

    recordMatchAction(newLogEntry, scoreUpdate);
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
            onClick={() => initMatch('SIMPLE', squadSettings.isZoneMode)} 
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
            onClick={() => initMatch('COMPLEX', squadSettings.isZoneMode)} 
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
      <AnimatePresence>
        {isAutoSetupLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center space-y-6"
          >
            <div className="relative">
              <div className="w-20 h-20 border-4 border-zinc-800 border-t-brand rounded-full animate-spin" />
              <div className="absolute inset-0 blur-xl bg-brand/20 rounded-full animate-pulse" />
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Daten werden geladen</h3>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.4em] mt-2">Gegner-Kader von handball.net synchronisieren...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* --- DESKTOP ONLY HEADER --- */}
      <div className="hidden lg:grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 items-start">
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

      {/* --- MOBILE ONLY HEADER (Premium Glassmorphism) --- */}
      <div className="lg:hidden sticky top-0 z-[100] -mx-4 px-4 py-3 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50 flex items-center justify-between shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="absolute inset-0 blur-md opacity-20" style={{ backgroundColor: squadSettings?.homeColor || '#84cc16' }} />
            <div className="w-1 h-8 rounded-full relative z-10" style={{ backgroundColor: squadSettings?.homeColor || '#84cc16' }} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black italic text-white tabular-nums tracking-tighter">{activeMatch.score.home}</span>
              <span className="text-xs font-black text-zinc-700">:</span>
              <span className="text-xl font-black italic text-zinc-400 tabular-nums tracking-tighter">{activeMatch.score.away}</span>
            </div>
            <span className="text-[7px] font-black text-zinc-500 uppercase tracking-[0.2em] -mt-1">
              {activeMatch.timer?.phase === 'FIRST_HALF' ? '1. Halbzeit' : 
               activeMatch.timer?.phase === 'SECOND_HALF' ? '2. Halbzeit' : 
               activeMatch.timer?.phase === 'ENDED' ? 'Spiel beendet' : 'Halbzeit'}
            </span>
          </div>
        </div>

        {/* Timer Controls or Finish Button */}
        <div className="flex items-center gap-4 relative z-[200]">
          {activeMatch.timer.phase === 'ENDED' ? (
            <button 
              onClick={() => useStore.getState().finishMatch()}
              className="px-4 py-2 bg-brand text-black rounded-xl font-black uppercase text-[10px] italic shadow-[0_0_20px_rgba(132,204,22,0.4)] active:scale-95 transition-all pointer-events-auto cursor-pointer"
            >
              Spiel archivieren
            </button>
          ) : (
            <>
              <button 
                onClick={() => {
                  const currentMatch = useStore.getState().activeMatch;
                  if (!currentMatch) return;

                  const { isPaused, phase } = currentMatch.timer;
                  if (phase === 'PRE_GAME') {
                    updateMatchTimer({ phase: 'FIRST_HALF', isPaused: false, elapsedMs: 0 });
                  } else {
                    updateMatchTimer({ isPaused: !isPaused });
                  }
                }}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 pointer-events-auto shadow-xl cursor-pointer
                  ${activeMatch.timer.isPaused ? 'bg-brand text-black scale-105 shadow-brand/20' : 'bg-zinc-800 text-zinc-100'}`}
              >
                {activeMatch.timer.isPaused ? <Play size={24} fill="currentColor" /> : <Pause size={24} fill="currentColor" />}
              </button>

              <div className="flex flex-col items-center min-w-[80px]">
                <span className="text-2xl font-black italic text-brand tabular-nums tracking-tighter drop-shadow-[0_0_10px_rgba(132,204,22,0.3)]">
                  {formatTime(activeMatch.timer.elapsedMs)}
                </span>
                <div className="flex items-center gap-1">
                  <div className={`w-1 h-1 rounded-full ${activeMatch.timer.isPaused ? 'bg-zinc-700' : 'bg-brand animate-pulse'}`} />
                  <span className="text-[6px] font-black text-zinc-600 uppercase tracking-[0.3em]">{activeMatch.timer.isPaused ? 'Pause' : 'Live'}</span>
                </div>
              </div>

              <button 
                onClick={() => {
                  const currentMatch = useStore.getState().activeMatch;
                  if (!currentMatch) return;
                  
                  const { phase, elapsedMs } = currentMatch.timer;
                  let nextPhase = phase;
                  let nextElapsedMs = elapsedMs;

                  if (phase === 'FIRST_HALF') {
                    nextPhase = 'HALF_TIME';
                    nextElapsedMs = Math.max(elapsedMs, 1800000);
                  } else if (phase === 'HALF_TIME') {
                    nextPhase = 'SECOND_HALF';
                    nextElapsedMs = Math.max(elapsedMs, 1800000);
                  } else if (phase === 'SECOND_HALF') {
                    nextPhase = 'ENDED';
                  } else if (phase === 'PRE_GAME') {
                    nextPhase = 'FIRST_HALF';
                    nextElapsedMs = 0;
                  }

                  updateMatchTimer({ 
                    phase: nextPhase, 
                    elapsedMs: nextElapsedMs, 
                    isPaused: true 
                  });
                }}
                className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 active:text-brand active:border-brand transition-all pointer-events-auto cursor-pointer"
              >
                <SkipForward size={18} />
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
           {activeMatch.mode === 'COMPLEX' && (
             <button 
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all border ${activeMatch.isEmptyGoal ? 'bg-red-500/20 border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-zinc-900/50 border-zinc-800 text-zinc-500'}`}
              onClick={() => toggleEmptyGoal()}
            >
              <Shield size={18} fill={activeMatch.isEmptyGoal ? "currentColor" : "none"} />
            </button>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 2xl:grid-cols-12 gap-6 lg:gap-8 items-start">
        <div className="2xl:col-span-9">
          {/* Main Content Area */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2rem] lg:rounded-[3rem] p-4 lg:p-8 backdrop-blur-xl">
            {/* Desktop-only action bar */}
            <div className="hidden lg:flex items-center justify-between mb-8">
               {activeMatch.mode === 'COMPLEX' && (
                 <div className="flex items-center gap-3">
                    <div className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-all ${activeMatch.isEmptyGoal ? 'bg-red-500' : 'bg-zinc-800'}`} onClick={() => toggleEmptyGoal()}>
                      <div className={`w-4 h-4 bg-white rounded-full transition-all ${activeMatch.isEmptyGoal ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase text-zinc-100 tracking-wider">Leeres Tor</span>
                      <span className="text-[8px] font-bold text-zinc-500 uppercase">7. Feldspieler aktiv</span>
                    </div>
                  </div>
               )}

                <div className="flex items-center gap-4">
                  {sevenMeterFlow?.step === 'shooter' && (
                    <div className="flex items-center gap-3 px-4 py-2 bg-brand/20 border border-brand/40 rounded-2xl animate-pulse">
                      <Target size={14} className="text-brand" />
                      <span className="text-[10px] font-black text-brand uppercase tracking-widest">7m Schützen wählen...</span>
                    </div>
                  )}
                  {swapPending && (
                    <div className="flex items-center gap-3 px-4 py-2 bg-brand/10 border border-brand/20 rounded-2xl animate-pulse">
                      <UserPlus size={14} className="text-brand" />
                      <span className="text-[10px] font-black text-brand uppercase tracking-widest">#{swapPending.number} einwechseln...</span>
                    </div>
                  )}
                </div>
            </div>

            <PlayerActionGrid 
              onPlayerSelect={handlePlayerClick} 
              lineup={activeMatch.lineup} 
              activeSwap={swapPending} 
              mode={activeMatch.mode} 
              suspensions={activeMatch.suspensions}
            />
          </div>
        </div>

        {/* Log Area */}
        <div className="hidden lg:block 2xl:col-span-3 h-[700px]">
          <MatchLog log={activeMatch.gameLog} />
        </div>
      </div>

      <AnimatePresence>
        {selectedPlayer && (
          <ActionOverlay player={selectedPlayer} onClose={() => setSelectedPlayer(null)} onAction={handleAction} />
        )}
        {sevenMeterFlow?.step === 'opponent' && (
          <OpponentSelectionOverlay 
            players={sevenMeterFlow.earner.team === 'home' ? away : home}
            title="Wer hat das Foul begangen?"
            subtitle="Gegenspieler auswählen"
            onSelect={(opp) => {
              // Log the earner
              const earnerLog = {
                timestamp: Math.floor(Date.now() / 1000),
                time: formatTime(activeMatch.timer.elapsedMs),
                matchTimeMs: activeMatch.timer.elapsedMs,
                type: sevenMeterFlow.type,
                playerNumber: sevenMeterFlow.earner.number,
                playerName: sevenMeterFlow.earner.name,
                team: sevenMeterFlow.earner.team,
                action: getActionLabel(sevenMeterFlow.type),
                score: `${activeMatch.score.home}:${activeMatch.score.away}`,
                details: { opponentId: opp.id, opponentNumber: opp.number }
              };
              addToMatchLog(earnerLog);

              // If it's a 7m + 2min, also give the opponent a 2min
              if (sevenMeterFlow.type === 'GET_7M_2MIN') {
                const opponentTeam = sevenMeterFlow.earner.team === 'home' ? 'away' : 'home';
                addMatchSuspension({
                  playerId: opp.id,
                  team: opponentTeam,
                  remainingSeconds: 120,
                  playerNumber: opp.number,
                  playerName: opp.name
                });
                const currentLineup = activeMatch.lineup[opponentTeam] || [];
                updateMatchLineup(opponentTeam, currentLineup.filter(id => id !== opp.id));
              }

              setSevenMeterFlow({ ...sevenMeterFlow, opponent: opp, step: 'shooter' });
            }}
            onCancel={() => setSevenMeterFlow(null)}
          />
        )}
        {foulFlow?.step === 'opponent' && (
          <OpponentSelectionOverlay 
            players={foulFlow.earner.team === 'home' ? away : home}
            title="Wer hat die Strafe bekommen?"
            subtitle="Gegenspieler auswählen"
            onSelect={(opp) => {
              // 1. Log the earner (Home player gets 2min+)
              const earnerLog = {
                timestamp: Math.floor(Date.now() / 1000),
                time: formatTime(activeMatch.timer.elapsedMs),
                matchTimeMs: activeMatch.timer.elapsedMs,
                type: 'GET_2MIN',
                playerNumber: foulFlow.earner.number,
                playerName: foulFlow.earner.name,
                team: foulFlow.earner.team,
                action: '2 MIN+ rausgeholt',
                score: `${activeMatch.score.home}:${activeMatch.score.away}`,
                details: { opponentId: opp.id, opponentNumber: opp.number }
              };
              addToMatchLog(earnerLog);

              // 2. Give opponent the 2min
              const opponentTeam = foulFlow.earner.team === 'home' ? 'away' : 'home';
              addMatchSuspension({
                playerId: opp.id,
                team: opponentTeam,
                remainingSeconds: 120,
                playerNumber: opp.number,
                playerName: opp.name
              });
              const currentLineup = activeMatch.lineup[opponentTeam] || [];
              updateMatchLineup(opponentTeam, currentLineup.filter(id => id !== opp.id));
              
              setFoulFlow(null);
            }}
            onCancel={() => setFoulFlow(null)}
          />
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
