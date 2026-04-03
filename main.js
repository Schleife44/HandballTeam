// main.js - Entry Point
// Minimal setup: Load data, initialize UI, register event listeners

import { 
    ladeSpielstandDaten, spielstand, speichereSpielstand, 
    mergeRemoteSpielstand, resetSpielstand 
} from './modules/state.js';
import {
    toggleDarkMode, myTeamNameInput,
    toggleWurfbildHeim, toggleWurfbildGegner, inputTeamNameHeim,
    inputTeamNameGegner, toggleWurfpositionHeim, toggleWurfpositionGegner,
    toggleCombinedThrow,
    rosterBereich, spielBereich, globalAktionen, scoreWrapper, timerAnzeige,
    statistikWrapper, pauseButton, gamePhaseButton, spielBeendenButton,
    liveOverviewBereich, liveOverviewContent, seasonBereich, seasonContent,
    calendarBereich, // Added
    shotsBereich, shotsContent, historieBereich, historieDetailBereich,
    settingsBereich, rosterTeamNameHeim, rosterTeamNameGegner,
    liveHeatmapBereich, teamDiagrammBereich, teamDiagrammContent, protokollBereich,
    mobileMenuBtn, sidebarOverlay, sidebar, teamColorInput
} from './modules/dom.js';
import { getContrastTextColor, getGameResult } from './modules/utils.js';
import { setSteuerungAktiv } from './modules/game.js';
import { formatiereZeit } from './modules/utils.js';
import { berechneStatistiken } from './modules/stats.js';
import {
    applyTheme, applyViewSettings, updateScoreDisplay,
    zeichneRosterListe, updateSuspensionDisplay, zeichneSpielerRaster,
    updateProtokollAnzeige, zeichneStatistikTabelle, showLiveGameOverview,
    zeigeWurfstatistik
} from './modules/ui.js';
import { registerEventListeners } from './modules/eventListeners.js';
import { initCustomDialogs, customConfirm, customAlert } from './modules/customDialog.js';
import { renderHistoryList } from './modules/historyView.js';

import { openSeasonOverview, renderTeamScatterPlot, getSeasonSummary } from './modules/seasonView.js';
import { getHistorie, clearLocalHistory } from './modules/history.js';
import { exportiereAlsPdf, exportiereAlsTxt, exportiereAlsCsv } from './modules/export.js';
import { showDashboardInline } from './modules/dashboardView.js';
import { initSettingsPage, updateRosterInputsForValidation } from './modules/settingsManager.js';
import {
    onAuthChange, firebaseLogin, firebaseRegister, loginWithGoogle, firebaseLogout,
    loadSpielstandFromFirestore, startSpielstandListener, stopSpielstandListener,
    loadTeamsFromFirestore, startTeamsListener,
    updateStatusIndicator, getActiveTeamId, redeemInviteToken
} from './modules/firebase.js';

import { showTeamSelectionOverlay, showPlayerNameSelection } from './modules/teamsView.js';

// --- App Initialization ---
// --- App Initialization ---

function initApp(skipLocalLoad = false) {
    if (!skipLocalLoad) {
        ladeSpielstandDaten();
    }

    // Set UI checkboxes from loaded data
    if (toggleDarkMode) toggleDarkMode.checked = spielstand.settings.darkMode;

    if (toggleWurfbildHeim) toggleWurfbildHeim.checked = spielstand.settings.showWurfbildHeim;
    if (toggleWurfbildGegner) toggleWurfbildGegner.checked = spielstand.settings.showWurfbildGegner;
    if (toggleWurfpositionHeim) toggleWurfpositionHeim.checked = spielstand.settings.showWurfpositionHeim;
    if (toggleWurfpositionGegner) toggleWurfpositionGegner.checked = spielstand.settings.showWurfpositionGegner;
    if (toggleCombinedThrow) toggleCombinedThrow.checked = spielstand.settings.combinedThrowMode || false;
    if (rosterTeamNameHeim) rosterTeamNameHeim.value = spielstand.settings.teamNameHeim;
    if (rosterTeamNameGegner) rosterTeamNameGegner.value = spielstand.settings.teamNameGegner;

    // Initialize myTeamName if not set
    if (!spielstand.settings.myTeamName) {
        spielstand.settings.myTeamName = '';
    }
    if (myTeamNameInput) {
        myTeamNameInput.value = spielstand.settings.myTeamName;
    }

    applyTheme();

    // Restore game view if a game was in progress
    const wasInGame = spielstand.uiState === 'game';
    if (wasInGame) {
        rosterBereich.classList.add('versteckt');
        spielBereich.classList.remove('versteckt');
        if (globalAktionen) globalAktionen.classList.remove('versteckt');
        scoreWrapper.classList.remove('versteckt');


        timerAnzeige.textContent = formatiereZeit(spielstand.timer.verstricheneSekundenBisher);
        spielstand.timer.istPausiert = true;

        const phase = spielstand.timer.gamePhase;
        const sindImSpiel = (phase === 2 || phase === 4 || phase === 1.5 || phase === 3.5);
        setSteuerungAktiv(sindImSpiel);

        if (spielBeendenButton) spielBeendenButton.classList.remove('versteckt');

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
        // updateTorTracker(); // Removed feature
    }

    // Unconditional Team Color Initialization
    const colorInput = document.getElementById('teamColorInput');
    const colorTrigger = document.getElementById('teamColorTrigger');

    if (colorInput) {
        // Init from state
        const savedColor = spielstand.settings.teamColor || '#dc3545';
        colorInput.value = savedColor;

        if (colorTrigger) {
            const icon = colorTrigger.querySelector('i') || colorTrigger.querySelector('svg');
            if (icon) icon.style.color = savedColor;

            // Ensure click listener is bound (idempotent check)
            if (!colorTrigger.dataset.bound) {
                colorTrigger.addEventListener('click', (e) => {
                    e.preventDefault();
                    colorInput.click();
                });
                colorTrigger.dataset.bound = "true";
            }
        }

        if (!colorInput.dataset.bound) {
            colorInput.addEventListener('input', (e) => {
                const color = e.target.value;
                spielstand.settings.teamColor = color;
                applyTheme();

                if (colorTrigger) {
                    const icon = colorTrigger.querySelector('i') || colorTrigger.querySelector('svg');
                    if (icon) icon.style.color = color;
                }
            });

            colorInput.addEventListener('change', (e) => {
                const color = e.target.value;
                spielstand.settings.teamColor = color;
                import('./modules/state.js').then(s => s.speichereSpielstand());
            });
            colorInput.dataset.bound = "true";
        }
    }

    // Unconditional Opponent Color Initialization
    const colorInputGegner = document.getElementById('teamColorInputGegner');
    const colorTriggerGegner = document.getElementById('teamColorTriggerGegner');

    if (colorInputGegner) {
        // Init from state
        const savedColorGegner = spielstand.settings.teamColorGegner || '#2563eb';
        colorInputGegner.value = savedColorGegner;

        if (colorTriggerGegner) {
            const icon = colorTriggerGegner.querySelector('i') || colorTriggerGegner.querySelector('svg');
            if (icon) icon.style.color = savedColorGegner;

            if (!colorTriggerGegner.dataset.bound) {
                colorTriggerGegner.addEventListener('click', (e) => {
                    e.preventDefault();
                    colorInputGegner.click();
                });
                colorTriggerGegner.dataset.bound = "true";
            }
        }

        if (!colorInputGegner.dataset.bound) {
            colorInputGegner.addEventListener('input', (e) => {
                const color = e.target.value;
                spielstand.settings.teamColorGegner = color;
                applyTheme();

                if (colorTriggerGegner) {
                    const icon = colorTriggerGegner.querySelector('i') || colorTriggerGegner.querySelector('svg');
                    if (icon) icon.style.color = color;
                }
            });

            colorInputGegner.addEventListener('change', (e) => {
                const color = e.target.value;
                spielstand.settings.teamColorGegner = color;
                import('./modules/state.js').then(s => s.speichereSpielstand());
            });
            colorInputGegner.dataset.bound = "true";
        }
    }

    if (window.lucide) window.lucide.createIcons();
}

