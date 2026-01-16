import { spielstand } from './state.js';

// Helper to get logic source (Live vs History)
function getSource(overrideGameLog) {
    if (overrideGameLog) return overrideGameLog;
    return spielstand.gameLog;
}

function getRoster(overrideRoster) {
    if (overrideRoster) return overrideRoster;
    return spielstand.roster;
}

export function berechneTore(overrideGameLog) {
    const toreMap = new Map();
    const log = getSource(overrideGameLog);

    for (const eintrag of log) {
        if (eintrag.action === "Tor" && eintrag.playerId) {
            toreMap.set(eintrag.playerId, (toreMap.get(eintrag.playerId) || 0) + 1);
        }
    }
    return toreMap;
}

export function berechneStatistiken(overrideGameLog, overrideRoster) {
    const statsMap = new Map();
    const roster = getRoster(overrideRoster);
    const log = getSource(overrideGameLog);

    roster.forEach(player => {
        statsMap.set(player.number, {
            name: player.name,
            number: player.number,
            fehlwurf: 0,
            ballverlust: 0,
            stuermerfoul: 0,
            block: 0,
            rausgeholt2min: 0,
            gewonnen1v1: 0,
            oneOnOneLost: 0,
            rausgeholt7m: 0,
            siebenMeter: 0,
            siebenMeterTore: 0,
            siebenMeterVersuche: 0,
            guteAktion: 0,
            assist: 0,
            gelb: 0,
            zweiMinuten: 0,
            rot: 0,
            tore: 0,
            tore: 0,
            playStats: {
                schnelle_mitte: { tore: 0, fehlwurf: 0 },
                tempo_gegenstoss: { tore: 0, fehlwurf: 0 },
                spielzug: { tore: 0, fehlwurf: 0 },
                freies_spiel: { tore: 0, fehlwurf: 0 },
                unknown: { tore: 0, fehlwurf: 0 }
            },
            timeOnField: player.timeOnField || 0
        });
    });

    for (const eintrag of log) {
        // --- ASSIST AGGREGATION ---
        if (eintrag.assist && eintrag.assist.nummer) {
            const assistId = eintrag.assist.nummer;
            if (statsMap.has(assistId)) {
                statsMap.get(assistId).assist++;
                statsMap.get(assistId).guteAktion++;
            }
        }

        // --- CHECK ATTRIBUTION for 1v1 Lost ---
        if ((eintrag.action === "Gegner 1und1" || eintrag.action === "Gegner 1v1") &&
            eintrag.attributedPlayer &&
            (eintrag.attributedPlayer.teamKey === 'myteam' || !eintrag.attributedPlayer.isOpponent)) {

            const targetId = eintrag.attributedPlayer.number;
            if (statsMap.has(targetId)) {
                statsMap.get(targetId).oneOnOneLost++;
            }
        }

        // --- CHECK ATTRIBUTION for Block ---
        if (eintrag.action.includes("Block") &&
            eintrag.attributedPlayer) {

            const p = eintrag.attributedPlayer;
            const target = p.number !== undefined ? p.number : p.nummer;
            // Robust lookup for player stats
            const s = statsMap.get(target) || statsMap.get(parseInt(target)) || statsMap.get(String(target));

            if (s) {
                s.block++;
                s.guteAktion++;
            }
        }

        if (!eintrag.playerId || !statsMap.has(eintrag.playerId)) {
            continue;
        }

        const stats = statsMap.get(eintrag.playerId);

        if (eintrag.action === "Steal" || eintrag.action === "Assist" ||
            eintrag.action === "Abwehr" || eintrag.action === "Guter Pass" ||
            eintrag.action === "Parade" || eintrag.action === "Gegner Parade" ||
            eintrag.action === "TG Pass" ||
            eintrag.action.startsWith("Gute Aktion")) {
            stats.guteAktion++;
        } else if (eintrag.action === "Fehlwurf" || eintrag.action === "Wurf Gehalten" || eintrag.action === "Post Out") {
            stats.fehlwurf++;
            const pType = eintrag.playType || eintrag.spielart;
            if (pType) {
                if (!stats.playStats[pType]) stats.playStats[pType] = { tore: 0, fehlwurf: 0 };
                stats.playStats[pType].fehlwurf++;
            }
        } else if (eintrag.action === "Technischer Fehler" || eintrag.action === "Ballverlust") {
            stats.ballverlust++;
        } else if (eintrag.action === "Foul") {
            stats.stuermerfoul++;
        } else if (eintrag.action === "Block") {
            stats.fehlwurf++;
        } else if (eintrag.action === "2min Provoziert") {
            stats.rausgeholt2min++;
            stats.guteAktion++;
        } else if (eintrag.action === "1und1") {
            stats.gewonnen1v1++;
            stats.guteAktion++;
        } else if (eintrag.action === "7M Rausgeholt" || eintrag.action === "7m Provoziert") {
            stats.rausgeholt7m++;
            stats.guteAktion++;
        } else if (eintrag.action === "7m+2min") {
            stats.rausgeholt7m++;
            stats.rausgeholt2min++;
            stats.guteAktion++;
        } else if (eintrag.action === "Gelbe Karte") {
            stats.gelb++;
        } else if (eintrag.action === "2 Minuten") {
            stats.zweiMinuten++;
        } else if (eintrag.action === "Rote Karte") {
            stats.rot++;
        } else if (eintrag.action === "Tor") {
            stats.tore++;
            const pType = eintrag.playType || eintrag.spielart;
            if (pType) {
                if (!stats.playStats[pType]) stats.playStats[pType] = { tore: 0, fehlwurf: 0 };
                stats.playStats[pType].tore++;
            }
        } else if (eintrag.action === "7m Tor") {
            stats.tore++;
            stats.siebenMeterTore++;
            stats.siebenMeterVersuche++;
        } else if (eintrag.action === "7m Verworfen" || eintrag.action === "7m Gehalten") {
            stats.siebenMeterVersuche++;
        }
    }

    return Array.from(statsMap.values());
}

