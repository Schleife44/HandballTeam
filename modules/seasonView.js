import { getSeasonSummary } from './seasonStats.js';
import { renderHeatmap, setCurrentHeatmapTab, setCurrentHeatmapContext } from './heatmap.js';
import { heatmapSvg, heatmap7mFilter, heatmapToreFilter, heatmapMissedFilter } from './dom.js';
import { spielstand } from './state.js';
import { getHistorie } from './history.js';
import { berechneStatistiken, berechneGegnerStatistiken, berechneTore } from './stats.js';
import { openPlayerHistoryHeatmap } from './historyView.js';

// Persistent state for team collapse
const collapsedTeams = {};

export { getSeasonSummary };

// Öffnet Saison-Übersicht (legacy name, now just ensures rendering)
export function openSeasonOverview() {
    // Just render. The view switching is handled by main navigation (ui.js / app.js)
    renderSeasonStats();
}

// Schließt Saison-Übersicht (Legacy - no op or hide section if needed)
export function closeSeasonOverview() {
    // No specific close action needed if it's a main view
}

// Rendert Saison-Statistiken (Team Focused)
export function renderSeasonStats() {
    const summary = getSeasonSummary();
    const historie = getHistorie();
    const seasonSummary = document.getElementById('seasonSummary');
    const seasonStatsContainer = document.getElementById('seasonStatsContainer');

    if (!seasonSummary || !seasonStatsContainer) return;

    // --- 1. Calculate Team Metrics ---
    let wins = 0, draws = 0, losses = 0;
    let goalsFor = 0, goalsAgainst = 0;
    let points = 0;

    // Iterate through ALL historic games
    historie.forEach(game => {
        const homeGoals = game.score?.heim || 0;
        const oppGoals = game.score?.gegner || 0;

        // Assuming we are always "Heim" or context logic needs to handle Auswärts games if we track that
        // But getHistorie() typically stores results. 
        // Let's assume standard "My Team vs Opponent" logic where result.home is US.
        // Actually, check if we track 'auswaerts' in history. Usually result.home/opponent.

        let us, them;
        // Simple logic: we are always home in the simple app context unless stated otherwise.
        // But let's check game.teams.heim vs settings.
        // For simplicity, let's assume result.home is US score and result.opponent is THEM.
        // Ref: utils.js getGameResult might help, but let's do simple math.

        // Better: Check win/loss based on scores
        if (homeGoals > oppGoals) { wins++; points += 2; }
        else if (homeGoals === oppGoals) { draws++; points += 1; }
        else { losses++; }

        goalsFor += homeGoals;
        goalsAgainst += oppGoals;
    });

    const totalGames = wins + draws + losses;
    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
    const goalDiff = goalsFor - goalsAgainst;
    const diffSign = goalDiff > 0 ? '+' : '';

    // Efficiency (Shot Conversion) - derived from players summary
    let totalShots = 0;
    let totalGoalsFromPlayers = 0; // Should match goalsFor roughly
    summary.players.forEach(p => {
        if (p.team === 'Heim') { // Only count our players
            totalGoalsFromPlayers += (p.tore || 0);
            const misses = (p.fehlwurf || 0) + ((p.siebenMeterVersuche || 0) - (p.siebenMeterTore || 0));
            totalShots += (p.tore || 0) + misses;
        }
    });
    const efficiency = totalShots > 0 ? Math.round((totalGoalsFromPlayers / totalShots) * 100) : 0;

    // --- 2. Render KPI Cards ---
    seasonSummary.innerHTML = `
        <div class="season-summary-grid" style="grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));">
            <div class="season-summary-card">
                <strong>${points} : ${totalGames * 2 - points}</strong>
                <small>Punkte (${wins}S / ${draws}U / ${losses}N)</small>
            </div>
             <div class="season-summary-card">
                <strong style="color: ${winRate >= 50 ? '#4ade80' : '#f87171'}">${winRate}%</strong>
                <small>Siegquote</small>
            </div>
            <div class="season-summary-card">
                <strong>${goalsFor} : ${goalsAgainst}</strong>
                <small>Tore (${diffSign}${goalDiff})</small>
            </div>
             <div class="season-summary-card">
                <strong>${efficiency}%</strong>
                <small>Wurfquote Team</small>
            </div>
        </div>
    `;

    // --- 3. Render Dashboard Content (Charts & Lists) ---
    // Top Scorers logic
    const topScorers = summary.players
        .filter(p => p.team === 'Heim')
        .sort((a, b) => b.tore - a.tore)
        .slice(0, 5);

    let scorersHtml = '<div class="season-card-modern"><h3><i data-lucide="medal"></i> Top Torschützen</h3><ul class="simple-list">';
    topScorers.forEach((p, i) => {
        scorersHtml += `
            <li style="display:flex; justify-content:space-between; padding: 8px 0; border-bottom: 1px solid #333;">
                <span>${i + 1}. <strong>${p.name || '#' + p.number}</strong></span>
                <span>${p.tore} Tore (${p.wurfQuote})</span>
            </li>`;
    });
    scorersHtml += '</ul></div>';

    // Game History (Simple Bar Chars)
    let historyHtml = '<div class="season-card-modern"><h3><i data-lucide="trending-up"></i> Saisonverlauf</h3><div style="display:flex; gap: 5px; height: 100px; align-items: flex-end; padding-top:10px;">';

    // Normalize bars relative to max goals
    const maxGoals = Math.max(40, ...historie.map(g => (g.score?.heim || 0)));

    historie.forEach(game => {
        const g = game.score?.heim || 0;
        const isWin = (game.score?.heim || 0) > (game.score?.gegner || 0);
        const isDraw = (game.score?.heim || 0) === (game.score?.gegner || 0);
        const color = isWin ? '#4ade80' : (isDraw ? '#fbbf24' : '#f87171');
        const height = Math.max(10, (g / maxGoals) * 100); // Min 10% height

        historyHtml += `
            <div style="flex:1; background:${color}; height:${height}%; border-radius: 4px 4px 0 0; position:relative; min-width: 10px;" title="${g} Tore vs ${game.teams?.gegner}">
            </div>
        `;
    });
    historyHtml += '</div><div style="text-align:center; font-size: 0.8rem; color: #888; margin-top:5px;">Spiele (Links = Ältestes)</div></div>';

    // Build the grid
    // Build the grid
    seasonStatsContainer.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
            ${scorersHtml}
            ${historyHtml}
        </div>
    `;

    // Re-create Icons
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// Rendert Saison-Statistiken (Player List - ORIGINAL LOGIC RENAMED)
// Rendert Saison-Statistiken (Player List)
export function renderPlayerSeasonStats(targetContainer = null) {
    const summary = getSeasonSummary();
    // Use passed container OR default to the submodule container
    const seasonStatsContainer = targetContainer || document.getElementById('playerStatsListContainer');

    if (!seasonStatsContainer) return;

    // Remove sorting buttons container if it already exists (to avoid duplicates on re-render)
    // Scope search to the *container* now, as we put the toolbar inside.
    const existingSort = seasonStatsContainer.querySelector('.season-sort-container');
    if (existingSort) existingSort.remove();

    // Add Sort Buttons to Season Summary (temporarily, or maybe just inside the player container?)
    // Originally they were in seasonSummary. Let's put them above the list in the new container for better isolation.
    // Actually, following the original design, they were in seasonSummary. 
    // But since seasonSummary is now used for Team KPIs, maybe we should put sorting controls inside playerStatsListContainer?
    // Let's stick to putting them in playerStatsListContainer to keep "Team Stats" view clean.

    // Correction: The new design puts team stats in seasonSummary. 
    // So let's add a toolbar inside seasonStatsContainer (playerStatsListContainer).

    // Render Player Cards with Headers
    const renderList = (sortMode) => {
        seasonStatsContainer.innerHTML = '';

        // Add Toolbar
        const toolbar = document.createElement('div');
        toolbar.className = 'season-sort-container';
        toolbar.style.marginBottom = '15px';
        toolbar.innerHTML = `
             <span style="font-size: 0.85rem; font-weight: 600; color: hsl(var(--muted-foreground));">Sortieren nach:</span>
             <button id="sortByNumber" class="${sortMode === 'number' ? 'shadcn-btn-primary' : 'shadcn-btn-outline'}" style="height: 32px; font-size: 0.8rem; padding: 0 12px;">Nummer</button>
             <button id="sortByGoals" class="${sortMode === 'goals' ? 'shadcn-btn-primary' : 'shadcn-btn-outline'}" style="height: 32px; font-size: 0.8rem; padding: 0 12px;">Tore</button>
        `;
        seasonStatsContainer.appendChild(toolbar);

        // Bind Toolbar Events
        toolbar.querySelector('#sortByNumber').addEventListener('click', () => renderList('number'));
        toolbar.querySelector('#sortByGoals').addEventListener('click', () => renderList('goals'));

        // Clone array to sort
        let players = [...summary.players];

        if (sortMode === 'goals') {
            players.sort((a, b) => {
                if (a.team !== b.team) {
                    if (a.team === 'Heim') return -1;
                    if (b.team === 'Heim') return 1;
                    return a.team.localeCompare(b.team);
                }
                return b.tore - a.tore || a.number - b.number;
            });
        } else {
            players.sort((a, b) => {
                if (a.team !== b.team) {
                    if (a.team === 'Heim') return -1;
                    if (b.team === 'Heim') return 1;
                    return a.team.localeCompare(b.team);
                }
                return a.number - b.number;
            });
        }

        if (players.length === 0) {
            const msg = document.createElement('p');
            msg.style.textAlign = 'center';
            msg.style.color = '#999';
            msg.style.padding = '40px';
            msg.textContent = 'Keine Spieler-Daten vorhanden. Spiele zuerst einige Spiele und beende sie!';
            seasonStatsContainer.appendChild(msg);
            return;
        }

        let currentTeam = null;
        let teamContainer = null;

        players.forEach((player) => {
            // Insert Team Header if team changes
            if (player.team !== currentTeam) {
                currentTeam = player.team;

                const headerText = currentTeam === 'Heim'
                    ? (spielstand.settings.myTeamName || spielstand.settings.teamNameHeim || 'Unser Team')
                    : currentTeam;

                const headerDiv = document.createElement('div');
                headerDiv.className = 'season-team-header-modern';

                const leftSection = document.createElement('div');
                leftSection.style.display = 'flex';
                leftSection.style.alignItems = 'center';
                leftSection.style.gap = '10px';

                const toggleIcon = document.createElement('span');
                toggleIcon.className = 'team-toggle-icon';
                toggleIcon.textContent = '▼';
                toggleIcon.style.transition = 'transform 0.3s ease';

                const headerTextSpan = document.createElement('span');
                headerTextSpan.textContent = headerText;

                leftSection.appendChild(toggleIcon);
                leftSection.appendChild(headerTextSpan);
                headerDiv.appendChild(leftSection);

                // Team Statistics Button
                const teamStatsBtn = document.createElement('button');
                teamStatsBtn.textContent = 'Team Grafik';
                teamStatsBtn.className = 'show-team-heatmap-btn shadcn-btn-secondary';
                teamStatsBtn.style.height = '32px';
                teamStatsBtn.style.fontSize = '0.75rem';
                teamStatsBtn.style.padding = '0 10px';

                // Capture team name in closure (prevent bug where all buttons reference last team)
                const teamNameForButton = currentTeam;
                teamStatsBtn.dataset.team = teamNameForButton;

                // Add Listener locally since we are rendering fresh
                teamStatsBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    import('./seasonView.js').then(mod => mod.showTeamHeatmap(teamNameForButton));
                });

                headerDiv.appendChild(teamStatsBtn);

                // Create container for team players
                const currentTeamContainer = document.createElement('div');
                currentTeamContainer.className = 'team-players-container';
                currentTeamContainer.dataset.team = currentTeam;

                // Restore collapsed state if it exists
                const isCurrentlyCollapsed = collapsedTeams[currentTeam] === true;
                currentTeamContainer.dataset.collapsed = isCurrentlyCollapsed ? 'true' : 'false';

                if (isCurrentlyCollapsed) {
                    currentTeamContainer.style.maxHeight = '0';
                    currentTeamContainer.style.opacity = '0';
                    toggleIcon.style.transform = 'rotate(-90deg)';
                } else {
                    currentTeamContainer.style.maxHeight = 'none';
                    currentTeamContainer.style.opacity = '1';
                    toggleIcon.style.transform = 'rotate(0deg)';
                }

                seasonStatsContainer.appendChild(headerDiv);
                seasonStatsContainer.appendChild(currentTeamContainer);

                // Add toggle functionality
                const teamNameForListener = currentTeam; // Capture in local const for closure
                const currentToggleIcon = toggleIcon;
                headerDiv.addEventListener('click', () => {
                    const isCollapsedNow = currentTeamContainer.dataset.collapsed === 'true';
                    const newState = !isCollapsedNow;
                    currentTeamContainer.dataset.collapsed = newState ? 'true' : 'false';
                    collapsedTeams[teamNameForListener] = newState; // Remember state globally in module

                    if (!newState) { // Opening
                        currentTeamContainer.style.maxHeight = currentTeamContainer.scrollHeight + 'px';
                        currentTeamContainer.style.opacity = '1';
                        currentToggleIcon.style.transform = 'rotate(0deg)';
                    } else { // Closing
                        currentTeamContainer.style.maxHeight = '0';
                        currentTeamContainer.style.opacity = '0';
                        currentToggleIcon.style.transform = 'rotate(-90deg)';
                    }
                });

                teamContainer = currentTeamContainer;
            }

            // Find original index (needed for heatmap data access in showPlayerHeatmap)
            // Use precise matching including team to avoid collisions
            const originalIndex = summary.players.findIndex(p => p.number === player.number && p.name === player.name && (p.team || 'Heim') === (player.team || 'Heim'));
            const playerCard = createPlayerCard(player, originalIndex);
            teamContainer.appendChild(playerCard);
        });
    };

    // Initial Render
    renderList('number');
}

// Erstellt Liste der Spiele für einen Spieler
function renderGameHistoryList(player) {
    const historyGames = getHistorie().sort((a, b) => new Date(b.date) - new Date(a.date));

    const container = document.createElement('div');
    container.style.marginTop = '20px';
    container.innerHTML = '<h4 style="margin-bottom: 10px; border-bottom: 1px solid #555; padding-bottom: 5px;">Spiele-Historie</h4>';

    const table = document.createElement('table');
    table.className = 'season-table';
    table.innerHTML = `
        <thead>
            <tr>
                <th>Datum</th>
                <th>Gegner/Spiel</th>
                <th style="text-align: center;">Tore</th>
                <th style="text-align: center;">Quote</th>
                <th style="text-align: center;">Grafik</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;
    const tbody = table.querySelector('tbody');
    let hasGames = false;

    historyGames.forEach(game => {
        let stats = null;
        let isMatch = false;

        if (player.team === 'Heim') {
            const inRoster = game.roster.some(r => r.number == player.number);
            if (inRoster) {
                const gameStats = berechneStatistiken(game.gameLog, game.roster);
                stats = gameStats.find(s => s.number == player.number);
                if (stats) {
                    const toreMap = berechneTore(game.gameLog);
                    const fieldGoals = toreMap.get(parseInt(player.number)) || toreMap.get(String(player.number)) || 0;
                    stats.tore = fieldGoals + (stats.siebenMeterTore || 0);
                }
                isMatch = true;
            }
        } else {
            if (game.teams.gegner === player.team) {
                const oppStats = berechneGegnerStatistiken(game.gameLog);
                stats = oppStats.find(s => s.number == player.number);
                if (stats) isMatch = true;
            }
        }

        if (isMatch && stats) {
            hasGames = true;
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid #333';

            const dateStr = new Date(game.date).toLocaleDateString();
            const matchTitle = player.team === 'Heim' ? `vs ${game.teams.gegner}` : `@ Heim`;

            const goals = stats.tore || 0;
            const sevenMGoals = stats.siebenMeterTore || 0;
            const fieldGoals = goals - sevenMGoals;
            const fieldMisses = stats.fehlwurf || 0;
            // Quote = Field Goals / (Field Goals + Field Misses)
            const fieldAttempts = fieldGoals + fieldMisses;
            const quote = fieldAttempts > 0 ? Math.round(fieldGoals / fieldAttempts * 100) + '%' : '-';

            // Buttons logic
            const isOpp = (player.team !== 'Heim');
            const playerLog = game.gameLog.filter(e => {
                const pId = isOpp ? (e.gegnerNummer || -1) : e.playerId;
                const isOppAction = e.action.startsWith('Gegner') || e.gegnerNummer;

                if (player.team === 'Heim' && isOppAction) return false;
                if (player.team !== 'Heim' && !isOppAction) return false;

                return pId == player.number;
            });

            const hasField = playerLog.some(e => !e.action.includes('7m'));
            const has7m = playerLog.some(e => e.action.includes('7m'));

            let btnHtml = '';
            // Change outline to secondary for "Dark in Dark Mode" look
            if (hasField) btnHtml += `<button class="game-heatmap-btn shadcn-btn-secondary" data-mode="field" style="width: 32px; height: 32px; padding: 0; display:inline-flex; align-items:center; justify-content:center; vertical-align:middle;" title="Wurfbild"><i data-lucide="crosshair" style="width: 16px; height: 16px;"></i></button>`;
            if (has7m) btnHtml += `<button class="game-heatmap-btn shadcn-btn-outline" data-mode="7m" style="height: 32px; padding: 0 8px; font-size: 0.75rem; margin-left: 5px; border-color: #f59e0b; color: #f59e0b; display:inline-flex; align-items:center; vertical-align:middle;" title="7m Statistik">7m</button>`;

            tr.innerHTML = `
                <td>${dateStr}</td>
                <td>${matchTitle}</td>
                <td style="text-align: center;"><strong>${goals}</strong></td>
                <td style="text-align: center;">${quote}</td>
                <td style="text-align: center; display: flex; justify-content: center; gap: 4px;">${btnHtml}</td>
            `;

            // Attach listeners
            const btns = tr.querySelectorAll('.game-heatmap-btn');
            btns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const mode = btn.dataset.mode;
                    openPlayerHistoryHeatmap(game.gameLog, player.number, player.team === 'Heim' ? 'heim' : 'gegner', player.name, mode);
                });
            });

            tbody.appendChild(tr);
        }
    });

    if (!hasGames) return null;

    container.appendChild(table);
    return container;
}

