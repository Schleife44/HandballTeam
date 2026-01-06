// main.js - Entry Point
// Minimal setup: Load data, initialize UI, register event listeners

import { ladeSpielstandDaten, spielstand, speichereSpielstand } from './modules/state.js';
import {
    toggleDarkMode, myTeamNameInput,
    toggleWurfbildHeim, toggleWurfbildGegner, inputTeamNameHeim,
    inputTeamNameGegner, toggleWurfpositionHeim, toggleWurfpositionGegner,
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
import { initCustomDialogs } from './modules/customDialog.js';
import { renderHistoryList } from './modules/historyView.js';

import { openSeasonOverview, renderTeamScatterPlot, getSeasonSummary } from './modules/seasonView.js';
import { getHistorie } from './modules/history.js';
import { exportiereAlsPdf, exportiereAlsTxt, exportiereAlsCsv } from './modules/export.js';
import { showDashboardInline } from './modules/dashboardView.js';
import { initSettingsPage, updateRosterInputsForValidation } from './modules/settingsManager.js';

// --- App Initialization ---
// --- App Initialization ---

function initApp() {
    const geladen = ladeSpielstandDaten();

    // Set UI checkboxes from loaded data
    if (toggleDarkMode) toggleDarkMode.checked = spielstand.settings.darkMode;

    if (toggleWurfbildHeim) toggleWurfbildHeim.checked = spielstand.settings.showWurfbildHeim;
    if (toggleWurfbildGegner) toggleWurfbildGegner.checked = spielstand.settings.showWurfbildGegner;
    if (toggleWurfpositionHeim) toggleWurfpositionHeim.checked = spielstand.settings.showWurfpositionHeim;
    if (toggleWurfpositionGegner) toggleWurfpositionGegner.checked = spielstand.settings.showWurfpositionGegner;
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

    if (geladen && spielstand.uiState === 'game') {
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

function navigateToView(view) {
    // Hide all sections first
    hideAllSections();

    switch (view) {
        case 'dashboard':
            showDashboardInline();
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
            import('./modules/calendar.js').then(cal => cal.initCalendar());
            break;
        case 'game':
            if (spielBereich) spielBereich.classList.remove('versteckt');

            // In-page selection logic
            const modeSelection = document.getElementById('gameModeSelection');
            const gameContent = document.getElementById('gameContent');

            console.log("DEBUG: navigateToView('game')", {
                phase: spielstand.timer.gamePhase,
                modeSelected: spielstand.modeSelected,
                check: (spielstand.timer.gamePhase === 1 && !spielstand.modeSelected)
            });

            // Determine if we need selection or game content
            if (spielstand.timer.gamePhase === 1 && !spielstand.modeSelected) {
                console.log("DEBUG: Showing Selection");
                // Show Selection
                if (modeSelection) modeSelection.style.display = 'flex';
                if (gameContent) gameContent.style.display = 'none';

                // Hide specific controls during selection for cleaner look
                if (globalAktionen) globalAktionen.classList.add('versteckt');
                if (scoreWrapper) scoreWrapper.classList.add('versteckt');

            } else {
                console.log("DEBUG: Showing Content");
                // Show Content
                if (modeSelection) modeSelection.style.display = 'none';
                if (gameContent) gameContent.style.display = 'block';

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
            showSeasonInline();
            break;
        case 'shots':
            showShotsInline();
            break;
        case 'settings':
            showSettingsInline();
            // Initialize settings page UI (set values and validation state)
            initSettingsPage();
            break;
        case 'heatmap':
            showLiveHeatmapInline();
            break;
        case 'seasonheatmap':
            showSeasonHeatmapInline();
            break;
        case 'teamdiagramm':
            showTeamDiagrammView();
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

function showSeasonInline() {
    seasonBereich.classList.remove('versteckt');

    // Create the required DOM structure directly in seasonContent
    seasonContent.innerHTML = `
        <div class="section-container" style="padding: 0;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <h1>Saisonstatistiken</h1>
            </div>
            <div id="seasonSummary"></div>
            <div id="seasonStatsContainer"></div>
        </div>
    `;

    import('./modules/seasonView.js').then(seasonView => {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
            // Verify elements exist
            const summary = document.getElementById('seasonSummary');
            const container = document.getElementById('seasonStatsContainer');

            if (summary && container) {
                // Call renderSeasonStats which will now render into our inline elements
                seasonView.renderSeasonStats();

                // Wait for rendering to complete, then reattach event listeners
                setTimeout(() => {
                    // 1. Player heatmap buttons (Grafik and 7m Grafik)
                    const heatmapButtons = seasonContent.querySelectorAll('.show-heatmap-btn');
                    heatmapButtons.forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            const playerIndex = parseInt(btn.dataset.playerIndex);
                            const mode = btn.dataset.mode || 'field';
                            seasonView.showPlayerHeatmap(playerIndex, mode);
                        });
                    });

                    // 2. Team heatmap buttons (Team Grafik)
                    const teamButtons = seasonContent.querySelectorAll('.show-team-heatmap-btn');
                    teamButtons.forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            const team = btn.dataset.team;
                            seasonView.showTeamHeatmap(team);
                        });
                    });
                }, 100);
            } else {
                console.error('Season elements not found!', summary, container);
                seasonContent.innerHTML = '<p style="padding: 20px;">Fehler beim Laden der Saisonstatistiken.</p>';
            }
        }, 50);
    });
}

