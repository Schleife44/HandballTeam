import { ladeSpielstandDaten, spielstand, speichereSpielstand } from './modules/state.js';
import {
    addPlayerForm, startGameButton, cancelEditButton, exportTeamButton,
    importTeamButton, importFileInput, backToRosterButton, gamePhaseButton,
    pauseButton, zurueckButton, vorButton, neuesSpielButton,
    heimScoreUp, heimScoreDown, gegnerScoreUp, gegnerScoreDown,
    aktionAbbrechen, guteAktionModalButton, aktionVorauswahlAbbrechen,
    kommentarSpeichernButton, settingsButton, settingsSchliessen,
    toggleDarkMode, toggleTorTracker, toggleTorTrackerGegner,
    toggleWurfbildHeim, toggleWurfbildGegner, inputTeamNameHeim,
    inputTeamNameGegner, torRahmen, wurfbildUeberspringen,
    showWurfbilderButton, closeWurfbilderStats, gegnerNummerSpeichern,
    gegnerNummerUeberspringen, aktionsMenue, aktionVorauswahl,
    kommentarBereich, kommentarTitel, kommentarInput, settingsModal,
    wurfbilderStatsModal, neueGegnerNummer, sevenMeterOutcomeModal,
    rosterBereich, spielBereich, globalAktionen, scoreWrapper, timerAnzeige,
    statistikWrapper, rosterListe, heimSpielerRaster, gegnerSpielerRaster, protokollAusgabe, bekannteGegnerListe,
    wurfbildUmgebung, addGegnerModal, addGegnerNummerInput, addGegnerSpeichern, addGegnerAbbrechen,
    toggleWurfpositionHeim, toggleWurfpositionGegner, wurfpositionModal, wurfpositionFeld, wurfpositionUeberspringen,
    showHeatmapButton, heatmapModal, heatmapSvg, closeHeatmapModal,
    heatmapHeimFilter, heatmapGegnerFilter, heatmapToreFilter, heatmapMissedFilter,
    exportPdfButton,
    // History DOM
    spielBeendenButton, historieBereich, historieListe, backToStartFromHistory, historyButton,
    historieDetailBereich, backToHistoryList, histDetailTeams, histDetailScore, histDetailDate,
    histStatsTable, histStatsBody, histStatsGegnerTable, histStatsGegnerBody,
    histHeatmapSvg, histTabStats, histTabHeatmap, histSubTabTor, histSubTabFeld,
    histContentStats, histContentHeatmap, exportHistorieButton
} from './modules/dom.js';
import {
    addPlayer, schliesseEditModus, oeffneEditModus, deletePlayer
} from './modules/roster.js';
import {
    switchToGame, switchToRoster, handleGamePhaseClick, handleRealPauseClick,
    logGlobalAktion, logScoreKorrektur, schliesseAktionsMenue, logAktion,
    setAktuelleAktionTyp, aktuelleAktionTyp, speichereGegnerNummer,
    skipGegnerNummer, handle7mOutcome, starteNeuesSpiel, setSteuerungAktiv,
    oeffneAktionsMenue, loescheProtokollEintrag, oeffneGegnerAktionsMenue
} from './modules/game.js';
import { handleZeitSprung } from './modules/timer.js';
import { exportTeam, handleFileImport, exportiereAlsTxt, exportiereAlsCsv, exportiereAlsPdf } from './modules/export.js';
import {
    applyTheme, applyViewSettings, updateScoreDisplay, updateTorTracker,
    schliesseWurfbildModal, zeigeWurfstatistik, aktuellerWurfbildModus,
    zeichneRosterListe, updateSuspensionDisplay, zeichneSpielerRaster,
    updateProtokollAnzeige, zeichneStatistikTabelle, oeffneWurfbildModal
} from './modules/ui.js';
import { formatiereZeit } from './modules/utils.js';
import { berechneStatistiken, berechneGegnerStatistiken, berechneTore } from './modules/stats.js';
import { speichereSpielInHistorie, getHistorie, getSpielAusHistorie, exportHistorie, loescheSpielAusHistorie } from './modules/history.js';

// --- Heatmap State (Shared) ---
let currentHeatmapTab = 'tor';

