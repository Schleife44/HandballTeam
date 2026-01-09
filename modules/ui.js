import { berechneTore, berechneWurfbilder, berechneStatistiken, berechneGegnerStatistiken } from './stats.js';
import { drawGoalHeatmap, drawFieldHeatmap } from './heatmap.js';
import { spielstand, speichereSpielstand } from './state.js';
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
import { renderHomeStatsInHistory, renderOpponentStatsInHistory, openPlayerHistoryHeatmap } from './historyView.js';
import { renderHeatmap, setCurrentHeatmapContext, setCurrentHeatmapTab } from './heatmap.js';

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

export function getOpponentLabel() {
    return spielstand.settings.isAuswaertsspiel ? 'Heim' : 'Gast';
}

export function getMyTeamLabel() {
    return spielstand.settings.isAuswaertsspiel ? 'Gast' : 'Heim';
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

        div.innerHTML = `
            <div>#${s.number}</div>
            <div class="suspension-time"><div class="time">${timeStr}</div>
        `;
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
        // If Simple Mode: Render ALL players into activeContainer, no slots, no bench container used
        if (spielstand.gameMode === 'simple') {
            activeContainer.innerHTML = '';
            if (gkContainer) gkContainer.innerHTML = '';
            if (benchContainer) benchContainer.innerHTML = '';

            // Sort players by number
            const sortedPlayers = [...players].sort((a, b) => (parseInt(a.number) || 0) - (parseInt(b.number) || 0));

            sortedPlayers.forEach((player, index) => {
                // Determine original index
                const originalIndex = players.indexOf(player);
                const playerForRender = { ...player, originalIndex: originalIndex };

                const btn = document.createElement('button');

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

                btn.innerHTML = `
                    <div class="two-min-indicators">${dotsHtml}</div>
                    <!-- No Time Display in Simple Mode -->
                    <div class="spieler-nummer-display">${player.number}</div>
                    <span class="spieler-name-display">${nameDisplay}</span>
                `;

                // Use a generic valid class, but maybe reuse 'lineup-slot filled' for consistent sizing
                // Or 'bench-player' style but in grid.
                btn.className = 'spieler-button action-btn lineup-slot filled';
                // if (player.isGoalkeeper) btn.classList.add('torwart'); // Removed for Simple Mode
                if (player.disqualified) btn.classList.add('disqualified');

                // Suspension check (visual only, no slot logic)
                const isSuspended = (spielstand.activeSuspensions || []).some(s => s.teamKey === teamKey && s.number == player.number);
                if (isSuspended) btn.classList.add('suspended');

                if (!isOpponent) {
                    btn.style.backgroundColor = 'var(--team-primary-color)';
                    btn.style.color = 'var(--our-text-color)';
                    btn.dataset.index = originalIndex;
                    btn.dataset.team = 'myteam';
                } else {
                    btn.classList.add('gegner-button');
                    btn.style.backgroundColor = 'var(--team-opponent-color)';
                    btn.style.color = 'var(--opponent-text-color)';
                    btn.dataset.gegnerNummer = player.number;
                    btn.dataset.team = 'opponent';
                    btn.dataset.index = originalIndex;
                }

                // Add required datasets for clicks
                btn.dataset.teamKey = teamKey;

                activeContainer.appendChild(btn);
            });

            // ADD PLAYER BUTTON (Green +)
            const addBtn = document.createElement('button');
            addBtn.className = 'spieler-button action-btn add-player-button';
            // Determine text or icon
            addBtn.innerHTML = '<div style="font-size: 2rem; font-weight: bold;">+</div>';

            // Allow styling override
            addBtn.style.backgroundColor = '#198754'; // Green
            addBtn.style.color = 'white';

            if (!isOpponent) {
                // My Team -> Quick Add
                addBtn.dataset.action = 'quickAdd';
                addBtn.dataset.team = 'myteam';
            } else {
                // Opponent -> Add Opponent
                addBtn.dataset.action = 'addOpponent';
                addBtn.dataset.team = 'opponent';
            }
            activeContainer.appendChild(addBtn);

            return; // EXIT Simple Mode Logic
        }

        // --- COMPLEX MODE (Existing Logic) ---
        // Create slot arrays - players are placed by their lineupSlot
        // lineupSlot: 'gk' for goalkeeper, 0-5 for field players, null/undefined = bench
        const lineupGK = new Array(GK_SLOTS).fill(null);
        const lineupField = new Array(FIELD_SLOTS).fill(null);
        const bench = [];

        players.forEach((player, index) => {
            const playerWithIndex = { ...player, originalIndex: index };
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

            btn.innerHTML = `
                    <div class="two-min-indicators">${dotsHtml}</div>
                    <div class="player-time-display" id="time-display-${teamKey}-${player.number}">${timeStr}</div>
                    <div class="spieler-nummer-display">${player.number}</div>
                    <span class="spieler-name-display">${nameDisplay}</span>
                `;
            btn.className = 'spieler-button action-btn lineup-slot filled';
            if (player.isGoalkeeper) btn.classList.add('torwart');

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

            btn.dataset.slotType = slotType;
            btn.dataset.slotIndex = slotIndex;
            btn.dataset.teamKey = teamKey;

            container.appendChild(btn);
        };

        // Render empty slot placeholder
        const renderEmptySlot = (container, slotType, slotIndex) => {
            const btn = document.createElement('button');
            btn.className = 'spieler-button action-btn lineup-slot empty';
            btn.innerHTML = `<div class="empty-slot-icon">+</div>`;
            btn.dataset.slotType = slotType;
            btn.dataset.slotIndex = slotIndex;
            btn.dataset.teamKey = teamKey;
            btn.dataset.empty = 'true';
            container.appendChild(btn);
        };

        // Render bench player
        const renderBenchPlayer = (player, container) => {
            const btn = document.createElement('button');
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

            btn.innerHTML = `
                <div class="two-min-indicators">${dotsHtml}</div>
                <div class="player-time-display" id="time-display-${teamKey}-${player.number}">${timeStr}</div>
                <div class="spieler-nummer-display">${player.number}</div>
                <span class="spieler-name-display">${nameDisplay}</span>
            `;
            btn.className = 'spieler-button action-btn bench-player';
            if (player.isGoalkeeper) btn.classList.add('torwart');

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
            } else {
                btn.classList.add('gegner-button');
                btn.style.backgroundColor = 'var(--team-opponent-color)';
                btn.style.color = 'var(--opponent-text-color)';
                btn.dataset.gegnerNummer = player.number;
                btn.dataset.team = 'opponent';
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
            text = `#${eintrag.playerId} (${eintrag.playerName}): ${eintrag.action}`;
        } else if (eintrag.gegnerNummer) {
            text = `${getOpponentLabel()} #${eintrag.gegnerNummer}: ${eintrag.action}`;
        } else {
            text = `${eintrag.action.toUpperCase()}`;
        }

        if (eintrag.kommentar) {
            text += ` - ${eintrag.kommentar}`;
        }

        contentHtml += `<span class="log-text"><strong>${text}</strong><span style="opacity: 0.6; margin-left:8px;">${spielstandText}</span></span>`;
        contentHtml += `<span class="log-delete" data-index="${index}" title="Löschen"><i data-lucide="trash-2" style="width: 16px; height: 16px;"></i></span>`;

        div.innerHTML = contentHtml;
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

        tr.innerHTML = `
            <td>${displayName}</td>
            <td>${timeStr}</td>
            <td>${stats.siebenMeter}</td>
            <td>${stats.fehlwurf}</td>
            <td>${stats.ballverlust}</td>
            <td>${stats.stuermerfoul}</td>
            <td>${stats.block}</td>
            <td>${stats.gewonnen1v1}</td>
            <td>${stats.oneOnOneLost}</td>
            <td>${stats.rausgeholt7m}</td>
            <td>${stats.rausgeholt2min}</td>
            <td>${stats.gelb}</td>
            <td>${stats.zweiMinuten}</td>
            <td>${stats.rot}</td>
        `;
        statistikTabelleBody.appendChild(tr);
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
        rosterListe.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">Noch keine Spieler im ${teamLabel}-Team hinzugefügt.</div>`;
        return;
    }

    list.forEach((player, index) => {
        const div = document.createElement('div');
        div.className = 'roster-player-card';

        // Read-only state
        const infoDiv = document.createElement('div');
        infoDiv.className = 'roster-player-info';
        infoDiv.innerHTML = `
            <div class="roster-player-number">${player.number}</div>
            <div class="roster-player-name">${player.name || '<i>Kein Name</i>'}</div>
        `;

        // Edit state (hidden)
        const editDiv = document.createElement('div');
        editDiv.className = 'roster-inline-edit-grid versteckt';
        editDiv.innerHTML = `
            <div class="edit-row-name">
                <input type="text" class="shadcn-input inline-name-input" value="${player.name || ''}" placeholder="Name">
            </div>
            <div class="edit-row-controls">
                <input type="number" class="shadcn-input inline-number-input" value="${player.number}" min="1" max="99" placeholder="Nr.">
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; margin-right: 5px;">
                     <label style="font-size: 0.6rem; margin-bottom: 2px;">TW</label>
                     <input type="checkbox" class="inline-tw-input" ${player.isGoalkeeper ? 'checked' : ''} style="cursor: pointer;">
                </div>
                <div class="inline-edit-actions">
                    <button class="inline-save-btn shadcn-btn-primary shadcn-btn-sm" title="Speichern">✓</button>
                    <button class="inline-cancel-btn shadcn-btn-outline shadcn-btn-sm" title="Abbrechen">✕</button>
                </div>
            </div>
        `;

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
        if (isShowingOpponents) deleteBtn.dataset.opponentIndex = index;

        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);

        div.appendChild(infoDiv);
        div.appendChild(editDiv);
        div.appendChild(actionsDiv);

        // Handlers
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

        editDiv.querySelector('.inline-save-btn').onclick = async () => {
            const newName = editDiv.querySelector('.inline-name-input').value.trim();
            const newNum = parseInt(editDiv.querySelector('.inline-number-input').value);
            const newTw = editDiv.querySelector('.inline-tw-input').checked;

            if (isNaN(newNum)) {
                await customAlert('Bitte Nummer eingeben');
                return;
            }

            // Duplicate check
            const duplicate = list.find((p, i) => i !== index && p.number === newNum);
            if (duplicate) {
                await customAlert('Diese Nummer ist bereits vergeben.');
                return;
            }

            player.name = newName;
            player.number = newNum;
            player.isGoalkeeper = newTw;
            list.sort((a, b) => a.number - b.number);
            speichereSpielstand();
            zeichneRosterListe(showGastTab);
            zeichneSpielerRaster();
        };

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
        infoDiv.innerHTML = `<strong>#${playerData.number} ${playerData.name}${is7m ? ' (7m)' : ''}</strong>${tore} Tore${gehalten > 0 ? `, ${gehalten} Geh.` : ''}${vorbei > 0 ? `, ${vorbei} Vorb.` : ''} <strong>(${quote}%)</strong>`;
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
            svgContainer.innerHTML = `<svg viewBox="${viewBox}" width="200" height="280">${svgContent}</svg>`;
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
        renderOpponentStatsInHistory(liveOverviewStatsBody, gegnerStats, spielstand.gameLog, true);
    } else {
        renderHomeStatsInHistory(liveOverviewStatsBody, stats, spielstand.gameLog, true);
        renderOpponentStatsInHistory(liveOverviewStatsGegnerBody, gegnerStats, spielstand.gameLog, true);
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
