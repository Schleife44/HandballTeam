import { useMemo } from 'react';

export const usePlayerStats = (playerName) => {
  const stats = useMemo(() => {
    const rawHistory = localStorage.getItem('handball_history_global');
    if (!rawHistory) return null;
    
    const history = JSON.parse(rawHistory);
    const playerGames = [];
    
    let totalGoals = 0;
    let totalShots = 0;
    let totalGames = 0;

    // Sort games by date to get a timeline
    const sortedGames = [...history].sort((a, b) => new Date(a.date || a.timestamp) - new Date(b.date || b.timestamp));

    sortedGames.forEach(game => {
      // Find player in this game's roster to see if they were present
      const playerInRoster = game.roster?.find(p => p.name === playerName);
      
      // We also check if the player appears in the gameLog at all (in case they aren't in roster)
      const log = game.gameLog || [];
      const appearsInLog = log.some(e => e.playerName === playerName);

      if (playerInRoster || appearsInLog) {
        totalGames++;
        
        // Count goals and shots from gameLog (the reliable source in V2)
        let goals = 0;
        let missed = 0;

        log.forEach(entry => {
          if (entry.playerName === playerName) {
            const action = entry.action?.toLowerCase() || '';
            if (action.includes('tor') && !action.includes('gegner')) {
              goals++;
            } else if (action.includes('fehlwurf') || action.includes('parade') || action.includes('verworfen')) {
              // Note: 'parade' usually means the opponent keeper saved it, so it's a missed shot for the player
              missed++;
            }
          }
        });

        // Fallback to roster data if log is empty (V1 compatibility)
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

    if (totalGames === 0) return null;

    return {
      summary: {
        totalGames,
        totalGoals,
        totalShots,
        avgGoals: (totalGoals / totalGames).toFixed(1),
        avgEfficiency: totalShots > 0 ? Math.round((totalGoals / totalShots) * 100) : 0
      },
      timeline: playerGames.slice(-10) // Last 10 games for the chart
    };
  }, [playerName]);

  return stats;
};
