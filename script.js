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

// Spielstand & Korrektur (ANGEPASST)
const scoreAnzeige = document.getElementById('scoreAnzeige'); // Spielstand
const scoreWrapper = document.getElementById('scoreWrapper'); // NEU
const heimScoreUp = document.getElementById('heimScoreUp'); // NEU
const heimScoreDown = document.getElementById('heimScoreDown'); // NEU
const gegnerScoreUp = document.getElementById('gegnerScoreUp'); // NEU
const gegnerScoreDown = document.getElementById('gegnerScoreDown'); // NEU

const zurueckButton = document.getElementById('zurueckButton');
const vorButton = document.getElementById('vorButton');
const pauseButton = document.getElementById('pauseButton');
const spielerRaster = document.getElementById('spielerRaster');
const protokollAusgabe = document.getElementById('protokollAusgabe');

// Globale Aktionen
const globalAktionen = document.getElementById('globalAktionen');
const gegnerTorButton = document.getElementById('gegnerTorButton');

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


// --- 2. Spiel-Zustand (Variablen) ---
const SPEICHER_KEY = 'handballTeamState';

let spielstand = {
    uiState: 'setup', // 'setup' oder 'game'
    roster: [], // { name: 'Anna', number: 7 }
    score: { heim: 0, gegner: 0 }, // Spielstand
    gameLog: [], // { time: '00:00', playerId: 7, playerName: 'Anna', action: 'Tor', spielstand: '1:0' }
    timer: {
        istPausiert: true,
        segmentStartZeit: 0,
        verstricheneSekundenBisher: 0,
        gestartet: false
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

    // Stellt sicher, dass alte Speicherstände ohne Score-Objekt funktionieren
    if (!spielstand.score) {
        spielstand.score = { heim: 0, gegner: 0 };
    }
    
    if (spielstand.uiState === 'game') {
        // Spiel-Modus wiederherstellen
        rosterBereich.classList.add('versteckt');
        spielBereich.classList.remove('versteckt');
        globalAktionen.classList.remove('versteckt'); // Global-Aktionen anzeigen
        scoreWrapper.classList.remove('versteckt'); // Spielstand-Block anzeigen
        
        // Timer wiederherstellen (immer pausiert)
        spielstand.timer.istPausiert = true;
        timerAnzeige.textContent = formatiereZeit(spielstand.timer.verstricheneSekundenBisher);
        pauseButton.textContent = spielstand.timer.gestartet ? 'Weiter' : 'Spielstart';
        setSteuerungAktiv(false); // Knöpfe deaktivieren
        
        updateScoreDisplay(); // Spielstand aktualisieren
        zeichneSpielerRaster();
        updateProtokollAnzeige();
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
    const editIndex = editPlayerIndex.value; // Prüfen, ob wir im Bearbeiten-Modus sind

    if (!name || isNaN(number)) {
        alert("Bitte gib einen gültigen Namen und eine Nummer ein.");
        return;
    }
    
    // Prüfen, ob Nummer schon vergeben ist (außer bei Bearbeitung desselben Spielers)
    const existierenderSpieler = spielstand.roster.find((p, i) => p.number === number && i != editIndex);
    if (existierenderSpieler) {
        alert("Diese Nummer ist bereits vergeben.");
        return;
    }

    if (editIndex) {
        // --- BEARBEITEN MODUS ---
        const player = spielstand.roster[editIndex];
        player.name = name;
        player.number = number;
        
        schliesseEditModus();

    } else {
        // --- HINZUFÜGEN MODUS ---
        spielstand.roster.push({ 
            name, 
            number
        });
    }

    spielstand.roster.sort((a, b) => a.number - b.number); // Nach Nummer sortieren
    speichereSpielstand();
    zeichneRosterListe();

    // Formular zurücksetzen (außer im Bearbeiten-Modus, da schließt es eh)
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
    
    // Formular füllen
    playerNameInput.value = player.name;
    playerNumberInput.value = player.number;
    editPlayerIndex.value = index; // Index setzen!
    
    // UI anpassen
    addPlayerForm.querySelector('button[type="submit"]').textContent = 'Speichern';
    cancelEditButton.classList.remove('versteckt');
}

function schliesseEditModus() {
    // Formular leeren
    playerNameInput.value = '';
    playerNumberInput.value = '';
    editPlayerIndex.value = ''; // Index leeren!
    
    // UI zurücksetzen
    addPlayerForm.querySelector('button[type="submit"]').textContent = 'Hinzufügen';
    cancelEditButton.classList.add('versteckt');
}

function zeichneRosterListe() {
    rosterListe.innerHTML = ''; // Liste leeren
    if (spielstand.roster.length === 0) {
        rosterListe.innerHTML = '<li>Noch keine Spieler hinzugefügt.</li>';
        return;
    }
    
    spielstand.roster.forEach((player, index) => {
        const li = document.createElement('li');
        
        const text = document.createElement('span');
        text.textContent = `#${player.number} - ${player.name}`;
        li.appendChild(text);
        
        // Wrapper für Knöpfe
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
    globalAktionen.classList.remove('versteckt'); // Global-Aktionen anzeigen
    scoreWrapper.classList.remove('versteckt'); // Spielstand-Block anzeigen
    
    // Sicherstellen, dass der Timer-Status korrekt ist
    spielstand.timer.istPausiert = true;
    pauseButton.textContent = spielstand.timer.gestartet ? 'Weiter' : 'Spielstart';
    timerAnzeige.textContent = formatiereZeit(spielstand.timer.verstricheneSekundenBisher);
    setSteuerungAktiv(false); // Spiel startet immer pausiert
    
    updateScoreDisplay(); // Spielstand (z.B. 0:0) anzeigen
    zeichneSpielerRaster();
    updateProtokollAnzeige();
}

function switchToRoster() {
    spielstand.uiState = 'setup';
    speichereSpielstand();
    
    spielBereich.classList.add('versteckt');
    rosterBereich.classList.remove('versteckt');
    globalAktionen.classList.add('versteckt'); // Global-Aktionen verstecken
    scoreWrapper.classList.add('versteckt'); // Spielstand-Block verstecken
    
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
    if (!file) {
        return;
    }
    
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

function handlePauseClick() {
    if (spielstand.timer.istPausiert === false) {
        // --- PAUSIEREN ---
        clearInterval(timerInterval);
        const segmentSekunden = (Date.now() - spielstand.timer.segmentStartZeit) / 1000;
        spielstand.timer.verstricheneSekundenBisher += segmentSekunden;
        spielstand.timer.istPausiert = true;
        pauseButton.textContent = 'Weiter';
        setSteuerungAktiv(false); 
    } else {
        // --- STARTEN / FORTSETZEN ---
        spielstand.timer.segmentStartZeit = Date.now();
        timerInterval = setInterval(updateTimer, 1000);
        spielstand.timer.istPausiert = false;
        spielstand.timer.gestartet = true; // Markieren, dass Timer läuft
        pauseButton.textContent = 'Pause';
        setSteuerungAktiv(true);
    }
    speichereSpielstand();
}

function setSteuerungAktiv(aktiv) {
    // Deaktiviert das Klicken auf Spieler, wenn pausiert
    const spielerButtons = document.querySelectorAll('.spieler-button');
    spielerButtons.forEach(btn => btn.disabled = !aktiv);
    
    // Auch globalen Knopf deaktivieren
    gegnerTorButton.disabled = !aktiv;
    
    // NEU: Korrektur-Knöpfe deaktivieren
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

    // Spielstand aktualisieren
    if (aktion === "Tor") {
        spielstand.score.heim++;
    }
    const aktuellerSpielstand = `${spielstand.score.heim}:${spielstand.score.gegner}`;
    updateScoreDisplay(); // UI Anzeige aktualisieren

    spielstand.gameLog.unshift({
        time: aktuelleZeit,
        playerId: player.number,
        playerName: player.name,
        action: aktion,
        kommentar: kommentar,
        spielstand: aktuellerSpielstand // Spielstand im Log speichern
    });

    updateProtokollAnzeige();
    speichereSpielstand();
    
    // Modals schließen
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

// NEUE FUNKTION: Manuelle Score-Korrektur loggen
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
        speichereSpielstand();
    }
}

function exportiereAlsTxt() {
    if (spielstand.gameLog.length === 0) {
        alert("Das Protokoll ist leer. Es gibt nichts zu exportieren.");
        return;
    }
    
    let dateiInhalt = "Protokoll Handball Team-Tracker\n\n";
    dateiInhalt += `Team: ${spielstand.roster.map(p => `#${p.number} ${p.name}`).join(', ')}\n\n`;
    
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
        // Setzt nur das Protokoll und den Timer zurück, nicht das Roster
        spielstand.gameLog = [];
        spielstand.score = { heim: 0, gegner: 0 }; // Spielstand zurücksetzen
        spielstand.timer = {
            istPausiert: true,
            segmentStartZeit: 0,
            verstricheneSekundenBisher: 0,
            gestartet: false
        };
        
        speichereSpielstand();
        location.reload(); // Einfachster Weg, um UI zurückzusetzen
    }
}


// --- 10. Event Listener Zuweisung ---

// Bildschirm 1
addPlayerForm.addEventListener('submit', addPlayer);
startGameButton.addEventListener('click', switchToGame);
cancelEditButton.addEventListener('click', schliesseEditModus);
exportTeamButton.addEventListener('click', exportTeam);
importTeamButton.addEventListener('click', () => importFileInput.click());
importFileInput.addEventListener('change', handleFileImport);

// Bildschirm 2
backToRosterButton.addEventListener('click', switchToRoster);
pauseButton.addEventListener('click', handlePauseClick);
zurueckButton.addEventListener('click', () => handleZeitSprung(-30));
vorButton.addEventListener('click', () => handleZeitSprung(30));
neuesSpielButton.addEventListener('click', starteNeuesSpiel);
exportButton.addEventListener('click', exportiereAlsTxt);
gegnerTorButton.addEventListener('click', () => logGlobalAktion('Gegner Tor'));

// NEUE Score-Anpassungs-Listener
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


// Aktualisiert die Spielstand-Anzeige (z.B. 1:0)
function updateScoreDisplay() {
    if (scoreAnzeige) {
        scoreAnzeige.textContent = `${spielstand.score.heim}:${spielstand.score.gegner}`;
    }
}

// --- 11. Initialisierung ---
// Wenn die Seite geladen wird, lade den letzten Stand
ladeSpielstand();