export function berechneGegnerStatistiken(overrideGameLog, players = []) {
    const gegnerStatsMap = new Map();
    const log = getSource(overrideGameLog);

    // Initialize from Players (Roster) first to catch those with time but no actions
    if (players && Array.isArray(players)) {
        players.forEach(p => {
            const nummer = p.number;
            const name = p.name || `Gegner #${nummer}`;
            gegnerStatsMap.set(nummer, {
                name: name,
                number: nummer,
                tore: 0,
                fehlwurf: 0,
                techFehler: 0,
                ballverlust: 0,
                stuermerfoul: 0,
                siebenMeter: 0,
                siebenMeterTore: 0,
                siebenMeterVersuche: 0,
                guteAktion: 0,
                gelb: 0,
                zweiMinuten: 0,
                rot: 0,
                block: 0,
                rausgeholt2min: 0,
                rausgeholt7m: 0,
                gewonnen1v1: 0,
                oneOnOneLost: 0,
                timeOnField: p.timeOnField || 0, // Merge time directly
                playStats: {
                    schnelle_mitte: { tore: 0, fehlwurf: 0 },
                    tempo_gegenstoss: { tore: 0, fehlwurf: 0 },
                    spielzug: { tore: 0, fehlwurf: 0 },
                    freies_spiel: { tore: 0, fehlwurf: 0 },
                    unknown: { tore: 0, fehlwurf: 0 }
                }
            });
        });
    }

    for (const eintrag of log) {
        // --- ASSIST AGGREGATION ---
        if (eintrag.assist && eintrag.assist.nummer) {
            const assistNum = parseInt(eintrag.assist.nummer);
            if (gegnerStatsMap.has(assistNum)) {
                gegnerStatsMap.get(assistNum).assist++;
                gegnerStatsMap.get(assistNum).guteAktion++;
            }
        }

        // Determine if relevant for Opponent Stats
        let nummer = null;
        let isDirectAction = false;
        let isAttribution = false;

        if (eintrag.action.startsWith("Gegner") || eintrag.gegnerNummer) {
            const val = eintrag.gegnerNummer;
            nummer = (val !== undefined && val !== null) ? parseInt(val) : "Team";
            isDirectAction = true;
        } else if ((eintrag.action === "1und1" || eintrag.action === "1v1") &&
            eintrag.attributedPlayer &&
            (eintrag.attributedPlayer.isOpponent || eintrag.attributedPlayer.teamKey === 'opponent')) {
            nummer = parseInt(eintrag.attributedPlayer.number);
            isAttribution = true;
        } else if (eintrag.action.includes("Block") &&
            eintrag.attributedPlayer &&
            (eintrag.attributedPlayer.isOpponent || eintrag.attributedPlayer.teamKey === 'opponent')) {
            const val = eintrag.attributedPlayer.number !== undefined ? eintrag.attributedPlayer.number : eintrag.attributedPlayer.nummer;
            nummer = parseInt(val);
            isAttribution = true;
        }

        if (!nummer) continue;

        const name = (nummer === "Team") ? "Gegner (Team)" : `Gegner #${nummer}`;

        if (!gegnerStatsMap.has(nummer)) {
            gegnerStatsMap.set(nummer, {
                name: name,
                number: nummer,
                tore: 0,
                fehlwurf: 0,
                techFehler: 0,
                ballverlust: 0,
                stuermerfoul: 0,
                siebenMeter: 0,
                siebenMeterTore: 0,
                siebenMeterVersuche: 0,
                guteAktion: 0,
                assist: 0,
                gelb: 0,
                zweiMinuten: 0,
                rot: 0,
                block: 0,
                rausgeholt2min: 0,
                rausgeholt7m: 0,
                gewonnen1v1: 0,
                oneOnOneLost: 0,
                timeOnField: 0,
                playStats: {
                    schnelle_mitte: { tore: 0, fehlwurf: 0 },
                    tempo_gegenstoss: { tore: 0, fehlwurf: 0 },
                    spielzug: { tore: 0, fehlwurf: 0 },
                    freies_spiel: { tore: 0, fehlwurf: 0 },
                    unknown: { tore: 0, fehlwurf: 0 }
                }
            });
        }

        const stats = gegnerStatsMap.get(nummer);

        if (isAttribution) {
            // Handle Attributed Actions (Heim -> Opponent)
            if (eintrag.action === "1und1" || eintrag.action === "1v1") {
                stats.oneOnOneLost++;
            } else if (eintrag.action.includes("Block")) {
                stats.block++;
            }
        } else {
            // Handle Direct Actions
            if (eintrag.action === "Gegner Tor") {
                stats.tore++;
            } else if (eintrag.action === "Gegner 7m Tor") {
                stats.tore++;
                stats.siebenMeterTore++;
                stats.siebenMeterVersuche++;
            } else if (eintrag.action === "Gegner Wurf Vorbei" ||
                eintrag.action === "Gegner Wurf Gehalten" ||
                eintrag.action === "Gehalten") {
                stats.fehlwurf++;
            } else if (eintrag.action === "Gegner 7m Verworfen" ||
                eintrag.action === "Gegner 7m Gehalten") {
                stats.fehlwurf++;
                stats.siebenMeterVersuche++;
            } else if (eintrag.action.startsWith("Gegner Gute Aktion")) {
                stats.guteAktion++;
            } else if (eintrag.action === "Gegner TF" || eintrag.action === "Gegner Technischer Fehler" || eintrag.action === "Gegner Ballverlust") {
                stats.techFehler++;
                stats.ballverlust++;
            } else if (eintrag.action === "Gegner Stürmerfoul" || eintrag.action === "Gegner Foul") {
                stats.stuermerfoul++;
            } else if (eintrag.action === "Gegner Gelb") {
                stats.gelb++;
            } else if (eintrag.action === "Gegner 2 min") {
                stats.zweiMinuten++;
            } else if (eintrag.action === "Gegner Rot") {
                stats.rot++;
            } else if (eintrag.action === "Gegner 1und1" || eintrag.action === "Gegner 1v1" || eintrag.action === "Gegner 1v1 Gewonnen") {
                stats.gewonnen1v1++;
            } else if (eintrag.action === "Gegner Block") {
                // stats.block++; // Removed
                stats.fehlwurf++; // Count as miss for the shooter

            } else if (eintrag.action === "Gegner 2min Provoziert") {
                stats.rausgeholt2min++;
            } else if (eintrag.action === "Gegner 7m Provoziert") {
                stats.rausgeholt7m++;
            } else if (eintrag.action === "Gegner 7m+2min") {
                stats.rausgeholt7m++;
                stats.rausgeholt2min++;
            }
        }
    }

    return Array.from(gegnerStatsMap.values()).sort((a, b) => {
        const numA = parseInt(a.number) || 999;
        const numB = parseInt(b.number) || 999;
        return numA - numB;
    });
}

