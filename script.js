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
const neuesSpielButton = document.getElementById('neuesSpielButton');
const timerAnzeige = document.getElementById('timerAnzeige');

// Spielstand & Korrektur
const scoreAnzeige = document.getElementById('scoreAnzeige'); // Spielstand
const scoreWrapper = document.getElementById('scoreWrapper'); 
const heimScoreUp = document.getElementById('heimScoreUp'); 
const heimScoreDown = document.getElementById('heimScoreDown'); 
const gegnerScoreUp = document.getElementById('gegnerScoreUp'); 
const gegnerScoreDown = document.getElementById('gegnerScoreDown'); 

const zurueckButton = document.getElementById('zurueckButton');
const vorButton = document.getElementById('vorButton');
const pauseButton = document.getElementById('pauseButton'); // Echter Pause-Knopf
const gamePhaseButton = document.getElementById('gamePhaseButton'); // Phasen-Knopf
const spielerRaster = document.getElementById('spielerRaster');
const protokollAusgabe = document.getElementById('protokollAusgabe');

// Globale Aktionen
const globalAktionen = document.getElementById('globalAktionen');
const gegnerTorButton = document.getElementById('gegnerTorButton');
const gegner2minButton = document.getElementById('gegner2minButton'); 

// Statistik-Seitenleiste (ANGEPASST)
const statistikSidebar = document.getElementById('statistikSidebar'); // war torTracker
const torTabelleBody = document.getElementById('torTabelleBody');
const statistikWrapper = document.getElementById('statistikWrapper'); // NEU
const statistikTabelleBody = document.getElementById('statistikTabelleBody'); // NEU

// Modals
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

// (Statistik Modal Elemente ENTFERNT)


// --- 2. Spiel-Zustand (Variablen) ---
const SPEICHER_KEY = 'handballTeamState';

let spielstand = {
    uiState: 'setup', // 'setup' oder 'game'
    roster: [], // { name: 'Anna', number: 7 }
    score: { heim: 0, gegner: 0 }, // Spielstand
    gameLog: [], // { time: '00:00', playerId: 7, playerName: 'Anna', action: 'Tor', spielstand: '1:0' }
    timer: {
        gamePhase: 1, // 1=Vor Spiel, 2=1. HZ, 3=Halbzeit, 4=2. HZ, 5=Beendet
        istPausiert: true,
        segmentStartZeit: 0,
        verstricheneSekundenBisher: 0,
    }
};

let timerInterval;
let aktuellerSpielerIndex = null; // Speichert, welcher Spieler (Index) ausgewählt wurde
let aktuelleAktionTyp = ''; // Speichert die Aktion für den Kommentar

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

    // Stellt sicher, dass alte Speicherstände kompatibel sind
    if (!spielstand.score) {
        spielstand.score = { heim: 0, gegner: 0 };
    }
    if (!spielstand.timer.gamePhase) {
        spielstand.timer.gamePhase = 1;
    }
    
    if (spielstand.uiState === 'game') {
        // Spiel-Modus wiederherstellen
        rosterBereich.classList.add('versteckt');
        spielBereich.classList.remove('versteckt');
        globalAktionen.classList.remove('versteckt'); 
        scoreWrapper.classList.remove('versteckt'); 
        statistikSidebar.classList.remove('versteckt'); // Ganze Sidebar anzeigen
        
        // Timer und Button-Zustand wiederherstellen
        timerAnzeige.textContent = formatiereZeit(spielstand.timer.verstricheneSekundenBisher);
        spielstand.timer.istPausiert = true; // Beim Laden immer pausieren
        setSteuerungAktiv(false); // Knöpfe immer deaktivieren beim Laden
        
        const phase = spielstand.timer.gamePhase;
        if (phase === 1) {
            gamePhaseButton.textContent = 'Spielstart';
            statistikWrapper.classList.add('versteckt'); // Stats verstecken
        } else if (phase === 2) {
            gamePhaseButton.textContent = 'Weiter (1. HZ)'; 
            spielstand.timer.gamePhase = 1.5; 
            statistikWrapper.classList.add('versteckt'); // Stats verstecken
        } else if (phase === 3) {
            gamePhaseButton.textContent = 'Weiter (2. HZ)';
            statistikWrapper.classList.add('versteckt'); // Stats verstecken
        } else if (phase === 4) {
            gamePhaseButton.textContent = 'Weiter (2. HZ)';
            spielstand.timer.gamePhase = 3.5; 
            statistikWrapper.classList.add('versteckt'); // Stats verstecken
        } else if (phase === 5) {
            gamePhaseButton.textContent = 'Beendet';
            gamePhaseButton.disabled = true;
            gamePhaseButton.classList.add('beendet');
            // STATISTIK ANZEIGEN, da Spiel beendet
            zeichneStatistikTabelle(berechneStatistiken()); 
            statistikWrapper.classList.remove('versteckt'); 
        }
        
        pauseButton.classList.add('versteckt');
        pauseButton.disabled = true;

        updateScoreDisplay(); 
        zeichneSpielerRaster();
        updateProtokollAnzeige();
        updateTorTracker(); 
    } else {
        // Setup-Modus
        zeichneRosterListe();
    }
}

