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
    histTabTorfolge, histContentTorfolge, histTorfolgeChart,
    historieHeader
} from './dom.js';
import { berechneStatistiken, berechneGegnerStatistiken, berechneTore } from './stats.js';
import { speichereSpielInHistorie, getHistorie, loescheSpielAusHistorie, updateHistorieSpiel } from './history.js';
import { renderHeatmap, setCurrentHeatmapContext, setCurrentHeatmapTab, currentHeatmapTab, currentHeatmapContext } from './heatmap.js';
import { customConfirm, customAlert, customPrompt } from './customDialog.js';
import { exportiereHistorieAlsPdf } from './export.js';
import { getGameResult } from './utils.js';
import { showLivePlayerDetails } from './ui.js';
import { renderHomeStatsInHistory, renderOpponentStatsInHistory, openPlayerHistoryHeatmap } from './sharedViews.js';
import { sanitizeHTML, escapeHTML } from './securityUtils.js';
import { selectGameForAnalysis } from './videoAnalysis.js';
import { navigateTo } from './router.js';
import { saveSpielstandToFirestoreImmediate } from './firebase.js';
import { 
    syncGameWithHandballNet, 
    normalizeAction 
} from './historySync.js';

// Internal state for refreshing stats on sort
let currentGameShowing = null;
let currentRenderBound = null;


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

        // Carry over handball.net reference if the game was started from a synced event
        if (spielstand.aktivesSpielevent) {
            const activeEvent = (spielstand.calendarEvents || []).find(e => e.id === spielstand.aktivesSpielevent);
            if (activeEvent && activeEvent.hnetGameId) {
                gameData.hnetGameId = activeEvent.hnetGameId;
            }
        }

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
        spielstand.isSpielAktiv = false;
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

        // Immediate sync to ensure Firestore is updated before the reload
        await saveSpielstandToFirestoreImmediate(spielstand);
        
        speichereSpielstand(); // Update local storage too
        location.reload();
    }
}

