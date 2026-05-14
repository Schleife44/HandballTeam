import React from 'react';
import { Play, Pause, SkipForward, Shield } from 'lucide-react';
import useStore from '../../../store/useStore';
import MatchScoreboard from './MatchScoreboard';
import MatchTimer from './MatchTimer';

const LiveGameHeader = ({ activeMatch, squadSettings, formatTime }) => {
  const { updateMatchTimer, toggleEmptyGoal } = useStore();

  const handleTimerToggle = () => {
    const { isPaused, phase } = activeMatch.timer;
    if (phase === 'PRE_GAME') {
      updateMatchTimer({ phase: 'FIRST_HALF', isPaused: false, elapsedMs: 0 });
    } else {
      updateMatchTimer({ isPaused: !isPaused });
    }
  };

  const handleNextPhase = () => {
    const { phase, elapsedMs } = activeMatch.timer;
    let nextPhase = phase;
    let nextElapsedMs = elapsedMs;
    if (phase === 'FIRST_HALF') { nextPhase = 'HALF_TIME'; nextElapsedMs = Math.max(elapsedMs, 1800000); }
    else if (phase === 'HALF_TIME') { nextPhase = 'SECOND_HALF'; nextElapsedMs = Math.max(elapsedMs, 1800000); }
    else if (phase === 'SECOND_HALF') { nextPhase = 'ENDED'; }
    else if (phase === 'PRE_GAME') { nextPhase = 'FIRST_HALF'; nextElapsedMs = 0; }
    updateMatchTimer({ phase: nextPhase, elapsedMs: nextElapsedMs, isPaused: true });
  };

  return (
    <>
      {/* --- DESKTOP HEADER --- */}
      <div className="hidden lg:grid grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-8">
          <MatchScoreboard 
            homeScore={activeMatch.score.home} 
            awayScore={activeMatch.score.away} 
            homeName={activeMatch.customHomeName || squadSettings?.homeName || 'Heim'} 
            awayName={activeMatch.customAwayName || squadSettings?.awayName || 'Gegner'} 
            homeColor={activeMatch.customHomeName ? '#6366f1' : (squadSettings?.homeColor || '#84cc16')} 
            awayColor={activeMatch.customAwayName ? '#f43f5e' : (squadSettings?.awayColor || '#3f3f46')} 
            phase={activeMatch.timer?.phase} 
          />
        </div>
        <div className="lg:col-span-4">
          <MatchTimer />
        </div>
      </div>

      {/* --- MOBILE ONLY HEADER --- */}
      <div className="lg:hidden sticky top-0 z-[100] -mx-4 px-4 py-3 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50 flex items-center justify-between shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="absolute inset-0 blur-md opacity-20" style={{ backgroundColor: activeMatch.customHomeName ? '#6366f1' : (squadSettings?.homeColor || '#84cc16') }} />
            <div className="w-1 h-8 rounded-full relative z-10" style={{ backgroundColor: activeMatch.customHomeName ? '#6366f1' : (squadSettings?.homeColor || '#84cc16') }} />
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-black uppercase text-zinc-100 tracking-widest truncate max-w-[80px]">
              {activeMatch.customHomeName || squadSettings?.homeName || 'Heim'}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black italic text-white tabular-nums tracking-tighter">{activeMatch.score.home}</span>
              <span className="text-xs font-black text-zinc-700">:</span>
              <span className="text-xl font-black italic text-zinc-400 tabular-nums tracking-tighter">{activeMatch.score.away}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {activeMatch.timer.phase === 'ENDED' ? (
            <button 
              onClick={() => useStore.getState().finishMatch()}
              className="px-4 py-2 bg-brand text-black rounded-xl font-black uppercase text-[10px] italic shadow-[0_0_20px_rgba(132,204,22,0.4)]"
            >
              Archivieren
            </button>
          ) : (
            <>
              <button 
                onClick={handleTimerToggle}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${activeMatch.timer.isPaused ? 'bg-brand text-black scale-105' : 'bg-zinc-800 text-zinc-100'}`}
              >
                {activeMatch.timer.isPaused ? <Play size={24} fill="currentColor" /> : <Pause size={24} fill="currentColor" />}
              </button>

              <div className="flex flex-col items-center min-w-[60px]">
                <span className="text-2xl font-black italic text-brand tabular-nums tracking-tighter">
                  {formatTime(activeMatch.timer.elapsedMs)}
                </span>
              </div>

              <button onClick={handleNextPhase} className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
                <SkipForward size={18} />
              </button>
            </>
          )}
        </div>

        {activeMatch.mode === 'COMPLEX' && (
          <button 
            className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${activeMatch.isEmptyGoal ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-zinc-900/50 border-zinc-800 text-zinc-500'}`}
            onClick={() => toggleEmptyGoal()}
          >
            <Shield size={18} fill={activeMatch.isEmptyGoal ? "currentColor" : "none"} />
          </button>
        )}
      </div>
    </>
  );
};

export default LiveGameHeader;
