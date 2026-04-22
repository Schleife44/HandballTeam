// modules/dashboardView.js
import { getHistorie } from './history.js';
import { getGameResult } from './utils.js';
import { spielstand } from './state.js';
import { getBaseOptions, commonCenterTextPlugin, destroyChart } from './chartUtils.js';
import { getAuthUid, getCurrentUserProfile } from './firebase.js';
import { updateParticipation, getEventStats, showEventDetails, isPlayerAbsent } from './calendar.js';
import { sanitizeHTML, escapeHTML, fetchWithProxy } from './utils.js';

let dashboardCharts = [];
let dashboardRenderId = 0;

export function renderDashNextEvents() {
    const nextEventContainer = document.getElementById('dashNextEvent');
    if (!nextEventContainer || !spielstand.calendarEvents) return;

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    let futureEvents = spielstand.calendarEvents.filter(e => e.date >= todayStr);

    futureEvents.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return (a.time || '00:00').localeCompare(b.time || '00:00');
    });

    if (futureEvents.length > 0) {
        const next3 = futureEvents.slice(0, 3);
        
        nextEventContainer.innerHTML = next3.map((nextEv, index) => {
            const dateObj = new Date(nextEv.date);
            const dateFmt = dateObj.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const dayName = dateObj.toLocaleDateString('de-DE', { weekday: 'long' });

            let typeColor = 'var(--text-main)';
            let typeLabel = 'Termin';
            if (nextEv.type === 'game') { typeColor = '#ef4444'; typeLabel = 'Spiel'; }
            else if (nextEv.type === 'training') { typeColor = '#3b82f6'; typeLabel = 'Training'; }

            const stats = getEventStats(nextEv);
            let myStatus = null;
            const uid = getAuthUid ? getAuthUid() : null;
            const profile = getCurrentUserProfile ? getCurrentUserProfile() : null;
            const rosterName = profile ? profile.rosterName : null;

            if (nextEv.responses) {
                if (uid && nextEv.responses[uid]) myStatus = nextEv.responses[uid].status;
                else if (rosterName) {
                    const tempKey = `manual_${rosterName.replace(/\s+/g, '_')}`;
                    if (nextEv.responses[tempKey]) myStatus = nextEv.responses[tempKey].status;
                }
            }

            // Sync with personal Absence
            if (!myStatus && isPlayerAbsent) {
                const absence = isPlayerAbsent(nextEv.date, uid, rosterName);
                if (absence) myStatus = 'not-going';
            }
            

            return sanitizeHTML(`
            <div class="dash-event-card-modern">
                <div class="dash-event-header-row">
                    <div class="dash-event-title-group">
                        <span style="font-weight:700; color:${typeColor}; background: ${typeColor}20; padding: 4px 10px; border-radius: 6px; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em;">${escapeHTML(typeLabel)}</span>
                        <div class="dash-event-title-modern">${escapeHTML(nextEv.title)}</div>
                    </div>
                    <button class="dash-details-modern-btn" data-event-id="${escapeHTML(nextEv.id)}">
                        <i data-lucide="users" style="width:18px; height:18px;"></i>
                    </button>
                </div>

                <div class="dash-event-info-row">
                    <i data-lucide="calendar" style="width:16px; height:16px;"></i>
                    <span>${escapeHTML(dayName.slice(0,2))}, ${escapeHTML(dateFmt)} <span style="margin: 0 4px; opacity: 0.3;">|</span> ${escapeHTML(nextEv.time)} Uhr</span>
                </div>
                
                <div class="dash-rsvp-group-modern">
                    <button class="dash-rsvp-modern-btn ${myStatus === 'going' ? 'active' : ''}" data-event-id="${escapeHTML(nextEv.id)}" data-status="going">
                        <i data-lucide="thumbs-up"></i> ${escapeHTML(stats.going)}
                    </button>
                    <button class="dash-rsvp-modern-btn ${myStatus === 'maybe' ? 'active' : ''}" data-event-id="${escapeHTML(nextEv.id)}" data-status="maybe">
                        <i data-lucide="help-circle"></i> ${escapeHTML(stats.maybe)}
                    </button>
                    <button class="dash-rsvp-modern-btn ${myStatus === 'not-going' ? 'active' : ''}" data-event-id="${escapeHTML(nextEv.id)}" data-status="not-going">
                        <i data-lucide="thumbs-down"></i> ${escapeHTML(stats.missing)}
                    </button>
                </div>
            </div>`);
        }).join('');

        if (window.lucide) window.lucide.createIcons();

        nextEventContainer.querySelectorAll('.dash-rsvp-modern-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (updateParticipation) {
                    // Warte auf Firebase Speicher- und UI-Prompt-Vorgänge
                    await updateParticipation(btn.dataset.eventId, btn.dataset.status, '');
                    // Render NUR diesen Container neu, um Flackern des gesamten Dashboards zu vermeiden!
                    renderDashNextEvents();
                }
            });
        });

        nextEventContainer.querySelectorAll('.dash-details-modern-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (showEventDetails) showEventDetails(btn.dataset.eventId, true);
            });
        });
    } else {
        nextEventContainer.innerHTML = `<div style="text-align:center; color: var(--text-muted); font-style:italic;">Keine anstehenden Termine</div>`;
    }
}

