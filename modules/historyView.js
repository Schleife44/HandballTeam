// modules/historyView.js
// Game History View and related functions

import { spielstand, speichereSpielstand } from './state.js';
import {
    rosterBereich, historieBereich, historieDetailBereich,
    historieListe, histDetailTeams, histDetailScore, histDetailDate,
    histStatsBody, histStatsGegnerBody, heatmapSvg,
    histHeatmapSvg, histContentHeatmap, histSubTabTor, histSubTabFeld, histSubTabKombi,
    histHeatmapToreFilter, histHeatmapMissedFilter, histHeatmap7mFilter
} from './dom.js';
import { berechneStatistiken, berechneGegnerStatistiken, berechneTore } from './stats.js';
import { speichereSpielInHistorie, getHistorie, loescheSpielAusHistorie } from './history.js';
import { renderHeatmap, setCurrentHeatmapContext, setCurrentHeatmapTab, currentHeatmapTab } from './heatmap.js';
import { customConfirm, customAlert } from './customDialog.js';
import { exportiereHistorieAlsPdf } from './export.js';

// --- Export einzelnes Spiel ---
export function exportiereEinzelnesSpiel(game) {
    const blob = new Blob([JSON.stringify(game, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const dateStr = new Date(game.date).toISOString().slice(0, 10);
    const filename = `spiel_${game.teams.heim}_vs_${game.teams.gegner}_${dateStr}.json`;
    a.download = filename.replace(/\s+/g, '_');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// --- Handle Game End ---
export async function handleSpielBeenden() {
    const confirmed = await customConfirm(
        "Spiel wirklich beenden und speichern? Dies archiviert das Spiel und kehrt zum Startbildschirm zurück.",
        "Spiel beenden?"
    );

    if (confirmed) {
        const gameData = {
            score: { ...spielstand.score },
            teams: { heim: spielstand.settings.teamNameHeim, gegner: spielstand.settings.teamNameGegner },
            gameLog: [...spielstand.gameLog],
            roster: [...spielstand.roster],
        };

        speichereSpielInHistorie(gameData);

        await customAlert("Spiel gespeichert!", "Erfolg ✓");

        spielstand.gameLog = [];
        spielstand.score.heim = 0;
        spielstand.score.gegner = 0;
        spielstand.timer.verstricheneSekundenBisher = 0;
        spielstand.timer.gamePhase = 1;
        spielstand.uiState = 'roster';
        spielstand.activeSuspensions = [];
        spielstand.timer.history = [];

        speichereSpielstand();
        location.reload();
    }
}

// --- Render History List ---
export function renderHistoryList() {
    historieListe.innerHTML = '';

    // Ensure grid container class
    historieListe.className = 'history-grid';
    historieListe.style.display = 'grid'; // Force grid if class not applied instantly via CSS transition

    const games = getHistorie();

    if (games.length === 0) {
        historieListe.style.display = 'block'; // Fallback for message
        historieListe.innerHTML = '<p style="text-align:center; padding:20px; color: var(--text-muted);">Keine gespeicherten Spiele vorhanden.</p>';
        return;
    }

    games.forEach(game => {
        const div = document.createElement('div');
        div.className = 'history-card-modern';
        div.setAttribute('role', 'button');
        div.setAttribute('tabindex', '0');

        const heimScore = game.score.heim;
        const gastScore = game.score.gegner;
        let statusColor = 'var(--text-muted)';
        let statusText = 'Unentschieden';

        if (heimScore > gastScore) {
            statusColor = '#22c55e'; // Green
            statusText = 'Sieg';
        } else if (heimScore < gastScore) {
            statusColor = '#ef4444'; // Red
            statusText = 'Niederlage';
        }

        const date = new Date(game.date).toLocaleDateString();

        div.innerHTML = `
            <div class="history-card-header" style="pointer-events: none;">
                <span style="font-weight: 600; color: ${statusColor}">${statusText}</span>
                <span>${date}</span>
            </div>
            
            <div class="history-card-body" style="pointer-events: none;">
                <div class="history-card-teams">
                    ${game.teams.heim} <span style="font-weight: 400; opacity: 0.6;">vs</span> ${game.teams.gegner}
                </div>
                <div class="history-card-score">
                    ${heimScore} : ${gastScore}
                </div>
            </div>

            <div style="display: flex; gap: 8px; margin-top: 4px;">
                <button class="shadcn-btn-outline shadcn-btn-sm export-pdf-btn" data-id="${game.id}" style="padding: 6px 10px; flex: 1;" title="PDF">
                    PDF
                </button>
                <button class="shadcn-btn-outline shadcn-btn-sm export-history-btn" data-id="${game.id}" style="padding: 6px 10px; flex: 1;" title="Export">
                    JSON
                </button>
                <button class="shadcn-btn-outline shadcn-btn-sm delete-history-btn" data-id="${game.id}" style="padding: 6px 10px; border-color: rgba(239, 68, 68, 0.2); color: #ef4444;" title="Löschen">
                    Löschen
                </button>
            </div>
        `;

        const triggerAction = (e) => {
            if (e.target.closest('button')) return;
            openHistoryDetail(game);
        };

        div.addEventListener('click', triggerAction);
        div.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                triggerAction(e);
            }
        });

        div.querySelector('.export-pdf-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            exportiereHistorieAlsPdf(game);
        });

        div.querySelector('.export-history-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            exportiereEinzelnesSpiel(game);
        });

        div.querySelector('.delete-history-btn').addEventListener('click', async (e) => {
            e.stopPropagation();
            const confirmed = await customConfirm("Spiel wirklich aus der Historie löschen?", "Löschen?");
            if (confirmed) {
                loescheSpielAusHistorie(game.id);
                renderHistoryList();
            }
        });

        historieListe.appendChild(div);
    });
}

