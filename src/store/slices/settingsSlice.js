import syncService from '../../services/SyncService';

export const initialSettingsState = {
  squad: {
    settings: {
      homeName: 'Mein Team',
      awayName: 'Gegner',
      homeColor: '#84cc16',
      awayColor: '#3f3f46',
      isZoneMode: false,
      hnetUrl: '',
      absageGrundPflicht: true,
      autoDabei: true,
      absageDeadline: 24,
      defaultMeetingOffset: 60,
      teamId: '',
      myPlayerName: '',
      currentSeason: (() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        return month >= 6 ? `${String(year).slice(-2)}/${String(year + 1).slice(-2)}` : `${String(year - 1).slice(-2)}/${String(year).slice(-2)}`;
      })()
    },
    isHydrated: false,
    isRosterHydrated: false,
    leagueTable: null,
    archivedTableStatus: false
  }
};

export const createSettingsSlice = (set, get) => ({
  updateSettings: (newSettings) => set((state) => {
    const { activeTeamId } = state;
    const updatedSettings = { ...state.squad.settings, ...newSettings };
    if (activeTeamId) {
      syncService.saveSettings(activeTeamId, updatedSettings);
    }
    return {
      squad: {
        ...state.squad,
        settings: updatedSettings
      }
    };
  }),

  setSettingsData: (newSettings) => set((state) => ({
    squad: {
      ...state.squad,
      settings: { ...state.squad.settings, ...newSettings }
    }
  })),

  setLeagueTable: (table, isArchived = false) => set((state) => ({
    squad: { ...state.squad, leagueTable: table, archivedTableStatus: isArchived }
  })),

  setHydrated: (val) => set((state) => ({
    squad: { ...state.squad, isHydrated: val }
  })),

  setRosterHydrated: (val) => set((state) => ({
    squad: { ...state.squad, isRosterHydrated: val }
  })),

  setSquadData: (data) => set((state) => {
    const updatedSquad = { ...state.squad, ...data };
    
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
