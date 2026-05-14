import syncService from '../../services/SyncService';

export const initialHistoryState = {
  history: [],
};

export const createHistorySlice = (set, get) => ({
  ...initialHistoryState,

  calculateGameSummary: (game) => {
    if (!game) return null;
    const log = game.gameLog || game.log || [];
    const playerStats = {};
    const playerNames = {};

    log.forEach(entry => {
      if (entry.action?.startsWith('Gegner') || entry.isOpponent === true) return;
      
      const pId = entry.playerId || entry.playerNumber || entry.number;
      if (!pId) return;

      if (!playerStats[pId]) {
        playerStats[pId] = { goals: 0, missed: 0, yellow: 0, suspensions: 0, red: 0, sevenMeterGoals: 0, sevenMeterTotal: 0 };
        playerNames[pId] = entry.playerName || `Spieler #${pId}`;
      }

      const action = (entry.action || "").toLowerCase();
      const type = (entry.type || "").toUpperCase();

      const is7m = type.includes('7M') || action.includes('7m');
      const isGoal = type.includes('GOAL') || action.includes('tor') || action.includes('goal');
      const isMiss = type.includes('MISS') || type.includes('SAVE') || type.includes('BLOCKED') || 
                     action.includes('fehlwurf') || action.includes('miss') || action.includes('verworfen') || 
                     action.includes('gehalten') || action.includes('block');

      if (isGoal) playerStats[pId].goals++;
      else if (isMiss) playerStats[pId].missed++;

      if (is7m) {
        playerStats[pId].sevenMeterTotal++;
        if (isGoal) playerStats[pId].sevenMeterGoals++;
      }

      if (type === 'YELLOW' || action.includes('gelbe')) playerStats[pId].yellow++;
      else if (type === 'SUSPENSION' || action.includes('2 min')) playerStats[pId].suspensions++;
      else if (type === 'RED' || action.includes('rote')) playerStats[pId].red++;
    });

    return { playerStats, playerNames };
  },

  setHistory: (history) => set({ history }),

  addGameToHistory: (game) => set((state) => {
    const { activeTeamId, squad } = state;
    const currentSeason = squad?.settings?.currentSeason || '25/26';
    
    const gameWithSeason = { 
      ...game, 
      id: game.id ? String(game.id) : `h_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      season: game.season || currentSeason,
      timestamp: game.timestamp || new Date().toISOString()
    };

    const statsSummary = get().calculateGameSummary(gameWithSeason);
    const { gameLog, lineup, playingTime, ...lightGame } = gameWithSeason;
    const finalLightGame = { ...lightGame, statsSummary };

    if (activeTeamId) {
      syncService.saveHistoryGame(activeTeamId, { ...gameWithSeason, statsSummary });
    }

    return { history: [finalLightGame, ...state.history].sort((a, b) => {
      const getVal = (g) => {
        const dateStr = g.date || g.timestamp;
        if (dateStr) {
          const d = new Date(dateStr).getTime();
          if (!isNaN(d)) return d;
        }
        return 0;
      };
      return getVal(b) - getVal(a);
    }) };
  }),

  deleteGameFromHistory: (idOrKey) => set((state) => {
    const { activeTeamId } = state;
    if (activeTeamId) {
      syncService.deleteHistoryGame(activeTeamId, idOrKey);
    }
    return {
      history: state.history.filter(g => 
        g.id !== idOrKey && 
        g.timestamp !== idOrKey && 
        g.date !== idOrKey
      )
    };
  }),

  updateHistoryGame: (updatedGame) => set((state) => {
    const { activeTeamId } = state;
    if (activeTeamId) {
      syncService.saveHistoryGame(activeTeamId, updatedGame);
    }
    return {
      history: state.history.map(g => g.id === updatedGame.id ? updatedGame : g)
    };
  }),
});
