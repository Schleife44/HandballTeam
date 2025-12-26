import { spielstand, speichereSpielstand } from './state.js';
import {
    rosterBereich, spielBereich, globalAktionen, scoreWrapper,
    statistikWrapper, gamePhaseButton, timerAnzeige, pauseButton,
    heimScoreUp, heimScoreDown, gegnerScoreUp, gegnerScoreDown,
    gegnerNummerModal, sevenMeterOutcomeModal, aktionsMenue, aktionVorauswahl, kommentarBereich,
    wurfpositionModal
} from './dom.js';
import {
    applyViewSettings, updateScoreDisplay, updateProtokollAnzeige,
    updateTorTracker, updateSuspensionDisplay, zeichneSpielerRaster,
    zeichneStatistikTabelle, oeffneWurfbildModal, oeffneGegnerNummerModal as uiOeffneGegnerNummerModal,
    oeffneAktionsMenueUI, schliesseAktionsMenueUI, zeichneRosterListe
} from './ui.js';
import { startTimer, stoppTimer, updateTimer } from './timer.js';
import { formatiereZeit } from './utils.js';
import { berechneStatistiken } from './stats.js';
import { customConfirm, customAlert } from './customDialog.js';

let aktuellerSpielerIndex = null;
export let aktuelleAktionTyp = '';
let currentGegnerActionType = 'tor'; // 'tor', '7m', '2min'

// Verfolge, ob die aktuelle Aktion für den Gegner ist
let istGegnerAktion = false;
let aktuelleGegnernummer = null;

export function setSteuerungAktiv(aktiv) {
    const spielerButtons = document.querySelectorAll('.spieler-button');
    spielerButtons.forEach(btn => btn.disabled = !aktiv);

    heimScoreUp.disabled = !aktiv;
    heimScoreDown.disabled = !aktiv;
    gegnerScoreUp.disabled = !aktiv;
    gegnerScoreDown.disabled = !aktiv;
}

export function switchToGame() {
    if (spielstand.roster.length === 0) {
        customAlert("Bitte füge zuerst Spieler hinzu.");
        return;
    }
    spielstand.uiState = 'game';
    speichereSpielstand();

    rosterBereich.classList.add('versteckt');
    spielBereich.classList.remove('versteckt');
    if (globalAktionen) globalAktionen.classList.remove('versteckt');
    scoreWrapper.classList.remove('versteckt');

    applyViewSettings();

    statistikWrapper.classList.add('versteckt');

    if (spielstand.timer.gamePhase === 1) {
        spielstand.timer.istPausiert = true;
        gamePhaseButton.textContent = 'Spielstart';
        timerAnzeige.textContent = formatiereZeit(0);
        setSteuerungAktiv(false);
        updateScoreDisplay();
        pauseButton.classList.add('versteckt');
        pauseButton.disabled = true;
    }

    zeichneSpielerRaster();
    updateProtokollAnzeige();
    updateTorTracker();
    updateSuspensionDisplay();
}

export function switchToRoster() {
    spielstand.uiState = 'setup';
    speichereSpielstand();

    spielBereich.classList.add('versteckt');
    rosterBereich.classList.remove('versteckt');
    if (globalAktionen) globalAktionen.classList.add('versteckt');
    scoreWrapper.classList.add('versteckt');
    statistikSidebar.classList.add('versteckt');

    stoppTimer(); // Stelle sicher, dass Timer stoppt

    // Sync toggle state with display
    const teamToggle = document.getElementById('teamToggle');
    const teamHeaderTitle = document.getElementById('teamHeaderTitle');
    const isOpponentMode = teamToggle && teamToggle.checked;

    if (teamHeaderTitle) {
        teamHeaderTitle.textContent = isOpponentMode ? 'Gegner Team' : 'Heim Team';
    }

    // Populate team name fields
    const rosterTeamNameHeim = document.getElementById('rosterTeamNameHeim');
    const rosterTeamNameGegner = document.getElementById('rosterTeamNameGegner');

    if (rosterTeamNameHeim) {
        rosterTeamNameHeim.value = spielstand.settings?.teamNameHeim || 'Heim';
    }
    if (rosterTeamNameGegner) {
        rosterTeamNameGegner.value = spielstand.settings?.teamNameGegner || 'Gegner';
    }

    zeichneRosterListe(isOpponentMode);
}

