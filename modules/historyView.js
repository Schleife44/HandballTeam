// modules/historyView.js
// Game History View and related functions

import { spielstand, speichereSpielstand } from './state.js';
import {
    rosterBereich, historieBereich, historieDetailBereich,
    historieListe, histDetailTeams, histDetailScore, histDetailDate,
    histStatsBody, histStatsGegnerBody, heatmapSvg,
    histHeatmapSvg, histContentHeatmap, histTabHeatmap, histSubTabTor, histSubTabFeld, histSubTabKombi,
    histHeatmapToreFilter, histHeatmapMissedFilter, histHeatmap7mFilter,
    histHeatmapStatsArea, histHeatmapStatsBodyHome, histHeatmapStatsBodyGegner,
    histHeatmapHomeTitle, histHeatmapGegnerTitle, histHeatmapPlayerSelect,
    histHeatmapTeamToggle, histHeatTeamLabelHeim, histHeatTeamLabelGegner,
    heatmapTeamToggle, heatmapPlayerSelect, heatmapHeimLabel, heatmapGegnerLabel,
    histTabProtokoll, histContentProtokoll, histProtokollAusgabe,
    histTabTorfolge, histContentTorfolge, histTorfolgeChart
} from './dom.js';
import { berechneStatistiken, berechneGegnerStatistiken, berechneTore } from './stats.js';
import { speichereSpielInHistorie, getHistorie, loescheSpielAusHistorie } from './history.js';
import { renderHeatmap, setCurrentHeatmapContext, setCurrentHeatmapTab, currentHeatmapTab, currentHeatmapContext } from './heatmap.js';
import { customConfirm, customAlert } from './customDialog.js';
import { exportiereHistorieAlsPdf } from './export.js';
import { getGameResult } from './utils.js';
import { showLivePlayerDetails } from './ui.js';

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
        // Stop video timer when game ends
        const { stopVideoTimer } = await import('./timer.js');
        stopVideoTimer();

        // Determine which team name is "ours" based on perspective
        const myTeamName = spielstand.settings.isAuswaertsspiel
            ? spielstand.settings.teamNameGegner
            : spielstand.settings.teamNameHeim;

        const gameData = {
            score: { ...spielstand.score },
            teams: { heim: spielstand.settings.teamNameHeim, gegner: spielstand.settings.teamNameGegner },
            gameLog: [...spielstand.gameLog],
            roster: [...spielstand.roster],
            knownOpponents: [...(spielstand.knownOpponents || [])],
            settings: {
                teamNameHeim: spielstand.settings.teamNameHeim,
                teamNameGegner: spielstand.settings.teamNameGegner,
                teamColor: spielstand.settings.teamColor,
                teamColorGegner: spielstand.settings.teamColorGegner,
                isAuswaertsspiel: spielstand.settings.isAuswaertsspiel,
                myTeamName: myTeamName
            }
        };

        if (spielstand.gameLog && spielstand.gameLog.length > 0) {
            speichereSpielInHistorie(gameData);
            await customAlert("Spiel gespeichert!", "Erfolg ✓");
        } else {
            await customAlert("Spiel hat keine Einträge und wurde nicht gespeichert.", "Info");
        }

        spielstand.gameLog = [];
        spielstand.score.heim = 0;
        spielstand.score.gegner = 0;

        // Vollständiger Timer-Reset
        spielstand.timer = {
            gamePhase: 1,
            istPausiert: true,
            segmentStartZeit: 0,
            verstricheneSekundenBisher: 0,
            videoStartTime: null,
            history: []
        };

        spielstand.uiState = 'roster';
        spielstand.activeSuspensions = [];

        // Reset Player Times
        // Reset Player Times and Disqualification
        if (spielstand.roster) spielstand.roster.forEach(p => {
            p.timeOnField = 0;
            p.disqualified = false;
        });
        if (spielstand.knownOpponents) spielstand.knownOpponents.forEach(p => {
            p.timeOnField = 0;
            p.disqualified = false;
        });

        // Reset Mode Selection for next game
        spielstand.modeSelected = false;

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

        // Use getGameResult to determine win/loss based on team name
        // Pass current myTeamName for old games that don't have it saved
        const result = getGameResult(game, spielstand.settings.myTeamName);
        if (result === 'win') {
            statusColor = '#22c55e'; // Green
            statusText = 'Sieg';
        } else if (result === 'loss') {
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
export function renderHomeStatsInHistory(tbody, statsData, gameLog, isLive = false, stayInHeatmap = false, renderBound = null) {
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

        const timeOnField = stats.timeOnField || 0;
        const m = Math.floor(timeOnField / 60);
        const s = timeOnField % 60;
        const timeStr = `${m}:${s < 10 ? '0' + s : s}`;

        // Check for heatmap data
        // Filter log for this player
        const playerLog = gameLog.filter(e => (e.playerId === stats.number || e.number === stats.number) && !e.action.startsWith('Gegner'));
        const hasField = playerLog.some(e => !e.action.includes('7m'));
        const has7m = playerLog.some(e => e.action.includes('7m'));

        let buttonsHtml = '';
        if (hasField) buttonsHtml += `<button class="heatmap-btn shadcn-btn-secondary" data-mode="field" style="padding: 0 4px; height: 20px; display:inline-flex; align-items:center; vertical-align:middle; font-size: 0.6rem; min-width: 20px;"><i data-lucide="crosshair" style="width: 12px; height: 12px;"></i></button>`;
        if (has7m) buttonsHtml += `<button class="heatmap-btn shadcn-btn-outline" data-mode="7m" style="padding: 0 4px; height: 20px; font-size: 0.6rem; margin-left: 2px; border-color: #f59e0b; color: #f59e0b; display:inline-flex; align-items:center; vertical-align:middle; min-width: 20px;">7m</button>`;

        const showTime = (!spielstand.gameMode || spielstand.gameMode !== 'simple');

        const tr = document.createElement('tr');
        if (isLive) {
            tr.style.cursor = 'pointer';
            tr.title = 'Klicken für Details und Wurfquote';
            tr.addEventListener('click', () => showLivePlayerDetails(stats));
        }
        tr.innerHTML = `
            <td>#${stats.number} ${stats.name}</td>
            ${showTime ? `<td>${timeStr}</td>` : ''}
            <td>${goals}</td>
            <td>${feldtore}</td>
            <td>${sevenMDisplay}</td>
            <td>${stats.fehlwurf}</td>
            <td>${stats.assist || 0}</td>
            <td>${quote}</td>
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

                    // Force Team Toggle to Home (Unchecked)
                    if (heatmapTeamToggle) {
                        heatmapTeamToggle.setAttribute('data-state', 'unchecked');
                        heatmapTeamToggle.setAttribute('aria-checked', 'false');
                        if (heatmapHeimLabel) heatmapHeimLabel.style.color = 'hsl(var(--primary))';
                        if (heatmapGegnerLabel) heatmapGegnerLabel.style.color = 'hsl(var(--muted-foreground))';
                    }
                    // Select Player
                    if (heatmapPlayerSelect) {
                        heatmapPlayerSelect.value = stats.number;
                    }

                    if (navItem) navItem.click();
                } else if (stayInHeatmap) {
                    // Update current heatmap context locally
                    openPlayerHistoryHeatmap(gameLog, stats.number, 'heim', stats.name, mode, false);
                    if (renderBound) renderBound();
                    // Scroll to top of history detail
                    if (historieDetailBereich) historieDetailBereich.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
export function renderOpponentStatsInHistory(tbody, statsData, gameLog, game = null, isLive = false, stayInHeatmap = false, renderBound = null) {
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

        const timeOnField = stats.timeOnField || 0;
        const m = Math.floor(timeOnField / 60);
        const s = timeOnField % 60;
        const timeStr = `${m}:${s < 10 ? '0' + s : s}`;

        let buttonsHtml = '';
        if (hasField || goals > 0) buttonsHtml += `<button class="heatmap-btn shadcn-btn-secondary" data-mode="field" style="padding: 0 4px; height: 20px; display:inline-flex; align-items:center; vertical-align:middle; font-size: 0.6rem; min-width: 20px;"><i data-lucide="crosshair" style="width: 12px; height: 12px;"></i></button>`;
        if (has7m) buttonsHtml += `<button class="heatmap-btn shadcn-btn-outline" data-mode="7m" style="padding: 0 4px; height: 20px; font-size: 0.6rem; margin-left: 2px; border-color: #f59e0b; color: #f59e0b; display:inline-flex; align-items:center; vertical-align:middle; min-width: 20px;">7m</button>`;

        const showTime = (!spielstand.gameMode || spielstand.gameMode !== 'simple');

        const tr = document.createElement('tr');
        if (isLive) {
            tr.style.cursor = 'pointer';
            tr.title = 'Klicken für Details und Wurfquote';
            tr.addEventListener('click', () => showLivePlayerDetails(stats));
        }
        tr.innerHTML = `
            <td>${stats.name}</td>
            ${showTime ? `<td>${timeStr}</td>` : ''}
            <td>${goals}</td>
            <td>${feldtore}</td>
            <td>${sevenMDisplay}</td>
            <td>${stats.fehlwurf}</td>
            <td>${stats.assist || 0}</td>
            <td>${quote}</td>
            <td>${stats.ballverlust || 0}</td>
            <td>${stats.stuermerfoul || 0}</td>
            <td>${stats.block || 0}</td>
            <td>${stats.gewonnen1v1 || 0}</td>
            <td>${stats.oneOnOneLost || 0}</td>
            <td>${stats.rausgeholt7m || 0}</td>
            <td>${stats.rausgeholt2min || 0}</td>
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

                    // Force Team Toggle to Opponent (Checked)
                    if (heatmapTeamToggle) {
                        heatmapTeamToggle.setAttribute('data-state', 'checked');
                        heatmapTeamToggle.setAttribute('aria-checked', 'true');
                        if (heatmapHeimLabel) heatmapHeimLabel.style.color = 'hsl(var(--muted-foreground))';
                        if (heatmapGegnerLabel) heatmapGegnerLabel.style.color = 'white'; // or appropriate contrast
                    }
                    // Select Player (if specific)
                    if (heatmapPlayerSelect && stats.number && stats.number !== '?') {
                        heatmapPlayerSelect.value = stats.number;
                    }

                    if (navItem) navItem.click();
                } else if (stayInHeatmap) {
                    const num = (stats.number && stats.number !== '?') ? stats.number : null;
                    const mode = btn.dataset.mode;
                    const teamName = (game && game.teams && game.teams.gegner) || stats.team || 'gegner';
                    openPlayerHistoryHeatmap(gameLog, num, teamName, stats.name, mode, false);
                    if (renderBound) renderBound();
                    // Scroll to top of history detail
                    if (historieDetailBereich) historieDetailBereich.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                    const num = (stats.number && stats.number !== '?') ? stats.number : null;
                    const mode = btn.dataset.mode;
                    const teamName = (game && game.teams && game.teams.gegner) || stats.team || 'gegner';
                    openPlayerHistoryHeatmap(gameLog, num, teamName, stats.name, mode);
                }
            });
        });

        tbody.appendChild(tr);
    });
    if (typeof lucide !== 'undefined') lucide.createIcons({ root: tbody });
}

