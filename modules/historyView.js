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
import { renderHomeStatsInHistory, renderOpponentStatsInHistory, openPlayerHistoryHeatmap } from './sharedViews.js';
import { sanitizeHTML, escapeHTML } from './securityUtils.js';
import { selectGameForAnalysis } from './videoAnalysis.js';
import { navigateTo } from './router.js';

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
            score: { 
                heim: spielstand.score.heim, 
                gegner: spielstand.score.gegner 
            },
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
            await speichereSpielInHistorie(gameData);
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
export async function renderHistoryList() {
    historieListe.innerHTML = sanitizeHTML('<div style="grid-column: 1/-1; text-align:center; padding:40px; color: var(--text-muted);"><div class="loading-spinner" style="margin: 0 auto 15px;"></div>Lade Spiele aus der Cloud...</div>');

    // Ensure grid container class
    historieListe.className = 'history-grid';
    historieListe.style.display = 'grid';

    const games = await getHistorie();
    historieListe.innerHTML = '';

    if (!games || games.length === 0) {
        historieListe.style.display = 'block'; // Fallback for message
        historieListe.innerHTML = sanitizeHTML('<p style="text-align:center; padding:20px; color: var(--text-muted);">Keine gespeicherten Spiele vorhanden.</p>');
        return;
    }

    games.forEach(game => {
        const div = document.createElement('div');
        div.className = 'history-card-modern';
        div.setAttribute('role', 'button');
        div.setAttribute('tabindex', '0');

        const score = game.score || { heim: 0, gegner: 0 };
        const heimScore = score.heim;
        const gastScore = score.gegner;
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

        div.innerHTML = sanitizeHTML(`
            <div class="history-card-header" style="pointer-events: none;">
                <span style="font-weight: 600; color: ${statusColor}">${escapeHTML(statusText)}</span>
                <span>${escapeHTML(date)}</span>
            </div>
            
            <div class="history-card-body" style="pointer-events: none;">
                <div class="history-card-teams">
                    ${escapeHTML(game.teams.heim)} <span style="font-weight: 400; opacity: 0.6;">vs</span> ${escapeHTML(game.teams.gegner)}
                </div>
                <div class="history-card-score">
                    ${escapeHTML(heimScore)} : ${escapeHTML(gastScore)}
                </div>
            </div>

            <div style="display: flex; gap: 4px; margin-top: 4px; flex-wrap: wrap;">
                <button class="shadcn-btn-outline shadcn-btn-sm video-analysis-btn" data-id="${escapeHTML(game.id)}" style="padding: 6px 8px; flex: 1; border-color: var(--primary); color: var(--primary);" title="Video Analyse">
                    Video
                </button>
                <button class="shadcn-btn-outline shadcn-btn-sm export-pdf-btn" data-id="${escapeHTML(game.id)}" style="padding: 6px 8px; flex: 1;" title="PDF">
                    PDF
                </button>
                <button class="shadcn-btn-outline shadcn-btn-sm export-history-btn" data-id="${escapeHTML(game.id)}" style="padding: 6px 8px; flex: 1;" title="Export">
                    JSON
                </button>
                <button class="shadcn-btn-outline shadcn-btn-sm delete-history-btn" data-id="${escapeHTML(game.id)}" style="padding: 6px 8px; border-color: rgba(239, 68, 68, 0.2); color: #ef4444;" title="Löschen">
                    Lösch
                </button>
            </div>
        `);

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

        div.querySelector('.video-analysis-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            selectGameForAnalysis(game);
            navigateTo('videoanalyse');
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
                await loescheSpielAusHistorie(game.id);
                renderHistoryList();
            }
        });

        historieListe.appendChild(div);
    });
}



// --- History Logic moved to sharedViews.js ---
// renderHomeStatsInHistory, renderOpponentStatsInHistory, and openPlayerHistoryHeatmap 
// are now imported from sharedViews.js to resolve circular dependencies.


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
        container.innerHTML = sanitizeHTML('<p style="text-align:center; padding:20px; color: var(--text-muted);">Kein Protokoll vorhanden.</p>');
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
            text += ` - ${escapeHTML(eintrag.kommentar)}`;
        }

        contentHtml += `<span class="log-text"><strong>${escapeHTML(text)}</strong><span style="opacity: 0.6; margin-left:8px;">${escapeHTML(spielstandText)}</span></span>`;

        div.innerHTML = sanitizeHTML(contentHtml);
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
        const dateStr = new Date(game.date).toLocaleDateString();
        historieHeader.innerHTML = sanitizeHTML(`
            <div class="stats-card score-card" style="background: var(--bg-card); border-radius: 12px; padding: 20px; text-align: center; border: 1px solid var(--border-color); margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h2 class="card-title" style="margin: 0; color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em;">Endergebnis</h2>
                    <span style="color: var(--text-muted); font-size: 0.8rem; font-weight: 500;">${escapeHTML(dateStr)}</span>
                </div>
                <div class="score-display" style="display: flex; justify-content: center; align-items: center; gap: 30px;">
                    <div class="score-team" style="text-align: right; flex: 1;">
                        <span class="team-name" style="display: block; font-size: 1.1rem; font-weight: 700; color: var(--text-main); line-height: 1.2;">${escapeHTML(homeName)}</span>
                        <span class="team-score" style="display: block; font-size: 2.8rem; font-weight: 800; color: ${homeScore > oppScore ? '#4ade80' : (homeScore < oppScore ? '#f87171' : '#94a3b8')};">${escapeHTML(homeScore)}</span>
                    </div>
                    <span class="score-separator" style="font-size: 2.5rem; color: var(--text-muted); font-weight: 200; opacity: 0.5;">:</span>
                    <div class="score-team" style="text-align: left; flex: 1;">
                        <span class="team-name" style="display: block; font-size: 1.1rem; font-weight: 700; color: var(--text-main); line-height: 1.2;">${escapeHTML(oppName)}</span>
                        <span class="team-score" style="display: block; font-size: 2.8rem; font-weight: 800; color: ${oppScore > homeScore ? '#4ade80' : (oppScore < homeScore ? '#f87171' : '#94a3b8')};">${escapeHTML(oppScore)}</span>
                    </div>
                </div>
            </div>
        `);
        if (typeof lucide !== 'undefined') lucide.createIcons({ root: historieHeader });
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

        renderHomeStatsInHistory(histHeatmapStatsBodyHome, homeStats, game.gameLog, false, true, renderBound, showLivePlayerDetails);
        if (histHeatmapStatsBodyGegner) {
            renderOpponentStatsInHistory(histHeatmapStatsBodyGegner, opponentStats, game.gameLog, game, false, true, renderBound, showLivePlayerDetails);
        }
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