export function handleGamePhaseClick() {
    const phase = spielstand.timer.gamePhase;
    if (phase === 5) return;

    if (phase === 1) {
        spielstand.timer.gamePhase = 2;
        gamePhaseButton.textContent = 'Halbzeit';
        startTimer();
        setSteuerungAktiv(true);
        pauseButton.classList.remove('versteckt');
        pauseButton.disabled = false;

    } else if (phase === 2) {
        spielstand.timer.gamePhase = 3;
        gamePhaseButton.textContent = 'Weiter (2. HZ)';
        stoppTimer();
        setSteuerungAktiv(false);
        pauseButton.classList.add('versteckt');
        pauseButton.disabled = true;
        logGlobalAktion('Halbzeit');

    } else if (phase === 1.5) {
        spielstand.timer.gamePhase = 2;
        gamePhaseButton.textContent = 'Halbzeit';
        startTimer();
        setSteuerungAktiv(true);
        pauseButton.classList.remove('versteckt');
        pauseButton.disabled = false;

    } else if (phase === 3) {
        spielstand.timer.gamePhase = 4;
        gamePhaseButton.textContent = 'Spiel Ende';
        startTimer();
        setSteuerungAktiv(true);
        pauseButton.classList.remove('versteckt');
        pauseButton.disabled = false;
        logGlobalAktion('Start 2. Halbzeit');

    } else if (phase === 3.5) {
        spielstand.timer.gamePhase = 4;
        gamePhaseButton.textContent = 'Spiel Ende';
        startTimer();
        setSteuerungAktiv(true);
        pauseButton.classList.remove('versteckt');
        pauseButton.disabled = false;

    } else if (phase === 4) {
        spielstand.timer.gamePhase = 5;
        gamePhaseButton.textContent = 'Beendet';
        gamePhaseButton.disabled = true;
        gamePhaseButton.classList.add('beendet');
        stoppTimer();
        setSteuerungAktiv(false);
        pauseButton.classList.add('versteckt');
        pauseButton.disabled = true;
        logGlobalAktion('Spiel Ende');

        zeichneStatistikTabelle(berechneStatistiken());
        statistikWrapper.classList.remove('versteckt');
    }
    speichereSpielstand();
}

export function handleRealPauseClick() {
    if (spielstand.timer.gamePhase !== 2 && spielstand.timer.gamePhase !== 4) return;

    if (spielstand.timer.istPausiert === false) {
        // PAUSIEREN
        stoppTimer();
        pauseButton.textContent = 'Weiter';
        // --- ÄNDERUNG: Knöpfe bleiben aktiv ---
        gamePhaseButton.disabled = false;
    } else {
        // FORTSETZEN
        startTimer();
        pauseButton.textContent = 'Pause';
        setSteuerungAktiv(true);
    }
    speichereSpielstand();
}

export function oeffneAktionsMenue(index) {
    aktuellerSpielerIndex = index;
    istGegnerAktion = false;
    aktuelleGegnernummer = null;
    oeffneAktionsMenueUI(index);
}

export function oeffneGegnerAktionsMenue(gegnernummer) {
    istGegnerAktion = true;
    aktuelleGegnernummer = gegnernummer;
    aktuellerSpielerIndex = null;
    // Öffne UI mit Anzeige der Gegnernummer
    const player = { number: gegnernummer, name: `Gegner #${gegnernummer}` };
    oeffneAktionsMenueUI(null, player);
}

export function schliesseAktionsMenue() {
    schliesseAktionsMenueUI();
    aktuellerSpielerIndex = null;
    aktuelleAktionTyp = '';
    istGegnerAktion = false;
    aktuelleGegnernummer = null;
}

