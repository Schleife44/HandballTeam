// modules/historyView.js
// Game History View and related functions

import { spielstand, speichereSpielstand } from './state.js';
import {
    rosterBereich, historieBereich, historieDetailBereich,
    historieListe, histDetailTeams, histDetailScore, histDetailDate,
    histStatsBody, histStatsGegnerBody, heatmapModal, heatmapSvg,
    histHeatmapSvg, histContentHeatmap, histSubTabTor, histSubTabFeld, histSubTabKombi,
    histHeatmapToreFilter, histHeatmapMissedFilter
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
    const games = getHistorie();

    if (games.length === 0) {
        historieListe.innerHTML = '<p style="text-align:center; padding:20px;">Keine gespeicherten Spiele.</p>';
        return;
    }

    games.forEach(game => {
        const div = document.createElement('div');
        div.className = 'history-card';
        div.style.cssText = 'background: #2c3036; padding: 15px; margin-bottom: 10px; border-radius: 8px; cursor: pointer; display: flex; justify-content: space-between; align-items: center;';

        const date = new Date(game.date).toLocaleDateString() + ' ' + new Date(game.date).toLocaleTimeString();
        div.innerHTML = `
            <div>
                <strong style="color: #61dafb; font-size: 1.1em;">${game.teams.heim} vs ${game.teams.gegner}</strong>
                <div style="font-size: 0.9em; color: #aaa;">${date}</div>
            </div>
            <div style="text-align: right; display: flex; gap: 8px; align-items: center;">
                <span style="font-size: 1.5em; font-weight: bold; margin-right: 10px;">${game.score.heim}:${game.score.gegner}</span>
                <button class="export-pdf-btn" data-id="${game.id}" style="background: #28a745; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;" title="Als PDF exportieren">📄</button>
                <button class="export-history-btn" data-id="${game.id}" style="background: #17a2b8; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;" title="Als JSON exportieren">📥</button>
                <button class="delete-history-btn" data-id="${game.id}" style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;" title="Löschen">🗑️</button>
            </div>
        `;

        div.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-history-btn')) return;
            if (e.target.classList.contains('export-history-btn')) return;
            if (e.target.classList.contains('export-pdf-btn')) return;
            openHistoryDetail(game);
        });

        // Export PDF Button
        div.querySelector('.export-pdf-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            exportiereHistorieAlsPdf(game);
        });

        // Export JSON Button
        div.querySelector('.export-history-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            exportiereEinzelnesSpiel(game);
        });

        // Delete Button
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
export function renderHomeStatsInHistory(tbody, statsData, gameLog) {
    tbody.innerHTML = '';
    const toreMap = berechneTore(gameLog);

    statsData.forEach(stats => {
        const goals = toreMap.get(stats.number) || 0;
        const sevenMGoals = stats.siebenMeterTore || 0;
        const feldtore = goals - sevenMGoals;

        const totalAttempts = goals + stats.fehlwurf;
        const quote = totalAttempts > 0 ? Math.round((goals / totalAttempts) * 100) + '%' : '-';
        const sevenMDisplay = (stats.siebenMeterVersuche > 0) ? `${stats.siebenMeterTore}/${stats.siebenMeterVersuche}` : "0/0";

        // Check for heatmap data
        // Filter log for this player
        const playerLog = gameLog.filter(e => (e.playerId === stats.number || e.number === stats.number) && !e.action.startsWith('Gegner'));
        const hasField = playerLog.some(e => !e.action.includes('7m'));
        const has7m = playerLog.some(e => e.action.includes('7m'));

        let buttonsHtml = '';
        if (hasField) buttonsHtml += `<button class="heatmap-btn" data-mode="field" style="padding: 2px 8px; font-size: 0.8rem;">🎯</button>`;
        if (has7m) buttonsHtml += `<button class="heatmap-btn" data-mode="7m" style="padding: 2px 5px; font-size: 0.7rem; margin-left: 2px;">7m</button>`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${stats.number} ${stats.name}</td>
            <td>${goals}</td>
            <td>${feldtore}</td>
            <td>${sevenMDisplay}</td>
            <td>${quote}</td>
            <td>${stats.guteAktion}</td>
            <td>${stats.fehlwurf}</td>
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
                openPlayerHistoryHeatmap(gameLog, stats.number, 'heim', stats.name, mode);
            });
        });

        tbody.appendChild(tr);
    });
}

