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
        const gameTore = berechneTore(game.gameLog);
        const opponentStats = berechneGegnerStatistiken(game.gameLog);

        // --- Robust Perspective Detection ---
        const globalNameTrim = (spielstand.settings.myTeamName || '').toLowerCase().trim();
        const heimName = (game.settings?.teamNameHeim || game.teams?.heim || 'Heim').toLowerCase().trim();
        const gastName = (game.settings?.teamNameGegner || game.teams?.gegner || 'Gegner').toLowerCase().trim();

        const heimSideIsUsName = globalNameTrim !== '' && (heimName.includes(globalNameTrim) || globalNameTrim.includes(heimName));
        const gastSideIsUsName = globalNameTrim !== '' && (gastName.includes(globalNameTrim) || globalNameTrim.includes(gastName));

        // Heuristic: Check player overlap
        const currentRosterNumbers = new Set(Object.keys(rosterNameMap));
        const gameHeimNumbers = (game.roster || []).map(p => String(p.number).trim());
        const gameGastNumbers = (game.knownOpponents || []).map(p => String(p.number).trim());

        const heimOverlap = gameHeimNumbers.filter(n => currentRosterNumbers.has(n)).length;
        const gastOverlap = gameGastNumbers.filter(n => currentRosterNumbers.has(n)).length;

        const heimSideLooksLikeUs = heimOverlap > 0 && heimOverlap >= (gameHeimNumbers.length / 2);
        const gastSideLooksLikeUs = gastOverlap > 0 && gastOverlap >= (gameGastNumbers.length / 2);

        let ourSideRecord = 'heim';
        if (heimSideIsUsName && !gastSideIsUsName) {
            ourSideRecord = 'heim';
        } else if (gastSideIsUsName && !heimSideIsUsName) {
            ourSideRecord = 'gast';
        } else if (heimSideLooksLikeUs && !gastSideLooksLikeUs) {
            ourSideRecord = 'heim';
        } else if (gastSideLooksLikeUs && !heimSideLooksLikeUs) {
            ourSideRecord = 'gast';
        }
        // DEFAULT: Assume 'heim' if no clear match, as standard recording (playerId) is identity-Us
        // DO NOT use isAuswaertsspiel here, it's just a visual toggle.

        // --- Verarbeite "Heim" (Identity: Us) ---
        const ourStatsForGame = (ourSideRecord === 'heim') ? gameStats : opponentStats;

        ourStatsForGame.forEach(statPlayer => {
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

            // Collect Heatmap Data for this player
            game.gameLog.forEach(entry => {
                const isGegnerAction = !!(entry.action?.startsWith('Gegner') || entry.gegnerNummer);
                // If we identified 'Us' as recorded-Gast, then our actions are isGegnerAction
                const isOurSideAction = (ourSideRecord === 'gast') ? isGegnerAction : !isGegnerAction;
                if (!isOurSideAction) return;

                const entryNum = isGegnerAction ? (entry.gegnerNummer || "Team") : entry.playerId;
                if (String(entryNum).trim() === pNumStr) {
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

        // --- Verarbeite "Gegner" (Identity: Them) ---
        const oppStatsForGame = (ourSideRecord === 'heim') ? opponentStats : gameStats;
        const rawOpponentTeamName = (ourSideRecord === 'heim') ? (game.teams?.gegner || 'Gegner') : (game.teams?.heim || 'Heim');

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

        oppStatsForGame.forEach(opp => {
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

            // Collect Heatmap Data for Opponent
            game.gameLog.forEach(entry => {
                const isGegnerAction = !!(entry.action?.startsWith('Gegner') || entry.gegnerNummer);
                const isOpponentSideAction = (ourSideRecord === 'heim') ? isGegnerAction : !isGegnerAction;
                if (!isOpponentSideAction) return;

                const entryNum = isGegnerAction ? (entry.gegnerNummer || "Team") : entry.playerId;
                if (String(entryNum) === String(opp.number)) {
                    if (entry.wurfbild || entry.wurfposition) {
                        const is7m = entry.action && entry.action.includes('7m');
                        aggregated.seasonLog.push({
                            wurfbild: entry.wurfbild,
                            wurfposition: entry.wurfposition,
                            action: entry.action,
                            isOpponent: !isHeimSide, // Unified identity
                            playerId: isHeimSide ? entryNum : undefined,
                            gegnerNummer: isHeimSide ? undefined : entryNum,
                            is7m: is7m
                        });
                    }
                }
            });
        });
    });

    // Konvertiere Map zu Array und berechne Wurfquoten
    const players = Array.from(playerMap.values()).map(player => {
        // Berechne Feld-Tore und Quote
        // Für unser Team (Heim) enthält player.tore nur Feld-Tore (aus berechneTore)
        // Für Gegner-Spieler enthält player.tore bereits Feld- und 7m-Tore (aus berechneGegnerStatistiken)

        let gesamtTore = player.tore;
        let feldTore = player.tore;

        if (player.team === 'Heim') {
            // 7m Tore zum Gesamtergebnis addieren
            gesamtTore = player.tore + (player.siebenMeterTore || 0);
        } else {
            // Feldtore berechnen (7m abziehen, da sie in .tore enthalten sind)
            feldTore = player.tore - (player.siebenMeterTore || 0);
        }

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
