import { customAlert } from './customDialog.js';
import { berechneTore, berechneWurfbilder, berechneStatistiken, berechneGegnerStatistiken } from './stats.js';
import { sanitizeHTML, escapeHTML } from './securityUtils.js';
import { drawGoalHeatmap, drawFieldHeatmap, renderHeatmap, setCurrentHeatmapTab, setCurrentHeatmapContext } from './heatmap.js';
import { spielstand, speichereSpielstand, getOpponentLabel, getMyTeamLabel } from './state.js';
import { getAuthUid, getCurrentUserProfile, isUserTrainer } from './firebase.js';

/**
 * Apply CSS classes based on selected Game Mode (Simple vs Complex)
 */
/**
 * Shared helper for 'No Game Active' state in Live views.
 */
function renderEmptyLiveState(container) {
    if (!container) return;
    container.innerHTML = sanitizeHTML(`
        <div class="empty-state-card" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; text-align: center; color: var(--text-muted); min-height: 400px; background: var(--bg-card); border-radius: 12px; border: 1px dashed var(--border-color); margin: 20px 0;">
            <div style="background: rgba(255,255,255,0.05); border-radius: 50%; padding: 30px; margin-bottom: 20px;">
                <i data-lucide="play-circle" style="width: 64px; height: 64px; opacity: 0.5;"></i>
            </div>
            <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 10px; color: var(--text-main);">Kein Spiel aktiv</h2>
            <p style="max-width: 400px; font-size: 1rem; line-height: 1.6;">Starten Sie ein neues Spiel im Bereich "Spiel", um Live-Statistiken und Analysen zu sehen.</p>
        </div>
    `);
    if (window.lucide) window.lucide.createIcons();
}

export function applyGameMode() {
    const isSimple = spielstand.gameMode === 'simple';
    
    // Toggle on body for global CSS scope
    document.body.classList.toggle('is-simple-mode', isSimple);
    document.body.classList.toggle('is-complex-mode', !isSimple);

    const spielBereich = document.getElementById('spielBereich');
    if (spielBereich) {
        spielBereich.classList.toggle('is-simple-mode', isSimple);
        spielBereich.classList.toggle('is-complex-mode', !isSimple);
    }
}
import {
    statistikSidebar, scoreAnzeige, scoreAnzeigeGegner,
    teamNameHeimDisplay, teamNameGegnerDisplay,
    heatmapHeimLabel, heatmapGegnerLabel,
    suspensionContainer,
    heimGoalkeeperRoster, heimActiveRoster, heimBenchRoster,
    gastGoalkeeperRoster, gastActiveRoster, gastBenchRoster,
    heimPanelTitle, gastPanelTitle,
    protokollAusgabe,
    statistikTabelleBody, rosterListe, wurfbildModal, wurfbilderContainer, wurfbilderStatsModal,
    gegnerNummerTitel, gegnerNummerModal, neueGegnerNummer, bekannteGegnerListe,
    // aktionsMenueTitel, aktionsMenue, aktionVorauswahl, // Removed
    kommentarBereich,
    playerNameInput, playerNumberInput, playerTorwartInput, editPlayerIndex, addPlayerForm, cancelEditButton,
    spielBeendenButton, historieBereich, historieListe, backToStartFromHistory, historyButton,
    historieDetailBereich, backToHistoryList, histDetailTeams, histDetailScore, histDetailDate,
    histStatsBody, histStatsGegnerBody,
    histHeatmapSvg, histTabHeatmap, histSubTabTor, histSubTabFeld,

    histContentHeatmap, exportHistorieButton,
    liveGameOverviewModal, liveOverviewStatsBody, liveOverviewStatsGegnerBody,
    liveOverviewHeatmapSvg, liveOverviewTabStats, liveOverviewTabHeatmap,
    liveOverviewContentStats, liveOverviewContentHeatmap, closeLiveGameOverview,
    liveOverviewSubTabTor, liveOverviewSubTabFeld, liveOverviewSubTabKombi,
    liveOverviewHeatmapToreFilter, liveOverviewHeatmapMissedFilter,
    settingsBereich, toggleDarkMode, toggleAuswaertsspiel,
    toggleWurfbildHeim, toggleWurfbildGegner, inputTeamNameHeim, inputTeamNameGegner
} from './dom.js';
import { renderHomeStatsInHistory, renderOpponentStatsInHistory, openPlayerHistoryHeatmap } from './sharedViews.js';

// We need to be careful with circular dependencies. 
// We need to be careful with circular dependencies. 
// ui.js imports game.js for click handlers (loescheProtokollEintrag).
// game.js imports ui.js for update functions.
// This is fine as long as we don't call them at top level.

export let aktuellerWurfbildModus = 'standard';

export function applyTheme() {
    if (spielstand.settings.darkMode) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }

    // Apply document variables for colors
    const isAway = spielstand.settings.isAuswaertsspiel;

    const colorHeim = spielstand.settings.teamColor || '#dc3545';
    const colorGegner = spielstand.settings.teamColorGegner || '#2563eb';

    // Identity Colors (Our Team vs Opponent)
    const ourColor = isAway ? colorGegner : colorHeim;
    const oppColor = isAway ? colorHeim : colorGegner;

    document.documentElement.style.setProperty('--btn-primary', ourColor);
    document.documentElement.style.setProperty('--team-primary-color', ourColor);
    document.documentElement.style.setProperty('--team-opponent-color', oppColor);

    // Side Colors (Heim/Left vs Gegner/Right)
    document.documentElement.style.setProperty('--heim-color', colorHeim);
    document.documentElement.style.setProperty('--gegner-color', colorGegner);

    // Contrast
    const getContrast = (hex) => {
        if (!hex) return '#ffffff';
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 128) ? '#000000' : '#ffffff';
    };

    document.documentElement.style.setProperty('--our-text-color', getContrast(ourColor));
    document.documentElement.style.setProperty('--opponent-text-color', getContrast(oppColor));
    document.documentElement.style.setProperty('--heim-text-color', getContrast(colorHeim));
    document.documentElement.style.setProperty('--gegner-text-color', getContrast(colorGegner));
}

export function applyViewSettings() {
    const showHeim = false; // Removed feature
    const showGegner = false; // Removed feature
    const isGameEnd = spielstand.timer.gamePhase === 5;

    // Tor Tracker Containers removed from DOM, logic removed here.

    const showSidebar = (isGameEnd);

    if (spielstand.uiState === 'game' && showSidebar) {
        statistikSidebar.classList.remove('versteckt');
    } else {
        statistikSidebar.classList.add('versteckt');
    }
}

/**
 * Initializes sidebar group states (collapsed/expanded) based on game state.
 */
export function initSidebarGroups() {
    const liveGroup = document.getElementById('nav-group-live');
    const liveToggle = document.querySelector('[data-group="live"] .nav-group-toggle');
    
    // If no game is active (no log entries), collapse Live Analysis
    const isGameActive = spielstand.gameLog && spielstand.gameLog.length > 0;
    
    if (liveGroup) {
        if (!isGameActive) {
            liveGroup.classList.add('collapsed');
            if (liveToggle) liveToggle.classList.add('rotated');
        } else {
            liveGroup.classList.remove('collapsed');
            if (liveToggle) liveToggle.classList.remove('rotated');
        }
    }
}

export function updateScoreDisplay() {
    const isAway = spielstand.settings.isAuswaertsspiel;

    if (scoreAnzeige && scoreAnzeigeGegner) {
        if (isAway) {
            // When away: Bösperde is RIGHT (teamNameGegner), Opponent is LEFT (teamNameHeim)
            scoreAnzeige.textContent = spielstand.score.heim;  // Left shows opponent (heim after swap)
            scoreAnzeigeGegner.textContent = spielstand.score.gegner;  // Right shows us (gegner after swap)
        } else {
            // When home: Bösperde is LEFT (teamNameHeim), Opponent is RIGHT (teamNameGegner)
            scoreAnzeige.textContent = spielstand.score.heim;  // Left shows us (heim)
            scoreAnzeigeGegner.textContent = spielstand.score.gegner;  // Right shows opponent (gegner)
        }
    } else if (scoreAnzeige) {
        // Fallback for views using old combined display
        if (isAway) {
            scoreAnzeige.textContent = `${spielstand.score.gegner}:${spielstand.score.heim}`;
        } else {
            scoreAnzeige.textContent = `${spielstand.score.heim}:${spielstand.score.gegner}`;
        }
    }

    // Unified Labeling Logic
    const heimName = spielstand.settings.teamNameHeim || 'Heim';
    const gegnerName = spielstand.settings.teamNameGegner || 'Gegner';


    if (teamNameHeimDisplay) teamNameHeimDisplay.textContent = heimName.toUpperCase();
    if (teamNameGegnerDisplay) teamNameGegnerDisplay.textContent = gegnerName.toUpperCase();

    // Roster View Title
    const isOpponentMode = teamToggle && teamToggle.getAttribute('aria-checked') === 'true';
    if (teamHeaderTitle) {
        teamHeaderTitle.textContent = isOpponentMode ? gegnerName : heimName;
    }

    // Heatmap Filter Labels
    if (heatmapHeimLabel) heatmapHeimLabel.textContent = heimName.toUpperCase();
    if (heatmapGegnerLabel) heatmapGegnerLabel.textContent = gegnerName.toUpperCase();
}

