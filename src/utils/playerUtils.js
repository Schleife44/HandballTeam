/**
 * Utility functions for player data processing and rating calculations
 */

export const positionMap = {
  'LA': 'Linksaußen',
  'RL': 'Rückraum Links',
  'RM': 'Rückraum Mitte',
  'RR': 'Rückraum Rechts',
  'RA': 'Rechtsaußen',
  'KM': 'Kreisläufer',
  'TW': 'Torhüter',
  'AB': 'Abwehr-Spezialist'
};

export const positions = ['LA', 'RL', 'RM', 'RR', 'RA', 'KM', 'TW', 'AB'];

/**
 * Calculates a player's performance rating based on goals and efficiency
 */
export const calculatePlayerRating = (stats) => {
  const totalAttempts = (stats?.tore || 0) + (stats?.fehlwurf || 0);
  const efficiency = totalAttempts > 0 ? (stats.tore / totalAttempts) * 100 : 0;
  
  const baseRating = 7.0;
  const goalBonus = Math.min((stats?.tore || 0) * 0.1, 2.0);
  const efficiencyBonus = (efficiency / 100) * 1.0;
  
  return (baseRating + goalBonus + efficiencyBonus).toFixed(1);
};

/**
 * Formats a display string for player positions
 */
export const formatPlayerPosition = (player) => {
  const p1 = positionMap[player.position] || player.position;
  const p2 = player.position2 ? (positionMap[player.position2] || player.position2) : null;
  
  if (p2) return `${p1} / ${p2}`;
  return p1 || (player.isGoalkeeper ? 'Torhüter' : 'Feldspieler');
};

/**
 * Calculates shooting efficiency percentage
 */
export const calculateEfficiency = (stats) => {
  const totalAttempts = (stats?.tore || 0) + (stats?.fehlwurf || 0);
  return totalAttempts > 0 ? Math.round((stats.tore / totalAttempts) * 100) : 0;
};