export function berechneWurfbilder(overrideGameLog) {
    const heimWuerfe = {};
    const gegnerWuerfe = {};
    const gegner7mWuerfe = {};
    const heim7mWuerfe = {};
    const log = getSource(overrideGameLog);

    log.forEach(eintrag => {
        if (!eintrag.wurfbild && !eintrag.wurfposition) return;

        const wurfEntry = {
            ...(eintrag.wurfbild || {}),
            wurfposition: eintrag.wurfposition || null,
            action: eintrag.action
        };

        if ((eintrag.action === "Tor" || eintrag.action === "Fehlwurf" || eintrag.action === "Wurf Gehalten" || eintrag.action === "Block") && eintrag.playerId) {
            if (!heimWuerfe[eintrag.playerId]) {
                heimWuerfe[eintrag.playerId] = {
                    name: eintrag.playerName, number: eintrag.playerId, wuerfe: [], isOpponent: false
                };
            }
            heimWuerfe[eintrag.playerId].wuerfe.push(wurfEntry);
        }
        else if (eintrag.action.startsWith("7m ") && eintrag.playerId) {
            if (!heim7mWuerfe[eintrag.playerId]) {
                heim7mWuerfe[eintrag.playerId] = {
                    name: `${eintrag.playerName} (7m)`, number: eintrag.playerId, wuerfe: [], isOpponent: false
                };
            }
            heim7mWuerfe[eintrag.playerId].wuerfe.push(wurfEntry);
        }
        else if (eintrag.action === "Gegner Tor" || eintrag.action === "Gegner Wurf Vorbei" || eintrag.action === "Gegner Wurf Gehalten" || eintrag.action === "Gegner Fehlwurf" || eintrag.action === "Gegner Parade" || eintrag.action === "Gegner Block") {
            const key = eintrag.gegnerNummer ? eintrag.gegnerNummer : "Unbekannt";
            if (!gegnerWuerfe[key]) {
                gegnerWuerfe[key] = {
                    name: eintrag.gegnerNummer ? `Gegner #${eintrag.gegnerNummer}` : "Gegner (Unbekannt)",
                    number: eintrag.gegnerNummer || 999, wuerfe: [], isOpponent: true
                };
            }
            gegnerWuerfe[key].wuerfe.push(wurfEntry);
        }
        else if (eintrag.action.includes("Gegner 7m")) {
            const key = eintrag.gegnerNummer ? eintrag.gegnerNummer : "Unbekannt";
            if (!gegner7mWuerfe[key]) {
                gegner7mWuerfe[key] = {
                    name: eintrag.gegnerNummer ? `Gegner #${eintrag.gegnerNummer} (7m)` : "Gegner (Unbekannt) (7m)",
                    number: eintrag.gegnerNummer || 999, wuerfe: [], isOpponent: true
                };
            }
            gegner7mWuerfe[key].wuerfe.push(wurfEntry);
        }
    });

    return {
        heim: Object.values(heimWuerfe),
        heim7m: Object.values(heim7mWuerfe),
        gegner: Object.values(gegnerWuerfe),
        gegner7m: Object.values(gegner7mWuerfe)
    };
}