// --- Sidebar Navigation ---
function initSidebar() {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const view = item.dataset.view;
            navigateToView(view);

            // Update active state
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            // Close mobile menu on navigate
            if (sidebar && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
                if (sidebarOverlay) sidebarOverlay.classList.remove('active');
            }
        });
    });

    // Mobile Menu Toggles handled in eventListeners.js
}

async function navigateToView(view) {
    // Hide all sections first
    hideAllSections();

    switch (view) {
        case 'dashboard':
            await showDashboardInline();
            break;
        case 'roster':
            if (rosterBereich) rosterBereich.classList.remove('versteckt');

            // Fix: Check toggle state before rendering
            const isOpponent = teamToggle && teamToggle.getAttribute('aria-checked') === 'true';
            zeichneRosterListe(isOpponent);

            // Update roster input locks based on validation state
            updateRosterInputsForValidation();
            break;
        case 'calendar':
            if (calendarBereich) calendarBereich.classList.remove('versteckt');
            // Use a global flag to ensure init happens only once
            if (!window.calendarInitialized) {
                import('./modules/calendar.js').then(cal => {
                    cal.initCalendar();
                    window.calendarInitialized = true;
                });
            } else {
                // Just refresh the view if already init
                import('./modules/calendar.js').then(cal => cal.renderCalendar());
            }
            break;
        case 'game':
            if (spielBereich) spielBereich.classList.remove('versteckt');

            // In-page selection logic
            const modeSelection = document.getElementById('gameModeSelection');
            const gameContent = document.getElementById('gameContent');

            // Determine if we need selection or game content
            if (spielstand.timer.gamePhase === 1 && !spielstand.modeSelected) {

                // Show Selection, Hide Content
                if (modeSelection) {
                    modeSelection.classList.remove('versteckt');
                    modeSelection.style.display = ''; // Clear any inline style
                }
                if (gameContent) {
                    gameContent.classList.add('versteckt');
                }

                // Hide specific controls during selection for cleaner look
                if (globalAktionen) globalAktionen.classList.add('versteckt');
                if (scoreWrapper) scoreWrapper.classList.add('versteckt');

            } else {

                // Hide Selection, Show Content
                if (modeSelection) {
                    modeSelection.classList.add('versteckt');
                }
                if (gameContent) {
                    gameContent.classList.remove('versteckt');
                    gameContent.style.display = ''; // Clear any inline style
                }

                renderGameViewFull();
            }
            break;


            if (spielBeendenButton) spielBeendenButton.classList.remove('versteckt');
            break;
        case 'overview':
            showLiveOverviewInline();
            break;
        case 'history':
            showHistoryView();
            break;
        case 'season':
            showSeasonInline(); // Now shows general season info
            break;
        case 'seasonStats':
            showSeasonStatsInline(); // Shows the detailed stats
            // Initialize season sub-tabs
            import('./modules/seasonView.js').then(mod => {
                if (mod.initSeasonSubTabs) mod.initSeasonSubTabs();
            });
            break;
        case 'shots':
            showShotsInline();
            break;
        case 'heatmap':
            showLiveHeatmapInline();
            break;
        case 'settings':
            showSettingsInline();
            // Initialize settings page UI (set values and validation state)
            initSettingsPage();
            break;
        case 'seasonheatmap':
        case 'teamdiagramm':
            // Redirect to the new consolidated season stats view
            switchView('seasonStats');
            break;
        case 'protocol':
            if (protokollBereich) protokollBereich.classList.remove('versteckt');
            updateProtokollAnzeige();
            break;
        case 'videoanalyse':
            const vaBereich = document.getElementById('videoAnalyseBereich');
            if (vaBereich) vaBereich.classList.remove('versteckt');
            import('./modules/videoAnalysis.js').then(mod => mod.handleVideoAnalysisView());
            break;
        case 'tacticalboard':
            const tbBereich = document.getElementById('tacticalBoardBereich');
            if (tbBereich) tbBereich.classList.remove('versteckt');
            import('./modules/tacticalBoardView.js').then(mod => mod.initTacticalBoard());
            break;
    }

    updateSidebarTimerVisibility(view);
}

