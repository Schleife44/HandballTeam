export function formatiereZeit(sekunden) {
    const min = Math.floor(sekunden / 60);
    const sek = Math.floor(sekunden % 60);
    const formatierteMin = min < 10 ? '0' + min : min;
    const formatierteSek = sek < 10 ? '0' + sek : sek;
    return `${formatierteMin}:${formatierteSek}`;
}

/**
 * Calculate appropriate text color (dark or light) based on background color brightness
 * @param {string} hexColor - Hex color code (e.g., "#dc3545")
 * @returns {string} - Either "#000000" for dark text or "#ffffff" for light text
 */
export function getContrastTextColor(hexColor) {
    // Remove # if present
    const hex = hexColor.replace('#', '');

    // Convert to RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Calculate relative luminance using WCAG formula
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return dark text for light backgrounds, light text for dark backgrounds
    return luminance > 0.5 ? '#000000' : '#ffffff';
}

/**
 * Bestimmt, ob "mein Team" gewonnen hat
 * @param {Object} game - Spiel-Objekt mit score und settings
 * @param {string} currentMyTeamName - Aktueller Team-Name aus globalen Settings (optional)
 * @returns {string} - 'win', 'loss', oder 'draw'
 */
export function getGameResult(game, currentMyTeamName = null) {
    // Get team names from the saved game
    const heimName = (game.settings?.teamNameHeim || game.teams?.heim || '').toLowerCase().trim();
    const gastName = (game.settings?.teamNameGegner || game.teams?.gegner || '').toLowerCase().trim();

    // Get "my team name" from the saved game or use current
    let myTeamName = (game.settings?.myTeamName || currentMyTeamName || '').toLowerCase().trim();

    let myScore, opponentScore;

    // STRATEGY 1: Try to match myTeamName to determine which side we were on
    if (myTeamName && heimName && myTeamName === heimName) {
        // We were the Heim team
        myScore = game.score.heim;
        opponentScore = game.score.gegner;
    } else if (myTeamName && gastName && myTeamName === gastName) {
        // We were the Gast team
        myScore = game.score.gegner;
        opponentScore = game.score.heim;
    } else if (game.settings && game.settings.isAuswaertsspiel !== undefined) {
        // STRATEGY 2: Use isAuswaertsspiel if available
        const isAway = game.settings.isAuswaertsspiel;
        myScore = isAway ? game.score.gegner : game.score.heim;
        opponentScore = isAway ? game.score.heim : game.score.gegner;
    } else {
        // FALLBACK: Assume we were Heim
        myScore = game.score.heim;
        opponentScore = game.score.gegner;
    }

    if (myScore > opponentScore) return 'win';
    if (myScore < opponentScore) return 'loss';
    return 'draw';
}
