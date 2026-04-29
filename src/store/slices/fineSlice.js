import syncService from '../../services/SyncService';

export const initialFineState = {
  fines: {
    catalog: [
      { id: 'f1', name: 'Zu spät (Training)', amount: 2 },
      { id: 'f2', name: 'Gelbe Karte', amount: 5 },
      { id: 'f3', name: '2-Minuten Strafe', amount: 2 },
      { id: 'f4', name: 'Handy in Kabine', amount: 10 }
    ],
    history: [],
    settings: {
      enabled: true,
      amountStandard: 15,
      amountReduced: 10,
      lastProcessedMonth: '', // YYYY-MM
      playerStatus: {} // playerName: 'standard' | 'reduced' | 'excluded'
    }
  }
};

export const createFineSlice = (set) => ({
  ...initialFineState,

  setFines: (fines) => set({ fines }),
  
  setFinesHistory: (history) => set((state) => ({
    fines: { ...state.fines, history }
  })),

  updateFinesSettings: (newSettings) => set((state) => {
    const { activeTeamId, fines } = state;
    const updatedFines = {
      ...fines,
      settings: { ...fines.settings, ...newSettings }
    };
    if (activeTeamId) {
      syncService.saveFines(activeTeamId, updatedFines);
    }
    return { fines: updatedFines };
  }),

  addFineToHistory: (entry) => set((state) => {
    const { activeTeamId, fines } = state;
    if (activeTeamId) {
      syncService.saveFineEntry(activeTeamId, entry);
    }
    return { 
      fines: { ...fines, history: [entry, ...fines.history] } 
    };
  }),

  updateFineHistory: (history) => set((state) => {
    const { activeTeamId, fines } = state;
    // SaaS OPTIMIZATION: If we update the whole list (e.g. bulk paid status), we should ideally do it granularly.
    // For now, if activeTeamId is present, we rely on the subscription to keep us in sync,
    // but we need to trigger the cloud updates for each changed item.
    if (activeTeamId) {
      history.forEach(entry => {
        const oldEntry = fines.history.find(h => h.id === entry.id);
        if (JSON.stringify(oldEntry) !== JSON.stringify(entry)) {
          syncService.saveFineEntry(activeTeamId, entry);
        }
      });
    }
    return { fines: { ...fines, history } };
  }),

  removeFineFromHistory: (fineId) => set((state) => {
    const { activeTeamId, fines } = state;
    if (activeTeamId) {
      syncService.deleteFineEntry(activeTeamId, fineId);
    }
    return {
      fines: { ...fines, history: fines.history.filter(f => f.id !== fineId) }
    };
  }),

  updateFineCatalog: (catalog) => set((state) => {
    const { activeTeamId, fines } = state;
    const updatedFines = { ...fines, catalog };
    if (activeTeamId) {
      syncService.saveFines(activeTeamId, updatedFines);
    }
    return { fines: updatedFines };
  }),

  setFinesData: (data) => set((state) => ({
    fines: {
      ...state.fines,
      catalog: data.catalog || state.fines.catalog,
      history: data.history || state.fines.history,
      settings: { ...state.fines.settings, ...data.settings },
      status: data.status || state.fines.status
    }
  })),
});
