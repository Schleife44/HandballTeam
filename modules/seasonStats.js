import { getHistorie } from './history.js';
import { berechneTore, berechneStatistiken, berechneGegnerStatistiken } from './stats.js';

// Sammelt alle Spiele aus der Historie
export function getAllGames() {
    const history = getHistorie();
    return history || [];
}

// Prüft ob zwei Spieler identisch sind (gleiche Nummer + Name)
function isSamePlayer(player1, player2) {
    return player1.number === player2.number &&
        (player1.name || '').trim().toLowerCase() === (player2.name || '').trim().toLowerCase();
}

// Aggregiert Spieler-Statistiken über alle Spiele
export function aggregatePlayerStats() {
    const games = getAllGames();
    const playerMap = new Map(); // Key: "number_name", Value: aggregated stats

    games.forEach(game => {
        if (!game.roster || !game.gameLog) return;

        // Berechne Statistiken für dieses Spiel (Heim)
        const gameStats = berechneStatistiken(game.gameLog, game.roster);
        const gameTore = berechneTore(game.gameLog);

        // Berechne Statistiken für Gegner
        const opponentStats = berechneGegnerStatistiken(game.gameLog);

        // --- Verarbeite Heim-Spieler ---
        game.roster.forEach(rosterPlayer => {
            const key = `HEIM_${rosterPlayer.number}_${(rosterPlayer.name || '').trim().toLowerCase()}`;

            // Finde Stats für diesen Spieler in diesem Spiel
            const playerGameStats = gameStats.find(s => s.number === rosterPlayer.number);
            const playerTore = gameTore.get(rosterPlayer.number) || 0;

            if (!playerMap.has(key)) {
                // Neuer Spieler
                playerMap.set(key, {
                    number: rosterPlayer.number,
                    name: rosterPlayer.name || '',
                    team: 'Heim', // Flag for sorting/filtering if needed
                    totalGames: 0,
                    tore: 0,
                    fehlwurf: 0,
                    siebenMeterTore: 0,
                    siebenMeterVersuche: 0,
                    siebenMeter: 0, // rausgeholt
                    guteAktion: 0,
                    techFehler: 0,
                    gelb: 0,
                    zweiMinuten: 0,
                    rot: 0,
                    seasonLog: [] // Unified log
                });
            }

            const aggregated = playerMap.get(key);
            aggregated.totalGames++;
            aggregated.tore += playerTore;

            if (playerGameStats) {
                aggregated.fehlwurf += playerGameStats.fehlwurf || 0;
                aggregated.siebenMeterTore += playerGameStats.siebenMeterTore || 0;
                aggregated.siebenMeterVersuche += playerGameStats.siebenMeterVersuche || 0;
                aggregated.siebenMeter += playerGameStats.siebenMeter || 0;
                aggregated.guteAktion += playerGameStats.guteAktion || 0;
                aggregated.techFehler += playerGameStats.techFehler || 0;
                aggregated.gelb += playerGameStats.gelb || 0;
                aggregated.zweiMinuten += playerGameStats.zweiMinuten || 0;
                aggregated.rot += playerGameStats.rot || 0;
            }

            // Sammle Wurf-Daten für Heatmaps (Unified)
            game.gameLog.forEach(entry => {
                if (entry.playerId === rosterPlayer.number) {
                    if (entry.wurfbild || entry.wurfposition) {
                        const is7m = entry.action && (entry.action.includes('7m'));
                        aggregated.seasonLog.push({
                            wurfbild: entry.wurfbild,
                            wurfposition: entry.wurfposition,
                            action: entry.action,
                            isOpponent: false,
                            playerId: rosterPlayer.number,
                            is7m: is7m
                        });
                    }
                }
            });
        });

        // --- Verarbeite Gegner ---
        const opponentTeamName = (game.teams && game.teams.gegner) ? game.teams.gegner : 'Gegner';

        opponentStats.forEach(opp => {
            // Use opponent team name in key for proper grouping
            const key = `GEGNER_${opponentTeamName}_${opp.number}_${(opp.name || '').trim().toLowerCase()}`;

            if (!playerMap.has(key)) {
                playerMap.set(key, {
                    number: opp.number,
                    name: opp.name,
                    team: opponentTeamName,
                    totalGames: 0,
                    tore: 0,
                    fehlwurf: 0,
                    siebenMeterTore: 0,
                    siebenMeterVersuche: 0,
                    siebenMeter: 0,
                    guteAktion: 0,
                    techFehler: 0,
                    gelb: 0,
                    zweiMinuten: 0,
                    rot: 0,
                    seasonLog: []
                });
            }

            const aggregated = playerMap.get(key);
            aggregated.totalGames++; // Increment games for this distinct opponent identity

            // Add stats
            aggregated.tore += opp.tore || 0;
            aggregated.fehlwurf += opp.fehlwurf || 0;
            aggregated.siebenMeterTore += opp.siebenMeterTore || 0;
            aggregated.siebenMeterVersuche += opp.siebenMeterVersuche || 0;
            aggregated.siebenMeter += opp.siebenMeter || 0;
            aggregated.guteAktion += opp.guteAktion || 0;
            aggregated.techFehler += opp.techFehler || 0;
            aggregated.gelb += opp.gelb || 0;
            aggregated.zweiMinuten += opp.zweiMinuten || 0;
            aggregated.rot += opp.rot || 0;

            // Collect Heatmap Data for Opponent
            game.gameLog.forEach(entry => {
                const isGegnerAction = entry.action.startsWith("Gegner") || entry.gegnerNummer;
                if (!isGegnerAction) return;

                // Match number (handle "Team" case if number is missing/string)
                const entryNum = entry.gegnerNummer || "Team";
                // Loose comparison string vs number
                if (String(entryNum) === String(opp.number)) {
                    if (entry.wurfbild || entry.wurfposition) {
                        const is7m = entry.action && entry.action.includes('7m');
                        aggregated.seasonLog.push({
                            wurfbild: entry.wurfbild,
                            wurfposition: entry.wurfposition,
                            action: entry.action,
                            isOpponent: true,
                            gegnerNummer: entryNum,
                            is7m: is7m
                        });
                    }
                }
            });
        });
    });

    // Konvertiere Map zu Array und berechne Wurfquoten
    const players = Array.from(playerMap.values()).map(player => {
        // Add 7m goals to total goals (berechneTore only counts field goals "Tor")
        player.tore = player.tore + (player.siebenMeterTore || 0);

        // Calculate Field Quote Only (Exclude 7m)
        const fieldGoals = player.tore - (player.siebenMeterTore || 0);
        const fieldAttempts = fieldGoals + player.fehlwurf;

        player.wurfQuote = fieldAttempts > 0
            ? Math.round((fieldGoals / fieldAttempts) * 100) + '%'
            : '-';
        return player;
    });

    // Sortiere nach Nummer (Standard)
    players.sort((a, b) => {
        // Erst nach Team (Heim vor Gegner)? Oder gemischt? User said "Saison übersicht sind keine Gegner sichtbar", likely wants them listed.
        // Let's mix them but handle sorting.
        // If pure number sort: "2 (Heim)" vs "2 (Gegner)". 
        // Maybe sort by team first? "Heim" then "Gegner".
        // Or pure number + name.

        // Let's stick to number sort as primary requested, but maybe prioritize Heim?
        // Actually, mixing might be confusing if they have same number.
        // Let's sort: Heim comes first, then Gegner. Within that, by number.
        if (a.team !== b.team) {
            return a.team === 'Heim' ? -1 : 1;
        }

        // Defensive parsing for number (might be "Team")
        const numA = parseInt(a.number) || 999;
        const numB = parseInt(b.number) || 999;
        return numA - numB;
    });

    return players;
}

// Gibt Saison-Statistik-Zusammenfassung zurück
export function getSeasonSummary() {
    const players = aggregatePlayerStats();
    const games = getAllGames();

    const totalTore = players.reduce((sum, p) => sum + p.tore, 0);
    const totalGames = games.length;
    const totalPlayers = players.length;

    return {
        totalGames,
        totalPlayers,
        totalTore,
        players
    };
}