export function setAktuelleAktionTyp(typ) {
    aktuelleAktionTyp = typ;
}

export function logAktion(aktion, kommentar = null) {
    // Prüfe, ob dies eine Gegner-Aktion ist
    if (istGegnerAktion && aktuelleGegnernummer) {
        handleGegnerAktion(aktion, kommentar);
        return;
    }

    // Behandle 7m-Aktion - zeige zuerst Ergebnis-Modal
    if (aktion === "7m") {
        const player = spielstand.roster[aktuellerSpielerIndex];
        spielstand.temp7mPlayer = {
            index: aktuellerSpielerIndex,
            number: player.number,
            name: player.name,
            isOpponent: false
        };
        schliesseAktionsMenue();
        sevenMeterOutcomeModal.classList.remove('versteckt');
        return;
    }

    const player = spielstand.roster[aktuellerSpielerIndex];
    const aktuelleZeit = timerAnzeige.textContent;

    if (aktion === "Tor") {
        spielstand.score.heim++;
    }
    const aktuellerSpielstand = `${spielstand.score.heim}:${spielstand.score.gegner}`;
    updateScoreDisplay();

    if (aktion === "2 Minuten" || aktion === "Rote Karte") {
        spielstand.activeSuspensions.push({
            type: 'heim',
            number: player.number,
            remaining: 120
        });
        updateSuspensionDisplay();
    }

    // Log-Eintrag
    spielstand.gameLog.unshift({
        time: aktuelleZeit,
        playerId: player.number,
        playerName: player.name,
        action: aktion,
        kommentar: kommentar,
        spielstand: aktuellerSpielstand,
        wurfbild: null
    });

    updateProtokollAnzeige();
    updateTorTracker();
    speichereSpielstand();
    schliesseAktionsMenue();

    // Zeige Modals basierend auf Einstellungen (Wurfposition zuerst, dann Wurfbild)
    if (aktion === "Tor" || aktion === "Fehlwurf") {
        if (spielstand.settings.showWurfpositionHeim) {
            wurfpositionModal.classList.remove('versteckt');
        } else if (spielstand.settings.showWurfbildHeim) {
            oeffneWurfbildModal('standard');
        }
    }
}

function handleGegnerAktion(aktion, kommentar) {
    const gegnernummer = aktuelleGegnernummer;
    const aktuelleZeit = timerAnzeige.textContent;

    let mappedAction = '';
    let shouldOpenWurfbild = false;

    // Mappe Heim-Aktionen auf Gegner-Aktionen
    if (aktion === "Tor") {
        mappedAction = "Gegner Tor";
        shouldOpenWurfbild = spielstand.settings.showWurfbildGegner;
        spielstand.score.gegner++;
    } else if (aktion === "7m") {
        // Zeige 7m-Ergebnis-Modal für Gegner
        spielstand.tempGegnerNummer = gegnernummer;
        spielstand.temp7mPlayer = { isOpponent: true };
        schliesseAktionsMenue();
        sevenMeterOutcomeModal.classList.remove('versteckt');
        return; // Früher Abbruch - handle7mOutcome übernimmt
    } else if (aktion === "Fehlwurf") {
        mappedAction = "Gegner Wurf Vorbei";
        shouldOpenWurfbild = spielstand.settings.showWurfbildGegner;
    } else if (aktion === "2 Minuten") {
        mappedAction = "Gegner 2 min";
        spielstand.activeSuspensions.push({
            type: 'gegner',
            number: gegnernummer,
            remaining: 120
        });
        updateSuspensionDisplay();
    } else if (aktion === "Gelbe Karte") {
        mappedAction = "Gegner Gelb";
    } else if (aktion === "Rote Karte") {
        mappedAction = "Gegner Rot";
        spielstand.activeSuspensions.push({
            type: 'gegner',
            number: gegnernummer,
            remaining: 120
        });
        updateSuspensionDisplay();
    } else {
        // Für andere Aktionen, präfixiere einfach mit "Gegner"
        mappedAction = `Gegner ${aktion}`;
    }

    const aktuellerSpielstand = `${spielstand.score.heim}:${spielstand.score.gegner}`;
    updateScoreDisplay();

    spielstand.gameLog.unshift({
        time: aktuelleZeit,
        playerId: null,
        playerName: "SPIEL",
        action: mappedAction,
        kommentar: kommentar,
        spielstand: aktuellerSpielstand,
        gegnerNummer: gegnernummer,
        wurfbild: null
    });

    updateProtokollAnzeige();
    updateTorTracker();
    speichereSpielstand();
    schliesseAktionsMenue();

    // Zeige Modals basierend auf Einstellungen (Wurfposition zuerst, dann Wurfbild)
    // Nur für Tor und Fehlwurf (gemappt auf Gegner Tor und Gegner Wurf Vorbei)
    const isTorOrFehlwurf = mappedAction === "Gegner Tor" || mappedAction === "Gegner Wurf Vorbei";
    if (isTorOrFehlwurf && (shouldOpenWurfbild || spielstand.settings.showWurfpositionGegner)) {
        spielstand.tempGegnerNummer = gegnernummer;
        if (spielstand.settings.showWurfpositionGegner) {
            wurfpositionModal.classList.remove('versteckt');
        } else if (shouldOpenWurfbild) {
            oeffneWurfbildModal('gegner');
        }
    }
}

