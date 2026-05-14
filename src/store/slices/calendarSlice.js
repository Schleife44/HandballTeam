import syncService from '../../services/SyncService';

export const initialCalendarState = {
  squad: {
    calendarEvents: [],
    hiddenEventIds: [],
    absences: [],
    subscriptions: [],
    series: [],
  }
};

export const createCalendarSlice = (set, get) => ({
  setCalendarEvents: (eventsOrFn) => set((state) => {
    const newEvents = typeof eventsOrFn === 'function' ? eventsOrFn(state.squad.calendarEvents) : eventsOrFn;
    return { squad: { ...state.squad, calendarEvents: newEvents } };
  }),

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

  removeEventResponse: (eventId, playerName) => set((state) => {
    const { activeTeamId } = state;
    const updatedEvents = (state.squad.calendarEvents || []).map(event => {
      if (event.id === eventId) {
        const responses = { ...(event.responses || {}) };
        delete responses[playerName];
        const updatedEvent = { ...event, responses };
        
        if (activeTeamId) {
          syncService.deleteEventResponse(activeTeamId, eventId, playerName);
        }
        return updatedEvent;
      }
      return event;
    });
    return { squad: { ...state.squad, calendarEvents: updatedEvents } };
  }),

  toggleEventCancellation: (eventId) => set((state) => {
    const { activeTeamId } = state;
    const updatedEvents = (state.squad.calendarEvents || []).map(event => {
      if (event.id === eventId) {
        const isCancelled = !event.isCancelled;
        const updatedEvent = { ...event, isCancelled };
        
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
    return { squad: { ...state.squad, subscriptions: newSubs } };
  }),

  updateSeries: (seriesOrFn) => set((state) => ({
    squad: { 
      ...state.squad, 
      series: typeof seriesOrFn === 'function' ? seriesOrFn(state.squad.series) : seriesOrFn 
    }
  })),

  setCalendarData: (data) => set((state) => ({
    squad: { ...state.squad, ...data }
  })),
});
