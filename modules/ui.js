import { customAlert } from './customDialog.js';
import { berechneTore, berechneWurfbilder, berechneStatistiken, berechneGegnerStatistiken, berechneSpielartStatistik } from './stats.js';
import { sanitizeHTML, escapeHTML } from './securityUtils.js';
import { drawGoalHeatmap, drawFieldHeatmap, renderHeatmap, setCurrentHeatmapTab, setCurrentHeatmapContext, drawShotLines } from './heatmap.js';
import { spielstand, speichereSpielstand, getOpponentLabel, getMyTeamLabel } from './state.js';
import { getAuthUid, getCurrentUserProfile, isUserTrainer } from './firebase.js';


let inlineEditingIndex = null;
let inlineEditingIsOpp = null;

/**
 * Shared helper for 'No Game Active' state in Live views.
 */
function renderEmptyLiveState(container) {
    if (!container) return;
    container.innerHTML = sanitizeHTML(`
        <div class="empty-state-card">
            <div class="empty-state-icon-wrapper">
                <i data-lucide="play-circle" style="width: 64px; height: 64px; opacity: 0.5;"></i>
            </div>
            <h2 class="empty-state-title">Kein Spiel aktiv</h2>
            <p class="empty-state-text">Starten Sie ein neues Spiel im Bereich "Spiel", um Live-Statistiken und Analysen zu sehen.</p>
        </div>
    `);
    if (window.lucide) window.lucide.createIcons();
}

export function applyGameMode() {
    const isSimple = spielstand.gameMode === 'simple';
    document.body.classList.toggle('is-simple-mode', isSimple);
    document.body.classList.toggle('is-complex-mode', !isSimple);
    const spielBereich = document.getElementById('spielBereich');
    if (spielBereich) {
        spielBereich.classList.toggle('is-simple-mode', isSimple);
        spielBereich.classList.toggle('is-complex-mode', !isSimple);
    }
}

import {
    statistikSidebar, scoreAnzeige, scoreAnzeigeGegner,
    teamNameHeimDisplay, teamNameGegnerDisplay,
    heatmapHeimLabel, heatmapGegnerLabel,
    suspensionContainer,
    heimGoalkeeperRoster, heimActiveRoster, heimBenchRoster,
    gastGoalkeeperRoster, gastActiveRoster, gastBenchRoster,
    heimPanelTitle, gastPanelTitle,
    protokollAusgabe,
    rosterListe, wurfbildModal, wurfbilderContainer, wurfbilderStatsModal,
    gegnerNummerTitel, gegnerNummerModal, neueGegnerNummer, bekannteGegnerListe,
    aktionsMenueTitel, aktionsMenue, aktionVorauswahl,
    kommentarBereich, kommentarInput,
    playerNameInput, playerNumberInput, playerTorwartInput, editPlayerIndex, addPlayerForm, cancelEditButton,
    liveGameOverviewModal, liveOverviewStatsBody, liveOverviewStatsGegnerBody,
    liveOverviewHeatmapSvg, liveOverviewTabStats, liveOverviewTabHeatmap,
    liveOverviewContentStats, liveOverviewContentHeatmap, closeLiveGameOverview,
    liveOverviewSubTabTor, liveOverviewSubTabFeld, liveOverviewSubTabKombi,
    neueGegnerName, neueGegnerTorwart, teamHeaderTitle, teamToggle,
    deleteTeamButton, exportTeamButton, importTeamButton, saveTeamButton, loadTeamButton
} from './dom.js';
import { renderHomeStatsInHistory, renderOpponentStatsInHistory, openPlayerHistoryHeatmap, currentSort } from './sharedViews.js';

export let aktuellerWurfbildModus = 'standard';

export function applyTheme() {
    if (spielstand.settings.darkMode) document.body.classList.add('dark-mode');
    else document.body.classList.remove('dark-mode');

    const isAway = spielstand.settings.isAuswaertsspiel;
    const colorHeim = spielstand.settings.teamColor || '#dc3545';
    const colorGegner = spielstand.settings.teamColorGegner || '#2563eb';
    const ourColor = isAway ? colorGegner : colorHeim;
    const oppColor = isAway ? colorHeim : colorGegner;

    document.documentElement.style.setProperty('--btn-primary', ourColor);
    document.documentElement.style.setProperty('--team-primary-color', ourColor);
    document.documentElement.style.setProperty('--team-opponent-color', oppColor);
    document.documentElement.style.setProperty('--heim-color', colorHeim);
    document.documentElement.style.setProperty('--gegner-color', colorGegner);
}