export function updateSuspensionDisplay() {
    if (!suspensionContainer) return;
    suspensionContainer.innerHTML = '';

    spielstand.activeSuspensions.forEach(s => {
        const div = document.createElement('div');
        div.className = `suspension-card ${s.type}`;
        const min = Math.floor(s.remaining / 60);
        const sec = s.remaining % 60;
        const timeStr = `${min}:${sec < 10 ? '0' + sec : sec}`;

        div.innerHTML = sanitizeHTML(`
            <div>#${escapeHTML(s.number)}</div>
            <div class="suspension-time"><div class="time">${escapeHTML(timeStr)}</div>
        `);
        suspensionContainer.appendChild(div);
    });

    // Toggle raster redraw if number of suspensions changed (e.g. one expired)
    const prevCount = parseInt(suspensionContainer.dataset.lastCount || "0");
    if (spielstand.activeSuspensions.length !== prevCount) {
        suspensionContainer.dataset.lastCount = spielstand.activeSuspensions.length;
        zeichneSpielerRaster();
    }
}

export function zeichneSpielerRaster() {
    applyGameMode(); // Sync layout classes before redrawing
    
    // Clear all roster grids
    if (heimGoalkeeperRoster) heimGoalkeeperRoster.innerHTML = '';
    if (heimActiveRoster) heimActiveRoster.innerHTML = '';
    if (heimBenchRoster) heimBenchRoster.innerHTML = '';
    if (gastGoalkeeperRoster) gastGoalkeeperRoster.innerHTML = '';
    if (gastActiveRoster) gastActiveRoster.innerHTML = '';
    if (gastBenchRoster) gastBenchRoster.innerHTML = '';

    const isAway = spielstand.settings.isAuswaertsspiel;

    // Determine which data goes to which panel
    let heimPlayers, gastPlayers;
    let heimIsOpponent, gastIsOpponent;
    let heimTeamKey, gastTeamKey;

    if (!isAway) {
        heimPlayers = spielstand.roster || [];
        heimIsOpponent = false;
        heimTeamKey = 'myteam';
        gastPlayers = spielstand.knownOpponents || [];
        gastIsOpponent = true;
        gastTeamKey = 'opponent';
    } else {
        heimPlayers = spielstand.knownOpponents || [];
        heimIsOpponent = true;
        heimTeamKey = 'opponent';
        gastPlayers = spielstand.roster || [];
        gastIsOpponent = false;
        gastTeamKey = 'myteam';
    }

    // Update panel titles
    if (heimPanelTitle) heimPanelTitle.textContent = spielstand.settings.teamNameHeim || 'HEIM';
    if (gastPanelTitle) gastPanelTitle.textContent = spielstand.settings.teamNameGegner || 'GAST';

    // Constants for lineup structure
    const GK_SLOTS = 1;
    const FIELD_SLOTS = 6;

    // Render function for a single team
    const renderTeam = (players, isOpponent, teamKey, gkContainer, activeContainer, benchContainer) => {
        const playersToRender = [...players];

        // --- SECTION VISIBILITY & LABELS ---
        // In Simple Mode, we hide Torwart and Bank containers/headers and show everything in activeContainer
        const isSimple = spielstand.gameMode === 'simple';
        
        if (gkContainer && gkContainer.parentElement) {
            gkContainer.parentElement.style.display = isSimple ? 'none' : 'block';
        }
        if (benchContainer && benchContainer.parentElement) {
            benchContainer.parentElement.style.display = isSimple ? 'none' : 'block';
        }
        
        // Find the "FELDSPIELER" header to change it in Simple mode if we want, or just hide it.
        // Actually, let's just make the activeContainer header generic or hide it.
        if (activeContainer && activeContainer.previousElementSibling) {
            const title = activeContainer.previousElementSibling;
            if (isSimple) title.style.display = 'none';
            else title.style.display = 'block';
        }

        // --- COMPLEX MODE (Slot-Based) ---
        // Create slot arrays - players are placed by their lineupSlot
        // lineupSlot: 'gk' for goalkeeper, 0-5 for field players, null/undefined = bench
        const lineupGK = new Array(GK_SLOTS).fill(null);
        const lineupField = new Array(FIELD_SLOTS).fill(null);
        const bench = [];

        playersToRender.forEach((player, index) => {
            const playerWithIndex = { ...player, originalIndex: players.indexOf(player) };
            const slot = player.lineupSlot;

            if (slot === 'gk' || slot === 'gk0') {
                lineupGK[0] = playerWithIndex;
            } else if (slot === 'gk1') {
                lineupGK[1] = playerWithIndex;
            } else if (typeof slot === 'number' && slot >= 0 && slot < FIELD_SLOTS) {
                lineupField[slot] = playerWithIndex;
            } else {
                bench.push(playerWithIndex);
            }
        });

        // Identify suspended slots
        const activeSuspensions = (spielstand.activeSuspensions || []).filter(s => s.teamKey === teamKey);
        const suspendedSlots = { gk: false, field: new Array(FIELD_SLOTS).fill(false) };
        activeSuspensions.forEach(s => {
            if (s.slotType === 'gk' || s.slotType === 'gk0') suspendedSlots.gk = true;
            else if (s.slotType === 'field' && typeof s.slotIndex === 'number') {
                suspendedSlots.field[s.slotIndex] = true;
            }
        });

        // Render player button
        const renderPlayerButton = (player, container, slotType, slotIndex) => {
            const btn = document.createElement('button');
            btn.draggable = true;
            const index = player.originalIndex;

            const nameDisplay = player.name || '';

            const timeOnField = player.timeOnField || 0;
            const m = Math.floor(timeOnField / 60);
            const s = timeOnField % 60;
            const timeStr = `${m}:${s < 10 ? '0' + s : s}`;

            // Count 2min
            const twoMinCount = (spielstand.gameLog || []).filter(e => {
                if (isOpponent) return e.action === "Gegner 2 min" && e.gegnerNummer == player.number;
                else return e.action === "2 Minuten" && e.playerId == player.number;
            }).length;

            let dotsHtml = '';
            for (let i = 0; i < Math.min(twoMinCount, 2); i++) {
                dotsHtml += '<span class="two-min-dot"></span>';
            }

            btn.innerHTML = sanitizeHTML(`
                    <div class="two-min-indicators">${dotsHtml}</div>
                    <div class="player-time-display" id="time-display-${escapeHTML(teamKey)}-${escapeHTML(player.number)}">${escapeHTML(timeStr)}</div>
                    <div class="spieler-nummer-display">${escapeHTML(player.number)}</div>
                    <span class="spieler-name-display">${escapeHTML(nameDisplay)}</span>
                `);
            btn.className = 'spieler-button action-btn lineup-slot filled';
            if (player.isGoalkeeper) btn.classList.add('torwart');

            // Apply selected class if matched
            const isSelected = (spielstand.selectedPlayer.team === teamKey) && (
                (teamKey === 'myteam' && spielstand.selectedPlayer.index === index) ||
                (teamKey === 'opponent' && spielstand.selectedPlayer.gegnerNummer == player.number)
            );
            if (isSelected) btn.classList.add('selected');

            if (player.disqualified) {
                btn.classList.add('disqualified');
            }

            // Set colors and data
            if (!isOpponent) {
                btn.style.backgroundColor = 'var(--team-primary-color)';
                btn.style.color = 'var(--our-text-color)';
                btn.dataset.index = index;
                btn.dataset.team = 'myteam';
            } else {
                btn.classList.add('gegner-button');
                btn.style.backgroundColor = 'var(--team-opponent-color)';
                btn.style.color = 'var(--opponent-text-color)';
                btn.dataset.gegnerNummer = player.number;
                btn.dataset.team = 'opponent';
                btn.dataset.index = index;
            }

            btn.dataset.action = 'lineup-player';
            btn.dataset.team = teamKey;
            btn.dataset.teamKey = teamKey;
            btn.dataset.slotType = slotType;
            btn.dataset.slotIndex = slotIndex;

            container.appendChild(btn);
        };

        const renderEmptySlot = (container, slotType, slotIndex) => {
            const btn = document.createElement('button');
            btn.draggable = true;
            btn.className = 'spieler-button action-btn lineup-slot empty';
            btn.innerHTML = `<div class="empty-slot-icon" style="font-size: 1.5rem; opacity: 0.5;">+</div>`;
            btn.style.border = '2px dashed rgba(255,255,255,0.1)';
            btn.style.background = 'rgba(255,255,255,0.02)';
            btn.dataset.slotType = slotType;
            btn.dataset.slotIndex = slotIndex;
            btn.dataset.teamKey = teamKey;
            btn.dataset.empty = 'true';
            container.appendChild(btn);
        };

        // Render bench player
        const renderBenchPlayer = (player, container) => {
            const btn = document.createElement('button');
            btn.draggable = true;
            const index = player.originalIndex;

            const nameDisplay = player.name || '';

            const timeOnField = player.timeOnField || 0;
            const m = Math.floor(timeOnField / 60);
            const s = timeOnField % 60;
            const timeStr = `${m}:${s < 10 ? '0' + s : s}`;

            // Count 2min
            const twoMinCount = (spielstand.gameLog || []).filter(e => {
                if (isOpponent) return e.action === "Gegner 2 min" && e.gegnerNummer == player.number;
                else return e.action === "2 Minuten" && e.playerId == player.number;
            }).length;

            let dotsHtml = '';
            for (let i = 0; i < Math.min(twoMinCount, 2); i++) {
                dotsHtml += '<span class="two-min-dot"></span>';
            }

            btn.innerHTML = sanitizeHTML(`
                <div class="two-min-indicators">${dotsHtml}</div>
                <div class="player-time-display" id="time-display-${escapeHTML(teamKey)}-${escapeHTML(player.number)}">${escapeHTML(timeStr)}</div>
                <div class="spieler-nummer-display">${escapeHTML(player.number)}</div>
                <span class="spieler-name-display">${escapeHTML(nameDisplay)}</span>
            `);
            btn.className = 'spieler-button action-btn bench-player';
            if (player.isGoalkeeper) btn.classList.add('torwart');

            // Apply selected class if matched
            const isSelected = (spielstand.selectedPlayer.team === teamKey) && (
                (teamKey === 'myteam' && spielstand.selectedPlayer.index === index) ||
                (teamKey === 'opponent' && spielstand.selectedPlayer.gegnerNummer == player.number)
            );
            if (isSelected) btn.classList.add('selected');

            // NEW: Check if suspended or disqualified
            const isSuspended = (spielstand.activeSuspensions || []).some(s => s.teamKey === teamKey && s.number == player.number);
            if (isSuspended) btn.classList.add('suspended');

            if (player.disqualified) {
                btn.classList.add('disqualified');
                // Optional: remove suspended class if we want Red to override visual, 
                // but usually they are both (serving time + disqualified).
                // "Ausgegraut" suggests grey.
            }

            if (!isOpponent) {
                btn.style.backgroundColor = 'var(--team-primary-color)';
                btn.style.color = 'var(--our-text-color)';
                btn.dataset.index = index;
                btn.dataset.team = 'myteam';
                btn.dataset.teamKey = 'myteam';
            } else {
                btn.classList.add('gegner-button');
                btn.style.backgroundColor = 'var(--team-opponent-color)';
                btn.style.color = 'var(--opponent-text-color)';
                btn.dataset.gegnerNummer = player.number;
                btn.dataset.team = 'opponent';
                btn.dataset.teamKey = 'opponent';
                btn.dataset.index = index;
            }

            btn.dataset.teamKey = teamKey;
            btn.dataset.isBench = 'true';

            container.appendChild(btn);
        };

        // Render GK slots (1 slot)
        if (gkContainer) {
            for (let i = 0; i < GK_SLOTS; i++) {
                const sType = 'gk';
                if (lineupGK[i]) {
                    renderPlayerButton(lineupGK[i], gkContainer, sType, i);
                } else if (suspendedSlots[sType]) {
                    const btn = document.createElement('button');
                    btn.className = 'spieler-button action-btn lineup-slot suspended';
                    btn.innerHTML = `<div class="empty-slot-icon">2min</div>`;
                    gkContainer.appendChild(btn);
                } else {
                    renderEmptySlot(gkContainer, sType, i);
                }
            }
        }

        // Render Field Player slots (6 slots)
        if (activeContainer) {
            for (let i = 0; i < FIELD_SLOTS; i++) {
                if (lineupField[i]) {
                    renderPlayerButton(lineupField[i], activeContainer, 'field', i);
                } else if (suspendedSlots.field[i]) {
                    const btn = document.createElement('button');
                    btn.className = 'spieler-button action-btn lineup-slot suspended';
                    btn.innerHTML = `<div class="empty-slot-icon">2min</div>`;
                    activeContainer.appendChild(btn);
                } else {
                    renderEmptySlot(activeContainer, 'field', i);
                }
            }
        }

        // Render Bench (all remaining players)
        if (benchContainer) {
            if (bench.length === 0) {
                benchContainer.innerHTML = '<div style="color: var(--text-muted); font-size: 0.7rem; text-align: center; grid-column: 1/-1;">-</div>';
            } else {
                bench.forEach(p => renderBenchPlayer(p, benchContainer));
            }
        }

        // --- SIMPLE MODE: UNIFIED GRID (MOVED HERE TO FIX TDZ ERROR) ---
        if (isSimple) {
            gkContainer && (gkContainer.innerHTML = '');
            benchContainer && (benchContainer.innerHTML = '');
            activeContainer.innerHTML = '';
            
            playersToRender.sort((a, b) => (parseInt(a.number) || 0) - (parseInt(b.number) || 0));

            playersToRender.forEach((player, index) => {
                const originalIdx = players.indexOf(player);
                renderPlayerButton({ ...player, originalIndex: originalIdx }, activeContainer, 'field', index);
            });
        }
    };

    // Render both teams
    renderTeam(heimPlayers, heimIsOpponent, heimTeamKey, heimGoalkeeperRoster, heimActiveRoster, heimBenchRoster);
    renderTeam(gastPlayers, gastIsOpponent, gastTeamKey, gastGoalkeeperRoster, gastActiveRoster, gastBenchRoster);
}

