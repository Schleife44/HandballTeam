// main.js - Entry Point
// Minimal setup: Load data, initialize UI, register event listeners

import { ladeSpielstandDaten, spielstand, speichereSpielstand } from './modules/state.js';
import {
    toggleDarkMode,
    toggleWurfbildHeim, toggleWurfbildGegner, inputTeamNameHeim,
    inputTeamNameGegner, toggleWurfpositionHeim, toggleWurfpositionGegner,
    rosterBereich, spielBereich, globalAktionen, scoreWrapper, timerAnzeige,
    statistikWrapper, pauseButton, gamePhaseButton, spielBeendenButton,
    liveOverviewBereich, liveOverviewContent, seasonBereich, seasonContent,

    shotsBereich, shotsContent, historieBereich, historieDetailBereich,
    settingsBereich, rosterTeamNameHeim, rosterTeamNameGegner,
    liveHeatmapBereich, teamDiagrammBereich, teamDiagrammContent, protokollBereich,
    mobileMenuBtn, sidebarOverlay, sidebar,
} from './modules/dom.js';
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

// --- App Initialization ---
let dashboardRenderId = 0;
let dashboardCharts = [];

function initApp() {
    initSidebar();
    const geladen = ladeSpielstandDaten();

    // Set UI checkboxes from loaded data
    if (toggleDarkMode) toggleDarkMode.checked = spielstand.settings.darkMode;

    if (toggleWurfbildHeim) toggleWurfbildHeim.checked = spielstand.settings.showWurfbildHeim;
    if (toggleWurfbildGegner) toggleWurfbildGegner.checked = spielstand.settings.showWurfbildGegner;
    if (toggleWurfpositionHeim) toggleWurfpositionHeim.checked = spielstand.settings.showWurfpositionHeim;
    if (toggleWurfpositionGegner) toggleWurfpositionGegner.checked = spielstand.settings.showWurfpositionGegner;
    if (inputTeamNameHeim) inputTeamNameHeim.value = spielstand.settings.teamNameHeim;
    if (inputTeamNameGegner) inputTeamNameGegner.value = spielstand.settings.teamNameGegner;
    if (rosterTeamNameHeim) rosterTeamNameHeim.value = spielstand.settings.teamNameHeim;
    if (rosterTeamNameGegner) rosterTeamNameGegner.value = spielstand.settings.teamNameGegner;
    if (toggleAuswaertsspiel) toggleAuswaertsspiel.checked = spielstand.settings.isAuswaertsspiel;

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
            if (spielBeendenButton) spielBeendenButton.classList.remove('versteckt');
        }

        pauseButton.classList.add('versteckt');
        pauseButton.disabled = true;

        updateScoreDisplay();
        updateSuspensionDisplay();
        zeichneSpielerRaster();
        updateProtokollAnzeige();
        // updateTorTracker(); // Removed feature
    } else {
        // Default to Dashboard
        navigateToView('dashboard');
    }
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

    // Mobile Menu Toggles
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            if (sidebar) sidebar.classList.toggle('active');
            if (sidebarOverlay) sidebarOverlay.classList.toggle('active');
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            if (sidebar) sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        });
    }
}

