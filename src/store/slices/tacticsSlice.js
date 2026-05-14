import syncService from '../../services/SyncService';

export const initialTacticsState = {
  tacticsPlays: [],
};

export const createTacticsSlice = (set, get) => ({
  ...initialTacticsState,

  setTacticsPlays: (plays) => set({ tacticsPlays: plays }),
  
  addTacticsPlay: (play) => {
    const { activeTeamId } = get();
    console.log('[Tactics] addTacticsPlay called. Team:', activeTeamId, 'Play:', play.id);
    
    if (activeTeamId) {
      syncService.saveTacticsPlay(activeTeamId, play);
    } else {
      console.warn('[Tactics] No activeTeamId found, play only saved locally.');
    }
    
    set((state) => ({ tacticsPlays: [...state.tacticsPlays, play] }));
  },

  removeTacticsPlay: (id) => {
    const { activeTeamId } = get();
    console.log('[Tactics] removeTacticsPlay called. Team:', activeTeamId, 'ID:', id);
    
    if (activeTeamId) {
      syncService.deleteTacticsPlay(activeTeamId, id);
    }
    
    set((state) => ({ tacticsPlays: state.tacticsPlays.filter(p => p.id !== id) }));
  },
});
