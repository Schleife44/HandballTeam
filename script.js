// --- 1. Alle HTML-Elemente holen ---
// Bildschirme
const rosterBereich = document.getElementById('rosterBereich');
const spielBereich = document.getElementById('spielBereich');

// Roster-Erstellung
const addPlayerForm = document.getElementById('addPlayerForm');
const editPlayerIndex = document.getElementById('editPlayerIndex'); // Verstecktes Feld
const playerNameInput = document.getElementById('playerNameInput');
const playerNumberInput = document.getElementById('playerNumberInput');
const cancelEditButton = document.getElementById('cancelEditButton');
const rosterListe = document.getElementById('rosterListe');
const startGameButton = document.getElementById('startGameButton');

// Team Import/Export
const exportTeamButton = document.getElementById('exportTeamButton');
const importTeamButton = document.getElementById('importTeamButton');
const importFileInput = document.getElementById('importFileInput');

// Spiel-Modus
const verwaltung = document.getElementById('verwaltung');
const backToRosterButton = document.getElementById('backToRosterButton');
const exportButton = document.getElementById('exportButton');
const exportCsvButton = document.getElementById('exportCsvButton'); 
const neuesSpielButton = document.getElementById('neuesSpielButton');
const timerAnzeige = document.getElementById('timerAnzeige');
const suspensionContainer = document.getElementById('suspensionContainer'); 
const showWurfbilderButton = document.getElementById('showWurfbilderButton'); 

// Spielstand & Korrektur
const scoreAnzeige = document.getElementById('scoreAnzeige'); 
const scoreWrapper = document.getElementById('scoreWrapper'); 
const heimScoreUp = document.getElementById('heimScoreUp'); 
const heimScoreDown = document.getElementById('heimScoreDown'); 
const gegnerScoreUp = document.getElementById('gegnerScoreUp'); 
const gegnerScoreDown = document.getElementById('gegnerScoreDown'); 

// Teamnamen Displays
const teamNameHeimDisplay = document.getElementById('teamNameHeimDisplay');
const teamNameGegnerDisplay = document.getElementById('teamNameGegnerDisplay');
const labelTorTrackerHeim = document.getElementById('labelTorTrackerHeim');
const labelTorTrackerGegner = document.getElementById('labelTorTrackerGegner');


const zurueckButton = document.getElementById('zurueckButton');
const vorButton = document.getElementById('vorButton');
const pauseButton = document.getElementById('pauseButton'); 
const gamePhaseButton = document.getElementById('gamePhaseButton'); 
const spielerRaster = document.getElementById('spielerRaster');
const protokollAusgabe = document.getElementById('protokollAusgabe');

// Globale Aktionen
const globalAktionen = document.getElementById('globalAktionen');
const gegnerTorButton = document.getElementById('gegnerTorButton');
const gegner7mButton = document.getElementById('gegner7mButton'); 
const gegner2minButton = document.getElementById('gegner2minButton'); 

// Statistik-Seitenleiste
const statistikSidebar = document.getElementById('statistikSidebar'); 

// --- NEUE ELEMENTE für getrennte Tracker ---
const torTrackerHeimContainer = document.getElementById('torTrackerHeimContainer');
const torTabelleBody = document.getElementById('torTabelleBody');
const torTrackerGegnerContainer = document.getElementById('torTrackerGegnerContainer');
const torTabelleGegnerBody = document.getElementById('torTabelleGegnerBody');

const statistikWrapper = document.getElementById('statistikWrapper'); 
const statistikTabelleBody = document.getElementById('statistikTabelleBody');

// Modals (Standard)
const aktionsMenue = document.getElementById('aktionsMenue');
const aktionsMenueTitel = document.getElementById('aktionsMenueTitel');
const guteAktionModalButton = document.getElementById('guteAktionModalButton');
const aktionAbbrechen = document.getElementById('aktionAbbrechen');
const aktionVorauswahl = document.getElementById('aktionVorauswahl');
const aktionVorauswahlAbbrechen = document.getElementById('aktionVorauswahlAbbrechen');
const kommentarBereich = document.getElementById('kommentarBereich');
const kommentarTitel = document.getElementById('kommentarTitel');
const kommentarInput = document.getElementById('kommentarInput');
const kommentarSpeichernButton = document.getElementById('kommentarSpeichernButton');

// Einstellungen
const settingsButton = document.getElementById('settingsButton');
const settingsModal = document.getElementById('settingsModal');
const settingsSchliessen = document.getElementById('settingsSchliessen');
const toggleDarkMode = document.getElementById('toggleDarkMode'); 
const toggleTorTracker = document.getElementById('toggleTorTracker');
const toggleTorTrackerGegner = document.getElementById('toggleTorTrackerGegner');
const toggleWurfbildHeim = document.getElementById('toggleWurfbildHeim');
const toggleWurfbildGegner = document.getElementById('toggleWurfbildGegner');
// Team Namen Inputs
const inputTeamNameHeim = document.getElementById('inputTeamNameHeim');
const inputTeamNameGegner = document.getElementById('inputTeamNameGegner');

// Wurfbild Input Modal Elements
const wurfbildModal = document.getElementById('wurfbildModal');
const wurfbildTitel = document.getElementById('wurfbildTitel');
const torRahmen = document.getElementById('torRahmen');
const wurfbildUeberspringen = document.getElementById('wurfbildUeberspringen');

// Wurfbilder Übersicht Modal Elements
const wurfbilderStatsModal = document.getElementById('wurfbilderStatsModal');
const wurfbilderContainer = document.getElementById('wurfbilderContainer');
const closeWurfbilderStats = document.getElementById('closeWurfbilderStats');

// Gegner Nummer & 7m Outcome
const gegnerNummerModal = document.getElementById('gegnerNummerModal');
const gegnerNummerTitel = document.getElementById('gegnerNummerTitel');
const bekannteGegnerListe = document.getElementById('bekannteGegnerListe');
const neueGegnerNummer = document.getElementById('neueGegnerNummer');
const gegnerNummerSpeichern = document.getElementById('gegnerNummerSpeichern');
const gegnerNummerUeberspringen = document.getElementById('gegnerNummerUeberspringen');
const sevenMeterOutcomeModal = document.getElementById('sevenMeterOutcomeModal');


// --- 2. Spiel-Zustand (Variablen) ---
const SPEICHER_KEY = 'handballTeamState';

let spielstand = {
    uiState: 'setup', // 'setup' oder 'game'
    roster: [], // { name: 'Anna', number: 7 }
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
        showTorTracker: true,
        showTorTrackerGegner: false, 
        showWurfbildHeim: false,
        showWurfbildGegner: false,
        teamNameHeim: 'Heim', 
        teamNameGegner: 'Gegner' 
    },
    knownOpponents: [] 
};