// --- Initialisierung ---
function initApp() {
    const geladen = ladeSpielstandDaten();

    // UI Checkboxen setzen (Initial state from loaded data)
    if (toggleDarkMode) toggleDarkMode.checked = spielstand.settings.darkMode;
    if (toggleTorTracker) toggleTorTracker.checked = spielstand.settings.showTorTracker;
    if (toggleTorTrackerGegner) toggleTorTrackerGegner.checked = spielstand.settings.showTorTrackerGegner;
    if (toggleWurfbildHeim) toggleWurfbildHeim.checked = spielstand.settings.showWurfbildHeim;
    if (toggleWurfbildGegner) toggleWurfbildGegner.checked = spielstand.settings.showWurfbildGegner;
    if (toggleWurfpositionHeim) toggleWurfpositionHeim.checked = spielstand.settings.showWurfpositionHeim;
    if (toggleWurfpositionGegner) toggleWurfpositionGegner.checked = spielstand.settings.showWurfpositionGegner;
    if (inputTeamNameHeim) inputTeamNameHeim.value = spielstand.settings.teamNameHeim;
    if (inputTeamNameGegner) inputTeamNameGegner.value = spielstand.settings.teamNameGegner;

    applyTheme();

    if (geladen && spielstand.uiState === 'game') {
        rosterBereich.classList.add('versteckt');
        spielBereich.classList.remove('versteckt');
        if (globalAktionen) globalAktionen.classList.remove('versteckt');
        scoreWrapper.classList.remove('versteckt');

        applyViewSettings();

        timerAnzeige.textContent = formatiereZeit(spielstand.timer.verstricheneSekundenBisher);
        spielstand.timer.istPausiert = true;

        const phase = spielstand.timer.gamePhase;
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
            // Show save button on end
            if (spielBeendenButton) spielBeendenButton.classList.remove('versteckt');
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

// --- History Logic ---

function handleSpielBeenden() {
    if (confirm("Spiel wirklich beenden und speichern? Dies archiviert das Spiel und kehrt zum Startbildschirm zurück.")) {
        // Prepare Data
        const gameData = {
            score: { ...spielstand.score },
            teams: { heim: spielstand.settings.teamNameHeim, gegner: spielstand.settings.teamNameGegner },
            gameLog: [...spielstand.gameLog],
            roster: [...spielstand.roster],
            // We could store pre-calculated stats, but raw log is better for reconstruction
        };

        speichereSpielInHistorie(gameData);
        alert("Spiel gespeichert!");

        // Reset Logic (Similar to delete game but keeps roster settings?)
        // For now, let's just go back to start and maybe clear log
        // Actually best to restart completely or reset log.
        // Let's reset the active game state but keep roster.

        spielstand.gameLog = [];
        spielstand.score.heim = 0;
        spielstand.score.gegner = 0;
        spielstand.timer.verstricheneSekundenBisher = 0;
        spielstand.timer.gamePhase = 1;
        spielstand.uiState = 'roster';
        spielstand.activeSuspensions = [];
        spielstand.timer.history = [];

        speichereSpielstand();
        location.reload(); // Simple reload to clear generic state and go to start
    }
}

function renderHistoryList() {
    historieListe.innerHTML = '';
    const games = getHistorie();

    if (games.length === 0) {
        historieListe.innerHTML = '<p style="text-align:center; padding:20px;">Keine gespeicherten Spiele.</p>';
        return;
    }

    games.forEach(game => {
        const div = document.createElement('div');
        div.className = 'history-card';
        div.style.cssText = 'background: #2c3036; padding: 15px; margin-bottom: 10px; border-radius: 8px; cursor: pointer; display: flex; justify-content: space-between; align-items: center;';

        const date = new Date(game.date).toLocaleDateString() + ' ' + new Date(game.date).toLocaleTimeString();
        div.innerHTML = `
            <div>
                <strong style="color: #61dafb; font-size: 1.1em;">${game.teams.heim} vs ${game.teams.gegner}</strong>
                <div style="font-size: 0.9em; color: #aaa;">${date}</div>
            </div>
            <div style="text-align: right;">
                <span style="font-size: 1.5em; font-weight: bold; margin-right: 15px;">${game.score.heim}:${game.score.gegner}</span>
                <button class="delete-history-btn" data-id="${game.id}" style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Löschen</button>
            </div>
        `;

        // Click on card opens detail
        div.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-history-btn')) return;
            openHistoryDetail(game);
        });

        // Delete button
        div.querySelector('.delete-history-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm("Spiel wirklich aus der Historie löschen?")) {
                loescheSpielAusHistorie(game.id);
                renderHistoryList();
            }
        });

        historieListe.appendChild(div);
    });
}

// Redefining openHistoryDetail to handle stats merging correctly

// Redefining openHistoryDetail to handle stats merging correctly

function renderHomeStatsInHistory(tbody, statsData, gameLog) {
    tbody.innerHTML = '';
    const toreMap = berechneTore(gameLog);

    statsData.forEach(stats => {
        const goals = toreMap.get(stats.number) || 0;
        const totalAttempts = goals + stats.fehlwurf;
        const quote = totalAttempts > 0 ? Math.round((goals / totalAttempts) * 100) + '%' : '-';

        // 7m display
        const sevenMDisplay = (stats.siebenMeterVersuche > 0) ? `${stats.siebenMeterTore}/${stats.siebenMeterVersuche}` : "0/0";

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${stats.number} ${stats.name}</td>
            <td>${goals}</td>
            <td>${sevenMDisplay}</td>
            <td>${quote}</td>
            <td>${stats.guteAktion}</td>
            <td>${stats.fehlwurf}</td>
            <td>${stats.techFehler}</td>
            <td>${stats.gelb}</td>
            <td>${stats.zweiMinuten}</td>
            <td>${stats.rot}</td>
            <td><button class="heatmap-btn" style="padding: 2px 8px; font-size: 0.8rem;">🎯</button></td>
        `;

        // Add event listener for heatmap button
        const btn = tr.querySelector('.heatmap-btn');
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            openPlayerHistoryHeatmap(gameLog, stats.number, 'heim', stats.name);
        });

        tbody.appendChild(tr);
    });
}

function renderOpponentStatsInHistory(tbody, statsData, gameLog) { // Added gameLog param
    tbody.innerHTML = '';
    statsData.forEach(stats => {
        // Opponent stats object already has 'tore' if generated by berechneGegnerStatistiken
        // But wait, berechneGegnerStatistiken returns array of objects { name, tore, ... }
        // The numbers might be implicit or in name?
        // Let's check stats.number. If not present, we use name or we strictly can't filter by number easily unless mapped.
        // berechneGegnerStatistiken aggregates by 'gegnerNummer' or 'name'.
        // Let's assume stats has a unique identifier if possible.
        // In berechneGegnerStatistiken: stats.number = nummer || '?';

        const goals = stats.tore || 0;
        const totalAttempts = goals + stats.fehlwurf;
        const quote = totalAttempts > 0 ? Math.round((goals / totalAttempts) * 100) + '%' : '-';

        // 7m display
        const sevenMDisplay = (stats.siebenMeterVersuche > 0) ? `${stats.siebenMeterTore}/${stats.siebenMeterVersuche}` : "0/0";

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${stats.name}</td>
            <td>${goals}</td>
            <td>${sevenMDisplay}</td>
            <td>${quote}</td>
            <td>${stats.guteAktion}</td>
            <td>${stats.fehlwurf}</td>
            <td>${stats.techFehler}</td>
            <td>${stats.gelb}</td>
            <td>${stats.zweiMinuten}</td>
            <td>${stats.rot}</td>
            <td><button class="heatmap-btn" style="padding: 2px 8px; font-size: 0.8rem;">🎯</button></td>
        `;

        // Add event listener
        const btn = tr.querySelector('.heatmap-btn');
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            // Pass number if available, strictly speaking Opponent stats are keyed by Number if known
            const num = (stats.number && stats.number !== '?') ? stats.number : null;
            openPlayerHistoryHeatmap(gameLog, num, 'gegner', stats.name);
        });

        tbody.appendChild(tr);
    });
}

