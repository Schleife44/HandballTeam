import { useState, useEffect, useCallback } from 'react';
import useStore from '../store/useStore';
import { fetchTeamTable } from '../services/handballNetService';

export function useDashboardStats() {
  const { squad, history, activeMember } = useStore();
  const currentSquad = squad || { settings: {}, calendarEvents: [] };
  const settings = currentSquad.settings || {};
  const calendarEvents = currentSquad.calendarEvents || [];

  const [stats, setStats] = useState({
    totalGoals: 0,
    totalConceded: 0,
    winRate: 0,
    avgGoals: 0,
    goalsTrend: 0,
    concededTrend: 0,
    winRateTrend: 0,
    chartData: [],
    topPerformers: [],
    upcomingEvents: [],
    leagueTable: null,
    loadingTable: false
  });

  const loadData = useCallback(async () => {
    try {
      const currentSettings = settings || {};
      let effectiveTeamId = currentSettings.teamId;
      
      // If teamId is missing OR looks like a Firebase ID (long string), fallback to URL extraction
      if ((!effectiveTeamId || effectiveTeamId.length > 15) && currentSettings.hnetUrl) {
        const fullId = currentSettings.hnetUrl.trim().replace(/\/$/, '');
        effectiveTeamId = (fullId.match(/(\d+)$/) || [])[1] || fullId.split('/').pop();
      }
      
      const myName = activeMember?.playerName;

      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);
      
      const rawEvents = Array.isArray(calendarEvents) ? calendarEvents : Object.values(calendarEvents || {});
      const rosterNames = new Set((squad?.home || []).map(p => p.name).filter(Boolean));

      const upcoming = rawEvents
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
          const eventResponses = Object.entries(e.responses || {})
            .filter(([name]) => rosterNames.has(name))
            .map(([_, r]) => r);

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
            }
          };
        });

      // Calculate local stats
      const rawHistory = history || [];
      const pastCalendarGames = rawEvents.filter(e => 
        (e.type === 'game' || e.type?.toUpperCase() === 'SPIEL') && 
        e.score && 
        (new Date(e.date) < now) &&
        !rawHistory.some(h => h.hnetGameId === e.hnetGameId)
      );

      const allGames = [...rawHistory, ...pastCalendarGames].sort((a, b) => {
        const timeA = new Date(a.date || a.timestamp || 0).getTime();
        const timeB = new Date(b.date || b.timestamp || 0).getTime();
        return timeA - timeB;
      });

      let goals = 0, conceded = 0, wins = 0;
      let recentGoals = 0, recentConceded = 0, recentWins = 0;
      const playerGoals = {};
      const playerNames = {};

      const chartData = allGames.map((g, idx) => {
        let gScore = 0;
        let oScore = 0;

        let isHome = true;
        const myTeamName = (currentSettings.homeName || "").toLowerCase().trim();
        const hName = (g.teamHome || g.teams?.heim || "").toLowerCase().trim();
        const aName = (g.teamAway || g.teams?.gegner || "").toLowerCase().trim();

        if (g.hnetGameId && g.homeTeamId && effectiveTeamId && String(g.homeTeamId) === String(effectiveTeamId)) {
          isHome = true;
        } else if (g.hnetGameId && g.awayTeamId && effectiveTeamId && String(g.awayTeamId) === String(effectiveTeamId)) {
          isHome = false;
        } else if (myTeamName && hName && (hName.includes(myTeamName) || myTeamName.includes(hName))) {
          isHome = true;
        } else if (myTeamName && aName && (aName.includes(myTeamName) || myTeamName.includes(aName))) {
          isHome = false;
        } else if (g.settings?.isAuswaertsspiel !== undefined) {
          isHome = !g.settings.isAuswaertsspiel;
        } else if (g.isAuswaerts !== undefined) {
          isHome = !g.isAuswaerts;
        }

        gScore = isHome 
          ? (g.scoreHome ?? g.score?.home ?? g.score?.heim ?? 0) 
          : (g.scoreAway ?? g.score?.away ?? g.score?.gegner ?? 0);
        oScore = isHome 
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

        if (g.statsSummary && g.statsSummary.playerStats) {
          const { playerStats, playerNames: pNames } = g.statsSummary;
          Object.entries(playerStats).forEach(([id, s]) => {
            if (s.goals > 0) {
              playerGoals[id] = (playerGoals[id] || 0) + s.goals;
              if (pNames[id]) playerNames[id] = pNames[id];
            }
          });
        } else if (g.roster || g.gameLog) {
          g.roster?.forEach(p => { if (p.number && p.name) playerNames[p.number] = p.name; });
          g.gameLog?.forEach(evt => {
            const action = (evt.action || "").toLowerCase();
            const isGoal = action.includes('tor') || action.includes('goal');
            
            if (!action.startsWith('gegner') && evt.playerId && isGoal) {
              playerGoals[evt.playerId] = (playerGoals[evt.playerId] || 0) + 1;
              if (evt.playerName) playerNames[evt.playerId] = evt.playerName;
            }
          });
        }

        return { name: `S${idx + 1}`, goals: gScore, conceded: oScore };
      });

      const top = Object.keys(playerGoals).map(id => ({
        id, name: playerNames[id], goals: playerGoals[id]
      })).sort((a, b) => b.goals - a.goals).slice(0, 5);

      // Trend Calculations (Last 3 games vs Overall)
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

      // INITIAL UPDATE with local data
      setStats(prev => ({
        ...prev,
        totalGoals: goals,
        totalConceded: conceded,
        winRate: Math.round(overallWinRate),
        avgGoals: overallAvgGoals.toFixed(1),
        goalsTrend,
        concededTrend,
        winRateTrend,
        chartData,
        topPerformers: top,
        upcomingEvents: upcoming,
        loadingTable: !!effectiveTeamId // Show loading only if we have a teamId to fetch
      }));

      // ASYNC FETCH for league table (doesn't block the rest)
      if (effectiveTeamId) {
        try {
          const res = await fetchTeamTable(effectiveTeamId);
          if (res && res.table && res.table.rows) {
            const leagueData = res.table.rows.map(row => ({
              rank: row.position,
              team: row.team?.name || '?',
              games: row.games,
              diff: row.goalDiff,
              points: row.points,
              isMyTeam: String(row.team?.id) === String(effectiveTeamId)
            }));
            setStats(prev => ({ ...prev, leagueTable: leagueData, loadingTable: false }));
          } else {
            setStats(prev => ({ ...prev, loadingTable: false }));
          }
        } catch (e) { 
          console.error(e); 
          setStats(prev => ({ ...prev, loadingTable: false }));
        }
      }
    } catch (e) { console.error(e); }
  }, [settings?.teamId, calendarEvents?.length, history?.length, activeMember?.playerName]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { stats, settings };
}