export function logGlobalAktion(aktion, kommentar = null, gegnerNummer = null) {
    const aktuelleZeit = timerAnzeige.textContent;

    if (aktion === "Gegner 7m") {
        if (spielstand.settings.showWurfbildGegner) {
            oeffneGegnerNummerModal('7m');
            return;
        } else {
            spielstand.score.gegner++;
            aktion = "Gegner 7m Tor";
        }
    }
    else if (aktion === "Gegner Wurf") {
        oeffneGegnerNummerModal('wurf');
        return;
    }
    else if (aktion === "Gegner 2 min") {
        oeffneGegnerNummerModal('2min');
        return;
    }
    else if (aktion === "Gegner Tor") {
        // Increment score for opponent goals
        spielstand.score.gegner++;
    }
    // Hinweis: "Gegner Wurf Vorbei" ändert den Spielstand nicht

    const aktuellerSpielstand = `${spielstand.score.heim}:${spielstand.score.gegner}`;
    updateScoreDisplay();

    spielstand.gameLog.unshift({
        time: aktuelleZeit,
        playerId: null,
        playerName: "SPIEL",
        action: aktion,
        kommentar: kommentar,
        spielstand: aktuellerSpielstand,
        gegnerNummer: gegnerNummer,
        wurfbild: null
    });

    updateProtokollAnzeige();
    updateTorTracker();
    speichereSpielstand();
}

export function logScoreKorrektur(team, change) {
    const aktuelleZeit = timerAnzeige.textContent;

    if (team === 'heim') {
        spielstand.score.heim += change;
        if (spielstand.score.heim < 0) spielstand.score.heim = 0;
    } else {
        spielstand.score.gegner += change;
        if (spielstand.score.gegner < 0) spielstand.score.gegner = 0;
    }

    const aktuellerSpielstand = `${spielstand.score.heim}:${spielstand.score.gegner}`;
    updateScoreDisplay();

    const teamName = team === 'heim' ? spielstand.settings.teamNameHeim : spielstand.settings.teamNameGegner;
    const changeText = change > 0 ? "+1" : "-1";
    const aktion = `Manuelle Korrektur (${teamName} ${changeText})`;

    spielstand.gameLog.unshift({
        time: aktuelleZeit,
        playerId: null,
        playerName: "SPIEL",
        action: aktion,
        kommentar: null,
        spielstand: aktuellerSpielstand
    });

    updateProtokollAnzeige();
    updateTorTracker();
    speichereSpielstand();
}

export function oeffneGegnerNummerModal(type) {
    currentGegnerActionType = type;
    uiOeffneGegnerNummerModal(type);
}