// Helper to open modal for specific player
function openPlayerHistoryHeatmap(gameLog, identifier, team, playerName) {
    heatmapModal.classList.remove('versteckt');

    // Hide standard filters in modal
    // Targeted selector to avoid hiding History filter
    // We assume 'heatmapModal' contains the filter we want to hide.
    const filterContainer = heatmapModal.querySelector('.heatmap-filter');
    if (filterContainer) filterContainer.classList.add('versteckt');

    // Set title or context if possible (optional)
    // We reuse the LIVE heatmap modal, but we must override the rendering
    // We can use a special mode in renderHeatmap

    // We need to clear previous filters or ensure renderHeatmap uses passed params
    // Let's call renderHeatmap with options

    // Bind the "Close" button of modal to just hide it (already does)
    // But we need to make sure tabs switch context or remain.

    // We use a temporary override function for the render call to support tabs switching while this modal is open
    // Ideally we'd have a clean state object for "Current Heatmap View".

    // For now, let's just trigger a render with specific options.
    // If user clicks tabs in modal, they might reset to "All".
    // We should fix that by setting a "currentContext" variable.

    currentHeatmapContext = {
        log: gameLog,
        filter: {
            team: team, // 'heim' or 'gegner'
            player: identifier // number 
        }
    };

    renderHeatmap(heatmapSvg, gameLog, false, currentHeatmapContext.filter);
}

let currentHeatmapContext = null; // Store context for tabs

// Override openHistoryDetail
function openHistoryDetail(game) {
    historieBereich.classList.add('versteckt');
    historieDetailBereich.classList.remove('versteckt');

    histDetailTeams.textContent = `${game.teams.heim} vs ${game.teams.gegner}`;
    histDetailScore.textContent = `${game.score.heim}:${game.score.gegner}`;
    histDetailDate.textContent = new Date(game.date).toLocaleString();

    // Stats
    const homeStats = berechneStatistiken(game.gameLog, game.roster);
    const opponentStats = berechneGegnerStatistiken(game.gameLog);

    renderHomeStatsInHistory(histStatsBody, homeStats, game.gameLog);
    renderOpponentStatsInHistory(histStatsGegnerBody, opponentStats, game.gameLog); // Pass log

    // Heatmap Wiring (Main History Heatmap)
    const renderBound = () => renderHeatmap(histHeatmapSvg, game.gameLog, true); // true = history mode

    // Force filter defaults for Global History (important fix)
    // We must ensure currentHeatmapContext is null so we don't pick up leftovers
    // Although renderHeatmap won't pick up context if svg element differs (histHeatmapSvg vs heatmapSvg)
    // BUT we should be safe. 
    // Wait, the user said "Team heatmap" - if they meant the History one, fine.
    // If they meant the Live one, we need to fix the Live opener.

    // For History Team Heatmap (histHeatmapSvg):
    // It does NOT use 'heatmapModal' logic, it is embedded in detail view.
    // So 'currentHeatmapContext' logic in renderHeatmap (which checks for heatmapSvg) is skipped.
    // So logic for History Team View falls to `else if (isHistory)`.
    // And there we check `input[name="histHeatTeam"]`.
    // We must ensure these inputs are ENABLED and visible.
    // They are not hidden by our modal logic (class '.heatmap-filter' in modal).
    // History has its own filter div? 
    // In index.html: <div class="heatmap-filter"> inside histContentHeatmap.

    // The previous fix hid ".heatmap-filter" via querySelector. 
    // querySelector only finds the FIRST match!
    // In index.html, we have two .heatmap-filter divs?
    // 1. in histContentHeatmap
    // 2. in heatmapModal

    // If openPlayerHistoryHeatmap calls querySelector('.heatmap-filter'), it might hide the WRONG one or just the first.
    // Actually, createElements or not, querySelector is global.
    // We should be specific.

    // Fix: In openPlayerHistoryHeatmap use specific selector for Modal filter.
    // And here ensure History filter is visible.

    const histFilter = histContentHeatmap.querySelector('.heatmap-filter');
    if (histFilter) histFilter.classList.remove('versteckt');

    // Bind change events for History Heatmap filters
    const histTeamRadios = document.querySelectorAll('input[name="histHeatTeam"]');
    histTeamRadios.forEach(r => {
        r.checked = (r.value === 'heim'); // Reset to default
        r.addEventListener('change', renderBound);
    });

    histSubTabTor.addEventListener('click', () => {
        currentHeatmapTab = 'tor';
        histSubTabTor.classList.add('active');
        histSubTabFeld.classList.remove('active');
        histSubTabKombi.classList.remove('active');
        renderBound();
    });
    histSubTabFeld.addEventListener('click', () => {
        currentHeatmapTab = 'feld';
        histSubTabFeld.classList.add('active');
        histSubTabTor.classList.remove('active');
        histSubTabKombi.classList.remove('active');
        renderBound();
    });
    histSubTabKombi.addEventListener('click', () => {
        currentHeatmapTab = 'kombiniert';
        histSubTabKombi.classList.add('active');
        histSubTabTor.classList.remove('active');
        histSubTabFeld.classList.remove('active');
        renderBound();
    });

    // Initial Render
    renderBound();
}