// Erstellt Spieler-Karte
function createPlayerCard(player, index) {
    const card = document.createElement('div');
    card.className = 'season-player-card-modern';

    const displayName = player.name ? `#${player.number} - ${player.name}` : `#${player.number}`;

    // Header
    const header = document.createElement('div');
    header.className = 'season-player-header';

    // Calculate Feldtore for header display
    const headerFeldtore = player.tore - (player.siebenMeterTore || 0);

    header.innerHTML = `
        <div>
            <div class="info-main">${displayName}</div>
            <div class="info-sub">${player.totalGames} Spiele · Tore: ${player.tore} (Feld: ${headerFeldtore}, 7m: ${player.siebenMeterTore || 0}/${player.siebenMeterVersuche || 0}) · Quote: ${player.wurfQuote}</div>
        </div>
        <span class="expand-icon" style="font-size: 1.2rem; transition: transform 0.2s ease;">▼</span>
    `;

    // Details (initially hidden)
    const details = document.createElement('div');
    details.className = 'season-player-details versteckt';

    // Stats Table - Calculate Feldtore (field goals = tore - 7m goals)
    const feldtore = player.tore - (player.siebenMeterTore || 0);

    const statsTable = `
        <div class="table-container">
            <table class="season-table">
                <thead>
                    <tr>
                        <th>Tore</th>
                        <th>Feld</th>
                        <th>7m</th>
                        <th>Fehl</th>
                        <th>%</th>
                        <th>Gut</th>
                        <th>TF</th>
                        <th>G</th>
                        <th>2'</th>
                        <th>R</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>${player.tore}</strong></td>
                        <td>${feldtore}</td>
                        <td>${player.siebenMeterTore}/${player.siebenMeterVersuche}</td>
                        <td>${player.fehlwurf}</td>
                        <td>${player.wurfQuote}</td>
                        <td>${player.guteAktion}</td>
                        <td>${player.techFehler}</td>
                        <td>${player.gelb}</td>
                        <td>${player.zweiMinuten}</td>
                        <td>${player.rot}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;

    // Heatmap Buttons - Check for field throws and 7m throws separately
    const fieldThrows = player.seasonLog ? player.seasonLog.filter(e => !e.is7m) : [];
    const sevenMThrows = player.seasonLog ? player.seasonLog.filter(e => e.is7m) : [];

    const hasFieldData = fieldThrows.length > 0;
    const has7mData = sevenMThrows.length > 0;

    let heatmapButtonsHtml = '<div class="season-btn-group">';

    if (hasFieldData) {
        heatmapButtonsHtml += `<button class="show-heatmap-btn shadcn-btn-secondary" data-player-index="${index}" data-mode="field" style="flex: 1; height: 36px; font-size: 0.85rem;">Grafik</button>`;
    }

    if (has7mData) {
        heatmapButtonsHtml += `<button class="show-heatmap-btn shadcn-btn-outline" data-player-index="${index}" data-mode="7m" style="flex: 1; height: 36px; font-size: 0.85rem; border-color: #f59e0b; color: #f59e0b;">7m Grafik</button>`;
    }

    if (!hasFieldData && !has7mData) {
        heatmapButtonsHtml += '<small style="color:hsl(var(--muted-foreground)); width:100%; text-align:center;">Keine Grafik-Daten</small>';
    }

    heatmapButtonsHtml += '</div>';

    details.innerHTML = statsTable + heatmapButtonsHtml;

    // FIX: Attach listeners immediately
    const heatmapBtns = details.querySelectorAll('.show-heatmap-btn');
    heatmapBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const mode = btn.dataset.mode;
            showPlayerHeatmap(index, mode);
        });
    });

    // Add Game History List
    const historyList = renderGameHistoryList(player);
    if (historyList) {
        details.appendChild(historyList);
    }

    // Render icons (Now includes history list icons)
    if (typeof lucide !== 'undefined') lucide.createIcons({ root: details });

    // Toggle functionality
    header.addEventListener('click', () => {
        details.classList.toggle('versteckt');
        const icon = header.querySelector('.expand-icon');
        const isHidden = details.classList.contains('versteckt');
        icon.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(180deg)';
    });

    card.appendChild(header);
    card.appendChild(details);

    return card;
}

// Zeigt Heatmap für Spieler
export function showPlayerHeatmap(playerIndex, mode = 'field') {
    const summary = getSeasonSummary();
    const player = summary.players[playerIndex];

    if (!player) return;

    // Default to 'tor' (Wurfbild)
    setCurrentHeatmapTab('tor');

    const displayName = player.name ? `#${player.number} - ${player.name}` : `#${player.number}`;
    const modeLabel = mode === '7m' ? '7m Grafik' : 'Grafik';

    // Use all log entries
    let logEntries = (player.seasonLog || []).map(e => ({
        ...e,
        number: e.playerId || player.number
    }));

    const isOpponentPlayer = logEntries.length > 0 && logEntries[0].isOpponent;

    // Set Context
    setCurrentHeatmapContext({
        log: logEntries,
        title: `${modeLabel} - ${displayName} (Saison)`,
        filter: {
            team: player.team,
            player: player.number
        },
        type: 'season-specific'
    });

    // Simulate navigation
    const navItem = document.querySelector('.nav-item[data-view="seasonheatmap"]');
    if (navItem) navItem.click();
}

