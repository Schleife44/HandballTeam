import { getSeasonSummary } from './seasonStats.js';
import { renderHeatmap, setCurrentHeatmapTab, setCurrentHeatmapContext } from './heatmap.js';
import { heatmapSvg } from './dom.js';
import { spielstand } from './state.js';
import { getHistorie } from './history.js';
import { berechneStatistiken, berechneGegnerStatistiken, berechneTore } from './stats.js';
import { openPlayerHistoryHeatmap } from './historyView.js';

// Öffnet Saison-Übersicht
export function openSeasonOverview() {
    const seasonOverviewModal = document.getElementById('seasonOverviewModal');
    const settingsModal = document.getElementById('settingsModal');

    if (!seasonOverviewModal) return;

    // Schließe Settings Modal
    if (settingsModal) {
        settingsModal.classList.add('versteckt');
    }

    // Rendere Saison-Daten
    renderSeasonStats();

    // Öffne Modal
    seasonOverviewModal.classList.remove('versteckt');
}

// Schließt Saison-Übersicht
export function closeSeasonOverview() {
    const seasonOverviewModal = document.getElementById('seasonOverviewModal');
    if (seasonOverviewModal) {
        seasonOverviewModal.classList.add('versteckt');
    }
}

// Rendert Saison-Statistiken
function renderSeasonStats() {
    const summary = getSeasonSummary();
    const seasonSummary = document.getElementById('seasonSummary');
    const seasonStatsContainer = document.getElementById('seasonStatsContainer');

    if (!seasonSummary || !seasonStatsContainer) return;

    // Render Summary with Sort Controls
    seasonSummary.innerHTML = `
        <div style="display: flex; justify-content: space-around; text-align: center; margin-bottom: 15px;">
            <div>
                <strong style="font-size: 1.5rem;">${summary.totalGames}</strong><br>
                <small>Spiele</small>
            </div>
            <div>
                <strong style="font-size: 1.5rem;">${summary.totalPlayers}</strong><br>
                <small>Spieler</small>
            </div>
            <div>
                <strong style="font-size: 1.5rem;">${summary.totalTore}</strong><br>
                <small>Tore gesamt</small>
            </div>
        </div>
        <div style="display: flex; gap: 10px; justify-content: center; padding-top: 10px; border-top: 1px solid #444;">
             <span style="align-self: center; font-size: 0.9rem; color: #ccc;">Sortieren nach:</span>
             <button id="sortByNumber" class="sort-btn active" style="padding: 5px 10px; background: #666; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 0.8rem;">Nummer</button>
             <button id="sortByGoals" class="sort-btn" style="padding: 5px 10px; background: #444; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 0.8rem;">Tore</button>
        </div>
    `;

    // Render Player Cards with Headers
    const renderList = (sortMode) => {
        seasonStatsContainer.innerHTML = '';

        // Clone array to sort
        let players = [...summary.players];

        if (sortMode === 'goals') {
            players.sort((a, b) => {
                // Heim vor Gegner, dann Alphabetisch nach Teamname, dann nach Toren
                if (a.team !== b.team) {
                    if (a.team === 'Heim') return -1;
                    if (b.team === 'Heim') return 1;
                    return a.team.localeCompare(b.team);
                }
                return b.tore - a.tore || a.number - b.number;
            });
        } else {
            players.sort((a, b) => {
                // Heim vor Gegner, dann Alphabetisch nach Teamname, dann nach Nummer
                if (a.team !== b.team) {
                    if (a.team === 'Heim') return -1;
                    if (b.team === 'Heim') return 1;
                    return a.team.localeCompare(b.team);
                }
                return a.number - b.number;
            });
        }

        if (players.length === 0) {
            seasonStatsContainer.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">Keine Spieler-Daten vorhanden. Spiele zuerst einige Spiele und beende sie!</p>';
            return;
        }

        // Scatter Plot moved to Team Heatmap Modal


        let currentTeam = null;

        players.forEach((player) => {
            // Insert Team Header if team changes
            if (player.team !== currentTeam) {
                currentTeam = player.team;

                const headerText = currentTeam === 'Heim'
                    ? (spielstand.settings.teamNameHeim || 'Unser Team')
                    : currentTeam;

                const headerDiv = document.createElement('div');
                headerDiv.style.cssText = 'padding: 10px; background-color: #333; color: white; margin-bottom: 10px; margin-top: 5px; border-radius: 5px; font-weight: bold; display: flex; justify-content: space-between; align-items: center; text-transform: uppercase; letter-spacing: 1px; border-left: 5px solid #61dafb;';

                const headerTextSpan = document.createElement('span');
                headerTextSpan.textContent = headerText;
                headerDiv.appendChild(headerTextSpan);

                // Team Statistics Button
                const teamStatsBtn = document.createElement('button');
                teamStatsBtn.textContent = 'Team Grafik';
                teamStatsBtn.className = 'show-team-heatmap-btn';
                teamStatsBtn.dataset.team = currentTeam;
                teamStatsBtn.style.cssText = 'padding: 5px 12px; background-color: #61dafb; color: #333; border: none; border-radius: 5px; cursor: pointer; font-size: 0.8rem; font-weight: bold; text-transform: none;';
                headerDiv.appendChild(teamStatsBtn);

                seasonStatsContainer.appendChild(headerDiv);
            }

            // Find original index (needed for heatmap data access in showPlayerHeatmap)
            // Use precise matching including team to avoid collisions
            const originalIndex = summary.players.findIndex(p => p.number === player.number && p.name === player.name && (p.team || 'Heim') === (player.team || 'Heim'));
            const playerCard = createPlayerCard(player, originalIndex);
            seasonStatsContainer.appendChild(playerCard);
        });
    };

    // Initial Render (Number sort is default)
    renderList('number');

    // Add Event Listeners for Sort Buttons
    const btnNumber = seasonSummary.querySelector('#sortByNumber');
    const btnGoals = seasonSummary.querySelector('#sortByGoals');

    if (btnNumber && btnGoals) {
        btnNumber.addEventListener('click', () => {
            btnNumber.style.background = '#666';
            btnGoals.style.background = '#444';
            renderList('number');
        });

        btnGoals.addEventListener('click', () => {
            btnNumber.style.background = '#444';
            btnGoals.style.background = '#666';
            renderList('goals');
        });
    }
}