// --- Updated Heatmap Renderer (Reusable) ---
function renderHeatmap(svgElement, logSource, isHistory = false, filterOverride = null) {
    if (!svgElement) return;

    let log = logSource || spielstand.gameLog;

    // Filters
    let showHeim = true;
    let showGegner = false;
    let playerFilter = null; // ID/Number

    // Check global context for overrides (Single Player History Mode)
    // This context determines both the LOG source and the FILTER
    if (currentHeatmapContext && svgElement === heatmapSvg) {
        // We are in the modal and have a context (Historical Player View)
        log = currentHeatmapContext.log; // Use the history log!

        if (currentHeatmapContext.filter) {
            if (currentHeatmapContext.filter.team === 'heim') { showHeim = true; showGegner = false; }
            else { showHeim = false; showGegner = true; }
            playerFilter = currentHeatmapContext.filter.player;
        }

        // Hide Filter UI if it exists (in the modal we are rendering into)
        // We use svgElement to find the parent modal or container
        const modal = svgElement.closest('.modal-content') || svgElement.closest('.modal-overlay');
        if (modal) {
            const filterContainer = modal.querySelector('.heatmap-filter');
            if (filterContainer) filterContainer.classList.add('versteckt');
        } else {
            // Fallback
            const filterContainer = document.querySelector('#heatmapModal .heatmap-filter');
            if (filterContainer) filterContainer.classList.add('versteckt');
        }

    } else {
        // Normal Mode (Live or Full History)

        if (filterOverride) {
            // High priority override (Single Player View passed directly)
            if (filterOverride.team === 'heim') {
                showHeim = true;
                showGegner = false;
            } else {
                showHeim = false;
                showGegner = true;
            }
            playerFilter = filterOverride.player;
        }
        else if (isHistory) {
            const selected = document.querySelector('input[name="histHeatTeam"]:checked');
            if (selected && selected.value === 'gegner') {
                showHeim = false;
                showGegner = true;
            } else {
                showHeim = true;
                showGegner = false;
            }
        } else {
            // Live Mode filters - GLOBAL
            showHeim = heatmapHeimFilter?.checked ?? true;
            showGegner = heatmapGegnerFilter?.checked ?? false;
        }
    }

    // Hardcoded outcome filters for now (or shared?)
    const showTore = heatmapToreFilter?.checked ?? true;
    const showMissed = heatmapMissedFilter?.checked ?? true;

    // Collect data points
    const pointsTor = [];
    const pointsFeld = [];

    log.forEach(entry => {
        const isOpponent = entry.action?.startsWith('Gegner') || entry.gegnerNummer;

        // Player Filter Check
        if (playerFilter !== null) {
            if (showHeim) {
                // Must be home player and match number
                if (isOpponent) return;
                if (entry.playerId !== playerFilter) return;
            } else {
                // Must be opponent
                if (!isOpponent) return;
                // Strict check for opponent number
                if (entry.gegnerNummer !== playerFilter) return;
            }
        } else {
            // Team Filter
            if (showHeim && isOpponent) return;
            if (showGegner && !isOpponent) return;
        }

        const isGoal = entry.action === 'Tor' || entry.action === 'Gegner Tor' ||
            entry.action?.includes('7m Tor');
        const isMiss = entry.action === 'Fehlwurf' || entry.action === 'Gegner Wurf Vorbei' ||
            entry.action?.includes('Verworfen') || entry.action?.includes('Gehalten');

        // Filter by outcome
        if (isGoal && !showTore) return;
        if (isMiss && !showMissed) return;

        // Collect points for BOTH views if available
        if (entry.wurfbild) {
            pointsTor.push({
                x: parseFloat(entry.wurfbild.x),
                y: parseFloat(entry.wurfbild.y),
                isOpponent,
                isGoal,
                isMiss
            });
        }

        if (entry.wurfposition) {
            pointsFeld.push({
                x: parseFloat(entry.wurfposition.x),
                y: parseFloat(entry.wurfposition.y),
                isOpponent,
                isGoal,
                isMiss
            });
        }
    });

    // Generate SVG
    let svgContent = '';

    const drawGoalHeatmap = (pts, yOffset = 0) => {
        let content = `
            <g transform="translate(0, ${yOffset})">
                <defs>
                    <radialGradient id="heatGradient${isHistory ? 'H' : ''}${yOffset}">
                        <stop offset="0%" style="stop-color:rgba(255,0,0,0.6)"/>
                        <stop offset="100%" style="stop-color:rgba(255,0,0,0)"/>
                    </radialGradient>
                    <radialGradient id="heatGradientBlue${isHistory ? 'H' : ''}${yOffset}">
                        <stop offset="0%" style="stop-color:rgba(13,110,253,0.6)"/>
                        <stop offset="100%" style="stop-color:rgba(13,110,253,0)"/>
                    </radialGradient>
                </defs>
                <rect x="25" y="10" width="250" height="180" fill="none" stroke="#333" stroke-width="3"/>
                <line x1="100" y1="10" x2="100" y2="190" stroke="#ccc" stroke-width="1" stroke-dasharray="5,5"/>
                <line x1="200" y1="10" x2="200" y2="190" stroke="#ccc" stroke-width="1" stroke-dasharray="5,5"/>
                <line x1="25" y1="70" x2="275" y2="70" stroke="#ccc" stroke-width="1" stroke-dasharray="5,5"/>
                <line x1="25" y1="130" x2="275" y2="130" stroke="#ccc" stroke-width="1" stroke-dasharray="5,5"/>
        `;

        pts.forEach(p => {
            if (p.isMiss) return;
            let x = 25 + (p.x / 100) * 250;
            let y = 10 + (p.y / 100) * 180;
            x = Math.max(-10, Math.min(310, x));
            y = Math.max(-55, Math.min(195, y));
            const gradient = p.isOpponent ? `url(#heatGradientBlue${isHistory ? 'H' : ''}${yOffset})` : `url(#heatGradient${isHistory ? 'H' : ''}${yOffset})`;
            content += `<circle cx="${x}" cy="${y}" r="30" fill="${gradient}"/>`;
        });

        pts.forEach(p => {
            let x = 25 + (p.x / 100) * 250;
            let y = 10 + (p.y / 100) * 180;
            x = Math.max(-10, Math.min(310, x));
            y = Math.max(-55, Math.min(195, y));
            const color = p.isMiss ? '#6c757d' : (p.isOpponent ? '#0d6efd' : '#dc3545');
            content += `<circle cx="${x}" cy="${y}" r="4" fill="${color}" stroke="white" stroke-width="1"/>`;
        });

        content += `</g>`;
        return content;
    };

    const drawFieldHeatmap = (pts, yOffset = 0) => {
        let content = `
            <g transform="translate(0, ${yOffset})">
                <defs>
                    <radialGradient id="heatGradientF${isHistory ? 'H' : ''}${yOffset}">
                        <stop offset="0%" style="stop-color:rgba(255,0,0,0.5)"/>
                        <stop offset="100%" style="stop-color:rgba(255,0,0,0)"/>
                    </radialGradient>
                    <radialGradient id="heatGradientBlueF${isHistory ? 'H' : ''}${yOffset}">
                        <stop offset="0%" style="stop-color:rgba(13,110,253,0.5)"/>
                        <stop offset="100%" style="stop-color:rgba(13,110,253,0)"/>
                    </radialGradient>
                </defs>
                <rect x="10" y="10" width="280" height="380" fill="none" stroke="#333" stroke-width="2"/>
                <rect x="112" y="10" width="76" height="8" fill="#333"/>
                <path d="M 75 18 Q 75 90 150 90 Q 225 90 225 18" fill="none" stroke="#333" stroke-width="2"/>
                <path d="M 37 18 Q 37 150 150 150 Q 263 150 263 18" fill="none" stroke="#333" stroke-width="1" stroke-dasharray="6,3"/>
                <circle cx="150" cy="65" r="4" fill="#333"/>
                <line x1="10" y1="388" x2="290" y2="388" stroke="#333" stroke-width="2"/>
        `;

        pts.forEach(p => {
            if (p.isMiss) return;
            const x = 10 + (p.x / 100) * 280;
            const y = 10 + (p.y / 100) * 380;
            const gradient = p.isOpponent ? `url(#heatGradientBlueF${isHistory ? 'H' : ''}${yOffset})` : `url(#heatGradientF${isHistory ? 'H' : ''}${yOffset})`;
            content += `<circle cx="${x}" cy="${y}" r="40" fill="${gradient}"/>`;
        });

        pts.forEach(p => {
            const x = 10 + (p.x / 100) * 280;
            const y = 10 + (p.y / 100) * 380;
            const color = p.isMiss ? '#6c757d' : (p.isOpponent ? '#0d6efd' : '#dc3545');
            content += `<circle cx="${x}" cy="${y}" r="5" fill="${color}" stroke="white" stroke-width="1"/>`;
        });

        content += `</g>`;
        return content;
    };


    if (currentHeatmapTab === 'tor') {
        svgElement.setAttribute('viewBox', '0 -60 300 260');
        svgContent = drawGoalHeatmap(pointsTor, 0);
        svgContent += `
        <text x="10" y="195" font-size="10" fill="#666">
            ${pointsTor.length} Würfe angezeigt
        </text>`;

    } else if (currentHeatmapTab === 'feld') {
        svgElement.setAttribute('viewBox', '0 0 300 400');
        svgContent = drawFieldHeatmap(pointsFeld, 0);
        svgContent += `
        <text x="10" y="395" font-size="10" fill="#666">
            ${pointsFeld.length} Würfe angezeigt
        </text>`;

    } else if (currentHeatmapTab === 'kombiniert') {
        // Combined View: Stacked
        // Goal View Scaled Down significantly (0.35x) and positioned "on" the field (top area)
        // SVG Viewbox: 300 width.

        svgElement.setAttribute('viewBox', '0 0 300 500'); // Reduced total height

        const scaleGoal = 0.35;
        // Center goal: 300 width. Goal width 300*0.35 = 105.
        // xOffset = (300 - 105) / 2 = 97.5
        const xOffsetGoal = (300 - (300 * scaleGoal)) / 2;

        // Position goal so its bottom (goal line) aligns with the field's top line
        // Goal rect bottom in drawGoalHeatmap is at y=190. After scale: 190*0.35 = 66.5
        // Field starts at yOffsetField=80, goal line is at y=80+10=90
        // To align: yOffsetGoal + 66.5 = 90 → yOffsetGoal = 23.5
        const yOffsetGoal = 24;
        const yOffsetField = 80;

        let linesContent = '<g>';

        log.forEach(entry => {
            // Filter logic...
            const isOpponent = entry.action?.startsWith('Gegner') || entry.gegnerNummer;
            if (playerFilter !== null) {
                if (showHeim) {
                    if (isOpponent) return;
                    if (entry.playerId !== playerFilter) return;
                } else {
                    if (!isOpponent) return;
                    if (entry.gegnerNummer !== playerFilter) return;
                }
            } else {
                if (showHeim && isOpponent) return;
                if (showGegner && !isOpponent) return;
            }

            const isGoal = entry.action === 'Tor' || entry.action === 'Gegner Tor' || entry.action?.includes('7m Tor');
            const isMiss = entry.action === 'Fehlwurf' || entry.action === 'Gegner Wurf Vorbei' || entry.action?.includes('Verworfen') || entry.action?.includes('Gehalten');

            if (isGoal && !showTore) return;
            if (isMiss && !showMissed) return;

            if (entry.wurfbild && entry.wurfposition) {
                // Goal Point
                let rawGx = 25 + (parseFloat(entry.wurfbild.x) / 100) * 250;
                let rawGy = 10 + (parseFloat(entry.wurfbild.y) / 100) * 180;
                rawGx = Math.max(-10, Math.min(310, rawGx));
                rawGy = Math.max(-55, Math.min(195, rawGy));

                const gx = xOffsetGoal + (rawGx * scaleGoal);
                const gy = yOffsetGoal + (rawGy * scaleGoal);

                // Field Point
                const fx = 10 + (parseFloat(entry.wurfposition.x) / 100) * 280;
                const fy = 10 + (parseFloat(entry.wurfposition.y) / 100) * 380 + yOffsetField;

                const color = isMiss ? 'rgba(108, 117, 125, 0.5)' : (isOpponent ? 'rgba(13, 110, 253, 0.5)' : 'rgba(220, 53, 69, 0.5)');

                linesContent += `<line x1="${fx}" y1="${fy}" x2="${gx}" y2="${gy}" stroke="${color}" stroke-width="2" />`;
            }
        });
        linesContent += '</g>';

        // Draw Field FIRST (Background)
        svgContent += drawFieldHeatmap(pointsFeld, yOffsetField);

        // Draw Connection Lines
        svgContent += linesContent;

        // Draw Goal LAST (Foreground overlay)
        // Add a semi-transparent box behind goal to make it pop if it overlaps lines?
        // svgContent += `<rect x="${xOffsetGoal}" y="${yOffsetGoal}" width="${300*scaleGoal}" height="${200*scaleGoal}" fill="rgba(255,255,255,0.8)" />`;

        svgContent += `<g transform="translate(${xOffsetGoal}, ${yOffsetGoal}) scale(${scaleGoal})">`;
        svgContent += drawGoalHeatmap(pointsTor, 0);
        svgContent += `</g>`;
    }

    svgElement.innerHTML = svgContent;
}