// --- 4. Roster-Management (Bildschirm 1) ---

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
    statistikSidebar.classList.remove('versteckt'); // Ganze Sidebar anzeigen
    statistikWrapper.classList.add('versteckt'); // Aber Stats-Teil verstecken
    
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
}

function switchToRoster() {
    spielstand.uiState = 'setup';
    speichereSpielstand();
    
    spielBereich.classList.add('versteckt');
    rosterBereich.classList.remove('versteckt');
    globalAktionen.classList.add('versteckt'); 
    scoreWrapper.classList.add('versteckt'); 
    statistikSidebar.classList.add('versteckt'); // Ganze Sidebar verstecken
    
    // Timer stoppen, falls er lief (sollte nicht, aber sicher ist sicher)
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


// --- 6. Spiel-Modus (Bildschirm 2) ---

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
}

function startTimer() {
    spielstand.timer.segmentStartZeit = Date.now();
    timerInterval = setInterval(updateTimer, 1000);
    spielstand.timer.istPausiert = false;
}

function stoppTimer() {
    if (spielstand.timer.istPausiert) return; // Schon gestoppt
    clearInterval(timerInterval);
    const segmentSekunden = (Date.now() - spielstand.timer.segmentStartZeit) / 1000;
    spielstand.timer.verstricheneSekundenBisher += segmentSekunden;
    spielstand.timer.istPausiert = true;
}

// Logik für den SPIELPHASEN-Knopf (Halbzeit etc.)
function handleGamePhaseClick() {
    const phase = spielstand.timer.gamePhase;
    if (phase === 5) return; // Beendet

    if (phase === 1) { // Klick auf "Spielstart"
        spielstand.timer.gamePhase = 2;
        gamePhaseButton.textContent = 'Halbzeit';
        startTimer();
        setSteuerungAktiv(true);
        pauseButton.classList.remove('versteckt');
        pauseButton.disabled = false;
    
    } else if (phase === 2) { // Klick auf "Halbzeit"
        spielstand.timer.gamePhase = 3;
        gamePhaseButton.textContent = 'Weiter (2. HZ)';
        stoppTimer();
        setSteuerungAktiv(false);
        pauseButton.classList.add('versteckt'); // Echte Pause verstecken
        pauseButton.disabled = true;
        logGlobalAktion('Halbzeit');

    } else if (phase === 1.5) { // Klick auf "Weiter (1. HZ)" (nach Laden)
        spielstand.timer.gamePhase = 2;
        gamePhaseButton.textContent = 'Halbzeit';
        startTimer();
        setSteuerungAktiv(true);
        pauseButton.classList.remove('versteckt');
        pauseButton.disabled = false;
    
    } else if (phase === 3) { // Klick auf "Weiter (2. HZ)"
        spielstand.timer.gamePhase = 4;
        gamePhaseButton.textContent = 'Spiel Ende';
        startTimer();
        setSteuerungAktiv(true);
        pauseButton.classList.remove('versteckt');
        pauseButton.disabled = false;
        logGlobalAktion('Start 2. Halbzeit');

    } else if (phase === 3.5) { // Klick auf "Weiter (2. HZ)" (nach Laden)
        spielstand.timer.gamePhase = 4;
        gamePhaseButton.textContent = 'Spiel Ende';
        startTimer();
        setSteuerungAktiv(true);
        pauseButton.classList.remove('versteckt');
        pauseButton.disabled = false;

    } else if (phase === 4) { // Klick auf "Spiel Ende"
        spielstand.timer.gamePhase = 5;
        gamePhaseButton.textContent = 'Beendet';
        gamePhaseButton.disabled = true;
        gamePhaseButton.classList.add('beendet');
        stoppTimer();
        setSteuerungAktiv(false);
        pauseButton.classList.add('versteckt'); // Echte Pause verstecken
        pauseButton.disabled = true;
        logGlobalAktion('Spiel Ende');
        
        // --- ANGEPASSTER AUFRUF ---
        zeichneStatistikTabelle(berechneStatistiken());
        statistikWrapper.classList.remove('versteckt'); // Zeige die Zusammenfassung
    }
    speichereSpielstand();
}