// Erstellt Liste der Spiele für einen Spieler
function renderGameHistoryList(player) {
    const historyGames = getHistorie().sort((a, b) => new Date(b.date) - new Date(a.date));

    const container = document.createElement('div');
    container.style.marginTop = '20px';
    container.innerHTML = '<h4 style="margin-bottom: 10px; border-bottom: 1px solid #555; padding-bottom: 5px;">Spiele-Historie</h4>';

    const table = document.createElement('table');
    table.style.cssText = 'width: 100%; border-collapse: collapse; font-size: 0.9rem;';
    table.innerHTML = `
        <thead>
            <tr style="background-color: #444;">
                <th style="padding: 5px; text-align: left;">Datum</th>
                <th style="padding: 5px; text-align: left;">Gegner/Spiel</th>
                <th style="padding: 5px; text-align: center;">Tore</th>
                <th style="padding: 5px; text-align: center;">Quote</th>
                <th style="padding: 5px; text-align: center;">Grafik</th>
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
            if (hasField) btnHtml += `<button class="game-heatmap-btn" data-mode="field" style="cursor:pointer; background:none; border:none; font-size:1.2rem;" title="Wurfbild">🎯</button>`;
            if (has7m) btnHtml += `<button class="game-heatmap-btn" data-mode="7m" style="cursor:pointer; background:none; border:none; font-size:0.8rem; margin-left:5px;" title="7m Statistik">7m</button>`;

            tr.innerHTML = `
                <td style="padding: 5px;">${dateStr}</td>
                <td style="padding: 5px;">${matchTitle}</td>
                <td style="padding: 5px; text-align: center;">${goals}</td>
                <td style="padding: 5px; text-align: center;">${quote}</td>
                <td style="padding: 5px; text-align: center;">${btnHtml}</td>
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
    card.className = 'season-player-card';
    card.style.cssText = 'border: 1px solid #ddd; border-radius: 5px; margin-bottom: 10px; overflow: hidden; background-color: var(--bg-main);';

    const displayName = player.name ? `#${player.number} - ${player.name}` : `#${player.number}`;

    // Header
    const header = document.createElement('div');
    header.style.cssText = 'padding: 15px; background-color: var(--bg-secondary); cursor: pointer; display: flex; justify-content: space-between; align-items: center;';

    // Calculate Feldtore for header display
    const headerFeldtore = player.tore - (player.siebenMeterTore || 0);

    header.innerHTML = `
        <div>
            <strong style="font-size: 1.1rem;">${displayName}</strong><br>
            <small>${player.totalGames} Spiele · Tore: ${player.tore}, Feldtore: ${headerFeldtore}, 7m: ${player.siebenMeterTore || 0}/${player.siebenMeterVersuche || 0} · Quote: ${player.wurfQuote}</small>
        </div>
        <span class="expand-icon" style="font-size: 1.5rem;">▼</span>
    `;

    // Details (initially hidden)
    const details = document.createElement('div');
    details.className = 'player-details versteckt';
    details.style.cssText = 'padding: 15px;';

    // Stats Table - Calculate Feldtore (field goals = tore - 7m goals)
    const feldtore = player.tore - (player.siebenMeterTore || 0);

    const statsTable = `
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
            <thead>
                <tr style="border-bottom: 2px solid #ddd;">
                    <th style="padding: 8px; text-align: left;">Tore</th>
                    <th style="padding: 8px; text-align: left;">Feldtore</th>
                    <th style="padding: 8px; text-align: left;">7m</th>
                    <th style="padding: 8px; text-align: left;">Fehlwurf</th>
                    <th style="padding: 8px; text-align: left;">Quote</th>
                    <th style="padding: 8px; text-align: left;">Gut</th>
                    <th style="padding: 8px; text-align: left;">TF</th>
                    <th style="padding: 8px; text-align: left;">Gelb</th>
                    <th style="padding: 8px; text-align: left;">2'</th>
                    <th style="padding: 8px; text-align: left;">Rot</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="padding: 8px;">${player.tore}</td>
                    <td style="padding: 8px;">${feldtore}</td>
                    <td style="padding: 8px;">${player.siebenMeterTore}/${player.siebenMeterVersuche}</td>
                    <td style="padding: 8px;">${player.fehlwurf}</td>
                    <td style="padding: 8px;">${player.wurfQuote}</td>
                    <td style="padding: 8px;">${player.guteAktion}</td>
                    <td style="padding: 8px;">${player.techFehler}</td>
                    <td style="padding: 8px;">${player.gelb}</td>
                    <td style="padding: 8px;">${player.zweiMinuten}</td>
                    <td style="padding: 8px;">${player.rot}</td>
                </tr>
            </tbody>
        </table>
    `;

    // Heatmap Buttons - Check for field throws and 7m throws separately
    const fieldThrows = player.seasonLog ? player.seasonLog.filter(e => !e.is7m) : [];
    const sevenMThrows = player.seasonLog ? player.seasonLog.filter(e => e.is7m) : [];

    const hasFieldData = fieldThrows.length > 0;
    const has7mData = sevenMThrows.length > 0;

    let heatmapButtonsHtml = '<div style="display: flex; gap: 10px; margin-top: 10px;">';

    if (hasFieldData) {
        heatmapButtonsHtml += `<button class="show-heatmap-btn" data-player-index="${index}" data-mode="field" style="flex: 1; padding: 10px; background-color: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">Grafik</button>`;
    }

    if (has7mData) {
        heatmapButtonsHtml += `<button class="show-heatmap-btn" data-player-index="${index}" data-mode="7m" style="flex: 1; padding: 10px; background-color: #ff9800; color: white; border: none; border-radius: 5px; cursor: pointer;">7m Grafik</button>`;
    }

    if (!hasFieldData && !has7mData) {
        heatmapButtonsHtml += '<small style="color:#999; width:100%; text-align:center;">Keine Grafik-Daten</small>';
    }

    heatmapButtonsHtml += '</div>';

    details.innerHTML = statsTable + heatmapButtonsHtml;

    // Add Game History List
    const historyList = renderGameHistoryList(player);
    if (historyList) {
        details.appendChild(historyList);
    }

    // Toggle functionality
    header.addEventListener('click', () => {
        details.classList.toggle('versteckt');
        const icon = header.querySelector('.expand-icon');
        icon.textContent = details.classList.contains('versteckt') ? '▼' : '▲';
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

    // Filter log entries based on mode
    let logEntries = player.seasonLog || [];
    if (mode === '7m') {
        logEntries = logEntries.filter(e => e.is7m);
    } else {
        logEntries = logEntries.filter(e => !e.is7m);
    }

    const modeLabel = mode === '7m' ? '7m Grafik' : 'Grafik';

    // Öffne Heatmap Modal
    const heatmapModal = document.getElementById('heatmapModal');
    if (heatmapModal) {
        heatmapModal.classList.remove('versteckt');

        // Remove existing title if any
        const existingTitle = heatmapModal.querySelector('h3');
        if (existingTitle && existingTitle.id !== 'wurfbildTitel') existingTitle.remove();

        // Hide default title
        const defaultTitle = document.getElementById('wurfbildTitel');
        if (defaultTitle) defaultTitle.style.display = 'none';

        // Set Custom Title
        const customTitle = document.createElement('h3');
        customTitle.textContent = `${modeLabel} - ${displayName} (Saison)`;
        customTitle.style.cssText = 'text-align: center; margin-bottom: 10px; color: var(--text-main);';
        customTitle.className = 'season-heatmap-title';

        // Insert custom title
        const content = heatmapModal.querySelector('.modal-content');
        if (content) content.insertBefore(customTitle, content.firstChild);

        // Add close handler to restore default title and tabs
        const cleanup = () => {
            if (defaultTitle) defaultTitle.style.display = 'block';
            const ct = heatmapModal.querySelector('.season-heatmap-title');
            if (ct) ct.remove();

            // Restore tabs visibility
            const tabsContainer = heatmapModal.querySelector('.heatmap-tabs');
            if (tabsContainer) tabsContainer.style.display = '';

            // Restore filter visibility
            const filterContainer = heatmapModal.querySelector('.heatmap-filter');
            if (filterContainer) {
                filterContainer.style.display = '';
                filterContainer.classList.remove('versteckt');

                // Restore headers/labels
                const labels = filterContainer.querySelectorAll('label');
                labels.forEach(l => l.style.display = '');
                const separator = filterContainer.querySelector('span:not([id])');
                if (separator) separator.style.display = '';
            }
        };

        const closeButton = document.getElementById('closeHeatmapModal');
        if (closeButton) {
            closeButton.addEventListener('click', cleanup, { once: true });
        }

        // Hide Wurfposition and Kombiniert tabs for 7m mode
        if (mode === '7m') {
            // Hide entire heatmap-tabs container for 7m mode (only show goal heatmap)
            const tabsContainer = heatmapModal.querySelector('.heatmap-tabs');
            if (tabsContainer) tabsContainer.style.display = 'none';

            // Also hide filter controls (not needed for 7m)
            const filterContainer = heatmapModal.querySelector('.heatmap-filter');
            if (filterContainer) filterContainer.style.display = 'none';
        }

        // Determine filter logic
        const isOpponentPlayer = logEntries.length > 0 && logEntries[0].isOpponent;

        const filterOverride = {
            team: isOpponentPlayer ? 'gegner' : 'heim',
            player: player.number
        };

        // Ensure opponent entries have gegnerNummer set just in case heatmap.js needs it
        if (isOpponentPlayer) {
            logEntries.forEach(e => e.gegnerNummer = player.number);
        }

        if (heatmapSvg) {
            // Set context for tab switching
            setCurrentHeatmapContext({
                log: logEntries,
                filter: filterOverride
            });

            renderHeatmap(heatmapSvg, logEntries, false, filterOverride);
        }
    }
}

// Zeigt kombinierte Heatmap für alle Spieler eines Teams
// Zeigt kombinierte Heatmap für alle Spieler eines Teams
export function showTeamHeatmap(teamName) {
    const summary = getSeasonSummary();

    // Finde alle Spieler des Teams
    const teamPlayers = summary.players.filter(p => p.team === teamName);

    if (teamPlayers.length === 0) return;

    // Aggregiere alle seasonLog Einträge (nur Feldwürfe, keine 7m)
    const allLogEntries = [];
    teamPlayers.forEach(player => {
        if (player.seasonLog) {
            const fieldThrows = player.seasonLog.filter(e => !e.is7m);
            allLogEntries.push(...fieldThrows);
        }
    });

    // Default to 'tor' (Wurfbild)
    setCurrentHeatmapTab('tor');

    const displayName = teamName === 'Heim'
        ? (spielstand.settings.teamNameHeim || 'Unser Team')
        : teamName;

    // Öffne Heatmap Modal
    const heatmapModal = document.getElementById('heatmapModal');
    if (heatmapModal) {
        heatmapModal.classList.remove('versteckt');

        // Remove existing title if any
        const existingTitle = heatmapModal.querySelector('h3');
        if (existingTitle && existingTitle.id !== 'wurfbildTitel') existingTitle.remove();

        // Hide default title
        const defaultTitle = document.getElementById('wurfbildTitel');
        if (defaultTitle) defaultTitle.style.display = 'none';

        // Set Custom Title
        const customTitle = document.createElement('h3');
        customTitle.textContent = `Team Grafik - ${displayName} (${teamPlayers.length} Spieler)`;
        customTitle.style.cssText = 'text-align: center; margin-bottom: 10px; color: var(--text-main);';
        customTitle.className = 'season-heatmap-title';

        // Insert custom title
        const content = heatmapModal.querySelector('.modal-content');
        if (content) content.insertBefore(customTitle, content.firstChild);

        // --- NEW: Add Diagram Tab ---
        const tabsContainer = heatmapModal.querySelector('.heatmap-tabs');
        let diagramTab = heatmapModal.querySelector('.heatmap-tab[data-tab="diagram"]');
        if (!diagramTab && tabsContainer) {
            diagramTab = document.createElement('button');
            diagramTab.className = 'heatmap-tab';
            diagramTab.dataset.tab = 'diagram';
            diagramTab.textContent = 'Diagramm';
            tabsContainer.appendChild(diagramTab);
        }

        // Render Scatter Plot inside Modal (Initially Hidden)
        const scatterPlot = renderTeamScatterPlot(teamPlayers);
        if (scatterPlot) {
            scatterPlot.classList.add('modal-scatter-plot');
            scatterPlot.classList.add('versteckt'); // Start hidden
            content.appendChild(scatterPlot);
        }

        // Tab Switching Logic (UI Toggling)
        // Note: Diagram button must be included, so we query after appending
        const allTabs = heatmapModal.querySelectorAll('.heatmap-tab');

        // Reset Tabs to Tor initially
        allTabs.forEach(t => t.classList.remove('active'));
        const torTab = heatmapModal.querySelector('[data-tab="tor"]');
        if (torTab) torTab.classList.add('active');

        allTabs.forEach(t => {
            t.onclick = () => {
                const mode = t.dataset.tab;
                const scatter = heatmapModal.querySelector('.modal-scatter-plot');
                const heatContainer = heatmapModal.querySelector('#heatmapContainer');
                const filterContainer = heatmapModal.querySelector('.heatmap-filter');

                if (mode === 'diagram') {
                    // Show Diagram, Hide Heatmap
                    if (heatContainer) heatContainer.classList.add('versteckt');
                    if (filterContainer) filterContainer.classList.add('versteckt');
                    if (scatter) scatter.classList.remove('versteckt');

                    // Manual active state for Diagram
                    allTabs.forEach(b => b.classList.remove('active'));
                    t.classList.add('active');
                } else {
                    // Show Heatmap, Hide Diagram
                    if (heatContainer) heatContainer.classList.remove('versteckt');
                    if (filterContainer) filterContainer.classList.remove('versteckt');
                    if (scatter) scatter.classList.add('versteckt');
                    // Standard listener (in eventListeners.js) handles 'tor'/'feld' logic & active state
                }
            };
        });

        // Add close handler to restore default state
        const cleanup = () => {
            if (defaultTitle) defaultTitle.style.display = 'block';
            const ct = heatmapModal.querySelector('.season-heatmap-title');
            if (ct) ct.remove();

            // Remove Scatter Plot & Tab
            if (scatterPlot) scatterPlot.remove();
            if (diagramTab) diagramTab.remove();

            // Restore visibility
            const heatContainer = heatmapModal.querySelector('#heatmapContainer');
            if (heatContainer) heatContainer.classList.remove('versteckt');

            const filterContainer = heatmapModal.querySelector('.heatmap-filter');
            if (filterContainer) {
                filterContainer.classList.remove('versteckt');
                filterContainer.style.display = '';
                // Restore headers/labels
                const labels = filterContainer.querySelectorAll('label');
                labels.forEach(l => l.style.display = '');
                const separator = filterContainer.querySelector('span:not([id])');
                if (separator) separator.style.display = '';
            }

            // Reset onclicks
            allTabs.forEach(t => t.onclick = null);
        };

        const closeButton = document.getElementById('closeHeatmapModal');
        if (closeButton) {
            closeButton.addEventListener('click', cleanup, { once: true });
        }

        // Determine filter logic (team-wide, no specific player)
        const isOpponentTeam = teamName !== 'Heim';
        const filterOverride = {
            team: isOpponentTeam ? 'gegner' : 'heim',
            player: null // No specific player filter
        };

        if (heatmapSvg) {
            // Set context for tab switching (Standard Logic)
            setCurrentHeatmapContext({
                log: allLogEntries,
                filter: filterOverride
            });

            renderHeatmap(heatmapSvg, allLogEntries, false, filterOverride);
        }
    }
}

// Generiert SVG Scatter Plot für Team-Performance
function renderTeamScatterPlot(players) {
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

    // Create Wrapper
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position: relative; margin-bottom: 20px; padding: 15px; background: var(--bg-secondary); border-radius: 8px; border: 1px solid #444; margin-top: 20px;';

    const title = document.createElement('h4');
    title.textContent = "Team-Vergleich (Scatter Plot)";
    title.style.cssText = "margin: 0 0 15px 0; text-align: center; color: var(--text-main); border-bottom: 1px solid #555; padding-bottom: 5px;";
    wrapper.appendChild(title);

    // Controls
    const controlsDiv = document.createElement('div');
    controlsDiv.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-wrap: wrap; gap: 10px;';

    const createSelect = (label, id, defaultVal) => {
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.gap = '5px';

        const lbl = document.createElement('label');
        lbl.textContent = label;
        lbl.style.fontSize = '0.9rem';
        lbl.style.color = '#ccc';

        const select = document.createElement('select');
        select.id = id;
        select.style.cssText = 'background: #333; color: white; border: 1px solid #555; padding: 3px; border-radius: 4px;';

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

    // Toggle Button


    controlsDiv.appendChild(xControl.container);
    controlsDiv.appendChild(yControl.container);

    wrapper.appendChild(controlsDiv);

    const svgContainer = document.createElement('div');
    svgContainer.className = 'svg-container';
    wrapper.appendChild(svgContainer);

    // Custom Tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'scatter-tooltip';
    tooltip.style.cssText = 'position: absolute; display: none; background: rgba(0, 0, 0, 0.9); color: #fff; padding: 8px 12px; border-radius: 4px; pointer-events: none; font-size: 0.85rem; z-index: 100; border: 1px solid #666; white-space: nowrap; box-shadow: 0 4px 6px rgba(0,0,0,0.3);';
    wrapper.appendChild(tooltip);

    // Toggle Logic


    // Render Chart Function
    const renderChart = () => {
        svgContainer.innerHTML = '';

        const xKey = xControl.select.value;
        const yKey = yControl.select.value;
        const xData = metrics[xKey];
        const yData = metrics[yKey];

        const width = 600;
        const height = 300;
        const padding = { top: 20, right: 30, bottom: 40, left: 50 };

        // Determine Max Values
        const xValues = activePlayers.map(p => xData.getValue(p));
        const yValues = activePlayers.map(p => yData.getValue(p));

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

        const svgNs = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNs, "svg");
        svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
        svg.style.width = "100%";
        svg.style.height = "auto";
        svg.style.overflow = "visible";
        svg.style.fontFamily = "sans-serif";

        // Scales
        // Scales (Mapped to Range)
        const xScale = (val) => padding.left + ((val - xMin) / (xMax - xMin)) * (width - padding.left - padding.right);
        const yScale = (val) => height - padding.bottom - ((val - yMin) / (yMax - yMin)) * (height - padding.top - padding.bottom);

        // Draw Zero Lines (Origins) if within range
        if (xMin < 0 && xMax > 0) {
            const zeroX = xScale(0);
            const line = document.createElementNS(svgNs, "line");
            line.setAttribute("x1", zeroX); line.setAttribute("y1", padding.top);
            line.setAttribute("x2", zeroX); line.setAttribute("y2", height - padding.bottom);
            line.setAttribute("stroke", "#666");
            line.setAttribute("stroke-width", "1");
            svg.appendChild(line);
        }

        if (yMin < 0 && yMax > 0) {
            const zeroY = yScale(0);
            const line = document.createElementNS(svgNs, "line");
            line.setAttribute("x1", padding.left); line.setAttribute("y1", zeroY);
            line.setAttribute("x2", width - padding.right); line.setAttribute("y2", zeroY);
            line.setAttribute("stroke", "#666");
            line.setAttribute("stroke-width", "1");
            svg.appendChild(line);
        }

        // Axes box
        const xAxisLine = document.createElementNS(svgNs, "line");
        xAxisLine.setAttribute("x1", padding.left); xAxisLine.setAttribute("y1", height - padding.bottom);
        xAxisLine.setAttribute("x2", width - padding.right); xAxisLine.setAttribute("y2", height - padding.bottom);
        xAxisLine.setAttribute("stroke", "#888");
        xAxisLine.setAttribute("stroke-width", "2");
        svg.appendChild(xAxisLine);

        const yAxisLine = document.createElementNS(svgNs, "line");
        yAxisLine.setAttribute("x1", padding.left); yAxisLine.setAttribute("y1", padding.top);
        yAxisLine.setAttribute("x2", padding.left); yAxisLine.setAttribute("y2", height - padding.bottom);
        yAxisLine.setAttribute("stroke", "#888");
        yAxisLine.setAttribute("stroke-width", "2");
        svg.appendChild(yAxisLine);

        // Labels
        const xLabel = document.createElementNS(svgNs, "text");
        xLabel.setAttribute("x", width / 2); xLabel.setAttribute("y", height - 5);
        xLabel.setAttribute("text-anchor", "middle");
        xLabel.setAttribute("fill", "#ccc");
        xLabel.setAttribute("font-size", "14"); // Increased size
        xLabel.textContent = xData.label;
        svg.appendChild(xLabel);

        const yLabel = document.createElementNS(svgNs, "text");
        yLabel.setAttribute("x", 15); yLabel.setAttribute("y", height / 2);
        yLabel.setAttribute("text-anchor", "middle");
        yLabel.setAttribute("fill", "#ccc");
        yLabel.setAttribute("font-size", "14"); // Increased size
        yLabel.setAttribute("transform", `rotate(-90, 15, ${height / 2})`);
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
            avgLineX.setAttribute("opacity", "0.6");
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
            avgLineY.setAttribute("opacity", "0.6");
            svg.appendChild(avgLineY);
        }

        // Grid & Markers (Simple 5 steps)
        for (let i = 0; i <= 5; i++) {
            // Y-Axis
            const yVal = Math.round((yMax / 5) * i);
            const yPos = yScale(yVal);

            const yText = document.createElementNS(svgNs, "text");
            yText.setAttribute("x", padding.left - 10); yText.setAttribute("y", yPos + 4);
            yText.setAttribute("text-anchor", "end");
            yText.setAttribute("fill", "#666");
            yText.setAttribute("font-size", "10");
            yText.textContent = yVal;
            svg.appendChild(yText);

            if (i > 0) {
                const line = document.createElementNS(svgNs, "line");
                line.setAttribute("x1", padding.left); line.setAttribute("y1", yPos);
                line.setAttribute("x2", width - padding.right); line.setAttribute("y2", yPos);
                line.setAttribute("stroke", "#333");
                line.setAttribute("stroke-dasharray", "4");
                svg.insertBefore(line, xAxisLine);
            }

            // X-Axis
            const xVal = Math.round((xMax / 5) * i);
            const xPos = xScale(xVal);

            if (i > 0 || xMax > 0) {
                const xText = document.createElementNS(svgNs, "text");
                xText.setAttribute("x", xPos); xText.setAttribute("y", height - padding.bottom + 15);
                xText.setAttribute("text-anchor", "middle");
                xText.setAttribute("fill", "#666");
                xText.setAttribute("font-size", "10");
                xText.textContent = xVal;
                svg.appendChild(xText);

                if (i > 0) {
                    const line = document.createElementNS(svgNs, "line");
                    line.setAttribute("x1", xPos); line.setAttribute("y1", padding.top);
                    line.setAttribute("x2", xPos); line.setAttribute("y2", height - padding.bottom);
                    line.setAttribute("stroke", "#333");
                    line.setAttribute("stroke-dasharray", "4");
                    line.setAttribute("opacity", "0.5");
                    svg.insertBefore(line, xAxisLine);
                }
            }
        }

        // Points
        activePlayers.forEach(p => {
            const xVal = xData.getValue(p);
            const yVal = yData.getValue(p);

            const cx = xScale(xVal);
            const cy = yScale(yVal);

            // Group for larger hit area and text
            const g = document.createElementNS(svgNs, "g");
            g.style.cursor = "pointer";

            // Circle
            const circle = document.createElementNS(svgNs, "circle");
            circle.setAttribute("cx", cx);
            circle.setAttribute("cy", cy);
            circle.setAttribute("r", "6");

            // Uniform color for all points
            const color = "#61dafb"; // Theme cyan
            circle.setAttribute("fill", color);
            circle.setAttribute("stroke", "#fff");
            circle.setAttribute("stroke-width", "1");

            // Pulse animation for high performers (Top right quadrant)
            if (xVal > xMax * 0.7 && yVal > yMax * 0.7) {
                const anim = document.createElementNS(svgNs, "animate");
                anim.setAttribute("attributeName", "r");
                anim.setAttribute("values", "6;9;6");
                anim.setAttribute("dur", "2s");
                anim.setAttribute("repeatCount", "indefinite");
                circle.appendChild(anim);
            }

            // Text Label
            const text = document.createElementNS(svgNs, "text");
            text.setAttribute("x", cx);
            text.setAttribute("y", cy - 10);
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("fill", "#fff");
            text.setAttribute("font-size", "10");
            text.style.pointerEvents = "none";
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
                    <div style="font-weight: bold; margin-bottom: 2px;">${p.name} (#${p.number})</div>
                    <div style="color: #ccc;">${xData.label}: <span style="color: #fff;">${xVal}</span></div>
                    <div style="color: #ccc;">${yData.label}: <span style="color: #fff;">${yVal}</span></div>
                `;

                // Position tooltip
                tooltip.style.left = `${relX + 10}px`;
                tooltip.style.top = `${relY - 10}px`;
                tooltip.style.display = 'block';

                // Highlight circle
                circle.setAttribute("r", "8");
                circle.setAttribute("fill", "#fff");
                circle.setAttribute("stroke", color);
                circle.setAttribute("stroke-width", "2");
            };

            const hideTooltip = () => {
                tooltip.style.display = 'none';

                // Reset circle
                circle.setAttribute("r", "6");
                circle.setAttribute("fill", color);
                circle.setAttribute("stroke", "#fff");
                circle.setAttribute("stroke-width", "1");

                // Re-add pulse if needed (re-rendering handles it, but simpler to just let animation continue? 
                // Setting 'r' attribute manually overrides SMIL animation? 
                // If animate tag is present, it might conflict. 
                // But for interaction feedback, it's fine.
            };

            g.addEventListener('mouseenter', showTooltip);
            g.addEventListener('mouseleave', hideTooltip);
            g.addEventListener('click', (e) => {
                e.stopPropagation();
                showTooltip(e); // Ensure it shows on click (Touch support)
            });

            svg.appendChild(g);
        });

        svgContainer.appendChild(svg);
    };

    // Event Listeners
    xControl.select.addEventListener('change', renderChart);
    yControl.select.addEventListener('change', renderChart);

    // Initial Render
    renderChart();

    return wrapper;
}