function showSeasonHeatmapInline() {
    // Create inline section if it doesn't exist
    let seasonHeatmapBereich = document.getElementById('seasonHeatmapBereich');
    if (!seasonHeatmapBereich) {
        seasonHeatmapBereich = document.createElement('div');
        seasonHeatmapBereich.id = 'seasonHeatmapBereich';
        seasonHeatmapBereich.className = 'content-section';
        seasonHeatmapBereich.innerHTML = `
            <div class="heatmap-view-container">
                <div class="heatmap-view-header">
                    <h1>Saison-Heatmap</h1>
                </div>
                
                <div class="heatmap-controls-card">
                    <!-- Row 1: Selects -->
                    <div class="heatmap-row">
                        <div class="roster-input-group">
                            <label>Team</label>
                            <select id="seasonHeatmapTeamSelect" class="shadcn-input shadcn-select-native">
                                <option value="all">Alle Teams</option>
                            </select>
                        </div>
                        <div class="roster-input-group">
                            <label>Spieler</label>
                            <select id="seasonHeatmapPlayerSelect" class="shadcn-input shadcn-select-native">
                                <option value="all">Alle Spieler</option>
                            </select>
                        </div>
                    </div>

                    <!-- Row 2: Tabs -->
                    <div class="heatmap-tabs-row">
                        <button class="heatmap-tab white-style active" data-tab="tor">Tor-Ansicht</button>
                        <button class="heatmap-tab white-style" data-tab="feld">Wurf-Positionen</button>
                        <button class="heatmap-tab white-style" data-tab="kombiniert">Kombiniert</button>
                    </div>

                    <!-- Row 3: Filters -->
                    <div class="heatmap-filters-row">
                        <label class="heatmap-filter-item">
                            <input type="checkbox" id="seasonHeatmapToreFilter" checked> Feldtore
                        </label>
                        <label class="heatmap-filter-item">
                            <input type="checkbox" id="seasonHeatmap7mFilter"> 7m
                        </label>
                        <label class="heatmap-filter-item">
                            <input type="checkbox" id="seasonHeatmapMissedFilter" checked> Fehlwürfe
                        </label>
                    </div>
                </div>
                
                <div class="heatmap-visual-container">
                   <svg id="seasonHeatmapSvg" width="300" height="500"></svg>
                </div>
            </div>
        `;
        document.getElementById('main-content').appendChild(seasonHeatmapBereich);

        // Add event listeners (attached once)
        const tabButtons = seasonHeatmapBereich.querySelectorAll('.heatmap-tab');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                tabButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                import('./modules/heatmap.js').then(heatmap => {
                    heatmap.setCurrentHeatmapTab(btn.dataset.tab);
                    renderSeasonHeatmap();
                });
            });
        });

        const filters = seasonHeatmapBereich.querySelectorAll('input[type="checkbox"]');
        filters.forEach(filter => {
            filter.addEventListener('change', () => renderSeasonHeatmap());
        });

        const teamSelect = seasonHeatmapBereich.querySelector('#seasonHeatmapTeamSelect');
        const playerSelect = seasonHeatmapBereich.querySelector('#seasonHeatmapPlayerSelect');

        if (teamSelect) {
            teamSelect.addEventListener('change', (e) => {
                // Reset player selection when team changes
                if (playerSelect) playerSelect.value = 'all';
                // Always reset context on manual user change
                import('./modules/heatmap.js').then(heatmap => {
                    heatmap.setCurrentHeatmapContext('season');
                    // Reset title (only for Season Heatmap)
                    const seasonBereich = document.getElementById('seasonHeatmapBereich');
                    if (seasonBereich) {
                        const h1 = seasonBereich.querySelector('.heatmap-view-header h1');
                        if (h1) h1.textContent = 'Saison-Heatmap';
                    }
                    renderSeasonHeatmap();
                });
            });
        }
        if (playerSelect) {
            playerSelect.addEventListener('change', () => {
                // Always reset context on manual user change
                import('./modules/heatmap.js').then(heatmap => {
                    heatmap.setCurrentHeatmapContext('season');
                    // Reset title (only for Season Heatmap)
                    const seasonBereich = document.getElementById('seasonHeatmapBereich');
                    if (seasonBereich) {
                        const h1 = seasonBereich.querySelector('.heatmap-view-header h1');
                        if (h1) h1.textContent = 'Saison-Heatmap';
                    }
                    renderSeasonHeatmap();
                });
            });
        }
    }

    seasonHeatmapBereich.classList.remove('versteckt');

    // Set initial context and state
    import('./modules/seasonView.js').then(seasonView => {
        import('./modules/heatmap.js').then(heatmap => {
            const existingContext = heatmap.getCurrentHeatmapContext();
            let useSeasonDefault = true;

            if (existingContext && typeof existingContext === 'object' && (existingContext.type === 'season-specific' || existingContext.type === 'history-specific')) {
                useSeasonDefault = false;

                // Set dropdowns and filters based on context
                const teamSelect = seasonHeatmapBereich.querySelector('#seasonHeatmapTeamSelect');
                const playerSelect = seasonHeatmapBereich.querySelector('#seasonHeatmapPlayerSelect');

                // Set filter checkboxes based on context
                if (existingContext.initialFilters) {
                    const toreFilter = seasonHeatmapBereich.querySelector('#seasonHeatmapToreFilter');
                    const sevenMFilter = seasonHeatmapBereich.querySelector('#seasonHeatmap7mFilter');
                    const missedFilter = seasonHeatmapBereich.querySelector('#seasonHeatmapMissedFilter');

                    if (toreFilter) toreFilter.checked = existingContext.initialFilters.tore;
                    if (sevenMFilter) sevenMFilter.checked = existingContext.initialFilters.seven_m;
                    if (missedFilter) missedFilter.checked = existingContext.initialFilters.missed;
                }

                // Set dropdowns immediately (no setTimeout needed)
                if (teamSelect && playerSelect && existingContext.filter) {
                    const requestedTeam = existingContext.filter.team;
                    let team = requestedTeam === 'heim' ? 'Heim' : requestedTeam;

                    // Match normalized team name to existing summary data
                    const summary = seasonView.getSeasonSummary();

                    const normalize = (name) => {
                        if (!name) return '';
                        return name.toLowerCase().trim().replace(/^(tv|sg|hsg|tsv|sv|tus|sc)\b\s*/, '');
                    };
                    const normRequested = normalize(team);

                    if (summary && team !== 'Heim') {
                        const match = summary.players.find(p => p.team !== 'Heim' && normalize(p.team) === normRequested);
                        if (match) {
                            team = match.team;
                        }
                    }



                    // Set team dropdown (even if option doesn't exist yet, renderSeasonHeatmap will populate)
                    // But we need to populate it first if it's empty

                    if (summary && teamSelect.options.length <= 1) {
                        const teams = new Set();
                        summary.players.forEach(p => teams.add(p.team || 'Heim'));

                        const optOpp = document.createElement('option');
                        optOpp.value = 'all_opponents';
                        optOpp.textContent = 'Alle Gegner';
                        teamSelect.appendChild(optOpp);

                        const sortedTeams = Array.from(teams).sort((a, b) => {
                            if (a === 'Heim') return -1;
                            if (b === 'Heim') return 1;
                            return a.localeCompare(b);
                        });

                        const myLabel = spielstand.settings.myTeamName || spielstand.settings.teamNameHeim || 'Heim';

                        sortedTeams.forEach(t => {
                            const opt = document.createElement('option');
                            opt.value = t;
                            opt.textContent = t === 'Heim' ? myLabel : t;
                            teamSelect.appendChild(opt);
                        });
                    } else if (summary && team !== 'Heim' && team !== 'all' && team !== 'all_opponents') {
                        // Dropdown already has options, but check if this specific team exists
                        const teamOption = teamSelect.querySelector(`option[value="${team}"]`);
                        if (!teamOption) {
                            // Add the missing team option
                            const opt = document.createElement('option');
                            opt.value = team;
                            opt.textContent = team;
                            teamSelect.appendChild(opt);
                        }
                    }

                    teamSelect.value = team;

                    // Manually populate player dropdown (dispatchEvent doesn't work)

                    if (summary) {
                        const filteredPlayers = summary.players.filter(p => {
                            if (team === 'all') return true;
                            if (team === 'all_opponents') return p.team !== 'Heim';
                            return p.team === team;
                        });

                        filteredPlayers.sort((a, b) => (a.number || 0) - (b.number || 0));

                        playerSelect.innerHTML = '<option value="all">Alle Spieler</option>';
                        filteredPlayers.forEach(p => {
                            const opt = document.createElement('option');
                            opt.value = `${p.team}|${p.number}`;
                            let labelName = p.name || '';
                            if (p.team !== 'Heim' && (!labelName || labelName.toLowerCase().startsWith('gegner'))) {
                                labelName = labelName ? `${labelName} (${p.team})` : `(${p.team})`;
                            }
                            opt.textContent = `#${p.number} ${labelName}`;
                            playerSelect.appendChild(opt);
                        });


                        // Set the selected player after DOM update
                        setTimeout(() => {
                            if (existingContext.filter.player) {
                                const playerValue = `${team}|${existingContext.filter.player}`;
                                const playerOption = playerSelect.querySelector(`option[value="${playerValue}"]`);
                                if (playerOption) {
                                    playerSelect.value = playerValue;
                                } else {
                                    // Player not found in list - reset to 'all'
                                    playerSelect.value = 'all';
                                    console.warn(`Player ${playerValue} not found in dropdown`);
                                }
                            } else {
                                playerSelect.value = 'all';
                            }

                            // Set lastContext to sync with renderSeasonHeatmap logic
                            playerSelect.dataset.lastContext = `team:${team}`;
                        }, 50);
                    }
                }
            }

            if (useSeasonDefault) {
                heatmap.setCurrentHeatmapContext('season');
                heatmap.setCurrentHeatmapTab('tor');

                // Reset dropdowns
                const teamSelect = seasonHeatmapBereich.querySelector('#seasonHeatmapTeamSelect');
                const playerSelect = seasonHeatmapBereich.querySelector('#seasonHeatmapPlayerSelect');
                if (teamSelect) teamSelect.value = 'all';
                if (playerSelect) playerSelect.value = 'all';

                // Reset Tabs UI
                const tabButtons = seasonHeatmapBereich.querySelectorAll('.heatmap-tab');
                if (tabButtons.length > 0) {
                    tabButtons.forEach(b => b.classList.remove('active'));
                    const torTab = seasonHeatmapBereich.querySelector('[data-tab="tor"]');
                    if (torTab) torTab.classList.add('active');
                }
            }

            renderSeasonHeatmap();
        });
    });
}