let timerInterval;
let aktuellerSpielerIndex = null; 
let aktuelleAktionTyp = ''; 
let aktuellerWurfbildModus = 'standard'; 

// --- 3. Speicher-Funktionen ---

function speichereSpielstand() {
    localStorage.setItem(SPEICHER_KEY, JSON.stringify(spielstand));
}

function ladeSpielstand() {
    const gespeicherterStand = localStorage.getItem(SPEICHER_KEY);
    if (!gespeicherterStand) {
        zeichneRosterListe();
        return;
    }
    
    spielstand = JSON.parse(gespeicherterStand);

    // Kompatibilität & Standards
    if (!spielstand.score) spielstand.score = { heim: 0, gegner: 0 };
    if (!spielstand.timer.gamePhase) spielstand.timer.gamePhase = 1;
    if (!spielstand.activeSuspensions) spielstand.activeSuspensions = [];
    if (!spielstand.settings) spielstand.settings = {};
    
    if (typeof spielstand.settings.darkMode === 'undefined') spielstand.settings.darkMode = false;
    if (typeof spielstand.settings.showTorTracker === 'undefined') spielstand.settings.showTorTracker = true;
    if (typeof spielstand.settings.showTorTrackerGegner === 'undefined') spielstand.settings.showTorTrackerGegner = false;
    if (typeof spielstand.settings.showWurfbildHeim === 'undefined') spielstand.settings.showWurfbildHeim = false;
    if (typeof spielstand.settings.showWurfbildGegner === 'undefined') spielstand.settings.showWurfbildGegner = false;
    if (!spielstand.settings.teamNameHeim) spielstand.settings.teamNameHeim = 'Heim';
    if (!spielstand.settings.teamNameGegner) spielstand.settings.teamNameGegner = 'Gegner';
    
    if (!spielstand.knownOpponents) spielstand.knownOpponents = [];

    // UI Checkboxen setzen
    if(toggleDarkMode) toggleDarkMode.checked = spielstand.settings.darkMode;
    if(toggleTorTracker) toggleTorTracker.checked = spielstand.settings.showTorTracker;
    if(toggleTorTrackerGegner) toggleTorTrackerGegner.checked = spielstand.settings.showTorTrackerGegner;
    if(toggleWurfbildHeim) toggleWurfbildHeim.checked = spielstand.settings.showWurfbildHeim;
    if(toggleWurfbildGegner) toggleWurfbildGegner.checked = spielstand.settings.showWurfbildGegner;
    if(inputTeamNameHeim) inputTeamNameHeim.value = spielstand.settings.teamNameHeim;
    if(inputTeamNameGegner) inputTeamNameGegner.value = spielstand.settings.teamNameGegner;

    applyTheme();
    
    if (spielstand.uiState === 'game') {
        rosterBereich.classList.add('versteckt');
        spielBereich.classList.remove('versteckt');
        globalAktionen.classList.remove('versteckt'); 
        scoreWrapper.classList.remove('versteckt'); 
        
        applyViewSettings();

        timerAnzeige.textContent = formatiereZeit(spielstand.timer.verstricheneSekundenBisher);
        spielstand.timer.istPausiert = true; 

        // --- NEU: Prüfen ob wir in einer aktiven Spielphase sind, um Buttons zu aktivieren ---
        const phase = spielstand.timer.gamePhase;
        // Phasen: 2 (1.HZ), 4 (2.HZ), oder die Pause-Zwischenzustände 1.5/3.5
        const sindImSpiel = (phase === 2 || phase === 4 || phase === 1.5 || phase === 3.5);
        setSteuerungAktiv(sindImSpiel); 
        
        if (phase === 1) {
            gamePhaseButton.textContent = 'Spielstart';
            statistikWrapper.classList.add('versteckt'); 
        } else if (phase === 2) {
            gamePhaseButton.textContent = 'Weiter (1. HZ)'; 
            spielstand.timer.gamePhase = 1.5; 
            statistikWrapper.classList.add('versteckt'); 
        } else if (phase === 3) {
            gamePhaseButton.textContent = 'Weiter (2. HZ)';
            statistikWrapper.classList.add('versteckt'); 
        } else if (phase === 4) {
            gamePhaseButton.textContent = 'Weiter (2. HZ)';
            spielstand.timer.gamePhase = 3.5; 
            statistikWrapper.classList.add('versteckt'); 
        } else if (phase === 5) {
            gamePhaseButton.textContent = 'Beendet';
            gamePhaseButton.disabled = true;
            gamePhaseButton.classList.add('beendet');
            zeichneStatistikTabelle(berechneStatistiken()); 
            statistikWrapper.classList.remove('versteckt'); 
        }
        
        pauseButton.classList.add('versteckt');
        pauseButton.disabled = true;

        updateScoreDisplay(); 
        updateSuspensionDisplay(); 
        zeichneSpielerRaster();
        updateProtokollAnzeige();
        updateTorTracker(); 
    } else {
        zeichneRosterListe();
    }
}

