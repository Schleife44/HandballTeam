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
    chartData: [],
    topPerformers: [],
    upcomingEvents: [],
    leagueTable: null,
    loadingTable: false
  });

  const loadData = useCallback(async () => {
    try {
      const currentSettings = settings || {};
      const teamId = currentSettings.teamId;
      const myName = activeMember?.playerName;

      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);
      
      const rawEvents = Array.isArray(calendarEvents) ? calendarEvents : Object.values(calendarEvents || {});
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
        .map(e => ({
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
            going: Object.values(e.responses || {}).filter(r => r?.status === 'going').length,
            maybe: Object.values(e.responses || {}).filter(r => r?.status === 'maybe').length,
            declined: Object.values(e.responses || {}).filter(r => r?.status === 'declined' || r?.status === 'not-going').length
          }
        }));

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
      const playerGoals = {};
      const playerNames = {};

      const chartData = allGames.map((g, idx) => {
        let gScore = 0;
        let oScore = 0;

        let isHome = true;
        if (g.hnetGameId && g.homeTeamId) {
          isHome = g.homeTeamId === teamId;
        } else if (g.settings?.isAuswaertsspiel !== undefined) {
          isHome = !g.settings.isAuswaertsspiel;
        } else if (g.isAuswaerts !== undefined) {
          isHome = !g.isAuswaerts;
        }

        gScore = isHome ? (g.score?.home || g.score?.heim || 0) : (g.score?.away || g.score?.gegner || 0);
        oScore = isHome ? (g.score?.away || g.score?.gegner || 0) : (g.score?.home || g.score?.heim || 0);

        goals += gScore;
        conceded += oScore;
        if (gScore > oScore) wins++;

        if (g.roster || g.gameLog) {
          g.roster?.forEach(p => { if (p.number && p.name) playerNames[p.number] = p.name; });
          g.gameLog?.forEach(evt => {
            const isGoal = evt.action?.toLowerCase().includes('tor') || 
                          evt.type?.toLowerCase().includes('goal') ||
                          evt.action === 'GOAL';
            
            if (!evt.action?.startsWith('Gegner') && evt.playerId && isGoal) {
              playerGoals[evt.playerId] = (playerGoals[evt.playerId] || 0) + 1;
            }
          });
        }

        return { name: `S${idx + 1}`, goals: gScore, conceded: oScore };
      });

      const top = Object.keys(playerGoals).map(id => ({
        id, name: playerNames[id], goals: playerGoals[id]
      })).sort((a, b) => b.goals - a.goals).slice(0, 5);

      // INITIAL UPDATE with local data
      setStats(prev => ({
        ...prev,
        totalGoals: goals,
        totalConceded: conceded,
        winRate: allGames.length ? Math.round((wins/allGames.length)*100) : 0,
        avgGoals: allGames.length ? (goals/allGames.length).toFixed(1) : 0,
        chartData,
        topPerformers: top,
        upcomingEvents: upcoming,
        loadingTable: !!teamId // Show loading only if we have a teamId to fetch
      }));

      // ASYNC FETCH for league table (doesn't block the rest)
      if (teamId) {
        try {
          const res = await fetchTeamTable(teamId);
          if (res && res.table && res.table.rows) {
            const leagueData = res.table.rows.map(row => ({
              rank: row.position,
              team: row.team?.name || '?',
              games: row.games,
              diff: row.goalDiff,
              points: row.points,
              isMyTeam: row.team?.id === teamId
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