function renderSeasonHeatmap() {
    import('./modules/seasonView.js').then(seasonView => {
        import('./modules/heatmap.js').then(heatmap => {
            const context = heatmap.getCurrentHeatmapContext();
            const svg = document.getElementById('seasonHeatmapSvg');
            if (!svg) return;

            // Toggle controls visibility based on context
            const controls = document.querySelector('.heatmap-controls');
            const isSpecificContext = context && typeof context === 'object' && (context.type === 'season-specific' || context.type === 'history-specific') && context.log;

            if (controls) {
                // Keep controls visible so users see the selection, but maybe style it?
                // For now, let's just make sure they are flex.
                controls.style.display = 'flex';
            }

            // If specific context provided (from Team/Player Grafik click), render it directly
            if (isSpecificContext) {
                // Pass filter if available in context
                heatmap.renderHeatmap(svg, context.log, true, context.filter);

                if (context.title) {
                    const seasonBereich = document.getElementById('seasonHeatmapBereich');
                    const h1 = seasonBereich?.querySelector('.heatmap-view-header h1');
                    if (h1) h1.textContent = context.title;
                }

                return;
            }

            // Default: Aggregate all season data
            const teamSelect = document.getElementById('seasonHeatmapTeamSelect');
            const playerSelect = document.getElementById('seasonHeatmapPlayerSelect');

            const selectedTeam = teamSelect ? teamSelect.value : 'all';
            const selectedPlayerVal = playerSelect ? playerSelect.value : 'all';

            // Title remains static as "Saison-Heatmap" (not dynamically updated)

            const summary = seasonView.getSeasonSummary();
            if (!summary) return;

            // --- FILTER POPULATION ---
            if (teamSelect && playerSelect) {
                // 1. Populate Teams if empty
                if (teamSelect.options.length <= 1) {
                    const teams = new Set();
                    summary.players.forEach(p => teams.add(p.team || 'Heim'));

                    // Add "Alle Gegner" option
                    const optOpp = document.createElement('option');
                    optOpp.value = 'all_opponents';
                    optOpp.textContent = 'Alle Gegner';
                    teamSelect.appendChild(optOpp);

                    // Sort teams: Heim first, then others
                    const sortedTeams = Array.from(teams).sort((a, b) => {
                        if (a === 'Heim') return -1;
                        if (b === 'Heim') return 1;
                        return a.localeCompare(b);
                    });

                    const myLabel = spielstand.settings.myTeamName || spielstand.settings.teamNameHeim || 'Heim';

                    sortedTeams.forEach(team => {
                        const opt = document.createElement('option');
                        opt.value = team;
                        opt.textContent = team === 'Heim' ? myLabel : team;
                        teamSelect.appendChild(opt);
                    });
                }

                // 2. Populate Players based on Team Selection
                const contextKey = `team:${selectedTeam}`;

                // Only repopulate if context changed (optimization)
                if (playerSelect.dataset.lastContext !== contextKey) {
                    const oldVal = playerSelect.value;
                    playerSelect.innerHTML = '<option value="all">Alle Spieler</option>';

                    const filteredPlayers = summary.players.filter(p => {
                        if (selectedTeam === 'all') return true;
                        if (selectedTeam === 'all_opponents') return p.team !== 'Heim';
                        return p.team === selectedTeam;
                    });

                    // Sort: Heim players by number, opponents by number
                    filteredPlayers.sort((a, b) => (a.number || 0) - (b.number || 0));

                    filteredPlayers.forEach(p => {
                        const opt = document.createElement('option');
                        // Use compound ID for uniqueness across teams
                        opt.value = `${p.team}|${p.number}`;

                        let labelName = p.name || '';
                        // If unnamed or generic 'Gegner' name (e.g. "Gegner", "Gegner #5"), append Team Name
                        if (p.team !== 'Heim' && (!labelName || labelName.toLowerCase().startsWith('gegner'))) {
                            labelName = labelName ? `${labelName} (${p.team})` : `(${p.team})`;
                        }

                        opt.textContent = `#${p.number} ${labelName}`;
                        playerSelect.appendChild(opt);
                    });

                    playerSelect.dataset.lastContext = contextKey;

                    // Restore selection if valid
                    // (But usually team change implies reset, handled by listener. This handles initial load or refresh)
                }
            }

            // --- DATA FILTERING & AGGREGATION ---

            const allSeasonLogs = [];
            summary.players.forEach(player => {
                // Team Filter
                if (selectedTeam === 'all_opponents') {
                    if (player.team === 'Heim') return;
                } else if (selectedTeam !== 'all' && player.team !== selectedTeam) {
                    return;
                }

                // Player Filter
                // player.number vs selected "team|number"
                if (selectedPlayerVal !== 'all') {
                    const [pTeam, pNum] = selectedPlayerVal.split('|');
                    if (player.team !== pTeam || String(player.number) !== String(pNum)) return;
                }

                if (player.seasonLog && player.seasonLog.length > 0) {
                    allSeasonLogs.push(...player.seasonLog.map(entry => ({
                        ...entry,
                        number: entry.playerId || player.number,
                        team: player.team
                    })));
                }
            });

            // Render heatmap
            heatmap.renderHeatmap(svg, allSeasonLogs);
        });
    });
}


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
}

function showTeamDiagrammView() {
    teamDiagrammBereich.classList.remove('versteckt');

    // Clear previous content
    teamDiagrammContent.innerHTML = '';

    // Get Data
    const summary = getSeasonSummary();
    if (!summary || !summary.players || summary.players.length === 0) {
        teamDiagrammContent.innerHTML = '<p style="padding: 20px; color: #ccc;">Keine Saison-Daten verfÃ¼gbar. Spiele erst einige Spiele.</p>';
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

// --- Start App ---
initCustomDialogs();
registerEventListeners();
initApp();
initSidebar();

// --- Initial View State ---
let initialView = 'dashboard';
if (spielstand.uiState === 'game') {
    initialView = 'game';
} else {
    initialView = document.querySelector('.nav-item.active')?.dataset.view || 'dashboard';
}

// Ensure correct item is active in sidebar
const navItems = document.querySelectorAll('.nav-item');
navItems.forEach(i => {
    if (i.dataset.view === initialView) {
        i.classList.add('active');
    } else {
        i.classList.remove('active');
    }
});

navigateToView(initialView);
updateSidebarTimerVisibility(initialView);

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
