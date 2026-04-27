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
    const updatedFines = {
      ...fines,
      history: [entry, ...fines.history]
    };
    if (activeTeamId) {
      syncService.saveFines(activeTeamId, updatedFines);
    }
    return { fines: updatedFines };
  }),

  updateFineHistory: (history) => set((state) => {
    const { activeTeamId, fines } = state;
    const updatedFines = { ...fines, history };
    if (activeTeamId) {
      syncService.saveFines(activeTeamId, updatedFines);
    }
    return { fines: updatedFines };
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
