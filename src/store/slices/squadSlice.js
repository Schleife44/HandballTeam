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
      myPlayerName: ''
    },
    calendarEvents: [],
    hiddenEventIds: [],
    absences: [],
    subscriptions: [],
    series: [],
    isHydrated: false
  }
};

export const createSquadSlice = (set) => ({
  ...initialSquadState,

  setHydrated: (val) => set((state) => ({
    squad: { ...state.squad, isHydrated: val }
  })),

  updateSettings: (newSettings) => set((state) => ({
    squad: {
      ...state.squad,
      settings: { ...state.squad.settings, ...newSettings }
    }
  })),

  setSquad: (newSquad) => set({ squad: newSquad }),

  removeEvent: (eventId) => set((state) => {
    const event = state.squad.calendarEvents.find(e => e.id === eventId);
    const hiddenIds = [...(state.squad.hiddenEventIds || [])];
    if (event && event.hnetGameId && !hiddenIds.includes(event.hnetGameId)) {
      hiddenIds.push(event.hnetGameId);
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
    const teamKey = team === 'home' ? 'home' : 'away';
    const newPlayer = {
      ...player,
      id: player.id || Date.now().toString()
    };
    return {
      squad: {
        ...state.squad,
        [teamKey]: [...(state.squad[teamKey] || []), newPlayer]
      }
    };
  }),

  updatePlayer: (team, playerId, updatedData) => set((state) => {
    const teamKey = team === 'home' ? 'home' : 'away';
    return {
      squad: {
        ...state.squad,
        [teamKey]: state.squad[teamKey].map(p => p.id === playerId ? { ...p, ...updatedData } : p)
      }
    };
  }),

  removePlayer: (team, playerId) => set((state) => {
    const teamKey = team === 'home' ? 'home' : 'away';
    return {
      squad: {
        ...state.squad,
        [teamKey]: state.squad[teamKey].filter(p => p.id !== playerId)
      }
    };
  }),

  setCalendarEvents: (eventsOrFn) => set((state) => ({
    squad: { 
      ...state.squad, 
      calendarEvents: typeof eventsOrFn === 'function' ? eventsOrFn(state.squad.calendarEvents) : eventsOrFn 
    }
  })),

  updateEventStatus: (eventId, playerName, status, reason = '') => set((state) => {
    const updatedEvents = (state.squad.calendarEvents || []).map(event => {
      if (event.id === eventId) {
        const responses = { ...(event.responses || {}) };
        responses[playerName] = { status, reason, timestamp: new Date().toISOString() };
        return { ...event, responses };
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

  updateSubscriptions: (subsOrFn) => set((state) => ({
    squad: { 
      ...state.squad, 
      subscriptions: typeof subsOrFn === 'function' ? subsOrFn(state.squad.subscriptions) : subsOrFn 
    }
  })),

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
