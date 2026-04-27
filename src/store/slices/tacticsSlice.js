export const initialTacticsState = {
  tacticsPlays: [],
};

export const createTacticsSlice = (set) => ({
  ...initialTacticsState,

  setTacticsPlays: (plays) => set({ tacticsPlays: plays }),
  addTacticsPlay: (play) => set((state) => ({ tacticsPlays: [...state.tacticsPlays, play] })),
  removeTacticsPlay: (id) => set((state) => ({ tacticsPlays: state.tacticsPlays.filter(p => p.id !== id) })),
});
