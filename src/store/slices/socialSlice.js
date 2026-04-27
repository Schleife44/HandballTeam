export const initialSocialState = {
  socialSettings: {
    backgroundImage: null,
    teamLogo: null,
    fontFamily: 'Oswald',
    seasonName: '25/26',
    teamLabel: '1. Herren',
    hashtags: '#handball #sechsmeter #teampower #handballdeutschland #ergebnis #matchday',
    overlayOpacity: 0.55,
    ownTeamColor: '#ffffff',
    opponentColor: '#ef4444',
    positions: {
      ergebnisLabel: { x: 230, y: 920, fontSize: 110, bold: true, scale: 1, rotation: 0 },
      seasonLabel: { x: 230, y: 550, fontSize: 24, bold: false, scale: 1, rotation: 0 },
      statusGroup: { x: 800, y: 160, fontSize: 82, bold: false, scale: 1, rotation: 0 },
      dateLabel: { x: 780, y: 310, fontSize: 24, bold: false, scale: 1, rotation: 0 },
      vsLabel: { x: 630, y: 570, fontSize: 22, bold: false, scale: 1, rotation: 0 },
      ourScore: { x: 650, y: 440, fontSize: 180, bold: false, scale: 1, rotation: 0 },
      theirScore: { x: 650, y: 620, fontSize: 180, bold: false, scale: 1, rotation: 0 },
      teamLabel: { x: 510, y: 830, fontSize: 22, bold: false, scale: 1, rotation: 0 },
      logo: { x: 470, y: 850, scale: 1, rotation: 0 },
      separatorLine: { x: 250, y: 225, width: 550, thickness: 3, scale: 1, rotation: 0 }
    }
  }
};

export const createSocialSlice = (set) => ({
  ...initialSocialState,

  updateSocialSettings: (newSettings) => set((state) => ({
    socialSettings: { ...state.socialSettings, ...newSettings }
  })),
  setSocialSettings: (socialSettings) => set({ socialSettings }),
});