export function applyViewSettings() {
    const isGameEnd = spielstand.timer.gamePhase === 5;
    if (spielstand.uiState === 'game' && isGameEnd) statistikSidebar.classList.remove('versteckt');
    else statistikSidebar.classList.add('versteckt');
}

export function initSidebarGroups() {
    const liveGroup = document.getElementById('nav-group-live');
    const isGameActive = spielstand.gameLog && spielstand.gameLog.length > 0;
    if (liveGroup) liveGroup.classList.toggle('collapsed', !isGameActive);
}

export function updateScoreDisplay() {
    const isAway = spielstand.settings.isAuswaertsspiel;
    if (scoreAnzeige && scoreAnzeigeGegner) {
        scoreAnzeige.textContent = spielstand.score.heim;
        scoreAnzeigeGegner.textContent = spielstand.score.gegner;
    }
    const heimName = spielstand.settings.teamNameHeim || 'Heim';
    const gegnerName = spielstand.settings.teamNameGegner || 'Gegner';
    if (teamNameHeimDisplay) teamNameHeimDisplay.textContent = heimName.toUpperCase();
    if (teamNameGegnerDisplay) teamNameGegnerDisplay.textContent = gegnerName.toUpperCase();
    if (heatmapHeimLabel) heatmapHeimLabel.textContent = heimName.toUpperCase();
    if (heatmapGegnerLabel) heatmapGegnerLabel.textContent = gegnerName.toUpperCase();
}

export function updateSuspensionDisplay() {
    if (!suspensionContainer) return;
    suspensionContainer.innerHTML = '';
    spielstand.activeSuspensions.forEach(s => {
        const div = document.createElement('div');
        div.className = `suspension-card ${s.type}`;
        const min = Math.floor(s.remaining / 60);
        const sec = s.remaining % 60;
        div.innerHTML = sanitizeHTML(`<div>#${escapeHTML(s.number)}</div><div class="suspension-time">${min}:${sec < 10 ? '0' + sec : sec}</div>`);
        suspensionContainer.appendChild(div);
    });
}