export function updateProtokollAnzeige() {
    protokollAusgabe.innerHTML = '';

    spielstand.gameLog.slice().reverse().forEach((eintrag, idxReverse) => {
        const index = spielstand.gameLog.length - 1 - idxReverse;
        const div = document.createElement('div');
        div.className = 'log-entry';

        // Add specific classes based on action type
        if (eintrag.action.toLowerCase().includes('tor') && !eintrag.action.toLowerCase().includes('gegner')) {
            div.classList.add('tor');
        } else if (eintrag.action.toLowerCase().includes('gegner tor') || (eintrag.gegnerNummer && eintrag.action.toLowerCase().includes('tor'))) {
            div.classList.add('gegner-tor');
        } else if (eintrag.action.toLowerCase().includes('gelb') || eintrag.action.toLowerCase().includes('2 min') || eintrag.action.toLowerCase().includes('rot')) {
            div.classList.add('strafe');
        } else if (eintrag.action.toLowerCase().includes('gehalten') || eintrag.action.toLowerCase().includes('parade') || (eintrag.wurfbild && eintrag.wurfbild.isSave)) {
            div.classList.add('gehalten');
        }

        const spielstandText = eintrag.spielstand ? ` (${eintrag.spielstand})` : '';

        let contentHtml = `<span class="log-time">${eintrag.time}</span>`;
        let text = '';

        if (eintrag.playerId) {
            text = `#${escapeHTML(eintrag.playerId)} (${escapeHTML(eintrag.playerName)}): ${escapeHTML(eintrag.action)}`;
        } else if (eintrag.gegnerNummer) {
            text = `${escapeHTML(getOpponentLabel())} #${escapeHTML(eintrag.gegnerNummer)}: ${escapeHTML(eintrag.action)}`;
        } else {
            text = `${escapeHTML(eintrag.action.toUpperCase())}`;
        }

        if (eintrag.kommentar) {
            text += ` - ${escapeHTML(eintrag.kommentar)}`;
        }

        contentHtml += `<span class="log-text"><strong>${text}</strong><span style="opacity: 0.6; margin-left:8px;">${escapeHTML(spielstandText)}</span></span>`;
        contentHtml += `<span class="log-delete" data-index="${index}" title="Löschen"><i data-lucide="trash-2" style="width: 16px; height: 16px;"></i></span>`;

        div.innerHTML = sanitizeHTML(contentHtml);
        protokollAusgabe.appendChild(div);
    });

    if (window.lucide) window.lucide.createIcons();
}



