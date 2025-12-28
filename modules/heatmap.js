// modules/heatmap.js
// Heatmap Rendering und State Management

import { spielstand, speichereSpielstand } from './state.js';
import {
    heatmapSvg, heatmapHeimFilter, heatmapGegnerFilter,
    heatmapToreFilter, heatmapMissedFilter, heatmap7mFilter, histContentHeatmap,
    histHeatmapToreFilter, histHeatmapMissedFilter, histHeatmap7mFilter,
    liveOverviewHeatmapToreFilter, liveOverviewHeatmapMissedFilter, liveOverviewHeatmap7mFilter
} from './dom.js';

// --- Heatmap State ---
export let currentHeatmapTab = 'tor';
export let currentHeatmapContext = null;

export function setCurrentHeatmapTab(tab) {
    currentHeatmapTab = tab;
}

export function setCurrentHeatmapContext(context) {
    currentHeatmapContext = context;
}

export function getCurrentHeatmapContext() {
    return currentHeatmapContext;
}

// --- SVG Generation Helpers (Exported) ---
export const drawGoalHeatmap = (pts, yOffset = 0, prefix = 'gen', isHistory = false) => {
    let content = `
        <g transform="translate(0, ${yOffset})">
            <defs>
                <radialGradient id="heatGradient${prefix}${isHistory ? 'H' : ''}${yOffset}">
                    <stop offset="0%" style="stop-color:rgba(255,0,0,0.6)"/>
                    <stop offset="100%" style="stop-color:rgba(255,0,0,0)"/>
                </radialGradient>
                <radialGradient id="heatGradientBlue${prefix}${isHistory ? 'H' : ''}${yOffset}">
                    <stop offset="0%" style="stop-color:rgba(13,110,253,0.6)"/>
                    <stop offset="100%" style="stop-color:rgba(13,110,253,0)"/>
                </radialGradient>
            </defs>
            <rect x="25" y="10" width="250" height="180" fill="none" stroke="#666" stroke-width="3"/>
            <line x1="100" y1="10" x2="100" y2="190" stroke="#444" stroke-width="1" stroke-dasharray="5,5"/>
            <line x1="200" y1="10" x2="200" y2="190" stroke="#444" stroke-width="1" stroke-dasharray="5,5"/>
            <line x1="25" y1="70" x2="275" y2="70" stroke="#444" stroke-width="1" stroke-dasharray="5,5"/>
            <line x1="25" y1="130" x2="275" y2="130" stroke="#444" stroke-width="1" stroke-dasharray="5,5"/>
    `;

    pts.forEach(p => {
        if (p.isMiss) return;
        let x = 25 + (p.x / 100) * 250;
        let y = 10 + (p.y / 100) * 180;
        x = Math.max(-10, Math.min(310, x));
        y = Math.max(-55, Math.min(195, y));
        const gradient = p.isOpponent ? `url(#heatGradientBlue${prefix}${isHistory ? 'H' : ''}${yOffset})` : `url(#heatGradient${prefix}${isHistory ? 'H' : ''}${yOffset})`;
        content += `<circle cx="${x}" cy="${y}" r="30" fill="${gradient}"/>`;
    });

    pts.forEach(p => {
        let x = 25 + (p.x / 100) * 250;
        let y = 10 + (p.y / 100) * 180;
        x = Math.max(-10, Math.min(310, x));
        y = Math.max(-55, Math.min(195, y));
        const color = p.isMiss ? '#6c757d' : (p.isOpponent ? '#0d6efd' : '#dc3545');
        content += `<circle cx="${x}" cy="${y}" r="4" fill="${color}" stroke="white" stroke-width="1"/>`;
    });

    content += `</g>`;
    return content;
};

