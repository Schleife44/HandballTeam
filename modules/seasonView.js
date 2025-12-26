import { getSeasonSummary } from './seasonStats.js';
import { renderHeatmap, setCurrentHeatmapTab, setCurrentHeatmapContext } from './heatmap.js';
import { heatmapSvg } from './dom.js';
import { spielstand } from './state.js';

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

        let currentTeam = null;

        players.forEach((player) => {
            // Insert Team Header if team changes
            if (player.team !== currentTeam) {
                currentTeam = player.team;

                const headerText = currentTeam === 'Heim'
                    ? (spielstand.settings.teamNameHeim || 'Unser Team')
                    : currentTeam;

                const headerDiv = document.createElement('div');
                headerDiv.style.cssText = 'padding: 10px; background-color: #333; color: white; margin-bottom: 10px; margin-top: 5px; border-radius: 5px; font-weight: bold; text-align: center; text-transform: uppercase; letter-spacing: 1px; border-left: 5px solid #61dafb;';
                headerDiv.textContent = headerText;
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
            if (filterContainer) filterContainer.style.display = '';
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