function updateSidebarTimerVisibility(currentView) {
    if (!sidebarTimer) return;

    const isGameView = currentView === 'game';
    const isGameActive = spielstand.timer.verstricheneSekundenBisher > 0 || !spielstand.timer.istPausiert;

    if (!isGameView && isGameActive) {
        sidebarTimer.classList.remove('versteckt');

        // Calculate immediately using correct state properties so NO old state is shown
        let currentSeconds = spielstand.timer.verstricheneSekundenBisher;
        if (!spielstand.timer.istPausiert && spielstand.timer.segmentStartZeit) {
            const now = Date.now();
            const diff = Math.floor((now - spielstand.timer.segmentStartZeit) / 1000);
            currentSeconds += diff;
        }
        sidebarTimer.textContent = formatiereZeit(Math.max(0, currentSeconds));
    } else {
        sidebarTimer.classList.add('versteckt');
    }
}

function showHistoryView() {
    // Show history area directly
    if (historieBereich) {
        historieBereich.classList.remove('versteckt');
    }
    renderHistoryList();
}

export function showLiveOverviewInline() {
    // Show inline instead of modal
    liveOverviewBereich.classList.remove('versteckt');

    // Import and render content
    import('./modules/ui.js').then(ui => {
        import('./modules/historyView.js').then(historyView => {
            import('./modules/stats.js').then(stats => {
                import('./modules/heatmap.js').then(heatmap => {
                    // Get current game data
                    const homeStats = stats.berechneStatistiken(spielstand.gameLog, spielstand.roster);
                    const opponentStats = stats.berechneGegnerStatistiken(spielstand.gameLog, spielstand.knownOpponents);

                    const isAuswaerts = spielstand.settings?.isAuswaertsspiel || false;

                    // Modern card-based layout
                    let html = `
                        <div class="live-overview-container">
                    `;

                    // Score Card Data
                    const homeName = spielstand.settings?.teamNameHeim || 'Heim';
                    const homeScore = spielstand.score?.heim || 0;
                    const oppName = spielstand.settings?.teamNameGegner || 'Gegner';
                    const oppScore = spielstand.score?.gegner || 0;

                    const leftName = isAuswaerts ? oppName : homeName;
                    const leftScore = isAuswaerts ? oppScore : homeScore;
                    const rightName = isAuswaerts ? homeName : oppName;
                    const rightScore = isAuswaerts ? homeScore : oppScore;

                    const currentTime = (typeof timerAnzeige !== 'undefined' && timerAnzeige && timerAnzeige.textContent) || "00:00";

                    // Score Card
                    html += `
                        <div class="stats-card score-card">
                            <div class="score-display">
                                <div class="score-team">
                                    <span class="team-name">${leftName}</span>
                                    <span class="team-score">${leftScore}</span>
                                </div>
                                <span class="score-separator">:</span>
                                <div class="score-team">
                                    <span class="team-name">${rightName}</span>
                                    <span class="team-score">${rightScore}</span>
                                </div>
                            </div>
                            <div style="margin-top: 10px; font-weight: 500; color: hsl(var(--muted-foreground)); border-top: 1px solid hsl(var(--border)); pt: 10px; display: inline-block; padding-top: 10px;">
                                Spielzeit: ${currentTime}
                            </div>
                        </div>
                    `;

                    // Spielart-Statistik Cards
                    const spielartStats = stats.berechneSpielartStatistik ? stats.berechneSpielartStatistik(spielstand.gameLog) : null;

                    if (spielartStats) {
                        // Heim Stats
                        const heimData = Object.entries(spielartStats.heim).filter(([key, s]) => s.wuerfe > 0);
                        if (heimData.length > 0) {
                            html += `
                                <div class="stats-card playtype-card">
                                    <h2 class="card-title">Angriffsvarianten (${homeName})</h2>
                                    <div class="playtype-stats-grid">
                                        ${heimData.map(([key, s]) => `
                                            <div class="playtype-stat-item">
                                                <span class="playtype-name">${s.name}</span>
                                                <span class="playtype-data">${s.tore}/${s.wuerfe}</span>
                                                <span class="playtype-quote ${s.quote >= 50 ? 'good' : s.quote >= 30 ? 'medium' : 'low'}">${s.quote}%</span>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            `;
                        }

                        // Gegner Stats
                        const gegnerData = Object.entries(spielartStats.gegner).filter(([key, s]) => s.wuerfe > 0);
                        if (gegnerData.length > 0) {
                            html += `
                                <div class="stats-card playtype-card">
                                    <h2 class="card-title">Angriffsvarianten (${oppName})</h2>
                                    <div class="playtype-stats-grid">
                                        ${gegnerData.map(([key, s]) => `
                                            <div class="playtype-stat-item">
                                                <span class="playtype-name">${s.name}</span>
                                                <span class="playtype-data">${s.tore}/${s.wuerfe}</span>
                                                <span class="playtype-quote ${s.quote >= 50 ? 'good' : s.quote >= 30 ? 'medium' : 'low'}">${s.quote}%</span>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            `;
                        }
                    }

                    const infoIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="tooltip-icon"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`;


                    const showTime = spielstand.gameMode !== 'simple';

                    // Generate Stats Cards HTML
                    const homeCardHtml = `
                        <div class="stats-card">
                            <h2 class="card-title">${homeName}</h2>
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
                                            <th title="7m herausgeholt">7m+ ${infoIcon}</th>
                                            <th title="2 Minuten herausgeholt">2m+ ${infoIcon}</th>
                                            <th title="Gelbe Karte">G ${infoIcon}</th>
                                            <th title="2 Minuten Zeitstrafe">2' ${infoIcon}</th>
                                            <th title="Rote Karte">R ${infoIcon}</th>
                                        </tr>
                                    </thead>
                                    <tbody id="liveStatsHome"></tbody>
                                </table>
                            </div>
                        </div>
                    `;

                    const oppCardHtml = `
                        <div class="stats-card">
                            <h2 class="card-title">${oppName}</h2>
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
                                            <th title="7m verursacht">7m+ ${infoIcon}</th>
                                            <th title="2 Minuten verursacht">2m+ ${infoIcon}</th>
                                            <th title="Gelbe Karte">G ${infoIcon}</th>
                                            <th title="2 Minuten Zeitstrafe">2' ${infoIcon}</th>
                                            <th title="Rote Karte">R ${infoIcon}</th>
                                        </tr>
                                    </thead>
                                    <tbody id="liveStatsOpp"></tbody>
                                </table>
                            </div>
                        </div>
                    `;


                    // Append in correct order
                    if (isAuswaerts) {
                        html += oppCardHtml + homeCardHtml;
                    } else {
                        html += homeCardHtml + oppCardHtml;
                    }

                    html += '</div>';

                    liveOverviewContent.innerHTML = html;


                    const homeBody = document.getElementById('liveStatsHome');
                    const oppBody = document.getElementById('liveStatsOpp');

                    historyView.renderHomeStatsInHistory(document.getElementById('liveStatsHome'), homeStats, spielstand.gameLog, true);
                    historyView.renderOpponentStatsInHistory(document.getElementById('liveStatsOpp'), opponentStats, spielstand.gameLog, true);

                    // Set context for Heatmap rendering
                    heatmap.setCurrentHeatmapContext('liveOverview');

                    // Initial Heatmap Render (if tab is active? defaults to stats usually, but good to prep)
                    // Actually, let's just set the context. The render happens when tab is clicked or if logic requires.
                    // But if we are viewing it, we ensure subsequent renders use this context.
                });
            });
        });
    });
}

// showDashboardInline moved to modules/dashboardView.js

// General Season Overview (Player List "wie vorher")
function showSeasonInline() {
    seasonBereich.classList.remove('versteckt');

    // Clear dynamic content logic if needed, but seasonContent exists.
    // Import and render
    import('./modules/seasonView.js').then(seasonView => {
        const container = document.getElementById('seasonContent');
        if (container) {
            // Clean container first if needed to avoid stacking headers? 
            // renderPlayerSeasonStats cleans innerHTML of the container.
            // But seasonContent has <p> placeholder initially.
            // Let's clear it once.
            container.innerHTML = '';

            // Add a title if missing
            if (!container.querySelector('h3')) {
                const title = document.createElement('h3');
                title.textContent = 'Spieler Statistiken';
                title.style.marginBottom = '1rem';
                container.appendChild(title);

                // Create a wrapper div for the list so we don't overwrite the title
                const listWrapper = document.createElement('div');
                container.appendChild(listWrapper);
                seasonView.renderPlayerSeasonStats(listWrapper);
            } else {
                // Wrapper assumption
                const listWrapper = container.querySelector('div') || container;
                seasonView.renderPlayerSeasonStats(listWrapper);
            }
        }
    });
}

function showSeasonStatsInline() {
    const seasonStatsBereich = document.getElementById('seasonStatsBereich');
    if (seasonStatsBereich) seasonStatsBereich.classList.remove('versteckt');

    // Logic moved from previous showSeasonInline, now targeting seasonStatsBereich content
    import('./modules/seasonView.js').then(seasonView => {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
            // Verify elements exist (they are now static in seasonStatsBereich, but we check IDs)
            const summary = document.getElementById('seasonSummary');
            const container = document.getElementById('seasonStatsContainer');

            if (summary && container) {
                // Call renderSeasonStats
                seasonView.renderSeasonStats();

                // Wait for rendering to complete, then reattach event listeners
                setTimeout(() => {
                    const contentArea = document.getElementById('seasonStatsContent'); // Limit scope
                    if (!contentArea) return;

                    // 1. Player heatmap buttons
                    const heatmapButtons = contentArea.querySelectorAll('.show-heatmap-btn');
                    heatmapButtons.forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            const playerIndex = parseInt(btn.dataset.playerIndex);
                            const mode = btn.dataset.mode || 'field';
                            seasonView.showPlayerHeatmap(playerIndex, mode);
                        });
                    });

                    // 2. Team heatmap buttons
                    const teamButtons = contentArea.querySelectorAll('.show-team-heatmap-btn');
                    teamButtons.forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            const team = btn.dataset.team;
                            seasonView.showTeamHeatmap(team);
                        });
                    });
                }, 100);
            } else {
                console.error('Season Stats elements not found!');
            }
        }, 50);
    });
}

// Redundant legacy functions removed. Logic is now handled by modules/seasonView.js

// End of legacy cleanup


function showShotsInline() {
    shotsBereich.classList.remove('versteckt');

    import('./modules/stats.js').then(stats => {
        import('./modules/heatmap.js').then(heatmap => {
            const wurfbilder = stats.berechneWurfbilder(spielstand.gameLog, spielstand.roster);
            shotsContent.innerHTML = '';

            const renderPlayerGroup = (playerData, is7m = false) => {
                const div = document.createElement('div');
                div.className = 'player-shot-card';

                let tore = 0, gehalten = 0, vorbei = 0;
                const isOpponent = playerData.isOpponent || false;

                playerData.wuerfe.forEach(w => {
                    const act = (w.action || "").toLowerCase();
                    const isSave = act.includes('gehalten') || act.includes('parade') || (w.isSave === true) || (w.color === 'yellow');
                    const isMiss = act.includes('vorbei') || act.includes('verworfen') || act.includes('fehlwurf') || act.includes('block') || (w.color === 'gray');

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

                const mapWurfToPoint = (w) => {
                    const act = (w.action || "").toLowerCase();
                    const isSave = act.includes('gehalten') || act.includes('parade') || (w.isSave === true) || (w.color === 'yellow');
                    const isMiss = act.includes('vorbei') || act.includes('verworfen') || act.includes('fehlwurf') || act.includes('block') || (w.color === 'gray');
                    const isBlocked = act.includes('block');
                    const isGoal = !isSave && !isMiss && act.includes('tor');

                    return {
                        x: parseFloat(w.x || (w.wurfposition ? w.wurfposition.x : 0)),
                        y: parseFloat(w.y || (w.wurfposition ? w.wurfposition.y : 0)),
                        isOpponent: isOpponent,
                        isGoal: isGoal,
                        isMiss: isMiss || isSave,
                        isSave: isSave,
                        isBlocked: isBlocked,
                        action: act
                    };
                };

                const pointsTor = playerData.wuerfe.filter(w => w.x && w.y).map(w => {
                    const p = mapWurfToPoint(w);
                    p.x = parseFloat(w.x);
                    p.y = parseFloat(w.y);
                    return p;
                });
                const pointsFeld = playerData.wuerfe.filter(w => w.wurfposition).map(w => {
                    const p = mapWurfToPoint(w);
                    p.x = parseFloat(w.wurfposition.x);
                    p.y = parseFloat(w.wurfposition.y);
                    return p;
                });

                const prefix = 'wb_' + (playerData.number || '0') + (isOpponent ? 'opp' : 'hm');
                let svgContent = '';
                let viewBox = '0 -60 300 260';
                let svgHeight = 180;

                if (hasWurfposition && hasWurfbild) {
                    viewBox = '0 0 300 500';
                    svgHeight = 350;

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

                    svgContent += heatmap.drawFieldHeatmap(pointsFeld, yOffsetField, prefix);
                    svgContent += `<g transform="translate(${xOffsetGoal}, ${yOffsetGoal}) scale(${scaleGoal})">`;
                    svgContent += heatmap.drawGoalHeatmap(pointsTor, 0, prefix);
                    svgContent += `</g>`;
                    svgContent += linesContent;

                } else if (hasWurfposition) {
                    viewBox = '0 0 300 400';
                    svgHeight = 250;
                    svgContent = heatmap.drawFieldHeatmap(pointsFeld, 0, prefix);
                } else if (hasWurfbild) {
                    viewBox = '0 -60 300 260';
                    svgHeight = 180;
                    svgContent = heatmap.drawGoalHeatmap(pointsTor, 0, prefix);
                }

                if (svgContent) {
                    const svgContainer = document.createElement('div');
                    svgContainer.className = 'shot-visual-container';
                    svgContainer.style.background = '#1a1a1a';
                    svgContainer.style.borderRadius = '4px';
                    svgContainer.style.padding = '5px';
                    svgContainer.style.display = 'flex';
                    svgContainer.style.justifyContent = 'center';
                    svgContainer.style.alignItems = 'center';
                    svgContainer.innerHTML = `<svg viewBox="${viewBox}" width="200" height="${svgHeight}">${svgContent}</svg>`;
                    div.appendChild(svgContainer);
                }

                return div;
            };

            if (wurfbilder.heim.length > 0) {
                const h4 = document.createElement('h4');
                h4.textContent = spielstand.settings.teamNameHeim;
                h4.style.marginLeft = '10px';
                shotsContent.appendChild(h4);
                wurfbilder.heim.sort((a, b) => a.number - b.number).forEach(p => shotsContent.appendChild(renderPlayerGroup(p)));
            }

            if (wurfbilder.heim7m && wurfbilder.heim7m.length > 0) {
                const h4 = document.createElement('h4');
                h4.textContent = spielstand.settings.teamNameHeim + " (7m)";
                h4.style.marginLeft = '10px';
                shotsContent.appendChild(h4);
                wurfbilder.heim7m.sort((a, b) => a.number - b.number).forEach(p => shotsContent.appendChild(renderPlayerGroup(p, true)));
            }

            if (wurfbilder.gegner.length > 0) {
                const h4 = document.createElement('h4');
                h4.textContent = spielstand.settings.teamNameGegner + " (Feldtore)";
                h4.style.marginLeft = '10px';
                shotsContent.appendChild(h4);
                wurfbilder.gegner.sort((a, b) => a.number - b.number).forEach(p => shotsContent.appendChild(renderPlayerGroup(p)));
            }

            if (wurfbilder.gegner7m.length > 0) {
                const h4 = document.createElement('h4');
                h4.textContent = "Gegner 7m";
                h4.style.marginLeft = '10px';
                shotsContent.appendChild(h4);
                wurfbilder.gegner7m.sort((a, b) => a.number - b.number).forEach(p => shotsContent.appendChild(renderPlayerGroup(p, true)));
            }

            if (wurfbilder.heim.length === 0 && (!wurfbilder.heim7m || wurfbilder.heim7m.length === 0) && wurfbilder.gegner.length === 0 && wurfbilder.gegner7m.length === 0) {
                shotsContent.innerHTML = '<p style="text-align:center; padding:20px;">Noch keine Wurfbilder aufgezeichnet.</p>';
            }
        });
    });
}



function showLiveHeatmapInline() {
    liveHeatmapBereich.classList.remove('versteckt');

    // Update Team Names in labels
    const heimLabel = document.getElementById('heatmapHeimLabel');
    const gegnerLabel = document.getElementById('heatmapGegnerLabel');
    if (heimLabel) heimLabel.textContent = spielstand.settings.teamNameHeim || 'HEIM';
    if (gegnerLabel) gegnerLabel.textContent = spielstand.settings.teamNameGegner || 'GEGNER';

    import('./modules/heatmap.js').then(heatmap => {
        const teamToggle = document.getElementById('heatmapTeamToggle');
        const playerSelect = document.getElementById('heatmapPlayerSelect');

        // Helper to get selected team
        const getSelectedTeam = () => {
            if (!teamToggle) return 'heim';
            return teamToggle.dataset.state === 'checked' ? 'gegner' : 'heim';
        };

        if (playerSelect) {
            const currentVal = playerSelect.value;
            playerSelect.innerHTML = '<option value="all">Alle Spieler</option>';

            const team = getSelectedTeam();
            const list = team === 'heim' ? spielstand.roster : (spielstand.knownOpponents || []);

            list.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.number;
                opt.textContent = p.name ? `#${p.number} ${p.name}` : `#${p.number}`;
                playerSelect.appendChild(opt);
            });

            playerSelect.value = currentVal || 'all';

            // Event Listener for Player Select
            if (!playerSelect.dataset.bound) {
                playerSelect.addEventListener('change', () => {
                    const filter = {
                        team: getSelectedTeam(),
                        player: playerSelect.value === 'all' ? null : parseInt(playerSelect.value)
                    };
                    heatmap.renderHeatmap(heatmapSvg, spielstand.gameLog, false, filter);
                });
                playerSelect.dataset.bound = "true";
            }
        }

        // Team Toggle Listener
        if (teamToggle && !teamToggle.dataset.bound) {
            teamToggle.addEventListener('click', () => {
                const isChecked = teamToggle.dataset.state === 'checked';
                const newState = !isChecked;

                teamToggle.dataset.state = newState ? 'checked' : 'unchecked';
                teamToggle.setAttribute('aria-checked', newState);

                // Opacity feedback for labels
                if (heimLabel) heimLabel.style.opacity = newState ? '0.4' : '1';
                if (gegnerLabel) gegnerLabel.style.opacity = newState ? '1' : '0.4';

                showLiveHeatmapInline(); // Re-populate for other team
            });
            teamToggle.dataset.bound = "true";
        }

        const filter = {
            team: getSelectedTeam(),
            player: playerSelect && playerSelect.value !== 'all' ? parseInt(playerSelect.value) : null
        };

        // Always reset context for live heatmap view to ensure we show live game data
        heatmap.setCurrentHeatmapContext(null);
        heatmap.renderHeatmap(heatmapSvg, spielstand.gameLog, false, filter);
    });
}

function showSettingsInline() {
    settingsBereich.classList.remove('versteckt');
    // Settings values are managed by initApp
}

function hideAllSections() {
    if (rosterBereich) rosterBereich.classList.add('versteckt');
    if (spielBereich) spielBereich.classList.add('versteckt');
    if (liveOverviewBereich) liveOverviewBereich.classList.add('versteckt');
    if (calendarBereich) calendarBereich.classList.add('versteckt');
    if (seasonBereich) seasonBereich.classList.add('versteckt');
    if (seasonStatsBereich) seasonStatsBereich.classList.add('versteckt'); // Added
    if (shotsBereich) shotsBereich.classList.add('versteckt');
    if (exportBereich) exportBereich.classList.add('versteckt');
    const dashboardBereich = document.getElementById('dashboardBereich');
    if (dashboardBereich) dashboardBereich.classList.add('versteckt');
    if (settingsBereich) settingsBereich.classList.add('versteckt');
    if (liveHeatmapBereich) liveHeatmapBereich.classList.add('versteckt');
    if (historieBereich) historieBereich.classList.add('versteckt');
    if (historieDetailBereich) historieDetailBereich.classList.add('versteckt');
    const seasonHeatmapBereich = document.getElementById('seasonHeatmapBereich');
    if (seasonHeatmapBereich) seasonHeatmapBereich.classList.add('versteckt');
    if (teamDiagrammBereich) teamDiagrammBereich.classList.add('versteckt');
    if (globalAktionen) globalAktionen.classList.add('versteckt');
    if (scoreWrapper) scoreWrapper.classList.add('versteckt');
    if (statistikWrapper) statistikWrapper.classList.add('versteckt');
    if (protokollBereich) protokollBereich.classList.add('versteckt');
    const vaBereich = document.getElementById('videoAnalyseBereich');
    if (vaBereich) vaBereich.classList.add('versteckt');
    const tbBereich = document.getElementById('tacticalBoardBereich');
    if (tbBereich) tbBereich.classList.add('versteckt');
}

async function showTeamDiagrammView() {
    teamDiagrammBereich.classList.remove('versteckt');

    // Clear previous content
    teamDiagrammContent.innerHTML = '';

    // Get Data
    const summary = await getSeasonSummary();
    if (!summary || !summary.players || summary.players.length === 0) {
        teamDiagrammContent.innerHTML = '<p style="padding: 20px; color: #ccc;">Keine Saison-Daten verfügbar. Spiele erst einige Spiele.</p>';
        return;
    }

    // Render Scatter Plot
    const scatterPlot = renderTeamScatterPlot(summary.players);
    if (scatterPlot) {
        teamDiagrammContent.appendChild(scatterPlot);
    } else {
        teamDiagrammContent.innerHTML = '<p style="padding: 20px; color: #ccc;">Zu wenige Daten fÃ¼r das Diagramm (mindestens 2 Spieler mit Toren/WÃ¼rfen benÃ¶tigt).</p>';
    }

    // Hide modals
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => modal.classList.add('versteckt'));
}

// --- App is started ONLY after Firebase Auth confirms login ---
// See: onFirebaseLogin() below

function renderGameViewFull() {
    if (spielBereich) spielBereich.classList.remove('versteckt');
    if (globalAktionen) globalAktionen.classList.remove('versteckt');
    if (scoreWrapper) scoreWrapper.classList.remove('versteckt');

    // Ensure UI is updated
    updateScoreDisplay();
    import('./modules/game.js').then(game => {
        if (game.applyGameMode) game.applyGameMode();
        game.updateGameControls();
    });
    zeichneSpielerRaster();
    updateProtokollAnzeige();
}

function setupGameModeListeners() {
    const btnComplex = document.getElementById('btnSelectComplex');
    const btnSimple = document.getElementById('btnSelectSimple');

    const applyMode = (mode) => {
        spielstand.gameMode = mode;
        spielstand.modeSelected = true;
        import('./modules/state.js').then(s => s.speichereSpielstand());

        // Refresh View
        navigateToView('game');
    };

    if (btnComplex) {
        // Clone/Replace to ensure no duplicate listeners if run multiple times (hot reload)
        const newBtn = btnComplex.cloneNode(true);
        btnComplex.parentNode.replaceChild(newBtn, btnComplex);
        newBtn.addEventListener('click', () => applyMode('complex'));
    }

    if (btnSimple) {
        const newBtn = btnSimple.cloneNode(true);
        btnSimple.parentNode.replaceChild(newBtn, btnSimple);
        newBtn.addEventListener('click', () => applyMode('simple'));
    }
}

// Init listeners immediately
setupGameModeListeners();

// Listen for Game Reset
document.addEventListener('gameStateReset', () => {
    navigateToView('game');
});

// ─── Firebase Auth Gate ────────────────────────────────────────────────────────
/**
 * Full UI refresh after Firestore data is merged into spielstand.
 * Called both on initial load and on every onSnapshot update.
 */
function refreshUIFromState() {
    // Sync input fields
    if (toggleDarkMode) toggleDarkMode.checked = spielstand.settings.darkMode;
    if (toggleWurfbildHeim) toggleWurfbildHeim.checked = spielstand.settings.showWurfbildHeim;
    if (toggleWurfbildGegner) toggleWurfbildGegner.checked = spielstand.settings.showWurfbildGegner;
    if (toggleWurfpositionHeim) toggleWurfpositionHeim.checked = spielstand.settings.showWurfpositionHeim;
    if (toggleWurfpositionGegner) toggleWurfpositionGegner.checked = spielstand.settings.showWurfpositionGegner;
    if (rosterTeamNameHeim) rosterTeamNameHeim.value = spielstand.settings.teamNameHeim || 'Heim';
    if (rosterTeamNameGegner) rosterTeamNameGegner.value = spielstand.settings.teamNameGegner || 'Gegner';

    applyTheme();
    updateScoreDisplay();
    zeichneSpielerRaster();
    updateSuspensionDisplay();
    updateProtokollAnzeige();

    if (window.lucide) window.lucide.createIcons();
}

/**
 * Wire up Login Modal submit button.
 */
function initLoginUI() {
    const errorMsg = document.getElementById('loginErrorMessage');
    const submitBtn = document.getElementById('loginSubmitBtn');
    const emailInput = document.getElementById('loginEmailInput');
    const passwordInput = document.getElementById('loginPasswordInput');
    const toggleBtn = document.getElementById('toggleAuthMode');
    const subtitle = document.getElementById('loginSubtitle');

    let isRegisterMode = false;

    const toggleMode = () => {
        isRegisterMode = !isRegisterMode;
        if (isRegisterMode) {
            submitBtn.textContent = 'Konto erstellen';
            subtitle.textContent = 'Erstelle ein neues Konto';
            toggleBtn.textContent = 'Bereits ein Konto? Anmelden';
        } else {
            submitBtn.textContent = 'Anmelden';
            subtitle.textContent = 'Melde dich an, um fortzufahren';
            toggleBtn.textContent = 'Noch kein Konto? Registrieren';
        }
        if (errorMsg) errorMsg.textContent = '';
    };

    if (toggleBtn) toggleBtn.addEventListener('click', toggleMode);

    const doAuth = async () => {
        const email = emailInput?.value;
        const password = passwordInput?.value;

        if (!email || !password) {
            if (errorMsg) errorMsg.textContent = 'Bitte E-Mail und Passwort eingeben.';
            return;
        }

        submitBtn.disabled = true;
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Warten…';

        const result = isRegisterMode 
            ? await firebaseRegister(email, password)
            : await firebaseLogin(email, password);

        if (!result.success) {
            if (errorMsg) errorMsg.textContent = result.error;
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    };

    submitBtn.addEventListener('click', doAuth);
    passwordInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') doAuth();
    });
    emailInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') passwordInput?.focus();
    });
    const googleBtn = document.getElementById('googleLoginBtn');
    if (googleBtn) {
        googleBtn.addEventListener('click', async () => {
            if (errorMsg) errorMsg.textContent = '';
            googleBtn.disabled = true;
            const originalHtml = googleBtn.innerHTML;
            googleBtn.textContent = 'Verbinden…';
            
            const result = await loginWithGoogle();
            
            if (!result.success) {
                if (errorMsg) errorMsg.textContent = result.error || 'Google-Anmeldung fehlgeschlagen.';
                googleBtn.innerHTML = originalHtml;
                googleBtn.disabled = false;
            }
        });
    }
}

/**
 * Wire up Logout button in sidebar.
 */
function initLogoutUI() {
    const logoutBtn = document.getElementById('firebaseLogoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            const confirmed = await customConfirm('Abmelden?', 'Möchtest du dich wirklich abmelden? Lokale Änderungen gehen verloren.');
            if (confirmed) {
                await firebaseLogout();
                onFirebaseLogout();
            }
        });
    }
}