// --- Open Player History Heatmap ---
export function openPlayerHistoryHeatmap(gameLog, identifier, team, playerName, mode = 'field', navigate = true) {
    // Determine the title
    const modeLabel = mode === '7m' ? `7m Grafik` : `Wurfbild`;
    const myTeamName = (spielstand.settings.myTeamName || '').toLowerCase().trim();
    const mappedLog = gameLog.map(e => ({
        ...e,
        isOpponent: team !== 'heim' && team !== 'Heim' // Correct: anything not Heim is opponent
    }));

    // Set Context
    setCurrentHeatmapContext({
        log: mappedLog,
        title: `${modeLabel} - ${playerName} #${identifier}`,
        filter: {
            team: team, // 'heim' or 'gegner'
            player: identifier
        },
        mode: mode,  // Add mode information
        initialFilters: {  // Add initial filter states
            tore: mode !== '7m',  // Feldtore only if not 7m mode
            seven_m: mode === '7m',  // 7m only in 7m mode
            missed: true  // Always show misses
        },
        type: 'history-detail'
    });

    // Default to 'tor' for the global view
    setCurrentHeatmapTab('tor');

    if (navigate) {
        // Force Tab UI update (redundant but safe)
        if (histTabProtokoll) histTabProtokoll.classList.remove('active');
        if (histTabTorfolge) histTabTorfolge.classList.remove('active');

        // Switch to the heatmap tab in history detail
        if (histTabHeatmap) {
            histTabHeatmap.classList.add('active');
            histTabHeatmap.click();

            // Explicitly force visibility of heatmap
            if (histContentHeatmap) {
                histContentHeatmap.classList.remove('versteckt');
                histContentHeatmap.classList.remove('hide-heatmap-visuals');
                // Scroll to heatmap content to ensure visibility
                histContentHeatmap.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            if (histContentProtokoll) histContentProtokoll.classList.add('versteckt');
            if (histContentTorfolge) histContentTorfolge.classList.add('versteckt');
        }
    }

    // Also update the player select if it exists
    if (histHeatmapPlayerSelect && identifier !== null) {
        // Use the sync helper if available
        if (histHeatmapSvg && typeof histHeatmapSvg.syncControls === 'function') {
            const isHeim = (team === 'heim');
            histHeatmapSvg.syncControls(isHeim ? 'heim' : 'gegner', identifier, mode);
        } else {
            histHeatmapPlayerSelect.value = identifier;
        }

        // Trigger local update
        if (histHeatmapSvg && typeof histHeatmapSvg.renderBound === 'function') {
            histHeatmapSvg.renderBound();
        }
    }
}

// --- Open History Detail ---
// --- Render Goal Sequence Chart ---
function renderGoalSequenceChart(game) {
    const canvas = document.getElementById('histTorfolgeChart');
    if (!canvas) return;

    // Destroy existing chart if any
    if (canvas.chart) {
        canvas.chart.destroy();
    }

    // Calculate goal progression
    const labels = [];
    const heimData = [];
    const gegnerData = [];

    let heimScore = 0;
    let gegnerScore = 0;

    // Add starting point
    labels.push('0:00');
    heimData.push(0);
    gegnerData.push(0);

    // Process game log
    // FAILSAFE: Sort Chronologically (00:00 -> 60:00)
    const sortedLog = [...game.gameLog].sort((a, b) => {
        const [minA, secA] = a.time.split(':').map(Number);
        const [minB, secB] = b.time.split(':').map(Number);
        return (minA * 60 + secA) - (minB * 60 + secB);
    });

    sortedLog.forEach(entry => {
        const actionLower = entry.action.toLowerCase();
        const isGoal = actionLower.includes('tor');
        if (!isGoal) return;

        // Correct Logic: "Tor" is Us (Heim), "Gegner" is Them (Gegner)
        // (Assuming standard Home Game recording)
        const isGegnerGoal = entry.action.startsWith('Gegner');

        if (isGegnerGoal) {
            gegnerScore++;
        } else {
            heimScore++;
        }

        labels.push(entry.time);
        heimData.push(heimScore);
        gegnerData.push(gegnerScore);
    });

    // Create chart
    const ctx = canvas.getContext('2d');

    canvas.chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: game.teams.heim,
                    data: heimData,
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    borderWidth: 3,
                    tension: 0.1,
                    fill: true
                },
                {
                    label: game.teams.gegner,
                    data: gegnerData,
                    borderColor: '#0d6efd',
                    backgroundColor: 'rgba(13, 110, 253, 0.1)',
                    borderWidth: 3,
                    tension: 0.1,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        color: '#e0e0e0'
                    }
                },
                title: {
                    display: true,
                    text: 'Torverlauf',
                    font: {
                        size: 18,
                        weight: 'bold'
                    },
                    color: '#ffffff'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        color: '#e0e0e0'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    title: {
                        display: true,
                        text: 'Tore',
                        color: '#e0e0e0'
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 20,
                        color: '#e0e0e0'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    title: {
                        display: true,
                        text: 'Spielzeit',
                        color: '#e0e0e0'
                    }
                }
            }
        }
    });
}

