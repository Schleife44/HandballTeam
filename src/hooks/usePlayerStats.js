import { useMemo } from 'react';
import useStore from '../store/useStore';

export const usePlayerStats = (playerName, selectedSeason = 'all') => {
  const { history, squad } = useStore();

  const stats = useMemo(() => {
    if (!history || history.length === 0) return null;
    
    // Extract unique seasons
    const availableSeasons = Array.from(new Set([
      squad?.settings?.currentSeason || '25/26',
      ...history.map(g => g.season).filter(Boolean)
    ])).sort((a, b) => b.localeCompare(a));

    const playerGames = [];
    let totalGoals = 0;
    let totalShots = 0;
    let totalGames = 0;

    // Filter by season if needed
    const filteredHistory = selectedSeason === 'all' 
      ? history 
      : history.filter(g => g.season === selectedSeason || (!g.season && selectedSeason === (squad?.settings?.currentSeason || '25/26')));

    // Sort games by date
    const sortedGames = [...filteredHistory].sort((a, b) => new Date(a.date || a.timestamp) - new Date(b.date || b.timestamp));

    sortedGames.forEach(game => {
      const playerInRoster = game.roster?.find(p => p.name === playerName);
      const log = game.gameLog || [];
      const appearsInLog = log.some(e => e.playerName === playerName);

      if (playerInRoster || appearsInLog) {
        totalGames++;
        let goals = 0;
        let missed = 0;

        log.forEach(entry => {
          if (entry.playerName === playerName) {
            const action = entry.action?.toLowerCase() || '';
            if (action.includes('tor') && !action.includes('gegner')) {
              goals++;
            } else if (action.includes('fehlwurf') || action.includes('parade') || action.includes('verworfen')) {
              missed++;
            }
          }
        });

        if (log.length === 0 && playerInRoster) {
          goals = playerInRoster.goals || 0;
          missed = playerInRoster.missed || 0;
        }

        const shots = goals + missed;
        totalGoals += goals;
        totalShots += shots;

        playerGames.push({
          date: game.date || game.timestamp,
          opponent: game.teams?.gegner || game.settings?.teamNameGegner || 'Unbekannt',
          goals,
          shots,
          efficiency: shots > 0 ? Math.round((goals / shots) * 100) : 0
        });
      }
    });

    return {
      summary: {
        totalGames,
        totalGoals,
        totalShots,
        avgGoals: totalGames > 0 ? (totalGoals / totalGames).toFixed(1) : 0,
        avgEfficiency: totalShots > 0 ? Math.round((totalGoals / totalShots) * 100) : 0
      },
      timeline: playerGames.slice(-10),
      availableSeasons
    };
  }, [playerName, history, selectedSeason, squad?.settings?.currentSeason]);

  return stats;
};
