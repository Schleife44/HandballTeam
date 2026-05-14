import syncService from '../../services/SyncService';

export const initialRosterState = {
  squad: {
    home: [],
    away: [],
  }
};

export const createRosterSlice = (set, get) => ({
  addPlayer: (team, player) => set((state) => {
    const { activeTeamId } = state;
    const teamKey = team === 'home' ? 'home' : 'away';
    const newPlayer = { ...player, id: player.id || Date.now().toString() };
    
    if (activeTeamId && !player.isTemporary) {
      syncService.savePlayer(activeTeamId, newPlayer, teamKey);
    }

    return {
      squad: {
        ...state.squad,
        [teamKey]: [...(state.squad[teamKey] || []), newPlayer]
      }
    };
  }),

  updatePlayer: (team, playerId, updatedData) => set((state) => {
    const { activeTeamId } = state;
    const teamKey = team === 'home' ? 'home' : 'away';
    const player = state.squad[teamKey].find(p => p.id === playerId);
    
    if (player && activeTeamId) {
      syncService.savePlayer(activeTeamId, { ...player, ...updatedData }, teamKey);
    }

    return {
      squad: {
        ...state.squad,
        [teamKey]: state.squad[teamKey].map(p => p.id === playerId ? { ...p, ...updatedData } : p)
      }
    };
  }),

  removePlayer: (team, playerId) => set((state) => {
    const { activeTeamId } = state;
    const teamKey = team === 'home' ? 'home' : 'away';
    const playerToDelete = state.squad[teamKey]?.find(p => p.id === playerId);
    
    let updatedSettings = state.squad.settings;

    if (activeTeamId) {
      syncService.deletePlayer(activeTeamId, playerId);

      if (playerId.startsWith('guest_') && playerToDelete) {
        const deletedGuestNames = state.squad.settings?.deletedGuestNames || [];
        const nameToBlacklist = playerToDelete.name.trim().toLowerCase();
        
        if (!deletedGuestNames.includes(nameToBlacklist)) {
          updatedSettings = { 
            ...state.squad.settings, 
            deletedGuestNames: [...deletedGuestNames, nameToBlacklist] 
          };
          syncService.saveSettings(activeTeamId, updatedSettings);
        }
      }
    }

    return {
      squad: {
        ...state.squad,
        settings: updatedSettings,
        [teamKey]: state.squad[teamKey].filter(p => p.id !== playerId)
      }
    };
  }),

  setRosterData: (data) => set((state) => {
    const updatedSquad = { ...state.squad };
    
    if (data.home) {
      const currentTemps = (state.squad.home || []).filter(p => p.isTemporary);
      const newIds = new Set(data.home.map(p => p.id));
      const missingTemps = currentTemps.filter(p => !newIds.has(p.id));
      updatedSquad.home = [...data.home, ...missingTemps];
    }
    
    if (data.away) {
      const currentTemps = (state.squad.away || []).filter(p => p.isTemporary);
      const newIds = new Set(data.away.map(p => p.id));
      const missingTemps = currentTemps.filter(p => !newIds.has(p.id));
      updatedSquad.away = [...data.away, ...missingTemps];
    }

    return { squad: updatedSquad };
  }),
});
