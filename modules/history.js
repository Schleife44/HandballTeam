import { customAlert } from './customDialog.js';

const HISTORY_KEY = 'handball_history';

/**
 * Speichert ein Spiel im Local Storage.
 * @param {Object} gameData Alle relevanten Spieldaten (Spielstand, Log, Teams, etc.).
 */
export function speichereSpielInHistorie(gameData) {
    const history = getHistorie();
    const newEntry = {
        id: Date.now(), // Zeitstempel als eindeutige ID
        date: new Date().toISOString(),
        ...gameData
    };

    // Am Anfang des Arrays hinzufügen
    history.unshift(newEntry);

    // Zurückspeichern
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    console.log("Spiel gespeichert:", newEntry);
    return newEntry;
}

/**
 * Ruft die vollständige Spielhistorie ab.
 * @returns {Array} Liste der Spiele.
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
 * Ruft ein bestimmtes Spiel mittels ID ab.
 * @param {number} id 
 * @returns {Object|null}
 */
export function getSpielAusHistorie(id) {
    const history = getHistorie();
    return history.find(g => g.id === Number(id)) || null;
}

/**
 * Löscht ein Spiel mittels ID.
 * @param {number} id 
 */
export function loescheSpielAusHistorie(id) {
    let history = getHistorie();
    history = history.filter(g => g.id !== Number(id));
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

/**
 * Exportiert Historie als JSON-Datei (Backup)
 */
export function exportHistorie() {
    const history = getHistorie();
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

        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                const history = getHistorie();
                let importedCount = 0;

                // Prüfe, ob es ein Array (mehrere Spiele) oder ein einzelnes Spiel ist
                const games = Array.isArray(data) ? data : [data];

                games.forEach(game => {
                    // Validiere, dass es wie ein Spiel-Objekt aussieht
                    if (game.teams && game.score && game.gameLog) {
                        // Generiere neue ID, um Konflikte zu vermeiden
                        const newGame = {
                            ...game,
                            id: Date.now() + importedCount, // Eindeutige ID
                            date: game.date || new Date().toISOString()
                        };
                        history.unshift(newGame);
                        importedCount++;
                    }
                });

                if (importedCount > 0) {
                    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
                    resolve({
                        success: true,
                        count: importedCount,
                        message: `${importedCount} Spiel(e) erfolgreich importiert!`
                    });
                } else {
                    resolve({
                        success: false,
                        count: 0,
                        message: "Keine gültigen Spiele in der Datei gefunden."
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

