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
            techFehler: 0,
            siebenMeter: 0,
            siebenMeterTore: 0,
            siebenMeterVersuche: 0,
            guteAktion: 0,
            gelb: 0,
            zweiMinuten: 0,
            rot: 0
        });
    });

    for (const eintrag of log) {
        if (!eintrag.playerId || !statsMap.has(eintrag.playerId)) {
            continue;
        }

        const stats = statsMap.get(eintrag.playerId);

        if (eintrag.action.startsWith("Gute Aktion")) {
            stats.guteAktion++;
        } else if (eintrag.action === "Fehlwurf") {
            stats.fehlwurf++;
        } else if (eintrag.action === "Technischer Fehler") {
            stats.techFehler++;
        } else if (eintrag.action === "7M Rausgeholt") {
            stats.siebenMeter++;
        } else if (eintrag.action === "Gelbe Karte") {
            stats.gelb++;
        } else if (eintrag.action === "2 Minuten") {
            stats.zweiMinuten++;
        } else if (eintrag.action === "Rote Karte") {
            stats.rot++;
        }

        else if (eintrag.action === "7m Tor") {
            stats.siebenMeterTore++;
            stats.siebenMeterVersuche++;
        } else if (eintrag.action === "7m Verworfen" || eintrag.action === "7m Gehalten") {
            stats.siebenMeterVersuche++;
        }
    }

    return Array.from(statsMap.values());
}

export function berechneGegnerStatistiken(overrideGameLog) {
    const gegnerStatsMap = new Map();
    const log = getSource(overrideGameLog);

    for (const eintrag of log) {
        const isGegner = eintrag.action.startsWith("Gegner") || eintrag.gegnerNummer;

        if (!isGegner) continue;

        const nummer = eintrag.gegnerNummer || "Team";
        const name = eintrag.gegnerNummer ? `Gegner #${nummer}` : "Gegner (Team)";

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
                rot: 0
            });
        }

        const stats = gegnerStatsMap.get(nummer);

        if (eintrag.action === "Gegner Tor") {
            stats.tore++;
        } else if (eintrag.action === "Gegner 7m Tor") {
            stats.tore++;
            stats.siebenMeterTore++;
            stats.siebenMeterVersuche++;
        } else if (eintrag.action === "Gegner Wurf Vorbei" ||
            eintrag.action === "Gehalten") {
            stats.fehlwurf++;
        } else if (eintrag.action === "Gegner 7m Verworfen" ||
            eintrag.action === "Gegner 7m Gehalten") {
            stats.fehlwurf++;
            stats.siebenMeterVersuche++;
        } else if (eintrag.action.startsWith("Gegner Gute Aktion") ||
            (eintrag.action.startsWith("Gute Aktion") && eintrag.gegnerNummer)) {
            stats.guteAktion++;
        } else if (eintrag.action === "Gegner TF") {
            stats.techFehler++;
        } else if (eintrag.action === "Gegner Gelb") {
            stats.gelb++;
        } else if (eintrag.action === "Gegner 2 min") {
            stats.zweiMinuten++;
        } else if (eintrag.action === "Gegner Rot") {
            stats.rot++;
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

        if ((eintrag.action === "Tor" || eintrag.action === "Fehlwurf") && eintrag.playerId) {
            if (!heimWuerfe[eintrag.playerId]) {
                heimWuerfe[eintrag.playerId] = {
                    name: eintrag.playerName, nummer: eintrag.playerId, wuerfe: [], isOpponent: false
                };
            }
            heimWuerfe[eintrag.playerId].wuerfe.push(wurfEntry);
        }
        else if (eintrag.action.startsWith("7m ") && eintrag.playerId) {
            if (!heim7mWuerfe[eintrag.playerId]) {
                heim7mWuerfe[eintrag.playerId] = {
                    name: `${eintrag.playerName} (7m)`, nummer: eintrag.playerId, wuerfe: [], isOpponent: false
                };
            }
            heim7mWuerfe[eintrag.playerId].wuerfe.push(wurfEntry);
        }
        else if (eintrag.action === "Gegner Tor" || eintrag.action === "Gegner Wurf Vorbei") {
            const key = eintrag.gegnerNummer ? eintrag.gegnerNummer : "Unbekannt";
            if (!gegnerWuerfe[key]) {
                gegnerWuerfe[key] = {
                    name: eintrag.gegnerNummer ? `Gegner #${eintrag.gegnerNummer}` : "Gegner (Unbekannt)",
                    nummer: eintrag.gegnerNummer || 999, wuerfe: [], isOpponent: true
                };
            }
            gegnerWuerfe[key].wuerfe.push(wurfEntry);
        }
        else if (eintrag.action.includes("Gegner 7m")) {
            const key = eintrag.gegnerNummer ? eintrag.gegnerNummer : "Unbekannt";
            if (!gegner7mWuerfe[key]) {
                gegner7mWuerfe[key] = {
                    name: eintrag.gegnerNummer ? `Gegner #${eintrag.gegnerNummer} (7m)` : "Gegner (Unbekannt) (7m)",
                    nummer: eintrag.gegnerNummer || 999, wuerfe: [], isOpponent: true
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