export function zeichneSpielerRaster() {
    const isSimple = spielstand.gameMode === 'simple';
    const isAway = spielstand.settings.isAuswaertsspiel;
    
    // Select containers
    [heimGoalkeeperRoster, heimActiveRoster, heimBenchRoster, gastGoalkeeperRoster, gastActiveRoster, gastBenchRoster].forEach(c => c && (c.innerHTML = ''));

    let heimPlayers = isAway ? (spielstand.knownOpponents || []) : (spielstand.roster || []);
    const gastPlayers = isAway ? (spielstand.roster || []) : (spielstand.knownOpponents || []);

    // Filter home team players to only those who confirmed (going) for the active game event
    const activeEvent = spielstand.aktivesSpielevent
        ? (spielstand.calendarEvents || []).find(e => e.id === spielstand.aktivesSpielevent)
        : null;

    if (activeEvent && activeEvent.responses) {
        const responses = activeEvent.responses;
        const rosterAssignments = spielstand.rosterAssignments || {};

        // Build a set of names that are "going"
        const goingNames = new Set();

        // Check responses by UID
        Object.entries(responses).forEach(([uid, resp]) => {
            if (resp && resp.status === 'going') {
                const assignedName = rosterAssignments[uid];
                if (assignedName) goingNames.add(assignedName.trim().toLowerCase());
                // Also accept by resp.name directly (manual entries)
                if (resp.name) goingNames.add(resp.name.trim().toLowerCase());
            }
        });

        // Also check default status: if event default is 'going', include everyone who hasn't explicitly declined
        const defaultGoing = activeEvent.rules?.defaultStatus === 'going';

        if (goingNames.size > 0 || defaultGoing) {
            // Filter the home team (not opponents)
            const homeKey = isAway ? 'knownOpponents' : 'roster';
            if (homeKey === 'roster') {
                heimPlayers = heimPlayers.filter(p => {
                    const pLower = (p.name || '').trim().toLowerCase();
                    // Include if explicitly going
                    if (goingNames.has(pLower)) return true;
                    // Include if default is going AND player hasn't declined
                    if (defaultGoing) {
                        const uid = Object.keys(rosterAssignments).find(u => (rosterAssignments[u] || '').trim().toLowerCase() === pLower);
                        const resp = uid ? responses[uid] : null;
                        // Only exclude if explicitly not-going or maybe
                        if (resp && (resp.status === 'not-going' || resp.status === 'maybe')) return false;
                        return true;
                    }
                    return false;
                });
            }
        }
    }

    const renderTeam = (players, teamKey, gkCont, actCont, benchCont) => {
        const isOpponent = teamKey === 'opponent';
        // Filter out inactive players
        const activePlayers = players.filter(p => p.isInactive !== true);

        activePlayers.forEach((p, idx) => {
            const actualIndexInList = players.findIndex(orig => orig === p);
            const btn = document.createElement('button');
            btn.className = `spieler-button action-btn ${p.isGoalkeeper ? 'torwart' : ''}`;
            const timeStr = `${Math.floor((p.timeOnField || 0) / 60)}:${((p.timeOnField || 0) % 60).toString().padStart(2, '0')}`;
            
            const numberDisplay = p.number ? `<div class="spieler-nummer-display">${p.number}</div>` : '';
            btn.innerHTML = sanitizeHTML(`<div class="player-time-display">${timeStr}</div>${numberDisplay}<span class="spieler-name-display">${escapeHTML(p.name || '')}</span>`);
            
            btn.dataset.index = actualIndexInList;
            if (isOpponent) {
                btn.dataset.gegnerNummer = p.number || '';
                btn.dataset.isOpponent = 'true';
            } else {
                btn.dataset.isOpponent = 'false';
            }
            btn.dataset.team = teamKey;
            btn.dataset.name = p.name || '';
            
            // Add classes for styling and identification
            btn.classList.add(teamKey === 'opponent' ? 'gegner-button' : 'my-team-btn');
            if (isSimple) btn.classList.add('simple-player-card');

            const isOnLineup = p.lineupSlot !== null && p.lineupSlot !== undefined;
            btn.dataset.action = (isSimple || isOnLineup) ? 'lineup-player' : 'bench-player';
            btn.dataset.empty = 'false';
            
            if (isOnLineup) {
                btn.dataset.slotType = p.lineupSlot === 'gk' ? 'gk' : 'field';
                btn.dataset.slotIndex = p.lineupSlot === 'gk' ? '' : p.lineupSlot;
            } else if (isSimple) {
                btn.dataset.slotType = 'field';
                btn.dataset.slotIndex = idx;
            }

            // Positioning logic
            if (isSimple) actCont.appendChild(btn);
            else if (p.lineupSlot === 'gk') gkCont.appendChild(btn);
            else if (typeof p.lineupSlot === 'number') actCont.appendChild(btn);
            else benchCont.appendChild(btn);
        });
    };

    renderTeam(heimPlayers, isAway ? 'opponent' : 'myteam', heimGoalkeeperRoster, heimActiveRoster, heimBenchRoster);
    renderTeam(gastPlayers, isAway ? 'myteam' : 'opponent', gastGoalkeeperRoster, gastActiveRoster, gastBenchRoster);
}

export function updateProtokollAnzeige() {
    if (!protokollAusgabe) return;
    try {
        protokollAusgabe.innerHTML = '';
        
        const protokollContent = document.getElementById('protokollWrapper');
        const emptyState = document.getElementById('protokollEmptyState');

        if (!spielstand.isSpielAktiv) {
            if (protokollContent) protokollContent.classList.add('versteckt');
            if (emptyState) {
                emptyState.classList.remove('versteckt');
                renderEmptyLiveState(emptyState);
            }
            return;
        }

        if (protokollContent) protokollContent.classList.remove('versteckt');
        if (emptyState) emptyState.classList.add('versteckt');

        if (!Array.isArray(spielstand.gameLog)) {
            console.warn('[UI] gameLog is not an array, resetting to empty.');
            spielstand.gameLog = [];
        }

        spielstand.gameLog.slice().reverse().forEach((e, i) => {
            if (!e) return;
            const div = document.createElement('div');
            div.className = 'log-entry';
            const num = e.playerId || e.gegnerNummer || '?';
            const name = e.playerName || (e.gegnerNummer ? `Gegner #${e.gegnerNummer}` : '');
            div.innerHTML = sanitizeHTML(`<span class="log-time">${e.time || '--:--'}</span><span class="log-text"><strong>#${num} ${name}</strong>: ${e.action || ''}</span>`);
            protokollAusgabe.appendChild(div);
        });
    } catch (err) {
        console.error('[UI] Failed to update Protokoll:', err);
    }
}

