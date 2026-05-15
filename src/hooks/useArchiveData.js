import { useState } from 'react';
import useStore from '../store/useStore';

export const useArchiveData = () => {
  const { activeTeamId } = useStore();
  const [selectedGame, setSelectedGame] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const handleGameSelect = async (game) => {
    if (!game) return null;
    
    // SaaS OPTIMIZATION: Check if we need to load heavy tactical details
    let fullGame = { ...game };
    if (!game.gameLog || game.gameLog.length === 0) {
      setIsDetailLoading(true);
      try {
        const { default: sync } = await import('../services/SyncService');
        const details = await sync.fetchHistoryDetails(activeTeamId, game.id);
        if (details) {
          fullGame = { ...fullGame, ...details };
        }
      } catch (e) {
        console.error('[Archive] Failed to load details:', e);
      } finally {
        setIsDetailLoading(false);
      }
    }

    // Normalize game data for sub-components (Legacy support)
    const normalizedGame = {
      ...fullGame,
      gameLog: fullGame.gameLog || fullGame.log || []
    };
    
    setSelectedGame(normalizedGame);
    return normalizedGame;
  };

  return {
    selectedGame,
    setSelectedGame,
    isDetailLoading,
    handleGameSelect
  };
};