export function zeichneStatistikTabelle(statsData) {
    if (!statistikTabelleBody) return;

    statistikTabelleBody.innerHTML = '';

    statsData.forEach(stats => {
        const tr = document.createElement('tr');
        const displayName = stats.name ? `#${stats.number} ${stats.name}` : `#${stats.number}`;

        const timeOnField = stats.timeOnField || 0;
        const m = Math.floor(timeOnField / 60);
        const s = timeOnField % 60;
        const timeStr = `${m}:${s < 10 ? '0' + s : s}`;

        const feldtore = stats.tore - stats.siebenMeterTore;
        const totalWuerfe = stats.tore + stats.fehlwurf;
        const quote = totalWuerfe > 0 ? Math.round((stats.tore / totalWuerfe) * 100) : 0;

        tr.innerHTML = sanitizeHTML(`
            <td>${escapeHTML(displayName)}</td>
            <td>${escapeHTML(timeStr)}</td>
            <td>${escapeHTML(stats.tore)}</td>
            <td>${escapeHTML(feldtore)}</td>
            <td>${escapeHTML(stats.siebenMeterTore)}/${escapeHTML(stats.siebenMeterVersuche)}</td>
            <td>${escapeHTML(stats.fehlwurf)}</td>
            <td>${escapeHTML(stats.assist)}</td>
            <td>${escapeHTML(quote)}%</td>
            <td>${escapeHTML(stats.ballverlust)}</td>
            <td>${escapeHTML(stats.stuermerfoul)}</td>
            <td>${escapeHTML(stats.block)}</td>
            <td>${escapeHTML(stats.gewonnen1v1)}</td>
            <td>${escapeHTML(stats.oneOnOneLost)}</td>
            <td>${escapeHTML(stats.rausgeholt7m)}</td>
            <td>${escapeHTML(stats.rausgeholt2min)}</td>
            <td>${escapeHTML(stats.gelb)}</td>
            <td>${escapeHTML(stats.zweiMinuten)}</td>
            <td>${escapeHTML(stats.rot)}</td>
        `);
        tr.style.cursor = 'pointer';
        tr.title = 'Klicken für Details und Wurfquote';
        tr.addEventListener('click', () => showLivePlayerDetails(stats));

        statistikTabelleBody.appendChild(tr);
    });
}

export function showLivePlayerDetails(stats) {
    // Generate PlayType Table
    let playTypeRows = '';
    const types = [
        { key: 'tempo_gegenstoss', label: 'Tempo Gegenstoß' },
        { key: 'schnelle_mitte', label: 'Schnelle Mitte' },
        { key: 'spielzug', label: 'Spielzug' },
        { key: 'freies_spiel', label: 'Freies Spiel' }
    ];

    if (stats.playStats) {
        playTypeRows = types.map(type => {
            const s = stats.playStats[type.key] || { tore: 0, fehlwurf: 0 };
            const attempts = s.tore + s.fehlwurf;
            const quote = attempts > 0 ? Math.round((s.tore / attempts) * 100) + '%' : '-';
            return sanitizeHTML(`
                <tr>
                    <td style="text-align: left; padding: 6px;">${escapeHTML(type.label)}</td>
                    <td style="text-align: center;">${escapeHTML(s.tore)}</td>
                    <td style="text-align: center;">${escapeHTML(attempts)}</td>
                    <td style="text-align: center;">${escapeHTML(quote)}</td>
                </tr>
            `);
        }).join('');
    } else {
        playTypeRows = '<tr><td colspan="4" style="text-align:center;">Keine Daten</td></tr>';
    }

    // Create Modal HTML
    const modalHtml = sanitizeHTML(`
        <div id="livePlayerDetailModal" class="modal-overlay" style="z-index: 9999; display: flex; align-items: center; justify-content: center;">
            <div class="shadcn-modal-content" style="max-width: 400px; width: 95%;">
                <div class="shadcn-modal-header" style="justify-content: space-between;">
                    <h3 style="margin: 0;">${escapeHTML(stats.name || 'Spieler #' + stats.number)}</h3>
                    <button class="close-modal-btn" style="position: relative; top: 0; right: 0;">&times;</button>
                </div>
                <div class="shadcn-modal-body" style="padding-top: 10px;">
                    <div class="info-block" style="margin-bottom: 15px; background: var(--bg-secondary); padding: 10px; border-radius: 8px;">
                        <div style="font-size: 0.9rem; color: var(--text-muted);">Gesamt Quote</div>
                        <div style="font-size: 1.2rem; font-weight: bold;">
                            ${escapeHTML(stats.tore + stats.fehlwurf > 0 ? Math.round((stats.tore / (stats.tore + stats.fehlwurf)) * 100) + '%' : '0%')}
                            <span style="font-size: 0.8rem; font-weight: normal; margin-left: 5px;">(${escapeHTML(stats.tore)}/${escapeHTML(stats.tore + stats.fehlwurf)})</span>
                        </div>
                    </div>

                    <h4 style="font-size: 0.9rem; margin-bottom: 8px; color: var(--text-muted);">Wurfquote nach Situation</h4>
                    <div class="table-container">
                        <table class="season-table" style="width: 100%; font-size: 0.85rem;">
                            <thead>
                                <tr style="border-bottom: 1px solid var(--border-color);">
                                    <th style="text-align: left; padding: 6px;">Art</th>
                                    <th style="padding: 6px;">Tore</th>
                                    <th style="padding: 6px;">Würfe</th>
                                    <th style="padding: 6px;">%</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${playTypeRows}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="shadcn-modal-footer" style="padding-top: 15px;">
                    <button class="shadcn-btn-primary close-modal-btn-action" style="width: 100%;">Schließen</button>
                </div>
            </div>
        </div>
    `);

    // Append to body
    const wrapper = document.createElement('div');
    wrapper.innerHTML = modalHtml;
    document.body.appendChild(wrapper.firstElementChild);

    // Bind Close Events
    const modal = document.getElementById('livePlayerDetailModal');
    const closeBtns = modal.querySelectorAll('.close-modal-btn, .close-modal-btn-action');

    const close = () => {
        modal.remove();
    };

    closeBtns.forEach(btn => btn.addEventListener('click', close));
    modal.addEventListener('click', (e) => {
        if (e.target === modal) close();
    });
}