export function zeichneStatistikTabelle(statsData) {}

export function showLivePlayerDetails(stats) {
    customAlert(`Details für #${stats.number}: ${stats.tore} Tore, ${stats.assist} Assists`);
}

export function setInlineEditing(index, isOpp) {
    inlineEditingIndex = index;
    inlineEditingIsOpp = (isOpp === 'true' || isOpp === true);
    zeichneRosterListe(showGastTabState);
}

let showGastTabState = false;

export function zeichneRosterListe(showGastTab = false) {
    showGastTabState = showGastTab;
    if (!rosterListe) return;
    rosterListe.innerHTML = '';
    const isAway = spielstand.settings.isAuswaertsspiel;
    const isOpp = showGastTab ? !isAway : isAway;
    const list = isOpp ? (spielstand.knownOpponents || []) : (spielstand.roster || []);

    const uid = getAuthUid();
    const isTrainer = isUserTrainer();
    const currentUserRosterName = (uid && spielstand.rosterAssignments && spielstand.rosterAssignments[uid]) 
                                    ? spielstand.rosterAssignments[uid] 
                                    : null;

    // Available roles (easy to extend later)
    const AVAILABLE_ROLES = ['Spieler', 'Trainer', 'Betreuer', 'Kassenwart'];

    // Permissions for global actions
    const manageDisplay = isTrainer ? 'block' : 'none';
    if (deleteTeamButton) deleteTeamButton.style.display = manageDisplay;
    if (exportTeamButton) exportTeamButton.style.display = manageDisplay;
    if (importTeamButton) importTeamButton.style.display = manageDisplay;
    if (saveTeamButton) saveTeamButton.style.display = manageDisplay;
    if (loadTeamButton) loadTeamButton.style.display = manageDisplay;

    // Cache the set of assigned names for quick lookup
    const assignedNames = new Set(Object.values(spielstand.rosterAssignments || {}));

    list.forEach((p, idx) => {
        const div = document.createElement('div');
        div.className = 'roster-player-card';
        
        const isEditing = (inlineEditingIndex === idx && inlineEditingIsOpp === isOpp);

        if (isEditing) {
            div.classList.add('is-editing');
            const playerRoles = p.roles || ['Spieler'];
            const roleCheckboxesHtml = !isOpp ? `
                <div style="margin-top: 8px;">
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 4px;">Rollen</div>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        ${AVAILABLE_ROLES.map(role => `
                            <label style="font-size: 0.8rem; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                                <input type="checkbox" class="inline-edit-role" value="${escapeHTML(role)}" ${playerRoles.includes(role) ? 'checked' : ''} style="accent-color: var(--btn-primary);">
                                ${escapeHTML(role)}
                            </label>
                        `).join('')}
                    </div>
                </div>
            ` : '';
            div.innerHTML = sanitizeHTML(`
                <div class="roster-player-info" style="flex-direction: column; align-items: flex-start; gap: 8px;">
                    <div style="display: flex; gap: 8px; width: 100%;">
                        <input type="number" class="inline-edit-number" value="${p.number || ''}" title="Rückennummer" placeholder="#">
                        <input type="text" class="inline-edit-name" value="${escapeHTML(p.name || '')}" placeholder="Spielername">
                    </div>
                    <input type="email" class="inline-edit-email" value="${escapeHTML(p.email || '')}" placeholder="E-Mail für Verknüpfung">
                    ${roleCheckboxesHtml}
                </div>
                <div style="display: flex; align-items: center; gap: 8px; margin: 8px 0; padding: 0 4px;">
                    <label style="font-size: 0.75rem; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 6px;">
                        <input type="checkbox" class="inline-edit-inactive" ${p.isInactive ? 'checked' : ''} style="accent-color: var(--btn-primary);">
                        Inaktiv im Spielbetrieb
                    </label>
                </div>
                <div class="roster-player-actions">
                    <button class="shadcn-btn-outline" data-action="save-inline-edit" data-index="${idx}" data-is-opponent="${isOpp}" style="color: #10b981; border-color: #10b981; padding: 4px;" title="Speichern"><i data-lucide="check" style="width: 14px; height: 14px;"></i></button>
                    <button class="shadcn-btn-outline" data-action="cancel-inline-edit" style="color: #ef4444; border-color: #ef4444; padding: 4px;" title="Abbrechen"><i data-lucide="x" style="width: 14px; height: 14px;"></i></button>
                </div>
            `);
        } else {
            // Check permissions
            const canEdit = isOpp ? isTrainer : (isTrainer || p.name === currentUserRosterName);
            const canDelete = isTrainer;

            let actionsHtml = '';
            if (canEdit) {
                actionsHtml += `<button class="edit-player shadcn-btn-outline" data-action="edit-player" data-index="${idx}" data-is-opponent="${isOpp}" style="padding: 4px; margin-right: 4px;" title="Bearbeiten"><i data-lucide="edit-2" style="width: 14px; height: 14px;"></i></button>`;
            }
            if (canDelete) {
                actionsHtml += `<button class="delete-player shadcn-btn-outline" data-action="delete-player" data-index="${idx}" data-is-opponent="${isOpp}" style="padding: 4px; color: #ef4444; border-color: #ef4444;" title="Löschen"><i data-lucide="trash-2" style="width: 14px; height: 14px;"></i></button>`;
            }

            const isInactive = p.isInactive === true;
            div.style.opacity = isInactive ? '0.6' : '1';
            if (isInactive) div.title = 'Inaktiv im Spielbetrieb';

            const numDisplay = p.number ? `#${p.number}` : '';
            
            div.innerHTML = sanitizeHTML(`
                <div class="roster-player-info">
                    <div class="roster-player-number ${!p.number ? 'is-empty' : ''}">${p.number || '-'}</div>
                    <div style="display: flex; flex-direction: column; gap: 2px;">
                        <div style="font-weight: 600;">${escapeHTML(p.name || 'Ohne Name')}</div>
                        ${!isOpp && (p.roles && p.roles.length) ? `
                            <div class="player-role-badges">
                                ${p.roles.map(r => `<span class="role-badge ${r === 'Trainer' ? 'role-badge--trainer' : r === 'Betreuer' ? 'role-badge--betreuer' : r === 'Kassenwart' ? 'role-badge--kassenwart' : ''} ">${escapeHTML(r)}</span>`).join('')}
                            </div>
                        ` : ''}
                        ${isInactive ? '<div style="font-size: 0.65rem; color: #ef4444; font-weight: 700;">INAKTIV (SPIEL)</div>' : ''}
                    </div>
                </div>
                <div class="roster-player-actions">${actionsHtml}</div>
                ${!isOpp ? `
                    <div class="account-marker ${p.email || Array.from(assignedNames).some(name => (name || '').trim().toLowerCase() === (p.name || '').trim().toLowerCase()) ? 'linked' : 'not-linked'}" 
                         title="${p.email || Array.from(assignedNames).some(name => (name || '').trim().toLowerCase() === (p.name || '').trim().toLowerCase()) ? 'Konto verknüpft / E-Mail hinterlegt' : 'Kein Konto verknüpft'}"></div>
                ` : ''}
            `);
        }
        rosterListe.appendChild(div);
    });

    if (window.lucide) window.lucide.createIcons();
}

