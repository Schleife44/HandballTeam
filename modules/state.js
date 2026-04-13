import { formatiereZeit } from './utils.js';
import { saveSpielstandToFirestore, getAuthUid } from './firebase.js';

export const SPEICHER_KEY_BASE = 'handballTeamState';

function getStorageKey() {
    const uid = getAuthUid();
    return uid ? `${SPEICHER_KEY_BASE}_${uid}` : SPEICHER_KEY_BASE;
}

export let spielstand = {
    uiState: 'setup', // 'setup' oder 'game'
    gameMode: 'complex', // 'complex' = Dashboard, 'simple' = Modal (Old System)
    modeSelected: false, // Flag for Selection UI
    isSpielAktiv: false, // NEW: Tracking if a match is currently running
    selectedPlayer: { index: null, team: null, gegnerNummer: null, name: null }, // Current selection
    roster: [], // { name: 'Anna', number: 7 } - Name ist optional
    score: { heim: 0, gegner: 0 },
    gameLog: [],
    timer: {
        gamePhase: 1, // 1=Vor Spiel, 2=1. HZ, 3=Halbzeit, 4=2. HZ, 5=Beendet
        istPausiert: true,
        segmentStartZeit: 0,
        verstricheneSekundenBisher: 0,
        videoStartTime: null // Continuous timer for video analysis
    },
    activeSuspensions: [],
    settings: {
        darkMode: false,

        showWurfbildHeim: true,
        showWurfbildGegner: true,
        showWurfpositionHeim: true,
        showWurfpositionGegner: true,
        teamNameHeim: 'Heim',
        teamNameGegner: 'Gegner',
        teamColor: '#dc3545', // Default Red
        teamColorGegner: '#2563eb', // Default Blue
        isAuswaertsspiel: false,
        combinedThrowMode: true, // false = hintereinander, true = kombiniert
        useGoalZones: false, // New: Use 9-zone grid for shooting
        useFieldZones: false, // New: Use 9 functional zones for field positions

        // Team identity settings (cross-game)
        teamSettingsValidated: false,
        myTeamName: '',
        myTeamColor: '#dc3545',

        // New Calendar Settings
        calendar: {
            requireReason: false,
            deadlineHours: 0,
            defaultStatus: 'none' // 'none' or 'going'
        }
    },
    knownOpponents: [], // { number: 7, name: 'Max' } - Name ist optional
    calendarEvents: [], // { id, title, type, date, time, location }
    calendarSubscriptions: [], // { id, url, title, lastUpdated }
    rosterAssignments: {} // { uid: 'Spieler Name' } - Wer ist welcher Kader-Spieler
};

// --- Deep Clone of Initial State for Reset ---
const INITIAL_SPIELSTAND = JSON.parse(JSON.stringify(spielstand));

export function speichereSpielstand() {
    localStorage.setItem(getStorageKey(), JSON.stringify(spielstand));
    // Also sync to Firestore (debounced, non-blocking)
    saveSpielstandToFirestore(spielstand);
}