// --- Render Home Stats in History ---
export function renderHomeStatsInHistory(tbody, statsData, gameLog, isLive = false) {
    tbody.innerHTML = '';
    const toreMap = berechneTore(gameLog);

    statsData.forEach(stats => {
        const fieldGoals = toreMap.get(stats.number) || 0;
        const sevenMGoals = stats.siebenMeterTore || 0;
        const goals = fieldGoals + sevenMGoals; // Total Goals
        const feldtore = fieldGoals;

        // Quote = Field Goals / Field Attempts (Field Goals + Field Misses)
        const fieldAttempts = fieldGoals + stats.fehlwurf;
        const quote = fieldAttempts > 0 ? Math.round((fieldGoals / fieldAttempts) * 100) + '%' : '-';
        const sevenMDisplay = (stats.siebenMeterVersuche > 0) ? `${stats.siebenMeterTore}/${stats.siebenMeterVersuche}` : "0/0";

        // Check for heatmap data
        // Filter log for this player
        const playerLog = gameLog.filter(e => (e.playerId === stats.number || e.number === stats.number) && !e.action.startsWith('Gegner'));
        const hasField = playerLog.some(e => !e.action.includes('7m'));
        const has7m = playerLog.some(e => e.action.includes('7m'));

        let buttonsHtml = '';
        if (hasField) buttonsHtml += `<button class="heatmap-btn shadcn-btn-secondary" data-mode="field" style="padding: 0 8px; height: 28px; display:inline-flex; align-items:center; vertical-align:middle; font-size: 0.75rem;"><i data-lucide="crosshair" style="width: 14px; height: 14px;"></i></button>`;
        if (has7m) buttonsHtml += `<button class="heatmap-btn shadcn-btn-outline" data-mode="7m" style="padding: 0 8px; height: 28px; font-size: 0.75rem; margin-left: 4px; border-color: #f59e0b; color: #f59e0b; display:inline-flex; align-items:center; vertical-align:middle;">7m</button>`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${stats.number} ${stats.name}</td>
            <td>${goals}</td>
            <td>${feldtore}</td>
            <td>${sevenMDisplay}</td>
            <td>${stats.fehlwurf}</td>
            <td>${quote}</td>
            <td>${stats.guteAktion}</td>
            <td>${stats.techFehler}</td>
            <td>${stats.gelb}</td>
            <td>${stats.zweiMinuten}</td>
            <td>${stats.rot}</td>
            <td>${buttonsHtml}</td>
        `;

        const btns = tr.querySelectorAll('.heatmap-btn');
        btns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const mode = btn.dataset.mode;
                if (isLive) {
                    // Navigate to Live Heatmap
                    const navItem = document.querySelector('.nav-item[data-view="heatmap"]');
                    if (navItem) navItem.click();
                } else {
                    openPlayerHistoryHeatmap(gameLog, stats.number, 'heim', stats.name, mode);
                }
            });
        });

        tbody.appendChild(tr);
    });
    if (typeof lucide !== 'undefined') lucide.createIcons({ root: tbody });
}

// --- Render Opponent Stats in History ---
export function renderOpponentStatsInHistory(tbody, statsData, gameLog, isLive = false) {
    tbody.innerHTML = '';
    const toreMap = berechneTore(gameLog); // Needed if not already in statsData

    statsData.forEach(stats => {
        const goals = stats.tore || 0;
        const sevenMGoals = stats.siebenMeterTore || 0;
        const feldtore = goals - sevenMGoals;

        const fieldAttempts = feldtore + stats.fehlwurf;
        const quote = fieldAttempts > 0 ? Math.round((feldtore / fieldAttempts) * 100) + '%' : '-';
        const sevenMDisplay = (stats.siebenMeterVersuche > 0) ? `${stats.siebenMeterTore}/${stats.siebenMeterVersuche}` : "0/0";

        // Check for heatmap data
        const has7m = stats.siebenMeterVersuche > 0;
        const hasField = (goals + stats.fehlwurf) > stats.siebenMeterVersuche;

        let buttonsHtml = '';
        if (hasField || goals > 0) buttonsHtml += `<button class="heatmap-btn shadcn-btn-secondary" data-mode="field" style="padding: 0 8px; height: 28px; display:inline-flex; align-items:center; vertical-align:middle; font-size: 0.75rem;"><i data-lucide="crosshair" style="width: 14px; height: 14px;"></i></button>`;
        if (has7m) buttonsHtml += `<button class="heatmap-btn shadcn-btn-outline" data-mode="7m" style="padding: 0 8px; height: 28px; font-size: 0.75rem; margin-left: 4px; border-color: #f59e0b; color: #f59e0b; display:inline-flex; align-items:center; vertical-align:middle;">7m</button>`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${stats.name}</td>
            <td>${goals}</td>
            <td>${feldtore}</td>
            <td>${sevenMDisplay}</td>
            <td>${stats.fehlwurf}</td>
            <td>${quote}</td>
            <td>${stats.guteAktion}</td>
            <td>${stats.techFehler}</td>
            <td>${stats.gelb}</td>
            <td>${stats.zweiMinuten}</td>
            <td>${stats.rot}</td>
            <td>${buttonsHtml}</td>
        `;

        const btns = tr.querySelectorAll('.heatmap-btn');
        btns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (isLive) {
                    // Navigate to Live Heatmap
                    const navItem = document.querySelector('.nav-item[data-view="heatmap"]');
                    if (navItem) navItem.click();
                } else {
                    const num = (stats.number && stats.number !== '?') ? stats.number : null;
                    const mode = btn.dataset.mode;
                    openPlayerHistoryHeatmap(gameLog, num, 'gegner', stats.name, mode);
                }
            });
        });

        tbody.appendChild(tr);
    });
    if (typeof lucide !== 'undefined') lucide.createIcons({ root: tbody });
}