/**
 * Handle incoming invite links
 */
async function handleInviteUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const inviteToken = urlParams.get('invite');

    if (inviteToken) {
        // Save invite to session in case user needs to login first
        sessionStorage.setItem('pending_invite', inviteToken);
        
        // Clean URL to avoid re-runs on refresh
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
    }
}

/**
 * Check if there is a pending invite in session storage and redeem it
 */
async function processPendingInvite() {
    const inviteToken = sessionStorage.getItem('pending_invite');
    if (!inviteToken) return;

    // Wait a bit for auth to be fully ready
    setTimeout(async () => {
        const result = await redeemInviteToken(inviteToken);
        sessionStorage.removeItem('pending_invite');

        if (result.success) {
            customAlert(`Erfolg! Du bist dem Team "${result.teamName}" beigetreten.`, 'Beitritt erfolgreich');
            // Refresh team lists
            if (typeof initTeamsView === 'function') {
                await initTeamsView();
            }
        } else {
            console.warn('[Invite] Redemption failed:', result.error);
            // Only show alert if it's a real error (not just already member)
            if (!result.error.includes('already member')) {
                customAlert(result.error, 'Einladung Fehler');
            }
        }
    }, 1000);
}

/**
 * Called after successful Firebase login.
 * Loads Firestore data, starts listener, and boots the app.
 */
