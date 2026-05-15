import { useCallback, useEffect } from 'react';
import useStore from '../store/useStore';
import { normalizeText } from '../utils/dataUtils';

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

  const addPlayer = (team, data = {}) => {
    const newPlayer = {
      name: normalizeText(data.name),
      number: data.number || '',
      isGoalkeeper: data.isGoalkeeper || false,
      isInactive: data.isInactive || false,
      role: data.role || 'Spieler',
      ...data,
      name: normalizeText(data.name)
    };
    storeAddPlayer(team, newPlayer);
  };

  const updatePlayer = (team, playerId, updatedData) => {
    const normalized = {
      ...updatedData,
      name: updatedData.name !== undefined ? normalizeText(updatedData.name) : undefined
    };
    // Remove undefined fields
    if (normalized.name === undefined) delete normalized.name;
    
    storeUpdatePlayer(team, playerId, normalized);
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
