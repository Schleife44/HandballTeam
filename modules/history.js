const HISTORY_KEY = 'handball_history';

/**
 * Saves a game to local storage.
 * @param {Object} gameData All relevant game data (score, log, teams, etc).
 */
export function speichereSpielInHistorie(gameData) {
    const history = getHistorie();
    const newEntry = {
        id: Date.now(), // Timestamp as unique ID
        date: new Date().toISOString(),
        ...gameData
    };

    // Add to beginning of array
    history.unshift(newEntry);

    // Save back
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    console.log("Spiel gespeichert:", newEntry);
    return newEntry;
}

/**
 * Retrieves the full game history.
 * @returns {Array} List of games.
 */
export function getHistorie() {
    try {
        const raw = localStorage.getItem(HISTORY_KEY);
        if (!raw) return [];
        return JSON.parse(raw);
    } catch (e) {
        console.error("Fehler beim Laden der Historie:", e);
        return [];
    }
}

/**
 * Gets a specific game by ID.
 * @param {number} id 
 * @returns {Object|null}
 */
export function getSpielAusHistorie(id) {
    const history = getHistorie();
    return history.find(g => g.id === Number(id)) || null;
}

/**
 * Deletes a game by ID.
 * @param {number} id 
 */
export function loescheSpielAusHistorie(id) {
    let history = getHistorie();
    history = history.filter(g => g.id !== Number(id));
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

/**
 * Exports history as JSON file (Backup)
 */
export function exportHistorie() {
    const history = getHistorie();
    if (history.length === 0) {
        alert("Keine Historie vorhanden.");
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