export function oeffneWurfbildModal(modus) {
    aktuellerWurfbildModus = modus;
    wurfbildModal.classList.remove('versteckt');
}

export function schliesseWurfbildModal() {
    wurfbildModal.classList.add('versteckt');
}

export function zeigeWurfstatistik() { wurfbilderStatsModal.classList.remove('versteckt'); }

export function oeffneGegnerNummerModal(type) {
    gegnerNummerModal.classList.remove('versteckt');
    neueGegnerNummer.value = '';
    neueGegnerNummer.focus();
}

export function renderGegnerButtons() {
    if (bekannteGegnerListe) {
        bekannteGegnerListe.innerHTML = spielstand.knownOpponents.map(o => `<button class="gegner-num-btn" data-nummer="${o.number}">#${o.number}</button>`).join('');
    }
}

export function renderActionMenus(isGoalkeeper) {
    if (!aktionsMenue) return;
    const body = aktionsMenue.querySelector('.shadcn-modal-body');
    const actions = isGoalkeeper ? ['Parade', 'TG Pass', 'Fehlpass', 'Anderes'] : ['Tor', 'Fehlwurf', '7m', 'Anderes'];
    body.innerHTML = actions.map(a => `<button class="shadcn-btn-outline" data-action="game-btn" data-type="${a}">${a}</button>`).join('');
}