// Logik für den echten PAUSE-Knopf
function handleRealPauseClick() {
    // Nur pausieren, wenn in HZ1 (2) oder HZ2 (4)
    if (spielstand.timer.gamePhase !== 2 && spielstand.timer.gamePhase !== 4) return;

    if (spielstand.timer.istPausiert === false) {
        // --- ECHT PAUSIEREN ---
        stoppTimer();
        pauseButton.textContent = 'Weiter';
        setSteuerungAktiv(false); // Deaktiviert alle Aktionsknöpfe
        
        // Wichtig: Phasen-Knopf (Halbzeit/Spiel Ende) bleibt aktiv!
        gamePhaseButton.disabled = false;
    } else {
        // --- ECHT FORTSETZEN ---
        startTimer();
        pauseButton.textContent = 'Pause';
        setSteuerungAktiv(true); // Aktiviert alle Aktionsknöpfe
    }
    speichereSpielstand();
}


function setSteuerungAktiv(aktiv) {
    // Deaktiviert nur die *Aktions*-Knöpfe
    const spielerButtons = document.querySelectorAll('.spieler-button');
    spielerButtons.forEach(btn => btn.disabled = !aktiv);
    
    gegnerTorButton.disabled = !aktiv;
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

// --- 8. Aktions-Modal Funktionen ---

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

    // 1. Spielstand aktualisieren, FALLS NÖTIG
    if (aktion === "Tor") {
        spielstand.score.heim++;
    }
    const aktuellerSpielstand = `${spielstand.score.heim}:${spielstand.score.gegner}`;
    updateScoreDisplay(); // UI Anzeige aktualisieren

    // 2. Log-Eintrag erstellen und HINZUFÜGEN
    spielstand.gameLog.unshift({
        time: aktuelleZeit,
        playerId: player.number,
        playerName: player.name,
        action: aktion,
        kommentar: kommentar,
        spielstand: aktuellerSpielstand // Spielstand im Log speichern
    });

    // 3. UI basierend auf dem NEUEN Log aktualisieren
    updateProtokollAnzeige();
    updateTorTracker(); 
    speichereSpielstand();
    
    // 4. Modals schließen
    schliesseAktionsMenue();
}

// --- 9. Protokoll, Export & Neues Spiel ---

// Funktion für globale Aktionen
function logGlobalAktion(aktion, kommentar = null) {
    const aktuelleZeit = timerAnzeige.textContent;

    // Spielstand aktualisieren
    if (aktion === "Gegner Tor") {
        spielstand.score.gegner++;
    }
    const aktuellerSpielstand = `${spielstand.score.heim}:${spielstand.score.gegner}`;
    updateScoreDisplay(); // UI Anzeige aktualisieren
    // Tor-Tracker muss hier nicht aktualisiert werden, da es ein Gegner-Tor ist

    spielstand.gameLog.unshift({
        time: aktuelleZeit,
        playerId: null, // Kein Spieler
        playerName: "SPIEL", // Markiert als Spiel-Aktion
        action: aktion,
        kommentar: kommentar,
        spielstand: aktuellerSpielstand // Spielstand im Log speichern
    });

    updateProtokollAnzeige();
    speichereSpielstand();
    // Kein Modal zu schließen
}