export function ladeSpielstandDaten() {
    const gespeicherterStand = localStorage.getItem(getStorageKey());
    if (!gespeicherterStand) {
        return false; // Nichts geladen
    }

    try {
        const geladen = JSON.parse(gespeicherterStand);
        Object.assign(spielstand, geladen);

        // Kompatibilität & Standards sicherstellen
        if (!spielstand.score) spielstand.score = { heim: 0, gegner: 0 };
        if (!spielstand.timer.gamePhase) spielstand.timer.gamePhase = 1;
        if (!spielstand.activeSuspensions) spielstand.activeSuspensions = [];
        if (!spielstand.settings) spielstand.settings = {};

        if (typeof spielstand.settings.darkMode === 'undefined') spielstand.settings.darkMode = false;

        if (typeof spielstand.settings.showWurfbildHeim === 'undefined') spielstand.settings.showWurfbildHeim = true;
        if (typeof spielstand.settings.showWurfbildGegner === 'undefined') spielstand.settings.showWurfbildGegner = true;
        if (typeof spielstand.settings.showWurfpositionHeim === 'undefined') spielstand.settings.showWurfpositionHeim = true;
        if (typeof spielstand.settings.showWurfpositionGegner === 'undefined') spielstand.settings.showWurfpositionGegner = true;
        if (!spielstand.settings.teamNameHeim) spielstand.settings.teamNameHeim = 'Heim';
        if (!spielstand.settings.teamNameGegner) spielstand.settings.teamNameGegner = 'Gegner';
        if (typeof spielstand.settings.isAuswaertsspiel === 'undefined') spielstand.settings.isAuswaertsspiel = false;
        if (typeof spielstand.settings.combinedThrowMode === 'undefined') spielstand.settings.combinedThrowMode = true;
        if (typeof spielstand.settings.useGoalZones === 'undefined') spielstand.settings.useGoalZones = false;
        if (typeof spielstand.settings.useFieldZones === 'undefined') spielstand.settings.useFieldZones = false;

        // Team identity defaults
        if (typeof spielstand.settings.teamSettingsValidated === 'undefined') spielstand.settings.teamSettingsValidated = false;
        if (!spielstand.settings.myTeamName) spielstand.settings.myTeamName = '';
        if (!spielstand.settings.myTeamColor) spielstand.settings.myTeamColor = '#dc3545';
        
        // --- SANITY CHECK: isSpielAktiv vs gamePhase ---
        // 1=Vor Spiel, 2=1. HZ, 3=Halbzeit, 4=2. HZ, 5=Beendet
        const phase = spielstand.timer?.gamePhase || 1;
        if (phase === 1 || phase === 5) {
            if (spielstand.isSpielAktiv) {
                console.log('[DEBUG] state.js: isSpielAktiv was true but phase was %s. Resetting to false.', phase);
                spielstand.isSpielAktiv = false;
            }
        }

        if (!spielstand.knownOpponents) spielstand.knownOpponents = [];
        if (!spielstand.rosterAssignments) spielstand.rosterAssignments = {};
        if (typeof spielstand.isSpielAktiv === 'undefined') spielstand.isSpielAktiv = false;

        // Migration: Konvertiere alte Gegner-Nummern zu Objekt-Format
        if (spielstand.knownOpponents.length > 0 && typeof spielstand.knownOpponents[0] === 'number') {
            spielstand.knownOpponents = spielstand.knownOpponents.map(num => ({
                number: num,
                name: ''
            }));
        }

        return true; // Erfolgreich geladen
    } catch (e) {
        console.error("Fehler beim Laden des Spielstands:", e);
        return false;
    }
}

/**
 * Merge remote Firestore data into the local spielstand.
 * Called by the onSnapshot listener whenever remote data changes.
 * @param {Object} remoteData
 */
export function mergeRemoteSpielstand(remoteData) {
    if (!remoteData) return;
    try {
        // --- CRITICAL FIX: Preserve Local Selection ---
        // Stored local selection should not be overwritten by remote sync unless explicitly needed.
        const localSelection = JSON.parse(JSON.stringify(spielstand.selectedPlayer || { index: null, team: null, gegnerNummer: null, name: null }));

        // Synchronize all keys from remote to local
        const syncFields = [
            'score', 'gameLog', 'timer', 'roster', 'knownOpponents', 
            'settings', 'activeSuspensions', 'calendarEvents', 'calendarSubscriptions',
            'uiState', 'gameMode', 'modeSelected', 'rosterAssignments', 
            'absences', 'isSpielAktiv'
        ];

        syncFields.forEach(key => {
            if (remoteData[key] !== undefined) {
                spielstand[key] = remoteData[key];
            }
        });

        // Restore local selection
        spielstand.selectedPlayer = localSelection;
        // Also persist to localStorage so offline fallback is fresh
        localStorage.setItem(getStorageKey(), JSON.stringify(spielstand));
    } catch (e) {
        console.error('[State] mergeRemoteSpielstand error:', e);
    }
}

export function getOpponentLabel() {
    return spielstand.settings.isAuswaertsspiel ? 'Heim' : 'Gast';
}

export function getMyTeamLabel() {
    return spielstand.settings.isAuswaertsspiel ? 'Gast' : 'Heim';
}

/**
 * Resets the local spielstand object to its default values.
 */
export function resetSpielstand() {
    console.log('[State] Resetting spielstand to default');
    Object.assign(spielstand, JSON.parse(JSON.stringify(INITIAL_SPIELSTAND)));
    clearLocalState();
}

/**
 * Completely wipes all local storage game state and history fragments.
 * Iterates through all keys and removes anything prefixed with 'handball'.
 */
export function clearLocalState() {
    // Collect all keys to remove to avoid mutation issues during iteration
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('handball')) {
            keysToRemove.push(key);
        }
    }
    
    keysToRemove.forEach(key => {
        localStorage.removeItem(key);
    });
    
    console.log(`[State] Session isolation: ${keysToRemove.length} local keys cleared.`);
}
