import syncService from '../../services/SyncService';

export const initialMatchState = {
  activeMatch: null,
  history: [],
};

export const createMatchSlice = (set) => ({
  ...initialMatchState,

  setActiveMatch: (match) => set({ activeMatch: match }),
  
  initMatch: (mode) => set(() => ({
    activeMatch: {
      mode,
      score: { home: 0, away: 0 },
      timer: { elapsedMs: 0, isPaused: true, phase: 'PRE_GAME' },
      lineup: { home: [], away: [] },
      gameLog: [],
      suspensions: [],
      timeouts: { home: 3, away: 3 },
      playingTime: {},
      isEmptyGoal: false
    }
  })),

  tickPlayingTime: (playerIds) => set((state) => {
    if (!state.activeMatch || state.activeMatch.mode !== 'COMPLEX') return state;
    const pt = { ...(state.activeMatch.playingTime || {}) };
    playerIds.forEach(id => {
      pt[id] = (pt[id] || 0) + 1;
    });
    return {
      activeMatch: { ...state.activeMatch, playingTime: pt }
    };
  }),

  toggleEmptyGoal: () => set((state) => ({
    activeMatch: state.activeMatch ? {
      ...state.activeMatch,
      isEmptyGoal: !state.activeMatch.isEmptyGoal
    } : null
  })),

  useTimeout: (team) => set((state) => {
    if (!state.activeMatch || state.activeMatch.timeouts[team] <= 0) return state;
    return {
      activeMatch: {
        ...state.activeMatch,
        timeouts: {
          ...state.activeMatch.timeouts,
          [team]: state.activeMatch.timeouts[team] - 1
        },
        timer: { ...state.activeMatch.timer, isPaused: true }
      }
    };
  }),

  updateMatchScore: (home, away) => set((state) => {
    const { activeTeamId, activeMatch } = state;
    const updatedMatch = activeMatch ? { ...activeMatch, score: { home, away } } : null;
    if (activeTeamId && updatedMatch) {
      syncService.saveMatch(activeTeamId, updatedMatch);
    }
    return { activeMatch: updatedMatch };
  }),

  updateMatchLineup: (team, lineup) => set((state) => ({
    activeMatch: state.activeMatch ? {
      ...state.activeMatch,
      lineup: { ...state.activeMatch.lineup, [team]: lineup }
    } : null
  })),

  addMatchSuspension: (suspension) => set((state) => ({
    activeMatch: state.activeMatch ? {
      ...state.activeMatch,
      suspensions: [...state.activeMatch.suspensions, suspension]
    } : null
  })),

  updateMatchSuspensions: (suspensions) => set((state) => ({
    activeMatch: state.activeMatch ? {
      ...state.activeMatch,
      suspensions
    } : null
  })),

  updateMatchTimer: (timerUpdate) => set((state) => {
    const { activeTeamId, activeMatch } = state;
    const updatedMatch = activeMatch ? { ...activeMatch, timer: { ...activeMatch.timer, ...timerUpdate } } : null;
    // Debounce timer saves slightly if it's just a tick, but for phase changes save immediately
    if (activeTeamId && updatedMatch && (timerUpdate.phase || Math.random() > 0.95)) {
      syncService.saveMatch(activeTeamId, updatedMatch);
    }
    return { activeMatch: updatedMatch };
  }),

  addToMatchLog: (entry) => set((state) => {
    const { activeTeamId, activeMatch } = state;
    const updatedMatch = activeMatch ? {
      ...activeMatch,
      gameLog: [entry, ...(activeMatch.gameLog || [])]
    } : null;
    if (activeTeamId && updatedMatch) {
      syncService.saveMatch(activeTeamId, updatedMatch);
    }
    return { activeMatch: updatedMatch };
  }),

  finishMatch: () => set((state) => {
    const { activeTeamId, activeMatch } = state;
    if (!activeMatch) return state;
    const timestamp = new Date().toISOString();
    const gameId = activeMatch.id || `g_${Date.now()}`;
    const archivedGame = { 
      ...activeMatch, 
      id: gameId,
      timestamp 
    };
    
    if (activeTeamId) {
      syncService.saveHistoryGame(activeTeamId, archivedGame);
      // Mark live match as ended in cloud
      syncService.saveMatch(activeTeamId, { ...activeMatch, timer: { ...activeMatch.timer, phase: 'ENDED' } });
    }

    return {
      history: [archivedGame, ...state.history],
      activeMatch: null
    };
  }),

  // History Actions
  setHistory: (history) => set({ history }),
  addGameToHistory: (game) => set((state) => {
    const { activeTeamId, squad } = state;
    const currentSeason = squad?.settings?.currentSeason || '25/26';
    
    const gameWithSeason = { 
      ...game, 
      season: game.season || currentSeason,
      timestamp: game.timestamp || new Date().toISOString()
    };

    const newHistory = [gameWithSeason, ...state.history].sort((a, b) => {
      const getVal = (g) => {
        const dateStr = g.date || g.timestamp;
        if (dateStr) {
          const d = new Date(dateStr).getTime();
          if (!isNaN(d)) return d;
        }
        return 0;
      };
      return getVal(b) - getVal(a);
    });

    if (activeTeamId) {
      syncService.saveHistoryGame(activeTeamId, gameWithSeason);
    }

    return { history: newHistory };
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

  setMatchData: (data) => set((state) => {
    // Determine phase from cloud data (gamePhase: 1=PRE, 2=RUNNING, 3=HALFTIME, 5=FINISHED)
    const cloudPhase = data.timer?.gamePhase;
    const cloudSeconds = data.timer?.verstricheneSekundenBisher || 0;

    // If cloud says finished (5) or it's just a fresh/empty doc (phase 1) 
    // and we don't have an active match locally, don't force one.
    if ((cloudPhase === 5 || !cloudPhase || cloudPhase === 1) && !state.activeMatch) {
      return { activeMatch: null };
    }

    let detectedPhase = 'PRE_GAME';
    if (cloudPhase === 5) detectedPhase = 'ENDED';
    else if (cloudPhase === 3) detectedPhase = 'HALF_TIME';
    else if (cloudPhase === 2) {
      detectedPhase = cloudSeconds < 1800 ? 'FIRST_HALF' : 'SECOND_HALF';
    } else if (cloudPhase === 1) detectedPhase = 'PRE_GAME';

    return {
      activeMatch: {
        ...state.activeMatch,
        mode: data.mode || state.activeMatch?.mode || 'SIMPLE',
        score: { home: data.score?.heim || 0, away: data.score?.gegner || 0 },
        gameLog: data.gameLog || [],
        lineup: data.lineup || state.activeMatch?.lineup || { home: [], away: [] },
        timer: { 
          elapsedMs: cloudSeconds * 1000,
          isPaused: data.timer?.istPausiert ?? true,
          phase: detectedPhase
        },
        suspensions: data.activeSuspensions || [],
        timeouts: data.timeouts || state.activeMatch?.timeouts || { home: 3, away: 3 },
        isEmptyGoal: data.isEmptyGoal ?? state.activeMatch?.isEmptyGoal ?? false,
        playingTime: data.playingTime || state.activeMatch?.playingTime || {}
      }
    };
  }),
});