// Manuelle Score-Korrektur loggen
function logScoreKorrektur(team, change) {
    const aktuelleZeit = timerAnzeige.textContent;

    // 1. Spielstand anpassen
    if (team === 'heim') {
        spielstand.score.heim += change;
        if (spielstand.score.heim < 0) spielstand.score.heim = 0;
    } else { // team === 'gegner'
        spielstand.score.gegner += change;
        if (spielstand.score.gegner < 0) spielstand.score.gegner = 0;
    }
    
    // 2. UI Anzeige aktualisieren
    const aktuellerSpielstand = `${spielstand.score.heim}:${spielstand.score.gegner}`;
    updateScoreDisplay();

    // 3. Log-Eintrag erstellen
    const teamName = team === 'heim' ? "Heim" : "Gegner";
    const changeText = change > 0 ? "+1" : "-1";
    const aktion = `Manuelle Korrektur (${teamName} ${changeText})`;

    spielstand.gameLog.unshift({
        time: aktuelleZeit,
        playerId: null,
        playerName: "SPIEL",
        action: aktion,
        kommentar: null,
        spielstand: aktuellerSpielstand // Den neuen Spielstand loggen
    });

    // 4. UI/Speicher aktualisieren
    updateProtokollAnzeige();
    updateTorTracker(); // Tor-Tracker aktualisieren (falls ein Heim-Tor korrigiert wurde)
    speichereSpielstand();
}


