import { useCallback, useEffect } from 'react';
import useStore from '../store/useStore';

export const useRosterData = () => {
  const { squad, addPlayer: storeAddPlayer, updatePlayer: storeUpdatePlayer, removePlayer: storeRemovePlayer } = useStore();

  // --- LAZY LOADING: Real-time Firestore Sync ---
  useEffect(() => {
    const activeTeamId = useStore.getState().activeTeamId;
    if (activeTeamId) {
      const subKey = `roster_${activeTeamId}`;
      let isMounted = true;
      let sync;

      import('../services/SyncService').then(({ default: syncService }) => {
        if (!isMounted) return;
        sync = syncService;
        syncService.subscribeToRoster(activeTeamId, useStore.getState());
      });

      return () => {
        isMounted = false;
        if (sync) sync.unsubscribe(subKey);
      };
    }
  }, []);

  const addPlayer = (team) => {
    const newPlayer = {
      name: '',
      number: '',
      isGoalkeeper: false,
      isInactive: false,
      role: 'Spieler'
    };
    storeAddPlayer(team, newPlayer);
  };

  const updatePlayer = (team, playerId, updatedData) => {
    storeUpdatePlayer(team, playerId, updatedData);
  };

  const removePlayer = (team, playerId) => {
    storeRemovePlayer(team, playerId);
  };

  const toggleStatus = (team, playerId) => {
    const player = squad[team].find(p => p.id === playerId);
    if (player) {
      storeUpdatePlayer(team, playerId, { isInactive: !player.isInactive });
    }
  };

  // Helper to get sorted team
  const getSortedTeam = (team) => {
    return [...(squad[team] || [])].sort((a, b) => (parseInt(a.number) || 999) - (parseInt(b.number) || 999));
  };

  return {
    squad: {
      ...squad,
      home: getSortedTeam('home'),
      away: getSortedTeam('away')
    },
    addPlayer,
    updatePlayer,
    removePlayer,
    toggleStatus
  };
};
