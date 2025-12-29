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
    // Verwende entweder den im Spiel gespeicherten Team-Namen oder den aktuellen aus Settings
    let myTeamName = game.settings?.myTeamName?.toLowerCase().trim();

    // Fallback auf aktuellen Team-Namen für alte Spiele
    if (!myTeamName && currentMyTeamName) {
        myTeamName = currentMyTeamName.toLowerCase().trim();
    }

    if (!myTeamName) {
        // Fallback: Wenn kein Team-Name gesetzt, Heim als "mein Team" annehmen
        return game.score.heim > game.score.gegner ? 'win' :
            game.score.heim < game.score.gegner ? 'loss' : 'draw';
    }

    // Check both game.settings and game.teams for team names (for old games)
    const heimName = (game.settings?.teamNameHeim || game.teams?.heim)?.toLowerCase().trim();
    const gastName = (game.settings?.teamNameGegner || game.teams?.gegner)?.toLowerCase().trim();

    let myScore, opponentScore;

    if (heimName === myTeamName) {
        myScore = game.score.heim;
        opponentScore = game.score.gegner;
    } else if (gastName === myTeamName) {
        myScore = game.score.gegner;
        opponentScore = game.score.heim;
    } else {
        // Fallback: Heim als "mein Team"
        myScore = game.score.heim;
        opponentScore = game.score.gegner;
    }

    if (myScore > opponentScore) return 'win';
    if (myScore < opponentScore) return 'loss';
    return 'draw';
}
