import { spielstand, speichereSpielstand } from './state.js';
import {
    rosterBereich, spielBereich, globalAktionen, scoreWrapper,
    statistikWrapper, gamePhaseButton, timerAnzeige, pauseButton,
    heimScoreUp, heimScoreDown, gegnerScoreUp, gegnerScoreDown,
    gegnerNummerModal, sevenMeterOutcomeModal, aktionsMenue, aktionVorauswahl, kommentarBereich,
    wurfpositionModal, spielBeendenButton
} from './dom.js';
import {
    applyViewSettings, applyTheme, updateScoreDisplay, updateProtokollAnzeige,
    updateSuspensionDisplay, zeichneSpielerRaster,
    zeichneStatistikTabelle, oeffneWurfbildModal, oeffneGegnerNummerModal as uiOeffneGegnerNummerModal,
    zeichneRosterListe, startButtonAnimation
} from './ui.js';
import { startTimer, stoppTimer, updateTimer } from './timer.js';
import { startVideoTimer } from './timer.js';
import { formatiereZeit } from './utils.js';
import { berechneStatistiken } from './stats.js';
import { customConfirm, customAlert } from './customDialog.js';
import { toast } from './toast.js';

export let aktuellerSpielerIndex = null;
export let aktuelleAktionTyp = '';
let currentGegnerActionType = 'tor'; // 'tor', '7m', '2min'

// Verfolge, ob die aktuelle Aktion für den Gegner ist
let istGegnerAktion = false;
let aktuelleGegnernummer = null;

// New Selection State
let selectedPlayerState = {
    index: null, // For My Team
    gegnerNummer: null, // For Opponent
    team: null, // 'myteam' or 'opponent'
    name: null
};

// Mobile Substitution State - pending bench player for swap
let pendingBenchSwap = null; // { index, team, name }

export function setSteuerungAktiv(aktiv) {
    // Player buttons are always enabled - removed: spielerButtons.forEach(btn => btn.disabled = !aktiv);

    if (heimScoreUp) heimScoreUp.disabled = !aktiv;
    if (heimScoreDown) heimScoreDown.disabled = !aktiv;
    if (gegnerScoreUp) gegnerScoreUp.disabled = !aktiv;
    if (gegnerScoreDown) gegnerScoreDown.disabled = !aktiv;
}

