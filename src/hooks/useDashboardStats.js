import { useState, useEffect, useCallback } from 'react';
import useStore from '../store/useStore';
import { fetchTeamTable } from '../services/handballNetService';
import { 
  extractEffectiveTeamId, 
  formatUpcomingEvents, 
  calculatePerformanceMetrics, 
  findTodaysGame 
} from '../utils/dashboardStatsUtils';

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
    todaysGame: null,
    leagueTable: null,
    loadingTable: false
  });

  const loadData = useCallback(async () => {
    try {
      const effectiveTeamId = extractEffectiveTeamId(settings);
      const myName = activeMember?.playerName;

      // 1. Upcoming Events
      const upcoming = formatUpcomingEvents(calendarEvents, myName, settings);

      // 2. Performance Metrics
      const metrics = calculatePerformanceMetrics(history, calendarEvents, effectiveTeamId, settings);

      // 3. Today's Game
      const todaysGameFormatted = findTodaysGame(calendarEvents);

      // INITIAL UPDATE with local data
      setStats(prev => ({
        ...prev,
        ...metrics,
        upcomingEvents: upcoming,
        todaysGame: todaysGameFormatted,
        loadingTable: !!effectiveTeamId
      }));

      // ASYNC FETCH for league table
      if (effectiveTeamId) {
        try {
          const res = await fetchTeamTable(effectiveTeamId);
          if (res && res.table && res.table.rows) {
            const leagueData = res.table.rows.map(row => {
              let goalDiff = row.goalDiff ?? row.goalDifference ?? row.diff ?? 0;
              if (goalDiff === 0 && row.goalsPlus !== undefined && row.goalsMinus !== undefined) {
                goalDiff = row.goalsPlus - row.goalsMinus;
              }
              return {
                rank: row.position,
                team: row.team?.name || '?',
                games: row.games,
                diff: goalDiff,
                points: row.points,
                isMyTeam: String(row.team?.id) === String(effectiveTeamId)
              };
            });
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
  }, [settings?.teamId, settings?.absageDeadline, calendarEvents?.length, history?.length, activeMember?.playerName]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { stats, settings };
}
