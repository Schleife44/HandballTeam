import { useState } from 'react';
import useStore from '../store/useStore';

export const useArchiveData = () => {
  const { activeTeamId } = useStore();
  const [selectedGame, setSelectedGame] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const handleGameSelect = async (game) => {
    if (!game) return null;
    
    // SaaS Two-Tier Archive: Fetch heavy details on-demand and cache in Zustand
    let fullGame = { ...game };
    if (!game.gameLog || game.gameLog.length === 0) {
      setIsDetailLoading(true);
      try {
        const store = useStore.getState();
        const loadedGame = await store.fetchFullGameDetails(game.id);
        if (loadedGame) {
          fullGame = loadedGame;
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
