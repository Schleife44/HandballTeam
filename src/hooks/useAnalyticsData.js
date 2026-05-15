import { useState } from 'react';
import useStore from '../store/useStore';

export const useAnalyticsData = () => {
  const { history, squad } = useStore();
  const [selectedMatch, setSelectedMatch] = useState(null);

  const calculateStats = (log) => {
    const shots = (log || []).filter(l => ['GOAL', 'MISS', 'SAVE', 'BLOCKED'].includes(l.type));
    const goals = shots.filter(s => s.type === 'GOAL');
    
    const zoneStats = {};
    const goalZoneStats = {};
    const playerStats = {};

    shots.forEach(shot => {
      const fieldZone = shot.details?.fieldPos;
      const goalZone = shot.details?.goalPos;
      const isGoal = shot.type === 'GOAL';

      if (fieldZone) {
        if (!zoneStats[fieldZone]) zoneStats[fieldZone] = { total: 0, goals: 0 };
        zoneStats[fieldZone].total++;
        if (isGoal) zoneStats[fieldZone].goals++;
      }

      if (goalZone) {
        if (!goalZoneStats[goalZone]) goalZoneStats[goalZone] = { total: 0, goals: 0 };
        goalZoneStats[goalZone].total++;
        if (isGoal) goalZoneStats[goalZone].goals++;
      }

      const pKey = shot.playerNumber;
      if (!playerStats[pKey]) playerStats[pKey] = { name: shot.playerName, total: 0, goals: 0 };
      playerStats[pKey].total++;
      if (isGoal) playerStats[pKey].goals++;
    });

    return { totalShots: shots.length, totalGoals: goals.length, zoneStats, goalZoneStats, playerStats };
  };

  const processedMatches = (history || []).map(match => ({
    ...match,
    id: match.id || Date.now() + Math.random(),
    dateStr: match.timestamp ? new Date(match.timestamp).toLocaleDateString() : 'Unbekannt',
    opponent: match.opponent || (match.settings?.awayName || 'Gegner'),
    stats: calculateStats(match.log)
  })).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  return {
    processedMatches,
    selectedMatch,
    setSelectedMatch,
    squad
  };
};