// --- Render History List ---
export async function renderHistoryList() {
    historieListe.innerHTML = sanitizeHTML('<div style="grid-column: 1/-1; text-align:center; padding:40px; color: var(--text-muted);"><div class="loading-spinner" style="margin: 0 auto 15px;"></div>Lade Spiele aus der Cloud...</div>');

    // Ensure grid container class
    historieListe.className = 'history-grid';
    historieListe.style.display = 'grid';

    let games = await getHistorie();
    // Sort games by date descending (newest first)
    if (games && games.length > 1) {
        games = [...games].sort((a, b) => new Date(b.date) - new Date(a.date));
    }
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

        const isHnet = !!game.hnetGameId;
        const sourceBadge = isHnet 
            ? `<span style="font-size: 0.65rem; padding: 2px 6px; background: rgba(37, 99, 235, 0.1); color: #60a5fa; border: 1px solid rgba(37, 99, 235, 0.2); border-radius: 4px; margin-left: auto;">handball.net</span>`
            : `<span style="font-size: 0.65rem; padding: 2px 6px; background: rgba(255, 255, 255, 0.05); color: var(--text-muted); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 4px; margin-left: auto;">Eigenes Tracking</span>`;

        div.innerHTML = sanitizeHTML(`
            <div class="history-card-header" style="pointer-events: none; display: flex; align-items: center; gap: 8px;">
                <span style="font-weight: 600; color: ${statusColor}">${escapeHTML(statusText)}</span>
                <span style="opacity: 0.6;">${escapeHTML(date)}</span>
                ${sourceBadge}
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
                <button class="shadcn-btn-outline shadcn-btn-sm insta-btn" data-id="${escapeHTML(game.id)}" style="padding: 6px 8px; flex: 1; border-color: #e1306c; color: #e1306c;" title="Instagram Bild">
                    Insta
                </button>
                <button class="shadcn-btn-outline shadcn-btn-sm video-analysis-btn" data-id="${escapeHTML(game.id)}" style="padding: 6px 8px; flex: 1; border-color: var(--primary); color: var(--primary);" title="Video Analyse">
                    Video
                </button>
                <button class="shadcn-btn-outline shadcn-btn-sm export-history-btn" data-id="${escapeHTML(game.id)}" style="padding: 6px 8px; flex: 1;" title="Export">
                    JSON
                </button>
                ${!game.hnetGameId ? `
                <button class="shadcn-btn-outline shadcn-btn-sm sync-hnet-btn" data-id="${escapeHTML(game.id)}" style="padding: 6px 8px; border-color: #60a5fa; color: #60a5fa;" title="Mit handball.net abgleichen">
                    Abgleich
                </button>` : ''}
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

        div.querySelector('.insta-btn')?.addEventListener('click', async (e) => {
            e.stopPropagation();
            const { showResultImageModal } = await import(`./resultImage.js?v=${Date.now()}`);
            showResultImageModal(game);
        });

        div.querySelector('.video-analysis-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            selectGameForAnalysis(game);
            navigateTo('videoanalyse');
        });

        div.querySelector('.export-pdf-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            exportiereHistorieAlsPdf(game);
        });

        div.querySelector('.export-history-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            exportiereEinzelnesSpiel(game);
        });

        div.querySelector('.delete-history-btn')?.addEventListener('click', async (e) => {
            e.stopPropagation();
            const confirmed = await customConfirm("Spiel wirklich aus der Historie löschen?", "Löschen?");
            if (confirmed) {
                await loescheSpielAusHistorie(game.id);
                renderHistoryList();
            }
        });

        div.querySelector('.sync-hnet-btn')?.addEventListener('click', async (e) => {
            e.stopPropagation();
            await handleHnetSync(game);
        });

        historieListe.appendChild(div);
    });
}

/**
 * Handles the logic for syncing a game with handball.net
 */
async function handleHnetSync(game) {
    let hnetUrl = game.hnetGameUrl || "";
    
    // If we don't have a URL/ID yet, ask for it
    if (!game.hnetGameId && !hnetUrl) {
        const input = await customPrompt("Bitte gib die handball.net URL des Spielberichts ein:", "Handball.net URL");
        if (!input) return;
        hnetUrl = input;
    } else if (game.hnetGameId) {
        // Construct URL from ID if possible, or just use the ID
        hnetUrl = `https://www.handball.net/spiele/${game.hnetGameId}/spielbericht`;
    }

    try {
        const btn = document.querySelector(`.sync-hnet-btn[data-id="${game.id}"]`) || document.getElementById('histHeaderSyncBtn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<div class="loading-spinner-xs"></div>';
        }

        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<div class="loading-spinner-xs"></div>';
        }

        const result = await syncGameWithHandballNet(game, hnetUrl);
        await showSyncReport(game, hnetUrl, result);
        
    } catch (error) {
        console.error("Sync Error:", error);
        await customAlert("Fehler beim Abgleich: " + error.message, "Abgleich fehlgeschlagen");
    } finally {
        const btn = document.querySelector(`.sync-hnet-btn[data-id="${game.id}"]`) || document.getElementById('histHeaderSyncBtn');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = btn.id === 'histHeaderSyncBtn' ? 
                '<i data-lucide="refresh-cw" style="width: 14px; height: 14px; margin-right: 6px;"></i> Mit handball.net abgleichen' : 
                'Abgleich';
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    }
}

/**
 * Handles the modular rendering of the sync report
 */