export function zeichneRosterListe(showGastTab = false) {
    rosterListe.innerHTML = '';

    const isAway = spielstand.settings.isAuswaertsspiel;

    // Logic: 
    // If showGastTab is false (Heim): Show opponents if we are away, else show our roster.
    // If showGastTab is true (Gast): Show our roster if we are away, else show opponents.
    const isShowingOpponents = showGastTab ? !isAway : isAway;
    const isShowingOurTeam = !isShowingOpponents;

    const list = isShowingOurTeam ? (spielstand.roster || []) : (spielstand.knownOpponents || []);

    if (list.length === 0) {
        const teamLabel = showGastTab ? getOpponentLabel() : getMyTeamLabel();
        rosterListe.innerHTML = sanitizeHTML(`<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">Noch keine Spieler im ${escapeHTML(teamLabel)}-Team hinzugefügt.</div>`);
        return;
    }

    list.forEach((player, index) => {
        const div = document.createElement('div');
        div.className = 'roster-player-card';

        // Read-only state
        const infoDiv = document.createElement('div');
        infoDiv.className = 'roster-player-info';
        infoDiv.innerHTML = sanitizeHTML(`
            <div class="roster-player-number">${escapeHTML(player.number)}</div>
            <div class="roster-player-name">${player.name ? escapeHTML(player.name) : '<i>Kein Name</i>'}</div>
        `);

        // Edit state (hidden)
        const editDiv = document.createElement('div');
        editDiv.className = 'roster-inline-edit-grid versteckt';
        editDiv.innerHTML = sanitizeHTML(`
            <div class="edit-row-name">
                <input type="text" class="shadcn-input inline-name-input" value="${escapeHTML(player.name || '')}" placeholder="Name">
            </div>
            <div class="edit-row-controls">
                <input type="number" class="shadcn-input inline-number-input" value="${escapeHTML(player.number)}" min="1" max="99" placeholder="Nr.">
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; margin-right: 5px;">
                     <label style="font-size: 0.6rem; margin-bottom: 2px;">TW</label>
                     <input type="checkbox" class="inline-tw-input" ${player.isGoalkeeper ? 'checked' : ''} style="cursor: pointer;">
                </div>
                <div class="inline-edit-actions">
                    <button class="inline-save-btn shadcn-btn-primary shadcn-btn-sm" title="Speichern" data-action="save-player" data-index="${index}" data-is-opponent="${isShowingOpponents}">✓</button>
                    <button class="inline-cancel-btn shadcn-btn-outline shadcn-btn-sm" title="Abbrechen" data-action="cancel-edit">✕</button>
                </div>
            </div>
        `);

        // Actions
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'roster-player-actions';
        actionsDiv.style.display = 'flex';
        actionsDiv.style.alignItems = 'center';
        actionsDiv.style.gap = '8px';

        if (player.isGoalkeeper) {
            const twBadge = document.createElement('span');
            twBadge.textContent = "TW";
            twBadge.style.fontSize = "0.75rem";
            twBadge.style.fontWeight = "700";
            // Use identity-based colors
            const identityColor = isShowingOurTeam ? 'var(--team-primary-color)' : 'var(--team-opponent-color)';
            twBadge.style.color = identityColor;
            twBadge.style.border = `1px solid ${identityColor}`;
            twBadge.style.borderRadius = "4px";
            twBadge.style.padding = "1px 4px";
            actionsDiv.appendChild(twBadge);
        }

        const editBtn = document.createElement('button');
        editBtn.className = 'shadcn-btn-outline shadcn-btn-sm roster-edit-btn';
        editBtn.innerHTML = 'Bearbeiten';

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'shadcn-btn-outline shadcn-btn-sm delete-player';
        deleteBtn.style.color = 'hsl(var(--destructive))';
        deleteBtn.style.borderColor = 'hsl(var(--destructive))';
        deleteBtn.innerHTML = 'Löschen';
        deleteBtn.dataset.index = index;
        deleteBtn.dataset.action = 'delete-player';
        if (isShowingOpponents) deleteBtn.dataset.isOpponent = 'true';

        // NEW: Permissions Check
        const uid = getAuthUid();
        const trainer = isUserTrainer();
        // Fallback for isMe: check if this player's name matches my assigned name
        const myName = (spielstand.rosterAssignments && uid) ? spielstand.rosterAssignments[uid] : null;
        const isMe = myName && player.name && myName === player.name;

        // Trainers can edit anyone. Players can edit themselves.
        if (trainer || (isMe && isShowingOurTeam)) {
            actionsDiv.appendChild(editBtn);
            // Only trainers and the player themselves can delete (though deleting yourself is usually a trainer task)
            if (trainer || isMe) {
                actionsDiv.appendChild(deleteBtn);
            }
        }

        div.appendChild(infoDiv);
        div.appendChild(editDiv);
        div.appendChild(actionsDiv);

        // Handlers - Use direct listeners ONLY for UI toggle
        editBtn.onclick = () => {
            infoDiv.classList.add('versteckt');
            actionsDiv.classList.add('versteckt');
            editDiv.classList.remove('versteckt');
            editDiv.querySelector('.inline-name-input').focus();
        };

        const cancelEdit = () => {
            infoDiv.classList.remove('versteckt');
            actionsDiv.classList.remove('versteckt');
            editDiv.classList.add('versteckt');
        };

        editDiv.querySelector('.inline-cancel-btn').onclick = cancelEdit;

        rosterListe.appendChild(div);
    });

    if (window.lucide) window.lucide.createIcons();
}

export function oeffneWurfbildModal(modus) {
    aktuellerWurfbildModus = modus;
    wurfbildModal.classList.remove('versteckt');
}

export function schliesseWurfbildModal() {
    wurfbildModal.classList.add('versteckt');
    aktuellerWurfbildModus = 'standard';
}

export function zeigeWurfstatistik() {
    const daten = berechneWurfbilder();
    if (!wurfbilderContainer) {
        console.error("wurfbilderContainer not found!");
        return;
    }
    wurfbilderContainer.innerHTML = '';
    const renderPlayerGroup = (playerData, is7m = false) => {
        const div = document.createElement('div');
        div.className = 'player-shot-card';
        let tore = 0; let gehalten = 0; let vorbei = 0;
        const isOpponent = playerData.isOpponent || false;

        playerData.wuerfe.forEach(w => {
            const act = (w.action || "").toLowerCase();
            const isSave = act.includes('gehalten') || act.includes('parade') || (w.isSave === true) || (w.color === 'yellow');
            const isMiss = act.includes('vorbei') || act.includes('verworfen') || act.includes('fehlwurf') || act.includes('block') || (w.color === 'gray');

            // Strictly ONLY count as Goal if it contains 'tor' and is NOT a save or miss
            if (isSave) {
                gehalten++;
            } else if (isMiss) {
                vorbei++;
            } else if (!isSave && !isMiss && act.includes('tor')) {
                tore++;
            }
        });

        const totalWuerfe = tore + gehalten + vorbei;
        const quote = totalWuerfe > 0 ? Math.round((tore / totalWuerfe) * 100) : 0;

        const infoDiv = document.createElement('div');
        infoDiv.className = 'player-shot-info';
        infoDiv.innerHTML = sanitizeHTML(`<strong>#${escapeHTML(playerData.number)} ${escapeHTML(playerData.name)}${is7m ? ' (7m)' : ''}</strong>${escapeHTML(tore)} Tore${gehalten > 0 ? `, ${escapeHTML(gehalten)} Geh.` : ''}${vorbei > 0 ? `, ${escapeHTML(vorbei)} Vorb.` : ''} <strong>(${escapeHTML(quote)}%)</strong>`);
        div.appendChild(infoDiv);

        const hasWurfposition = is7m ? false : playerData.wuerfe.some(w => w.wurfposition);
        const hasWurfbild = playerData.wuerfe.some(w => w.x && w.y);

        // Prepare points for drawing functions
        const mapWurfToPoint = (w) => {
            const act = (w.action || "").toLowerCase();
            const isSave = act.includes('gehalten') || act.includes('parade') || (w.isSave === true) || (w.color === 'yellow');
            const isMiss = act.includes('vorbei') || act.includes('verworfen') || act.includes('fehlwurf') || act.includes('block') || (w.color === 'gray');
            const isBlocked = act.includes('block');

            return {
                x: parseFloat(w.x || (w.wurfposition ? w.wurfposition.x : 0)),
                y: parseFloat(w.y || (w.wurfposition ? w.wurfposition.y : 0)),
                isOpponent: isOpponent,
                isGoal: isGoal,
                isMiss: isMiss || isSave,
                isSave: isSave,
                isBlocked: isBlocked,
                action: act // Pass action for fallback check
            };
        };

        const pointsTor = playerData.wuerfe
            .filter(w => w.x && w.y)
            .map(w => {
                const p = mapWurfToPoint(w);
                p.x = parseFloat(w.x);
                p.y = parseFloat(w.y);
                return p;
            });
        const pointsFeld = playerData.wuerfe
            .filter(w => w.wurfposition)
            .map(w => {
                const p = mapWurfToPoint(w);
                p.x = parseFloat(w.wurfposition.x);
                p.y = parseFloat(w.wurfposition.y);
                return p;
            });

        const prefix = 'wb_' + (playerData.number || '0') + (isOpponent ? 'opp' : 'hm');
        let svgContent = '';
        let viewBox = '0 0 200 200';

        if (hasWurfposition && hasWurfbild) {
            viewBox = '0 0 300 500';

            // Combined
            const scaleGoal = 0.35;
            const xOffsetGoal = (300 - (300 * scaleGoal)) / 2;
            const yOffsetGoal = 24;
            const yOffsetField = 80;
            let linesContent = '<g>';

            playerData.wuerfe.forEach(w => {
                if (w.x && w.y && w.wurfposition) {
                    let rawGx = 25 + (parseFloat(w.x) / 100) * 250;
                    let rawGy = 10 + (parseFloat(w.y) / 100) * 180;
                    rawGx = Math.max(-10, Math.min(310, rawGx));
                    rawGy = Math.max(-55, Math.min(195, rawGy));

                    const gx = xOffsetGoal + (rawGx * scaleGoal);
                    const gy = yOffsetGoal + (rawGy * scaleGoal);

                    const fx = 10 + (parseFloat(w.wurfposition.x) / 100) * 280;
                    const fy = 10 + (parseFloat(w.wurfposition.y) / 100) * 380 + yOffsetField;

                    const act = (w.action || "").toLowerCase();
                    const isMiss = w.color === 'gray' || act.includes('vorbei') || act.includes('verworfen') || act.includes('fehlwurf') || act.includes('gehalten') || act.includes('parade') || act.includes('block') || w.isSave;
                    const color = isMiss ? 'rgba(108, 117, 125, 0.5)' : (isOpponent ? 'rgba(13, 110, 253, 0.5)' : 'rgba(220, 53, 69, 0.5)');
                    linesContent += `<line x1="${fx}" y1="${fy}" x2="${gx}" y2="${gy}" stroke="${color}" stroke-width="2" />`;
                }
            });
            linesContent += '</g>';

            svgContent += drawFieldHeatmap(pointsFeld, yOffsetField, prefix);
            svgContent += `<g transform="translate(${xOffsetGoal}, ${yOffsetGoal}) scale(${scaleGoal})">`;
            svgContent += drawGoalHeatmap(pointsTor, 0, prefix);
            svgContent += `</g>`;
            svgContent += linesContent;

        } else if (hasWurfposition) {
            viewBox = '0 0 300 400';
            svgContent = drawFieldHeatmap(pointsFeld, 0, prefix);
        } else if (hasWurfbild) {
            viewBox = '0 -60 300 260';
            svgContent = drawGoalHeatmap(pointsTor, 0, prefix);
        }

        if (svgContent) {
            const svgContainer = document.createElement('div');
            svgContainer.className = 'combined-shot-visual';
            svgContainer.innerHTML = sanitizeHTML(`<svg viewBox="${escapeHTML(viewBox)}" width="200" height="280">${svgContent}</svg>`);
            div.appendChild(svgContainer);
        }
        return div;
    };

    if (daten.heim.length > 0) {
        const h4 = document.createElement('h4'); h4.textContent = spielstand.settings.teamNameHeim;
        const groupDiv = document.createElement('div'); groupDiv.className = 'wurfbild-gruppe'; groupDiv.appendChild(h4);
        daten.heim.sort((a, b) => a.number - b.number).forEach(p => groupDiv.appendChild(renderPlayerGroup(p)));
        wurfbilderContainer.appendChild(groupDiv);
    }
    if (daten.heim7m && daten.heim7m.length > 0) {
        const h4 = document.createElement('h4'); h4.textContent = spielstand.settings.teamNameHeim + " (7m)";
        const groupDiv = document.createElement('div'); groupDiv.className = 'wurfbild-gruppe'; groupDiv.appendChild(h4);
        daten.heim7m.sort((a, b) => a.number - b.number).forEach(p => groupDiv.appendChild(renderPlayerGroup(p, true)));
        wurfbilderContainer.appendChild(groupDiv);
    }
    if (daten.gegner.length > 0) {
        const h4 = document.createElement('h4'); h4.textContent = spielstand.settings.teamNameGegner + " (" + getOpponentLabel() + " Feldtore)";
        const groupDiv = document.createElement('div'); groupDiv.className = 'wurfbild-gruppe'; groupDiv.appendChild(h4);
        daten.gegner.sort((a, b) => a.number - b.number).forEach(p => groupDiv.appendChild(renderPlayerGroup(p)));
        wurfbilderContainer.appendChild(groupDiv);
    }
    if (daten.gegner7m.length > 0) {
        const h4 = document.createElement('h4'); h4.textContent = getOpponentLabel() + " 7m";
        const groupDiv = document.createElement('div'); groupDiv.className = 'wurfbild-gruppe'; groupDiv.appendChild(h4);
        daten.gegner7m.sort((a, b) => a.number - b.number).forEach(p => groupDiv.appendChild(renderPlayerGroup(p, true)));
        wurfbilderContainer.appendChild(groupDiv);
    }
    if (daten.heim.length === 0 && (!daten.heim7m || daten.heim7m.length === 0) && daten.gegner.length === 0 && daten.gegner7m.length === 0) {
        wurfbilderContainer.innerHTML = '<p style="text-align:center; padding:20px;">Noch keine Wurfbilder aufgezeichnet.</p>';
    }
    wurfbilderStatsModal.classList.remove('versteckt');
}

