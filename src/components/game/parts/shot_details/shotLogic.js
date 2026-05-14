/**
 * Shot Logic - Geographic mapping utilities
 */

export const FIELD_ZONES = [
  { id: 'KM', label: 'KM', d: "M 80 70 L 120 70 L 125 100 L 75 100 Z" },
  { id: 'RL', label: 'RL', d: "M 40 48 A 60 60 0 0 0 80 70 L 75 100 A 90 90 0 0 1 16 68 Z" },
  { id: 'AL', label: 'AL', d: "M 25 10 A 60 60 0 0 0 40 48 L 16 68 A 90 90 0 0 1 10 60 L 10 10 Z" },
  { id: 'RR', label: 'RR', d: "M 120 70 A 60 60 0 0 0 160 48 L 184 68 A 90 90 0 0 1 125 100 Z" },
  { id: 'AR', label: 'AR', d: "M 160 48 A 60 60 0 0 0 175 10 L 190 10 L 190 60 A 90 90 0 0 1 184 68 Z" },
  { id: 'RM_B', label: 'RM', d: "M 75 100 L 125 100 L 138 175 L 62 175 Z" },
  { id: 'RL_B', label: 'RL', d: "M 10 60 A 90 90 0 0 0 75 100 L 62 175 L 10 175 Z" },
  { id: 'RR_B', label: 'RR', d: "M 125 100 A 90 90 0 0 0 190 60 L 190 175 L 138 175 Z" },
  { id: 'Fern', label: 'FERN', d: "M 10 175 L 190 175 L 190 280 L 10 280 Z" }
];

export const GOAL_ZONES = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export const getZoneFromCoords = (x, y, type) => {
  if (type === 'goal') {
    const col = Math.floor(x / 33.34);
    const row = Math.floor(y / 33.34);
    return Math.max(1, Math.min(9, row * 3 + col + 1));
  }
  
  if (type === 'field') {
    const sx = (x / 100) * 200;
    const sy = (y / 100) * 245;

    if (sy > 175) return 'Fern';
    if (sy > 100) {
      if (sx < 65) return 'RL_B';
      if (sx > 135) return 'RR_B';
      return 'RM_B';
    }
    
    if (sx > 75 && sx < 125 && sy > 70) return 'KM';
    
    const dx = sx - 100;
    const dy = sy - 10;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    if (angle < 0) { 
      if (angle < -140) return 'AL';
      return 'RL';
    } else { 
      if (angle > 140) return 'AR';
      return 'RR';
    }
  }
  return null;
};