export function oeffneAktionsMenueUI(index, pOverride = null) {
    const p = pOverride || spielstand.roster[index];
    renderActionMenus(p.isGoalkeeper);
    aktionsMenue.classList.remove('versteckt');
}

export function schliesseAktionsMenueUI() { aktionsMenue.classList.add('versteckt'); }

export function oeffneEditModusUI(index) {
    const p = spielstand.roster[index];
    playerNameInput.value = p.name;
    playerNumberInput.value = p.number;
    editPlayerIndex.value = index;
    addPlayerForm.querySelector('button[type="submit"]').textContent = 'Speichern';
    cancelEditButton.classList.remove('versteckt');
}

export function schliesseEditModusUI() {
    playerNameInput.value = '';
    playerNumberInput.value = '';
    editPlayerIndex.value = '';
    addPlayerForm.querySelector('button[type="submit"]').textContent = 'Hinzufügen';
    cancelEditButton.classList.add('versteckt');
}

export function showLiveGameOverview() { liveGameOverviewModal.classList.remove('versteckt'); }

export function startButtonAnimation(btn) {
    btn.classList.add('active-action');
    setTimeout(() => btn.classList.remove('active-action'), 200);
}

/**
 * Renders the live overview with score, playtypes, and tables.
 */
export async function showLiveOverviewInline() {
    const { liveOverviewBereich, liveOverviewContent, timerAnzeige } = await import('./dom.js');
    const { berechneStatistiken, berechneGegnerStatistiken, berechneSpielartStatistik } = await import('./stats.js');
    const { setCurrentHeatmapContext } = await import('./heatmap.js');

    if (liveOverviewBereich) liveOverviewBereich.classList.remove('versteckt');
    
    const emptyState = document.getElementById('liveOverviewEmptyState');

    if (!spielstand.isSpielAktiv) {
        if (liveOverviewContent) liveOverviewContent.classList.add('versteckt');
        if (emptyState) {
            emptyState.classList.remove('versteckt');
            renderEmptyLiveState(emptyState);
        }
        return;
    }
    
    if (liveOverviewContent) liveOverviewContent.classList.remove('versteckt');
    if (emptyState) emptyState.classList.add('versteckt');

    const homeStats = berechneStatistiken(spielstand.gameLog, spielstand.roster);
    const opponentStats = berechneGegnerStatistiken(spielstand.gameLog, spielstand.knownOpponents);
    const isAway = spielstand.settings?.isAuswaertsspiel || false;
    const homeName = spielstand.settings?.teamNameHeim || 'Heim';
    const oppName = spielstand.settings?.teamNameGegner || 'Gegner';

    let html = `<div class="live-overview-container">
        <div class="stats-card score-card">
            <div class="score-display">
                <div class="score-team"><span class="team-name">${escapeHTML(isAway ? oppName : homeName)}</span><span class="team-score">${isAway ? spielstand.score.gegner : spielstand.score.heim}</span></div>
                <span class="score-separator">:</span>
                <div class="score-team"><span class="team-name">${escapeHTML(isAway ? homeName : oppName)}</span><span class="team-score">${isAway ? spielstand.score.heim : spielstand.score.gegner}</span></div>
            </div>
            <div style="margin-top: 10px; font-weight: 500; color: var(--text-muted);">Spielzeit: ${timerAnzeige?.textContent || '00:00'}</div>
        </div>`;

    const spielart = berechneSpielartStatistik(spielstand.gameLog);
    const renderPT = (data, title) => {
        const items = Object.entries(data).filter(([k, s]) => s.wuerfe > 0);
        if (items.length === 0) return '';
        return `<div class="stats-card playtype-card"><h2 class="card-title">${escapeHTML(title)}</h2><div class="playtype-stats-grid">
            ${items.map(([k, s]) => `<div class="playtype-stat-item"><span class="playtype-name">${escapeHTML(s.name)}</span><span class="playtype-data">${s.tore}/${s.wuerfe}</span><span class="playtype-quote">${s.quote}%</span></div>`).join('')}
        </div></div>`;
    };
    html += renderPT(spielart.heim, `Angriffsvarianten (${homeName})`);
    html += renderPT(spielart.gegner, `Angriffsvarianten (${oppName})`);

    const renderTbl = (name, id) => `<div class="stats-card"><h2 class="card-title">${escapeHTML(name)}</h2><div class="table-container"><table class="modern-stats-table">
        <thead><tr>
            <th data-sort="name">Spieler</th>
            <th data-sort="timeOnField">Zeit</th>
            <th data-sort="tore">Tore</th>
            <th data-sort="feldtore">Feld</th>
            <th data-sort="assist">Ast</th>
            <th data-sort="siebenMeter">7m</th>
            <th data-sort="fehlwurf">FW</th>
            <th data-sort="quote">Quote</th>
            <th data-sort="guteAktion">GA</th>
            <th data-sort="ballverlust">BV</th>
            <th data-sort="stuermerfoul">SF</th>
            <th data-sort="block">Blk</th>
            <th data-sort="gewonnen1v1">1v1+</th>
            <th data-sort="rausgeholt7m">7m+</th>
            <th data-sort="rausgeholt2min">2m+</th>
            <th data-sort="gelb">G</th>
            <th data-sort="zweiMinuten">2m</th>
            <th data-sort="rot">R</th>
            <th>Wurf</th>
        </tr></thead>
        <tbody id="${id}"></tbody></table></div></div>`;

    html += isAway ? (renderTbl(oppName, 'liveStatsOpp') + renderTbl(homeName, 'liveStatsHome')) : (renderTbl(homeName, 'liveStatsHome') + renderTbl(oppName, 'liveStatsOpp'));
    html += '</div>';

    if (liveOverviewContent) {
        liveOverviewContent.innerHTML = sanitizeHTML(html);
        if (window.lucide) window.lucide.createIcons();

        // Apply sort indicators to headers
        if (currentSort && currentSort.column) {
            const ths = liveOverviewContent.querySelectorAll(`th[data-sort="${currentSort.column}"]`);
            ths.forEach(th => th.classList.add(currentSort.direction === 'asc' ? 'sorted-asc' : 'sorted-desc'));
        }

        renderHomeStatsInHistory(document.getElementById('liveStatsHome'), homeStats, spielstand.gameLog, true);
        renderOpponentStatsInHistory(document.getElementById('liveStatsOpp'), opponentStats, spielstand.gameLog, true);
    }
    setCurrentHeatmapContext('liveOverview');
}