export const drawFieldHeatmap = (pts, yOffset = 0, prefix = 'gen', isHistory = false) => {
    let content = `
        <g transform="translate(0, ${yOffset})">
            <defs>
                <radialGradient id="heatGradientF${prefix}${isHistory ? 'H' : ''}${yOffset}">
                    <stop offset="0%" style="stop-color:rgba(255,0,0,0.5)"/>
                    <stop offset="100%" style="stop-color:rgba(255,0,0,0)"/>
                </radialGradient>
                <radialGradient id="heatGradientBlueF${prefix}${isHistory ? 'H' : ''}${yOffset}">
                    <stop offset="0%" style="stop-color:rgba(13,110,253,0.5)"/>
                    <stop offset="100%" style="stop-color:rgba(13,110,253,0)"/>
                </radialGradient>
            </defs>
            <rect x="10" y="10" width="280" height="380" fill="none" stroke="#666" stroke-width="2"/>
            <rect x="112" y="10" width="76" height="8" fill="#666"/>
            <path d="M 75 18 Q 75 90 150 90 Q 225 90 225 18" fill="none" stroke="#666" stroke-width="2"/>
            <path d="M 37 18 Q 37 150 150 150 Q 263 150 263 18" fill="none" stroke="#666" stroke-width="1" stroke-dasharray="6,3"/>
            <circle cx="150" cy="65" r="4" fill="#666"/>
            <line x1="10" y1="388" x2="290" y2="388" stroke="#666" stroke-width="2"/>
    `;

    pts.forEach(p => {
        if (p.isMiss) return;
        const x = 10 + (p.x / 100) * 280;
        const y = 10 + (p.y / 100) * 380;
        const gradient = p.isOpponent ? `url(#heatGradientBlueF${prefix}${isHistory ? 'H' : ''}${yOffset})` : `url(#heatGradientF${prefix}${isHistory ? 'H' : ''}${yOffset})`;
        content += `<circle cx="${x}" cy="${y}" r="40" fill="${gradient}"/>`;
    });

    pts.forEach(p => {
        const x = 10 + (p.x / 100) * 280;
        const y = 10 + (p.y / 100) * 380;
        const color = p.isMiss ? '#6c757d' : (p.isOpponent ? '#0d6efd' : '#dc3545');
        content += `<circle cx="${x}" cy="${y}" r="5" fill="${color}" stroke="white" stroke-width="1"/>`;
    });

    content += `</g>`;
    return content;
};