// --- Open Player History Heatmap ---
// --- Open Player History Heatmap ---
export function openPlayerHistoryHeatmap(gameLog, identifier, team, playerName, mode = 'field') {
    // Determine the title
    const title = mode === '7m' ? `7m Grafik - ${playerName}` : `Wurfbild - ${playerName}`;

    // Filter the log based on mode for the context
    let filteredLog = gameLog;
    if (mode === '7m') {
        filteredLog = gameLog.filter(e => e.action && e.action.includes('7m'));
    }

    // Set Context for the global heatmap view
    setCurrentHeatmapContext({
        log: filteredLog,
        title: title,
        filter: {
            team: team,
            player: identifier
        },
        type: 'season-specific'
    });

    // Default to 'tor' for the global view
    setCurrentHeatmapTab('tor');

    // Simulate navigation to the heatmap view
    const navItem = document.querySelector('.nav-item[data-view="seasonheatmap"]');
    if (navItem) {
        navItem.click();
    }
}

// --- Open History Detail ---
export function openHistoryDetail(game) {
    historieBereich.classList.add('versteckt');
    historieDetailBereich.classList.remove('versteckt');

    // Header info is now handled dynamically in the Score Card below

    // --- REPLICATE LIVE OVERVIEW LAYOUT ---
    const histContentStats = document.getElementById('histContentStats');

    // Determine winner/loser for coloring
    const isAuswaerts = false; // History doesn't track "isAuswaerts" explicitly in view logic usually, but we could check settings if stored. 
    // Usually history view just shows Heim vs Gegner as stored.

    const homeName = game.teams.heim;
    const oppName = game.teams.gegner;
    const homeScore = game.score.heim;
    const oppScore = game.score.gegner;

    const html = `
        <div class="live-overview-container" style="display: flex; flex-direction: column; gap: 20px;">
            <!-- Score Card -->
            <div class="stats-card score-card" style="background: var(--bg-card); border-radius: 12px; padding: 20px; text-align: center; border: 1px solid var(--border-color);">
                <h2 class="card-title" style="margin: 0 0 15px 0; color: var(--text-muted); font-size: 0.9rem; text-transform: uppercase;">Endergebnis</h2>
                <div class="score-display" style="display: flex; justify-content: center; align-items: center; gap: 30px;">
                    <div class="score-team" style="text-align: right;">
                        <span class="team-name" style="display: block; font-size: 1.1rem; font-weight: 700; color: var(--text-main);">${homeName}</span>
                        <span class="team-score" style="display: block; font-size: 2.5rem; font-weight: 800; color: ${homeScore > oppScore ? '#4ade80' : (homeScore < oppScore ? '#f87171' : '#94a3b8')};">${homeScore}</span>
                    </div>
                    <span class="score-separator" style="font-size: 2rem; color: var(--text-muted); font-weight: 300;">:</span>
                    <div class="score-team" style="text-align: left;">
                        <span class="team-name" style="display: block; font-size: 1.1rem; font-weight: 700; color: var(--text-main);">${oppName}</span>
                        <span class="team-score" style="display: block; font-size: 2.5rem; font-weight: 800; color: ${oppScore > homeScore ? '#4ade80' : (oppScore < homeScore ? '#f87171' : '#94a3b8')};">${oppScore}</span>
                    </div>
                </div>
            </div>

            <!-- Home Stats Card -->
            <div class="stats-card" style="background: var(--bg-card); border-radius: 12px; padding: 15px; border: 1px solid var(--border-color);">
                <h2 class="card-title" style="margin: 0 0 15px 0; font-size: 1.1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">${homeName}</h2>
                <div class="table-container" style="overflow-x: auto;">
                    <table class="modern-stats-table" style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="text-align: left; color: var(--text-muted); font-size: 0.8rem;">
                                <th style="padding: 10px;">Spieler</th>
                                <th style="padding: 10px;">Tore</th>
                                <th style="padding: 10px;">Feld</th>
                                <th style="padding: 10px;">7m</th>
                                <th style="padding: 10px;">Fehl</th>
                                <th style="padding: 10px;">Quote</th>
                                <th style="padding: 10px;">Gut</th>
                                <th style="padding: 10px;">TF</th>
                                <th style="padding: 10px;">G</th>
                                <th style="padding: 10px;">2'</th>
                                <th style="padding: 10px;">R</th>
                                <th style="padding: 10px;"></th>
                            </tr>
                        </thead>
                        <tbody id="histStatsBodyNew"></tbody>
                    </table>
                </div>
            </div>

            <!-- Opponent Stats Card -->
            <div class="stats-card" style="background: var(--bg-card); border-radius: 12px; padding: 15px; border: 1px solid var(--border-color);">
                <h2 class="card-title" style="margin: 0 0 15px 0; font-size: 1.1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">${oppName}</h2>
                <div class="table-container" style="overflow-x: auto;">
                    <table class="modern-stats-table" style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="text-align: left; color: var(--text-muted); font-size: 0.8rem;">
                                <th style="padding: 10px;">Name</th>
                                <th style="padding: 10px;">Tore</th>
                                <th style="padding: 10px;">Feld</th>
                                <th style="padding: 10px;">7m</th>
                                <th style="padding: 10px;">Fehl</th>
                                <th style="padding: 10px;">Quote</th>
                                <th style="padding: 10px;">Gut</th>
                                <th style="padding: 10px;">TF</th>
                                <th style="padding: 10px;">G</th>
                                <th style="padding: 10px;">2'</th>
                                <th style="padding: 10px;">R</th>
                                <th style="padding: 10px;"></th>
                            </tr>
                        </thead>
                        <tbody id="histStatsGegnerBodyNew"></tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    histContentStats.innerHTML = html;

    // Clean up or hide manual detail header items if they overlap
    const histHeader = document.getElementById('historieHeader');
    if (histHeader) histHeader.style.display = 'none';

    // Populate data
    const homeStats = berechneStatistiken(game.gameLog, game.roster);
    const opponentStats = berechneGegnerStatistiken(game.gameLog);

    const histStatsBodyNew = document.getElementById('histStatsBodyNew');
    const histStatsGegnerBodyNew = document.getElementById('histStatsGegnerBodyNew');

    renderHomeStatsInHistory(histStatsBodyNew, homeStats, game.gameLog);
    renderOpponentStatsInHistory(histStatsGegnerBodyNew, opponentStats, game.gameLog);

    // Re-bind Heatmap Logic (unchanged from old function, just simple rebinding)
    const renderBound = () => renderHeatmap(histHeatmapSvg, game.gameLog, true);

    const histFilter = histContentHeatmap.querySelector('.heatmap-filter');
    if (histFilter) histFilter.classList.remove('versteckt');

    const histTeamRadios = document.querySelectorAll('input[name="histHeatTeam"]');
    histTeamRadios.forEach(r => {
        r.checked = (r.value === 'heim');
        r.addEventListener('change', renderBound);
    });

    if (histHeatmapToreFilter) histHeatmapToreFilter.onchange = renderBound;
    if (histHeatmapMissedFilter) histHeatmapMissedFilter.onchange = renderBound;
    if (histHeatmap7mFilter) histHeatmap7mFilter.onchange = renderBound;

    histSubTabTor.addEventListener('click', () => {
        setCurrentHeatmapTab('tor');
        histSubTabTor.classList.add('active');
        histSubTabFeld.classList.remove('active');
        histSubTabKombi.classList.remove('active');
        renderBound();
    });
    histSubTabFeld.addEventListener('click', () => {
        setCurrentHeatmapTab('feld');
        histSubTabFeld.classList.add('active');
        histSubTabTor.classList.remove('active');
        histSubTabKombi.classList.remove('active');
        renderBound();
    });
    histSubTabKombi.addEventListener('click', () => {
        setCurrentHeatmapTab('kombiniert');
        histSubTabKombi.classList.add('active');
        histSubTabTor.classList.remove('active');
        histSubTabFeld.classList.remove('active');
        renderBound();
    });

    renderBound();
}
