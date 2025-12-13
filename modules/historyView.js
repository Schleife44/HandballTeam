// modules/historyView.js
// Game History View and related functions

import { spielstand, speichereSpielstand } from './state.js';
import {
    rosterBereich, historieBereich, historieDetailBereich,
    historieListe, histDetailTeams, histDetailScore, histDetailDate,
    histStatsBody, histStatsGegnerBody, heatmapModal, heatmapSvg,
    histHeatmapSvg, histContentHeatmap, histSubTabTor, histSubTabFeld, histSubTabKombi
} from './dom.js';
import { berechneStatistiken, berechneGegnerStatistiken, berechneTore } from './stats.js';
import { speichereSpielInHistorie, getHistorie, loescheSpielAusHistorie } from './history.js';
import { renderHeatmap, setCurrentHeatmapContext, setCurrentHeatmapTab, currentHeatmapTab } from './heatmap.js';
import { customConfirm, customAlert } from './customDialog.js';

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
                <button class="export-history-btn" data-id="${game.id}" style="background: #17a2b8; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;" title="Exportieren">📥</button>
                <button class="delete-history-btn" data-id="${game.id}" style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;" title="Löschen">🗑️</button>
            </div>
        `;

        div.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-history-btn')) return;
            if (e.target.classList.contains('export-history-btn')) return;
            openHistoryDetail(game);
        });

        // Export Button
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
        const totalAttempts = goals + stats.fehlwurf;
        const quote = totalAttempts > 0 ? Math.round((goals / totalAttempts) * 100) + '%' : '-';
        const sevenMDisplay = (stats.siebenMeterVersuche > 0) ? `${stats.siebenMeterTore}/${stats.siebenMeterVersuche}` : "0/0";

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${stats.number} ${stats.name}</td>
            <td>${goals}</td>
            <td>${sevenMDisplay}</td>
            <td>${quote}</td>
            <td>${stats.guteAktion}</td>
            <td>${stats.fehlwurf}</td>
            <td>${stats.techFehler}</td>
            <td>${stats.gelb}</td>
            <td>${stats.zweiMinuten}</td>
            <td>${stats.rot}</td>
            <td><button class="heatmap-btn" style="padding: 2px 8px; font-size: 0.8rem;">🎯</button></td>
        `;

        const btn = tr.querySelector('.heatmap-btn');
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            openPlayerHistoryHeatmap(gameLog, stats.number, 'heim', stats.name);
        });

        tbody.appendChild(tr);
    });
}

// --- Render Opponent Stats in History ---
export function renderOpponentStatsInHistory(tbody, statsData, gameLog) {
    tbody.innerHTML = '';
    statsData.forEach(stats => {
        const goals = stats.tore || 0;
        const totalAttempts = goals + stats.fehlwurf;
        const quote = totalAttempts > 0 ? Math.round((goals / totalAttempts) * 100) + '%' : '-';
        const sevenMDisplay = (stats.siebenMeterVersuche > 0) ? `${stats.siebenMeterTore}/${stats.siebenMeterVersuche}` : "0/0";

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${stats.name}</td>
            <td>${goals}</td>
            <td>${sevenMDisplay}</td>
            <td>${quote}</td>
            <td>${stats.guteAktion}</td>
            <td>${stats.fehlwurf}</td>
            <td>${stats.techFehler}</td>
            <td>${stats.techFehler}</td>
            <td>${stats.zweiMinuten}</td>
            <td>${stats.rot}</td>
            <td><button class="heatmap-btn" style="padding: 2px 8px; font-size: 0.8rem;">🎯</button></td>
        `;

        const btn = tr.querySelector('.heatmap-btn');
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const num = (stats.number && stats.number !== '?') ? stats.number : null;
            openPlayerHistoryHeatmap(gameLog, num, 'gegner', stats.name);
        });

        tbody.appendChild(tr);
    });
}

// --- Open Player History Heatmap ---
export function openPlayerHistoryHeatmap(gameLog, identifier, team, playerName) {
    heatmapModal.classList.remove('versteckt');

    const filterContainer = heatmapModal.querySelector('.heatmap-filter');
    if (filterContainer) filterContainer.classList.add('versteckt');

    setCurrentHeatmapContext({
        log: gameLog,
        filter: {
            team: team,
            player: identifier
        }
    });

    renderHeatmap(heatmapSvg, gameLog, false, { team, player: identifier });
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