// Zeigt kombinierte Heatmap für alle Spieler eines Teams
export function showTeamHeatmap(teamName) {
    const summary = getSeasonSummary();

    // Finde alle Spieler des Teams
    const teamPlayers = summary.players.filter(p => p.team === teamName);

    if (teamPlayers.length === 0) return;

    // Check if we are viewing "My Team" (either literally 'Heim' or matching stored name)
    const isMyTeam = teamName === 'Heim' || teamName === spielstand.settings.myTeamName || teamName === spielstand.settings.teamNameHeim;

    // DEBUG: Log to console
    console.log('[showTeamHeatmap] teamName:', teamName);
    console.log('[showTeamHeatmap] spielstand.settings.myTeamName:', spielstand.settings.myTeamName);
    console.log('[showTeamHeatmap] spielstand.settings.teamNameHeim:', spielstand.settings.teamNameHeim);
    console.log('[showTeamHeatmap] isMyTeam:', isMyTeam);


    // Aggregiere alle seasonLog Einträge
    const allLogEntries = [];
    teamPlayers.forEach(player => {
        if (player.seasonLog) {
            allLogEntries.push(...player.seasonLog.map(e => ({
                ...e,
                number: e.playerId || player.number,
                // FORCE identity based on the team container we are in.
                // If it is my team -> isOpponent=false.
                // If not my team -> isOpponent=true.
                isOpponent: !isMyTeam
            })));
        }
    });

    // Default to 'tor' (Wurfbild)
    setCurrentHeatmapTab('tor');

    const displayName = teamName === 'Heim'
        ? (spielstand.settings.myTeamName || spielstand.settings.teamNameHeim || 'Unser Team')
        : teamName;

    // Set Context
    setCurrentHeatmapContext({
        log: allLogEntries,
        title: `Team Grafik - ${displayName} (${teamPlayers.length} Spieler)`,
        filter: {
            team: isMyTeam ? 'Heim' : teamName, // Normalize to 'Heim' for heatmap.js filter logic
            player: null // Team-wide
        },
        type: 'season-specific'
    });

    // Simulate navigation
    const navItem = document.querySelector('.nav-item[data-view="seasonheatmap"]');
    if (navItem) navItem.click();
}

