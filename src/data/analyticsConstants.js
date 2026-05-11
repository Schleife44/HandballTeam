export const FIELD_ZONES = [
  { id: 'KM', label: 'KM', d: "M 80 70 L 120 70 L 125 100 L 75 100 Z", tx: 100, ty: 85 },
  { id: 'RL', label: 'RL', d: "M 40 48 A 60 60 0 0 0 80 70 L 75 100 A 90 90 0 0 1 16 68 Z", tx: 45, ty: 75 },
  { id: 'AL', label: 'AL', d: "M 25 10 A 60 60 0 0 0 40 48 L 16 68 A 90 90 0 0 1 10 60 L 10 10 Z", tx: 25, ty: 35 },
  { id: 'RR', label: 'RR', d: "M 120 70 A 60 60 0 0 0 160 48 L 184 68 A 90 90 0 0 1 125 100 Z", tx: 155, ty: 75 },
  { id: 'AR', label: 'AR', d: "M 160 48 A 60 60 0 0 0 175 10 L 190 10 L 190 60 A 90 90 0 0 1 184 68 Z", tx: 175, ty: 35 },
  { id: 'RM_B', label: 'RM', d: "M 75 100 L 125 100 L 138 175 L 62 175 Z", tx: 100, ty: 135 },
  { id: 'RL_B', label: 'RL', d: "M 10 60 A 90 90 0 0 0 75 100 L 62 175 L 10 175 Z", tx: 40, ty: 135 },
  { id: 'RR_B', label: 'RR', d: "M 125 100 A 90 90 0 0 0 190 60 L 190 175 L 138 175 Z", tx: 160, ty: 135 },
  { id: 'Fern', label: 'FERN', d: "M 10 175 L 190 175 L 190 280 L 10 280 Z", tx: 100, ty: 220 }
];

export const GOAL_ZONES = [
  { id: 1, x: 0, y: 0, tx: 16.6, ty: 16.6 }, { id: 2, x: 33.3, y: 0, tx: 50, ty: 16.6 }, { id: 3, x: 66.6, y: 0, tx: 83.3, ty: 16.6 },
  { id: 4, x: 0, y: 33.3, tx: 16.6, ty: 50 }, { id: 5, x: 33.3, y: 33.3, tx: 50, ty: 50 }, { id: 6, x: 66.6, y: 33.3, tx: 83.3, ty: 50 },
  { id: 7, x: 0, y: 66.6, tx: 16.6, ty: 83.3 }, { id: 8, x: 33.3, y: 66.6, tx: 50, ty: 83.3 }, { id: 9, x: 66.6, y: 66.6, tx: 83.3, ty: 83.3 }
];