// --- Render History Protocol ---
function renderHistoryProtocol(game) {
    const container = document.getElementById('histProtokollAusgabe');
    if (!container) return;

    container.innerHTML = '';

    if (!game.gameLog || game.gameLog.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:20px; color: var(--text-muted);">Kein Protokoll vorhanden.</p>';
        return;
    }

    // Reverse to show newest first
    const reversedLog = [...game.gameLog].reverse();

    reversedLog.forEach((eintrag, idxReverse) => {
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
            const player = game.roster.find(p => p.number === eintrag.playerId);
            const playerName = player ? player.name : '';
            text = `#${eintrag.playerId}${playerName ? ` (${playerName})` : ''}: ${eintrag.action}`;
        } else if (eintrag.gegnerNummer) {
            text = `Gegner #${eintrag.gegnerNummer}: ${eintrag.action}`;
        } else {
            text = `${eintrag.action.toUpperCase()}`;
        }

        if (eintrag.kommentar) {
            text += ` - ${eintrag.kommentar}`;
        }

        contentHtml += `<span class="log-text"><strong>${text}</strong><span style="opacity: 0.6; margin-left:8px;">${spielstandText}</span></span>`;

        div.innerHTML = contentHtml;
        container.appendChild(div);
    });
}

export function openHistoryDetail(game) {
    historieBereich.classList.add('versteckt');
    historieDetailBereich.classList.remove('versteckt');

    // Set Heatmap as active tab
    if (histTabHeatmap) histTabHeatmap.classList.add('active');
    if (histTabProtokoll) histTabProtokoll.classList.remove('active');
    if (histTabTorfolge) histTabTorfolge.classList.remove('active');

    // Show Heatmap content directly
    if (histContentHeatmap) {
        histContentHeatmap.classList.remove('versteckt');
        histContentHeatmap.classList.remove('hide-heatmap-visuals');
    }
    if (histContentProtokoll) histContentProtokoll.classList.add('versteckt');
    if (histContentTorfolge) histContentTorfolge.classList.add('versteckt');

    const homeName = game.teams.heim;
    const oppName = game.teams.gegner;
    const homeScore = game.score.heim;
    const oppScore = game.score.gegner;

    // Render Score Card into Header
    if (historieHeader) {
        historieHeader.classList.remove('versteckt');
        historieHeader.innerHTML = `
            <div class="stats-card score-card" style="background: var(--bg-card); border-radius: 12px; padding: 20px; text-align: center; border: 1px solid var(--border-color); margin-bottom: 20px;">
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
        `;
    }

    // Populate data
    const homeStats = berechneStatistiken(game.gameLog, game.roster);
    const opponentStats = berechneGegnerStatistiken(game.gameLog);

    // Simplified Perspective Detection for Heatmap
    // Just map based on identity: "Gegner" actions or gegnerNummer = Opponent, playerId = Us
    const perspectiveMappedLog = game.gameLog.map(e => ({
        ...e,
        isOpponent: !!(e.action?.startsWith('Gegner') || e.gegnerNummer)
    }));

    // Re-bind Heatmap Logic (unchanged from old function, just simple rebinding)
    // Set initial heatmap state for this game
    setCurrentHeatmapTab('tor');
    setCurrentHeatmapContext({ type: 'history-detail' }); // Standardize context

    // Heatmap Tabs Filter
    const renderBound = () => renderHeatmap(histHeatmapSvg, perspectiveMappedLog, true);
    if (histHeatmapSvg) {
        histHeatmapSvg.renderBound = renderBound;
        // Also ensure no other context interferes
        histHeatmapSvg.dataset.isHistory = "true";
    }

    // Helper to update player select based on team
    const updatePlayerSelect = (activeTeam = null) => {
        if (!histHeatmapPlayerSelect) return;
        const isGegner = activeTeam ? (activeTeam === 'gegner') : (histHeatmapTeamToggle?.getAttribute('data-state') === 'checked');
        histHeatmapPlayerSelect.innerHTML = '<option value="all">Alle Spieler</option>';
        if (!isGegner) {
            homeStats.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.number;
                opt.textContent = `${p.number} - ${p.name}`;
                histHeatmapPlayerSelect.appendChild(opt);
            });
        } else {
            opponentStats.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.number;
                opt.textContent = `${p.number} - ${p.name}`;
                histHeatmapPlayerSelect.appendChild(opt);
            });
        }
    };

    if (histHeatmapSvg) {
        histHeatmapSvg.syncControls = (team, identifier, mode = 'field') => {
            const isHeim = (team === 'heim');
            if (histHeatmapTeamToggle) {
                histHeatmapTeamToggle.setAttribute('data-state', isHeim ? 'unchecked' : 'checked');
                histHeatmapTeamToggle.setAttribute('aria-checked', (!isHeim).toString());
                if (histHeatTeamLabelHeim) histHeatTeamLabelHeim.style.color = isHeim ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))';
                if (histHeatTeamLabelGegner) histHeatTeamLabelGegner.style.color = !isHeim ? 'white' : 'hsl(var(--muted-foreground))';
            }
            updatePlayerSelect(isHeim ? 'heim' : 'gegner');
            if (histHeatmapPlayerSelect && identifier !== null) {
                histHeatmapPlayerSelect.value = identifier;
            }

            // Sync Checkboxes based on mode
            if (mode === '7m') {
                if (histHeatmapToreFilter) histHeatmapToreFilter.checked = false;
                if (histHeatmap7mFilter) histHeatmap7mFilter.checked = true;
                if (histHeatmapMissedFilter) histHeatmapMissedFilter.checked = true;
            } else {
                if (histHeatmapToreFilter) histHeatmapToreFilter.checked = true;
                if (histHeatmap7mFilter) histHeatmap7mFilter.checked = false;
                if (histHeatmapMissedFilter) histHeatmapMissedFilter.checked = true;
            }
        };
    }

    // Initial populate of Heatmap Tab Stats
    if (histHeatmapStatsArea) {
        histHeatmapStatsArea.classList.remove('versteckt');
        if (histHeatmapHomeTitle) histHeatmapHomeTitle.textContent = homeName;
        if (histHeatmapGegnerTitle) histHeatmapGegnerTitle.textContent = oppName;

        renderHomeStatsInHistory(histHeatmapStatsBodyHome, homeStats, game.gameLog, false, true, renderBound);
        renderOpponentStatsInHistory(histHeatmapStatsBodyGegner, opponentStats, game.gameLog, game, false, true, renderBound);
    }

    const histFilter = histContentHeatmap.querySelector('.heatmap-filter');
    if (histFilter) histFilter.classList.remove('versteckt');

    // Populate Heatmap Player Select
    if (histHeatmapPlayerSelect) {
        updatePlayerSelect();
        histHeatmapPlayerSelect.onchange = () => {
            renderBound();
        };
    }

    if (histHeatTeamLabelHeim) {
        histHeatTeamLabelHeim.textContent = homeName;
        // Initial highlight
        histHeatTeamLabelHeim.style.color = 'hsl(var(--primary))';
    }
    if (histHeatTeamLabelGegner) {
        histHeatTeamLabelGegner.textContent = oppName;
        histHeatTeamLabelGegner.style.color = 'hsl(var(--muted-foreground))';
    }

    if (histHeatmapTeamToggle) {
        // Reset state
        histHeatmapTeamToggle.setAttribute('data-state', 'unchecked');
        histHeatmapTeamToggle.setAttribute('aria-checked', 'false');

        histHeatmapTeamToggle.onclick = () => {
            const isChecked = histHeatmapTeamToggle.getAttribute('data-state') === 'checked';
            const newState = isChecked ? 'unchecked' : 'checked';
            histHeatmapTeamToggle.setAttribute('data-state', newState);
            histHeatmapTeamToggle.setAttribute('aria-checked', (!isChecked).toString());

            // Highlight labels
            if (histHeatTeamLabelHeim) histHeatTeamLabelHeim.style.color = !isChecked ? 'hsl(var(--muted-foreground))' : 'hsl(var(--primary))';
            if (histHeatTeamLabelGegner) histHeatTeamLabelGegner.style.color = !isChecked ? 'white' : 'hsl(var(--muted-foreground))';

            updatePlayerSelect();
            renderBound();
        };
    }

    if (histHeatmapToreFilter) histHeatmapToreFilter.onchange = renderBound;
    if (histHeatmapMissedFilter) histHeatmapMissedFilter.onchange = renderBound;
    if (histHeatmap7mFilter) histHeatmap7mFilter.onchange = renderBound;

    // Use property based listeners to avoid accumulation
    histSubTabTor.onclick = () => {
        setCurrentHeatmapTab('tor');
        histSubTabTor.classList.add('active');
        histSubTabFeld.classList.remove('active');
        histSubTabKombi.classList.remove('active');
        renderBound();
    };
    histSubTabFeld.onclick = () => {
        setCurrentHeatmapTab('feld');
        histSubTabFeld.classList.add('active');
        histSubTabTor.classList.remove('active');
        histSubTabKombi.classList.remove('active');
        renderBound();
    };
    histSubTabKombi.onclick = () => {
        setCurrentHeatmapTab('kombiniert');
        histSubTabKombi.classList.add('active');
        histSubTabTor.classList.remove('active');
        histSubTabFeld.classList.remove('active');
        renderBound();
    };

    // Reset buttons UI
    histSubTabTor.classList.add('active');
    histSubTabFeld.classList.remove('active');
    histSubTabKombi.classList.remove('active');

    // Render Protocol and Goal Sequence Chart
    renderHistoryProtocol(game);
    renderGoalSequenceChart(game);

    renderBound();
}
