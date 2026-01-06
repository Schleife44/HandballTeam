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
            ballverlust: 0, // Renamed from techFehler
            stuermerfoul: 0, // NEW
            block: 0, // NEW
            rausgeholt2min: 0, // NEW
            gewonnen1v1: 0, // NEW
            oneOnOneLost: 0, // NEW - 1v1 Verloren
            rausgeholt7m: 0, // NEW
            siebenMeter: 0,
            siebenMeterTore: 0,
            siebenMeterVersuche: 0,
            guteAktion: 0,
            gelb: 0,
            zweiMinuten: 0,
            rot: 0,
            tore: 0,
            timeOnField: player.timeOnField || 0 // NEW
        });
    });

    for (const eintrag of log) {
        // --- CHECK ATTRIBUTION for 1v1 Lost (even if playerId is null or opponent) ---
        if ((eintrag.action === "Gegner 1und1" || eintrag.action === "Gegner 1v1") &&
            eintrag.attributedPlayer &&
            (eintrag.attributedPlayer.teamKey === 'myteam' || !eintrag.attributedPlayer.isOpponent)) {

            const targetId = eintrag.attributedPlayer.number;
            if (statsMap.has(targetId)) {
                statsMap.get(targetId).oneOnOneLost++;
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
        } else if (eintrag.action === "Technischer Fehler" || eintrag.action === "Ballverlust") {
            stats.ballverlust++;
        } else if (eintrag.action === "Foul") {
            stats.stuermerfoul++;
        } else if (eintrag.action === "Block") {
            // "Block" clicked on Home Player -> Home Player was blocked (Shooter)
            // So Home Player gets Fehlwurf (Miss), Not Block.
            stats.fehlwurf++;
            // The blocker (Opponent) is handled in berechneGegnerStatistiken via attributedPlayer check
        } else if (eintrag.action === "Gegner Block" &&
            eintrag.attributedPlayer &&
            eintrag.attributedPlayer.teamKey === 'myteam') {
            // Opponent Shot blocked by Home Player (Attributed)
            // The Home Player gets the Block stat
            if (eintrag.attributedPlayer.number == player.number) {
                stats.block++;
                stats.guteAktion++;
            }
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
                timeOnField: p.timeOnField || 0 // Merge time directly
            });
        });
    }

    for (const eintrag of log) {
        // Determine if relevant for Opponent Stats
        let nummer = null;
        let isDirectAction = false;
        let isAttribution = false;

        if (eintrag.action.startsWith("Gegner") || eintrag.gegnerNummer) {
            nummer = eintrag.gegnerNummer || "Team";
            isDirectAction = true;
        } else if ((eintrag.action === "1und1" || eintrag.action === "1v1") &&
            eintrag.attributedPlayer &&
            (eintrag.attributedPlayer.isOpponent || eintrag.attributedPlayer.teamKey === 'opponent')) {
            nummer = eintrag.attributedPlayer.number;
            isAttribution = true;
        } else if (eintrag.action === "Block" &&
            eintrag.attributedPlayer &&
            (eintrag.attributedPlayer.isOpponent || eintrag.attributedPlayer.teamKey === 'opponent')) {
            nummer = eintrag.attributedPlayer.number;
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
                timeOnField: 0
            });
        }

        const stats = gegnerStatsMap.get(nummer);

        if (isAttribution) {
            // Handle Attributed Actions (Heim -> Opponent)
            if (eintrag.action === "1und1" || eintrag.action === "1v1") {
                stats.oneOnOneLost++;
            } else if (eintrag.action === "Block") {
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
            } else if (eintrag.action === "Gegner TF") {
                stats.techFehler++; // BV
            } else if (eintrag.action === "Gegner Gelb") {
                stats.gelb++;
            } else if (eintrag.action === "Gegner 2 min") {
                stats.zweiMinuten++;
            } else if (eintrag.action === "Gegner Rot") {
                stats.rot++;
            } else if (eintrag.action === "Gegner 1und1" || eintrag.action === "Gegner 1v1" || eintrag.action === "Gegner 1v1 Gewonnen") {
                stats.gewonnen1v1++;
            } else if (eintrag.action === "Gegner Block") {
                // stats.block++; // Removed - Opponent SHOT was blocked
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
