import { useMemo } from 'react';
import { normalizeSearchString } from '../utils/searchUtils';

export const useRosterStats = (squad, history) => {
  const playerStatsMap = useMemo(() => {
    const now = new Date();
    const pastPractices = (squad?.calendarEvents || [])
      .filter(e => (e.type?.toUpperCase() === 'TRAINING' || e.type === 'practice') && new Date(e.date) < now);
    
    const stats = {};
    (squad?.home || []).forEach(p => {
      const key = normalizeSearchString(p.name);
      const attended = pastPractices.filter(e => e.responses?.[p.name]?.status === 'going' || e.responses?.[p.name]?.status === 'coming').length;
      const trainingRate = pastPractices.length > 0 ? Math.round((attended / pastPractices.length) * 100) : 0;
      stats[key] = { tore: 0, fehlwurf: 0, games: 0, training: trainingRate };
    });
    
    (history || []).forEach(game => {
      if (game.statsSummary && game.statsSummary.playerStats) {
        const { playerStats, playerNames } = game.statsSummary;
        Object.entries(playerStats).forEach(([pId, s]) => {
          const pName = playerNames[pId] || `Spieler #${pId}`;
          const key = normalizeSearchString(pName);
          if (!stats[key]) stats[key] = { tore: 0, fehlwurf: 0, games: 0, training: 0 };
          stats[key].games++;
          stats[key].tore += s.goals || 0;
          stats[key].fehlwurf += s.missed || 0;
        });
      }
    });
    return stats;
  }, [history, squad]);

  return playerStatsMap;
};