// Generiert SVG Scatter Plot für Team-Performance
export function renderTeamScatterPlot(players) {
    // Filter active players (scored or threw)
    const activePlayers = players.filter(p => p.tore > 0 || p.fehlwurf > 0);

    if (activePlayers.length < 2) return null;

    // Metrics Configuration (Expanded)
    const metrics = {
        tore: { label: 'Tore (Gesamt)', getValue: p => p.tore || 0 },
        toreSchnitt: { label: 'Ø Tore pro Spiel', getValue: p => p.totalGames > 0 ? (p.tore / p.totalGames).toFixed(1) : 0 },
        feldtore: { label: 'Feldtore', getValue: p => (p.tore || 0) - (p.siebenMeterTore || 0) },
        feldwuerfe: { label: 'Feldwürfe', getValue: p => ((p.tore || 0) - (p.siebenMeterTore || 0)) + (p.fehlwurf || 0) },
        feldtorQuote: { label: 'Feldtorquote (%)', getValue: p => parseInt(p.wurfQuote) || 0 },
        siebenMeterQuote: {
            label: '7m Quote (%)',
            getValue: p => {
                const sTore = p.siebenMeterTore || 0;
                const sVersuche = p.siebenMeterVersuche || 0;
                return sVersuche > 0 ? Math.round((sTore / sVersuche) * 100) : 0;
            }
        },
        wurfQuote: {
            label: 'Wurfquote (Gesamt %)',
            getValue: p => {
                const totalGoals = p.tore || 0;
                const totalMisses = (p.fehlwurf || 0) + ((p.siebenMeterVersuche || 0) - (p.siebenMeterTore || 0));
                const totalAttempts = totalGoals + totalMisses;
                return totalAttempts > 0 ? Math.round((totalGoals / totalAttempts) * 100) : 0;
            }
        },
        effizienz: {
            label: 'Effizienz-Score (Gewichtet)',
            getValue: p => {
                const totalGoals = p.tore || 0;

                const fieldMisses = p.fehlwurf || 0;
                const sevenMeterMisses = (p.siebenMeterVersuche || 0) - (p.siebenMeterTore || 0);
                const totalMisses = fieldMisses + sevenMeterMisses;

                const suspensions = p.zweiMinuten || 0;

                // Weights: Goal +6, Miss -7, 2min -4
                return (totalGoals * 6) - (totalMisses * 7) - (suspensions * 4);
            }
        },
        fehlwurf: { label: 'Fehlwürfe (Gesamt)', getValue: p => (p.fehlwurf || 0) + ((p.siebenMeterVersuche || 0) - (p.siebenMeterTore || 0)) },
        feldFehlwurf: { label: 'Feld-Fehlwürfe', getValue: p => p.fehlwurf || 0 },
        siebenMeterFehlwurf: { label: '7m Fehlwürfe', getValue: p => (p.siebenMeterVersuche || 0) - (p.siebenMeterTore || 0) },
        siebenMeterTore: { label: '7m Tore', getValue: p => p.siebenMeterTore || 0 },
        siebenMeterVersuche: { label: '7m Würfe', getValue: p => p.siebenMeterVersuche || 0 },
        guteAktion: { label: 'Gute Aktionen', getValue: p => p.guteAktion || 0 },
        techFehler: { label: 'Tech. Fehler', getValue: p => p.techFehler || 0 },
        techFehlerSchnitt: { label: 'Ø Tech. Fehler', getValue: p => p.totalGames > 0 ? (p.techFehler / p.totalGames).toFixed(1) : 0 },
        zweiMinuten: { label: '2-Minuten', getValue: p => p.zweiMinuten || 0 },
        totalGames: { label: 'Spiele', getValue: p => p.totalGames || 0 }
    };

    // Create Wrapper with Modern Card Style
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
        position: relative; 
        margin: 2rem auto; 
        max-width: 900px;
        padding: 1.5rem; 
        background: linear-gradient(145deg, #2a2a2a, #202020); 
        border-radius: 12px; 
        border: 1px solid #333; 
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        color: var(--text-main);
    `;

    const title = document.createElement('h4');
    title.textContent = "Team-Vergleich (Scatter Plot)";
    title.style.cssText = `
        margin: 0 0 1.5rem 0; 
        text-align: center; 
        color: var(--text-main); 
        border-bottom: 2px solid #61dafb; 
        display: inline-block;
        padding-bottom: 0.5rem;
        left: 50%;
        position: relative;
        transform: translateX(-50%);
    `;
    wrapper.appendChild(title);

    // Controls Container
    const controlsDiv = document.createElement('div');
    controlsDiv.style.cssText = 'display: flex; justify-content: center; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 20px;';

    const createSelect = (label, id, defaultVal) => {
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '5px';

        const lbl = document.createElement('label');
        lbl.textContent = label;
        lbl.style.fontSize = '0.85rem';
        lbl.style.color = '#fff';
        lbl.style.fontWeight = 'bold';

        const select = document.createElement('select');
        select.id = id;
        select.style.cssText = `
            background: #333; 
            color: white; 
            border: 1px solid #555; 
            padding: 8px 12px; 
            border-radius: 6px; 
            font-size: 0.9rem;
            outline: none;
            cursor: pointer;
            transition: border-color 0.2s;
            min-width: 140px;
        `;
        select.addEventListener('focus', () => select.style.borderColor = '#61dafb');
        select.addEventListener('blur', () => select.style.borderColor = '#555');

        Object.keys(metrics).forEach(key => {
            const opt = document.createElement('option');
            opt.value = key;
            opt.textContent = metrics[key].label;
            if (key === defaultVal) opt.selected = true;
            select.appendChild(opt);
        });

        container.appendChild(lbl);
        container.appendChild(select);
        return { container, select };
    };

    const xControl = createSelect('X-Achse:', 'axis-x-select', 'tore');
    const yControl = createSelect('Y-Achse:', 'axis-y-select', 'feldtorQuote');

    // Filter Control (Team)
    const filterContainer = document.createElement('div');
    filterContainer.style.display = 'flex';
    filterContainer.style.flexDirection = 'column';
    filterContainer.style.gap = '5px';

    const filterLbl = document.createElement('label');
    filterLbl.textContent = 'Team Filter:';
    filterLbl.style.fontSize = '0.85rem';
    filterLbl.style.color = '#fff';
    filterLbl.style.fontWeight = 'bold';

    const filterSelect = document.createElement('select');
    filterSelect.id = 'scatter-filter-team';
    filterSelect.style.cssText = `
        background: #333; 
        color: white; 
        border: 1px solid #555; 
        padding: 8px 12px; 
        border-radius: 6px; 
        font-size: 0.9rem;
        outline: none;
        cursor: pointer;
        transition: border-color 0.2s;
        min-width: 120px;
    `;
    filterSelect.addEventListener('focus', () => filterSelect.style.borderColor = '#61dafb');
    filterSelect.addEventListener('blur', () => filterSelect.style.borderColor = '#555');

    // Generate Options
    const optAll = document.createElement('option');
    optAll.value = 'all';
    optAll.textContent = 'Alle Teams';
    filterSelect.appendChild(optAll);

    // Heim Team
    const homeName = spielstand.settings.myTeamName || spielstand.settings.teamNameHeim || 'Heim';
    const optHome = document.createElement('option');
    optHome.value = 'Heim';
    optHome.textContent = homeName;
    filterSelect.appendChild(optHome);

    // Alle Gegner
    const optAllOpp = document.createElement('option');
    optAllOpp.value = 'all_opponents';
    optAllOpp.textContent = 'Alle Gegner';
    filterSelect.appendChild(optAllOpp);

    // Specific Opponent Teams
    const oppTeams = new Set();
    activePlayers.forEach(p => {
        if (p.team && p.team !== 'Heim') {
            oppTeams.add(p.team);
        }
    });

    Array.from(oppTeams).sort().forEach(teamName => {
        const opt = document.createElement('option');
        opt.value = teamName;
        opt.textContent = teamName;
        filterSelect.appendChild(opt);
    });
    filterContainer.appendChild(filterLbl);
    filterContainer.appendChild(filterSelect);

    controlsDiv.appendChild(xControl.container);
    controlsDiv.appendChild(yControl.container);
    controlsDiv.appendChild(filterContainer);

    // Toggle Button


    controlsDiv.appendChild(xControl.container);
    controlsDiv.appendChild(yControl.container);

    wrapper.appendChild(controlsDiv);

    const svgContainer = document.createElement('div');
    svgContainer.className = 'svg-container';
    svgContainer.style.cssText = "background: rgba(0,0,0,0.2); border-radius: 8px; padding: 10px;";
    wrapper.appendChild(svgContainer);

    // Custom Tooltip (Glassmorphism)
    const tooltip = document.createElement('div');
    tooltip.className = 'scatter-tooltip';
    tooltip.style.cssText = `
        position: absolute; 
        display: none; 
        background: rgba(40, 40, 40, 0.95); 
        backdrop-filter: blur(5px);
        color: #fff; 
        padding: 10px 14px; 
        border-radius: 8px; 
        pointer-events: none; 
        font-size: 0.9rem; 
        z-index: 100; 
        border: 1px solid rgba(255,255,255,0.1); 
        white-space: nowrap; 
        box-shadow: 0 8px 16px rgba(0,0,0,0.4);
    `;
    wrapper.appendChild(tooltip);

    // Toggle Logic


    // Render Chart Function
    const renderChart = () => {
        svgContainer.innerHTML = '';

        const xKey = xControl.select.value;
        const yKey = yControl.select.value;
        const xData = metrics[xKey];
        const yData = metrics[yKey];

        const width = window.innerWidth < 640 ? 400 : 650; // Mobile: 400, Desktop: 650 (Original)
        const height = window.innerWidth < 640 ? 500 : 400; // Mobile: Tall, Desktop: 400 (Original)
        const padding = { top: 40, right: 30, bottom: 60, left: 70 }; // More space for labels

        // Filter Data based on Team Selection
        const selectedTeamFilter = filterSelect.value;
        const filteredPlayers = activePlayers.filter(p => {
            if (selectedTeamFilter === 'all') return true;
            if (selectedTeamFilter === 'Heim') return p.team === 'Heim';
            if (selectedTeamFilter === 'all_opponents') return p.team !== 'Heim';
            return p.team === selectedTeamFilter;
        });

        if (filteredPlayers.length === 0) {
            svgContainer.innerHTML = '<p style="text-align:center; padding: 40px; color: #999;">Keine Daten für die aktuelle Auswahl.</p>';
            return;
        }

        // Determine Max Values
        const xValues = filteredPlayers.map(p => xData.getValue(p));
        const yValues = filteredPlayers.map(p => yData.getValue(p));

        // Calculate Range (Min/Max) to support negative values
        let xMin = Math.min(0, ...xValues);
        let yMin = Math.min(0, ...yValues);

        // Add buffer to Min if negative
        if (xMin < 0) xMin *= 1.1;
        if (yMin < 0) yMin *= 1.1;

        let xMax = Math.max(...xValues, 1) * 1.1; // Default at least 1
        let yMax = Math.max(...yValues, 1) * 1.1;

        // Cap at 100 if percentage
        if (xData.label.includes('%')) xMax = Math.min(xMax, 100);
        if (yData.label.includes('%')) yMax = Math.min(yMax, 100);

        // Dynamic Font Sizes
        const isMobile = window.innerWidth < 640;
        const mainFontSize = isMobile ? '16px' : '11px';  // Desktop: 11px (Original)
        const axisLabelSize = isMobile ? '18px' : '12px'; // Desktop: 12px (Small)
        const titleFontSize = isMobile ? '20px' : '14px'; // Desktop: 14px (Standard)

        // ... SVG Setup ...
        const svgNs = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNs, "svg");
        svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
        svg.style.width = "100%";
        svg.style.height = "auto";
        svg.style.maxWidth = "100%";
        svg.style.overflow = "visible";
        svg.style.fontFamily = "'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

        // Scales
        const xScale = (val) => padding.left + ((val - xMin) / (xMax - xMin)) * (width - padding.left - padding.right);
        const yScale = (val) => height - padding.bottom - ((val - yMin) / (yMax - yMin)) * (height - padding.top - padding.bottom);

        // Draw Zero Lines (Origins) if within range
        if (xMin < 0 && xMax > 0) {
            const zeroX = xScale(0);
            const line = document.createElementNS(svgNs, "line");
            line.setAttribute("x1", zeroX); line.setAttribute("y1", padding.top);
            line.setAttribute("x2", zeroX); line.setAttribute("y2", height - padding.bottom);
            line.setAttribute("stroke", "#555");
            line.setAttribute("stroke-width", "1");
            svg.appendChild(line);
        }

        if (yMin < 0 && yMax > 0) {
            const zeroY = yScale(0);
            const line = document.createElementNS(svgNs, "line");
            line.setAttribute("x1", padding.left); line.setAttribute("y1", zeroY);
            line.setAttribute("x2", width - padding.right); line.setAttribute("y2", zeroY);
            line.setAttribute("stroke", "#555");
            line.setAttribute("stroke-width", "1");
            svg.appendChild(line);
        }

        // Axes box
        const xAxisLine = document.createElementNS(svgNs, "line");
        xAxisLine.setAttribute("x1", padding.left); xAxisLine.setAttribute("y1", height - padding.bottom);
        xAxisLine.setAttribute("x2", width - padding.right); xAxisLine.setAttribute("y2", height - padding.bottom);
        xAxisLine.setAttribute("stroke", "#777");
        xAxisLine.setAttribute("stroke-width", isMobile ? "3" : "2"); // Thicker on mobile
        xAxisLine.setAttribute("stroke-linecap", "round");
        svg.appendChild(xAxisLine);

        const yAxisLine = document.createElementNS(svgNs, "line");
        yAxisLine.setAttribute("x1", padding.left); yAxisLine.setAttribute("y1", padding.top);
        yAxisLine.setAttribute("x2", padding.left); yAxisLine.setAttribute("y2", height - padding.bottom);
        yAxisLine.setAttribute("stroke", "#777");
        yAxisLine.setAttribute("stroke-width", isMobile ? "3" : "2");
        yAxisLine.setAttribute("stroke-linecap", "round");
        svg.appendChild(yAxisLine);

        // Labels
        const xLabel = document.createElementNS(svgNs, "text");
        xLabel.setAttribute("x", width / 2); xLabel.setAttribute("y", height - 10);
        xLabel.setAttribute("text-anchor", "middle");
        xLabel.setAttribute("fill", "#ddd");
        xLabel.setAttribute("font-size", titleFontSize); // Use variable
        xLabel.setAttribute("font-weight", "500");
        xLabel.textContent = xData.label;
        svg.appendChild(xLabel);

        const yLabel = document.createElementNS(svgNs, "text");
        yLabel.setAttribute("x", 20); yLabel.setAttribute("y", height / 2);
        yLabel.setAttribute("text-anchor", "middle");
        yLabel.setAttribute("fill", "#ddd");
        yLabel.setAttribute("font-size", titleFontSize); // Use variable
        yLabel.setAttribute("font-weight", "500");
        yLabel.setAttribute("transform", `rotate(-90, 20, ${height / 2})`);
        yLabel.textContent = yData.label;
        svg.appendChild(yLabel);

        // --- Average Lines (New) ---
        const sumX = xValues.reduce((a, b) => a + parseFloat(b), 0);
        const avgX = xValues.length ? sumX / xValues.length : 0;
        const avgXPos = xScale(avgX);

        const sumY = yValues.reduce((a, b) => a + parseFloat(b), 0);
        const avgY = yValues.length ? sumY / yValues.length : 0;
        const avgYPos = yScale(avgY);

        // Draw Average X (Vertical)
        if (avgXPos > padding.left && avgXPos < width - padding.right) {
            const avgLineX = document.createElementNS(svgNs, "line");
            avgLineX.setAttribute("x1", avgXPos); avgLineX.setAttribute("y1", padding.top);
            avgLineX.setAttribute("x2", avgXPos); avgLineX.setAttribute("y2", height - padding.bottom);
            avgLineX.setAttribute("stroke", "#ffc107"); // Yellowish for Average
            avgLineX.setAttribute("stroke-width", "1");
            avgLineX.setAttribute("stroke-dasharray", "5,5");
            avgLineX.setAttribute("opacity", "0.5");
            svg.appendChild(avgLineX);
        }

        // Draw Average Y (Horizontal)
        if (avgYPos > padding.top && avgYPos < height - padding.bottom) {
            const avgLineY = document.createElementNS(svgNs, "line");
            avgLineY.setAttribute("x1", padding.left); avgLineY.setAttribute("y1", avgYPos);
            avgLineY.setAttribute("x2", width - padding.right); avgLineY.setAttribute("y2", avgYPos);
            avgLineY.setAttribute("stroke", "#ffc107");
            avgLineY.setAttribute("stroke-width", "1");
            avgLineY.setAttribute("stroke-dasharray", "5,5");
            avgLineY.setAttribute("opacity", "0.5");
            svg.appendChild(avgLineY);
        }

        // Grid & Markers
        const steps = 5;
        for (let i = 0; i <= steps; i++) {
            // Y-Axis
            const yVal = Math.round((yMax / steps) * i);
            const yPos = yScale(yVal);

            const yText = document.createElementNS(svgNs, "text");
            yText.setAttribute("x", padding.left - 10); yText.setAttribute("y", yPos + 4);
            yText.setAttribute("text-anchor", "end");
            yText.setAttribute("fill", "#999");
            yText.setAttribute("font-size", axisLabelSize);
            yText.textContent = yVal;
            svg.appendChild(yText);

            if (i > 0) {
                const line = document.createElementNS(svgNs, "line");
                line.setAttribute("x1", padding.left); line.setAttribute("y1", yPos);
                line.setAttribute("x2", width - padding.right); line.setAttribute("y2", yPos);
                line.setAttribute("stroke", "#444");
                line.setAttribute("stroke-width", "1");
                line.setAttribute("stroke-dasharray", "4");
                line.setAttribute("opacity", "0.3");
                svg.insertBefore(line, xAxisLine);
            }

            // X-Axis
            const xVal = Math.round((xMax / steps) * i);
            const xPos = xScale(xVal);

            if (i > 0 || xMax > 0) {
                const xText = document.createElementNS(svgNs, "text");
                xText.setAttribute("x", xPos); xText.setAttribute("y", height - padding.bottom + 18);
                xText.setAttribute("text-anchor", "middle");
                xText.setAttribute("fill", "#999");
                xText.setAttribute("font-size", axisLabelSize);
                xText.textContent = xVal;
                svg.appendChild(xText);

                if (i > 0) {
                    const line = document.createElementNS(svgNs, "line");
                    line.setAttribute("x1", xPos); line.setAttribute("y1", padding.top);
                    line.setAttribute("x2", xPos); line.setAttribute("y2", height - padding.bottom);
                    line.setAttribute("stroke", "#444");
                    line.setAttribute("stroke-width", "1");
                    line.setAttribute("stroke-dasharray", "4");
                    line.setAttribute("opacity", "0.3");
                    svg.insertBefore(line, xAxisLine);
                }
            }
        }

        // Points
        filteredPlayers.forEach(p => {
            const xVal = xData.getValue(p);
            const yVal = yData.getValue(p);

            const cx = xScale(xVal);
            const cy = yScale(yVal);

            // Group for larger hit area and text
            const g = document.createElementNS(svgNs, "g");
            g.style.cursor = "pointer";
            g.style.transition = "opacity 0.2s";

            // Circle
            const circle = document.createElementNS(svgNs, "circle");
            circle.setAttribute("cx", cx);
            circle.setAttribute("cy", cy);
            circle.setAttribute("r", "7");

            // Color Coding
            const isHome = p.team === 'Heim';
            const color = isHome
                ? (spielstand.settings.teamColor || "#dc3545")
                : (spielstand.settings.teamColorGegner || "#2563eb"); // Custom Color or Default Blue for Opponent

            circle.setAttribute("fill", color);
            circle.setAttribute("stroke", "#fff");
            circle.setAttribute("stroke-width", "1.5");
            circle.setAttribute("opacity", "0.9");

            // Entry Animation
            const animate = document.createElementNS(svgNs, "animate");
            animate.setAttribute("attributeName", "r");
            animate.setAttribute("from", "0");
            animate.setAttribute("to", "7");
            animate.setAttribute("dur", "0.5s");
            animate.setAttribute("fill", "freeze");
            animate.setAttribute("calcMode", "spline");
            animate.setAttribute("keySplines", "0.25 0.1 0.25 1"); // Ease Out
            circle.appendChild(animate);

            // Pulse animation for high performers (Top right quadrant)
            // Or just give everyone a subtle pulse? No, just high performers otherwise too busy.
            if (xVal > xMax * 0.7 && yVal > yMax * 0.7) {
                const anim = document.createElementNS(svgNs, "animate");
                anim.setAttribute("attributeName", "r");
                anim.setAttribute("values", "7;10;7");
                anim.setAttribute("dur", "2s");
                anim.setAttribute("repeatCount", "indefinite");
                circle.appendChild(anim);
            }

            // Text Label
            const text = document.createElementNS(svgNs, "text");
            text.setAttribute("x", cx);
            text.setAttribute("y", cy - 12);
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("fill", "#fff");
            text.setAttribute("font-size", mainFontSize);
            text.setAttribute("font-weight", "bold");
            text.style.pointerEvents = "none";
            text.style.textShadow = "0px 1px 3px rgba(0,0,0,0.8)";
            text.textContent = `#${p.number}`;

            g.appendChild(circle);
            g.appendChild(text);

            // Interaction Handlers (Click + Hover)
            const showTooltip = (e) => {
                // Calculate position relative to wrapper
                const rect = wrapper.getBoundingClientRect();
                const relX = e.clientX - rect.left;
                const relY = e.clientY - rect.top;

                tooltip.innerHTML = `
                    <div style="font-weight: bold; margin-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 2px;">${p.name} (#${p.number})</div>
                    <div style="font-size: 0.8rem; color: ${color}; margin-bottom: 6px; font-weight: 600;">${p.team === 'Heim' ? (spielstand.settings.teamNameHeim || 'Heim') : p.team}</div>
                    <div style="color: #ccc; font-size: 0.85rem;">${xData.label}: <span style="color: #fff; font-weight: bold;">${xVal}</span></div>
                    <div style="color: #ccc; font-size: 0.85rem;">${yData.label}: <span style="color: #fff; font-weight: bold;">${yVal}</span></div>
                `;

                // Position tooltip
                tooltip.style.left = `${relX + 15}px`;
                tooltip.style.top = `${relY - 10}px`;
                tooltip.style.display = 'block';

                // Highlight circle
                circle.setAttribute("r", "10");
                circle.setAttribute("stroke-width", "2.5");
                circle.style.filter = "drop-shadow(0 0 5px " + color + ")";

                // Dim others
                svg.querySelectorAll('g').forEach(otherG => {
                    if (otherG !== g) otherG.style.opacity = "0.3";
                });
            };

            const hideTooltip = () => {
                tooltip.style.display = 'none';

                // Reset circle
                circle.setAttribute("r", "7");
                circle.setAttribute("stroke-width", "1.5");
                circle.style.filter = "none";

                // Reset opacity
                svg.querySelectorAll('g').forEach(otherG => {
                    otherG.style.opacity = "1";
                });
            };

            g.addEventListener('mouseenter', showTooltip);
            g.addEventListener('mouseleave', hideTooltip);
            g.addEventListener('click', (e) => {
                e.stopPropagation();
                showTooltip(e);
            });

            svg.appendChild(g);
        });

        svgContainer.appendChild(svg);
    };

    // Event Listeners
    xControl.select.addEventListener('change', renderChart);
    yControl.select.addEventListener('change', renderChart);
    filterSelect.addEventListener('change', renderChart);

    // Initial Render
    renderChart();

    return wrapper;
}
