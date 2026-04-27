import React, { useEffect, useRef } from 'react';
import { Play, Pause, FastForward, Clock } from 'lucide-react';
import useStore from '../../../store/useStore';
import Button from '../../ui/Button';

const MatchTimer = () => {
  const { activeMatch, updateMatchTimer, updateMatchSuspensions, useTimeout } = useStore();
  const { elapsedMs, isPaused, phase } = activeMatch.timer;
  const intervalRef = useRef(null);
  const lastTickRef = useRef(null);

  useEffect(() => {
    if (!isPaused && (phase === 'FIRST_HALF' || phase === 'SECOND_HALF')) {
      lastTickRef.current = Date.now();
      
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const delta = now - lastTickRef.current;
        lastTickRef.current = now;

        const currentMatch = useStore.getState().activeMatch;
        if (!currentMatch || currentMatch.timer.isPaused) return;

        const newElapsedMs = currentMatch.timer.elapsedMs + delta;
        const oldSeconds = Math.floor(currentMatch.timer.elapsedMs / 1000);
        const newSeconds = Math.floor(newElapsedMs / 1000);

        // 1. Update Milliseconds in store
        updateMatchTimer({ elapsedMs: newElapsedMs });

        // 2. Only tick playing time and suspensions once per second change
        if (newSeconds > oldSeconds) {
          // Tick playing time (only COMPLEX mode)
          if (currentMatch.mode === 'COMPLEX') {
            const onField = [
              ...(currentMatch.lineup?.home || []),
              ...(currentMatch.lineup?.away || [])
            ];
            if (onField.length > 0) {
              useStore.getState().tickPlayingTime(onField);
            }
          }

          // Tick suspensions
          if (currentMatch.suspensions?.length > 0) {
            const updated = currentMatch.suspensions
              .map(s => ({ ...s, remainingSeconds: s.remainingSeconds - 1 }))
              .filter(s => s.remainingSeconds > 0);
            
            if (updated.length !== currentMatch.suspensions.length || 
                updated.some((s, i) => s.remainingSeconds !== currentMatch.suspensions[i].remainingSeconds)) {
              updateMatchSuspensions(updated);
            }
          }
        }
      }, 50); // High frequency for precision
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPaused, phase, updateMatchTimer, updateMatchSuspensions]);

  const formatTime = (totalMs) => {
    const totalSeconds = Math.floor(totalMs / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartStop = () => {
    if (phase === 'PRE_GAME') {
      updateMatchTimer({ phase: 'FIRST_HALF', isPaused: false });
    } else {
      const newPaused = !isPaused;
      updateMatchTimer({ isPaused: newPaused });
    }
  };

  const jumpTime = (seconds) => {
    const newTime = Math.max(0, elapsedMs + (seconds * 1000));
    updateMatchTimer({ elapsedMs: newTime });
  };

  const handleNextPhase = () => {
    let nextPhase = phase;
    let nextElapsedMs = elapsedMs;
    
    if (phase === 'FIRST_HALF') {
      nextPhase = 'HALF_TIME';
      // Ensure half time starts at at least 30:00 for clean sync
      nextElapsedMs = Math.max(elapsedMs, 1800000);
    } else if (phase === 'HALF_TIME') {
      nextPhase = 'SECOND_HALF';
      // Ensure 2nd half starts at exactly 30:00 if it was less
      nextElapsedMs = Math.max(elapsedMs, 1800000);
    } else if (phase === 'SECOND_HALF') {
      nextPhase = 'ENDED';
    }

    updateMatchTimer({ phase: nextPhase, elapsedMs: nextElapsedMs, isPaused: true });
  };

  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2rem] p-6 backdrop-blur-xl flex flex-col items-center gap-6">
      <div className="flex items-center justify-between w-full px-4 mb-2">
        <div className="flex flex-col items-center gap-1">
          <span className="text-[8px] font-black uppercase text-zinc-600">TTO Heim</span>
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <button 
                key={i}
                disabled={i >= (activeMatch.timeouts?.home ?? 3)}
                onClick={() => useTimeout('home')}
                className={`w-3 h-3 rounded-sm border transition-all ${i < (activeMatch.timeouts?.home ?? 3) ? 'bg-brand border-brand shadow-[0_0_8px_rgba(132,204,22,0.4)]' : 'bg-zinc-800 border-zinc-700 opacity-20'}`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 text-zinc-500">
          <Clock size={14} className="text-brand" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Spielzeit</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="text-[8px] font-black uppercase text-zinc-600">TTO Gast</span>
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <button 
                key={i}
                disabled={i >= (activeMatch.timeouts?.away ?? 3)}
                onClick={() => useTimeout('away')}
                className={`w-3 h-3 rounded-sm border transition-all ${i < (activeMatch.timeouts?.away ?? 3) ? 'bg-zinc-400 border-zinc-400' : 'bg-zinc-800 border-zinc-700 opacity-20'}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-8 lg:gap-12">
        {/* Backwards */}
        <div className="flex flex-col gap-2">
          <button onClick={() => jumpTime(-30)} className="text-[8px] font-black text-zinc-600 hover:text-red-500 transition-colors uppercase">-30s</button>
          <button onClick={() => jumpTime(-10)} className="text-[10px] font-black text-zinc-500 hover:text-red-500 transition-colors uppercase">-10s</button>
        </div>

        <div className="text-6xl lg:text-7xl font-black italic tabular-nums text-zinc-100 tracking-tighter">
          {formatTime(elapsedMs)}
        </div>

        {/* Forwards */}
        <div className="flex flex-col gap-2">
          <button onClick={() => jumpTime(30)} className="text-[8px] font-black text-zinc-600 hover:text-brand transition-colors uppercase">+30s</button>
          <button onClick={() => jumpTime(10)} className="text-[10px] font-black text-zinc-500 hover:text-brand transition-colors uppercase">+10s</button>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full">
        {phase !== 'HALF_TIME' && phase !== 'ENDED' && (
          <Button 
            variant={isPaused ? "primary" : "danger"} 
            onClick={handleStartStop}
            className="flex-1 py-4"
            icon={isPaused ? Play : Pause}
          >
            {isPaused ? (phase === 'PRE_GAME' ? 'Anpfiff' : 'Weiter') : 'Pause'}
          </Button>
        )}

        {phase === 'ENDED' && (
          <Button 
            variant="primary" 
            onClick={() => useStore.getState().finishMatch()}
            className="flex-1 py-4"
            icon={Clock}
          >
            Spiel archivieren & schließen
          </Button>
        )}

        {phase !== 'ENDED' && phase !== 'PRE_GAME' && (
          <Button 
            variant="outline"
            onClick={handleNextPhase}
            className={phase === 'HALF_TIME' ? "flex-1 py-4" : "px-6 py-4"}
            icon={FastForward}
          >
            {phase === 'FIRST_HALF' ? 'Halbzeit' : '2. HZ'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default MatchTimer;
