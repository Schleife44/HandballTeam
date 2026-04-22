import { fetchHandballNetGame, mapHandballNetToInternal, parseGameId } from './handballNetImport.js';
import { updateHistorieSpiel } from './history.js';
import { customAlert } from './customDialog.js';

/**
 * Helper: Convert "MM:SS" to seconds
 */
const toSecs = (str) => {
    if (!str) return 0;
    const pts = str.split(':');
    return parseInt(pts[0]) * 60 + (parseInt(pts[1]) || 0);
};

/**
 * Main function to sync a historical game with handball.net ticker data.
 * @param {Object} game The game object from history.
 * @param {string} hnetUrl The URL to the game report on handball.net.
 */
export async function syncGameWithHandballNet(game, hnetUrl) {
    const gameId = parseGameId(hnetUrl);
    if (!gameId) {
        throw new Error("Ungültige handball.net URL.");
    }
    
    // 1. Fetch and Parse Hnet Data
    const rawData = await fetchHandballNetGame(gameId);
    const hnetGame = mapHandballNetToInternal(rawData, game.settings?.myTeamName);
    
    if (!hnetGame || !hnetGame.gameLog || hnetGame.gameLog.length === 0) {
        throw new Error("Keine Ticker-Daten auf handball.net gefunden.");
    }
    
    // 2. Perform Matching
    const localLog = game.gameLog || [];
    const hnetLog = hnetGame.gameLog;
    const syncedLog = [...localLog];
    
    // We want to match official events to OUR events to give them timestamps
    const matchedHnetIds = new Set();
    const addedDetails = [];
    const matchDetails = [];
    const unmatchedLocal = [];
    let matchesCount = 0;

    // PASS 1: High Precision Matching (Time + Action + Score)
    syncedLog.forEach(localEntry => {
        // Safety: Ensure unique ID for reliable UI matching later
        if (!localEntry.id) localEntry.id = "local_" + Math.random().toString(36).substr(2, 9);

        if (localEntry.timestamp && !String(localEntry.timestamp).startsWith('manual')) {
            // Already has a real timestamp from original live tracking? 
            // We might still want to refine it if user wants official ones.
        }

        const localTime = toSecs(localEntry.time);
        
        // Find candidates in hnetLog
        const candidates = hnetLog.filter(hnetEntry => {
            if (matchedHnetIds.has(hnetEntry.importMeta?.hnetId)) return false;
            
            // Match action type (Tor, 7m Tor, 2 Min, etc.)
            const actionsMatch = normalizeAction(localEntry.action) === normalizeAction(hnetEntry.action);
            if (!actionsMatch) return false;

            // Match period (Half)
            if (localEntry.half && hnetEntry.half && localEntry.half !== hnetEntry.half) return false;

            // Match time window (+/- 90 seconds (1.5m) for manual lag)
            const timeDiff = Math.abs(toSecs(hnetEntry.time) - localTime);
            return timeDiff <= 90;
        });

        // STRIKTES MATCHING: Priorisiere Spielstand + Zeit
        let bestMatch = null;
        if (candidates.length > 0) {
            // Sort: 1. Score Match, 2. Time Difference
            candidates.sort((a, b) => {
                const scoreA = (a.spielstand || "").replace(/\s/g, "");
                const scoreB = (b.spielstand || "").replace(/\s/g, "");
                const localScore = (localEntry.spielstand || "").replace(/\s/g, "");
                
                const matchA = scoreA === localScore;
                const matchB = scoreB === localScore;
                
                if (matchA !== matchB) return matchA ? -1 : 1;
                
                // Same score status? Smallest time difference wins
                const diffA = Math.abs(toSecs(a.time) - localTime);
                const diffB = Math.abs(toSecs(b.time) - localTime);
                return diffA - diffB;
            });
            
            bestMatch = candidates[0];
        }

        if (bestMatch) {
            // SYNC DATA
            localEntry.timestamp = bestMatch.timestamp;
            localEntry.hnetId = bestMatch.importMeta?.hnetId;
            localEntry.half = bestMatch.half; // Official half
            localEntry.officialTime = bestMatch.time; // Store original ticker time
            
            matchedHnetIds.add(bestMatch.importMeta?.hnetId);
            matchDetails.push({
                action: localEntry.action,
                localTime: localEntry.time,
                hnetTime: bestMatch.time,
                type: normalizeAction(localEntry.action)
            });
            matchesCount++;
        } else {
            // Track unmatched local event
            unmatchedLocal.push({
                ...localEntry,
                type: normalizeAction(localEntry.action)
            });
        }
    });

    const unmatchedHnet = hnetLog.filter(h => !matchedHnetIds.has(h.importMeta?.hnetId)).map(h => ({
        ...h,
        hnetId: h.importMeta?.hnetId,
        type: normalizeAction(h.action)
    }));

    // PASS 2: Add missing official events (Timeouts, Cards we missed, etc.)
    // We only add them if they are definitely NOT in our log
    hnetLog.forEach(hnetEntry => {
        if (matchedHnetIds.has(hnetEntry.importMeta?.hnetId)) return;

        // Only add significant events that change game state if they weren't matched
        const syncableTypes = ["Timeout", "Gegner Timeout", "Gelbe Karte", "Gegner Gelbe Karte", "Rote Karte", "Gegner Rote Karte", "Halbzeit", "Spielende"];
        
        if (syncableTypes.some(type => hnetEntry.action.includes(type))) {
            const newEntry = {
                ...hnetEntry,
                hnetId: hnetEntry.importMeta?.hnetId,
                isOfficialOnly: true // Mark as auto-added
            };
            delete newEntry.importMeta;
            syncedLog.push(newEntry);
            addedDetails.push({
                action: hnetEntry.action,
                hnetTime: hnetEntry.time,
                type: normalizeAction(hnetEntry.action)
            });
            // Mark as matched now so it's not in the 'unmatched ticker' list
            matchedHnetIds.add(newEntry.hnetId);
        }
    });

    // 3. Interpolation for Unmatched Events
    // This gives them a "guess" timestamp so they are near the right spot in video
    interpolateUnsyncedTimestamps(syncedLog);

    // 4. Finalize and Save
    syncedLog.sort((a, b) => {
        // ALWAYS sort by game time primarily to keep protocol clean
        if (a.half !== b.half) return (a.half || 1) - (b.half || 1);
        const timeA = toSecs(a.time);
        const timeB = toSecs(b.time);
        if (timeA !== timeB) return timeA - timeB;
        // Secondary sort by timestamp if times are identical
        if (a.timestamp && b.timestamp) return a.timestamp - b.timestamp;
        return 0;
    });

    game.gameLog = syncedLog;
    game.hnetGameId = gameId; // Link it permanently
    game.isSynced = true;

    await updateHistorieSpiel(game);
    
    // Final unmatchedHnet are those still not in the set
    const finalUnmatchedHnet = hnetLog.filter(h => !matchedHnetIds.has(h.importMeta?.hnetId)).map(h => ({
        hnetId: h.importMeta?.hnetId,
        action: h.action,
        time: h.time,
        spielstand: h.spielstand,
        timestamp: h.timestamp,
        half: h.half,
        type: normalizeAction(h.action)
    }));

    return { 
        matchesCount, 
        addedCount: addedDetails.length, 
        addedDetails, 
        matchDetails,
        unmatchedLocal,
        unmatchedHnet: finalUnmatchedHnet
    };
}

