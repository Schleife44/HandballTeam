import { getHistorie } from './history.js';
import { berechneTore, berechneStatistiken, berechneGegnerStatistiken } from './stats.js';
import { spielstand } from './state.js';

// Sammelt alle Spiele aus der Historie
export function getAllGames() {
    const history = getHistorie();
    return history || [];
}

// Aggregiert Spieler-Statistiken über alle Spiele
export function aggregatePlayerStats() {
    // 1. Create a map of current roster names for high-priority naming
    const rosterNameMap = {};
    (spielstand.roster || []).forEach(p => {
        rosterNameMap[String(p.number).trim()] = p.name;
    });

    const games = getAllGames();
    const playerMap = new Map(); // Key: "number_name", Value: aggregated stats
    const masterTeamNames = {}; // Key: normalized, Value: best display

    games.forEach(game => {
        if (!game.roster || !game.gameLog) return;

        // Calculate raw stats for both sides for this game
        const gameStats = berechneStatistiken(game.gameLog, game.roster);
        // Note: gameStats already filters events by playerId (our team), so no perspective detection needed!

        // Derive current "my team name" from current settings (needed for opponent matching later)
        const currentMyTeamName = spielstand.settings.isAuswaertsspiel
            ? spielstand.settings.teamNameGegner
            : spielstand.settings.teamNameHeim;
        const globalNameTrim = (currentMyTeamName || '').toLowerCase().trim();

        // --- Aggregate Our Team's Stats ---
        // gameStats already contains only our players' stats (filtered by playerId in berechneStatistiken)
        gameStats.forEach(statPlayer => {
            // Identifier is strictly NUMBER based for US team to ensure merging even if names vary
            const pNumStr = String(statPlayer.number).trim();
            const key = `HEIM_${pNumStr}`;

            if (!playerMap.has(key)) {
                playerMap.set(key, {
                    number: statPlayer.number,
                    name: rosterNameMap[pNumStr] || statPlayer.name || `Spieler #${statPlayer.number}`,
                    team: 'Heim', // Internal Label for charts
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
                    assist: 0,
                    playStats: {
                        schnelle_mitte: { tore: 0, fehlwurf: 0 },
                        tempo_gegenstoss: { tore: 0, fehlwurf: 0 },
                        spielzug: { tore: 0, fehlwurf: 0 },
                        freies_spiel: { tore: 0, fehlwurf: 0 },
                        unknown: { tore: 0, fehlwurf: 0 }
                    },
                    seasonLog: [] // Unified log for heatmap
                });
            } else {
                // Name Upgrade logic
                const currentAgg = playerMap.get(key);
                const isGeneric = (n) => !n || n.toLowerCase().startsWith('gegner') || n.toLowerCase().startsWith('spieler');

                if (rosterNameMap[pNumStr]) {
                    currentAgg.name = rosterNameMap[pNumStr];
                } else if (isGeneric(currentAgg.name) && !isGeneric(statPlayer.name)) {
                    currentAgg.name = statPlayer.name;
                }
            }
            const aggregated = playerMap.get(key);
            aggregated.totalGames++;
            aggregated.tore += statPlayer.tore || 0;
            aggregated.fehlwurf += statPlayer.fehlwurf || 0;
            aggregated.siebenMeterTore += statPlayer.siebenMeterTore || 0;
            aggregated.siebenMeterVersuche += statPlayer.siebenMeterVersuche || 0;
            aggregated.siebenMeter += statPlayer.siebenMeter || 0;
            aggregated.guteAktion += statPlayer.guteAktion || 0;
            aggregated.techFehler += statPlayer.techFehler || 0;
            aggregated.gelb += statPlayer.gelb || 0;
            aggregated.zweiMinuten += statPlayer.zweiMinuten || 0;
            aggregated.rot += statPlayer.rot || 0;
            aggregated.assist += statPlayer.assist || 0;

            // Collect Heatmap Data for this player
            game.gameLog.forEach(entry => {
                // Simple rule: our team events have playerId (no "Gegner" prefix)
                const isOurTeamAction = !entry.action?.startsWith('Gegner') && !entry.gegnerNummer && entry.playerId;
                if (!isOurTeamAction) return;

                const entryNum = entry.playerId;
                if (String(entryNum).trim() === pNumStr) {
                    // Aggregate PlayType Stats
                    const pType = entry.playType || entry.spielart;
                    if (pType && aggregated.playStats[pType]) {
                        if (entry.action === 'Tor') {
                            aggregated.playStats[pType].tore++;
                        } else if (entry.action === 'Fehlwurf' || entry.action === '7mVerworfen') {
                            aggregated.playStats[pType].fehlwurf++;
                        }
                    } else if (pType && !aggregated.playStats[pType]) {
                        // initialize dynamic keys if needed, or fallback
                        if (!aggregated.playStats[pType]) aggregated.playStats[pType] = { tore: 0, fehlwurf: 0 };
                        if (entry.action === 'Tor') aggregated.playStats[pType].tore++;
                        if (entry.action === 'Fehlwurf') aggregated.playStats[pType].fehlwurf++;
                    }

                    // Include any entry with coords
                    if (entry.wurfbild || entry.wurfposition || entry.x !== undefined) {
                        aggregated.seasonLog.push({
                            ...entry,
                            isOpponent: false, // Internal identity for Heatmap
                            playerId: statPlayer.number
                        });
                    }
                }
            });
        });

        // --- Process Opponent Stats ---
        const opponentStats = berechneGegnerStatistiken(game.gameLog);
        const rawOpponentTeamName = game.teams?.gegner || game.settings?.teamNameGegner || 'Gegner';

        // Normalize team name for merging
        const normalizeTeam = (name) => {
            if (!name) return 'gegner';
            let n = name.toLowerCase().trim();
            n = n.replace(/^(tv|sg|hsg|tsv|sv|tus|sc)\b\s*/, '');
            return n || 'gegner';
        };

        const normalizedOppTeam = normalizeTeam(rawOpponentTeamName);

        // Track the "best" display name for each normalized team
        if (!masterTeamNames[normalizedOppTeam] || (masterTeamNames[normalizedOppTeam].toLowerCase().startsWith('gegner') && !rawOpponentTeamName.toLowerCase().startsWith('gegner'))) {
            masterTeamNames[normalizedOppTeam] = rawOpponentTeamName;
        }
        const opponentTeamName = masterTeamNames[normalizedOppTeam];

        // opponentStats already contains only opponent actions (filtered by "Gegner" prefix)
        opponentStats.forEach(opp => {
            // Safety Net: If this "opponent" name actually matches OUR team name, treat them as US (Heim bucket)
            const matchesMyTeam = globalNameTrim !== '' &&
                (normalizedOppTeam.includes(globalNameTrim) || globalNameTrim.includes(normalizedOppTeam));

            let key, isHeimSide;
            if (matchesMyTeam) {
                key = `HEIM_${String(opp.number).trim()}`;
                isHeimSide = true;
            } else {
                key = `GEGNER_${normalizedOppTeam}_${String(opp.number).trim()}`;
                isHeimSide = false;
            }
            if (!playerMap.has(key)) {
                // If redirection to Heim-Bucket, use roster name resolution
                const displayName = isHeimSide
                    ? (rosterNameMap[String(opp.number).trim()] || opp.name || `Spieler #${opp.number}`)
                    : opp.name;

                playerMap.set(key, {
                    number: opp.number,
                    name: displayName,
                    team: isHeimSide ? 'Heim' : opponentTeamName,
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
                    assist: 0,
                    seasonLog: []
                });
            } else {
                // Name Upgrade logic for ALL aggregated players (Us AND Opponents)
                const currentAgg = playerMap.get(key);
                const pNumStr = String(opp.number).trim();
                const isGeneric = (n) => !n || n.toLowerCase().startsWith('gegner') || n.toLowerCase().startsWith('spieler');

                if (isHeimSide && rosterNameMap[pNumStr]) {
                    currentAgg.name = rosterNameMap[pNumStr];
                } else if (isGeneric(currentAgg.name) && !isGeneric(opp.name)) {
                    currentAgg.name = opp.name;
                }
            }
            const aggregated = playerMap.get(key);
            aggregated.totalGames++;
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
            aggregated.assist += opp.assist || 0;

            // Collect Heatmap Data for Opponent
            game.gameLog.forEach(entry => {
                // Simple rule: opponent events have "Gegner" prefix or gegnerNummer
                const isOpponentAction = !!(entry.action?.startsWith('Gegner') || entry.gegnerNummer);
                if (!isOpponentAction) return;

                const entryNum = entry.gegnerNummer || "Team";
                if (String(entryNum) === String(opp.number)) {
                    if (entry.wurfbild || entry.wurfposition) {
                        const is7m = entry.action && entry.action.includes('7m');
                        aggregated.seasonLog.push({
                            wurfbild: entry.wurfbild,
                            wurfposition: entry.wurfposition,
                            action: entry.action,
                            team: opponentTeamName,
                            isOpponent: true,
                            is7m: is7m,
                            playerId: opp.number
                        });
                    }
                }
            });
        });
    });

    // Konvertiere Map zu Array und berechne Wurfquoten
    const players = Array.from(playerMap.values()).map(player => {
        // Standardwerte: tore ist bereits die Summe aller Tore (Feld + 7m) in stats.js/berechneStatistiken
        const gesamtTore = player.tore;
        const feldTore = player.tore - (player.siebenMeterTore || 0);

        player.tore = gesamtTore;
        const fieldAttempts = feldTore + player.fehlwurf;

        player.wurfQuote = fieldAttempts > 0
            ? Math.round((feldTore / fieldAttempts) * 100) + '%'
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