// Global Tab Listeners (for Main Heatmap Modal)
document.querySelectorAll('.heatmap-tab[data-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        currentHeatmapTab = target;

        // Update Active State
        document.querySelectorAll('.heatmap-tab[data-tab]').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Re-render
        renderHeatmap(heatmapSvg, null, false);
    });
});


// Event Listener Zuweisung

// Bildschirm 1
addPlayerForm.addEventListener('submit', addPlayer);
startGameButton.addEventListener('click', switchToGame);
cancelEditButton.addEventListener('click', schliesseEditModus);
exportTeamButton.addEventListener('click', exportTeam);
importTeamButton.addEventListener('click', () => importFileInput.click());
importFileInput.addEventListener('change', handleFileImport);

// History Buttons
if (historyButton) {
    historyButton.addEventListener('click', () => {
        rosterBereich.classList.add('versteckt');
        historieBereich.classList.remove('versteckt');
        renderHistoryList();
    });
}
if (backToStartFromHistory) {
    backToStartFromHistory.addEventListener('click', () => {
        historieBereich.classList.add('versteckt');
        rosterBereich.classList.remove('versteckt');
    });
}
if (exportHistorieButton) {
    exportHistorieButton.addEventListener('click', exportHistorie);
}
if (backToHistoryList) {
    backToHistoryList.addEventListener('click', () => {
        historieDetailBereich.classList.add('versteckt');
        historieBereich.classList.remove('versteckt');
    });
}
if (spielBeendenButton) {
    spielBeendenButton.addEventListener('click', handleSpielBeenden);
}

