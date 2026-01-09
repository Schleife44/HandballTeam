// modules/dashboardView.js
import { getHistorie } from './history.js';
import { getGameResult } from './utils.js';
import { spielstand } from './state.js';
import { getBaseOptions, commonCenterTextPlugin, destroyChart } from './chartUtils.js';

let dashboardCharts = [];
let dashboardRenderId = 0;

/**
 * Renders the dashboard view into the main content area.
 */
export function showDashboardInline() {
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
    
            <!-- 0. Next Event Panel (NEW) -->
            <div class="season-panel" style="min-height: 140px; box-shadow: none; border: 1px solid var(--border-color); background: linear-gradient(to bottom right, var(--bg-card), var(--bg-secondary));">
                <div class="season-panel-title" style="display:flex; justify-content:space-between; align-items:center;">
                    <span>Nächster Termin</span>
                    <i data-lucide="calendar" style="width:16px; height:16px; opacity:0.7;"></i>
                </div>
                <div id="dashNextEvent" style="flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 10px 0;">
                    <!-- JS Injected Content -->
                    <div style="text-align:center; color: var(--text-muted); font-style:italic;">Keine anstehenden Termine</div>
                </div>
            </div>

            <!-- 1. Last Results List -->
            <div class="season-panel" style="min-height: 200px; box-shadow: none; border: 1px solid var(--border-color);">
                <div class="season-panel-title">Letzte Ergebnisse</div>
                <div class="last-results-list" id="dashLastResults"></div>
            </div>

            <!-- 2. Matches Doughnut -->
            <div class="season-panel" style="min-height: 200px; box-shadow: none; border: 1px solid var(--border-color);">
                <div class="season-panel-title">Spiele</div>
                <div class="season-chart-wrapper">
                        <div class="chart-container" style="height: 160px;">
                            <canvas id="dashMatchesChart"></canvas>
                        </div>
                </div>
            </div>

            <!-- 3. Goals Doughnut -->
            <div class="season-panel" style="min-height: 200px; box-shadow: none; border: 1px solid var(--border-color);">
                <div class="season-panel-title">Tore</div>
                <div class="season-chart-wrapper">
                        <div class="chart-container" style="height: 160px;">
                            <canvas id="dashGoalsChart"></canvas>
                        </div>
                    </div>
                </div>
            
            <!-- 4. Scorers Pie -->
            <div class="season-panel" style="min-height: 200px; box-shadow: none; border: 1px solid var(--border-color);">
                <div class="season-panel-title">Torschützen</div>
                <div class="season-chart-wrapper">
                        <div class="chart-container" style="height: 160px;">
                            <canvas id="dashScorersChart"></canvas>
                        </div>
                    </div>
                </div>

             <!-- 5. Last Scores Line -->
            <div class="season-panel" style="min-height: 200px; box-shadow: none; border: 1px solid var(--border-color);">
                <div class="season-panel-title">Spielverlauf</div>
                <div class="chart-container" style="height: 200px;">
                    <canvas id="dashScoresChart"></canvas>
                </div>
            </div>

            <!-- 6. Combined Efficiency Panel -->
            <div class="season-panel wurf-stats-panel" style="min-height: 220px; box-shadow: none; border: 1px solid var(--border-color);">
                <div class="season-panel-title">Wurfstatistiken</div>
                <div class="season-chart-wrapper-flex">
                    <div style="flex: 1; display: flex; flex-direction: column;">
                        <div class="chart-container" style="height: 180px;">
                            <canvas id="dashEffTotalChart"></canvas>
                        </div>
                    </div>
                    <div style="flex: 1; display: flex; flex-direction: column;">
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

        let wins = 0, draws = 0, losses = 0;
        let scored = 0, conceded = 0;
        let dates = [];
        let scoresHeim = [];
        let scoresGegner = [];
        let playerNames = {};
        let playerGoals = {};

        // Stats for Efficiency
        let totalStatsGoals = 0;
        let totalStatsMisses = 0;
        let gameEfficiencies = [];

        // Add current game ONLY if it's running/paused/finished and has data
        // Add current game ONLY if it's running/paused/finished and has data
        if (spielstand?.teams?.heim?.tore > 0 || spielstand?.teams?.gegner?.tore > 0 || spielstand?.timer?.gamePhase > 1) {
            // Current game logic (simplified for dashboard)
            // For now, let's just stick to history for the dashboard charts to avoid complexity with partial game states
        }

        // Analyze History
        // Sort history by date ascending for line chart
        const sortedHistory = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));

        sortedHistory.forEach(game => {
            if (!game || !game.score) return;
            const h = game.score.heim;
            const g = game.score.gegner;
            const res = getGameResult(game, spielstand.settings.myTeamName);

            if (res === 'win') wins++;
            else if (res === 'draw') draws++;
            else losses++;

            const isAway = game.settings?.isAuswaertsspiel || false;
            const myScore = isAway ? g : h;
            const opScore = isAway ? h : g;

            scored += myScore;
            conceded += opScore;

            // Date formatting
            const d = new Date(game.date);
            const day = d.getDate().toString().padStart(2, '0');
            const month = (d.getMonth() + 1).toString().padStart(2, '0');
            dates.push(`${day}.${month}.`);

            scoresHeim.push(myScore);
            scoresGegner.push(opScore);

            // --- Stats Calculation via GameLog (Restored) ---
            const logs = game.gameLog || [];

            // Check for stats object if log is missing, but prefer log for consistency if available?
            // Actually original used log. Let's use log.

            if (!logs || logs.length === 0) {
                // Fallback to game.stats if logs are empty (for old imported games maybe?)
                if (game.stats && game.stats.heim) {
                    let gameGoals = 0;
                    let gameMisses = 0;
                    Object.entries(game.stats.heim).forEach(([num, stats]) => {
                        if (stats.tore > 0) {
                            playerGoals[num] = (playerGoals[num] || 0) + stats.tore;
                        }
                        gameGoals += (stats.tore || 0);
                        gameMisses += (stats.fehlwuerfe || 0);
                    });

                    totalStatsGoals += gameGoals;
                    totalStatsMisses += gameMisses;

                    const totalShots = gameGoals + gameMisses;
                    const eff = totalShots > 0 ? Math.round((gameGoals / totalShots) * 100) : 0;
                    gameEfficiencies.push(eff);
                } else {
                    gameEfficiencies.push(0);
                }
                return;
            }

            let gGoals = 0;
            let gMisses = 0;

            // Helper to check for generic names to update playerNames map
            const isGenericName = (n) => !n || n.toLowerCase().startsWith('gegner') || n.toLowerCase().startsWith('spieler');
            if (game.roster) {
                game.roster.forEach(p => {
                    const pNum = p.number;
                    // Update name if we don't have it or have a generic one and this one is better
                    if (!playerNames[pNum] || (isGenericName(playerNames[pNum]) && !isGenericName(p.name))) {
                        playerNames[pNum] = p.name;
                    }
                });
            }

            logs.forEach(evt => {
                const isOurTeamAction = !evt.action?.startsWith('Gegner') && !evt.gegnerNummer && evt.playerId;

                if (!isOurTeamAction) return;

                const actionLower = (evt.action || '').toLowerCase();
                const isGoal = actionLower.includes('tor') && !actionLower.includes('parade') && !actionLower.includes('gehalten');

                if (isGoal) {
                    gGoals++;
                    const pId = evt.playerId;
                    if (pId) {
                        playerGoals[pId] = (playerGoals[pId] || 0) + 1;
                        if (!playerNames[pId]) {
                            playerNames[pId] = `#${pId}`;
                        }
                    }
                }

                const isMiss = actionLower.includes('fehlwurf') || actionLower.includes('verworfen') ||
                    actionLower.includes('vorbei') || actionLower.includes('gehalten');

                if (isMiss && !actionLower.includes('parade')) {
                    gMisses++;
                }
            });

            const gShots = gGoals + gMisses;
            const eff = gShots > 0 ? Math.round((gGoals / gShots) * 100) : 0;
            gameEfficiencies.push(eff);

            totalStatsGoals += gGoals;
            totalStatsMisses += gMisses;
        });

        // Player Names Mapping (from current roster + history names potentially)
        // Simplified: use roster names if available
        // Player Names Mapping (from current roster + history names potentially)
        // Simplified: use roster names if available
        if (spielstand?.teams?.heim?.spieler) {
            spielstand.teams.heim.spieler.forEach(p => {
                playerNames[p.nummer] = p.name;
            });
        }

        // --- RENDER CHARTS ---
        const colors = {
            green: '#22c55e',
            red: '#ef4444',
            draw: '#94a3b8', // Slate-400
            text: '#e2e8f0', // Slate-200
            grid: '#334155', // Slate-700
            chart1: '#3b82f6', // Blue-500
            chart2: '#8b5cf6', // Violet-500
        };

        // Helper to create charts with consistent immediate rendering
        const initChart = (id, config, immediate = true) => {
            const canvas = document.getElementById(id);
            if (!canvas) return;

            // Destroy if exists in our tracker
            // Note: We already cleared dashboardCharts at start, but double check
            destroyChart(id);

            const ctx = canvas.getContext('2d');
            const newChart = new Chart(ctx, config);
            dashboardCharts.push(newChart);
        };

        // List of last 5 games (reversed for list view)
        const lastGames = [...history].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

        // --- POPULATE DASHBOARD ---

        // 0. Next Event Logic
        const nextEventContainer = document.getElementById('dashNextEvent');
        if (nextEventContainer && spielstand.calendarEvents) {
            const now = new Date();
            const todayStr = now.toISOString().slice(0, 10);

            // Filter events: Date >= Today
            // Note: This matches today's events even if time passed, which is usually desired "Today's Event"
            let futureEvents = spielstand.calendarEvents.filter(e => e.date >= todayStr);

            // Sort by Date then Time
            futureEvents.sort((a, b) => {
                if (a.date !== b.date) return a.date.localeCompare(b.date);
                return (a.time || '00:00').localeCompare(b.time || '00:00');
            });

            if (futureEvents.length > 0) {
                const nextEv = futureEvents[0];
                const dateObj = new Date(nextEv.date);
                const dateFmt = dateObj.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
                const dayName = dateObj.toLocaleDateString('de-DE', { weekday: 'long' });

                let typeColor = 'var(--text-main)';
                let typeLabel = 'Termin';
                if (nextEv.type === 'game') { typeColor = '#ef4444'; typeLabel = 'Spiel'; } // Red
                else if (nextEv.type === 'training') { typeColor = '#3b82f6'; typeLabel = 'Training'; } // Blue

                nextEventContainer.innerHTML = `
                <div style="font-size: 1.1rem; font-weight: 700; margin-bottom: 4px;">${nextEv.title}</div>
                <div style="display:flex; align-items:center; gap:8px; justify-content:center; color: var(--text-muted); font-size: 0.9rem; margin-bottom: 6px;">
                    <span style="font-weight:600; color:${typeColor}; background: ${typeColor}20; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">${typeLabel}</span>
                </div>
                <div style="font-size: 0.95rem; font-weight: 500;">
                    ${dayName}, ${dateFmt} <span style="margin: 0 4px; opacity:0.5;">|</span> ${nextEv.time} Uhr
                </div>
                ${nextEv.location ? `<div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;"><i data-lucide="map-pin" style="width:12px; height:12px; vertical-align:text-top;"></i> ${nextEv.location}</div>` : ''}
            `;
            } else {
                nextEventContainer.innerHTML = `<div style="text-align:center; color: var(--text-muted); font-style:italic;">Keine anstehenden Termine</div>`;
            }
        }

        // 1. Last Results Logic
        const listContainer = document.getElementById('dashLastResults');
        if (listContainer) {
            listContainer.innerHTML = lastGames.map(g => {
                const h = g.score.heim;
                const ga = g.score.gegner;
                const result = getGameResult(g, spielstand.settings.myTeamName);

                // User Request: Always show formatted as:
                // Home Team (Big/Bold)
                // Guest Team (Small)
                // Score: Home:Guest

                const homeName = g.teams.heim;
                const guestName = g.teams.gegner;

                let badge = 'D', cls = 'draw';
                if (result === 'win') { badge = 'W'; cls = 'win'; }
                if (result === 'loss') { badge = 'L'; cls = 'loss'; }

                return `
                     <div class="last-result-item">
                         <div style="display:flex; align-items:center;">
                             <div class="result-badge-square ${cls}">${badge}</div>
                             <div>
                                 <div style="font-weight:700;">${homeName}</div>
                                 <div style="font-size:0.75rem; color:var(--text-muted);">${guestName}</div>
                             </div>
                         </div>
                         <div style="display: flex; flex-direction: column; align-items: flex-end;">
                            <div style="font-weight:700;">${h}:${ga}</div>
                         </div>
                     </div>`;
            }).join('') || '<div style="text-align:center; color:var(--text-muted);">Keine Spiele</div>';
        }


        // 2. Matches Doughnut
        initChart('dashMatchesChart', {
            type: 'doughnut',
            data: {
                labels: ['Sieg', 'Unentschieden', 'Niederlage'],
                datasets: [{
                    data: [wins, draws, losses],
                    backgroundColor: [colors.green, colors.draw, colors.red],
                    borderWidth: 0
                }]
            },
            plugins: [commonCenterTextPlugin],
            options: getBaseOptions('doughnut', {
                cutout: '70%',
                plugins: {
                    centerTextData: {
                        text: (wins + draws + losses).toString(),
                        subText: 'Spiele'
                    }
                }
            })
        });

        // 3. Goals Doughnut
        initChart('dashGoalsChart', {
            type: 'doughnut',
            data: {
                labels: ['Erzielt', 'Kassiert'],
                datasets: [{
                    data: [scored, conceded],
                    backgroundColor: [colors.green, colors.red],
                    borderWidth: 0
                }]
            },
            plugins: [commonCenterTextPlugin],
            options: getBaseOptions('doughnut', {
                cutout: '70%',
                plugins: {
                    centerTextData: {
                        text: (scored + conceded).toString(),
                        subText: 'Tore'
                    }
                }
            })
        });

        // 4. Scorers Pie
        const labels = Object.keys(playerGoals).map(num => playerNames[num] || `#${num}`);
        const sorted = Object.keys(playerGoals).sort((a, b) => playerGoals[b] - playerGoals[a]);
        const sortedLabels = sorted.map(num => playerNames[num] || `#${num}`);
        const sortedData = sorted.map(num => playerGoals[num]);

        if (sortedData.length > 0) {
            const palette = ['#172554', '#1e3a8a', '#1e40af', '#2563eb', '#60a5fa'];
            const bgColors = sortedLabels.map((_, i) => palette[i % palette.length]);
            const totalGoals = sortedData.reduce((a, b) => a + b, 0);

            initChart('dashScorersChart', {
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
                plugins: [commonCenterTextPlugin],
                options: getBaseOptions('doughnut', {
                    cutout: '60%',
                    plugins: {
                        centerTextData: {
                            text: totalGoals.toString(),
                            subText: 'Tore'
                        }
                    }
                })
            });
        }


        // 5. Scores Line
        initChart('dashScoresChart', {
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
            options: getBaseOptions('line', {
                interaction: { mode: 'index', intersect: false },
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
            })
        });


        // 6. Efficiency Total (Doughnut)
        initChart('dashEffTotalChart', {
            type: 'doughnut',
            data: {
                labels: ['Treffer', 'Fehlwürfe'],
                datasets: [
                    {
                        data: [totalStatsGoals, totalStatsMisses],
                        backgroundColor: [colors.green, colors.red],
                        borderWidth: 0
                    }
                ]
            },
            plugins: [commonCenterTextPlugin],
            options: getBaseOptions('doughnut', {
                cutout: '70%',
                plugins: {
                    centerTextData: {
                        text: (totalStatsGoals + totalStatsMisses).toString(),
                        subText: 'Würfe'
                    }
                }
            })
        });


        // 7. Efficiency Per Game (Bar)
        initChart('dashEffGameChart', {
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
            options: getBaseOptions('bar', {
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            })
        });
    }, 250);

    dashboardBereich.classList.remove('versteckt');
}