// --- Render Opponent Stats in History ---
export function renderOpponentStatsInHistory(tbody, statsData, gameLog) {
    tbody.innerHTML = '';
    statsData.forEach(stats => {
        const goals = stats.tore || 0;
        const sevenMGoals = stats.siebenMeterTore || 0;
        const feldtore = goals - sevenMGoals;

        const totalAttempts = goals + stats.fehlwurf;
        const quote = totalAttempts > 0 ? Math.round((goals / totalAttempts) * 100) + '%' : '-';
        const sevenMDisplay = (stats.siebenMeterVersuche > 0) ? `${stats.siebenMeterTore}/${stats.siebenMeterVersuche}` : "0/0";

        // Filter log for this opponent
        // Opponent entries have action starting with 'Gegner' or 'gegnerNummer'
        const playerLog = gameLog.filter(e => {
            const isOpp = e.action.startsWith('Gegner') || e.gegnerNummer
                || e.action.startsWith('Gegner 7m') || e.action === 'Gegner Tor' || e.action === 'Gegner Wurf Vorbei';
            // Check mapping (names match? or numbers?)
            // Usually stats has name.
            if (!isOpp) return false;
            // stats.name is the key.
            // gameLog might not have gegnerName consistently.
            // But stats.number might be available if we extracted it.
            // For now, simpler check: if we have stats, we assume we have log?
            // statsData comes from berechneGegnerStatistiken.
            return true; // Simplified for heatmap availability check generally, but need refinement for button splitting
        });

        // Actually berechneGegnerStatistiken groups by name/number.
        // We can check if *any* opponent action matches. 
        // Just show buttons if they have any stats?
        // Let's refine:
        // stats has 'siebenMeterVersuche'.
        const has7m = stats.siebenMeterVersuche > 0;
        const hasField = (goals + stats.fehlwurf) > stats.siebenMeterVersuche; // Rough approximation

        let buttonsHtml = '';
        if (hasField || goals > 0) buttonsHtml += `<button class="heatmap-btn" data-mode="field" style="padding: 2px 8px; font-size: 0.8rem;">🎯</button>`;
        if (has7m) buttonsHtml += `<button class="heatmap-btn" data-mode="7m" style="padding: 2px 5px; font-size: 0.7rem; margin-left: 2px;">7m</button>`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${stats.name}</td>
            <td>${goals}</td>
            <td>${feldtore}</td>
            <td>${sevenMDisplay}</td>
            <td>${quote}</td>
            <td>${stats.guteAktion}</td>
            <td>${stats.fehlwurf}</td>
            <td>${stats.techFehler}</td>
            <td>${stats.techFehler}</td>
            <td>${stats.zweiMinuten}</td>
            <td>${stats.rot}</td>
            <td>${buttonsHtml}</td>
        `;

        const btns = tr.querySelectorAll('.heatmap-btn');
        btns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const num = (stats.number && stats.number !== '?') ? stats.number : null;
                const mode = btn.dataset.mode;
                openPlayerHistoryHeatmap(gameLog, num, 'gegner', stats.name, mode);
            });
        });

        tbody.appendChild(tr);
    });
}

// --- Open Player History Heatmap ---
// --- Open Player History Heatmap ---
export function openPlayerHistoryHeatmap(gameLog, identifier, team, playerName, mode = 'field') {
    heatmapModal.classList.remove('versteckt');

    // Remove existing title if any (copied from seasonView logic)
    const existingTitle = heatmapModal.querySelector('h3');
    if (existingTitle && existingTitle.id !== 'wurfbildTitel') existingTitle.remove();
    const defaultTitle = document.getElementById('wurfbildTitel');
    if (defaultTitle) defaultTitle.style.display = 'none';

    // Custom Title
    const titleText = mode === '7m' ? `7m Grafik - ${playerName}` : `Wurfbild - ${playerName}`;
    const customTitle = document.createElement('h3');
    customTitle.textContent = titleText;
    customTitle.style.cssText = 'text-align: center; margin-bottom: 10px; color: var(--text-main);';
    customTitle.className = 'history-heatmap-title';

    const content = heatmapModal.querySelector('.modal-content');
    if (content) content.insertBefore(customTitle, content.firstChild);

    // Filter Logic
    const filterContainer = heatmapModal.querySelector('.heatmap-filter');
    if (filterContainer) filterContainer.classList.add('versteckt'); // Hide team toggles but goal/miss handled by modification to heatmap.js?
    // Wait, heatmap.js hides PARENT LABELS now, but KEEPS CONTAINER.
    // So we should NOT add 'versteckt' to the container here if we want filtering.
    // The previous implementation used 'versteckt'. 
    // We should rely on heatmap.js new logic?
    // BUT heatmap.js new logic applies if currentHeatmapContext is set.
    // So distinct handling here might interfere. 
    // Let's remove the forced hiding here and rely on heatmap.js or manual hiding of team toggles.

    // Actually, update cleanup to restore title
    const cleanup = () => {
        if (defaultTitle) defaultTitle.style.display = 'block';
        const ct = heatmapModal.querySelector('.history-heatmap-title');
        if (ct) ct.remove();

        // Restore tabs
        const tabsContainer = heatmapModal.querySelector('.heatmap-tabs');
        if (tabsContainer) tabsContainer.style.display = '';

        // Restore filter container (if we hide it)
        if (filterContainer) {
            filterContainer.classList.remove('versteckt');
            const labels = filterContainer.querySelectorAll('label');
            labels.forEach(l => l.style.display = '');
        }
    };

    const closeButton = document.getElementById('closeHeatmapModal');
    if (closeButton) {
        closeButton.addEventListener('click', cleanup, { once: true });
    }

    // Filter the log based on mode
    let filteredLog = gameLog;
    if (mode === '7m') {
        filteredLog = gameLog.filter(e => e.action.includes('7m'));
        const tabsContainer = heatmapModal.querySelector('.heatmap-tabs');
        if (tabsContainer) tabsContainer.style.display = 'none';
        setCurrentHeatmapTab('tor');
    } else {
        filteredLog = gameLog.filter(e => !e.action.includes('7m'));
        setCurrentHeatmapTab('tor');
    }

    setCurrentHeatmapContext({
        log: filteredLog,
        filter: {
            team: team,
            player: identifier
        }
    });

    renderHeatmap(heatmapSvg, filteredLog, false, { team, player: identifier });
}

// --- Open History Detail ---
export function openHistoryDetail(game) {
    historieBereich.classList.add('versteckt');
    historieDetailBereich.classList.remove('versteckt');

    histDetailTeams.textContent = `${game.teams.heim} vs ${game.teams.gegner}`;
    histDetailScore.textContent = `${game.score.heim}:${game.score.gegner}`;
    histDetailDate.textContent = new Date(game.date).toLocaleString();

    const homeStats = berechneStatistiken(game.gameLog, game.roster);
    const opponentStats = berechneGegnerStatistiken(game.gameLog);

    renderHomeStatsInHistory(histStatsBody, homeStats, game.gameLog);
    renderOpponentStatsInHistory(histStatsGegnerBody, opponentStats, game.gameLog);

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