export function speichereGegnerNummer(nummer, name = '') {
    nummer = parseInt(nummer);
    const aktuelleZeit = timerAnzeige.textContent;

    if (currentGegnerActionType === '2min') {
        spielstand.activeSuspensions.push({
            type: 'gegner',
            number: nummer,
            remaining: 120
        });
        updateSuspensionDisplay();

        spielstand.gameLog.unshift({
            time: aktuelleZeit,
            playerId: null,
            playerName: "SPIEL",
            action: "Gegner 2 min",
            kommentar: `(Nr. ${nummer})`,
            spielstand: `${spielstand.score.heim}:${spielstand.score.gegner}`,
            gegnerNummer: nummer,
            wurfbild: null
        });

        gegnerNummerModal.classList.add('versteckt');
    }
    else if (currentGegnerActionType === '7m') {
        spielstand.tempGegnerNummer = nummer;
        gegnerNummerModal.classList.add('versteckt');
        sevenMeterOutcomeModal.classList.remove('versteckt');
    }
    else if (currentGegnerActionType === 'wurf') {
        spielstand.tempGegnerNummer = nummer;
        gegnerNummerModal.classList.add('versteckt');
        oeffneWurfbildModal('gegner');
    }
    else {
        gegnerNummerModal.classList.add('versteckt');
    }

    // Füge Gegner als Objekt hinzu, falls noch nicht vorhanden
    if (nummer && !spielstand.knownOpponents.find(opp => opp.number === nummer)) {
        spielstand.knownOpponents.push({ number: nummer, name: name || '' });
        spielstand.knownOpponents.sort((a, b) => a.number - b.number);
    }
    speichereSpielstand();
    updateProtokollAnzeige();
    zeichneSpielerRaster(); // Aktualisiere das Raster, damit neuer Gegner erscheint
}

export function handle7mOutcome(outcome) {
    sevenMeterOutcomeModal.classList.add('versteckt');
    const aktuelleZeit = timerAnzeige.textContent;

    // Prüfe, ob dies ein Heim- oder Gegner-7m ist
    const temp7mPlayer = spielstand.temp7mPlayer;
    const isOpponent = istGegnerAktion || (temp7mPlayer && temp7mPlayer.isOpponent) || (!temp7mPlayer);

    let aktion = "";
    let playerId = null;
    let playerName = "SPIEL";
    let kommentar = null;
    let nummer = null;

    if (isOpponent) {
        // Gegner-7m
        nummer = spielstand.tempGegnerNummer || aktuelleGegnernummer;
        kommentar = nummer ? `(Nr. ${nummer})` : null;

        if (outcome === 'Tor') {
            spielstand.score.gegner++;
            aktion = "Gegner 7m Tor";
        } else if (outcome === 'Gehalten') {
            aktion = "Gegner 7m Gehalten";
        } else {
            aktion = "Gegner 7m Verworfen";
        }
    } else {
        // Heimspieler-7m
        playerId = temp7mPlayer.number;
        playerName = temp7mPlayer.name;

        if (outcome === 'Tor') {
            spielstand.score.heim++;
            aktion = "7m Tor";
        } else if (outcome === 'Gehalten') {
            aktion = "7m Gehalten";
        } else {
            aktion = "7m Verworfen";
        }
    }

    const aktuellerSpielstand = `${spielstand.score.heim}:${spielstand.score.gegner}`;
    updateScoreDisplay();

    spielstand.gameLog.unshift({
        time: aktuelleZeit,
        playerId: playerId,
        playerName: playerName,
        action: aktion,
        kommentar: kommentar,
        spielstand: aktuellerSpielstand,
        gegnerNummer: nummer,
        wurfbild: null
    });

    updateProtokollAnzeige();
    updateTorTracker();
    speichereSpielstand();

    // Zeige Wurfbild-Modal, falls aktiviert
    const showWurfbild = isOpponent ? spielstand.settings.showWurfbildGegner : spielstand.settings.showWurfbildHeim;
    if (showWurfbild) {
        spielstand.temp7mOutcome = outcome;
        oeffneWurfbildModal(isOpponent ? 'gegner7m' : 'standard');
    } else {
        // Aufräumen
        spielstand.tempGegnerNummer = null;
        spielstand.temp7mPlayer = null;
        spielstand.temp7mOutcome = null;
    }
}