export function oeffneGegnerNummerModal(type, currentGegnerActionTypeSetter) {
    // We need to set the action type in game.js or pass it back
    // Better: game.js calls this and handles state. 
    // But here we update UI.
    // Let's say game.js sets the state variable and calls this.

    if (type === '2min') {
        gegnerNummerTitel.textContent = `2 Minuten für (${getOpponentLabel()})`;
    } else {
        gegnerNummerTitel.textContent = `Torschütze (${getOpponentLabel()})`;
    }

    gegnerNummerModal.classList.remove('versteckt');
    renderGegnerButtons();
    neueGegnerNummer.value = '';
    neueGegnerName.value = '';
    if (neueGegnerTorwart) neueGegnerTorwart.checked = false;
    neueGegnerNummer.focus();
}

export function renderGegnerButtons() {
    bekannteGegnerListe.innerHTML = '';
    const sortierteGegner = spielstand.knownOpponents.sort((a, b) => a.number - b.number);

    sortierteGegner.forEach(opponent => {
        const btn = document.createElement('button');
        const displayText = opponent.name ? `#${opponent.number} - ${opponent.name}` : `#${opponent.number}`;
        btn.textContent = displayText;
        btn.className = 'gegner-num-btn';
        btn.dataset.nummer = opponent.number; // For event delegation
        bekannteGegnerListe.appendChild(btn);
    });
}

export function renderActionMenus(isGoalkeeper) {
    const aktionsMenueBody = aktionsMenue.querySelector('.shadcn-modal-body');
    const aktionsVorauswahlBody = aktionVorauswahl.querySelector('.shadcn-modal-body');

    // Helper to create button
    const createBtn = (label, action, classes = []) => {
        const btn = document.createElement('button');
        btn.className = `shadcn-btn-outline ${classes.join(' ')}`;
        btn.textContent = label;
        if (action) btn.dataset.aktion = action;
        return btn;
    };

    // Helper to clear and append
    const populate = (container, buttons) => {
        container.innerHTML = '';
        buttons.forEach(btn => container.appendChild(btn));
    };

    // --- Configurations ---
    const fieldMain = [
        createBtn('Tor', 'Tor'),
        createBtn('Fehlwurf', 'Fehlwurf'),
        createBtn('7m', '7m'),
        createBtn('Anderes', 'Anderes'), // Trigger
        createBtn('Gelbe Karte', 'Gelbe Karte', ['strafe-gelb']),
        createBtn('2 Minuten', '2 Minuten', ['strafe-zeit']),
        createBtn('Rote Karte', 'Rote Karte', ['strafe-rot'])
    ];

    const fieldSub = [
        createBtn('Steal', 'Steal'),
        createBtn('7m + 2min Provoziert', '7m+2min'),
        createBtn('TG Pass', 'TG Pass'),
        createBtn('Assist', 'Assist'),
        createBtn('Fehlpass', 'Fehlpass'),
        createBtn('Technischer Fehler', 'Technischer Fehler'),
        createBtn('Sonstiges', 'Sonstiges')
    ];

    const goalieMain = [
        createBtn('Parade', 'Parade'),
        createBtn('TG Pass', 'TG Pass'),
        createBtn('Fehlpass', 'Fehlpass'),
        createBtn('Anderes', 'Anderes'), // Trigger
        createBtn('Gelbe Karte', 'Gelbe Karte', ['strafe-gelb']),
        createBtn('2 Minuten', '2 Minuten', ['strafe-zeit']),
        createBtn('Rote Karte', 'Rote Karte', ['strafe-rot'])
    ];

    const goalieSub = [
        createBtn('Tor', 'Tor'),
        createBtn('Fehlwurf', 'Fehlwurf'),
        createBtn('7m', '7m'),
        createBtn('Steal', 'Steal'),
        createBtn('Assist', 'Assist'),
        createBtn('Technischer Fehler', 'Technischer Fehler'),
        createBtn('Sonstiges', 'Sonstiges')
    ];

    // --- Render ---
    if (isGoalkeeper) {
        populate(aktionsMenueBody, goalieMain);
        populate(aktionsVorauswahlBody, goalieSub);
    } else {
        populate(aktionsMenueBody, fieldMain);
        populate(aktionsVorauswahlBody, fieldSub);
    }
}

export function oeffneAktionsMenueUI(index, playerOverride = null) {
    const player = playerOverride || spielstand.roster[index];
    const isGoalkeeper = player.isGoalkeeper || false;

    renderActionMenus(isGoalkeeper);

    const displayName = player.name ? `#${player.number} (${player.name})` : `#${player.number}`;
    aktionsMenueTitel.textContent = `Aktion für ${displayName}`;
    aktionsMenue.classList.remove('versteckt');
}

