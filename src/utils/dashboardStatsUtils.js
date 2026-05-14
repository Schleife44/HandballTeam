/**
 * Dashboard Statistics Calculation Utilities
 */

export const extractEffectiveTeamId = (settings) => {
  if (!settings) return null;
  let effectiveTeamId = settings.teamId;
  if ((!effectiveTeamId || effectiveTeamId.length > 15) && settings.hnetUrl) {
    const fullUrl = settings.hnetUrl.trim().replace(/\/$/, '');
    const slugMatch = fullUrl.match(/mannschaften\/([^/?]+)/);
    effectiveTeamId = slugMatch ? slugMatch[1] : fullUrl.split('/').pop();
  }
  return effectiveTeamId;
};

export const formatUpcomingEvents = (calendarEvents, myName, settings) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const rawEvents = Array.isArray(calendarEvents) ? calendarEvents : Object.values(calendarEvents || {});

  return rawEvents
    .filter(e => {
      if (!e.date) return false;
      const eventDate = e.date instanceof Date ? e.date.toISOString().slice(0, 10) : String(e.date).slice(0, 10);
      return eventDate >= todayStr;
    })
    .sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date.toISOString() : String(a.date);
      const dateB = b.date instanceof Date ? b.date.toISOString() : String(b.date);
      return dateA.localeCompare(dateB);
    })
    .slice(0, 3) 
    .map(e => {
      const eventResponses = Object.values(e.responses || {});
      return {
        ...e,
        id: e.id,
        type: (e.type?.toUpperCase() === 'SPIEL' || e.type === 'game') ? 'SPIEL' : 
              (e.type?.toUpperCase() === 'TRAINING') ? 'TRAINING' : 'SONSTIGES',
        title: e.title || 'Termin',
        date: e.date ? new Date(e.date).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit' }) : 'TBA',
        time: e.time || 'TBA',
        meetingTime: e.meetingTime || '',
        rawDate: e.date,
        myStatus: e.responses?.[myName]?.status || null,
        attendees: { 
          going: eventResponses.filter(r => r?.status === 'going').length,
          maybe: eventResponses.filter(r => r?.status === 'maybe').length,
          declined: eventResponses.filter(r => r?.status === 'declined' || r?.status === 'not-going').length
        },
        deadlineDate: (() => {
          const deadlineHours = e.deadline !== undefined ? e.deadline : settings?.absageDeadline;
          if (!deadlineHours) return null;
          const [year, month, day] = (e.date instanceof Date ? e.date.toISOString().slice(0, 10) : String(e.date).slice(0, 10)).split('-');
          const [hours, minutes] = (e.time || '00:00').split(':');
          const eventDate = new Date(year, month - 1, day, hours, minutes);
          return new Date(eventDate.getTime() - deadlineHours * 60 * 60 * 1000).toISOString();
        })()
      };
    });
};