// History Detail Tabs
if (histTabStats && histTabHeatmap) {
    histTabStats.addEventListener('click', () => {
        histTabStats.classList.add('active');
        histTabHeatmap.classList.remove('active');
        histContentStats.classList.remove('versteckt');
        histContentHeatmap.classList.add('versteckt');
    });
    histTabHeatmap.addEventListener('click', () => {
        histTabHeatmap.classList.add('active');
        histTabStats.classList.remove('active');
        histContentHeatmap.classList.remove('versteckt');
        histContentStats.classList.add('versteckt');
    });
}


// Bildschirm 2
backToRosterButton.addEventListener('click', switchToRoster);
gamePhaseButton.addEventListener('click', handleGamePhaseClick);
pauseButton.addEventListener('click', handleRealPauseClick);
zurueckButton.addEventListener('click', () => handleZeitSprung(-30));
vorButton.addEventListener('click', () => handleZeitSprung(30));
neuesSpielButton.addEventListener('click', starteNeuesSpiel);



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
        setAktuelleAktionTyp('Gute Aktion: ' + btn.dataset.aktion);
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
            if (toggleDarkMode) toggleDarkMode.checked = spielstand.settings.darkMode;
            if (toggleTorTracker) toggleTorTracker.checked = spielstand.settings.showTorTracker;
            if (toggleTorTrackerGegner) toggleTorTrackerGegner.checked = spielstand.settings.showTorTrackerGegner;
            if (toggleWurfbildHeim) toggleWurfbildHeim.checked = spielstand.settings.showWurfbildHeim;
            if (toggleWurfbildGegner) toggleWurfbildGegner.checked = spielstand.settings.showWurfbildGegner;
            // Namen laden
            if (inputTeamNameHeim) inputTeamNameHeim.value = spielstand.settings.teamNameHeim || 'Heim';
            if (inputTeamNameGegner) inputTeamNameGegner.value = spielstand.settings.teamNameGegner || 'Gegner';
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

