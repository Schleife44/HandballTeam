// modules/handballNetImport.js
// Logic for importing games from handball.net API

import { spielstand } from './state.js';
import { fetchWithProxy } from './utils.js';

/**
 * Parses the game ID from a handball.net URL.
 * URL Example: https://www.handball.net/spiele/handball4all.westfalen.8348616/spielbericht
 */
export function parseGameId(url) {
    try {
        const parts = url.split('/');
        // The ID is usually the part before 'spielbericht' or 'spielplan'
        for (let i = 0; i < parts.length; i++) {
            if (parts[i] === 'spiele' && parts[i + 1]) {
                return parts[i + 1].split('?')[0];
            }
        }
        return null;
    } catch (e) {
        return null;
    }
}

/**
 * Fetches game data from handball.net API
 */
export async function fetchHandballNetGame(id) {
    const url = `https://www.handball.net/a/sportdata/1/games/${id}/combined`;
    return await fetchWithProxy(url, { json: true });
}

console.warn("[V4_SAFETY_NET] Handball.net Importer Active - Final Defense");

/**
 * Maps handball.net JSON to internal game object.
 * @param {Object} rawJson The JSON from /games/{id}/combined
 * @param {String} myTeamName The user's team name for perspective
 */
export function mapHandballNetToInternal(rawJson, myTeamName) {
    // Game reports from /combined are always wrapped in a "data" property
    const data = rawJson.data || rawJson;
    if (!data || !data.summary) {
        console.error("[Import] Unexpected JSON structure:", rawJson);
        throw new Error("Ungültiges Datenformat (summary fehlt).");
    }

    const summary = data.summary;
    const homeTeam = summary.homeTeam || { name: "Heim" };
    const awayTeam = summary.awayTeam || { name: "Gast" };

    // Convert startsAt (Unix timestamp in ms) to ISO string for our app
    let gameDate = new Date().toISOString(); 
    if (summary.startsAt) {
        gameDate = new Date(summary.startsAt).toISOString();
    }

    // Detect perspective (is the user's team away?)
    const isAuswaerts = myTeamName && awayTeam.name && awayTeam.name.toLowerCase().includes(myTeamName.toLowerCase());
    
    // Handled wrapped data if present
    const lineup = data.lineup || {};
    const hnetHomePlayers = lineup.home || [];
    const hnetAwayPlayers = lineup.away || [];

    const ourHnetPlayers = isAuswaerts ? hnetAwayPlayers : hnetHomePlayers;
    const theirHnetPlayers = isAuswaerts ? hnetHomePlayers : hnetAwayPlayers;

    // Helper to map players
    const mapPlayers = (hnetList) => hnetList.map(p => ({
        name: p.player?.name || `Spieler #${p.player?.jerseyNumber || '?'}`,
        number: p.player?.jerseyNumber || "",
        isGoalkeeper: !!(p.position?.toLowerCase().includes('torwart') || p.position?.toLowerCase().includes('gk'))
    }));

    const roster = mapPlayers(ourHnetPlayers);
    const knownOpponents = mapPlayers(theirHnetPlayers);

    // Map Events to GameLog
    const gameLog = (data.events || []).map(e => {
        const type = e.type;
        const isActionByOurTeam = (isAuswaerts && e.team === 'Away') || (!isAuswaerts && e.team === 'Home');
        
        let action = null;
        if (type === 'Goal') action = isActionByOurTeam ? 'Tor' : 'Gegner Tor';
        else if (type === 'TwoMinutePenalty') action = isActionByOurTeam ? '2 Minuten' : 'Gegner 2 Minuten';
        else if (type === 'YellowCard') action = isActionByOurTeam ? 'Gelbe Karte' : 'Gegner Gelbe Karte';
        else if (type === 'RedCard') action = isActionByOurTeam ? 'Rote Karte' : 'Gegner Rote Karte';
        else if (type === 'BlueCard') action = isActionByOurTeam ? 'Blaue Karte' : 'Gegner Blaue Karte';
        
        if (!action) return null; // Skip unknown actions for now

        // Extract jersey number from message e.g. "(55.)"
        let jerseyNumber = "";
        if (e.message) {
            const match = e.message.match(/\((\d+)\.\)/);
            if (match && match[1]) {
                jerseyNumber = match[1];
            }
        }

        return {
            time: e.time || '00:00',
            action: action,
            playerId: isActionByOurTeam ? (jerseyNumber || null) : null,
            gegnerNummer: !isActionByOurTeam ? (jerseyNumber || null) : null,
            spielstand: e.score || "0:0",
            importMeta: { hnetId: e.id || Date.now() }
        };
    }).filter(e => e !== null);

    // Ultra-defensive score lookup (Check all known variants)
    const heimTore = Number(summary.homeGoals ?? summary.scoreHome ?? 0);
    const gegnerTore = Number(summary.awayGoals ?? summary.scoreAway ?? 0);

    // Final Object
    const result = {
        date: gameDate,
        score: {
            heim: isNaN(heimTore) ? 0 : heimTore,
            gegner: isNaN(gegnerTore) ? 0 : gegnerTore
        },
        teams: {
            heim: homeTeam.name || "Heimteam",
            gegner: awayTeam.name || "Gastteam"
        },
        gameLog: gameLog,
        roster: roster,
        knownOpponents: knownOpponents,
        settings: {
            teamNameHeim: homeTeam.name || "Heimteam",
            teamNameGegner: awayTeam.name || "Gastteam",
            myTeamName: myTeamName || homeTeam.name || "Mein Team",
            isAuswaertsspiel: !!isAuswaerts
        },
        importDate: new Date().toISOString()
    };
    
    console.log("[V4_SAFETY_NET] Mapped result:", result);
    return result;
}