export const calculatePerformanceMetrics = (history, calendarEvents, effectiveTeamId, currentSettings) => {
  const now = new Date();
  const rawEvents = Array.isArray(calendarEvents) ? calendarEvents : Object.values(calendarEvents || {});
  const rawHistory = history || [];
  
  const pastCalendarGames = rawEvents.filter(e => 
    e.date && 
    (e.type === 'game' || e.type?.toUpperCase() === 'SPIEL') && 
    e.score && 
    (new Date(e.date) < now) &&
    !rawHistory.some(h => h.hnetGameId === e.hnetGameId)
  );

  const allGames = [...rawHistory, ...pastCalendarGames]
    .filter(g => !g.isNeutral)
    .sort((a, b) => {
      const timeA = new Date(a.date || a.timestamp || 0).getTime();
      const timeB = new Date(b.date || b.timestamp || 0).getTime();
      return timeA - timeB;
    });

  let goals = 0, conceded = 0, wins = 0;
  let recentGoals = 0, recentConceded = 0, recentWins = 0;
  const playerGoals = {};
  const playerNames = {};

  const chartData = allGames.map((g, idx) => {
    let isHome = true;
    const myTeamName = (currentSettings.homeName || "").toLowerCase().trim();
    const hName = (g.teamHome || g.teams?.heim || "").toLowerCase().trim();
    const aName = (g.teamAway || g.teams?.gegner || "").toLowerCase().trim();

    if (g.hnetGameId && g.homeTeamId && effectiveTeamId && String(g.homeTeamId) === String(effectiveTeamId)) isHome = true;
    else if (g.hnetGameId && g.awayTeamId && effectiveTeamId && String(g.awayTeamId) === String(effectiveTeamId)) isHome = false;
    else if (myTeamName && hName && (hName.includes(myTeamName) || myTeamName.includes(hName))) isHome = true;
    else if (myTeamName && aName && (aName.includes(myTeamName) || myTeamName.includes(aName))) isHome = false;
    else if (g.settings?.isAuswaertsspiel !== undefined) isHome = !g.settings.isAuswaertsspiel;
    else if (g.isAuswaerts !== undefined) isHome = !g.isAuswaerts;

    const gScore = isHome 
      ? (g.scoreHome ?? g.score?.home ?? g.score?.heim ?? 0) 
      : (g.scoreAway ?? g.score?.away ?? g.score?.gegner ?? 0);
    const oScore = isHome 
      ? (g.scoreAway ?? g.score?.away ?? g.score?.gegner ?? 0) 
      : (g.scoreHome ?? g.score?.home ?? g.score?.heim ?? 0);

    goals += gScore;
    conceded += oScore;
    if (gScore > oScore) wins++;

    if (idx >= allGames.length - 3) {
      recentGoals += gScore;
      recentConceded += oScore;
      if (gScore > oScore) recentWins++;
    }

    // Player stats processing
    if (g.statsSummary?.playerStats) {
      Object.entries(g.statsSummary.playerStats).forEach(([id, s]) => {
        if (s.goals > 0) {
          playerGoals[id] = (playerGoals[id] || 0) + s.goals;
          if (g.statsSummary.playerNames[id]) playerNames[id] = g.statsSummary.playerNames[id];
        }
      });
    } else {
      g.roster?.forEach(p => { if (p.number && p.name) playerNames[p.number] = p.name; });
      g.gameLog?.forEach(evt => {
        const action = (evt.action || "").toLowerCase();
        if (!action.startsWith('gegner') && evt.playerId && (action.includes('tor') || action.includes('goal'))) {
          playerGoals[evt.playerId] = (playerGoals[evt.playerId] || 0) + 1;
          if (evt.playerName) playerNames[evt.playerId] = evt.playerName;
        }
      });
    }

    return { name: `S${idx + 1}`, goals: gScore, conceded: oScore };
  });

  const topPerformers = Object.keys(playerGoals).map(id => ({
    id, name: playerNames[id], goals: playerGoals[id]
  })).sort((a, b) => b.goals - a.goals).slice(0, 5);

  const overallAvgGoals = allGames.length ? goals / allGames.length : 0;
  const recentGamesCount = Math.min(3, allGames.length);
  const recentAvgGoals = recentGamesCount ? recentGoals / recentGamesCount : 0;
  const goalsTrend = overallAvgGoals ? Math.round(((recentAvgGoals - overallAvgGoals) / overallAvgGoals) * 100) : 0;

  const overallAvgConceded = allGames.length ? conceded / allGames.length : 0;
  const recentAvgConceded = recentGamesCount ? recentConceded / recentGamesCount : 0;
  const concededTrend = overallAvgConceded ? Math.round(((recentAvgConceded - overallAvgConceded) / overallAvgConceded) * 100) : 0;

  const overallWinRate = allGames.length ? (wins / allGames.length) * 100 : 0;
  const recentWinRate = recentGamesCount ? (recentWins / recentGamesCount) * 100 : 0;
  const winRateTrend = Math.round(recentWinRate - overallWinRate);

  return {
    totalGoals: goals,
    totalConceded: conceded,
    winRate: Math.round(overallWinRate),
    avgGoals: overallAvgGoals.toFixed(1),
    goalsTrend,
    concededTrend,
    winRateTrend,
    chartData,
    topPerformers
  };
};

export const findTodaysGame = (calendarEvents) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const rawEvents = Array.isArray(calendarEvents) ? calendarEvents : Object.values(calendarEvents || {});
  const todaysGame = rawEvents.find(e => {
    if (!e.date) return false;
    const eventDate = e.date instanceof Date ? e.date.toISOString().slice(0, 10) : String(e.date).slice(0, 10);
    return eventDate === todayStr && (e.type?.toUpperCase() === 'SPIEL' || e.type === 'game') && !e.isCancelled;
  });

  return todaysGame ? {
    id: todaysGame.id || `temp_${Date.now()}`,
    title: todaysGame.title || 'Neues Spiel',
    hnetGameId: todaysGame.hnetGameId || (todaysGame.id?.includes('hnet_') ? todaysGame.id.replace('hnet_', '') : null),
    opponent: (todaysGame.title || "").includes('vs.') ? todaysGame.title.split('vs. ')[1] : 
              (todaysGame.title || "").includes(' - ') ? todaysGame.title.split(' - ')[1] : 
              (todaysGame.title || 'Gegner'),
    time: todaysGame.time || '--:--',
    responses: todaysGame.responses || {}
  } : null;
};
