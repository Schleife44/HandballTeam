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

  // SaaS OPTIMIZATION: Helper to generate a light-weight summary of a game
  // This summary stays in the 'history' collection for fast list/dashboard views.
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
        playerStats[pId] = { goals: 0, missed: 0, yellow: 0, suspensions: 0, red: 0 };
        playerNames[pId] = entry.playerName || `Spieler #${pId}`;
      }

      const action = (entry.action || "").toLowerCase();
      if (action.includes('tor')) playerStats[pId].goals++;
      else if (action.includes('fehlwurf') || action.includes('verworfen')) playerStats[pId].missed++;
      else if (action.includes('gelbe')) playerStats[pId].yellow++;
      else if (action.includes('2 min')) playerStats[pId].suspensions++;
      else if (action.includes('rote')) playerStats[pId].red++;
    });

    return { playerStats, playerNames };
  },

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
    
    // SaaS OPTIMIZATION: Only save to cloud on significant state changes
    const isStateChange = timerUpdate.phase !== undefined || timerUpdate.isPaused !== undefined;
    
    if (activeTeamId && updatedMatch && isStateChange) {
      syncService.saveMatch(activeTeamId, updatedMatch);
    }
    return { activeMatch: updatedMatch };
  }),

  addToMatchLog: (entry) => set((state) => {
    const { activeTeamId, activeMatch } = state;
    if (!activeMatch) return state;

    const enrichedEntry = {
      ...entry,
      id: entry.id || `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: entry.timestamp || new Date().toISOString()
    };

    if (activeTeamId) {
      syncService.recordAction(activeTeamId, enrichedEntry);
    }

    return {
      activeMatch: {
        ...activeMatch,
        gameLog: [enrichedEntry, ...(activeMatch.gameLog || [])]
      }
    };
  }),

  // Optimized combined action (Reduces writes and bandwidth)
  recordMatchAction: (entry, scoreUpdate = null) => set((state) => {
    const { activeTeamId, activeMatch } = state;
    if (!activeMatch) return state;

    const enrichedEntry = {
      ...entry,
      id: entry.id || `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: entry.timestamp || new Date().toISOString(),
      // Snapshotting for history integrity (Soft Delete support)
      playerNameSnapshot: entry.playerName || 'Unbekannt',
      playerNumberSnapshot: entry.playerNumber || '?'
    };

    const updatedMatch = {
      ...activeMatch,
      gameLog: [enrichedEntry, ...(activeMatch.gameLog || [])],
      score: scoreUpdate ? { home: scoreUpdate.home, away: scoreUpdate.away } : activeMatch.score
    };

    if (activeTeamId) {
      // ATOMIC SaaS OPTIMIZATION: Combine Log and Score into ONE write
      syncService.recordAction(activeTeamId, enrichedEntry, scoreUpdate ? updatedMatch : null);
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
      syncService.saveMatch(activeTeamId, { ...activeMatch, timer: { ...activeMatch.timer, phase: 'ENDED' } });
    }

    // SaaS OPTIMIZATION: Only store 'Light' version in local history state
    // Details will be fetched on-demand if needed.
    // We include a 'statsSummary' so dashboard/season views stay fast.
    const statsSummary = state.calculateGameSummary(archivedGame);
    const { gameLog, lineup, playingTime, ...lightGame } = archivedGame;

    return {
      history: [{ ...lightGame, statsSummary }, ...state.history],
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
      id: game.id ? String(game.id) : `h_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      season: game.season || currentSeason,
      timestamp: game.timestamp || new Date().toISOString()
    };

    const statsSummary = state.calculateGameSummary(gameWithSeason);
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

  setMatchData: (data) => set((state) => {
    const cloudPhase = data.timer?.gamePhase;
    const cloudIsRunning = data.timer?.isRunning ?? false;
    const cloudOffset = data.timer?.offsetSeconds || 0;
    const cloudStartTime = data.timer?.startTime;

    // TIMER INTERPOLATION: Accurate sync without frequent writes
    let interpolatedMs = cloudOffset * 1000;
    if (cloudIsRunning && cloudStartTime) {
      // startTime is handled as a plain JS number (ms) after hydration in SyncService
      const startMs = typeof cloudStartTime === 'number' ? cloudStartTime : (cloudStartTime?.toMillis ? cloudStartTime.toMillis() : new Date(cloudStartTime).getTime());
      interpolatedMs += Math.max(0, Date.now() - startMs);
    }

    if ((cloudPhase === 5 || !cloudPhase || cloudPhase === 1) && !state.activeMatch) {
      return { activeMatch: null };
    }

    let detectedPhase = 'PRE_GAME';
    if (cloudPhase === 5) detectedPhase = 'ENDED';
    else if (cloudPhase === 3) detectedPhase = 'HALF_TIME';
    else if (cloudPhase === 2) {
      detectedPhase = (interpolatedMs / 1000) < 1800 ? 'FIRST_HALF' : 'SECOND_HALF';
    } else if (cloudPhase === 1) detectedPhase = 'PRE_GAME';

    return {
      activeMatch: {
        ...state.activeMatch,
        mode: data.mode || state.activeMatch?.mode || 'SIMPLE',
        score: { home: data.score?.heim || 0, away: data.score?.gegner || 0 },
        gameLog: data.gameLog || [],
        lineup: data.lineup || state.activeMatch?.lineup || { home: [], away: [] },
        timer: { 
          elapsedMs: interpolatedMs,
          isPaused: !cloudIsRunning,
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