/**
 * Renders individual shot charts for all players.
 */
export async function showShotsInline() {
    const { shotsBereich, shotsContent } = await import('./dom.js');
    const { berechneWurfbilder } = await import('./stats.js');
    const { drawFieldHeatmap, drawGoalHeatmap, drawShotLines } = await import('./heatmap.js');

    if (shotsBereich) shotsBereich.classList.remove('versteckt');
    if (!shotsContent) return;
    
    const emptyState = document.getElementById('shotsEmptyState');

    if (!spielstand.isSpielAktiv) {
        shotsContent.classList.add('versteckt');
        if (emptyState) {
            emptyState.classList.remove('versteckt');
            renderEmptyLiveState(emptyState);
        }
        return;
    }
    
    shotsContent.classList.remove('versteckt');
    if (emptyState) emptyState.classList.add('versteckt');

    const wurfbilder = berechneWurfbilder(spielstand.gameLog, spielstand.roster);
    shotsContent.innerHTML = '';

    const renderPlayerGroup = (p, is7m = false) => {
        const div = document.createElement('div');
        div.className = 'player-shot-card';
        div.innerHTML = `<div class="player-shot-info"><strong>#${p.number} ${escapeHTML(p.name)}</strong>${is7m ? ' (7m)' : ''}</div>`;
        
        const prefix = 'wb_' + (p.number || '0') + (p.isOpponent ? 'opp' : 'hm') + (is7m ? '7m' : '');
        const pointsTor = p.wuerfe.filter(w => w.x && w.y).map(w => ({ ...w, x: parseFloat(w.x), y: parseFloat(w.y), isOpponent: p.isOpponent }));
        const pointsFeld = p.wuerfe.filter(w => w.wurfposition).map(w => ({ ...w, x: parseFloat(w.wurfposition.x), y: parseFloat(w.wurfposition.y), isOpponent: p.isOpponent }));

        if (pointsTor.length > 0 || pointsFeld.length > 0) {
            const scaleGoal = 0.35, xOffsetGoal = 97.5, yOffsetGoal = 24, yOffsetField = 80;
            const linePts = p.wuerfe.filter(w => w.x && w.y && w.wurfposition).map(w => ({ isOpponent: p.isOpponent, pos: w.wurfposition, gx: parseFloat(w.x), gy: parseFloat(w.y) }));
            div.innerHTML += `<div class="shot-visual-container"><svg viewBox="0 0 300 500" width="200" height="350">
                ${drawFieldHeatmap(pointsFeld, yOffsetField, prefix)}
                ${drawShotLines(linePts, xOffsetGoal, yOffsetGoal, scaleGoal, yOffsetField)}
                <g transform="translate(${xOffsetGoal}, ${yOffsetGoal}) scale(${scaleGoal})">${drawGoalHeatmap(pointsTor, 0, prefix)}</g>
             </svg></div>`;
        }
        return div;
    };

    ['heim', 'heim7m', 'gegner', 'gegner7m'].forEach(key => {
        if (wurfbilder[key].length > 0) {
            const h3 = document.createElement('h3');
            h3.className = 'shot-section-title';
            h3.textContent = (key.includes('heim') ? (spielstand.settings.teamNameHeim || 'Heim') : (spielstand.settings.teamNameGegner || 'Gegner')) + (key.includes('7m') ? ' - 7m' : '');
            shotsContent.appendChild(h3);
            wurfbilder[key].forEach(p => shotsContent.appendChild(renderPlayerGroup(p, key.includes('7m'))));
        }
    });
}

