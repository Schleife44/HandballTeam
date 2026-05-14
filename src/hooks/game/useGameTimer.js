import { useEffect, useRef } from 'react';
import useStore from '../../store/useStore';

export const useGameTimer = (activeMatch) => {
  const lastTickRef = useRef(null);

  useEffect(() => {
    const { isPaused, phase } = activeMatch?.timer || {};
    
    if (activeMatch && !isPaused && (phase === 'FIRST_HALF' || phase === 'SECOND_HALF')) {
      lastTickRef.current = Date.now();
      
      const interval = setInterval(() => {
        const now = Date.now();
        const delta = now - lastTickRef.current;
        lastTickRef.current = now;

        const currentMatch = useStore.getState().activeMatch;
        if (!currentMatch || currentMatch.timer.isPaused) return;

        const onField = currentMatch.mode === 'COMPLEX' ? [
          ...(currentMatch.lineup?.home || []),
          ...(currentMatch.lineup?.away || [])
        ] : [];

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

  return { formatTime };
};