async function showSyncReport(game, hnetUrl, result) {
    const getIcon = (type) => {
        switch(type) {
            case 'goal': return '<i data-lucide="target" style="width: 16px; height: 16px;"></i>';
            case 'penalty': return '<i data-lucide="clock" style="width: 16px; height: 16px;"></i>';
            case 'yellow': return '<i data-lucide="alert-triangle" style="width: 16px; height: 16px; color: #fbbf24;"></i>';
            case 'red': return '<i data-lucide="x-circle" style="width: 16px; height: 16px; color: #ef4444;"></i>';
            case 'timeout': return '<i data-lucide="timer" style="width: 16px; height: 16px;"></i>';
            default: return '<i data-lucide="activity" style="width: 16px; height: 16px;"></i>';
        }
    };

    console.log(`[SyncReport] Rendering. Matches: ${result.matchesCount}, Unmatched: ${result.unmatchedLocal?.length}`);
    
    let html = '';
    if (result.successMessage) {
        html += `<div style="background: rgba(34, 197, 94, 0.1); color: #22c55e; padding: 10px; border-radius: 6px; margin-bottom: 15px; font-size: 0.85rem; border: 1px solid rgba(34, 197, 94, 0.2);">
            <i data-lucide="check-circle" style="width: 14px; height: 14px; margin-right: 6px; vertical-align: middle;"></i> ${escapeHTML(result.successMessage)}
        </div>`;
    }

    html += `
        <div style="margin-bottom: 20px; font-size: 0.9rem; color: var(--muted-foreground);">
            Der Abgleich wurde erfolgreich abgeschlossen. ${result.matchesCount} Ereignisse wurden synchronisiert und ${result.addedCount} wurden ergänzt.
        </div>
        <div class="hub-sync-report">
    `;

    // 1. TOP: Show items that could not be matched automatically (The Action items)
    if (result.unmatchedLocal && result.unmatchedLocal.length > 0) {
        const syncableUnmatched = result.unmatchedLocal.filter(l => {
            const a = l.action.toLowerCase();
            const blacklist = ["parade", "vorbei", "fehlwurf", "pfosten", "latte", "gute aktion", "gelb", "gelbe", "halbzeit", "7m gehalten"];
            return !blacklist.some(term => a.includes(term));
        });

        if (syncableUnmatched.length > 0) {
            html += `<h4 style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #f59e0b; margin: 10px 0 10px 0;">Nicht verknüpft (Manuell zuordnen)</h4>`;
            syncableUnmatched.forEach(l => {
                const standText = l.spielstand ? ` | Stand: ${l.spielstand}` : '';
                html += `
                    <div class="hub-sync-item">
                        <div class="hub-sync-left">
                            <div class="hub-sync-icon unmatched">${getIcon(l.type)}</div>
                            <div class="hub-sync-info">
                                <span class="hub-sync-action">${escapeHTML(l.action)}</span>
                                <span class="hub-sync-times">${escapeHTML(l.time)}${escapeHTML(standText)}</span>
                            </div>
                        </div>
                        <button class="hub-btn-primary manual-sync-trigger" data-local-id="${l.id}" style="padding: 4px 10px; font-size: 0.7rem;">Zuordnen</button>
                    </div>
                `;
            });
        }
    }

    // 2. Linked Events
    if (result.matchDetails.length > 0) {
        html += `<h4 style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #3b82f6; margin: 25px 0 10px 0;">Verknüpfte Ereignisse</h4>`;
        result.matchDetails.forEach(m => {
            html += `
                <div class="hub-sync-item">
                    <div class="hub-sync-left">
                        <div class="hub-sync-icon">${getIcon(m.type)}</div>
                        <div class="hub-sync-info">
                            <span class="hub-sync-action">${escapeHTML(m.action)}</span>
                            <span class="hub-sync-times">${escapeHTML(m.localTime)} ➔ Ticker ${escapeHTML(m.hnetTime)}</span>
                        </div>
                    </div>
                    <span class="hub-sync-badge">Verknüpft</span>
                </div>
            `;
        });
    }

    // 3. New Events from Ticker
    if (result.addedDetails.length > 0) {
        html += `<h4 style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #22c55e; margin: 25px 0 10px 0;">Neu hinzugefügt (Official)</h4>`;
        result.addedDetails.forEach(a => {
            html += `
                <div class="hub-sync-item">
                    <div class="hub-sync-left">
                        <div class="hub-sync-icon added">${getIcon(a.type)}</div>
                        <div class="hub-sync-info">
                            <span class="hub-sync-action">${escapeHTML(a.action)}</span>
                            <span class="hub-sync-times">Ticker Zeit: ${escapeHTML(a.hnetTime)}</span>
                        </div>
                    </div>
                    <span class="hub-sync-badge added">Neu</span>
                </div>
            `;
        });
    }

    const alertMessageNode = document.getElementById('customAlertMessage');
    const alertTitleNode = document.getElementById('customAlertTitle');
    const alertModalNode = document.getElementById('customAlertModal');

    if (alertModalNode.classList.contains('versteckt')) {
        // First time opening
        const alertPromise = customAlert(html, "Abgleich Ergebnisse");
        setupSyncReportUI(game, hnetUrl, result);
        await alertPromise;
    } else {
        alertTitleNode.textContent = "Abgleich Ergebnisse";
        alertMessageNode.innerHTML = sanitizeHTML(html);
        setupSyncReportUI(game, hnetUrl, result);
    }

    // Refresh background view
    if (historieDetailBereich && !historieDetailBereich.classList.contains('versteckt')) {
        openHistoryDetail(game);
    } else {
        renderHistoryList();
    }
}

