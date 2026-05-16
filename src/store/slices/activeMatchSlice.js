import syncService from '../../services/SyncService';

export const initialActiveMatchState = {
  activeMatch: null,
};

export const createActiveMatchSlice = (set, get) => ({
  ...initialActiveMatchState,

  setActiveMatch: (match) => set({ activeMatch: match }),
  
  initMatch: (mode, isZoneMode = false, additionalData = {}) => set((state) => {
    const isNeutral = !!additionalData.customHomeName || !!additionalData.isNeutral;
    
    const filterFn = (p) => {
      const isTemp = p.isTemporary || 
                     p.id?.startsWith('quick_') || 
                     p.id?.startsWith('opp_') || 
                     p.id?.startsWith('neutral_') ||
                     p.id?.startsWith('guest_');
      return !isTemp;
    };

    const cleanHome = (state.squad?.home || []).filter(filterFn);
    const cleanAway = (state.squad?.away || []).filter(filterFn);

    return {
      squad: { ...state.squad, home: cleanHome, away: cleanAway },
      activeMatch: {
        mode,
        isZoneMode,
        isNeutral,
        score: { home: 0, away: 0 },
        timer: { elapsedMs: 0, isPaused: true, phase: 'PRE_GAME' },
        lineup: { home: [], away: [] },
        gameLog: [],
        suspensions: [],
        timeouts: { home: 3, away: 3 },
        playingTime: {},
        isEmptyGoal: false,
        activeGoalkeeperId: null,
        ...additionalData
      }
    };
  }),

  tickMatch: (delta, playerIds = []) => set((state) => {
    const { activeMatch } = state;
    if (!activeMatch || activeMatch.timer.isPaused) return state;

    const newElapsedMs = activeMatch.timer.elapsedMs + delta;
    const oldSec = Math.floor(activeMatch.timer.elapsedMs / 1000);
    const newSec = Math.floor(newElapsedMs / 1000);
    const secondFlipped = newSec > oldSec;

    let updatedMatch = {
      ...activeMatch,
      timer: { ...activeMatch.timer, elapsedMs: newElapsedMs }
    };

    if (secondFlipped) {
      if (activeMatch.suspensions?.length > 0) {
        updatedMatch.suspensions = activeMatch.suspensions
          .map(s => {
            const remaining = Math.max(0, Math.ceil((s.endTimestampMs - newElapsedMs) / 1000));
            return { ...s, remainingSeconds: remaining };
          })
          .filter(s => s.remainingSeconds > 0);
      }

      if (activeMatch.mode === 'COMPLEX' && playerIds.length > 0) {
        const pt = { ...(activeMatch.playingTime || {}) };
        playerIds.forEach(id => {
          pt[id] = (pt[id] || 0) + 1;
        });
        updatedMatch.playingTime = pt;
      }
    }

    return { activeMatch: updatedMatch };
  }),

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

  setActiveGoalkeeper: (playerId) => set((state) => {
    const { activeTeamId, activeMatch } = state;
    if (!activeMatch) return state;
    const updatedMatch = { 
      ...activeMatch, 
      activeGoalkeeperId: playerId === activeMatch.activeGoalkeeperId ? null : playerId 
    };
    if (activeTeamId) {
      syncService.saveMatch(activeTeamId, updatedMatch);
    }
    return { activeMatch: updatedMatch };
  }),

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

  addMatchSuspension: (suspension) => set((state) => {
    const { activeTeamId, activeMatch } = state;
    if (!activeMatch) return state;

    const durationMs = 120 * 1000;
    const endTimestampMs = activeMatch.timer.elapsedMs + durationMs;

    const updatedMatch = {
      ...activeMatch,
      suspensions: [...(activeMatch.suspensions || []), { 
        ...suspension, 
        endTimestampMs,
        remainingSeconds: 120 
      }]
    };
    
    if (activeTeamId) {
      syncService.saveMatch(activeTeamId, updatedMatch);
    }
    return { activeMatch: updatedMatch };
  }),

  updateMatchSuspensions: (suspensions) => set((state) => {
    const { activeMatch } = state;
    return {
      activeMatch: activeMatch ? {
        ...activeMatch,
        suspensions
      } : null
    };
  }),

  updateMatchTimer: (timerUpdate) => set((state) => {
    const { activeTeamId, activeMatch } = state;
    const updatedMatch = activeMatch ? { ...activeMatch, timer: { ...activeMatch.timer, ...timerUpdate } } : null;
    
    const phaseChanged = timerUpdate.phase !== undefined && timerUpdate.phase !== activeMatch?.timer?.phase;
    const pauseChanged = timerUpdate.isPaused !== undefined && timerUpdate.isPaused !== activeMatch?.timer?.isPaused;
    const isStateChange = phaseChanged || pauseChanged;
    
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

  recordMatchAction: (entry, scoreUpdate = null) => set((state) => {
    const { activeTeamId, activeMatch } = state;
    if (!activeMatch) return state;

    const enrichedEntry = {
      ...entry,
      id: entry.id || `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: entry.timestamp || new Date().toISOString(),
      playerNameSnapshot: entry.playerName || 'Unbekannt',
      playerNumberSnapshot: entry.playerNumber || '?'
    };

    const updatedMatch = {
      ...activeMatch,
      gameLog: [enrichedEntry, ...(activeMatch.gameLog || [])],
      score: scoreUpdate ? { home: scoreUpdate.home, away: scoreUpdate.away } : activeMatch.score
    };

    if (activeTeamId) {
      syncService.recordAction(activeTeamId, enrichedEntry, scoreUpdate ? updatedMatch : null);
    }

    return { activeMatch: updatedMatch };
  }),

  finishMatch: () => set((state) => {
    const { activeTeamId, activeMatch, history, squad } = state;
    if (!activeMatch) return state;
    const timestamp = new Date().toISOString();
    const date = timestamp.slice(0, 10);
    const gameId = activeMatch.id || `g_${Date.now()}`;
    const currentSeason = squad?.settings?.currentSeason || '25/26';
    const archivedGame = { 
      ...activeMatch, 
      id: gameId,
      timestamp,
      date: activeMatch.date || date,
      season: activeMatch.season || currentSeason,
      teamHome: activeMatch.customHomeName || activeMatch.teamHome || squad?.settings?.homeName || 'Heim',
      teamAway: activeMatch.customAwayName || activeMatch.teamAway || squad?.settings?.awayName || 'Gast',
      scoreHome: activeMatch.score.home,
      scoreAway: activeMatch.score.away
    };
    
    if (activeTeamId) {
      syncService.saveHistoryGame(activeTeamId, archivedGame);
      syncService.deleteCurrentMatch(activeTeamId);
    }

    // Call calculateGameSummary from history slice
    const statsSummary = get().calculateGameSummary(archivedGame);
    const { gameLog, lineup, playingTime, ...lightGame } = archivedGame;

    const filterFn = (p) => {
      const isTemp = p.isTemporary || 
                     p.id?.startsWith('quick_') || 
                     p.id?.startsWith('opp_') || 
                     p.id?.startsWith('neutral_') ||
                     p.id?.startsWith('guest_');
      return !isTemp;
    };

    const cleanHome = (squad?.home || []).filter(filterFn);
    const cleanAway = (squad?.away || []).filter(filterFn);

    return {
      history: [{ ...lightGame, statsSummary }, ...history],
      activeMatch: null,
      squad: { ...squad, home: cleanHome, away: cleanAway }
    };
  }),

  setMatchData: (data) => set((state) => {
    const cloudPhase = data.timer?.gamePhase;
    const cloudIsRunning = data.timer?.isRunning ?? false;
    const cloudOffset = (data.timer?.elapsedMs || 0) / 1000;
    const cloudStartTime = data.timer?.startTime;

    let interpolatedMs = cloudOffset * 1000;
    if (cloudIsRunning && cloudStartTime) {
      const startMs = typeof cloudStartTime === 'number' ? cloudStartTime : (cloudStartTime?.toMillis ? cloudStartTime.toMillis() : new Date(cloudStartTime).getTime());
      interpolatedMs += Math.max(0, Date.now() - startMs);
    }

    if (state.activeMatch?.timer && !state.activeMatch.timer.isPaused) {
      const diff = Math.abs(state.activeMatch.timer.elapsedMs - interpolatedMs);
      if (diff < 2000) {
        interpolatedMs = state.activeMatch.timer.elapsedMs;
      }
    }

    if (!state.activeMatch && !data.score && !data.timer && !data.gameLog?.length) {
      return state;
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
        score: { 
          home: data.score?.home ?? 0, 
          away: data.score?.away ?? 0 
        },
        gameLog: data.gameLog || [],
        lineup: data.lineup || state.activeMatch?.lineup || { home: [], away: [] },
        timer: { 
          elapsedMs: interpolatedMs,
          isPaused: !cloudIsRunning,
          phase: data.timer?.phase || detectedPhase,
          startTime: cloudStartTime,
          offsetSeconds: cloudOffset
        },
        suspensions: data.suspensions || [],
        timeouts: data.timeouts || state.activeMatch?.timeouts || { home: 3, away: 3 },
        isEmptyGoal: data.isEmptyGoal ?? state.activeMatch?.isEmptyGoal ?? false,
        playingTime: data.playingTime || state.activeMatch?.playingTime || {},
        isZoneMode: data.isZoneMode ?? state.activeMatch?.isZoneMode ?? false,
        activeGoalkeeperId: data.activeGoalkeeperId !== undefined ? data.activeGoalkeeperId : state.activeMatch?.activeGoalkeeperId || null
      }
    };
  }),
});