// --- Heatmap Renderer ---
export function renderHeatmap(svgElement, logSource, isHistory = false, filterOverride = null) {
    if (!svgElement) return;

    let log = logSource || spielstand.gameLog;

    // Filters
    let showHeim = true;
    let showGegner = false;
    let playerFilter = null;

    // Check global context for overrides (Single Player History Mode)
    if (currentHeatmapContext && typeof currentHeatmapContext === 'object' && svgElement === heatmapSvg) {
        log = currentHeatmapContext.log;

        if (currentHeatmapContext.filter) {
            if (currentHeatmapContext.filter.team === 'heim') { showHeim = true; showGegner = false; }
            else { showHeim = false; showGegner = true; }
            playerFilter = currentHeatmapContext.filter.player;
        }

        const modal = svgElement.closest('.modal-content') || svgElement.closest('.modal-overlay');
        if (modal) {
            // Hide ONLY Team Toggles, keep Goal/Miss filters
            const heimFilter = modal.querySelector('#heatmapHeimFilter');
            const gegnerFilter = modal.querySelector('#heatmapGegnerFilter');
            const separator = modal.querySelector('.heatmap-filter span:not([id])'); // The | separator

            if (heimFilter) heimFilter.closest('label').style.display = 'none';
            if (gegnerFilter) gegnerFilter.closest('label').style.display = 'none';
            if (separator) separator.style.display = 'none';

            const filterContainer = modal.querySelector('.heatmap-filter');
            if (filterContainer) filterContainer.classList.remove('versteckt');
        } else {
            // Fallback if not inside modal
            const filterContainer = document.querySelector('#liveHeatmapBereich .heatmap-filter');
            if (filterContainer) filterContainer.classList.remove('versteckt');
            // Try to find filters via ID globally if we are in main heatmap mode
            const heimFilter = document.getElementById('heatmapHeimFilter');
            const gegnerFilter = document.getElementById('heatmapGegnerFilter');
            if (heimFilter) heimFilter.closest('label').style.display = 'none';
            if (gegnerFilter) gegnerFilter.closest('label').style.display = 'none';
        }
        // Force hide filters
        const heimFilter = document.getElementById('heatmapHeimFilter');
        const gegnerFilter = document.getElementById('heatmapGegnerFilter');
        if (heimFilter) heimFilter.closest('label').style.display = 'none';
        if (gegnerFilter) gegnerFilter.closest('label').style.display = 'none';

    } else if (currentHeatmapContext === 'season' || (currentHeatmapContext && typeof currentHeatmapContext === 'object' && currentHeatmapContext.type === 'season-specific')) {
        if (currentHeatmapContext && typeof currentHeatmapContext === 'object' && currentHeatmapContext.filter) {
            if (currentHeatmapContext.filter.team === 'heim') { showHeim = true; showGegner = false; }
            else if (currentHeatmapContext.filter.team === 'gegner') { showHeim = false; showGegner = true; }
            else { showHeim = true; showGegner = true; }
            playerFilter = currentHeatmapContext.filter.player;
        } else {
            showHeim = true;
            showGegner = true;
        }
    } else if (currentHeatmapContext === 'liveOverview') {
        const selected = document.querySelector('input[name="liveOverviewHeatTeam"]:checked');
        if (selected && selected.value === 'gegner') {
            showHeim = false;
            showGegner = true;
        } else {
            showHeim = true;
            showGegner = false;
        }
    } else {
        if (filterOverride) {
            if (filterOverride.team === 'heim') {
                showHeim = true;
                showGegner = false;
            } else {
                showHeim = false;
                showGegner = true;
            }
            playerFilter = filterOverride.player;
        }
        else if (isHistory) {
            const selected = document.querySelector('input[name="histHeatTeam"]:checked');
            if (selected && selected.value === 'gegner') {
                showHeim = false;
                showGegner = true;
            } else {
                showHeim = true;
                showGegner = false;
            }
        } else {
            // Normal Mode: Show filters if they were hidden
            if (svgElement === heatmapSvg) {
                const heimFilter = document.getElementById('heatmapHeimFilter');
                const gegnerFilter = document.getElementById('heatmapGegnerFilter');
                if (heimFilter) heimFilter.closest('label').style.display = '';
                if (gegnerFilter) gegnerFilter.closest('label').style.display = '';
            }
            showHeim = heatmapHeimFilter?.checked ?? true;
            showGegner = heatmapGegnerFilter?.checked ?? false;
        }
    }

    let showTore, showMissed, show7m;
    if (isHistory) {
        showTore = histHeatmapToreFilter?.checked ?? true;
        showMissed = histHeatmapMissedFilter?.checked ?? true;
        show7m = histHeatmap7mFilter?.checked ?? false;
    } else if (currentHeatmapContext === 'liveOverview') {
        showTore = liveOverviewHeatmapToreFilter?.checked ?? true;
        showMissed = liveOverviewHeatmapMissedFilter?.checked ?? true;
        show7m = liveOverviewHeatmap7mFilter?.checked ?? false;
    } else if (currentHeatmapContext === 'season' || (currentHeatmapContext && typeof currentHeatmapContext === 'object' && currentHeatmapContext.type === 'season-specific')) {
        showTore = document.getElementById('seasonHeatmapToreFilter')?.checked ?? true;
        showMissed = document.getElementById('seasonHeatmapMissedFilter')?.checked ?? true;
        show7m = document.getElementById('seasonHeatmap7mFilter')?.checked ?? false;
    } else {
        showTore = heatmapToreFilter?.checked ?? true;
        showMissed = heatmapMissedFilter?.checked ?? true;
        show7m = heatmap7mFilter?.checked ?? false;
    }

    // Collect data points
    const pointsTor = [];
    const pointsFeld = [];

    log.forEach(entry => {
        const isOpponent = entry.action?.startsWith('Gegner') || entry.gegnerNummer;

        if (playerFilter !== null) {
            if (showHeim) {
                if (isOpponent) return;
                if (entry.playerId !== playerFilter) return;
            } else {
                if (!isOpponent) return;
                if (entry.gegnerNummer !== playerFilter) return;
            }
        } else {
            if (isOpponent && !showGegner) return;
            if (!isOpponent && !showHeim) return;
        }

        const is7m = entry.action && entry.action.includes('7m');
        if (is7m && !show7m) return;

        const isGoal = entry.action === 'Tor' || entry.action === 'Gegner Tor' ||
            entry.action?.includes('7m Tor');
        const isMiss = entry.action === 'Fehlwurf' || entry.action === 'Gegner Wurf Vorbei' ||
            entry.action?.includes('Verworfen') || entry.action?.includes('Gehalten');

        if (isGoal && !is7m && !showTore) return;
        // Feld-Fehlwürfe nur dann verstecken, wenn 7m aktiv ist (Fokus auf 7m) 
        // ODER wenn Fehlwürfe generell aus sind.
        if (isMiss && !is7m && !showTore && show7m) return;
        if (isMiss && !showMissed) return;

        if (entry.wurfbild) {
            pointsTor.push({
                x: parseFloat(entry.wurfbild.x),
                y: parseFloat(entry.wurfbild.y),
                isOpponent,
                isGoal,
                isMiss
            });
        } else if (entry.x !== undefined && entry.y !== undefined && entry.x !== null) {
            pointsTor.push({
                x: parseFloat(entry.x),
                y: parseFloat(entry.y),
                isOpponent,
                isGoal,
                isMiss
            });
        }

        let pos = entry.wurfposition;
        if (is7m) {
            pos = { x: 50, y: 29.0 };
        }

        if (pos) {
            pointsFeld.push({
                x: parseFloat(pos.x),
                y: parseFloat(pos.y),
                isOpponent,
                isGoal,
                isMiss
            });
        }
    });

    // Generate SVG content
    const prefix = svgElement.id || 'gen';
    let svgContent = '';

    if (currentHeatmapTab === 'tor') {
        svgElement.setAttribute('viewBox', '0 -60 300 280');
        svgContent = drawGoalHeatmap(pointsTor, 0, prefix, isHistory);
        svgContent += `
        <text x="10" y="210" font-size="10" fill="#666">
            ${pointsTor.length} Würfe angezeigt
        </text>`;

    } else if (currentHeatmapTab === 'feld') {
        svgElement.setAttribute('viewBox', '0 0 300 420');
        svgContent = drawFieldHeatmap(pointsFeld, 0, prefix, isHistory);
        svgContent += `
        <text x="10" y="410" font-size="10" fill="#666">
            ${pointsFeld.length} Würfe angezeigt
        </text>`;

    } else if (currentHeatmapTab === 'kombiniert') {
        svgElement.setAttribute('viewBox', '0 0 300 500');

        const scaleGoal = 0.35;
        const xOffsetGoal = (300 - (300 * scaleGoal)) / 2;
        const yOffsetGoal = 24;
        const yOffsetField = 80;

        let linesContent = '<g>';

        log.forEach(entry => {
            const isOpponent = entry.action?.startsWith('Gegner') || entry.gegnerNummer;
            if (playerFilter !== null) {
                if (showHeim) {
                    if (isOpponent) return;
                    if (entry.playerId !== playerFilter) return;
                } else {
                    if (!isOpponent) return;
                    if (entry.gegnerNummer !== playerFilter) return;
                }
            } else {
                if (isOpponent && !showGegner) return;
                if (!isOpponent && !showHeim) return;
            }

            const isGoal = entry.action === 'Tor' || entry.action === 'Gegner Tor' || entry.action?.includes('7m Tor');
            const isMiss = entry.action === 'Fehlwurf' || entry.action === 'Gegner Wurf Vorbei' || entry.action?.includes('Verworfen') || entry.action?.includes('Gehalten');

            const is7m = entry.action && entry.action.includes('7m');

            if (isGoal && !is7m && !showTore) return;
            if (isMiss && !is7m && !showTore && show7m) return;
            if (isMiss && !showMissed) return;

            if (is7m && !show7m) return;

            let pos = entry.wurfposition;
            if (is7m) pos = { x: 50, y: 29.0 };

            let wx = (entry.wurfbild && entry.wurfbild.x !== undefined) ? entry.wurfbild.x : entry.x;
            let wy = (entry.wurfbild && entry.wurfbild.y !== undefined) ? entry.wurfbild.y : entry.y;

            if (wx !== undefined && wy !== undefined && pos) {
                let rawGx = 25 + (parseFloat(wx) / 100) * 250;
                let rawGy = 10 + (parseFloat(wy) / 100) * 180;
                rawGx = Math.max(-10, Math.min(310, rawGx));
                rawGy = Math.max(-55, Math.min(195, rawGy));

                const gx = xOffsetGoal + (rawGx * scaleGoal);
                const gy = yOffsetGoal + (rawGy * scaleGoal);

                const fx = 10 + (parseFloat(pos.x) / 100) * 280;
                const fy = 10 + (parseFloat(pos.y) / 100) * 380 + yOffsetField;

                const color = isMiss ? 'rgba(108, 117, 125, 0.5)' : (isOpponent ? 'rgba(13, 110, 253, 0.5)' : 'rgba(220, 53, 69, 0.5)');

                linesContent += `<line x1="${fx}" y1="${fy}" x2="${gx}" y2="${gy}" stroke="${color}" stroke-width="2" />`;
            }
        });
        linesContent += '</g>';

        svgContent += drawFieldHeatmap(pointsFeld, yOffsetField, prefix, isHistory);
        svgContent += linesContent;
        svgContent += `<g transform="translate(${xOffsetGoal}, ${yOffsetGoal}) scale(${scaleGoal})">`;
        svgContent += drawGoalHeatmap(pointsTor, 0, prefix, isHistory);
        svgContent += `</g>`;
    }

    svgElement.innerHTML = svgContent;
}