async function onFirebaseLogin(user, profile) {
    console.log('[Firebase] Logged in as:', user.email);

    // Process any invitations
    await handleInviteUrl();
    await processPendingInvite();

    // Hide login overlay
    const loginOverlay = document.getElementById('firebaseLoginOverlay');
    if (loginOverlay) {
        loginOverlay.style.transition = 'opacity 0.4s ease, visibility 0.4s';
        loginOverlay.style.opacity = '0';
        loginOverlay.style.visibility = 'hidden';
    }

    // Show Team Selection/Creation Overlay
    showTeamSelectionOverlay(profile, (selectedTeamId) => {
        bootApp(selectedTeamId);
    });
}

/**
 * Consolidate app startup after team is selected.
 */
async function bootApp(teamId) {
    console.log('[App] Booting for team:', teamId);

    // 0. Ensure clean slate before loading new team data
    resetSpielstand();
    
    // 1. Try to load from Firestore first
    const remoteData = await loadSpielstandFromFirestore();
    let skipLocal = false;
    if (remoteData) {
        mergeRemoteSpielstand(remoteData);
        skipLocal = true;
    }

    // 2. Load saved teams (roster) from Firestore
    const remoteTeams = await loadTeamsFromFirestore();
    if (remoteTeams) {
        localStorage.setItem('handball_saved_teams', JSON.stringify(remoteTeams));
    }

    // 3. Boot the app - only load local if remote is empty
    initApp(skipLocal);
    initSidebar();
    registerEventListeners();
    initCustomDialogs();
    initLogoutUI();

    // Navigate to correct initial view (scope to current state)
    const initialView = spielstand.uiState === 'game' ? 'game' : 'dashboard';
    const navItemsAll = document.querySelectorAll('.nav-item');
    navItemsAll.forEach(i => {
        if (i.dataset.view === initialView) i.classList.add('active');
        else i.classList.remove('active');
    });
    navigateToView(initialView);
    updateSidebarTimerVisibility(initialView);

    // 4. Start real-time Firestore listeners
    startSpielstandListener((remoteData) => {
        if (!remoteData) return;
        console.log('[Firebase] Remote update received');
        mergeRemoteSpielstand(remoteData);
        refreshUIFromState();
    });

    startTeamsListener((remoteTeams) => {
        if (!remoteTeams) return;
        localStorage.setItem('handball_saved_teams', JSON.stringify(remoteTeams));
    });

    // 5. Show player name selection if not yet assigned
    showPlayerNameSelection(() => {
        console.log('[App] Player name assignment complete.');
    });
}

/**
 * Called when Firebase auth state becomes logged out.
 */
function onFirebaseLogout() {
    console.log('[Firebase] Logged out – user not authenticated');
    updateStatusIndicator('offline');

    // 1. Full Data Wipe on Logout
    resetSpielstand();
    clearLocalHistory();

    // 2. UI Reset
    renderHistoryList(); // Now renders empty/loading
    
    // 3. Safely stop listener – only if one was started
    try { stopSpielstandListener(); } catch (e) { /* ignore */ }

    // 4. Show login overlay – NEVER reload the page automatically
    const overlay = document.getElementById('firebaseLoginOverlay');
    if (overlay) {
        overlay.style.visibility = 'visible';
        overlay.style.opacity = '1';
        // Re-enable the form
        const submitBtn = document.getElementById('loginSubmitBtn');
        if (submitBtn) { submitBtn.textContent = 'Anmelden'; submitBtn.disabled = false; }
    }
}

// ─── Bootstrap ─────────────────────────────────────────────────────────────────
// Init login form
initLoginUI();

// Watch auth state – this is the main entry point
onAuthChange(onFirebaseLogin, onFirebaseLogout);