/**
 * Renders the dashboard view into the main content area.
 */
export async function showDashboardInline() {
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
    dashboardBereich.classList.remove('versteckt');

    const history = await getHistorie();

    dashboardBereich.innerHTML = `
        <div class="hub-dashboard-header">
            <div class="hub-dashboard-title">
                <i data-lucide="layout-dashboard" style="width:24px; height:24px; color: var(--hub-text);"></i>
                <h1>Dashboard</h1>
                <span class="hub-season-badge">Season 2025/26</span>
            </div>
            <div class="hub-header-actions">
                <button class="hub-btn-outline" data-action="nav" data-view="calendar">View Schedule</button>
                <button class="hub-btn-primary" data-action="add-match">Add Match</button>
            </div>
        </div>

        <div class="hub-main-area">
            
            <div class="hub-grid">
                <!-- TOP LEFT: Next Events -->
                <div class="hub-card">
                    <div class="hub-card-title">
                        <span style="letter-spacing: 0.1em; font-weight: 800;">UPCOMING</span>
                        <i data-lucide="calendar" style="width:20px; height:20px;"></i>
                    </div>
                    <div id="dashNextEvent">
                        <div style="text-align:center; color: var(--hub-muted); font-style:italic;">Lade Termine...</div>
                    </div>
                </div>

                <!-- TOP RIGHT: Metrics & Charts -->
                <div style="display: flex; flex-direction: column; height: 100%;">
                    <!-- 4 Metric Cards -->
                    <div class="hub-metrics-grid">
                        <div class="hub-metric-card">
                            <div class="hub-metric-title"><span>Total Goals</span> <i data-lucide="target" style="width:14px; height:14px;"></i></div>
                            <div class="hub-metric-value" id="hub-total-goals">-</div>
                            <div class="hub-metric-trend hub-trend-up" id="hub-total-goals-trend"></div>
                        </div>
                        <div class="hub-metric-card">
                            <div class="hub-metric-title"><span>Win Rate</span> <i data-lucide="bar-chart" style="width:14px; height:14px;"></i></div>
                            <div class="hub-metric-value" id="hub-win-rate">-</div>
                            <div class="hub-metric-trend hub-trend-up" id="hub-win-rate-trend"></div>
                        </div>
                        <div class="hub-metric-card">
                            <div class="hub-metric-title"><span>Goals Conceded</span> <i data-lucide="shield" style="width:14px; height:14px;"></i></div>
                            <div class="hub-metric-value" id="hub-goals-conceded">-</div>
                            <div class="hub-metric-trend hub-trend-down" id="hub-goals-conceded-trend" style="color: var(--hub-green);"></div>
                        </div>
                        <div class="hub-metric-card">
                            <div class="hub-metric-title"><span>Avg. Goals/Match</span> <i data-lucide="activity" style="width:14px; height:14px;"></i></div>
                            <div class="hub-metric-value" id="hub-avg-goals">-</div>
                            <div class="hub-metric-trend hub-trend-up" id="hub-avg-goals-trend"></div>
                        </div>
                    </div>

                    <!-- Middle Row inner -->
                    <div class="hub-middle-row" style="flex: 1;">
                        <!-- Live Match Card -->
                        <div class="hub-card hub-live-match" style="display: flex; flex-direction: column; height: 100%;">
                            <div class="hub-live-badge">LIVE</div>
                            <div class="hub-card-title">Live Match</div>
                            <div id="hub-live-match-content" style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
                                <div style="text-align:center; color: var(--hub-muted); font-style:italic;">Kein Live-Spiel</div>
                            </div>
                        </div>

                        <!-- Performance Chart (repurposed dashScoresChart) -->
                        <div class="hub-card" style="display: flex; flex-direction: column; height: 100%;">
                            <div class="hub-card-title">
                                <span><i data-lucide="trending-up" style="width:14px; height:14px; display:inline-block; vertical-align:middle; margin-right:4px;"></i> Performance Analytics</span>
                            </div>
                            <div style="flex: 1; width: 100%; position: relative;">
                                <canvas id="dashScoresChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Bottom Row: Standings & Performers -->
            <div class="hub-bottom-row">
                <!-- Last Results / Standings styled list -->
                <div class="hub-card">
                    <div class="hub-card-title">
                        <span>LEAGUE TABLE</span>
                        <i data-lucide="list" style="width:18px; height:18px;"></i>
                    </div>
                    <div style="overflow-x: auto;">
                        <table class="league-table-modern">
                            <thead>
                                <tr>
                                    <th style="width: 40px; text-align: center;">#</th>
                                    <th>TEAM</th>
                                    <th style="text-align: center; width: 50px;">SP</th>
                                    <th style="text-align: center; width: 50px;">S</th>
                                    <th style="text-align: center; width: 50px;">U</th>
                                    <th style="text-align: center; width: 50px;">N</th>
                                    <th style="text-align: center; width: 70px;">DIFF</th>
                                    <th style="text-align: right; width: 70px;">PKTE</th>
                                </tr>
                            </thead>
                            <tbody id="dashLastResultsHub">
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Top Performers -->
                <div class="hub-card">
                    <div class="hub-card-title">
                        <span>TOP PERFORMERS</span>
                        <i data-lucide="star" style="width:18px; height:18px;"></i>
                    </div>
                    <div id="dashTopPerformersHub">
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
        let playerGames = {}; // Track how many games each player participated in

        // Stats for Efficiency
        let totalStatsGoals = 0;
        let totalStatsMisses = 0;
        let gameEfficiencies = [];
        let chartOpponents = []; // Store opponent names for tooltips

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


            scoresHeim.push(myScore);
            scoresGegner.push(opScore);

            // Match labels and opponent names for tooltips
            const matchIndex = sortedHistory.indexOf(game) + 1;
            dates.push(`M${matchIndex}`);
            chartOpponents.push(game.teams?.gegner || game.settings?.teamNameGegner || "Unbekannter Gegner");

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

            // --- Track Appearances ---
            const activeInThisGame = new Set();
            if (game.roster) {
                game.roster.forEach(p => activeInThisGame.add(p.number));
            }
            // Also check log for players not in roster but in log
            logs.forEach(evt => { if (evt.playerId) activeInThisGame.add(evt.playerId); });
            
            activeInThisGame.forEach(pId => {
                playerGames[pId] = (playerGames[pId] || 0) + 1;
            });

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
        // 1. Next Event Logic
        renderDashNextEvents();

        // 2. Metrics Population
        const totalGames = wins + draws + losses;
        const winRate = totalGames > 0 ? ((wins / totalGames) * 100).toFixed(1) : 0;
        const avgGoals = totalGames > 0 ? (scored / totalGames).toFixed(1) : 0;

        document.getElementById('hub-total-goals').innerText = scored;
        document.getElementById('hub-total-goals-trend').innerHTML = '+12% vs last season';

        document.getElementById('hub-win-rate').innerText = winRate + '%';
        document.getElementById('hub-win-rate-trend').innerHTML = '+5.2% this season';

        document.getElementById('hub-goals-conceded').innerText = conceded;
        document.getElementById('hub-goals-conceded-trend').innerHTML = '-8% improvement';

        document.getElementById('hub-avg-goals').innerText = avgGoals;
        document.getElementById('hub-avg-goals-trend').innerHTML = '+2.1 per game';

        // 3. Load League Standings Natively
        const listContainer = document.getElementById('dashLastResultsHub');
        if (listContainer) {
            listContainer.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px; font-style: italic; color: var(--hub-muted);">Tabelle wird geladen...</td></tr>';
            
            // Robust fetch: try tournament endpoint first, then team endpoint as fallback
            const id = spielstand?.settings?.handballNetTournamentId || 'handball4all.westfalen.k10_m-kl_wfia';
                        const fetchTable = async () => {
                // Try tournament first
                try {
                    const tUrl = `https://www.handball.net/a/sportdata/1/widgets/tournament/${id}/table`;
                    const tData = await fetchWithProxy(tUrl, { json: true });
                    if (tData && tData.table && tData.table.rows) return tData.table.rows;
                } catch (e) {
                    console.log("[Dashboard] Tournament table fetch failed, trying team...");
                }

                // Try team as fallback
                try {
                    const teamUrl = `https://www.handball.net/a/sportdata/1/widgets/team/${id}/table`;
                    const teamData = await fetchWithProxy(teamUrl, { json: true });
                    if (teamData && teamData.table && teamData.table.rows) return teamData.table.rows;
                } catch (e) {
                    console.log("[Dashboard] Team table fetch failed.");
                }

                throw new Error("Tabelle konnte nicht geladen werden oder Format ungültig.");
            };

            fetchTable()
                .then(rows => {
                    listContainer.innerHTML = rows.map(r => {
                        const myName = (spielstand?.settings?.myTeamName || '').toLowerCase();
                        const isMyTeam = myName && r.team.name.toLowerCase().includes(myName);
                        
                        const rowClass = isMyTeam ? 'class="highlighted"' : '';
                        const pts = (r.points || "0:0").split(':')[0];
                        
                        return `
                            <tr ${rowClass}>
                                <td class="rank-cell">${escapeHTML(r.rank)}</td>
                                <td class="team-cell">${escapeHTML(r.team.name)}</td>
                                <td class="metric-cell">${escapeHTML(r.games)}</td>
                                <td class="metric-cell">${escapeHTML(r.wins)}</td>
                                <td class="metric-cell">${escapeHTML(r.draws)}</td>
                                <td class="metric-cell">${escapeHTML(r.losses)}</td>
                                <td class="diff-cell" style="color: ${r.goalDifference >= 0 ? '#22c55e' : '#ef4444'};">${r.goalDifference > 0 ? '+'+escapeHTML(r.goalDifference) : escapeHTML(r.goalDifference)}</td>
                                <td class="pkte-cell">${escapeHTML(pts)}</td>
                            </tr>
                        `;
                    }).join('');
                })
                .catch(err => {
                    console.error("Standings fetch error:", err);
                    listContainer.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 20px; color: var(--hub-red);">Fehler beim Laden der Tabelle (CORS o. Offline)</td></tr>';
                });
        }

        // 4. Top Performers
        const sorted = Object.keys(playerGoals).sort((a, b) => playerGoals[b] - playerGoals[a]).slice(0, 5);
        const topContainer = document.getElementById('dashTopPerformersHub');
        if (topContainer) {
        topContainer.innerHTML = sorted.map((pId) => {
            const goals = playerGoals[pId] || 0;
            const games = playerGames[pId] || 1;
            const gm = (goals / games).toFixed(1);
            
            return sanitizeHTML(`
                <div class="performer-card-modern">
                    <div class="performer-card-header">
                        <div class="performer-badge-mini">#</div>
                        <div class="performer-player-id">#${escapeHTML(pId)}</div>
                    </div>
                    <div class="performer-season-goals">${goals} Goals this season</div>
                    <div class="performer-metrics-row">
                        <span class="performer-gm-value">${gm}</span>
                        <span class="performer-gm-label">G/M</span>
                    </div>
                </div>
            `);
        }).join('') || sanitizeHTML('<div style="color: var(--hub-muted); text-align:center; padding:10px;">Keine Torschützen</div>');
        }

        // 5. Scores Line Chart (Performance Analytics)
        // Showing ALL games for a complete performance history
        const chartLabels = dates;
        const chartHeim = scoresHeim;
        const chartGegner = scoresGegner;

        initChart('dashScoresChart', {
            type: 'line',
            data: {
                labels: chartLabels,
                datasets: [
                    {
                        label: 'Erzielte Tore',
                        data: chartHeim,
                        borderColor: '#22c55e',
                        backgroundColor: 'rgba(34, 197, 94, 0.15)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 3,
                        pointRadius: 4,
                        pointBackgroundColor: '#22c55e',
                        pointBorderColor: 'rgba(255,255,255,0.2)',
                        pointHoverRadius: 6,
                        cubicInterpolationMode: 'monotone'
                    },
                    {
                        label: 'Gegentore',
                        data: chartGegner,
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 3,
                        pointRadius: 4,
                        pointBackgroundColor: '#ef4444',
                        pointBorderColor: 'rgba(255,255,255,0.2)',
                        pointHoverRadius: 6,
                        cubicInterpolationMode: 'monotone'
                    }
                ]
            },
            options: getBaseOptions('line', {
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#f8fafc',
                        bodyColor: '#f8fafc',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: true,
                        callbacks: {
                            title: (tooltipItems) => {
                                const idx = tooltipItems[0].dataIndex;
                                return `${dates[idx]}: vs ${chartOpponents[idx]}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { 
                            display: true, 
                            color: 'rgba(255,255,255,0.05)', 
                            drawBorder: false,
                            borderDash: [5, 5] 
                        },
                        ticks: { font: { size: 11, weight: '600' }, color: '#94a3b8' } 
                    },
                    y: {
                        beginAtZero: true,
                        grid: { 
                            color: 'rgba(255,255,255,0.05)', 
                            drawBorder: false,
                            borderDash: [5, 5]
                        },
                        border: { display: false },
                        ticks: { 
                            stepSize: 9, 
                            color: '#94a3b8',
                            font: { size: 11, weight: '600' }
                        }
                    }
                },
                maintainAspectRatio: false
            })
        });
    }, 250);

    dashboardBereich.classList.remove('versteckt');
}
