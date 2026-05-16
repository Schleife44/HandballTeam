/**
 * Graphics constants for the Sechsmeter Studio
 */

export const FONTS = [
  { value: 'Oswald', label: 'Oswald (Sport)' },
  { value: 'Bebas Neue', label: 'Bebas (Impact)' },
  { value: 'Teko', label: 'Teko (Condensed)' },
  { value: 'Racing Sans One', label: 'Racing (Speed)' },
  { value: 'Montserrat', label: 'Montserrat (Modern)' },
  { value: 'Outfit', label: 'Outfit (Sleek)' },
  { value: 'Inter', label: 'Inter (Clean)' }
];

export const TEMPLATES = [
  { 
    id: 'toxic_neon', 
    label: 'Toxic Neon', 
    color: '#84cc16',
    config: {
      filters: { blur: 0, brightness: 1.1, grayscale: 0.2 },
      overlayOpacity: 0.4, ownTeamColor: '#84cc16', opponentColor: '#ffffff',
      positions: {
        ergebnisLabel: { x: 120, y: 950, fontSize: 130, bold: true, rotation: 0 },
        seasonLabel: { x: 170, y: 550, fontSize: 24, bold: false, rotation: 0 },
        statusGroup: { x: 1000, y: 80, fontSize: 90, bold: true, rotation: 0 },
        dateLabel: { x: 1000, y: 180, fontSize: 24, bold: false },
        ourScore: { x: 600, y: 250, fontSize: 280, bold: true }, 
        theirScore: { x: 600, y: 600, fontSize: 280, bold: true }, 
        vsLabel: { x: 550, y: 550, fontSize: 40, bold: true }, 
        teamLabel: { x: 750, y: 950, fontSize: 24, bold: true },
        logo: { x: 920, y: 880 },
        separatorLine: { x: 140, y: 540, width: 800, thickness: 12, rotation: 0 }
      }
    }
  },
  { 
    id: 'deep_red', 
    label: 'Deep Aggressive', 
    color: '#ef4444',
    config: {
      filters: { blur: 4, brightness: 0.7, grayscale: 1 },
      overlayOpacity: 0.6, ownTeamColor: '#ef4444', opponentColor: '#ffffff',
      positions: {
        ergebnisLabel: { x: 120, y: 950, fontSize: 110, bold: true, rotation: 0 },
        seasonLabel: { x: 180, y: 950, fontSize: 24, bold: false, rotation: 0 },
        statusGroup: { x: 1000, y: 100, fontSize: 100, bold: true, rotation: 0 },
        dateLabel: { x: 1000, y: 220, fontSize: 18, bold: false },
        ourScore: { x: 200, y: 400, fontSize: 260, bold: true }, 
        theirScore: { x: 680, y: 400, fontSize: 260, bold: true }, 
        vsLabel: { x: 560, y: 540, fontSize: 40, bold: true }, 
        teamLabel: { x: 540, y: 850, fontSize: 24, bold: true },
        logo: { x: 500, y: 880 },
        separatorLine: { x: 350, y: 520, width: 380, thickness: 3, rotation: 90 } 
      }
    }
  },
  { 
    id: 'clean_pro', 
    label: 'Clean Pro', 
    color: '#3b82f6',
    config: {
      filters: { blur: 0, brightness: 1, grayscale: 0 },
      overlayOpacity: 0.2, ownTeamColor: '#3b82f6', opponentColor: '#1e293b',
      positions: {
        ergebnisLabel: { x: 120, y: 900, fontSize: 60, bold: true, rotation: 0 },
        seasonLabel: { x: 120, y: 250, fontSize: 20, bold: false, rotation: 0 },
        statusGroup: { x: 950, y: 100, fontSize: 60, bold: true, rotation: 0 },
        dateLabel: { x: 950, y: 170, fontSize: 18, bold: false },
        ourScore: { x: 220, y: 400, fontSize: 240, bold: true },
        theirScore: { x: 680, y: 400, fontSize: 240, bold: true },
        vsLabel: { x: 560, y: 520, fontSize: 40, bold: true },
        teamLabel: { x: 540, y: 800, fontSize: 24, bold: true },
        logo: { x: 500, y: 850 },
        separatorLine: { x: 120, y: 200, width: 840, thickness: 2, rotation: 0 }
      }
    }
  },
  { 
    id: 'custom_blank', 
    label: 'Eigene Vorlage', 
    color: '#a1a1aa',
    config: {
      filters: { blur: 0, brightness: 1, grayscale: 0 },
      overlayOpacity: 0.55, ownTeamColor: '#ffffff', opponentColor: '#ef4444',
      positions: {
        ergebnisLabel: { x: 230, y: 920, fontSize: 110, bold: true, rotation: 0 },
        seasonLabel: { x: 230, y: 550, fontSize: 24, bold: false, rotation: 0 },
        statusGroup: { x: 800, y: 160, fontSize: 82, bold: false, rotation: 0 },
        dateLabel: { x: 780, y: 310, fontSize: 24, bold: false, rotation: 0 },
        ourScore: { x: 650, y: 440, fontSize: 180, bold: false, rotation: 0 },
        theirScore: { x: 650, y: 620, fontSize: 180, bold: false, rotation: 0 },
        vsLabel: { x: 630, y: 570, fontSize: 22, bold: false, rotation: 0 },
        teamLabel: { x: 510, y: 830, fontSize: 22, bold: false, rotation: 0 },
        logo: { x: 470, y: 850, rotation: 0 },
        separatorLine: { x: 250, y: 225, width: 550, thickness: 3, rotation: 0 }
      }
    }
  }
];

export const EDITOR_TABS = [
  { id: 'design', label: 'Design' },
  { id: 'elements', label: 'Ebenen' },
  { id: 'preview', label: 'Vorschau' }
];
