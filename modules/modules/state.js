import { formatiereZeit } from './utils.js';

export const SPEICHER_KEY = 'handballTeamState';

export let spielstand = {
    uiState: 'setup', // 'setup' oder 'game'
    roster: [], // { name: 'Anna', number: 7 } - Name ist optional
    score: { heim: 0, gegner: 0 },
    gameLog: [],
    timer: {
        gamePhase: 1, // 1=Vor Spiel, 2=1. HZ, 3=Halbzeit, 4=2. HZ, 5=Beendet
        istPausiert: true,
        segmentStartZeit: 0,
        verstricheneSekundenBisher: 0,
    },
    activeSuspensions: [],
    settings: {
        darkMode: false,

        showWurfbildHeim: false,
        showWurfbildGegner: true,
        showWurfpositionHeim: true,
        showWurfpositionGegner: true,
        teamNameHeim: 'Heim',
        teamNameGegner: 'Gegner',
        teamColor: '#dc3545', // Default Red
        teamColorGegner: '#2563eb', // Default Blue
        isAuswaertsspiel: false
    },
    knownOpponents: [] // { number: 7, name: 'Max' } - Name ist optional
};

export function speichereSpielstand() {
    localStorage.setItem(SPEICHER_KEY, JSON.stringify(spielstand));
}

export function ladeSpielstandDaten() {
    const gespeicherterStand = localStorage.getItem(SPEICHER_KEY);
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

        if (typeof spielstand.settings.showWurfbildHeim === 'undefined') spielstand.settings.showWurfbildHeim = false;
        if (typeof spielstand.settings.showWurfbildGegner === 'undefined') spielstand.settings.showWurfbildGegner = false;
        if (typeof spielstand.settings.showWurfpositionHeim === 'undefined') spielstand.settings.showWurfpositionHeim = false;
        if (typeof spielstand.settings.showWurfpositionGegner === 'undefined') spielstand.settings.showWurfpositionGegner = false;
        if (!spielstand.settings.teamNameHeim) spielstand.settings.teamNameHeim = 'Heim';
        if (!spielstand.settings.teamNameGegner) spielstand.settings.teamNameGegner = 'Gegner';
        if (typeof spielstand.settings.isAuswaertsspiel === 'undefined') spielstand.settings.isAuswaertsspiel = false;

        if (!spielstand.knownOpponents) spielstand.knownOpponents = [];

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