if (toggleWurfpositionHeim) {
    toggleWurfpositionHeim.addEventListener('change', (e) => {
        if (!spielstand.settings) spielstand.settings = {};
        spielstand.settings.showWurfpositionHeim = e.target.checked;
        speichereSpielstand();
    });
}

if (toggleWurfpositionGegner) {
    toggleWurfpositionGegner.addEventListener('change', (e) => {
        if (!spielstand.settings) spielstand.settings = {};
        spielstand.settings.showWurfpositionGegner = e.target.checked;
        speichereSpielstand();
    });
}

// Wurfposition Logic
if (wurfpositionFeld) {
    wurfpositionFeld.addEventListener('click', (e) => {
        const svg = wurfpositionFeld.querySelector('svg');
        const rect = svg.getBoundingClientRect();

        // Get the viewBox dimensions for accurate coordinate mapping
        const viewBox = svg.viewBox.baseVal;
        const viewBoxWidth = viewBox.width || 300; // Updated for new SVG
        const viewBoxHeight = viewBox.height || 400;

        // Calculate click position relative to rendered SVG
        const clickXOffset = e.clientX - rect.left;
        const clickYOffset = e.clientY - rect.top;

        // Calculate scaling factors (rendered size / viewBox size)
        const scaleX = rect.width / viewBoxWidth;
        const scaleY = rect.height / viewBoxHeight;

        // Convert to viewBox coordinates, then to percentage (0-100%)
        const x = (clickXOffset / scaleX) / viewBoxWidth * 100;
        const y = (clickYOffset / scaleY) / viewBoxHeight * 100;

        // Store position in last log entry
        if (spielstand.gameLog.length > 0) {
            spielstand.gameLog[0].wurfposition = { x: x.toFixed(1), y: y.toFixed(1) };
            speichereSpielstand();
        }

        wurfpositionModal.classList.add('versteckt');

        // Check if Wurfbild should be shown next
        const lastEntry = spielstand.gameLog[0];
        const isOpponent = lastEntry && (lastEntry.action.startsWith('Gegner') || lastEntry.gegnerNummer);
        const showWurfbild = isOpponent ? spielstand.settings.showWurfbildGegner : spielstand.settings.showWurfbildHeim;

        if (showWurfbild && lastEntry && (lastEntry.action === 'Tor' || lastEntry.action === 'Fehlwurf' || lastEntry.action === 'Gegner Tor' || lastEntry.action === 'Gegner Wurf Vorbei')) {
            oeffneWurfbildModal(isOpponent ? 'gegner' : 'standard');
        }
    });
}

if (wurfpositionUeberspringen) {
    wurfpositionUeberspringen.addEventListener('click', () => {
        wurfpositionModal.classList.add('versteckt');

        // Check if Wurfbild should be shown next
        if (spielstand.gameLog.length > 0) {
            const lastEntry = spielstand.gameLog[0];
            const isOpponent = lastEntry && (lastEntry.action.startsWith('Gegner') || lastEntry.gegnerNummer);
            const showWurfbild = isOpponent ? spielstand.settings.showWurfbildGegner : spielstand.settings.showWurfbildHeim;

            if (showWurfbild && (lastEntry.action === 'Tor' || lastEntry.action === 'Fehlwurf' || lastEntry.action === 'Gegner Tor' || lastEntry.action === 'Gegner Wurf Vorbei')) {
                oeffneWurfbildModal(isOpponent ? 'gegner' : 'standard');
            }
        }
    });
}

// Wurfbild Logic
if (wurfbildUmgebung) {
    wurfbildUmgebung.addEventListener('click', (e) => {
        const rect = torRahmen.getBoundingClientRect();
        const clickX = e.clientX;
        const clickY = e.clientY;

        // Check if click is inside torRahmen
        const insideGoal = (
            clickX >= rect.left &&
            clickX <= rect.right &&
            clickY >= rect.top &&
            clickY <= rect.bottom
        );

        // Calculate relative coordinates (0-100%) based on torRahmen
        const x = ((clickX - rect.left) / rect.width) * 100;
        const y = ((clickY - rect.top) / rect.height) * 100;

        let color = 'gray'; // Default

        if (spielstand.gameLog.length > 0) {
            const lastEntry = spielstand.gameLog[0];
            const action = lastEntry.action;

            // Determine color based on action
            if (action === "Tor" || action === "Gegner Tor" || action === "Gegner 7m Tor" || action === "7m Tor") {
                color = 'red';
            } else if (action === "Fehlwurf" || action === "Gegner Wurf Vorbei" || action === "Gegner 7m Verworfen" || action === "7m Verworfen") {
                color = 'gray';
            } else if (action === "Gegner 7m Gehalten" || action === "7m Gehalten") {
                color = 'yellow';
            }

            // Save Wurfbild to last log entry
            lastEntry.wurfbild = { x: x.toFixed(1), y: y.toFixed(1), color: color };
            speichereSpielstand();
        }

        // Clean up temp variables
        spielstand.tempGegnerNummer = null;
        spielstand.temp7mOutcome = null;

        schliesseWurfbildModal();
    });
}