export async function loescheProtokollEintrag(index) {
    const confirmed = await customConfirm("Möchtest du diesen Eintrag wirklich löschen?", "Eintrag löschen?");
    if (confirmed) {

        const geloeschterEintrag = spielstand.gameLog[index];
        spielstand.gameLog.splice(index, 1);

        // Rechne Score zurück
        if (geloeschterEintrag.action === "Tor") {
            spielstand.score.heim--;
        } else if (geloeschterEintrag.action === "Gegner Tor" || geloeschterEintrag.action === "Gegner 7m Tor") {
            spielstand.score.gegner--;
        } else if (geloeschterEintrag.action.includes("Korrektur")) {
            if (geloeschterEintrag.action.includes(spielstand.settings.teamNameHeim + " +1") || geloeschterEintrag.action.includes("Heim +1")) {
                spielstand.score.heim--;
            } else if (geloeschterEintrag.action.includes(spielstand.settings.teamNameHeim + " -1") || geloeschterEintrag.action.includes("Heim -1")) {
                spielstand.score.heim++;
            } else if (geloeschterEintrag.action.includes(spielstand.settings.teamNameGegner + " +1") || geloeschterEintrag.action.includes("Gegner +1")) {
                spielstand.score.gegner--;
            } else if (geloeschterEintrag.action.includes(spielstand.settings.teamNameGegner + " -1") || geloeschterEintrag.action.includes("Gegner -1")) {
                spielstand.score.gegner++;
            }
        }

        if (spielstand.score.heim < 0) spielstand.score.heim = 0;
        if (spielstand.score.gegner < 0) spielstand.score.gegner = 0;

        updateScoreDisplay();
        updateProtokollAnzeige();
        updateTorTracker();
        speichereSpielstand();
    }
}


export async function starteNeuesSpiel() {
    const confirmed = await customConfirm("Bist du sicher? Das löscht das gesamte Spielprotokoll, aber dein Team bleibt gespeichert.", "Neues Spiel?");
    if (confirmed) {

        spielstand.gameLog = [];
        spielstand.score = { heim: 0, gegner: 0 };
        spielstand.activeSuspensions = [];
        spielstand.knownOpponents = [];
        spielstand.timer = {
            gamePhase: 1,
            istPausiert: true,
            segmentStartZeit: 0,
            verstricheneSekundenBisher: 0,
        };

        speichereSpielstand();
        location.reload();
    }
}

export function skipGegnerNummer() {
    if (currentGegnerActionType === '2min') {
        const aktuelleZeit = timerAnzeige.textContent;
        spielstand.activeSuspensions.push({ type: 'gegner', number: '?', remaining: 120 });
        updateSuspensionDisplay();
        spielstand.gameLog.unshift({
            time: aktuelleZeit,
            playerId: null, playerName: "SPIEL",
            action: "Gegner 2 min", kommentar: null,
            spielstand: `${spielstand.score.heim}:${spielstand.score.gegner}`,
            gegnerNummer: null, wurfbild: null
        });
        gegnerNummerModal.classList.add('versteckt');
    }
    else if (currentGegnerActionType === '7m') {
        const aktuelleZeit = timerAnzeige.textContent;
        spielstand.gameLog.unshift({
            time: aktuelleZeit,
            playerId: null, playerName: "SPIEL",
            action: "Gegner 7m", kommentar: null,
            spielstand: `${spielstand.score.heim}:${spielstand.score.gegner}`,
            gegnerNummer: null, wurfbild: null
        });
        gegnerNummerModal.classList.add('versteckt');
        sevenMeterOutcomeModal.classList.remove('versteckt');
    } else {
        gegnerNummerModal.classList.add('versteckt');
        oeffneWurfbildModal('standard');
    }
}
