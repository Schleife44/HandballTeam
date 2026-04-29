import syncService from '../../services/SyncService';

export const initialSquadState = {
  squad: {
    home: [],
    away: [],
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
      currentSeason: '25/26'
    },
    calendarEvents: [],
    hiddenEventIds: [],
    absences: [],
    subscriptions: [],
    series: [],
    isHydrated: false,
    isRosterHydrated: false,
    contextId: ''
  }
};

export const createSquadSlice = (set) => ({
  ...initialSquadState,

  setHydrated: (val) => set((state) => ({
    squad: { ...state.squad, isHydrated: val }
  })),

  setRosterHydrated: (val) => set((state) => ({
    squad: { ...state.squad, isRosterHydrated: val }
  })),

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

  setSquad: (newSquad) => set({ squad: newSquad }),

  removeEvent: (eventId) => set((state) => {
    const { activeTeamId } = state;
    const event = state.squad.calendarEvents.find(e => e.id === eventId);
    const hiddenIds = [...(state.squad.hiddenEventIds || [])];
    
    if (event && event.hnetGameId && !hiddenIds.includes(event.hnetGameId)) {
      hiddenIds.push(event.hnetGameId);
    }

    if (activeTeamId) {
      syncService.deleteEvent(activeTeamId, eventId);
      syncService.saveHiddenEventIds(activeTeamId, hiddenIds);
    }

    return {
      squad: {
        ...state.squad,
        calendarEvents: state.squad.calendarEvents.filter(e => e.id !== eventId),
        hiddenEventIds: hiddenIds
      }
    };
  }),

  restoreEvent: (hnetId) => set((state) => ({
    squad: {
      ...state.squad,
      hiddenEventIds: (state.squad.hiddenEventIds || []).filter(id => id !== hnetId)
    }
  })),

  addPlayer: (team, player) => set((state) => {
    const { activeTeamId } = state;
    const teamKey = team === 'home' ? 'home' : 'away';
    const newPlayer = {
      ...player,
      id: player.id || Date.now().toString()
    };
    
    if (activeTeamId) {
      syncService.savePlayer(activeTeamId, newPlayer, team === 'home' ? 'home' : 'away');
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
      syncService.savePlayer(activeTeamId, { ...player, ...updatedData }, team === 'home' ? 'home' : 'away');
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
    
    if (activeTeamId) {
      syncService.deletePlayer(activeTeamId, playerId);
    }

    // SaaS OPTIMIZATION: We stop the "Write-Bomb" cleanup.
    // Preserving the player name in old calendar responses maintains historical integrity
    // and avoids dozens of unnecessary Firestore writes.

    return {
      squad: {
        ...state.squad,
        [teamKey]: state.squad[teamKey].filter(p => p.id !== playerId)
      }
    };
  }),

  setCalendarEvents: (eventsOrFn) => set((state) => {
    const newEvents = typeof eventsOrFn === 'function' ? eventsOrFn(state.squad.calendarEvents) : eventsOrFn;
    return {
      squad: { 
        ...state.squad, 
        calendarEvents: newEvents 
      }
    };
  }),

  updateEventStatus: (eventId, playerName, status, reason = '') => set((state) => {
    const { activeTeamId } = state;
    const updatedEvents = (state.squad.calendarEvents || []).map(event => {
      if (event.id === eventId) {
        const responses = { ...(event.responses || {}) };
        responses[playerName] = { status, reason, timestamp: new Date().toISOString() };
        const updatedEvent = { ...event, responses };
        
        if (activeTeamId) {
          syncService.saveEvent(activeTeamId, updatedEvent);
        }
        
        return updatedEvent;
      }
      return event;
    });
    return { squad: { ...state.squad, calendarEvents: updatedEvents } };
  }),

  addAbsence: (absence) => set((state) => ({
    squad: { ...state.squad, absences: [...(state.squad.absences || []), { ...absence, id: Date.now() }] }
  })),

  removeAbsence: (id) => set((state) => ({
    squad: { ...state.squad, absences: (state.squad.absences || []).filter(a => a.id !== id) }
  })),

  updateSubscriptions: (subsOrFn) => set((state) => {
    const { activeTeamId } = state;
    const newSubs = typeof subsOrFn === 'function' ? subsOrFn(state.squad.subscriptions) : subsOrFn;
    
    if (activeTeamId) {
      syncService.saveSubscriptions(activeTeamId, newSubs);
    }

    return {
      squad: { 
        ...state.squad, 
        subscriptions: newSubs
      }
    };
  }),

  updateSeries: (seriesOrFn) => set((state) => ({
    squad: { 
      ...state.squad, 
      series: typeof seriesOrFn === 'function' ? seriesOrFn(state.squad.series) : seriesOrFn 
    }
  })),

  setSquadData: (data) => set((state) => ({
    squad: { ...state.squad, ...data }
  })),
});