function updateProtokollAnzeige() {
    protokollAusgabe.innerHTML = '';
    
    spielstand.gameLog.forEach((eintrag, index) => {
        const p = document.createElement('p');
        const textSpan = document.createElement('span');
        
        let text;
        // Spielstand aus dem Log-Eintrag holen
        const spielstandText = eintrag.spielstand ? ` <strong>(${eintrag.spielstand})</strong>` : '';

        if (eintrag.playerId) {
            // Spieler-Aktion
            text = `<strong>[${eintrag.time}] #${eintrag.playerId} (${eintrag.playerName}): ${eintrag.action}</strong>${spielstandText}`;
        } else {
            // Globale Aktion (z.B. Gegner Tor)
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
    // Zeige eine Bestätigungsbox
    if (confirm("Möchtest du diesen Eintrag wirklich löschen?")) {
        
        const geloeschterEintrag = spielstand.gameLog[index];
        spielstand.gameLog.splice(index, 1); // Eintrag löschen

        // Spielstand anpassen, falls ein Tor oder eine Korrektur gelöscht wurde
        if (geloeschterEintrag.action === "Tor") {
            spielstand.score.heim--;
        } else if (geloeschterEintrag.action === "Gegner Tor") {
            spielstand.score.gegner--;
        } else if (geloeschterEintrag.action.includes("Korrektur")) {
            // Umgekehrte Logik für Korrekturen anwenden
            if (geloeschterEintrag.action.includes("Heim +1")) {
                spielstand.score.heim--;
            } else if (geloeschterEintrag.action.includes("Heim -1")) {
                spielstand.score.heim++;
            } else if (geloeschterEintrag.action.includes("Gegner +1")) {
                spielstand.score.gegner--;
            } else if (geloeschterEintrag.action.includes("Gegner -1")) {
                spielstand.score.gegner++;
            }
        }
        
        // Sicherstellen, dass nichts negativ wird
        if(spielstand.score.heim < 0) spielstand.score.heim = 0;
        if(spielstand.score.gegner < 0) spielstand.score.gegner = 0;
        
        // UI und Protokoll aktualisieren
        updateScoreDisplay(); // Score-Anzeige oben
        updateProtokollAnzeige(); // Protokoll-Liste
        updateTorTracker(); // Tor-Tracker aktualisieren
        speichereSpielstand();
    }
}

// --- ANGEPASSTE EXPORT-FUNKTION ---
function exportiereAlsTxt() {
    if (spielstand.gameLog.length === 0) {
        alert("Das Protokoll ist leer. Es gibt nichts zu exportieren.");
        return;
    }
    
    let dateiInhalt = "Protokoll Handball Team-Tracker\n\n";
    dateiInhalt += `Team: ${spielstand.roster.map(p => `#${p.number} ${p.name}`).join(', ')}\n\n`;
    
    // Tor-Tracker-Daten hinzufügen
    dateiInhalt += "--- TOR-ÜBERSICHT ---\n";
    const toreMap = berechneTore();
    spielstand.roster.forEach(player => {
        const tore = toreMap.get(player.number) || 0;
        dateiInhalt += `#${player.number} ${player.name}: ${tore} Tore\n`;
    });
    dateiInhalt += "---------------------\n\n";

    // Vollständige Statistik-Übersicht hinzufügen (JETZT MIT PADDING)
    dateiInhalt += "--- SPIEL-STATISTIK ---\n";
    const statsData = berechneStatistiken();
    
    // 1. Finde die maximale Namenslänge für die Spaltenausrichtung
    let maxNameLength = "Spieler".length;
    statsData.forEach(stats => {
        const nameLength = (`#${stats.number} ${stats.name}`).length;
        if (nameLength > maxNameLength) {
            maxNameLength = nameLength;
        }
    });
    maxNameLength += 2; // Füge 2 extra Leerzeichen als Puffer hinzu

    // 2. Definiere Spaltenbreiten (basierend auf Header + Puffer)
    const col7m = "7m Raus".length + 2;
    const colGut = "Gut".length + 2;
    const colFehlwurf = "Fehlwurf".length + 2;
    const colTechFehler = "Tech. Fehler".length + 2;
    const colGelb = "Gelb".length + 2;
    const col2min = "2min".length + 2;
    const colRot = "Rot".length + 2;

    // 3. Header erstellen
    let header = "Spieler".padEnd(maxNameLength);
    header += "7m Raus".padEnd(col7m);
    header += "Gut".padEnd(colGut);
    header += "Fehlwurf".padEnd(colFehlwurf);
    header += "Tech. Fehler".padEnd(colTechFehler);
    header += "Gelb".padEnd(colGelb);
    header += "2min".padEnd(col2min);
    header += "Rot".padEnd(colRot);
    dateiInhalt += header + "\n";

    // 4. Trennlinie erstellen
    const totalLength = maxNameLength + col7m + colGut + colFehlwurf + colTechFehler + colGelb + col2min + colRot;
    dateiInhalt += "-".repeat(totalLength).substring(0, totalLength - (colRot.length-3)) + "\n"; // Etwas kürzer
    
    // 5. Datenzeilen erstellen
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


    // Protokoll-Teil
    [...spielstand.gameLog].reverse().forEach(e => {
        if (e.playerId) {
            dateiInhalt += `[${e.time}] #${e.playerId} (${e.playerName}): ${e.action}`;
        } else {
            dateiInhalt += `[${e.time}] ${e.action.toUpperCase()}`;
        }
        
        // Spielstand zum Export hinzufügen
        if (e.spielstand) {
            dateiInhalt += ` (${e.spielstand})`;
        }

        if (e.kommentar) {
            dateiInhalt += `: ${e.kommentar}`;
        }
        dateiInhalt += "\n";
    });

    const blob = new Blob([dateiInhalt], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'handball_team_protokoll.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}


function starteNeuesSpiel() {
    if (confirm("Bist du sicher? Das löscht das gesamte Spielprotokoll, aber dein Team bleibt gespeichert.")) {
        
        spielstand.gameLog = [];
        spielstand.score = { heim: 0, gegner: 0 }; // Spielstand zurücksetzen
        spielstand.timer = {
            gamePhase: 1, // Zurück zu Phase 1
            istPausiert: true,
            segmentStartZeit: 0,
            verstricheneSekundenBisher: 0,
        };
        
        speichereSpielstand();
        location.reload(); // Einfachster Weg, um UI zurückzusetzen
    }
}

// --- 10. Tor-Tracker Funktionen ---

// Berechnet die Tore pro Spieler aus dem Log
function berechneTore() {
    const toreMap = new Map();
    // Gehe durch das *aktuelle* Log
    for (const eintrag of spielstand.gameLog) {
        if (eintrag.action === "Tor" && eintrag.playerId) {
            toreMap.set(eintrag.playerId, (toreMap.get(eintrag.playerId) || 0) + 1);
        }
    }
    return toreMap;
}

// Aktualisiert die Tor-Tabelle in der UI
function updateTorTracker() {
    if (!torTabelleBody) return; // Sicherstellen, dass das Element existiert
    
    const toreMap = berechneTore();

    // Erstelle Daten-Array aus Roster
    const trackerData = spielstand.roster.map(player => ({
        name: player.name,
        number: player.number,
        tore: toreMap.get(player.number) || 0
    }));
    
    // Sortiere nach Toren (meiste oben)
    trackerData.sort((a, b) => b.tore - a.tore);
    
    // Zeichne die Tabelle
    torTabelleBody.innerHTML = '';
    trackerData.forEach(data => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${data.number} ${data.name}</td>
            <td>${data.tore}</td>
        `;
        torTabelleBody.appendChild(tr);
    });
}


// --- 11. Statistik-Funktionen (NICHT MEHR MODAL) ---

function berechneStatistiken() {
    // 1. Initialisiere ein Statistik-Objekt für jeden Spieler
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

    // 2. Gehe durch das Log und zähle die Aktionen
    for (const eintrag of spielstand.gameLog) {
        if (!eintrag.playerId || !statsMap.has(eintrag.playerId)) {
            continue; // Überspringe globale Aktionen
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
    
    // 3. Konvertiere die Map zu einem Array für einfaches Sortieren/Anzeigen
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

// (zeigeStatistikModal Funktion ENTFERNT)


// --- 12. Event Listener Zuweisung ---

// Bildschirm 1
addPlayerForm.addEventListener('submit', addPlayer);
startGameButton.addEventListener('click', switchToGame);
cancelEditButton.addEventListener('click', schliesseEditModus);
exportTeamButton.addEventListener('click', exportTeam);
importTeamButton.addEventListener('click', () => importFileInput.click());
importFileInput.addEventListener('change', handleFileImport);

// Bildschirm 2
backToRosterButton.addEventListener('click', switchToRoster);
gamePhaseButton.addEventListener('click', handleGamePhaseClick); // Phasen-Knopf
pauseButton.addEventListener('click', handleRealPauseClick); // Echter Pause-Knopf
zurueckButton.addEventListener('click', () => handleZeitSprung(-30));
vorButton.addEventListener('click', () => handleZeitSprung(30));
neuesSpielButton.addEventListener('click', starteNeuesSpiel);
exportButton.addEventListener('click', exportiereAlsTxt);
gegnerTorButton.addEventListener('click', () => logGlobalAktion('Gegner Tor'));
gegner2minButton.addEventListener('click', () => logGlobalAktion('Gegner 2 min')); 

// Score-Anpassungs-Listener
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

// Fügt Klick-Handler für alle Standard-Aktionen hinzu
document.querySelectorAll('#aktionsMenue .aktion-button[data-aktion]').forEach(btn => {
    btn.addEventListener('click', () => {
        logAktion(btn.dataset.aktion);
    });
});

// Modal 2: "Gute Aktion" Vorauswahl
aktionVorauswahlAbbrechen.addEventListener('click', () => {
    aktionVorauswahl.classList.add('versteckt');
    aktionsMenue.classList.remove('versteckt'); // Zurück zum Hauptmenü
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
    kommentarInput.value = ''; // Feld leeren
});

// (Event Listener für Statistik-Modal ENTFERNT)


// Aktualisiert die Spielstand-Anzeige (z.B. 1:0)
function updateScoreDisplay() {
    if (scoreAnzeige) {
        scoreAnzeige.textContent = `${spielstand.score.heim}:${spielstand.score.gegner}`;
    }
}

// --- 13. Initialisierung ---
// Wenn die Seite geladen wird, lade den letzten Stand
ladeSpielstand();