/**
 * Renders the live interactive heatmap view.
 */
export async function showLiveHeatmapInline() {
    const { liveHeatmapBereich, heatmapHeimLabel, heatmapGegnerLabel, heatmapTeamToggle, heatmapPlayerSelect, heatmapSvg } = await import('./dom.js');
    const { renderHeatmap, setCurrentHeatmapContext } = await import('./heatmap.js');

    if (liveHeatmapBereich) liveHeatmapBereich.classList.remove('versteckt');
    
    const heatmapContent = document.getElementById('heatmapContent');
    const emptyState = document.getElementById('heatmapEmptyState');

    if (!spielstand.isSpielAktiv) {
        if (heatmapContent) heatmapContent.classList.add('versteckt');
        if (emptyState) {
            emptyState.classList.remove('versteckt');
            renderEmptyLiveState(emptyState);
        }
        return;
    }
    
    if (heatmapContent) heatmapContent.classList.remove('versteckt');
    if (emptyState) emptyState.classList.add('versteckt');

    if (heatmapHeimLabel) heatmapHeimLabel.textContent = spielstand.settings.teamNameHeim || 'HEIM';
    if (heatmapGegnerLabel) heatmapGegnerLabel.textContent = spielstand.settings.teamNameGegner || 'GEGNER';

    const getSelectedTeam = () => (heatmapTeamToggle?.dataset.state === 'checked' ? 'gegner' : 'heim');
    updateHeatmapPlayerSelect();
    setCurrentHeatmapContext(null);
    renderHeatmap(heatmapSvg, spielstand.gameLog, false, {
        team: getSelectedTeam(),
        player: (heatmapPlayerSelect && heatmapPlayerSelect.value !== 'all') ? parseInt(heatmapPlayerSelect.value) : null
    });
}

/**
 * Updates the player select dropdown for the live heatmap.
 */
export function updateHeatmapPlayerSelect() {
    const heatmapTeamToggle = document.getElementById('heatmapTeamToggle');
    const heatmapPlayerSelect = document.getElementById('heatmapPlayerSelect');
    if (!heatmapPlayerSelect || !heatmapTeamToggle) return;

    const side = heatmapTeamToggle.dataset.state === 'checked' ? 'gegner' : 'heim';
    const isAway = spielstand.settings.isAuswaertsspiel;
    const list = (side === 'heim') ? (isAway ? (spielstand.knownOpponents || []) : (spielstand.roster || []))
                                   : (isAway ? (spielstand.roster || []) : (spielstand.knownOpponents || []));

    heatmapPlayerSelect.innerHTML = '<option value="all">Alle Spieler</option>' + 
        list.map(p => `<option value="${p.number}">#${p.number} ${escapeHTML(p.name)}</option>`).join('');
}