function applyTheme() {
    if(spielstand.settings.darkMode) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

function applyViewSettings() {
    const showHeim = spielstand.settings.showTorTracker;
    const showGegner = spielstand.settings.showTorTrackerGegner;
    const isGameEnd = spielstand.timer.gamePhase === 5;

    if (torTrackerHeimContainer) {
         if (showHeim) torTrackerHeimContainer.classList.remove('versteckt');
         else torTrackerHeimContainer.classList.add('versteckt');
    }

    if (torTrackerGegnerContainer) {
         if (showGegner) torTrackerGegnerContainer.classList.remove('versteckt');
         else torTrackerGegnerContainer.classList.add('versteckt');
    }

    const showSidebar = (showHeim || showGegner || isGameEnd);

    if (spielstand.uiState === 'game' && showSidebar) {
        statistikSidebar.classList.remove('versteckt');
    } else {
        statistikSidebar.classList.add('versteckt');
    }
}


// --- 4. Roster-Management ---

function addPlayer(e) {
    e.preventDefault();
    const name = playerNameInput.value.trim();
    const number = parseInt(playerNumberInput.value, 10);
    const editIndex = editPlayerIndex.value; 

    if (!name || isNaN(number)) {
        alert("Bitte gib einen gültigen Namen und eine Nummer ein.");
        return;
    }
    
    const existierenderSpieler = spielstand.roster.find((p, i) => p.number === number && i != editIndex);
    if (existierenderSpieler) {
        alert("Diese Nummer ist bereits vergeben.");
        return;
    }

    if (editIndex) {
        const player = spielstand.roster[editIndex];
        player.name = name;
        player.number = number;
        schliesseEditModus();
    } else {
        spielstand.roster.push({ name, number });
    }

    spielstand.roster.sort((a, b) => a.number - b.number); 
    speichereSpielstand();
    zeichneRosterListe();

    if (!editIndex) {
        playerNameInput.value = '';
        playerNumberInput.value = '';
        playerNameInput.focus();
    }
}

function deletePlayer(index) {
    if (confirm(`Spieler "${spielstand.roster[index].name}" wirklich löschen?`)) {
        spielstand.roster.splice(index, 1);
        speichereSpielstand();
        zeichneRosterListe();
    }
}

function oeffneEditModus(index) {
    const player = spielstand.roster[index];
    playerNameInput.value = player.name;
    playerNumberInput.value = player.number;
    editPlayerIndex.value = index; 
    addPlayerForm.querySelector('button[type="submit"]').textContent = 'Speichern';
    cancelEditButton.classList.remove('versteckt');
}

function schliesseEditModus() {
    playerNameInput.value = '';
    playerNumberInput.value = '';
    editPlayerIndex.value = ''; 
    addPlayerForm.querySelector('button[type="submit"]').textContent = 'Hinzufügen';
    cancelEditButton.classList.add('versteckt');
}

function zeichneRosterListe() {
    rosterListe.innerHTML = ''; 
    if (spielstand.roster.length === 0) {
        rosterListe.innerHTML = '<li>Noch keine Spieler hinzugefügt.</li>';
        return;
    }
    
    spielstand.roster.forEach((player, index) => {
        const li = document.createElement('li');
        const text = document.createElement('span');
        text.textContent = `#${player.number} - ${player.name}`;
        li.appendChild(text);
        
        const buttonWrapper = document.createElement('div');
        
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Bearbeiten';
        editBtn.className = 'edit-player';
        editBtn.onclick = () => oeffneEditModus(index);
        buttonWrapper.appendChild(editBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Löschen';
        deleteBtn.className = 'delete-player';
        deleteBtn.onclick = () => deletePlayer(index);
        buttonWrapper.appendChild(deleteBtn);
        
        li.appendChild(buttonWrapper);
        rosterListe.appendChild(li);
    });
}

function switchToGame() {
    if (spielstand.roster.length === 0) {
        alert("Bitte füge zuerst Spieler hinzu.");
        return;
    }
    spielstand.uiState = 'game';
    speichereSpielstand();
    
    rosterBereich.classList.add('versteckt');
    spielBereich.classList.remove('versteckt');
    globalAktionen.classList.remove('versteckt'); 
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

function switchToRoster() {
    spielstand.uiState = 'setup';
    speichereSpielstand();
    
    spielBereich.classList.add('versteckt');
    rosterBereich.classList.remove('versteckt');
    globalAktionen.classList.add('versteckt'); 
    scoreWrapper.classList.add('versteckt'); 
    statistikSidebar.classList.add('versteckt'); 
    
    clearInterval(timerInterval);
    zeichneRosterListe();
}

// --- 5. Team Import/Export ---

function exportTeam() {
    if (spielstand.roster.length === 0) {
        alert("Es ist kein Team zum Exportieren vorhanden.");
        return;
    }
    
    const teamDaten = JSON.stringify(spielstand.roster, null, 2);
    const blob = new Blob([teamDaten], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'handball_team.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) { return; }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importiertesRoster = JSON.parse(e.target.result);
            
            if (Array.isArray(importiertesRoster) && importiertesRoster.every(p => p.hasOwnProperty('name') && p.hasOwnProperty('number'))) {
                if (confirm("Möchtest du das bestehende Team wirklich überschreiben?")) {
                    spielstand.roster = importiertesRoster;
                    spielstand.roster.sort((a, b) => a.number - b.number);
                    speichereSpielstand();
                    zeichneRosterListe();
                    alert("Team erfolgreich importiert!");
                }
            } else {
                alert("Die Datei hat ein ungültiges Format.");
            }
        } catch (error) {
            console.error("Fehler beim Importieren der Datei:", error);
            alert("Die Datei konnte nicht gelesen werden. Ist es eine gültige JSON-Datei?");
        }
    };
    reader.readAsText(file);
    event.target.value = null;
}


// --- 6. Spiel-Modus ---

function zeichneSpielerRaster() {
    spielerRaster.innerHTML = '';
    spielstand.roster.forEach((player, index) => {
        const btn = document.createElement('button');
        btn.innerHTML = `
            <span class="spieler-nummer">#${player.number}</span>
            <span class="spieler-name">${player.name}</span>
        `;
        btn.className = 'spieler-button';
        btn.onclick = () => oeffneAktionsMenue(index);
        spielerRaster.appendChild(btn);
    });
}

// --- 7. Timer-Funktionen ---

function formatiereZeit(sekunden) {
    const min = Math.floor(sekunden / 60);
    const sek = Math.floor(sekunden % 60);
    const formatierteMin = min < 10 ? '0' + min : min;
    const formatierteSek = sek < 10 ? '0' + sek : sek;
    return `${formatierteMin}:${formatierteSek}`;
}

function updateTimer() {
    const aktuelleSegmentSekunden = (Date.now() - spielstand.timer.segmentStartZeit) / 1000;
    const totalSekunden = spielstand.timer.verstricheneSekundenBisher + aktuelleSegmentSekunden;
    
    if (totalSekunden < 0) {
        spielstand.timer.verstricheneSekundenBisher = 0;
        spielstand.timer.segmentStartZeit = Date.now(); 
        timerAnzeige.textContent = formatiereZeit(0);
    } else {
        timerAnzeige.textContent = formatiereZeit(Math.floor(totalSekunden));
    }

    if (!spielstand.timer.istPausiert) {
        let hasChanged = false;
        spielstand.activeSuspensions.forEach(s => {
            if (s.remaining > 0) {
                s.remaining--;
                hasChanged = true;
            }
        });
        const oldCount = spielstand.activeSuspensions.length;
        spielstand.activeSuspensions = spielstand.activeSuspensions.filter(s => s.remaining > 0);
        
        if (hasChanged || spielstand.activeSuspensions.length !== oldCount) {
            updateSuspensionDisplay();
        }
    }
}

function updateSuspensionDisplay() {
    if (!suspensionContainer) return;
    suspensionContainer.innerHTML = '';
    
    spielstand.activeSuspensions.forEach(s => {
        const div = document.createElement('div');
        div.className = `suspension-card ${s.type}`;
        const min = Math.floor(s.remaining / 60);
        const sec = s.remaining % 60;
        const timeStr = `${min}:${sec < 10 ? '0'+sec : sec}`;
        
        div.innerHTML = `
            <div>#${s.number}</div>
            <div class="suspension-time">${timeStr}</div>
        `;
        suspensionContainer.appendChild(div);
    });
}

function startTimer() {
    spielstand.timer.segmentStartZeit = Date.now();
    timerInterval = setInterval(updateTimer, 1000);
    spielstand.timer.istPausiert = false;
}

function stoppTimer() {
    if (spielstand.timer.istPausiert) return; 
    clearInterval(timerInterval);
    const segmentSekunden = (Date.now() - spielstand.timer.segmentStartZeit) / 1000;
    spielstand.timer.verstricheneSekundenBisher += segmentSekunden;
    spielstand.timer.istPausiert = true;
}

function handleGamePhaseClick() {
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

function handleRealPauseClick() {
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


function setSteuerungAktiv(aktiv) {
    const spielerButtons = document.querySelectorAll('.spieler-button');
    spielerButtons.forEach(btn => btn.disabled = !aktiv);
    
    gegnerTorButton.disabled = !aktiv;
    gegner7mButton.disabled = !aktiv;
    gegner2minButton.disabled = !aktiv; 
    
    heimScoreUp.disabled = !aktiv;
    heimScoreDown.disabled = !aktiv;
    gegnerScoreUp.disabled = !aktiv;
    gegnerScoreDown.disabled = !aktiv;
}

function handleZeitSprung(sekunden) {
    if (spielstand.timer.istPausiert) {
        spielstand.timer.verstricheneSekundenBisher += sekunden;
        if (spielstand.timer.verstricheneSekundenBisher < 0) {
            spielstand.timer.verstricheneSekundenBisher = 0;
        }
        timerAnzeige.textContent = formatiereZeit(spielstand.timer.verstricheneSekundenBisher);
    } else {
        spielstand.timer.segmentStartZeit -= sekunden * 1000;
        updateTimer();
    }
    speichereSpielstand();
}

// --- 8. Aktions-Modal Funktionen & Logging ---

function oeffneAktionsMenue(index) {
    aktuellerSpielerIndex = index;
    const player = spielstand.roster[index];
    
    aktionsMenueTitel.textContent = `Aktion für #${player.number} (${player.name})`;
    aktionsMenue.classList.remove('versteckt');
}

function schliesseAktionsMenue() {
    aktionsMenue.classList.add('versteckt');
    aktionVorauswahl.classList.add('versteckt');
    kommentarBereich.classList.add('versteckt');
    aktuellerSpielerIndex = null;
    aktuelleAktionTyp = '';
}

function logAktion(aktion, kommentar = null) {
    const player = spielstand.roster[aktuellerSpielerIndex];
    const aktuelleZeit = timerAnzeige.textContent;

    if (aktion === "Tor") {
        spielstand.score.heim++;
    }
    const aktuellerSpielstand = `${spielstand.score.heim}:${spielstand.score.gegner}`;
    updateScoreDisplay(); 

    if (aktion === "2 Minuten") {
        spielstand.activeSuspensions.push({
            type: 'heim',
            number: player.number,
            remaining: 120 
        });
        updateSuspensionDisplay();
    }

    // Log Eintrag
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

    if (aktion === "Tor" && spielstand.settings.showWurfbildHeim) {
        oeffneWurfbildModal('standard');
    }
}

function logGlobalAktion(aktion, kommentar = null) {
    const aktuelleZeit = timerAnzeige.textContent;

    if (aktion === "Gegner 7m") {
        if (spielstand.settings.showWurfbildGegner) {
            oeffneGegnerNummerModal(true); 
            return; 
        } else {
             spielstand.score.gegner++;
             aktion = "Gegner 7m Tor";
        }
    }
    else if (aktion === "Gegner Tor") {
        spielstand.score.gegner++;
        if (spielstand.settings.showWurfbildGegner) {
            oeffneGegnerNummerModal(false); 
        }
    }
    else if (aktion === "Gegner 2 min") {
        oeffneGegnerNummerModal('2min');
        return; 
    }

    const aktuellerSpielstand = `${spielstand.score.heim}:${spielstand.score.gegner}`;
    updateScoreDisplay(); 

    spielstand.gameLog.unshift({
        time: aktuelleZeit,
        playerId: null, 
        playerName: "SPIEL", 
        action: aktion,
        kommentar: kommentar,
        spielstand: aktuellerSpielstand,
        gegnerNummer: null, 
        wurfbild: null
    });

    updateProtokollAnzeige();
    updateTorTracker(); 
    speichereSpielstand();
}

function logScoreKorrektur(team, change) {
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


// --- 9. Protokoll & Export ---

function updateProtokollAnzeige() {
    protokollAusgabe.innerHTML = '';
    
    spielstand.gameLog.forEach((eintrag, index) => {
        const p = document.createElement('p');
        const textSpan = document.createElement('span');
        
        let text;
        const spielstandText = eintrag.spielstand ? ` <strong>(${eintrag.spielstand})</strong>` : '';

        if (eintrag.playerId) {
            text = `<strong>[${eintrag.time}] #${eintrag.playerId} (${eintrag.playerName}): ${eintrag.action}</strong>${spielstandText}`;
        } else {
            text = `<strong>[${eintrag.time}] ${eintrag.action.toUpperCase()}</strong>${spielstandText}`;
        }
        
        if (eintrag.kommentar) {
            text += `: ${eintrag.kommentar}`;
        }
        textSpan.innerHTML = text;
        
        const loeschButton = document.createElement('button');
        loeschButton.textContent = 'Löschen';
        loeschButton.className = 'loeschButton'; 
        loeschButton.onclick = () => loescheProtokollEintrag(index);

        p.appendChild(textSpan);
        p.appendChild(loeschButton);
        protokollAusgabe.appendChild(p);
    });
}

function loescheProtokollEintrag(index) {
    if (confirm("Möchtest du diesen Eintrag wirklich löschen?")) {
        
        const geloeschterEintrag = spielstand.gameLog[index];
        spielstand.gameLog.splice(index, 1); 

        // Score zurückrechnen
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
        
        if(spielstand.score.heim < 0) spielstand.score.heim = 0;
        if(spielstand.score.gegner < 0) spielstand.score.gegner = 0;
        
        updateScoreDisplay(); 
        updateProtokollAnzeige(); 
        updateTorTracker(); 
        speichereSpielstand();
    }
}

function exportiereAlsTxt() {
    if (spielstand.gameLog.length === 0) {
        alert("Das Protokoll ist leer. Es gibt nichts zu exportieren.");
        return;
    }
    
    const heimName = spielstand.settings.teamNameHeim;
    
    let dateiInhalt = `Protokoll Handball Team-Tracker: ${heimName} vs ${spielstand.settings.teamNameGegner}\n\n`;
    dateiInhalt += `Team: ${spielstand.roster.map(p => `#${p.number} ${p.name}`).join(', ')}\n\n`;
    
    dateiInhalt += `--- TOR-ÜBERSICHT ${heimName.toUpperCase()} ---\n`;
    const toreMap = berechneTore();
    spielstand.roster.forEach(player => {
        const tore = toreMap.get(player.number) || 0;
        dateiInhalt += `#${player.number} ${player.name}: ${tore} Tore\n`;
    });
    dateiInhalt += "---------------------\n\n";

    dateiInhalt += "--- SPIEL-STATISTIK ---\n";
    const statsData = berechneStatistiken();
    
    let maxNameLength = "Spieler".length;
    statsData.forEach(stats => {
        const nameLength = (`#${stats.number} ${stats.name}`).length;
        if (nameLength > maxNameLength) maxNameLength = nameLength;
    });
    maxNameLength += 2; 

    const col7m = "7m".length + 3;
    const colGut = "Gut".length + 3;
    const colFehlwurf = "Fehl".length + 3;
    const colTechFehler = "TF".length + 3;
    const colGelb = "Gelb".length + 3;
    const col2min = "2'".length + 3;
    const colRot = "Rot".length + 3;

    let header = "Spieler".padEnd(maxNameLength);
    header += "7m".padEnd(col7m);
    header += "Gut".padEnd(colGut);
    header += "Fehl".padEnd(colFehlwurf);
    header += "TF".padEnd(colTechFehler);
    header += "Gelb".padEnd(colGelb);
    header += "2'".padEnd(col2min);
    header += "Rot".padEnd(colRot);
    dateiInhalt += header + "\n";

    const totalLength = maxNameLength + col7m + colGut + colFehlwurf + colTechFehler + colGelb + col2min + colRot;
    dateiInhalt += "-".repeat(totalLength).substring(0, totalLength - (colRot.length-3)) + "\n"; 
    
    statsData.forEach(stats => {
        let row = (`#${stats.number} ${stats.name}`).padEnd(maxNameLength);
        row += String(stats.siebenMeter).padEnd(col7m);
        row += String(stats.guteAktion).padEnd(colGut);
        row += String(stats.fehlwurf).padEnd(colFehlwurf);
        row += String(stats.techFehler).padEnd(colTechFehler);
        row += String(stats.gelb).padEnd(colGelb);
        row += String(stats.zweiMinuten).padEnd(col2min);
        row += String(stats.rot).padEnd(colRot);
        dateiInhalt += row + "\n";
    });
    
    dateiInhalt += "-".repeat(totalLength).substring(0, totalLength - (colRot.length-3)) + "\n\n";


    [...spielstand.gameLog].reverse().forEach(e => {
        if (e.playerId) {
            dateiInhalt += `[${e.time}] #${e.playerId} (${e.playerName}): ${e.action}`;
        } else {
            dateiInhalt += `[${e.time}] ${e.action.toUpperCase()}`;
        }
        
        if (e.spielstand) {
            dateiInhalt += ` (${e.spielstand})`;
        }

        if (e.kommentar) {
            dateiInhalt += `: ${e.kommentar}`;
        }
        
        if (e.wurfbild) {
            let farbe = e.wurfbild.color === 'gray' ? '(Gehalten)' : '';
            dateiInhalt += ` [Tor: X=${e.wurfbild.x}%, Y=${e.wurfbild.y}% ${farbe}]`;
        }
        
        dateiInhalt += "\n";
    });

    const blob = new Blob([dateiInhalt], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `protokoll_${heimName}_vs_${spielstand.settings.teamNameGegner}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// CSV Export
function exportiereAlsCsv() {
    if (spielstand.gameLog.length === 0) {
        alert("Keine Daten zum Exportieren.");
        return;
    }
    let csvContent = "\uFEFF";
    csvContent += "Spieler-Statistik\n";
    csvContent += "Nummer;Name;Tore;7m Raus;Gute Aktion;Fehlwurf;Tech Fehler;Gelb;2min;Rot\n";
    const statsData = berechneStatistiken();
    const toreMap = berechneTore();
    statsData.forEach(s => {
        const tore = toreMap.get(s.number) || 0;
        csvContent += `${s.number};${s.name};${tore};${s.siebenMeter};${s.guteAktion};${s.fehlwurf};${s.techFehler};${s.gelb};${s.zweiMinuten};${s.rot}\n`;
    });
    csvContent += "\n\nSpielverlauf\nZeit;Aktion;Spieler/Team;Details;Spielstand\n";
    [...spielstand.gameLog].reverse().forEach(e => {
        let akteur = e.playerId ? `#${e.playerId} ${e.playerName}` : "SPIEL/GEGNER";
        let details = e.kommentar ? e.kommentar : "";
        if (e.wurfbild) details += ` (Wurf: X${e.wurfbild.x}|Y${e.wurfbild.y})`;
        akteur = akteur.replace(/;/g, ",");
        details = details.replace(/;/g, ",");
        csvContent += `${e.time};${e.action};${akteur};${details};${e.spielstand || ""}\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `statistik_${spielstand.settings.teamNameHeim}_vs_${spielstand.settings.teamNameGegner}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}


function starteNeuesSpiel() {
    if (confirm("Bist du sicher? Das löscht das gesamte Spielprotokoll, aber dein Team bleibt gespeichert.")) {
        
        spielstand.gameLog = [];
        spielstand.score = { heim: 0, gegner: 0 }; 
        spielstand.activeSuspensions = [];
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

// --- 10. Tor-Tracker Funktionen ---

function berechneTore() {
    const toreMap = new Map();
    for (const eintrag of spielstand.gameLog) {
        if (eintrag.action === "Tor" && eintrag.playerId) {
            toreMap.set(eintrag.playerId, (toreMap.get(eintrag.playerId) || 0) + 1);
        }
    }
    return toreMap;
}

function updateTorTracker() {
    if (torTabelleBody) {
        const toreMap = berechneTore();
        const trackerData = spielstand.roster.map(player => ({
            name: player.name,
            number: player.number,
            tore: toreMap.get(player.number) || 0
        }));
        
        trackerData.sort((a, b) => b.tore - a.tore);
        
        torTabelleBody.innerHTML = '';
        trackerData.forEach(data => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>#${data.number} ${data.name}</td><td>${data.tore}</td>`;
            torTabelleBody.appendChild(tr);
        });
    }

    if (torTabelleGegnerBody && spielstand.settings.showTorTrackerGegner) {
        const gegnerToreMap = new Map();
        spielstand.gameLog.forEach(eintrag => {
            if (eintrag.action === "Gegner Tor" || eintrag.action === "Gegner 7m Tor") {
                const nr = eintrag.gegnerNummer ? eintrag.gegnerNummer : "Unbekannt";
                gegnerToreMap.set(nr, (gegnerToreMap.get(nr) || 0) + 1);
            }
        });

        const gegnerData = Array.from(gegnerToreMap, ([nr, tore]) => ({ nr, tore }));
        
        gegnerData.sort((a, b) => {
             if (a.nr === "Unbekannt") return 1;
             if (b.nr === "Unbekannt") return -1;
             return b.tore - a.tore;
        });

        torTabelleGegnerBody.innerHTML = '';
        if(gegnerData.length === 0) {
             torTabelleGegnerBody.innerHTML = '<tr><td colspan="2" style="text-align:center;color:#999;">Noch keine Tore</td></tr>';
        } else {
            gegnerData.forEach(data => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${data.nr !== "Unbekannt" ? '#' + data.nr : 'Unbekannt'}</td><td>${data.tore}</td>`;
                torTabelleGegnerBody.appendChild(tr);
            });
        }
    }
}


// --- 11. Statistik-Funktionen ---

function berechneStatistiken() {
    const statsMap = new Map();
    spielstand.roster.forEach(player => {
        statsMap.set(player.number, {
            name: player.name,
            number: player.number,
            fehlwurf: 0,
            techFehler: 0,
            siebenMeter: 0,
            guteAktion: 0,
            gelb: 0,
            zweiMinuten: 0,
            rot: 0
        });
    });

    for (const eintrag of spielstand.gameLog) {
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
    }
    
    return Array.from(statsMap.values());
}

function zeichneStatistikTabelle(statsData) {
    if (!statistikTabelleBody) return;

    statistikTabelleBody.innerHTML = '';
    
    statsData.forEach(stats => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${stats.number} ${stats.name}</td>
            <td>${stats.siebenMeter}</td>
            <td>${stats.guteAktion}</td>
            <td>${stats.fehlwurf}</td>
            <td>${stats.techFehler}</td>
            <td>${stats.gelb}</td>
            <td>${stats.zweiMinuten}</td>
            <td>${stats.rot}</td>
        `;
        statistikTabelleBody.appendChild(tr);
    });
}

// --- 12. Wurfbild und Gegner Logik ---

function oeffneWurfbildModal(modus = 'standard') {
    aktuellerWurfbildModus = modus;
    wurfbildModal.classList.remove('versteckt');
    if(modus === 'gehalten') {
        wurfbildTitel.textContent = "Wo hat der Torwart gehalten?";
    } else {
        wurfbildTitel.textContent = "Wo ging der Ball rein?";
    }
}

function schliesseWurfbildModal() {
    wurfbildModal.classList.add('versteckt');
    aktuellerWurfbildModus = 'standard'; 
}

// Klick auf das Tor
if (torRahmen) {
    torRahmen.addEventListener('click', (e) => {
        const rect = torRahmen.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        
        const color = aktuellerWurfbildModus === 'gehalten' ? 'gray' : 'red';

        if (spielstand.gameLog.length > 0) {
            spielstand.gameLog[0].wurfbild = { x: x.toFixed(1), y: y.toFixed(1), color: color };
            speichereSpielstand();
        }

        schliesseWurfbildModal();
    });
}

if (wurfbildUeberspringen) {
    wurfbildUeberspringen.addEventListener('click', schliesseWurfbildModal);
}


// Gegner Nummer Logic
let currentGegnerActionType = 'tor'; // 'tor', '7m', '2min'

function oeffneGegnerNummerModal(type) {
    currentGegnerActionType = type;
    if(type === '2min') {
        gegnerNummerTitel.textContent = "2 Minuten für (Gegner)";
    } else {
        gegnerNummerTitel.textContent = "Torschütze (Gegner)";
    }

    gegnerNummerModal.classList.remove('versteckt');
    renderGegnerButtons();
    neueGegnerNummer.value = '';
    neueGegnerNummer.focus();
}

function renderGegnerButtons() {
    bekannteGegnerListe.innerHTML = '';
    const sortierteNummern = spielstand.knownOpponents.sort((a,b) => a - b);
    
    sortierteNummern.forEach(nummer => {
        const btn = document.createElement('button');
        btn.textContent = nummer;
        btn.className = 'gegner-num-btn';
        btn.onclick = () => speichereGegnerNummer(nummer);
        bekannteGegnerListe.appendChild(btn);
    });
}

function speichereGegnerNummer(nummer) {
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
        spielstand.gameLog.unshift({
            time: aktuelleZeit,
            playerId: null, 
            playerName: "SPIEL", 
            action: "Gegner 7m", 
            kommentar: `(Nr. ${nummer})`,
            spielstand: `${spielstand.score.heim}:${spielstand.score.gegner}`, 
            gegnerNummer: nummer, 
            wurfbild: null
        });
        gegnerNummerModal.classList.add('versteckt');
        sevenMeterOutcomeModal.classList.remove('versteckt');
    } 
    else {
        // Feldtor: Log schon existent oder neu erstellen
        if (spielstand.gameLog.length > 0) {
            spielstand.gameLog[0].kommentar = `(Nr. ${nummer}) ` + (spielstand.gameLog[0].kommentar || '');
            spielstand.gameLog[0].gegnerNummer = nummer;
        }
        gegnerNummerModal.classList.add('versteckt');
        oeffneWurfbildModal('standard');
    }

    if (nummer && !spielstand.knownOpponents.includes(nummer)) {
        spielstand.knownOpponents.push(nummer);
    }
    speichereSpielstand();
    updateProtokollAnzeige(); 
    updateTorTracker();
}

function handle7mOutcome(outcome) {
    sevenMeterOutcomeModal.classList.add('versteckt');
    const eintrag = spielstand.gameLog[0];
    
    if (outcome === 'Tor') {
        eintrag.action = "Gegner 7m Tor";
        spielstand.score.gegner++;
        eintrag.spielstand = `${spielstand.score.heim}:${spielstand.score.gegner}`;
        updateScoreDisplay();
        updateTorTracker(); 
        oeffneWurfbildModal('standard');
    } 
    else if (outcome === 'Gehalten') {
        eintrag.action = "Gegner 7m Gehalten";
        oeffneWurfbildModal('gehalten');
    } 
    else {
        eintrag.action = "Gegner 7m Verworfen";
    }
    updateProtokollAnzeige();
    speichereSpielstand();
}


if (gegnerNummerSpeichern) {
    gegnerNummerSpeichern.addEventListener('click', () => {
        const val = neueGegnerNummer.value;
        if(val) speichereGegnerNummer(val);
    });
}
if (gegnerNummerUeberspringen) {
    gegnerNummerUeberspringen.addEventListener('click', () => {
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
    });
}

// --- 13. Wurfbilder Übersicht Logik ---

function berechneWurfbilder() {
    const heimWuerfe = {};
    const gegnerWuerfe = {};
    const gegner7mWuerfe = {}; 
    spielstand.gameLog.forEach(eintrag => {
        if (!eintrag.wurfbild) return; 
        if (eintrag.action === "Tor" && eintrag.playerId) {
            if (!heimWuerfe[eintrag.playerId]) {
                heimWuerfe[eintrag.playerId] = {
                    name: eintrag.playerName, nummer: eintrag.playerId, wuerfe: []
                };
            }
            heimWuerfe[eintrag.playerId].wuerfe.push(eintrag.wurfbild);
        } 
        else if (eintrag.action === "Gegner Tor") {
            const key = eintrag.gegnerNummer ? eintrag.gegnerNummer : "Unbekannt";
            if (!gegnerWuerfe[key]) {
                gegnerWuerfe[key] = {
                    name: eintrag.gegnerNummer ? `Gegner #${eintrag.gegnerNummer}` : "Gegner (Unbekannt)",
                    nummer: eintrag.gegnerNummer || 999, wuerfe: []
                };
            }
            gegnerWuerfe[key].wuerfe.push(eintrag.wurfbild);
        }
        else if (eintrag.action.includes("Gegner 7m")) {
            const key = eintrag.gegnerNummer ? eintrag.gegnerNummer : "Unbekannt";
            if (!gegner7mWuerfe[key]) {
                gegner7mWuerfe[key] = {
                    name: eintrag.gegnerNummer ? `Gegner #${eintrag.gegnerNummer}` : "Gegner (Unbekannt)",
                    nummer: eintrag.gegnerNummer || 999, wuerfe: []
                };
            }
            gegner7mWuerfe[key].wuerfe.push(eintrag.wurfbild);
        }
    });
    return { heim: Object.values(heimWuerfe), gegner: Object.values(gegnerWuerfe), gegner7m: Object.values(gegner7mWuerfe) };
}

function zeigeWurfstatistik() {
    const daten = berechneWurfbilder();
    wurfbilderContainer.innerHTML = '';
    const renderPlayerGroup = (playerData) => {
        const div = document.createElement('div');
        div.className = 'player-shot-card';
        let tore = 0; let gehalten = 0;
        playerData.wuerfe.forEach(w => {
            if(w.color === 'gray') gehalten++; else tore++;
        });
        const infoDiv = document.createElement('div');
        infoDiv.innerHTML = `<strong>${playerData.name}</strong><br>${tore} Tore`;
        if(gehalten > 0) infoDiv.innerHTML += `, ${gehalten} Gehalten`;
        div.appendChild(infoDiv);
        const torDiv = document.createElement('div');
        torDiv.className = 'mini-tor-wrapper';
        playerData.wuerfe.forEach(coords => {
            if(coords && coords.x && coords.y) {
                const dot = document.createElement('div');
                dot.className = 'mini-shot-dot';
                dot.style.left = coords.x + '%';
                dot.style.top = coords.y + '%';
                if(coords.color === 'gray') {
                    dot.style.backgroundColor = '#6c757d'; dot.style.zIndex = 5; 
                } else {
                    dot.style.backgroundColor = 'red';
                }
                torDiv.appendChild(dot);
            }
        });
        div.appendChild(torDiv);
        return div;
    };

    if (daten.heim.length > 0) {
        const h4 = document.createElement('h4'); h4.textContent = spielstand.settings.teamNameHeim;
        const groupDiv = document.createElement('div'); groupDiv.className = 'wurfbild-gruppe'; groupDiv.appendChild(h4);
        daten.heim.sort((a,b) => a.nummer - b.nummer).forEach(p => groupDiv.appendChild(renderPlayerGroup(p)));
        wurfbilderContainer.appendChild(groupDiv);
    }
    if (daten.gegner.length > 0) {
        const h4 = document.createElement('h4'); h4.textContent = spielstand.settings.teamNameGegner + " (Feldtore)";
        const groupDiv = document.createElement('div'); groupDiv.className = 'wurfbild-gruppe'; groupDiv.appendChild(h4);
        daten.gegner.sort((a,b) => a.nummer - b.nummer).forEach(p => groupDiv.appendChild(renderPlayerGroup(p)));
        wurfbilderContainer.appendChild(groupDiv);
    }
    if (daten.gegner7m.length > 0) {
        const h4 = document.createElement('h4'); h4.textContent = "Gegner 7m";
        const groupDiv = document.createElement('div'); groupDiv.className = 'wurfbild-gruppe'; groupDiv.appendChild(h4);
        daten.gegner7m.sort((a,b) => a.nummer - b.nummer).forEach(p => groupDiv.appendChild(renderPlayerGroup(p)));
        wurfbilderContainer.appendChild(groupDiv);
    }
    if (daten.heim.length === 0 && daten.gegner.length === 0 && daten.gegner7m.length === 0) {
        wurfbilderContainer.innerHTML = '<p style="text-align:center; padding:20px;">Noch keine Wurfbilder aufgezeichnet.</p>';
    }
    wurfbilderStatsModal.classList.remove('versteckt');
}

if (showWurfbilderButton) showWurfbilderButton.addEventListener('click', zeigeWurfstatistik);
if (closeWurfbilderStats) closeWurfbilderStats.addEventListener('click', () => wurfbilderStatsModal.classList.add('versteckt'));


// --- 14. Event Listener Zuweisung ---

// Bildschirm 1
addPlayerForm.addEventListener('submit', addPlayer);
startGameButton.addEventListener('click', switchToGame);
cancelEditButton.addEventListener('click', schliesseEditModus);
exportTeamButton.addEventListener('click', exportTeam);
importTeamButton.addEventListener('click', () => importFileInput.click());
importFileInput.addEventListener('change', handleFileImport);

// Bildschirm 2
backToRosterButton.addEventListener('click', switchToRoster);
gamePhaseButton.addEventListener('click', handleGamePhaseClick); 
pauseButton.addEventListener('click', handleRealPauseClick); 
zurueckButton.addEventListener('click', () => handleZeitSprung(-30));
vorButton.addEventListener('click', () => handleZeitSprung(30));
neuesSpielButton.addEventListener('click', starteNeuesSpiel);
exportButton.addEventListener('click', exportiereAlsTxt);
if(exportCsvButton) exportCsvButton.addEventListener('click', exportiereAlsCsv); 

// Globale Aktionen
gegnerTorButton.addEventListener('click', () => logGlobalAktion('Gegner Tor'));
gegner7mButton.addEventListener('click', () => logGlobalAktion('Gegner 7m'));
gegner2minButton.addEventListener('click', () => logGlobalAktion('Gegner 2 min')); 

heimScoreUp.addEventListener('click', () => logScoreKorrektur('heim', 1));
heimScoreDown.addEventListener('click', () => logScoreKorrektur('heim', -1));
gegnerScoreUp.addEventListener('click', () => logScoreKorrektur('gegner', 1));
gegnerScoreDown.addEventListener('click', () => logScoreKorrektur('gegner', -1));


// Modal 1: Haupt-Aktionsmenü
aktionAbbrechen.addEventListener('click', schliesseAktionsMenue);
guteAktionModalButton.addEventListener('click', () => {
    aktionsMenue.classList.add('versteckt');
    aktionVorauswahl.classList.remove('versteckt');
});

document.querySelectorAll('#aktionsMenue .aktion-button[data-aktion]').forEach(btn => {
    btn.addEventListener('click', () => {
        logAktion(btn.dataset.aktion);
    });
});

// Modal 2: "Gute Aktion" Vorauswahl
aktionVorauswahlAbbrechen.addEventListener('click', () => {
    aktionVorauswahl.classList.add('versteckt');
    aktionsMenue.classList.remove('versteckt'); 
});

document.querySelectorAll('#aktionVorauswahl .aktion-button[data-aktion]').forEach(btn => {
    btn.addEventListener('click', () => {
        aktuelleAktionTyp = 'Gute Aktion: ' + btn.dataset.aktion;
        kommentarTitel.textContent = `Kommentar für: ${aktuelleAktionTyp}`;
        
        aktionVorauswahl.classList.add('versteckt');
        kommentarBereich.classList.remove('versteckt');
        kommentarInput.focus();
    });
});

// Modal 3: Kommentar
kommentarSpeichernButton.addEventListener('click', () => {
    const kommentar = kommentarInput.value.trim() || null;
    logAktion(aktuelleAktionTyp, kommentar);
    kommentarInput.value = ''; 
});

// Einstellungen Event Listener
if (settingsButton) {
    settingsButton.addEventListener('click', () => {
        if (spielstand.settings) {
            if(toggleDarkMode) toggleDarkMode.checked = spielstand.settings.darkMode;
            if(toggleTorTracker) toggleTorTracker.checked = spielstand.settings.showTorTracker;
            if(toggleTorTrackerGegner) toggleTorTrackerGegner.checked = spielstand.settings.showTorTrackerGegner;
            if(toggleWurfbildHeim) toggleWurfbildHeim.checked = spielstand.settings.showWurfbildHeim;
            if(toggleWurfbildGegner) toggleWurfbildGegner.checked = spielstand.settings.showWurfbildGegner;
            // Namen laden
            if(inputTeamNameHeim) inputTeamNameHeim.value = spielstand.settings.teamNameHeim || 'Heim';
            if(inputTeamNameGegner) inputTeamNameGegner.value = spielstand.settings.teamNameGegner || 'Gegner';
        }
        settingsModal.classList.remove('versteckt');
    });
}

if (settingsSchliessen) {
    settingsSchliessen.addEventListener('click', () => {
        // Beim Schließen Namen speichern
        if (spielstand.settings) {
            spielstand.settings.teamNameHeim = inputTeamNameHeim.value || 'Heim';
            spielstand.settings.teamNameGegner = inputTeamNameGegner.value || 'Gegner';
            updateScoreDisplay(); // Namen aktualisieren
            speichereSpielstand();
        }
        settingsModal.classList.add('versteckt');
    });
}

if (toggleDarkMode) {
    toggleDarkMode.addEventListener('change', (e) => {
        if (!spielstand.settings) spielstand.settings = {};
        spielstand.settings.darkMode = e.target.checked;
        applyTheme();
        speichereSpielstand();
    });
}

if (toggleTorTracker) {
    toggleTorTracker.addEventListener('change', (e) => {
        if (!spielstand.settings) spielstand.settings = {};
        spielstand.settings.showTorTracker = e.target.checked;
        applyViewSettings();
        speichereSpielstand();
    });
}

if (toggleTorTrackerGegner) {
    toggleTorTrackerGegner.addEventListener('change', (e) => {
        if (!spielstand.settings) spielstand.settings = {};
        spielstand.settings.showTorTrackerGegner = e.target.checked;
        applyViewSettings();
        updateTorTracker();
        speichereSpielstand();
    });
}

if (toggleWurfbildHeim) {
    toggleWurfbildHeim.addEventListener('change', (e) => {
        if (!spielstand.settings) spielstand.settings = {};
        spielstand.settings.showWurfbildHeim = e.target.checked;
        speichereSpielstand();
    });
}

if (toggleWurfbildGegner) {
    toggleWurfbildGegner.addEventListener('change', (e) => {
        if (!spielstand.settings) spielstand.settings = {};
        spielstand.settings.showWurfbildGegner = e.target.checked;
        speichereSpielstand();
    });
}

// Aktualisiert die Spielstand-Anzeige
function updateScoreDisplay() {
    if (scoreAnzeige) {
        scoreAnzeige.textContent = `${spielstand.score.heim}:${spielstand.score.gegner}`;
    }
    if(teamNameHeimDisplay) teamNameHeimDisplay.textContent = spielstand.settings.teamNameHeim.toUpperCase();
    if(teamNameGegnerDisplay) teamNameGegnerDisplay.textContent = spielstand.settings.teamNameGegner.toUpperCase();
    if(labelTorTrackerHeim) labelTorTrackerHeim.textContent = spielstand.settings.teamNameHeim;
    if(labelTorTrackerGegner) labelTorTrackerGegner.textContent = spielstand.settings.teamNameGegner;
}

// --- 15. Initialisierung ---
ladeSpielstand();