export function schliesseAktionsMenueUI() {
    aktionsMenue.classList.add('versteckt');
    aktionVorauswahl.classList.add('versteckt');
    kommentarBereich.classList.add('versteckt');
}

export function oeffneEditModusUI(index) {
    const player = spielstand.roster[index];
    playerNameInput.value = player.name;
    playerNumberInput.value = player.number;
    playerTorwartInput.checked = player.isGoalkeeper || false;
    editPlayerIndex.value = index;
    addPlayerForm.querySelector('button[type="submit"]').textContent = 'Speichern';
    cancelEditButton.classList.remove('versteckt');
}

export function schliesseEditModusUI() {
    playerNameInput.value = '';
    playerNumberInput.value = '';
    playerTorwartInput.checked = false;
    editPlayerIndex.value = '';
    addPlayerForm.querySelector('button[type="submit"]').textContent = 'Hinzufügen';
    cancelEditButton.classList.add('versteckt');
}


// --- Live Game Overview ---
export function showLiveGameOverview() {
    liveGameOverviewModal.classList.remove('versteckt');

    // Populate Score Header
    const scoreHeim = document.getElementById('liveOverviewScoreHeim');
    const scoreGegner = document.getElementById('liveOverviewScoreGegner');
    const teamHeim = document.getElementById('liveOverviewTeamHeim');
    const teamGegner = document.getElementById('liveOverviewTeamGegner');
    const timeAnzeige = document.getElementById('liveOverviewTime');

    if (scoreHeim) scoreHeim.textContent = spielstand.score.heim;
    if (scoreGegner) scoreGegner.textContent = spielstand.score.gegner;
    if (teamHeim) teamHeim.textContent = spielstand.settings.teamNameHeim;
    if (teamGegner) teamGegner.textContent = spielstand.settings.teamNameGegner;
    if (timeAnzeige) {
        const formatted = (typeof timerAnzeige !== 'undefined' && timerAnzeige && timerAnzeige.textContent) || "00:00";
        timeAnzeige.textContent = `Spielzeit: ${formatted}`;
    }

    // Stats
    const stats = berechneStatistiken(spielstand.gameLog, spielstand.roster);
    const gegnerStats = berechneGegnerStatistiken(spielstand.gameLog);

    const isAway = spielstand.settings.isAuswaertsspiel;

    // If Away: My Team (stats) is Gast (Body2), Opponent (gegnerStats) is Heim (Body1)
    // If Home: My Team (stats) is Heim (Body1), Opponent (gegnerStats) is Gast (Body2)

    if (isAway) {
        renderHomeStatsInHistory(liveOverviewStatsGegnerBody, stats, spielstand.gameLog, true);
        renderOpponentStatsInHistory(liveOverviewStatsBody, gegnerStats, spielstand.gameLog, null, true, false, null, showLivePlayerDetails);
    } else {
        renderHomeStatsInHistory(liveOverviewStatsBody, stats, spielstand.gameLog, true);
        renderOpponentStatsInHistory(liveOverviewStatsGegnerBody, gegnerStats, spielstand.gameLog, null, true, false, null, showLivePlayerDetails);
    }

    // Initial Tab State
    liveOverviewContentStats.classList.remove('versteckt');
    liveOverviewContentHeatmap.classList.add('versteckt');
    liveOverviewTabStats.classList.add('active');
    liveOverviewTabHeatmap.classList.remove('active');

    // Heatmap Logic
    function updateLiveHeatmap(tab = 'tor') {
        const type = 'combined'; // For overview usually combined
        // Wait, renderHeatmap expects gameLog for data.
        // We need to set context for filters.
        setCurrentHeatmapContext('liveOverview');
        setCurrentHeatmapTab(tab); // Custom helper or reuse existing?

        // renderHeatmap(svg, type, team, filterTore, filterMissed, gameLogOverride)
        // We need to implement filter read logic inside renderHeatmap OR pass filtered data.
        // renderHeatmap reads DOM elements based on context!
        // So we need to ensure renderHeatmap supports 'liveOverview' context.

        // Actually renderHeatmap in heatmap.js currently supports 'history', 'season', 'main'.
        // We should check heatmap.js to see if we can easily add 'liveOverview'.
        // Or we just pass the modal elements if renderHeatmap is flexible.
        // renderHeatmap uses:
        // const context = currentHeatmapContext;
        // const svg = context === 'history' ? histHeatmapSvg : ...

        // So we need to update heatmap.js to support 'liveOverview'.
        // OR we manually call render logic.

        // For now, let's just implement the tabs switch and stats first.
        // Heatmap integration might require heatmap.js update.
    }

    // Tabs
    liveOverviewTabStats.onclick = () => {
        liveOverviewTabStats.classList.add('active');
        liveOverviewTabHeatmap.classList.remove('active');
        liveOverviewContentStats.classList.remove('versteckt');
        liveOverviewContentHeatmap.classList.add('versteckt');
    };

    liveOverviewTabHeatmap.onclick = () => {
        liveOverviewTabStats.classList.remove('active');
        liveOverviewTabHeatmap.classList.add('active');
        liveOverviewContentStats.classList.add('versteckt');
        liveOverviewContentHeatmap.classList.remove('versteckt');

        // Init heatmap with default tab
        setCurrentHeatmapContext('liveOverview');
        setCurrentHeatmapTab('tor');
        liveOverviewSubTabTor.classList.add('active');
        liveOverviewSubTabFeld.classList.remove('active');
        liveOverviewSubTabKombi.classList.remove('active');

        renderHeatmap(liveOverviewHeatmapSvg, null, false);
    };

    closeLiveGameOverview.onclick = () => {
        liveGameOverviewModal.classList.add('versteckt');
    };
}

// Helper for button feedback
export function startButtonAnimation(btn) {
    if (!btn) return;
    btn.classList.add('active-action');
    setTimeout(() => {
        btn.classList.remove('active-action');
    }, 200);
}
// --- Live Game Views (Moved from main.js) ---

/**
 * Renders the live overview with score, playtypes, and tables.
 */