function navigateToView(view) {
    // Hide all sections first
    hideAllSections();

    switch (view) {
        case 'dashboard':
            showDashboardInline();
            break;
        case 'roster':
            rosterBereich.classList.remove('versteckt');
            zeichneRosterListe();
            break;
        case 'game':
            // Always show game view
            spielBereich.classList.remove('versteckt');
            if (globalAktionen) globalAktionen.classList.remove('versteckt');
            scoreWrapper.classList.remove('versteckt');

            // Ensure UI is updated
            updateScoreDisplay();
            import('./modules/game.js').then(game => game.updateGameControls());
            zeichneSpielerRaster();
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
            protokollBereich.classList.remove('versteckt');
            updateProtokollAnzeige();
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
                    const opponentStats = stats.berechneGegnerStatistiken(spielstand.gameLog);

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

                    // Generate Stats Cards HTML
                    const homeCardHtml = `
                        <div class="stats-card">
                            <h2 class="card-title">${homeName}</h2>
                            <div class="table-container">
                                <table class="modern-stats-table">
                                    <thead>
                                        <tr>
                                            <th>Spieler</th>
                                            <th>Tore</th>
                                            <th>Feldtore</th>
                                            <th>7m</th>
                                            <th>FehlwÃ¼rfe</th>
                                            <th>Quote</th>
                                            <th>Gute Aktion</th>
                                            <th>Tech. Fehler</th>
                                            <th>Gelb</th>
                                            <th>2 Min</th>
                                            <th>Rot</th>
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
                                            <th>Tore</th>
                                            <th>Feldtore</th>
                                            <th>7m</th>
                                            <th>FehlwÃ¼rfe</th>
                                            <th>Quote</th>
                                            <th>Gute Aktion</th>
                                            <th>Tech. Fehler</th>
                                            <th>Gelb</th>
                                            <th>2 Min</th>
                                            <th>Rot</th>
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
                });
            });
        });
    });
}

function showDashboardInline() {
    dashboardRenderId++;
    const currentRenderId = dashboardRenderId;

    // Cleanup existing charts
    if (dashboardCharts.length > 0) {
        dashboardCharts.forEach(c => {
            if (c && typeof c.destroy === 'function') c.destroy();
        });
        dashboardCharts = [];
    }

    let dashboardBereich = document.getElementById('dashboardBereich');
    if (!dashboardBereich) {
        dashboardBereich = document.createElement('div');
        dashboardBereich.id = 'dashboardBereich';
        dashboardBereich.className = 'content-section';
        document.getElementById('main-content').appendChild(dashboardBereich);
    }

    const history = getHistorie();

    dashboardBereich.innerHTML = `
        <div class="dashboard-header" style="text-align: center; margin-bottom: 20px; padding-top: 5px;">
            <h1 style="font-size: 1.5rem; font-weight: 800; background: linear-gradient(135deg, #fff 0%, #aaa 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0;">Dashboard</h1>
        </div>

        <div class="season-grid-panels" style="margin-bottom: 0;">
                <!-- 1. Last Results List -->
            <div class="season-panel" style="min-height: 200px; box-shadow: none; border: 1px solid var(--border-color);">
                <div class="season-panel-title">Letzte Ergebnisse</div>
                <div class="last-results-list" id="dashLastResults"></div>
            </div>

            <!-- 2. Matches Doughnut -->
            <div class="season-panel" style="min-height: 200px; box-shadow: none; border: 1px solid var(--border-color);">
                <div class="season-panel-title">Spiele</div>
                <div class="chart-container">
                    <canvas id="dashMatchesChart"></canvas>
                </div>
            </div>

            <!-- 3. Goals Doughnut -->
            <div class="season-panel" style="min-height: 200px; box-shadow: none; border: 1px solid var(--border-color);">
                <div class="season-panel-title">Tore</div>
                <div class="chart-container">
                    <canvas id="dashGoalsChart"></canvas>
                </div>
            </div>
            
            <!-- 4. Scorers Pie -->
            <div class="season-panel" style="min-height: 200px; box-shadow: none; border: 1px solid var(--border-color);">
                <div class="season-panel-title">Torschützen</div>
                <div class="chart-container">
                    <canvas id="dashScorersChart"></canvas>
                </div>
            </div>

             <!-- 5. Last Scores Line -->
            <div class="season-panel" style="grid-column: span 2; min-height: 200px; box-shadow: none; border: 1px solid var(--border-color);">
                <div class="season-panel-title">Spielverlauf</div>
                <div class="chart-container" style="height: 200px;">
                    <canvas id="dashScoresChart"></canvas>
                </div>
            </div>

            <!-- 6. Combined Efficiency Panel -->
            <div class="season-panel" style="grid-column: span 2; min-height: 220px; box-shadow: none; border: 1px solid var(--border-color);">
                <div class="season-panel-title">Wurfstatistiken</div>
                <div style="display: flex; flex-wrap: wrap; gap: 15px; align-items: start;">
                    <div style="flex: 1; min-width: 250px; display: flex; flex-direction: column;">
                        <span style="font-size: 0.7rem; color: var(--text-muted); margin-bottom: 5px; text-align: center;">Gesamt</span>
                        <div class="chart-container" style="height: 180px;">
                            <canvas id="dashEffTotalChart"></canvas>
                        </div>
                    </div>
                    <div style="flex: 1; min-width: 250px; display: flex; flex-direction: column;">
                         <span style="font-size: 0.7rem; color: var(--text-muted); margin-bottom: 5px; text-align: center;">Pro Spiel (%)</span>
                         <div class="chart-container" style="height: 180px;">
                            <canvas id="dashEffGameChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Wait for DOM to update
    setTimeout(() => {
        if (currentRenderId !== dashboardRenderId) return;

        // --- CHART JS RENDERING ---
        if (window.Chart) {
            // Shadcn-like Color Palette (HSL based approximations)
            const colors = {
                chart1: 'hsl(220, 70%, 50%)', // Blue
                chart2: 'hsl(160, 60%, 45%)', // Emerald
                chart3: 'hsl(30, 80%, 55%)',  // Orange
                chart4: 'hsl(280, 65%, 60%)', // Purple
                chart5: 'hsl(340, 75%, 55%)', // Pink

                slate: '#94a3b8',
                green: '#10b981',
                red: '#ef4444',
                draw: '#6b7280',
            };

            const createChart = (ctx, config) => {
                const c = new Chart(ctx, config);
                dashboardCharts.push(c);
                return c;
            };
            const historyGames = getHistorie();
            let wins = 0, draws = 0, losses = 0;
            let scored = 0, conceded = 0;
            const lastGames = historyGames.slice(0, 5);
            const dates = [];
            const scoresHeim = [];
            const scoresGegner = [];

            // New Stats
            const playerGoals = {}; // { Num: Count }
            const playerNames = {}; // { Num: Name }
            let totalStatsGoals = 0;
            let totalStatsMisses = 0;
            const gameEfficiencies = []; // { date, eff }

            historyGames.slice().reverse().forEach(game => {
                const h = game.score.heim;
                const g = game.score.gegner;
                scored += h;
                conceded += g;
                if (h > g) wins++;
                else if (h < g) losses++;
                else draws++;
                const d = new Date(game.date).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' });
                dates.push(d);
                scoresHeim.push(h);
                scoresGegner.push(g);

                // Parse Stats
                const logs = game.gameLog || [];
                const rost = game.roster || [];

                let gGoals = 0;
                let gMisses = 0;

                // Ensure we map names
                rost.forEach(p => playerNames[p.number] = p.name);

                logs.forEach(evt => {
                    // Goals
                    if (evt.action === 'Tor' || evt.action === '7m Tor') {
                        gGoals++;
                        if (evt.playerId) {
                            playerGoals[evt.playerId] = (playerGoals[evt.playerId] || 0) + 1;
                        }
                    }
                    // Misses
                    if (evt.action === 'Fehlwurf' || evt.action === '7m Verworfen' || evt.action === '7m Gehalten') {
                        gMisses++;
                    }
                });

                const gShots = gGoals + gMisses;
                const eff = gShots > 0 ? ((gGoals / gShots) * 100).toFixed(1) : 0;
                gameEfficiencies.push(eff);

                totalStatsGoals += gGoals;
                totalStatsMisses += gMisses;
            });

            // Render List
            const listContainer = document.getElementById('dashLastResults');
            if (listContainer) {
                listContainer.innerHTML = lastGames.map(g => {
                    const h = g.score.heim;
                    const ga = g.score.gegner;
                    let badge = 'D', cls = 'draw';
                    if (h > ga) { badge = 'W'; cls = 'win'; }
                    if (h < ga) { badge = 'L'; cls = 'loss'; }
                    return `
                         <div class="last-result-item">
                             <div style="display:flex; align-items:center;">
                                 <div class="result-badge-square ${cls}">${badge}</div>
                                 <div>
                                     <div style="font-weight:700;">${g.teams.gegner}</div>
                                     <div style="font-size:0.75rem; color:var(--text-muted);">vs ${g.teams.heim}</div>
                                 </div>
                             </div>
                             <div style="font-weight:700;">${h}:${ga}</div>
                         </div>`;
                }).join('') || '<div style="text-align:center; color:var(--text-muted);">Keine Spiele</div>';
            }

            // Defaults for Shadcn look
            Chart.defaults.font.family = "Inter, sans-serif";
            Chart.defaults.color = "#94a3b8";
            Chart.defaults.scale.grid.color = "#1e293b"; // Subtler grid for dark mode, or make transparent
            Chart.defaults.scale.grid.display = false; // Shadcn often hides grids

            // Common Chart Config
            const chartConfig = (type, data, options) => ({
                type,
                data,
                options: {
                    ...options,
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(15, 23, 42, 0.95)',
                            titleColor: '#f1f5f9',
                            bodyColor: '#e2e8f0',
                            borderColor: 'rgba(148, 163, 184, 0.1)',
                            borderWidth: 1,
                            padding: 10,
                            cornerRadius: 6,
                            displayColors: true,
                            boxPadding: 4
                        },
                        ...options.plugins
                    }
                }
            });

            // 2. Matches Doughnut
            const ctxM = document.getElementById('dashMatchesChart');
            if (ctxM) createChart(ctxM, chartConfig('doughnut', {
                labels: ['Sieg', 'Unentschieden', 'Niederlage'],
                datasets: [{
                    data: [wins, draws, losses],
                    backgroundColor: [colors.green, colors.draw, colors.red],
                    borderWidth: 0
                }]
            }, {
                cutout: '75%' // Thinner ring
            }));

            // 3. Goals Doughnut
            const ctxG = document.getElementById('dashGoalsChart');
            if (ctxG) createChart(ctxG, chartConfig('doughnut', {
                labels: ['Erzielt', 'Kassiert'],
                datasets: [{
                    data: [scored, conceded],
                    backgroundColor: [colors.green, colors.red],
                    borderWidth: 0
                }]
            }, {
                cutout: '75%'
            }));

            // 4. Scorers Pie
            const ctxScorers = document.getElementById('dashScorersChart');
            if (ctxScorers) {
                const labels = Object.keys(playerGoals).map(num => playerNames[num] || `#${num}`);
                // Simple sort by goals desc
                const sorted = Object.keys(playerGoals).sort((a, b) => playerGoals[b] - playerGoals[a]);

                const sortedLabels = sorted.map(num => playerNames[num] || `#${num}`);
                const sortedData = sorted.map(num => playerGoals[num]);

                if (sortedData.length > 0) {
                    // Shadcn Blue Palette (Monochromatic Blue)
                    const palette = [
                        '#172554', // blue-950
                        '#1e3a8a', // blue-900
                        '#1e40af', // blue-800
                        '#2563eb', // blue-600
                        '#60a5fa', // blue-400
                    ];
                    // Cycle colors
                    const bgColors = sortedLabels.map((_, i) => palette[i % palette.length]);

                    const totalGoals = sortedData.reduce((a, b) => a + b, 0);

                    // Add center text plugin manually
                    const centerTextPlugin = {
                        id: 'centerText',
                        beforeDraw: function (chart) {
                            if (chart.config.type !== 'doughnut') return;
                            const width = chart.width,
                                height = chart.height,
                                ctx = chart.ctx;

                            ctx.restore();
                            // Scaling font size
                            const fontSize = (height / 120).toFixed(2);
                            ctx.font = "800 " + fontSize + "em Inter, sans-serif";
                            // Dynamically get foreground color (requires wrapping in hsl() because vars are just numbers)
                            const fgVar = getComputedStyle(document.body).getPropertyValue('--foreground').trim();
                            // If fgVar exists, wrap it in hsl(), otherwise fallback to white
                            ctx.fillStyle = fgVar ? `hsl(${fgVar})` : '#ffffff';
                            ctx.textBaseline = "middle";
                            ctx.textAlign = "center";

                            const text = totalGoals.toString();

                            // Draw Number (slightly raised)
                            ctx.fillText(text, width / 2, height / 2 - 10);

                            // Draw Label (slightly lowered)
                            const labelFontSize = (height / 280).toFixed(2);
                            ctx.font = "500 " + labelFontSize + "em Inter, sans-serif";

                            // Dynamic muted color
                            const mutedVar = getComputedStyle(document.body).getPropertyValue('--muted-foreground').trim();
                            ctx.fillStyle = mutedVar ? `hsl(${mutedVar})` : '#94a3b8';
                            ctx.fillText("Tore", width / 2, height / 2 + 15);
                            ctx.save();
                        }
                    };

                    const c = new Chart(ctxScorers, {
                        type: 'doughnut',
                        data: {
                            labels: sortedLabels,
                            datasets: [{
                                data: sortedData,
                                backgroundColor: bgColors,
                                borderWidth: 0,
                                hoverOffset: 10
                            }]
                        },
                        plugins: [centerTextPlugin],
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            animation: false,
                            cutout: '60%',
                            plugins: {
                                legend: { display: false },
                                tooltip: {
                                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                    titleColor: '#f1f5f9',
                                    bodyColor: '#e2e8f0',
                                    borderColor: 'rgba(148, 163, 184, 0.1)',
                                    borderWidth: 1,
                                    padding: 10,
                                    cornerRadius: 6,
                                    displayColors: true,
                                    boxPadding: 4
                                }
                            }
                        }
                    });
                    dashboardCharts.push(c);
                }
            }

            // 5. Scores Line
            // For line chart we want grid lines on Y axis maybe, but very subtle
            const ctxS = document.getElementById('dashScoresChart');
            if (ctxS) {
                createChart(ctxS, {
                    type: 'line',
                    data: {
                        labels: dates,
                        datasets: [
                            {
                                label: 'Wir',
                                data: scoresHeim,
                                borderColor: colors.green,
                                backgroundColor: colors.green,
                                tension: 0.4,
                                borderWidth: 2,
                                pointRadius: 2,
                                pointHoverRadius: 5
                            },
                            {
                                label: 'Gegner',
                                data: scoresGegner,
                                borderColor: colors.red,
                                backgroundColor: colors.red,
                                tension: 0.4,
                                borderWidth: 2,
                                pointRadius: 2,
                                pointHoverRadius: 5
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: { mode: 'index', intersect: false },
                        plugins: { legend: { display: false } }, // Shadcn style usually minimal legend
                        scales: {
                            x: {
                                grid: { display: false },
                                ticks: { font: { size: 10 }, color: '#64748b' }
                            },
                            y: {
                                beginAtZero: true,
                                grid: { color: '#334155', drawBorder: false, tickLength: 0 },
                                border: { display: false },
                                ticks: { stepSize: 5, color: '#64748b' }
                            }
                        }
                    }
                });
            }

            // 6. Efficiency Total (Bar - Horizontal)
            const ctxEffTot = document.getElementById('dashEffTotalChart');
            if (ctxEffTot) {
                createChart(ctxEffTot, {
                    type: 'bar',
                    data: {
                        labels: ['Verteilung'],
                        datasets: [
                            { label: 'Treffer', data: [totalStatsGoals], backgroundColor: colors.green, borderRadius: 4, barThickness: 20 },
                            { label: 'Fehlwürfe', data: [totalStatsMisses], backgroundColor: colors.red, borderRadius: 4, barThickness: 20 }
                        ]
                    },
                    options: {
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: { x: { display: false, stacked: true }, y: { display: false, stacked: true } },
                        plugins: { legend: { position: 'top', align: 'start', labels: { boxWidth: 8, usePointStyle: true } } }
                    }
                });
            }

            // 7. Efficiency Per Game (Bar)
            const ctxEffGame = document.getElementById('dashEffGameChart');
            if (ctxEffGame) {
                createChart(ctxEffGame, {
                    type: 'bar',
                    data: {
                        labels: dates,
                        datasets: [{
                            label: 'Quote (%)',
                            data: gameEfficiencies,
                            backgroundColor: colors.chart1,
                            borderRadius: 4,
                            barPercentage: 0.6
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            x: { grid: { display: false }, ticks: { display: false } },
                            y: { display: false, min: 0, max: 100 }
                        }
                    }
                });
            }
        }
    }, 50);

    dashboardBereich.classList.remove('versteckt');
}

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
                            const playerIndex = parseInt(e.target.dataset.playerIndex);
                            const mode = e.target.dataset.mode || 'field';
                            seasonView.showPlayerHeatmap(playerIndex, mode);
                        });
                    });

                    // 2. Team heatmap buttons (Team Grafik)
                    const teamButtons = seasonContent.querySelectorAll('.show-team-heatmap-btn');
                    teamButtons.forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            const team = e.target.dataset.team;
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
            teamSelect.addEventListener('change', () => {
                // Reset player selection when team changes
                if (playerSelect) playerSelect.value = 'all';
                renderSeasonHeatmap();
            });
        }
        if (playerSelect) {
            playerSelect.addEventListener('change', () => renderSeasonHeatmap());
        }
    }

    seasonHeatmapBereich.classList.remove('versteckt');

    // Set initial context and state
    import('./modules/heatmap.js').then(heatmap => {
        const existingContext = heatmap.getCurrentHeatmapContext();
        let useSeasonDefault = true;

        if (existingContext && typeof existingContext === 'object' && existingContext.type === 'season-specific') {
            useSeasonDefault = false;
        }

        if (useSeasonDefault) {
            heatmap.setCurrentHeatmapContext('season');
            heatmap.setCurrentHeatmapTab('tor');

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
}

function renderSeasonHeatmap() {
    import('./modules/seasonView.js').then(seasonView => {
        import('./modules/heatmap.js').then(heatmap => {
            const context = heatmap.getCurrentHeatmapContext();
            const svg = document.getElementById('seasonHeatmapSvg');
            if (!svg) return;

            // Toggle controls visibility based on context
            const controls = document.querySelector('.heatmap-controls');
            const isSpecificContext = context && typeof context === 'object' && context.type === 'season-specific' && context.log;

            if (controls) {
                controls.style.display = isSpecificContext ? 'none' : 'flex';
            }

            // If specific context provided (from Team/Player Grafik click), render it directly
            if (isSpecificContext) {
                heatmap.renderHeatmap(svg, context.log);

                // Update title if available
                if (context.title) {
                    const h1 = document.querySelector('.heatmap-view-header h1');
                    if (h1) h1.textContent = context.title;
                }
                return;
            }

            // Default: Aggregate all season data
            const h1 = document.querySelector('.heatmap-view-header h1');
            const teamSelect = document.getElementById('seasonHeatmapTeamSelect');
            const playerSelect = document.getElementById('seasonHeatmapPlayerSelect');

            const selectedTeam = teamSelect ? teamSelect.value : 'all';
            const selectedPlayerVal = playerSelect ? playerSelect.value : 'all';

            // Optional: Update title based on selection
            if (h1 && !context.title) {
                if (selectedPlayerVal !== 'all') {
                    const opt = playerSelect.options[playerSelect.selectedIndex];
                    h1.textContent = opt ? `Saison: ${opt.textContent}` : 'Saison-Heatmap';
                } else if (selectedTeam === 'all_opponents') {
                    h1.textContent = 'Saison: Alle Gegner';
                } else if (selectedTeam !== 'all') {
                    h1.textContent = `Saison: ${selectedTeam === 'Heim' ? (spielstand.settings.teamNameHeim || 'Heim') : selectedTeam}`;
                } else {
                    h1.textContent = 'Saison-Heatmap';
                }
            }

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

                    sortedTeams.forEach(team => {
                        const opt = document.createElement('option');
                        opt.value = team;
                        opt.textContent = team === 'Heim' ? (spielstand.settings.teamNameHeim || 'Heim') : team;
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
                    if (w.color === 'yellow') gehalten++;
                    else if (w.color === 'gray') vorbei++;
                    else tore++;
                });

                const totalWuerfe = tore + gehalten + vorbei;
                const quote = totalWuerfe > 0 ? Math.round((tore / totalWuerfe) * 100) : 0;

                const infoDiv = document.createElement('div');
                infoDiv.className = 'player-shot-info';
                infoDiv.innerHTML = `<strong>#${playerData.nummer} ${playerData.name}${is7m ? ' (7m)' : ''}</strong>${tore} Tore${gehalten > 0 ? `, ${gehalten} Geh.` : ''}${vorbei > 0 ? `, ${vorbei} Vorb.` : ''} <strong>(${quote}%)</strong>`;
                div.appendChild(infoDiv);

                const hasWurfposition = is7m ? false : playerData.wuerfe.some(w => w.wurfposition);
                const hasWurfbild = playerData.wuerfe.some(w => w.x && w.y);

                const pointsTor = playerData.wuerfe.filter(w => w.x && w.y).map(w => ({
                    x: parseFloat(w.x), y: parseFloat(w.y), isOpponent,
                    isMiss: w.color === 'gray' || w.action === 'Fehlwurf' || w.action?.includes('Verworfen')
                }));

                const pointsFeld = playerData.wuerfe.filter(w => w.wurfposition).map(w => ({
                    x: parseFloat(w.wurfposition.x), y: parseFloat(w.wurfposition.y), isOpponent,
                    isMiss: w.color === 'gray' || w.action === 'Fehlwurf' || w.action?.includes('Verworfen')
                }));

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

                            const isMiss = w.color === 'gray' || w.action === 'Fehlwurf';
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
                wurfbilder.heim.sort((a, b) => a.nummer - b.nummer).forEach(p => shotsContent.appendChild(renderPlayerGroup(p)));
            }

            if (wurfbilder.heim7m && wurfbilder.heim7m.length > 0) {
                const h4 = document.createElement('h4');
                h4.textContent = spielstand.settings.teamNameHeim + " (7m)";
                h4.style.marginLeft = '10px';
                shotsContent.appendChild(h4);
                wurfbilder.heim7m.sort((a, b) => a.nummer - b.nummer).forEach(p => shotsContent.appendChild(renderPlayerGroup(p, true)));
            }

            if (wurfbilder.gegner.length > 0) {
                const h4 = document.createElement('h4');
                h4.textContent = spielstand.settings.teamNameGegner + " (Feldtore)";
                h4.style.marginLeft = '10px';
                shotsContent.appendChild(h4);
                wurfbilder.gegner.sort((a, b) => a.nummer - b.nummer).forEach(p => shotsContent.appendChild(renderPlayerGroup(p)));
            }

            if (wurfbilder.gegner7m.length > 0) {
                const h4 = document.createElement('h4');
                h4.textContent = "Gegner 7m";
                h4.style.marginLeft = '10px';
                shotsContent.appendChild(h4);
                wurfbilder.gegner7m.sort((a, b) => a.nummer - b.nummer).forEach(p => shotsContent.appendChild(renderPlayerGroup(p, true)));
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
    // Ensure values are fresh
    if (toggleAuswaertsspiel) toggleAuswaertsspiel.checked = spielstand.settings.isAuswaertsspiel;
}

function hideAllSections() {
    rosterBereich.classList.add('versteckt');
    spielBereich.classList.add('versteckt');
    liveOverviewBereich.classList.add('versteckt');
    seasonBereich.classList.add('versteckt');
    shotsBereich.classList.add('versteckt');
    exportBereich.classList.add('versteckt');
    const dashboardBereich = document.getElementById('dashboardBereich');
    if (dashboardBereich) dashboardBereich.classList.add('versteckt');
    settingsBereich.classList.add('versteckt');
    liveHeatmapBereich.classList.add('versteckt');
    if (historieBereich) historieBereich.classList.add('versteckt');
    if (historieDetailBereich) historieDetailBereich.classList.add('versteckt');
    const seasonHeatmapBereich = document.getElementById('seasonHeatmapBereich');
    if (seasonHeatmapBereich) seasonHeatmapBereich.classList.add('versteckt');
    if (teamDiagrammBereich) teamDiagrammBereich.classList.add('versteckt');
    if (globalAktionen) globalAktionen.classList.add('versteckt');
    scoreWrapper.classList.add('versteckt');
    statistikWrapper.classList.add('versteckt');
    if (protokollBereich) protokollBereich.classList.add('versteckt');
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

// --- Initial Sidebar Timer State ---
const initialView = document.querySelector('.nav-item.active')?.dataset.view || 'roster';
updateSidebarTimerVisibility(initialView);