if (wurfbildUeberspringen) {
    wurfbildUeberspringen.addEventListener('click', schliesseWurfbildModal);
}

if (showWurfbilderButton) showWurfbilderButton.addEventListener('click', zeigeWurfstatistik);
if (closeWurfbilderStats) closeWurfbilderStats.addEventListener('click', () => wurfbilderStatsModal.classList.add('versteckt'));

if (gegnerNummerSpeichern) {
    gegnerNummerSpeichern.addEventListener('click', () => {
        const val = neueGegnerNummer.value;
        if (val) speichereGegnerNummer(val);
    });
}
if (gegnerNummerUeberspringen) {
    gegnerNummerUeberspringen.addEventListener('click', skipGegnerNummer);
}

// 7m Outcome Buttons
document.querySelectorAll('#sevenMeterOutcomeModal .aktion-button[data-outcome]').forEach(btn => {
    btn.addEventListener('click', () => {
        handle7mOutcome(btn.dataset.outcome);
    });
});

// --- Event Delegation for Dynamic Elements ---

rosterListe.addEventListener('click', (e) => {
    if (e.target.classList.contains('edit-player')) {
        const index = e.target.dataset.index;
        oeffneEditModus(index);
    } else if (e.target.classList.contains('delete-player')) {
        const index = e.target.dataset.index;
        deletePlayer(index);
    }
});

// Heim Spieler Raster (Game Action)
heimSpielerRaster.addEventListener('click', (e) => {
    const btn = e.target.closest('.spieler-button');
    if (btn) {
        // Check if it's the add button
        if (btn.id === 'addHeimSpielerButton') {
            // Switch to roster to add players
            switchToRoster();
        } else {
            // Regular player button
            const index = btn.dataset.index;
            if (index !== undefined) {
                oeffneAktionsMenue(index);
            }
        }
    }
});

// Gegner Spieler Raster (Add opponent or open action menu)
gegnerSpielerRaster.addEventListener('click', (e) => {
    const btn = e.target.closest('.spieler-button');
    if (btn) {
        if (btn.id === 'addGegnerSpielerButton') {
            // Show modal to add new opponent
            addGegnerNummerInput.value = '';
            addGegnerModal.classList.remove('versteckt');
            addGegnerNummerInput.focus();
        } else {
            // Open action menu for existing opponent
            const gegnernummer = btn.dataset.gegnerNummer;
            if (gegnernummer) {
                oeffneGegnerAktionsMenue(parseInt(gegnernummer));
            }
        }
    }
});

// Protokoll (Delete Entry)
protokollAusgabe.addEventListener('click', (e) => {
    if (e.target.classList.contains('loeschButton')) {
        const index = e.target.dataset.index;
        loescheProtokollEintrag(index);
    }
});

// Gegner Nummer Liste
bekannteGegnerListe.addEventListener('click', (e) => {
    if (e.target.classList.contains('gegner-num-btn')) {
        const nummer = e.target.dataset.nummer;
        speichereGegnerNummer(nummer);
    }
});

// Start App

// Add Gegner Modal Handlers
if (addGegnerSpeichern) {
    addGegnerSpeichern.addEventListener('click', () => {
        const nummer = addGegnerNummerInput.value;
        if (nummer && !isNaN(nummer)) {
            const nummerInt = parseInt(nummer);
            if (!spielstand.knownOpponents.includes(nummerInt)) {
                spielstand.knownOpponents.push(nummerInt);
                spielstand.knownOpponents.sort((a, b) => a - b);
                speichereSpielstand();
                zeichneSpielerRaster();
                addGegnerModal.classList.add('versteckt');
            } else {
                alert('Dieser Gegner ist bereits in der Liste.');
            }
        }
    });
}

if (addGegnerAbbrechen) {
    addGegnerAbbrechen.addEventListener('click', () => {
        addGegnerModal.classList.add('versteckt');
    });
}

// Allow Enter key to submit in add gegner modal
if (addGegnerNummerInput) {
    addGegnerNummerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addGegnerSpeichern.click();
        }
    });
}

// Heatmap button (Live Game)
if (showHeatmapButton) {
    showHeatmapButton.addEventListener('click', () => {
        currentHeatmapContext = null; // Reset context

        // Ensure filters are visible for live game
        const filterContainer = heatmapModal.querySelector('.heatmap-filter');
        if (filterContainer) filterContainer.classList.remove('versteckt');

        heatmapModal.classList.remove('versteckt');
        renderHeatmap(heatmapSvg, null, false); // Live mode
    });
}

// Close heatmap
if (closeHeatmapModal) {
    closeHeatmapModal.addEventListener('click', () => {
        heatmapModal.classList.add('versteckt');
        currentHeatmapContext = null; // Clear context
    });
}

// Tab switching (Live Game)
document.querySelectorAll('.heatmap-tab:not([id^="hist"])').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.heatmap-tab:not([id^="hist"])').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentHeatmapTab = tab.dataset.tab;
        renderHeatmap(heatmapSvg, null, false);
    });
});

// Filter changes (Live Game)
[heatmapHeimFilter, heatmapGegnerFilter, heatmapToreFilter, heatmapMissedFilter].forEach(filter => {
    if (filter) {
        filter.addEventListener('change', () => renderHeatmap(heatmapSvg, null, false));
    }
});

// PDF Export
if (exportPdfButton) {
    exportPdfButton.addEventListener('click', exportiereAlsPdf);
}

initApp();