/**
 * Attaches listeners to the sync report UI
 */
function setupSyncReportUI(game, hnetUrl, result) {
    const alertMessageNode = document.getElementById('customAlertMessage');
    
    setTimeout(() => {
        const triggers = alertMessageNode.querySelectorAll('.manual-sync-trigger');
        triggers.forEach(btn => {
            btn.onclick = async (e) => {
                e.preventDefault();
                e.stopPropagation();
                const localId = btn.getAttribute('data-local-id');
                const localItem = result.unmatchedLocal.find(l => String(l.id) === String(localId));
                if (localItem) {
                    await handleManualSyncSelection(game, hnetUrl, localItem, result);
                }
            };
        });

        if (typeof lucide !== 'undefined') lucide.createIcons();
    }, 50);
}

/**
 * Shows a picker to manually link a local event to a ticker entry
 */
async function handleManualSyncSelection(game, hnetUrl, localItem, syncResult) {
    const hnetCandidates = syncResult.unmatchedHnet;
    if (hnetCandidates.length === 0) {
        await customAlert("Keine verbleibenden Ticker-Einträge zur Auswahl gefunden.", "Hinweis");
        return;
    }

    let pickerHtml = `
        <div style="margin-bottom: 15px; font-size: 0.9rem;">
            Wähle den passenden Ticker-Eintrag für <b>${escapeHTML(localItem.action)} (${escapeHTML(localItem.time)})</b>:
        </div>
        <div class="hub-sync-report" style="max-height: 300px;">
    `;

    hnetCandidates.forEach((h, idx) => {
        pickerHtml += `
            <div class="hub-sync-item manual-pick-item" data-idx="${idx}" style="cursor: pointer;">
                <div class="hub-sync-left">
                    <div class="hub-sync-icon" style="background: rgba(59, 130, 246, 0.1); color: #3b82f6;">
                        <i data-lucide="plus" style="width: 14px; height: 14px;"></i>
                    </div>
                    <div class="hub-sync-info">
                        <span class="hub-sync-action">${escapeHTML(h.action)}</span>
                        <span class="hub-sync-times">${escapeHTML(h.time)} | Stand: ${escapeHTML(h.spielstand || "-")}</span>
                    </div>
                </div>
            </div>
        `;
    });

    pickerHtml += `</div>`;
    pickerHtml += `
        <div style="margin-top: 15px;">
            <button id="pickerBackBtn" class="shadcn-btn-outline" style="width: 100%;">
                <i data-lucide="arrow-left" style="width: 14px; height: 14px; margin-right: 6px;"></i> Zurück zum Bericht
            </button>
        </div>
    `;

    const alertMessageNode = document.getElementById('customAlertMessage');
    const alertTitleNode = document.getElementById('customAlertTitle');
    
    alertTitleNode.textContent = "Manuelle Zuordnung";
    alertMessageNode.innerHTML = sanitizeHTML(pickerHtml);

    // --- Robust Connection for Picker Items ---
    setTimeout(() => {
        const alertNode = document.getElementById('customAlertModal');
        const backBtn = alertNode.querySelector('#pickerBackBtn');
        if (backBtn) {
            backBtn.onclick = () => showSyncReport(game, hnetUrl, syncResult);
        }

        const items = alertNode.querySelectorAll('.manual-pick-item');
        items.forEach(item => {
            item.onclick = async (e) => {
                e.preventDefault();
                e.stopPropagation();

                const hIdx = parseInt(item.dataset.idx);
                const picked = hnetCandidates[hIdx];
                
                const logEntry = game.gameLog.find(ev => String(ev.id) === String(localItem.id));
                if (logEntry) {
                    logEntry.timestamp = picked.timestamp;
                    logEntry.hnetId = picked.hnetId;
                    logEntry.officialTime = picked.time;
                    logEntry.half = picked.half;
                    logEntry.isManualSync = true;
                    
                    await updateHistorieSpiel(game);
                    
                    const beforeCount = syncResult.unmatchedLocal.length;
                    syncResult.unmatchedLocal = (syncResult.unmatchedLocal || []).filter(l => l.id && l.id !== localItem.id);
                    const afterCount = syncResult.unmatchedLocal.length;
                    
                    if (beforeCount > 0 && afterCount === 0 && beforeCount > 1) {
                        console.warn("[Sync] Critical: Unmatched list drained unexpectedly!", {before: beforeCount, item: localItem});
                    }

                    syncResult.unmatchedHnet = hnetCandidates.filter(c => c.hnetId !== picked.hnetId);
                    syncResult.matchesCount++;
                    syncResult.matchDetails.push({
                        action: localItem.action,
                        localTime: localItem.time,
                        hnetTime: picked.time,
                        type: normalizeAction(localItem.action)
                    });
                    syncResult.successMessage = `${localItem.action} erfolgreich verknüpft.`;
                    
                    // Force a clean refresh to avoid state issues
                    const alertMessageNode = document.getElementById('customAlertMessage');
                    if (alertMessageNode) alertMessageNode.innerHTML = '<div class="loading-spinner-xs"></div>';
                    
                    setTimeout(() => {
                        showSyncReport(game, hnetUrl, syncResult);
                        // Remove success message after 3 seconds
                        setTimeout(() => {
                            if (syncResult.successMessage) {
                                delete syncResult.successMessage;
                                showSyncReport(game, hnetUrl, syncResult);
                            }
                        }, 3000);
                    }, 50);
                }
            };
        });

        if (typeof lucide !== 'undefined') lucide.createIcons();
    }, 50);
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

        const displayTime = eintrag.officialTime || eintrag.time || "00:00";
        const isOfficial = !!eintrag.officialTime;
        const spielstandText = eintrag.spielstand ? ` (${eintrag.spielstand})` : '';

        let contentHtml = `<span class="log-time">${displayTime}${isOfficial ? ' <i data-lucide="check-check" style="width:10px; height:10px; display:inline; vertical-align:middle; opacity:0.6;"></i>' : ''}</span>`;
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
        if (typeof lucide !== 'undefined') lucide.createIcons({ root: div });
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
                
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: center; gap: 10px;">
                    ${!game.hnetGameId ? `
                    <button id="histHeaderSyncBtn" class="shadcn-btn-outline shadcn-btn-sm" style="border-color: #60a5fa; color: #60a5fa;">
                        <i data-lucide="refresh-cw" style="width: 14px; height: 14px; margin-right: 6px;"></i>
                        Mit handball.net abgleichen
                    </button>` : ''}
                    <button id="histHeaderVideoBtn" class="shadcn-btn-outline shadcn-btn-sm" style="border-color: var(--primary); color: var(--primary);">
                        <i data-lucide="play-circle" style="width: 14px; height: 14px; margin-right: 6px;"></i>
                        Video Analyse
                    </button>
                </div>
            </div>
        `);
        if (typeof lucide !== 'undefined') lucide.createIcons({ root: historieHeader });

        // Add Listeners
        const syncBtn = historieHeader.querySelector('#histHeaderSyncBtn');
        if (syncBtn) syncBtn.onclick = () => handleHnetSync(game);

        const videoBtn = historieHeader.querySelector('#histHeaderVideoBtn');
        if (videoBtn) videoBtn.onclick = () => {
            selectGameForAnalysis(game);
            navigateTo('videoanalyse');
        };
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
    renderHistoryStats(game, renderBound);

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

/**
 * Re-renders the history statistics tables based on the currently showing game.
 * Used for table sorting.
 */
export function refreshHistoryStats() {
    if (currentGameShowing) {
        renderHistoryStats(currentGameShowing, currentRenderBound);
    }
}

/**
 * Helper to render history stats tables
 */
function renderHistoryStats(game, renderBound) {
    currentGameShowing = game;
    currentRenderBound = renderBound;

    if (!histHeatmapStatsArea) return;

    histHeatmapStatsArea.classList.remove('versteckt');
    if (histHeatmapHomeTitle) histHeatmapHomeTitle.textContent = game.teams.heim;
    if (histHeatmapGegnerTitle) histHeatmapGegnerTitle.textContent = game.teams.gegner;

    const homeStats = berechneStatistiken(game.gameLog, game.roster);
    const opponentStats = berechneGegnerStatistiken(game.gameLog);

    renderHomeStatsInHistory(histHeatmapStatsBodyHome, homeStats, game.gameLog, false, true, renderBound, showLivePlayerDetails);
    if (histHeatmapStatsBodyGegner) {
        renderOpponentStatsInHistory(histHeatmapStatsBodyGegner, opponentStats, game.gameLog, game, false, true, renderBound, showLivePlayerDetails);
    }
}