/**
 * Berechnet Statistiken pro Spielart (Angriffsvariante)
 * @param {Array} overrideGameLog - Optional: Anderer GameLog (z.B. für Historie)
 * @returns {Object} Statistiken pro Spielart mit Toren, Würfen und Quote
 */
export function berechneSpielartStatistik(overrideGameLog) {
    const log = getSource(overrideGameLog);

    // Helper to create empty structure
    const createStatStructure = () => ({
        schnelle_mitte: { name: 'Schnelle Mitte', tore: 0, wuerfe: 0 },
        tempo_gegenstoss: { name: 'Tempo Gegenstoß', tore: 0, wuerfe: 0 },
        spielzug: { name: 'Spielzug', tore: 0, wuerfe: 0 },
        freies_spiel: { name: 'Freies Spiel', tore: 0, wuerfe: 0 },
        ohne: { name: 'Ohne Angabe', tore: 0, wuerfe: 0 }
    });

    const heimStats = createStatStructure();
    const gegnerStats = createStatStructure();

    // Actions die als Wurf zählen (Heim)
    const wurfActionsHeim = ['Tor', 'Fehlwurf', 'Wurf Gehalten', 'Gehalten', 'Parade', 'Block', 'Post Out'];
    // Actions die als Wurf zählen (Gegner)
    const wurfActionsGegner = ['Gegner Tor', 'Gegner Wurf Vorbei', 'Gegner Wurf Gehalten', 'Gegner Fehlwurf', 'Gegner Parade', 'Gegner Block', 'Gehalten'];

    for (const eintrag of log) {
        const isGegner = eintrag.action.startsWith('Gegner');
        const spielart = eintrag.playType || eintrag.spielart || 'ohne';

        // Heim-Aktionen
        if (!isGegner && eintrag.playerId) {
            const isWurf = wurfActionsHeim.some(a => eintrag.action.includes(a));
            const isTor = eintrag.action === 'Tor';

            if (isWurf || isTor) {
                if (heimStats[spielart]) {
                    heimStats[spielart].wuerfe++;
                    if (isTor) heimStats[spielart].tore++;
                }
            }
        }

        // Gegner-Aktionen
        if (isGegner) {
            const isWurf = wurfActionsGegner.some(a => eintrag.action === a);
            const isTor = eintrag.action === 'Gegner Tor';

            if (isWurf) {
                if (gegnerStats[spielart]) {
                    gegnerStats[spielart].wuerfe++;
                    if (isTor) gegnerStats[spielart].tore++;
                }
            }
        }
    }

    // Quote berechnen
    const calcQuotes = (stats) => {
        Object.values(stats).forEach(s => {
            s.quote = s.wuerfe > 0 ? Math.round((s.tore / s.wuerfe) * 100) : 0;
        });
        return stats;
    };

    return {
        heim: calcQuotes(heimStats),
        gegner: calcQuotes(gegnerStats)
    };
}