/**
 * Interpolates timestamps for events that were not matched.
 */
function interpolateUnsyncedTimestamps(log) {
    // Sort log by game time for reliable interpolation
    log.sort((a, b) => {
        const getAbsSecs = (e) => {
            const h = e.half || (toSecs(e.time || "00:00") > 1800 ? 2 : 1);
            return (h - 1) * 1800 + toSecs(e.time || "00:00");
        };
        return getAbsSecs(a) - getAbsSecs(b);
    });

    for (let i = 0; i < log.length; i++) {
        if (!log[i].timestamp) {
            const currentHalf = log[i].half || (toSecs(log[i].time) > 1800 ? 2 : 1);
            
            // Find boundaries WITHIN THE SAME HALF
            let prev = null;
            for (let j = i - 1; j >= 0; j--) {
                if (log[j].timestamp && typeof log[j].timestamp === 'number' && log[j].half === currentHalf) {
                    prev = log[j];
                    break;
                }
            }
            let next = null;
            for (let j = i + 1; j < log.length; j++) {
                if (log[j].timestamp && typeof log[j].timestamp === 'number' && log[j].half === currentHalf) {
                    next = log[j];
                    break;
                }
            }

            if (prev && next) {
                // Classic interpolation within same half
                const t1 = toSecs(prev.time);
                const t2 = toSecs(next.time);
                const tC = toSecs(log[i].time);
                
                if (t2 > t1) {
                    const ratio = (tC - t1) / (t2 - t1);
                    log[i].timestamp = prev.timestamp + (next.timestamp - prev.timestamp) * ratio;
                    log[i].isInterpolated = true;
                }
            } else if (prev) {
                // Game-clock based delta from prev same-half anchor
                const deltaSecs = toSecs(log[i].time) - toSecs(prev.time);
                log[i].timestamp = prev.timestamp + (deltaSecs * 1000);
                log[i].isInterpolated = true;
            } else if (next) {
                // Game-clock based delta from next same-half anchor
                const deltaSecs = toSecs(next.time) - toSecs(log[i].time);
                log[i].timestamp = next.timestamp - (deltaSecs * 1000);
                log[i].isInterpolated = true;
            }
        }
    }
}

/**
 * Normalizes action strings for better matching.
 */
export function normalizeAction(action) {
    if (!action) return "";
    let a = action.toLowerCase();
    
    // Explicitly exclude non-official events first
    if (a.includes("parade") || a.includes("vorbei") || a.includes("fehlwurf") || a.includes("pfosten") || a.includes("latte")) {
        return a;
    }

    if (/\btor\b/.test(a) || a.startsWith("7m tor")) return "goal";
    if (a.includes("2 min") || a.includes("zeitstrafe") || a.includes("hinausstellung")) return "penalty";
    if (a.includes("gelb")) return "yellow";
    if (a.includes("rot") || a.includes("disqualifikation")) return "red";
    if (a.includes("timeout")) return "timeout";
    if (a.includes("halbzeit")) return "halftime";
    if (a.includes("ende")) return "end";
    
    return a;
}
