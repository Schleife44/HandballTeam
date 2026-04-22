import { 
    getActiveTeamId, saveGameToHistory, loadTeamHistory, deleteGameFromHistory,
    getAuthUid
} from './firebase.js';

const HISTORY_KEY_BASE = 'handball_history_';

function getHistoryKey() {
    const uid = getAuthUid();
    return uid ? `${HISTORY_KEY_BASE}${uid}_global` : `${HISTORY_KEY_BASE}global`;
}

/**
 * Speichert ein Spiel in der Cloud (oder lokal als Fallback).
 * @param {Object} gameData Alle relevanten Spieldaten.
 */
export async function speichereSpielInHistorie(gameData) {
    const teamId = getActiveTeamId();
    const newEntry = {
        id: Date.now(),
        date: new Date().toISOString(),
        ...gameData
    };

    if (teamId) {
        // 1. Cloud Save
        await saveGameToHistory(teamId, newEntry);
    } else {
        // 2. Local Fallback
        const history = await getHistorie();
        history.unshift(newEntry);
        localStorage.setItem(getHistoryKey(), JSON.stringify(history));
    }

    return newEntry;
}

/**
 * Aktualisiert ein bestehendes Spiel in der Historie.
 */
export async function updateHistorieSpiel(gameData) {
    const teamId = getActiveTeamId();
    if (teamId) {
        await saveGameToHistory(teamId, gameData);
    } else {
        const history = await getHistorie();
        const idx = history.findIndex(g => String(g.id) === String(gameData.id));
        if (idx !== -1) {
            history[idx] = gameData;
            localStorage.setItem(getHistoryKey(), JSON.stringify(history));
        }
    }
}

/**
 * Ruft die Spielhistorie für das aktive Team ab.
 * @returns {Promise<Array>} Liste der Spiele.
 */
export async function getHistorie() {
    const teamId = getActiveTeamId();
    
    if (teamId) {
        // Load from Cloud
        return await loadTeamHistory(teamId);
    }

    // Local Fallback
    try {
        const raw = localStorage.getItem(getHistoryKey());
        if (!raw) return [];
        return JSON.parse(raw);
    } catch (e) {
        console.error("Fehler beim Laden der lokalen Historie:", e);
        return [];
    }
}

/**
 * Ruft ein bestimmtes Spiel mittels ID ab.
 */
export async function getSpielAusHistorie(id) {
    const history = await getHistorie();
    return history.find(g => String(g.id) === String(id)) || null;
}

/**
 * Löscht ein Spiel mittels ID.
 */
export async function loescheSpielAusHistorie(id) {
    const teamId = getActiveTeamId();
    if (teamId) {
        await deleteGameFromHistory(teamId, id);
    } else {
        let history = await getHistorie();
        history = history.filter(g => String(g.id) !== String(id));
        localStorage.setItem(getHistoryKey(), JSON.stringify(history));
    }
}

/**
 * Clears the local history fallback (used on logout).
 */
export function clearLocalHistory() {
    localStorage.removeItem(getHistoryKey());
    console.log('[History] Local history cache cleared');
}

/**
 * Exportiert Historie als JSON-Datei (Backup)
 */
export async function exportHistorie() {
    const history = await getHistorie();
    if (history.length === 0) {
        customAlert("Keine Historie vorhanden.");
        return;
    }
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `handball_historie_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

/**
 * Importiert ein einzelnes Spiel oder mehrere Spiele aus einer JSON-Datei
 * @param {File} file - Die zu importierende JSON-Datei
 * @returns {Promise<{success: boolean, count: number, message: string}>}
 */
export function importiereSpiel(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                const teamId = getActiveTeamId();
                let importedCount = 0;

                // Prüfe, ob es ein Array (mehrere Spiele) oder ein einzelnes Spiel ist
                const games = Array.isArray(data) ? data : [data];

                for (const game of games) {
                    // Validiere, dass es wie ein Spiel-Objekt aussieht
                    if (game.teams && game.score && game.gameLog) {
                        // Generiere neue ID, um Konflikte zu vermeiden
                        const newGame = {
                            ...game,
                            id: Date.now() + importedCount,
                            date: game.date || new Date().toISOString()
                        };
                        await speichereSpielInHistorie(newGame);
                        importedCount++;
                    }
                }

                if (importedCount > 0) {
                    resolve({
                        success: true,
                        count: importedCount,
                        message: `${importedCount} Spiel(e) erfolgreich importiert!`
                    });
                } else {
                    resolve({
                        success: false,
                        count: 0,
                        message: "Fehler beim Lesen der Datei. Ist es eine gültige JSON-Datei?"
                    });
                }
            } catch (err) {
                console.error("Import error:", err);
                resolve({
                    success: false,
                    count: 0,
                    message: "Fehler beim Lesen der Datei. Ist es eine gültige JSON-Datei?"
                });
            }
        };

        reader.onerror = () => {
            resolve({
                success: false,
                count: 0,
                message: "Fehler beim Lesen der Datei."
            });
        };

        reader.readAsText(file);
    });
}