export async function showLiveOverviewInline() {
    const { liveOverviewBereich, liveOverviewContent, timerAnzeige } = await import('./dom.js');
    const { berechneStatistiken, berechneGegnerStatistiken, berechneSpielartStatistik } = await import('./stats.js');
    const { setCurrentHeatmapContext } = await import('./heatmap.js');

    if (liveOverviewBereich) liveOverviewBereich.classList.remove('versteckt');
    
    if (!spielstand.isSpielAktiv) {
        renderEmptyLiveState(liveOverviewContent);
        return;
    }

    const homeStats = berechneStatistiken(spielstand.gameLog, spielstand.roster);
    const opponentStats = berechneGegnerStatistiken(spielstand.gameLog, spielstand.knownOpponents);
    const isAuswaerts = spielstand.settings?.isAuswaertsspiel || false;

    let html = `<div class="live-overview-container">`;

    // Score Card
    const homeName = spielstand.settings?.teamNameHeim || 'Heim';
    const homeScore = spielstand.score?.heim || 0;
    const oppName = spielstand.settings?.teamNameGegner || 'Gegner';
    const oppScore = spielstand.score?.gegner || 0;

    const leftName = isAuswaerts ? oppName : homeName;
    const leftScore = isAuswaerts ? oppScore : homeScore;
    const rightName = isAuswaerts ? homeName : oppName;
    const rightScore = isAuswaerts ? homeScore : oppScore;
    const currentTime = (timerAnzeige && timerAnzeige.textContent) || "00:00";

    html += `
        <div class="stats-card score-card">
            <div class="score-display">
                <div class="score-team">
                    <span class="team-name">${escapeHTML(leftName)}</span>
                    <span class="team-score">${leftScore}</span>
                </div>
                <span class="score-separator">:</span>
                <div class="score-team">
                    <span class="team-name">${escapeHTML(rightName)}</span>
                    <span class="team-score">${rightScore}</span>
                </div>
            </div>
            <div style="margin-top: 10px; font-weight: 500; color: var(--text-muted); border-top: 1px solid var(--border); pt: 10px; display: inline-block; padding-top: 10px;">
                Spielzeit: ${currentTime}
            </div>
        </div>
    `;

    // Playtype Stats
    const spielartStats = berechneSpielartStatistik ? berechneSpielartStatistik(spielstand.gameLog) : null;
    if (spielartStats) {
        // ... (Appending playtype HTML)
        const renderPlaytypes = (teamData, title) => {
            const data = Object.entries(teamData).filter(([key, s]) => s.wuerfe > 0);
            if (data.length === 0) return '';
            return `
                <div class="stats-card playtype-card">
                    <h2 class="card-title">${escapeHTML(title)}</h2>
                    <div class="playtype-stats-grid">
                        ${data.map(([key, s]) => `
                            <div class="playtype-stat-item">
                                <span class="playtype-name">${escapeHTML(s.name)}</span>
                                <span class="playtype-data">${s.tore}/${s.wuerfe}</span>
                                <span class="playtype-quote ${s.quote >= 50 ? 'good' : s.quote >= 30 ? 'medium' : 'low'}">${s.quote}%</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        };
        html += renderPlaytypes(spielartStats.heim, `Angriffsvarianten (${homeName})`);
        html += renderPlaytypes(spielartStats.gegner, `Angriffsvarianten (${oppName})`);
    }

    const infoIcon = `<i data-lucide="info" class="tooltip-icon"></i>`;
    const showTime = spielstand.gameMode !== 'simple';

    const renderTable = (name, bodyId) => `
        <div class="stats-card">
            <h2 class="card-title">${escapeHTML(name)}</h2>
            <div class="table-container">
                <table class="modern-stats-table">
                    <thead>
                        <tr>
                            <th>Spieler</th>
                            ${showTime ? '<th title="Spielzeit">Zeit</th>' : ''}
                            <th title="Tore">Tore</th>
                            <th title="Feldtore">Feldtore</th>
                            <th title="7-Meter Tore/Versuche">7m</th>
                            <th title="Fehlwürfe (Gehalten/Vorbei)">Fehlw</th>
                            <th title="Assists">Assist</th>
                            <th title="Wurfquote">Quote</th>
                            <th title="Ballverlust">BV ${infoIcon}</th>
                            <th title="Stürmerfoul">SF ${infoIcon}</th>
                            <th title="Block">Blk ${infoIcon}</th>
                            <th title="1 gegen 1 Gewonnen">1v1 ${infoIcon}</th>
                            <th title="1 gegen 1 Verloren">1v1- ${infoIcon}</th>
                            <th title="7m">7m+/- ${infoIcon}</th>
                            <th title="2 Minuten">2m+/- ${infoIcon}</th>
                            <th title="Karten">Karten ${infoIcon}</th>
                        </tr>
                    </thead>
                    <tbody id="${bodyId}"></tbody>
                </table>
            </div>
        </div>
    `;

    if (isAuswaerts) {
        html += renderTable(oppName, 'liveStatsOpp') + renderTable(homeName, 'liveStatsHome');
    } else {
        html += renderTable(homeName, 'liveStatsHome') + renderTable(oppName, 'liveStatsOpp');
    }

    html += '</div>';
    if (liveOverviewContent) {
        liveOverviewContent.innerHTML = sanitizeHTML(html);
        if (window.lucide) window.lucide.createIcons();

        // Fill tables
        renderHomeStatsInHistory(document.getElementById('liveStatsHome'), homeStats, spielstand.gameLog, true);
        renderOpponentStatsInHistory(document.getElementById('liveStatsOpp'), opponentStats, spielstand.gameLog, true);
    }

    setCurrentHeatmapContext('liveOverview');
}

/**
 * Renders individual shot charts for all players.
 */
export async function showShotsInline() {
    const { shotsBereich, shotsContent } = await import('./dom.js');
    const { berechneWurfbilder } = await import('./stats.js');
    const { drawFieldHeatmap, drawGoalHeatmap } = await import('./heatmap.js');

    if (shotsBereich) shotsBereich.classList.remove('versteckt');
    if (!shotsContent) return;

    if (!spielstand.isSpielAktiv) {
        renderEmptyLiveState(shotsContent);
        return;
    }

    const wurfbilder = berechneWurfbilder(spielstand.gameLog, spielstand.roster);
    shotsContent.innerHTML = '';

    const renderPlayerGroup = (playerData, is7m = false) => {
        const div = document.createElement('div');
        div.className = 'player-shot-card';

        let tore = 0, gehalten = 0, vorbei = 0;
        const isOpponent = playerData.isOpponent || false;

        playerData.wuerfe.forEach(w => {
            const act = (w.action || "").toLowerCase();
            const isSave = act.includes('gehalten') || act.includes('parade') || w.isSave;
            const isMiss = act.includes('vorbei') || act.includes('verworfen') || act.includes('fehlwurf') || act.includes('block') || w.color === 'gray';

            if (isSave) gehalten++;
            else if (isMiss) vorbei++;
            else if (act.includes('tor')) tore++;
        });

        const totalWuerfe = tore + gehalten + vorbei;
        const quote = totalWuerfe > 0 ? Math.round((tore / totalWuerfe) * 100) : 0;

        const infoDiv = document.createElement('div');
        infoDiv.className = 'player-shot-info';
        infoDiv.innerHTML = `<strong>#${playerData.number} ${escapeHTML(playerData.name)}${is7m ? ' (7m)' : ''}</strong>: ${tore} Tore (${quote}%)`;
        div.appendChild(infoDiv);

        // ... (Heatmap generation logic kept from main.js)
        const prefix = 'wb_' + (playerData.number || '0') + (isOpponent ? 'opp' : 'hm');
        const pointsTor = playerData.wuerfe.filter(w => w.x && w.y).map(w => ({ ...w, x: parseFloat(w.x), y: parseFloat(w.y), isOpponent }));
        const pointsFeld = playerData.wuerfe.filter(w => w.wurfposition).map(w => ({ ...w, x: parseFloat(w.wurfposition.x), y: parseFloat(w.wurfposition.y), isOpponent }));

        let svgContent = '';
        if (pointsTor.length > 0 || pointsFeld.length > 0) {
             svgContent = `<svg viewBox="0 0 300 500" width="200" height="350">
                ${drawFieldHeatmap(pointsFeld, 80, prefix)}
                <g transform="translate(97.5, 24) scale(0.35)">
                    ${drawGoalHeatmap(pointsTor, 0, prefix)}
                </g>
             </svg>`;
        }

        if (svgContent) {
            const svgContainer = document.createElement('div');
            svgContainer.className = 'shot-visual-container';
            svgContainer.innerHTML = svgContent;
            div.appendChild(svgContainer);
        }

        return div;
    };

    // Render Home / Gegner groups
    if (wurfbilder.heim.length > 0) {
        const h4 = document.createElement('h4');
        h4.textContent = spielstand.settings.teamNameHeim;
        shotsContent.appendChild(h4);
        wurfbilder.heim.forEach(p => shotsContent.appendChild(renderPlayerGroup(p)));
    }
    // ... (etc for 7m and Opponent)
}

/**
 * Renders the live interactive heatmap view.
 */
export async function showLiveHeatmapInline() {
    const { liveHeatmapBereich, heatmapHeimLabel, heatmapGegnerLabel, heatmapTeamToggle, heatmapPlayerSelect, heatmapSvg } = await import('./dom.js');
    const { renderHeatmap, setCurrentHeatmapContext } = await import('./heatmap.js');

    if (liveHeatmapBereich) liveHeatmapBereich.classList.remove('versteckt');

    if (!spielstand.isSpielAktiv) {
        // Find container for heatmap
        const heatmapContent = document.getElementById('heatmapContent'); // Assuming this exists or using a shared one
        renderEmptyLiveState(heatmapContent || liveHeatmapBereich);
        return;
    }

    if (heatmapHeimLabel) heatmapHeimLabel.textContent = spielstand.settings.teamNameHeim || 'HEIM';
    if (heatmapGegnerLabel) heatmapGegnerLabel.textContent = spielstand.settings.teamNameGegner || 'GEGNER';

    const getSelectedTeam = () => (heatmapTeamToggle?.dataset.state === 'checked' ? 'gegner' : 'heim');

    if (heatmapPlayerSelect) {
        const team = getSelectedTeam();
        const list = team === 'heim' ? spielstand.roster : (spielstand.knownOpponents || []);
        heatmapPlayerSelect.innerHTML = '<option value="all">Alle Spieler</option>' + 
            list.map(p => `<option value="${p.number}">#${p.number} ${escapeHTML(p.name)}</option>`).join('');
    }

    setCurrentHeatmapContext(null);
    renderHeatmap(heatmapSvg, spielstand.gameLog, false, {
        team: getSelectedTeam(),
        player: heatmapPlayerSelect?.value === 'all' ? null : parseInt(heatmapPlayerSelect?.value)
    });
}