// NEW Helper for Video Time
function getVideoTimeSeconds() {
    if (!spielstand.timer.videoStartTime) return 0;
    return Math.floor((Date.now() - spielstand.timer.videoStartTime) / 1000);
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

    updateGameControls();

    // Resume timer if needed (specific to switchToGame / initial load)
    if ((spielstand.timer.gamePhase === 2 || spielstand.timer.gamePhase === 4) && !spielstand.timer.istPausiert) {
        startTimer();
    }

    zeichneSpielerRaster();

    zeichneSpielerRaster();
    updateProtokollAnzeige();
    // updateTorTracker(); // Removed feature
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

export function updateGameControls() {
    // State Restoration (Fix for Reload or View Switch)
    const phase = spielstand.timer.gamePhase;

    if (phase === 1) {
        gamePhaseButton.textContent = 'Spielstart';
        timerAnzeige.textContent = formatiereZeit(0);
        setSteuerungAktiv(false);
        pauseButton.classList.add('versteckt');
        gamePhaseButton.disabled = false;
        gamePhaseButton.classList.remove('beendet');
    }
    else if (phase === 2) {
        gamePhaseButton.textContent = 'Halbzeit';
        setSteuerungAktiv(true);
        pauseButton.classList.remove('versteckt');
        pauseButton.disabled = false;
        pauseButton.textContent = spielstand.timer.istPausiert ? 'Weiter' : 'Pause';
    }
    else if (phase === 3) {
        gamePhaseButton.textContent = 'Weiter (2. HZ)';
        setSteuerungAktiv(false);
        pauseButton.classList.add('versteckt');
        stoppTimer(); // Ensure paused
    }
    else if (phase === 4) {
        gamePhaseButton.textContent = 'Spiel Ende';
        setSteuerungAktiv(true);
        pauseButton.classList.remove('versteckt');
        pauseButton.disabled = false;
        pauseButton.textContent = spielstand.timer.istPausiert ? 'Weiter' : 'Pause';
    }
    else if (phase === 5) {
        gamePhaseButton.textContent = 'Beendet';
        gamePhaseButton.disabled = true;
        gamePhaseButton.classList.add('beendet');
        setSteuerungAktiv(false);
        pauseButton.classList.add('versteckt');
        statistikWrapper.classList.remove('versteckt');
    }

    updateScoreDisplay();

    // Immediate Timer Display Update
    let currentSeconds = spielstand.timer.verstricheneSekundenBisher;
    if (!spielstand.timer.istPausiert && spielstand.timer.segmentStartZeit) {
        const now = Date.now();
        const diff = Math.floor((now - spielstand.timer.segmentStartZeit) / 1000);
        currentSeconds += diff;
    }
    if (timerAnzeige) {
        timerAnzeige.textContent = formatiereZeit(Math.max(0, currentSeconds));
    }

    // Resume Timer Loop if active
    // This ensures the interval starts even after a page reload
    if (!spielstand.timer.istPausiert && (phase === 2 || phase === 4)) {
        startTimer();
    }
}

export function handleGamePhaseClick() {
    const phase = spielstand.timer.gamePhase;
    if (phase === 5) return;

    if (phase === 1) {
        spielstand.timer.gamePhase = 2;
        gamePhaseButton.textContent = 'Halbzeit';

        // Start video analysis timer (continuous, uninterrupted)
        startVideoTimer();

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

        // Start video analysis timer (simple mode start)
        startVideoTimer();

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

export function selectPlayer(index, team, gegnerNummer, name, isOnBench = false) {
    // 0. Check Game Mode - Unified Logic
    // In Simple Mode, we use the same selection state and dashboard.
    // The previous branching was relying on a missing function and skipping state updates.
    // Flow continues to standard logic...


    // 1. Update State
    selectedPlayerState = { index, team, gegnerNummer, name };

    // Update Globals for logAktion compatibility
    if (team === 'myteam') {
        aktuellerSpielerIndex = parseInt(index, 10);
        istGegnerAktion = false;
        aktuelleGegnernummer = null;
    } else {
        aktuellerSpielerIndex = null; // or null?
        istGegnerAktion = true;
        aktuelleGegnernummer = parseInt(gegnerNummer, 10);
    }

    // 2. Visual Feedback
    const allButtons = document.querySelectorAll('.spieler-button');
    allButtons.forEach(btn => btn.classList.remove('selected'));

    // Find the button and add selected class
    let selector = '';
    if (team === 'myteam') {
        selector = `.spieler-button[data-team="myteam"][data-index="${index}"]`;
    } else {
        selector = `.spieler-button[data-team="opponent"][data-gegner-nummer="${gegnerNummer}"]`;
    }
    const selectedBtn = document.querySelector(selector);
    if (selectedBtn) selectedBtn.classList.add('selected');

    // 3. Check if mobile screen (tablet/phone) - special handling for substitutions
    if (window.innerWidth <= 768) {
        // CASE 1: Clicking bench player - store for pending swap, no popup
        if (isOnBench) {
            pendingBenchSwap = { index: parseInt(index, 10), team, name };
            // Show visual feedback that bench player is selected for swap
            if (selectedBtn) {
                selectedBtn.classList.add('pending-swap');
            }
            // Show toast notification
            // toast.info(`${name || 'Bank'} ausgewählt - tippe auf aktiven Spieler zum Wechseln`);
            return; // Don't open popup
        }

        // CASE 2: Active player clicked while bench player is pending - perform swap
        if (pendingBenchSwap && !isOnBench && pendingBenchSwap.team === team) {
            performMobileSwap(pendingBenchSwap.index, parseInt(index, 10), team);
            return;
        }

        // CASE 3: Normal player selection - show popup
        pendingBenchSwap = null; // Clear any pending swap
        document.querySelectorAll('.pending-swap').forEach(b => b.classList.remove('pending-swap'));
        showMobileActionPopup(name, team, index, gegnerNummer, isOnBench);
        return;
    }

    // Clear pending swap state on desktop
    pendingBenchSwap = null;

    // 3. Update Dashboard UI
    const dashboard = document.getElementById('actionDashboard');
    const nameDisplay = document.getElementById('selectedPlayerName');

    if (dashboard) dashboard.classList.remove('disabled');
    if (nameDisplay) nameDisplay.textContent = name || (team === 'myteam' ? `Spieler #${spielstand.roster[index]?.number}` : `Gegner #${gegnerNummer}`);

    // Gehalten button is always enabled when a player is selected (unless on bench)
    const paradeBtn = document.getElementById('actionParadeBtn');
    if (paradeBtn) {
        paradeBtn.disabled = false;
        paradeBtn.style.opacity = 1;
    }

    // --- NEW: Restrict actions if on bench ---
    const allActionBtns = document.querySelectorAll('#actionDashboard .action-btn');
    const allowedBenchActions = ["2 Minuten", "Gelbe Karte", "Rote Karte", "Blaue Karte"];

    allActionBtns.forEach(btn => {
        const action = btn.dataset.action;
        if (isOnBench) {
            // Disable if not in allowed list
            if (!allowedBenchActions.includes(action)) {
                btn.disabled = true;
                btn.style.opacity = '0.3';
                btn.style.cursor = 'not-allowed';
            } else {
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
            }
        } else {
            // Enable all (reset)
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        }
    });

}

// Mobile Swap Function - swaps bench player with active player
function performMobileSwap(benchIndex, activeIndex, team) {
    // Clear pending state
    pendingBenchSwap = null;
    document.querySelectorAll('.pending-swap').forEach(b => b.classList.remove('pending-swap'));
    document.querySelectorAll('.spieler-button.selected').forEach(b => b.classList.remove('selected'));

    // Prevent swapping with self
    if (benchIndex === activeIndex) {
        // toast.info('Wechsel abgebrochen');
        return;
    }

    // Get players list based on team
    let playerList;
    if (team === 'myteam') {
        playerList = spielstand.roster;
    } else {
        playerList = spielstand.knownOpponents;
    }

    const benchPlayer = playerList[benchIndex];
    const activePlayer = playerList[activeIndex];

    if (!benchPlayer || !activePlayer) {
        // toast.error('Wechsel fehlgeschlagen');
        return;
    }

    // Swap lineup status
    const tempLineupSlot = benchPlayer.lineupSlot;
    benchPlayer.lineupSlot = activePlayer.lineupSlot;
    activePlayer.lineupSlot = tempLineupSlot;

    // Save and update UI
    speichereSpielstand();
    zeichneSpielerRaster();

    // Fully clear selection state so next click works immediately
    deselectPlayer();

    // toast.success(`${benchPlayer.name} ↔ ${activePlayer.name}`);
}

// Mobile Action Popup for mobile screens
function showMobileActionPopup(name, team, index, gegnerNummer, isOnBench) {
    // Remove existing popup if any
    const existingPopup = document.getElementById('mobileActionPopup');
    if (existingPopup) existingPopup.remove();

    const player = team === 'myteam' ? spielstand.roster[index] : null;
    const playerNumber = player?.number || gegnerNummer;
    const playerDisplay = name || (team === 'myteam' ? `#${playerNumber}` : `Gegner #${gegnerNummer}`);
    const isOpponent = team !== 'myteam';

    const popup = document.createElement('div');
    popup.id = 'mobileActionPopup';
    popup.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%);
        z-index: 9999;
        display: flex;
        flex-direction: column;
        padding: 16px;
        overflow-y: auto;
    `;

    const allowedBenchActions = ["2 Minuten", "Gelbe Karte", "Rote Karte", "Blaue Karte"];

    // All actions matching the dashboard
    const resultActions = [
        { name: 'Tor', class: 'btn-goal', color: '#16a34a' },
        { name: 'Gehalten', class: 'btn-save', color: '#65a30d' },
        { name: 'Fehlwurf', class: 'btn-post', color: '#dc2626' },
        { name: 'Block', class: 'btn-lost', color: '#7c3aed' }
    ];

    const gameActions = [
        { name: 'Foul', label: 'STÜRMERFOUL', color: '#475569' },
        { name: 'Ballverlust', label: 'BALLVERLUST', color: '#475569' },
        { name: '2min Provoziert', label: '2 MIN GEHOLT', color: '#0891b2' },
        { name: '7m Provoziert', label: '7M GEHOLT', color: '#0891b2' },
        { name: '1und1', label: '1v1 GEWONNEN', color: '#8b5cf6' },
        { name: '7m+2min', label: '7M + 2 MIN', color: '#0891b2' }
    ];

    const penaltyActions = [
        { name: '2 Minuten', label: '2 MIN', color: '#f59e0b' },
        { name: 'Gelbe Karte', label: 'GELB', color: '#eab308' },
        { name: 'Rote Karte', label: 'ROT', color: '#dc2626' },
        { name: 'Blaue Karte', label: 'BLAU', color: '#3b82f6' }
    ];

    const createButton = (action, width = '1fr') => {
        const disabled = isOnBench && !allowedBenchActions.includes(action.name);
        return `<button class="mobile-action-btn" data-action="${action.name}" 
            style="
                padding: 8px 2px; /* Very tight padding */
                font-size: 0.7rem; /* Smaller font */
                font-weight: 600;
                border-radius: 8px;
                border: none;
                background: ${action.color || '#475569'};
                color: white;
                cursor: pointer;
                transition: transform 0.1s, opacity 0.1s;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                white-space: normal; /* Allow text wrap */
                overflow-wrap: break-word; /* Standard property */
                word-wrap: break-word; /* Legacy support */
                hyphens: auto; /* Optional: hyphenation */
                line-height: 1.1;
                min-width: 0;
                width: 100%; /* Ensure it fills grid cell */
                ${disabled ? 'opacity: 0.25; pointer-events: none;' : ''}
            "
            ${disabled ? 'disabled' : ''}>${action.label || action.name.toUpperCase()}</button>`;
    };

    popup.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.1);">
            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="
                    width: 44px; height: 44px; 
                    background: ${isOpponent ? 'var(--team-opponent-color, #dc2626)' : 'var(--team-primary-color, #2563eb)'};
                    border-radius: 10px;
                    display: flex; align-items: center; justify-content: center;
                    font-weight: bold; font-size: 1.1rem; color: white;
                ">${playerNumber}</div>
                <div>
                    <div style="font-size: 1.1rem; font-weight: 600; color: white;">${name || 'Spieler'}</div>
                    <div style="font-size: 0.75rem; color: rgba(255,255,255,0.6);">${isOpponent ? 'Gegner' : 'Eigenes Team'}</div>
                </div>
            </div>
            <button id="closeMobilePopup" style="
                background: rgba(255,255,255,0.1);
                border: none;
                color: white;
                font-size: 1.5rem;
                width: 44px; height: 44px;
                border-radius: 12px;
                cursor: pointer;
                display: flex; align-items: center; justify-content: center;
            ">×</button>
        </div>

        <div style="flex: 1; display: flex; flex-direction: column; gap: 12px;">
            <!-- Result Section -->
            <div>
                <div style="font-size: 0.7rem; color: rgba(255,255,255,0.5); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px;">Ergebnis</div>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;"> <!-- Changed to 2 columns -->
                    ${resultActions.map(a => createButton(a)).join('')}
                </div>
            </div>

            <!-- Actions Section -->
            <div>
                <div style="font-size: 0.7rem; color: rgba(255,255,255,0.5); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px;">Aktionen</div>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
                    ${gameActions.map(a => createButton(a)).join('')}
                </div>
            </div>

            <!-- Penalties Section -->
            <div>
                <div style="font-size: 0.7rem; color: rgba(255,255,255,0.5); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px;">Strafen</div>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;"> <!-- Changed to 2 columns -->
                    ${penaltyActions.map(a => createButton(a)).join('')}
                </div>
            </div>
        </div>

        <button id="cancelMobileAction" style="
            margin-top: 16px;
            padding: 14px;
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            color: white;
            font-size: 0.9rem;
            font-weight: 500;
            border-radius: 10px;
            cursor: pointer;
        ">Abbrechen</button>
    `;

    document.body.appendChild(popup);

    // Close buttons
    const closePopup = () => {
        popup.remove();
        deselectPlayer();
    };
    document.getElementById('closeMobilePopup').onclick = closePopup;
    document.getElementById('cancelMobileAction').onclick = closePopup;

    // Action buttons
    popup.querySelectorAll('.mobile-action-btn').forEach(btn => {
        btn.onclick = () => {
            const action = btn.dataset.action;
            executeAction(action);
            popup.remove();
        };
    });
}

export function deselectPlayer() {
    // Reset state
    selectedPlayerState = { index: null, team: null, gegnerNummer: null, name: null };
    aktuellerSpielerIndex = null;
    istGegnerAktion = false;
    aktuelleGegnernummer = null;

    // Also clear pending bench swap state
    pendingBenchSwap = null;
    document.querySelectorAll('.pending-swap').forEach(b => b.classList.remove('pending-swap'));

    // Remove visual selection
    document.querySelectorAll('.spieler-button.selected').forEach(btn => btn.classList.remove('selected'));

    // Disable action dashboard
    const dashboard = document.getElementById('actionDashboard');
    const nameDisplay = document.getElementById('selectedPlayerName');

    if (dashboard) dashboard.classList.add('disabled');
    if (nameDisplay) nameDisplay.textContent = 'Wähle einen Spieler...';
}

export function executeAction(actionType) {
    if (!selectedPlayerState.team) {
        customAlert("Bitte wähle zuerst einen Spieler aus.");
        return;
    }

    // Reuse existing logAktion logic
    // Globals are already set in selectPlayer
    logAktion(actionType);

    // Optional: Deselect after action?
    // For now, keep selected for rapid fire (e.g. multiple stats) or just convenience.
    // If goal -> usually reset.
    // If yellow card -> reset.
    // Let's keep it selected.
}

export function switchGameTab(tab) {
    // Update Tab UI
    const tabHeim = document.getElementById('gameTabHeim');
    const tabGegner = document.getElementById('gameTabGegner');

    if (tab === 'heim') {
        tabHeim.classList.add('active');
        tabGegner.classList.remove('active');
    } else {
        tabHeim.classList.remove('active');
        tabGegner.classList.add('active');
    }

    zeichneSpielerRaster(tab);

    // Clear selection when switching tabs?
    // selectedPlayerState = { index: null, team: null, gegnerNummer: null, name: null };
    // document.getElementById('actionDashboard').classList.add('disabled');
    // document.getElementById('selectedPlayerName').textContent = "Wähle einen Spieler...";
}

// Replaces oeffneAktionsMenue
// export function oeffneAktionsMenue(index) { ... } -> Removed
// export function oeffneGegnerAktionsMenue(gegnernummer) { ... } -> Removed
// export function schliesseAktionsMenue() { ... } -> Updated below

export function schliesseAktionsMenue() {
    // schliesseAktionsMenueUI(); // No UI to close anymore
    // Maybe clear selection?
    // For compatibility with old calls, we can leave this empty or invoke deselect.
}

export function setAktuelleAktionTyp(typ) {
    aktuelleAktionTyp = typ;
}

export function logAktion(aktion, kommentar = null) {
    // Map button actions to standard internal names
    if (aktion === "Gehalten") aktion = "Parade";
    if (aktion === "Post Out") aktion = "Fehlwurf";

    // Prüfe, ob dies eine Gegner-Aktion ist
    if (istGegnerAktion && aktuelleGegnernummer) {
        handleGegnerAktion(aktion, kommentar);
        return;
    }

    // Behandle 7m-Aktion - zeige zuerst Ergebnis-Modal
    if (aktion === "7m") {
        const player = (spielstand.roster && aktuellerSpielerIndex !== null) ? spielstand.roster[aktuellerSpielerIndex] : null;
        if (player) {
            spielstand.temp7mPlayer = {
                index: aktuellerSpielerIndex,
                number: player.number,
                name: player.name,
                isOpponent: false
            };
            schliesseAktionsMenue();
            sevenMeterOutcomeModal.classList.remove('versteckt');
        }
        return;
    }



    const player = (spielstand.roster && aktuellerSpielerIndex !== null) ? spielstand.roster[aktuellerSpielerIndex] : null;
    if (!player) return;

    const aktuelleZeit = timerAnzeige ? timerAnzeige.textContent : "00:00";

    if (aktion === "Tor") {
        if (spielstand.settings.isAuswaertsspiel) {
            spielstand.score.gegner++;
        } else {
            spielstand.score.heim++;
        }
    }

    const aktuellerSpielstand = `${spielstand.score.heim}:${spielstand.score.gegner}`;
    updateScoreDisplay();

    if (aktion === "2 Minuten" || aktion === "Rote Karte" || aktion === "Blaue Karte") {
        applySuspensionToPlayer(player, 'myteam', spielstand.roster.indexOf(player), aktion);
    }

    // Log-Eintrag
    spielstand.gameLog.unshift({
        time: aktuelleZeit,
        playerId: player.number,
        playerName: player.name,
        action: aktion,
        score: aktuellerSpielstand,
        isOpponent: false,
        timestamp: Date.now()
    });

    speichereSpielstand();
    updateProtokollAnzeige();
    schliesseAktionsMenue();

    deselectPlayer();

    // Check for Modals (Shot Recording)
    const isShotAction = ["Tor", "Fehlwurf", "Parade", "Pfosten", "Latte"].includes(aktion);
    const isBlockAction = aktion === "Block";

    if (isShotAction || isBlockAction) {
        // Prepare context for attribution if needed
        spielstand.tempSourceAction = aktion;
        spielstand.tempSourcePlayer = player;

        const isAuswaerts = spielstand.settings.isAuswaertsspiel;
        const showPos = isAuswaerts ? spielstand.settings.showWurfpositionGegner : spielstand.settings.showWurfpositionHeim;

        if (showPos) {
            wurfpositionModal.classList.remove('versteckt');
        } else {
            const showBild = isAuswaerts ? spielstand.settings.showWurfbildGegner : spielstand.settings.showWurfbildHeim;
            if (showBild) {
                oeffneWurfbildModal('standard');
            } else if (isBlockAction) {
                // If no more shot modals, open attribution for block
                oeffneAttributedPlayerModal(istGegnerAktion ? 'myteam' : 'opponent', "Blocker auswählen", "Wer hat den Wurf geblockt?");
            }
        }
    } else if (aktion === "2min Provoziert" || aktion === "7m Provoziert" || aktion === "7m+2min" || aktion === "1und1") {
        spielstand.tempSourceAction = aktion;
        spielstand.tempSourcePlayer = player;
        const targetTeam = istGegnerAktion ? 'myteam' : 'opponent';
        let title = "Gegner auswählen";
        if (aktion === "2min Provoziert") title = "Wer hat die 2min erhalten?";
        else if (aktion === "7m Provoziert") title = "Wer hat den 7m verursacht?";
        else if (aktion === "7m+2min") title = "Wer hat 7m + 2min verursacht?";
        else if (aktion === "1und1") title = "Wer hat das 1v1 verloren?";

        oeffneAttributedPlayerModal(targetTeam, title, "Beteiligten Spieler auswählen", true, false); // onlyActive=true, showGK=false
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
        // Opponent scores on opposite side from us
        if (spielstand.settings.isAuswaertsspiel) {
            spielstand.score.heim++;  // Opponent is in teamNameHeim after swap
        } else {
            spielstand.score.gegner++;  // Opponent is in teamNameGegner normally
        }
    } else if (aktion === "7m") {
        // Zeige 7m-Ergebnis-Modal für Gegner
        spielstand.tempGegnerNummer = gegnernummer;
        spielstand.temp7mPlayer = { isOpponent: true };
        schliesseAktionsMenue();
        sevenMeterOutcomeModal.classList.remove('versteckt');
        return; // Früher Abbruch - handle7mOutcome übernimmt
    } else if (aktion === "2 Minuten") {
        mappedAction = "Gegner 2 min";
        const isAway = spielstand.settings.isAuswaertsspiel;
        const playerList = isAway ? spielstand.roster : spielstand.knownOpponents;
        const teamKey = isAway ? 'myteam' : 'opponent';
        const actualIndex = isAway ? spielstand.roster.findIndex(p => p.number == gegnernummer) : spielstand.knownOpponents.findIndex(p => p.number == gegnernummer);
        const player = actualIndex !== -1 ? playerList[actualIndex] : { number: gegnernummer, isGoalkeeper: false, lineupSlot: 5 }; // Fallback

        applySuspensionToPlayer(player, teamKey, actualIndex, "Gegner 2 min");
    } else if (aktion === "Gelbe Karte") {
        mappedAction = "Gegner Gelb";
    } else if (aktion === "Rote Karte") {
        mappedAction = "Gegner Rot";
        const isAway = spielstand.settings.isAuswaertsspiel;
        const playerList = isAway ? spielstand.roster : spielstand.knownOpponents;
        const teamKey = isAway ? 'myteam' : 'opponent';
        const actualIndex = isAway ? spielstand.roster.findIndex(p => p.number == gegnernummer) : spielstand.knownOpponents.findIndex(p => p.number == gegnernummer);
        const player = actualIndex !== -1 ? playerList[actualIndex] : { number: gegnernummer, isGoalkeeper: false, lineupSlot: 5 }; // Fallback

        applySuspensionToPlayer(player, teamKey, actualIndex, "Gegner Rot");
    } else if (aktion === "Parade") {
        mappedAction = "Gegner Parade";
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
        score: aktuellerSpielstand,
        gegnerNummer: gegnernummer,
        wurfbild: null,
        timestamp: Date.now()
    });

    updateProtokollAnzeige();
    speichereSpielstand();
    schliesseAktionsMenue();

    deselectPlayer();

    // Zeige Modals basierend auf Einstellungen (Wurfposition zuerst, dann Wurfbild)
    // Nur für Tor, Fehlwurf und Parade
    const isShotAction = ["Gegner Tor", "Gegner Wurf Vorbei", "Gegner Parade", "Gegner Fehlwurf"].includes(mappedAction);
    const isBlockAction = mappedAction === "Gegner Block";

    if (isShotAction || isBlockAction) {
        // Prepare context for attribution if needed
        spielstand.tempSourceAction = mappedAction === "Gegner Block" ? "Block" : mappedAction;
        spielstand.tempSourcePlayer = { number: gegnernummer, name: "Gegner", isOpponent: true };

        // Determine effective settings based on side
        const isAuswaerts = spielstand.settings.isAuswaertsspiel;
        // Opponent is Heim if we are Auswärts, else Opponent is Gast
        const oppIsHeim = isAuswaerts;

        const showPos = oppIsHeim ? spielstand.settings.showWurfpositionHeim : spielstand.settings.showWurfpositionGegner;
        const showWurfbild = oppIsHeim ? spielstand.settings.showWurfbildHeim : spielstand.settings.showWurfbildGegner;

        if (showPos) {
            spielstand.tempGegnerNummer = gegnernummer;
            wurfpositionModal.classList.remove('versteckt');
        } else {
            if (showWurfbild && mappedAction !== "Gegner Block") {
                spielstand.tempGegnerNummer = gegnernummer;
                oeffneWurfbildModal('gegner');
            } else if (isBlockAction) {
                oeffneAttributedPlayerModal('myteam', "Blocker auswählen", "Heim-Spieler der geblockt hat");
            }
        }
    } else if (mappedAction === "Gegner 2min Provoziert" || mappedAction === "Gegner 7m Provoziert" || mappedAction === "Gegner 7m+2min") {
        spielstand.tempSourceAction = mappedAction.replace("Gegner ", "");
        spielstand.tempSourcePlayer = { number: gegnernummer, name: "Gegner", isOpponent: true };
        oeffneAttributedPlayerModal('myteam', "Wer war beteiligt?", "Heim-Spieler auswählen", true, false); // onlyActive=true, showGK=false
    } else if (mappedAction === "Gegner 1und1") {
        spielstand.tempSourceAction = "1v1";
        spielstand.tempSourcePlayer = { number: gegnernummer, name: "Gegner", isOpponent: true };
        oeffneAttributedPlayerModal('myteam', "1 gegen 1 verloren", "Wer hat das Duell verloren?", true, false);
    }
}

export function logGlobalAktion(aktion, kommentar = null, gegnerNummer = null) {
    const aktuelleZeit = timerAnzeige.textContent;

    if (aktion === "Gegner 7m") {
        const isAuswaerts = spielstand.settings.isAuswaertsspiel;
        const oppIsHeim = isAuswaerts;
        const showWurfbild = oppIsHeim ? spielstand.settings.showWurfbildHeim : spielstand.settings.showWurfbildGegner;

        if (showWurfbild) {
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
    updateProtokollAnzeige();
    // updateTorTracker();
    speichereSpielstand();
}

export function logScoreKorrektur(team, change) {
    const aktuelleZeit = timerAnzeige.textContent;

    if (team === 'heim') {
        // Manual score adjustment for our team
        if (spielstand.settings.isAuswaertsspiel) {
            spielstand.score.gegner += change;
            if (spielstand.score.gegner < 0) spielstand.score.gegner = 0;
        } else {
            spielstand.score.heim += change;
            if (spielstand.score.heim < 0) spielstand.score.heim = 0;
        }
    } else { // team === 'gegner'
        // Manual score adjustment for opponent team
        if (spielstand.settings.isAuswaertsspiel) {
            spielstand.score.heim += change;
            if (spielstand.score.heim < 0) spielstand.score.heim = 0;
        } else {
            spielstand.score.gegner += change;
            if (spielstand.score.gegner < 0) spielstand.score.gegner = 0;
        }
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
        action: aktion,
        kommentar: null,
        spielstand: aktuellerSpielstand,
        videoTime: getVideoTimeSeconds() // NEW
    });

    updateProtokollAnzeige();
    updateProtokollAnzeige();
    // updateTorTracker();
    speichereSpielstand();
}

export function oeffneGegnerNummerModal(type) {
    currentGegnerActionType = type;
    uiOeffneGegnerNummerModal(type);
}

export function speichereGegnerNummer(nummer, name = '', isGoalkeeper = false) {
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
            wurfbild: null,
            videoTime: getVideoTimeSeconds() // NEW
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
    else if (currentGegnerActionType === '1v1') {
        // Log Own Player "1und1" (Won)
        const ourPlayer = spielstand.temp1v1Player;
        if (ourPlayer) {
            spielstand.gameLog.unshift({
                time: aktuelleZeit,
                playerId: ourPlayer.number,
                playerName: ourPlayer.name,
                action: "1und1",
                score: `${spielstand.score.heim}:${spielstand.score.gegner}`,
                kommentar: `(vs. Nr. ${nummer})`,
                isOpponent: false,
                kommentar: `(vs. Nr. ${nummer})`,
                isOpponent: false,
                timestamp: Date.now(),
                videoTime: getVideoTimeSeconds() // NEW
            });
        }

        // Log Opponent "Gegner 1v1 Verloren"
        spielstand.gameLog.unshift({
            time: aktuelleZeit,
            playerId: null,
            playerName: "Gegner",
            action: "Gegner 1v1 Verloren",
            score: `${spielstand.score.heim}:${spielstand.score.gegner}`,
            kommentar: `(vs. ${ourPlayer ? ourPlayer.name : ''})`,
            gegnerNummer: nummer,
            isOpponent: true,
            isOpponent: true,
            timestamp: Date.now() - 1, // slight offset to appear after
            videoTime: getVideoTimeSeconds() // NEW
        });

        updateProtokollAnzeige();
        gegnerNummerModal.classList.add('versteckt');
        deselectPlayer();
    }
    else {
        gegnerNummerModal.classList.add('versteckt');
    }

    // Füge Gegner als Objekt hinzu, falls noch nicht vorhanden
    if (nummer && !spielstand.knownOpponents.find(opp => opp.number === nummer)) {
        spielstand.knownOpponents.push({ number: nummer, name: name || '', isGoalkeeper: isGoalkeeper });
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
        // Gegner-7m - opponent always scores on the opposite side
        nummer = spielstand.tempGegnerNummer || aktuelleGegnernummer;
        kommentar = nummer ? `(Nr. ${nummer})` : null;

        if (outcome === 'Tor') {
            // Opponent scores on their side (opposite of ours)
            if (spielstand.settings.isAuswaertsspiel) {
                spielstand.score.heim++;
            } else {
                spielstand.score.gegner++;
            }
            aktion = "Gegner 7m Tor";
        } else if (outcome === 'Gehalten') {
            aktion = "Gegner 7m Gehalten";
        } else {
            aktion = "Gegner 7m Verworfen";
        }
    } else {
        // Our player's 7m
        playerId = temp7mPlayer.number;
        playerName = temp7mPlayer.name;

        if (outcome === 'Tor') {
            // Our team scores based on which side we're on
            if (spielstand.settings.isAuswaertsspiel) {
                spielstand.score.gegner++;
            } else {
                spielstand.score.heim++;
            }
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
        wurfposition: { x: 50, y: 29.0 },
        wurfbild: null
    });

    updateProtokollAnzeige();
    updateProtokollAnzeige();
    // updateTorTracker(); // Removed feature
    speichereSpielstand();

    // Zeige Wurfbild-Modal, falls aktiviert
    const isAuswaerts = spielstand.settings.isAuswaertsspiel;
    // Logic: 
    // If Opponent: Side is Heim (if swapped) or Gast (if normal)
    // If MyTeam: Side is Gast (if swapped) or Heim (if normal)

    let sideIsHeim = false;
    if (isOpponent) {
        sideIsHeim = isAuswaerts; // Opponent is Heim if we are Auswärts
    } else {
        sideIsHeim = !isAuswaerts; // My Team is Heim if NOT Auswärts
    }

    const showWurfbild = sideIsHeim ? spielstand.settings.showWurfbildHeim : spielstand.settings.showWurfbildGegner;

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
        updateProtokollAnzeige();
        // updateTorTracker();
        speichereSpielstand();
    }
}


export async function starteNeuesSpiel() {
    const confirmed = await customConfirm("Bist du sicher? Das löscht das gesamte Spielprotokoll, aber dein Team bleibt gespeichert.", "Neues Spiel?");
    if (confirmed) {
        stoppTimer(); // Stop timer first to prevent glitches

        spielstand.gameLog = [];
        spielstand.score = { heim: 0, gegner: 0 };
        spielstand.activeSuspensions = [];
        spielstand.knownOpponents = [];

        // Reset perspective if we were away
        if (spielstand.settings.isAuswaertsspiel) {
            // Swap names and colors back so Our Team is Heim
            const tempName = spielstand.settings.teamNameHeim;
            spielstand.settings.teamNameHeim = spielstand.settings.teamNameGegner;
            spielstand.settings.teamNameGegner = tempName;

            const tempColor = spielstand.settings.teamColor;
            spielstand.settings.teamColor = spielstand.settings.teamColorGegner;
            spielstand.settings.teamColorGegner = tempColor;

            spielstand.settings.isAuswaertsspiel = false;
        }

        // Reset opponent name to default if needed
        spielstand.settings.teamNameGegner = "Gegner";

        // Sync Inputs in Roster View
        const rosterTeamNameGegner = document.getElementById('rosterTeamNameGegner');
        if (rosterTeamNameGegner) rosterTeamNameGegner.value = "Gegner";

        spielstand.timer = {
            gamePhase: 1,
            istPausiert: true,
            segmentStartZeit: 0,
            verstricheneSekundenBisher: 0,
            videoStartTime: null // Reset Video Timer
        };

        // Reset Mode Selection to allow choosing again
        spielstand.modeSelected = false;

        speichereSpielstand();

        // Refresh all UI elements
        applyTheme();
        updateScoreDisplay();
        zeichneRosterListe(false); // Reset roster view to Heim (our team)

        // Reset UI without reload to stay on Game View
        updateGameControls();
        zeichneSpielerRaster();
        updateProtokollAnzeige();
        updateProtokollAnzeige();
        // updateTorTracker();
        updateSuspensionDisplay();

        applyGameMode(); // Apply default style (or hide if needed by listener)

        // Signal Reset to Main Controller
        document.dispatchEvent(new Event('gameStateReset'));

        // Ensure inputs are reset if needed (optional)
        // location.reload(); // Removed to stay on page
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

export function toggleBenchStatus(index, team, gegnerNummer) {
    if (team === 'myteam') {
        const player = spielstand.roster[index];
        if (player) {
            player.isOnBench = !player.isOnBench;
            speichereSpielstand();

            // Refresh view
            const activeTab = document.querySelector('.game-tab.active')?.dataset.tab || 'heim';
            zeichneSpielerRaster(activeTab);
        }
    } else if (team === 'opponent') {
        const oppIndex = spielstand.knownOpponents.findIndex(p => p.number == gegnerNummer);
        if (oppIndex !== -1) {
            const player = spielstand.knownOpponents[oppIndex];
            player.isOnBench = !player.isOnBench;
            speichereSpielstand();

            const activeTab = document.querySelector('.game-tab.active')?.dataset.tab || 'heim';
            zeichneSpielerRaster(activeTab);
        }
    }
}

// === SUBSTITUTION SYSTEM ===
// State for multi-click substitution flow
let substitutionState = {
    sourceSlot: null,      // {slotType, slotIndex, teamKey, playerIndex, isEmpty}
    active: false
};

export function getSubstitutionState() {
    return substitutionState;
}

export function clearSubstitutionState() {
    substitutionState = { sourceSlot: null, active: false };
    // Remove visual indicators
    document.querySelectorAll('.lineup-slot.sub-source').forEach(el => el.classList.remove('sub-source'));
    document.querySelectorAll('.bench-player.sub-source').forEach(el => el.classList.remove('sub-source'));
}



// Helper to count active "entities" on field (Players + Suspensions)
// Max allowed is 7
export function getActivePlayerCount(teamKey) {
    const players = teamKey === 'myteam' ? (spielstand.roster || []) : (spielstand.knownOpponents || []);
    // Count players with assigned slots
    const lineupCount = players.filter(p => p.lineupSlot !== null && p.lineupSlot !== undefined).length;

    // Count active suspensions for this team
    const suspensionCount = (spielstand.activeSuspensions || []).filter(s => s.teamKey === teamKey).length;

    return lineupCount + suspensionCount;
}

export function handleLineupSlotClick(slotType, slotIndex, teamKey, playerIndex, isEmpty) {
    const isAway = spielstand.settings.isAuswaertsspiel;

    let playerList;
    if (teamKey === 'myteam') {
        playerList = spielstand.roster;
    } else {
        playerList = spielstand.knownOpponents;
    }

    // Handle Substitution Logic
    if (substitutionState.active) {
        const source = substitutionState.sourceSlot;

        // Second click on same slot = cancel
        if (source.slotType === slotType &&
            source.slotIndex === slotIndex &&
            source.teamKey === teamKey) {
            clearSubstitutionState();
            // Do not return, allow selection of the player in the slot
        } else if (source.teamKey === teamKey) {
            // Same team - perform substitution
            // Source was a bench player, target is a lineup slot
            if (source.slotType === 'bench') {
                const benchPlayer = playerList[source.playerIndex];

                // Get the button element (target) for animation
                const targetSelector = `[data-slot-type="${slotType}"][data-slot-index="${slotIndex}"][data-team-key="${teamKey}"]`;
                const targetBtn = document.querySelector(targetSelector);

                if (isEmpty) {
                    // Bench player -> empty slot = assign to specific slot

                    // CHECK 7-PLAYER LIMIT
                    if (getActivePlayerCount(teamKey) >= 7) {
                        customAlert("Maximal 7 Personen (Spieler + Zeitstrafen) auf dem Feld erlaubt. Bitte zuerst einen Spieler vom Feld nehmen.");
                        clearSubstitutionState();
                        return;
                    }

                    startButtonAnimation(targetBtn);
                    setTimeout(() => {
                        benchPlayer.lineupSlot = slotType === 'gk' ? 'gk' : slotIndex;
                        speichereSpielstand();
                        clearSubstitutionState();
                        deselectPlayer();
                        zeichneSpielerRaster();
                    }, 50);

                } else {
                    // Bench player -> filled slot = swap
                    startButtonAnimation(targetBtn);
                    setTimeout(() => {
                        const lineupPlayer = playerList[playerIndex];
                        benchPlayer.lineupSlot = slotType === 'gk' ? 'gk' : slotIndex;
                        lineupPlayer.lineupSlot = null; // Send to bench
                        speichereSpielstand();
                        clearSubstitutionState();
                        deselectPlayer();
                        zeichneSpielerRaster();
                    }, 50);
                }
                return;
            } else {
                // Two lineup slots clicked (same team) - cancel substitution
                clearSubstitutionState();
            }
        } else {
            // Team mismatch - cancel substitution
            clearSubstitutionState();
        }
    }

    // NEW: Handle Mobile Substitution Flow (pendingBenchSwap -> empty slot)
    if (window.innerWidth <= 768 && pendingBenchSwap && pendingBenchSwap.team === teamKey) {
        if (isEmpty) {
            const benchPlayer = playerList[pendingBenchSwap.index];

            // CHECK 7-PLAYER LIMIT
            if (getActivePlayerCount(teamKey) >= 7) {
                customAlert("Maximal 7 Personen (Spieler + Zeitstrafen) auf dem Feld erlaubt. Bitte zuerst einen Spieler vom Feld nehmen.");
                pendingBenchSwap = null;
                document.querySelectorAll('.pending-swap').forEach(b => b.classList.remove('pending-swap'));
                return;
            }

            const targetSelector = `[data-slot-type="${slotType}"][data-slot-index="${slotIndex}"][data-team-key="${teamKey}"]`;
            const targetBtn = document.querySelector(targetSelector);
            startButtonAnimation(targetBtn);

            setTimeout(() => {
                benchPlayer.lineupSlot = slotType === 'gk' ? 'gk' : slotIndex;

                speichereSpielstand();
                pendingBenchSwap = null;
                document.querySelectorAll('.pending-swap').forEach(b => b.classList.remove('pending-swap'));
                deselectPlayer();
                zeichneSpielerRaster();
            }, 50);
            return;
        }
    }

    // First click logic (or after cancellation/team switch/substitution)
    // Select player for actions
    if (!isEmpty && playerIndex !== null) {
        // Filled slot - SELECT PLAYER
        const player = playerList[playerIndex];
        if (player) {
            // Toggle Deselect if already selected
            if (selectedPlayerState.team === teamKey && selectedPlayerState.index === playerIndex) {
                deselectPlayer();
                return;
            }

            const gegnerNummer = teamKey === 'opponent' ? player.number : null;
            selectPlayer(playerIndex, teamKey, gegnerNummer, player.name || '', false); // isOnBench = false
        }
    } else {
        // If the slot is empty, deselect any currently selected player
        deselectPlayer();
    }

    // Enter substitution mode (source) if not already active or if it was cancelled
    // BUT SKIP ON MOBILE - allow only selectPlayer flow
    if (window.innerWidth >= 770) {
        if (!substitutionState.active || (substitutionState.sourceSlot.slotType !== slotType || substitutionState.sourceSlot.slotIndex !== slotIndex || substitutionState.sourceSlot.teamKey !== teamKey)) {
            substitutionState = {
                sourceSlot: { slotType, slotIndex, teamKey, playerIndex, isEmpty },
                active: true
            };
        }
    }

    // Visual feedback for substitution
    const selector = `[data-slot-type="${slotType}"][data-slot-index="${slotIndex}"][data-team-key="${teamKey}"]`;
    const btn = document.querySelector(selector);
    if (btn) btn.classList.add('sub-source');
}

export function handleBenchPlayerClick(playerIndex, teamKey, gegnerNummer) {
    const isAway = spielstand.settings.isAuswaertsspiel;
    const isMobile = window.innerWidth < 770;

    let playerList;
    if (teamKey === 'myteam') {
        playerList = spielstand.roster;
    } else {
        playerList = spielstand.knownOpponents;
    }

    const actualIndex = teamKey === 'myteam' ? playerIndex : playerList.findIndex(p => p.number == gegnerNummer);

    // On mobile, skip substitutionState logic entirely - use bench-first flow only
    if (isMobile) {
        const player = playerList[actualIndex];
        if (player) {
            selectPlayer(actualIndex, teamKey, gegnerNummer, player.name || '', true); // isOnBench = true
        }
        return;
    }

    if (substitutionState.active) {
        const source = substitutionState.sourceSlot;

        // Mismatch team? Cancel sub flow
        if (source.teamKey !== teamKey) {
            clearSubstitutionState();
        } else {
            // Same team - perform sub?
            // Only if source was a lineup slot
            if (source.slotType !== 'bench') {
                const benchPlayer = playerList[actualIndex];

                // Get the source button for animation (lineup slot)
                const sourceSelector = `[data-slot-type="${source.slotType}"][data-slot-index="${source.slotIndex}"][data-team-key="${source.teamKey}"]`;
                const sourceBtn = document.querySelector(sourceSelector);

                // Note: Moving Lineup -> Bench is a SWAP or REMOVAL, but standard logic here is just "Bench player takes slot".
                // Wait, if source is Lineup, we are putting BenchPlayer logic?
                // NO, handleBenchPlayerClick is when we click a BENCH player.
                // If we are in sub mode from a LINEUP slot, then clicking BENCH player means:
                // "Put this Bench Player into the Source Lineup Slot" (Sub IN)

                // So Bench Player goes to Source Slot.
                // Player currently in Source Slot (if any) goes to Bench (implicitly, or lineupSlot=null).

                // Check limit? No, because we are effectively swapping out the active player (or filling empty if source was empty Lineup?).
                // If source was empty lineup slot, we are ADDING a player.

                if (source.isEmpty) {
                    // CHECK 7-PLAYER LIMIT
                    if (getActivePlayerCount(teamKey) >= 7) {
                        customAlert("Maximal 7 Personen (Spieler + Zeitstrafen) auf dem Feld erlaubt. Bitte zuerst einen Spieler vom Feld nehmen.");
                        clearSubstitutionState();
                        return;
                    }
                }

                startButtonAnimation(sourceBtn); // Animate the lineup slot

                setTimeout(() => {
                    if (source.isEmpty) {
                        benchPlayer.lineupSlot = source.slotType === 'gk' ? 'gk' : source.slotIndex;
                    } else {
                        // Swap
                        const lineupPlayer = playerList[source.playerIndex];
                        benchPlayer.lineupSlot = source.slotType === 'gk' ? 'gk' : source.slotIndex;
                        lineupPlayer.lineupSlot = null;
                    }
                    speichereSpielstand();
                    clearSubstitutionState();
                    deselectPlayer();
                    zeichneSpielerRaster();
                }, 50);

                return;
            } else {
                // Clicking another bench player of same team? Just switch selection
                clearSubstitutionState();
            }
        }
    }

    // First click on bench player (or after cancellation/switch/substitution)
    // Select for actions
    const player = playerList[actualIndex];
    if (player) {
        // Toggle Deselect
        if (selectedPlayerState.team === teamKey && selectedPlayerState.index === actualIndex) {
            deselectPlayer();
            // Also ensure sub state is cleared if we deselect?
            // The logic above already cleared sub state if it was the same player.
            // But if sub state was NOT active for some reason (rare), we still want to return.
            return;
        }

        selectPlayer(actualIndex, teamKey, gegnerNummer, player.name || '', true); // isOnBench = true
    } else {
        deselectPlayer();
    }

    // Also enter substitution mode (bench player as source)
    // If it's the same bench player clicked again, cancel (toggle off)
    if (substitutionState.active && substitutionState.sourceSlot.slotType === 'bench' && substitutionState.sourceSlot.playerIndex === actualIndex && substitutionState.sourceSlot.teamKey === teamKey) {
        clearSubstitutionState();
    } else {
        // Start new substitution state (or update existing if switching players)
        substitutionState = {
            sourceSlot: { slotType: 'bench', slotIndex: actualIndex, teamKey, playerIndex: actualIndex, isEmpty: false },
            active: true
        };

        // Visual feedback
        const selector = teamKey === 'myteam'
            ? `.bench-player[data-index="${actualIndex}"][data-team-key="${teamKey}"]`
            : `.bench-player[data-gegner-nummer="${gegnerNummer}"][data-team-key="${teamKey}"]`;
        const btn = document.querySelector(selector);
        if (btn) btn.classList.add('sub-source');
    }
}


// === Action Chaining: Attributed Player Modal ===

export function oeffneAttributedPlayerModal(teamKey, title, subtitle, onlyActive = true, showGK = true) {
    const modal = document.getElementById('attributedPlayerModal');
    const listContainer = document.getElementById('attributedPlayerList');
    const titleEl = document.getElementById('attributedPlayerTitle');
    const subtitleEl = document.getElementById('attributedPlayerSubtitle');

    if (!modal || !listContainer) return;

    titleEl.textContent = title;
    subtitleEl.textContent = subtitle;
    listContainer.innerHTML = '';

    const playersAll = teamKey === 'myteam' ? (spielstand.roster || []) : (spielstand.knownOpponents || []);

    // Filter for active players only if requested AND not in simple mode
    // In simple mode, all players are considered "active" for selection purposes.
    const ignoreActiveFilter = spielstand.gameMode === 'simple';

    let players = (onlyActive && !ignoreActiveFilter)
        ? playersAll.filter(p => p.lineupSlot !== null && p.lineupSlot !== undefined)
        : playersAll;

    if (!showGK) {
        players = players.filter(p => !p.isGoalkeeper);
    }

    players.forEach((player, index) => {
        // Find actual index in source team for the click handler
        const actualIndex = playersAll.indexOf(player);
        const btn = document.createElement('button');
        btn.className = 'spieler-button action-btn';
        btn.innerHTML = `
            <div class="spieler-nummer-display">${player.number}</div>
            <span class="spieler-name-display">${player.name || ''}</span>
        `;

        // Use identity colors
        const isAway = spielstand.settings.isAuswaertsspiel;
        const colorHeim = spielstand.settings.teamColor || '#dc3545';
        const colorGegner = spielstand.settings.teamColorGegner || '#2563eb';

        const ourColor = isAway ? colorGegner : colorHeim;
        const oppColor = isAway ? colorHeim : colorGegner;

        const getContrast = (hex) => {
            if (!hex) return '#ffffff';
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
            return (yiq >= 128) ? '#000000' : '#ffffff';
        };

        const identityColor = teamKey === 'myteam' ? ourColor : oppColor;
        const textColor = getContrast(identityColor);

        btn.style.backgroundColor = identityColor;
        btn.style.color = textColor;

        btn.onclick = () => handleAttributedPlayerClick(player, teamKey, actualIndex);
        listContainer.appendChild(btn);
    });

    modal.classList.remove('versteckt');
}

function handleAttributedPlayerClick(attrPlayer, teamKey, playerIndex) {
    const modal = document.getElementById('attributedPlayerModal');
    modal.classList.add('versteckt');

    const sourceAction = spielstand.tempSourceAction;
    const sourcePlayer = spielstand.tempSourcePlayer;
    if (!sourceAction || !sourcePlayer) return;

    // Is this the first or second step of the chain?
    const isShooterSelection = (sourceAction === "7m Provoziert_SHOOTER" || sourceAction === "7m+2min_SHOOTER");

    if (isShooterSelection) {
        // Step 2: Set the shooter and open outcome modal
        spielstand.temp7mPlayer = attrPlayer;
        if (teamKey === 'opponent') {
            spielstand.temp7mPlayer.isOpponent = true;
            spielstand.tempGegnerNummer = attrPlayer.number;
        } else {
            spielstand.tempGegnerNummer = null;
        }

        // Clear temp shooter action indicator
        spielstand.tempSourceAction = sourceAction.replace("_SHOOTER", "");

        const outcomeModal = document.getElementById('sevenMeterOutcomeModal');
        if (outcomeModal) outcomeModal.classList.remove('versteckt');
        return;
    }

    // Step 1: Attribute the "culprit" (opponent or participant)
    let logMessage = '';
    let shouldChainShooter = false;

    if (sourceAction === "Block") {
        logMessage = `Wurf geblockt von #${attrPlayer.number}`;
    } else if (sourceAction === "2min Provoziert") {
        logMessage = `2min provoziert gegen #${attrPlayer.number}`;
        // Assumes target is opponent if provoke was by myteam, or vice versa? 
        // Wait, handleAttributedPlayerClick teamKey param is the team OF THE ATTRIBUTED PLAYER.
        // So checking action name is enough.
        applySuspensionToPlayer(attrPlayer, teamKey, playerIndex, "2 Minuten"); // Treat as standard 2 min
    } else if (sourceAction === "7m Provoziert") {
        logMessage = `7m provoziert gegen #${attrPlayer.number}`;
        shouldChainShooter = true;
    } else if (sourceAction === "7m+2min") {
        logMessage = `7m + 2min provoziert gegen #${attrPlayer.number}`;
        applySuspensionToPlayer(attrPlayer, teamKey, playerIndex, "2 Minuten");
        shouldChainShooter = true;
    } else if (sourceAction === "1und1" || sourceAction === "1v1") {
        logMessage = `1v1 gewonnen gegen #${attrPlayer.number}`;
    }

    // Update the last log entry or create a sub-entry
    if (spielstand.gameLog.length > 0) {
        const entry = spielstand.gameLog[0];
        entry.kommentar = logMessage;
        entry.attributedPlayer = { number: attrPlayer.number, name: attrPlayer.name, teamKey };
    }

    updateProtokollAnzeige();
    speichereSpielstand();

    // Trigger step 2 if needed (only for our team's benefit)
    if (shouldChainShooter) {
        spielstand.tempSourceAction = sourceAction + "_SHOOTER";
        if (!sourcePlayer.isOpponent) {
            oeffneAttributedPlayerModal('myteam', "7m Schütze auswählen", "Wer wirft den 7m?", false); // false = show all players
        } else {
            oeffneAttributedPlayerModal('opponent', "7m Schütze (Gegner)", "Wer wirft den 7m?", false);
        }
    } else {
        // Clear temp
        spielstand.tempSourceAction = null;
        spielstand.tempSourcePlayer = null;
    }
}

function applySuspensionToPlayer(player, teamKey, playerIndex, actionType) {
    // Save field slot info before sending to bench
    let targetSlotType = player.isGoalkeeper ? 'field' : 'field'; // Standard is field
    let targetSlotIndex = player.lineupSlot;

    // --- NEW: Disqualification Logic ---
    let shouldDisqualify = false;
    let isAutoRed = false;

    if (actionType === "Rote Karte" || actionType === "Blaue Karte" || actionType === "Gegner Rot") {
        shouldDisqualify = true;
    } else if (actionType === "2 Minuten" || actionType === "Gegner 2 min") {
        // Count previous 2-minute suspensions for this player
        // Filter by playerId (number) and action type (or action starting with...)
        const twoMinCount = spielstand.gameLog.filter(e => {
            if (e.playerId) return e.playerId === player.number && e.action === "2 Minuten";
            if (e.gegnerNummer) return e.gegnerNummer === player.number && e.action === "Gegner 2 min";
            return false;
        }).length;

        // If this is the 3rd (current one not in log yet, so count == 2), disqualify
        if (twoMinCount >= 2) {
            shouldDisqualify = true;
            isAutoRed = true;
        }
    }

    if (shouldDisqualify) {
        player.disqualified = true;
        if (isAutoRed) {
            // Inject automatic Red Card log
            const isOpponent = teamKey === 'opponent';
            const logActionName = isOpponent ? "Gegner Rot" : "Rote Karte";
            toast.error("3. Zeitstrafe -> Automatisch Rot!", (player.name || (isOpponent ? "Gegner" : "Spieler")) + " #" + player.number);

            // We need to add this to the log, but logAktion might act weird if we recurse. 
            // Just push to log directly since it's a consequence.
            spielstand.gameLog.unshift({
                time: timerAnzeige.textContent,
                playerId: isOpponent ? null : player.number,
                gegnerNummer: isOpponent ? player.number : null,
                playerName: player.name || (isOpponent ? "Gegner" : ""),
                action: logActionName,
                score: `${spielstand.score.heim}:${spielstand.score.gegner}`,
                kommentar: "Automatisch (3x 2min)",
                kommentar: "Automatisch (3x 2min)",
                timestamp: Date.now() + 1, // Ensure distinct timestamp
                videoTime: getVideoTimeSeconds() // NEW
            });
        }
    }
    // -----------------------------------

    // Special logic for Goalkeepers: Don't block the GK slot, block a field slot instead
    if (player.isGoalkeeper) {
        const players = teamKey === 'myteam' ? spielstand.roster : spielstand.knownOpponents;
        const activeSuspensions = (spielstand.activeSuspensions || []).filter(s => s.teamKey === teamKey);

        // 1. Try to find a slot that is NEITHER occupied NOR suspended
        let bestSlot = -1;
        for (let i = 0; i < 6; i++) {
            const isOccupied = players.some(p => p.lineupSlot === i);
            const isSuspended = activeSuspensions.some(s => s.slotType === 'field' && s.slotIndex === i);
            if (!isOccupied && !isSuspended) {
                bestSlot = i;
                break;
            }
        }

        // 2. If no "perfect" slot, try to find a slot that is NOT suspended (but occupied)
        if (bestSlot === -1) {
            for (let i = 0; i < 6; i++) {
                const isSuspended = activeSuspensions.some(s => s.slotType === 'field' && s.slotIndex === i);
                if (!isSuspended) {
                    bestSlot = i;
                    // Move the player currently in this slot to the bench
                    const playerToBench = players.find(p => p.lineupSlot === i);
                    if (playerToBench) playerToBench.lineupSlot = null;
                    break;
                }
            }
        }

        // 3. Fallback: if somehow all 6 slots are suspended, just use slot 5
        targetSlotIndex = bestSlot !== -1 ? bestSlot : 5;
        targetSlotType = 'field';
    } else {
        targetSlotType = 'field';
        targetSlotIndex = player.lineupSlot;
    }

    spielstand.activeSuspensions.push({
        type: teamKey === 'myteam' ? 'heim' : 'gegner',
        number: player.number,
        remaining: 120,
        slotType: targetSlotType,
        slotIndex: targetSlotIndex,
        teamKey: teamKey
    });

    // Automated move to bench
    player.lineupSlot = null;

    updateSuspensionDisplay();
    zeichneSpielerRaster();
}

export function applyGameMode() {
    const spielBereich = document.getElementById('spielBereich');
    const heimBench = document.getElementById('heimBenchRoster')?.closest('.roster-section');
    const gastBench = document.getElementById('gastBenchRoster')?.closest('.roster-section');
    const dashboard = document.getElementById('actionDashboard');
    const undoBtn = document.getElementById('undoButton');

    // In Simple Mode, we hide the "Bank" sections entirely.
    // The closest('.roster-section') is the container.

    if (!spielBereich) return;

    if (spielstand.gameMode === 'simple') {
        spielBereich.classList.add('simple-mode');
        // Hide Bench Sections
        if (heimBench) heimBench.style.display = 'none';
        if (gastBench) gastBench.style.display = 'none';

        // Show Dashboard (Standard Logic uses it)
        if (dashboard) dashboard.style.display = 'flex'; // Was 'none'

        // Ensure "Undo" and other controls still work/look ok.

    } else {
        spielBereich.classList.remove('simple-mode');
        // Show Bench Sections
        if (heimBench) heimBench.style.display = 'block';
        if (gastBench) gastBench.style.display = 'block';

        // Show Dashboard
        if (dashboard) dashboard.style.display = 'flex';
    }
}
