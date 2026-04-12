import { berechneTore } from './stats.js';
import { sanitizeHTML, escapeHTML } from './securityUtils.js';
import { spielstand } from './state.js';
import {
    histTabProtokoll, histTabTorfolge, histTabHeatmap,
    histContentHeatmap, histContentProtokoll, histContentTorfolge,
    histHeatmapPlayerSelect, histHeatmapSvg
} from './dom.js';
import { setCurrentHeatmapTab, setCurrentHeatmapContext } from './heatmap.js';

export let currentSort = {
    column: 'number',
    direction: 'asc'
};

/**
 * Shared rendering of the team's statistics table rows (for both History and Live views).
 */
export function renderHomeStatsInHistory(tbody, statsData, gameLog, isLive = false, stayInHeatmap = false, renderBound = null, onRowClick = null) {
    if (onRowClick) isLive = true; 
    tbody.innerHTML = '';
    const toreMap = berechneTore(gameLog);

    // Apply Sorting
    const sortedData = sortStatsData([...statsData], currentSort.column, currentSort.direction, toreMap);

    sortedData.forEach(stats => {
        const fieldGoals = toreMap.get(stats.number) || 0;
        const sevenMGoals = stats.siebenMeterTore || 0;
        const goals = fieldGoals + sevenMGoals; 
        const feldtore = fieldGoals;
        const fieldAttempts = fieldGoals + stats.fehlwurf;
        const quote = fieldAttempts > 0 ? Math.round((fieldGoals / fieldAttempts) * 100) + '%' : '-';
        const sevenMDisplay = (stats.siebenMeterVersuche > 0) ? `${stats.siebenMeterTore}/${stats.siebenMeterVersuche}` : "0/0";

        const m = Math.floor((stats.timeOnField || 0) / 60);
        const s = (stats.timeOnField || 0) % 60;
        const timeStr = `${m}:${s < 10 ? '0' + s : s}`;

        const playerLog = gameLog.filter(e => (e.playerId === stats.number || e.number === stats.number) && !e.action.startsWith('Gegner'));
        const hasField = playerLog.some(e => !e.action.includes('7m'));
        const has7m = playerLog.some(e => e.action.includes('7m'));

        let buttonsHtml = '';
        if (hasField) buttonsHtml += `<button class="heatmap-btn shadcn-btn-secondary" data-mode="field" style="padding: 0 4px; height: 20px; display:inline-flex; align-items:center; font-size: 0.6rem; min-width: 20px;"><i data-lucide="crosshair" style="width: 12px; height: 12px;"></i></button>`;
        if (has7m) buttonsHtml += `<button class="heatmap-btn shadcn-btn-outline" data-mode="7m" style="padding: 0 4px; height: 20px; font-size: 0.6rem; margin-left: 2px; border-color: #f59e0b; color: #f59e0b; display:inline-flex; align-items:center; min-width: 20px;">7m</button>`;

        const tr = document.createElement('tr');
        if (isLive) {
            tr.style.cursor = 'pointer';
            tr.title = 'Klicken für Details und Wurfquote';
            tr.addEventListener('click', () => {
                if (onRowClick) onRowClick(stats);
                else {
                    import('./ui.js').then(ui => {
                        if (ui.showLivePlayerDetails) ui.showLivePlayerDetails(stats);
                    });
                }
            });
        }

        tr.innerHTML = `
            <td>#${escapeHTML(stats.number)} ${escapeHTML(stats.name)}</td>
            <td>${escapeHTML(timeStr)}</td>
            <td>${escapeHTML(goals)}</td>
            <td>${escapeHTML(feldtore)}</td>
            <td>${escapeHTML(stats.assist || 0)}</td>
            <td>${escapeHTML(sevenMDisplay)}</td>
            <td>${escapeHTML(stats.fehlwurf || 0)}</td>
            <td>${escapeHTML(quote)}</td>
            <td>${escapeHTML(stats.guteAktion || 0)}</td>
            <td>${escapeHTML(stats.ballverlust || 0)}</td>
            <td>${escapeHTML(stats.stuermerfoul || 0)}</td>
            <td>${escapeHTML(stats.block || 0)}</td>
            <td>${escapeHTML(stats.gewonnen1v1 || 0)}</td>
            <td>${escapeHTML(stats.rausgeholt7m || 0)}</td>
            <td>${escapeHTML(stats.rausgeholt2min || 0)}</td>
            <td>${escapeHTML(stats.gelb || 0)}</td>
            <td>${escapeHTML(stats.zweiMinuten || 0)}</td>
            <td>${escapeHTML(stats.rot || 0)}</td>
            <td>${buttonsHtml}</td>
        `;

        const btns = tr.querySelectorAll('.heatmap-btn');
        btns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const mode = btn.dataset.mode;
                openPlayerHistoryHeatmap(gameLog, stats.number, 'heim', stats.name, mode, !stayInHeatmap);
                if (renderBound) renderBound();
                
                const container = document.getElementById('histHeatmapContainer');
                if (container) {
                    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
        tbody.appendChild(tr);
    });
    if (typeof lucide !== 'undefined') lucide.createIcons({ root: tbody });
}

export function renderOpponentStatsInHistory(tbody, statsData, gameLog, game = null, isLive = false, stayInHeatmap = false, renderBound = null, onRowClick = null) {
    if (game === null || onRowClick || game === true) isLive = true;
    tbody.innerHTML = '';

    // Apply Sorting
    const sortedData = sortStatsData([...statsData], currentSort.column, currentSort.direction);

    sortedData.forEach(stats => {
        const goals = stats.tore || 0;
        const sevenMGoals = stats.siebenMeterTore || 0;
        const feldtore = goals - sevenMGoals;
        const fieldAttempts = feldtore + stats.fehlwurf;
        const quote = fieldAttempts > 0 ? Math.round((feldtore / fieldAttempts) * 100) + '%' : '-';
        const sevenMDisplay = (stats.siebenMeterVersuche > 0) ? `${stats.siebenMeterTore}/${stats.siebenMeterVersuche}` : "0/0";

        const m = Math.floor((stats.timeOnField || 0) / 60);
        const s = (stats.timeOnField || 0) % 60;
        const timeStr = `${m}:${s < 10 ? '0' + s : s}`;

        const has7m = stats.siebenMeterVersuche > 0;
        const hasField = (goals + stats.fehlwurf) > stats.siebenMeterVersuche;

        let buttonsHtml = '';
        if (hasField || goals > 0) buttonsHtml += `<button class="heatmap-btn shadcn-btn-secondary" data-mode="field" style="padding: 0 4px; height: 20px; display:inline-flex; align-items:center; font-size: 0.6rem; min-width: 20px;"><i data-lucide="crosshair" style="width: 12px; height: 12px;"></i></button>`;
        if (has7m) buttonsHtml += `<button class="heatmap-btn shadcn-btn-outline" data-mode="7m" style="padding: 0 4px; height: 20px; font-size: 0.6rem; margin-left: 2px; border-color: #f59e0b; color: #f59e0b; display:inline-flex; align-items:center; min-width: 20px;">7m</button>`;

        const tr = document.createElement('tr');
        if (isLive) {
            tr.style.cursor = 'pointer';
            tr.addEventListener('click', () => {
                if (onRowClick) onRowClick(stats);
                else {
                    import('./ui.js').then(ui => {
                        if (ui.showLivePlayerDetails) ui.showLivePlayerDetails(stats);
                    });
                }
            });
        }
        tr.innerHTML = `
            <td>#${escapeHTML(stats.number)} ${escapeHTML(stats.name)}</td>
            <td>${escapeHTML(timeStr)}</td>
            <td>${escapeHTML(goals)}</td>
            <td>${escapeHTML(feldtore)}</td>
            <td>${escapeHTML(stats.assist || 0)}</td>
            <td>${escapeHTML(sevenMDisplay)}</td>
            <td>${escapeHTML(stats.fehlwurf || 0)}</td>
            <td>${escapeHTML(quote)}</td>
            <td>${escapeHTML(stats.guteAktion || 0)}</td>
            <td>${escapeHTML(stats.ballverlust || 0)}</td>
            <td>${escapeHTML(stats.stuermerfoul || 0)}</td>
            <td>${escapeHTML(stats.block || 0)}</td>
            <td>${escapeHTML(stats.gewonnen1v1 || 0)}</td>
            <td>${escapeHTML(stats.rausgeholt7m || 0)}</td>
            <td>${escapeHTML(stats.rausgeholt2min || 0)}</td>
            <td>${escapeHTML(stats.gelb || 0)}</td>
            <td>${escapeHTML(stats.zweiMinuten || 0)}</td>
            <td>${escapeHTML(stats.rot || 0)}</td>
            <td>${buttonsHtml}</td>
        `;

        const btns = tr.querySelectorAll('.heatmap-btn');
        btns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const mode = btn.dataset.mode;
                const teamName = (game && game.teams && game.teams.gegner) || stats.team || 'gegner';
                openPlayerHistoryHeatmap(gameLog, stats.number, teamName, stats.name, mode, !stayInHeatmap);
                if (renderBound) renderBound();
                
                const container = document.getElementById('histHeatmapContainer');
                if (container) {
                    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
        tbody.appendChild(tr);
    });
    if (typeof lucide !== 'undefined') lucide.createIcons({ root: tbody });
}

/**
 * Shared function to open the player history heatmap.
 */
export function openPlayerHistoryHeatmap(gameLog, identifier, team, playerName, mode = 'field', navigate = true) {
    const modeLabel = mode === '7m' ? `7m Grafik` : `Wurfbild`;
    const mappedLog = gameLog.map(e => ({
        ...e,
        isOpponent: team !== 'heim' && team !== 'Heim'
    }));

    setCurrentHeatmapContext({
        log: mappedLog,
        title: `${modeLabel} - ${playerName} #${identifier}`,
        filter: { team, player: identifier },
        mode,
        initialFilters: {
            tore: mode !== '7m',
            seven_m: mode === '7m',
            missed: true
        },
        type: 'history-detail'
    });

    setCurrentHeatmapTab('kombiniert');

    if (navigate) {
        if (histTabProtokoll) histTabProtokoll.classList.remove('active');
        if (histTabTorfolge) histTabTorfolge.classList.remove('active');
        if (histTabHeatmap) {
            histTabHeatmap.classList.add('active');
            histTabHeatmap.click();
            if (histContentHeatmap) {
                histContentHeatmap.classList.remove('versteckt');
                histContentHeatmap.classList.remove('hide-heatmap-visuals');
                
                // Specific container for scrolling
                const scrollTarget = document.getElementById('histHeatmapContainer') || histContentHeatmap;
                setTimeout(() => {
                    scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 50);
            }
            if (histContentProtokoll) histContentProtokoll.classList.add('versteckt');
            if (histContentTorfolge) histContentTorfolge.classList.add('versteckt');
        }
    }

    if (histHeatmapPlayerSelect && identifier !== null) {
        if (histHeatmapSvg && typeof histHeatmapSvg.syncControls === 'function') {
            const isHeim = (team === 'heim');
            histHeatmapSvg.syncControls(isHeim ? 'heim' : 'gegner', identifier, mode);
        } else {
            histHeatmapPlayerSelect.value = identifier;
        }
        if (histHeatmapSvg && typeof histHeatmapSvg.renderBound === 'function') {
            histHeatmapSvg.renderBound();
        }
    }
}

/**
 * Sorting logic for player data
 */
function sortStatsData(data, column, direction, toreMap = null) {
    const factor = direction === 'asc' ? 1 : -1;
    
    return data.sort((a, b) => {
        let valA, valB;
        
        switch(column) {
            case 'name':
                valA = (a.name || '').toLowerCase();
                valB = (b.name || '').toLowerCase();
                if (valA === valB) {
                    valA = a.number;
                    valB = b.number;
                }
                break;
            case 'number':
                valA = a.number || 0;
                valB = b.number || 0;
                break;
            case 'timeOnField':
                valA = a.timeOnField || 0;
                valB = b.timeOnField || 0;
                break;
            case 'tore':
                if (toreMap) {
                    valA = (toreMap.get(a.number) || 0) + (a.siebenMeterTore || 0);
                    valB = (toreMap.get(b.number) || 0) + (b.siebenMeterTore || 0);
                } else {
                    valA = a.tore || 0;
                    valB = b.tore || 0;
                }
                break;
            case 'feldtore':
                if (toreMap) {
                    valA = toreMap.get(a.number) || 0;
                    valB = toreMap.get(b.number) || 0;
                } else {
                    valA = (a.tore || 0) - (a.siebenMeterTore || 0);
                    valB = (b.tore || 0) - (b.siebenMeterTore || 0);
                }
                break;
            case 'siebenMeter':
                valA = a.siebenMeterTore || 0;
                valB = b.siebenMeterTore || 0;
                break;
            case 'quote':
                const getQuote = (p) => {
                    const attempts = (toreMap ? (toreMap.get(p.number) || 0) : (p.tore || 0)) + (p.fehlwurf || 0);
                    return attempts > 0 ? ((toreMap ? (toreMap.get(p.number) || 0) : (p.tore || 0)) / attempts) : 0;
                };
                valA = getQuote(a);
                valB = getQuote(b);
                break;
            case 'assist':
                valA = a.assist || 0;
                valB = b.assist || 0;
                break;
            case 'fehlwurf':
                valA = a.fehlwurf || 0;
                valB = b.fehlwurf || 0;
                break;
            default:
                valA = a[column] || 0;
                valB = b[column] || 0;
        }
        
        if (typeof valA === 'string' && typeof valB === 'string') {
            return valA.localeCompare(valB) * factor;
        }
        return (valA - valB) * factor;
    });
}

/**
 * Global listener for sorting headers
 */
export function initTableSorting(renderCallback) {
    document.addEventListener('click', (e) => {
        const th = e.target.closest('th[data-sort]');
        if (!th) return;
        
        const column = th.dataset.sort;
        if (currentSort.column === column) {
            currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            currentSort.column = column;
            currentSort.direction = 'desc'; // Default to desc for stats
        }
        
        // Visual feedback (optional but good)
        const table = th.closest('table');
        if (table) {
            table.querySelectorAll('th[data-sort]').forEach(el => el.classList.remove('sorted-asc', 'sorted-desc'));
            th.classList.add(currentSort.direction === 'asc' ? 'sorted-asc' : 'sorted-desc');
        }
        
        if (renderCallback) renderCallback();
    });
}
