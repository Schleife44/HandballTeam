// modules/heatmap.js
// Heatmap Rendering und State Management

import { spielstand, speichereSpielstand } from './state.js';
import {
    heatmapSvg, heatmapModal, heatmapHeimFilter, heatmapGegnerFilter,
    heatmapToreFilter, heatmapMissedFilter, histContentHeatmap
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

// --- Heatmap Renderer ---
export function renderHeatmap(svgElement, logSource, isHistory = false, filterOverride = null) {
    if (!svgElement) return;

    let log = logSource || spielstand.gameLog;

    // Filters
    let showHeim = true;
    let showGegner = false;
    let playerFilter = null;

    // Check global context for overrides (Single Player History Mode)
    if (currentHeatmapContext && svgElement === heatmapSvg) {
        log = currentHeatmapContext.log;

        if (currentHeatmapContext.filter) {
            if (currentHeatmapContext.filter.team === 'heim') { showHeim = true; showGegner = false; }
            else { showHeim = false; showGegner = true; }
            playerFilter = currentHeatmapContext.filter.player;
        }

        const modal = svgElement.closest('.modal-content') || svgElement.closest('.modal-overlay');
        if (modal) {
            const filterContainer = modal.querySelector('.heatmap-filter');
            if (filterContainer) filterContainer.classList.add('versteckt');
        } else {
            const filterContainer = document.querySelector('#heatmapModal .heatmap-filter');
            if (filterContainer) filterContainer.classList.add('versteckt');
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
            showHeim = heatmapHeimFilter?.checked ?? true;
            showGegner = heatmapGegnerFilter?.checked ?? false;
        }
    }

    const showTore = heatmapToreFilter?.checked ?? true;
    const showMissed = heatmapMissedFilter?.checked ?? true;

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
            if (showHeim && isOpponent) return;
            if (showGegner && !isOpponent) return;
        }

        const isGoal = entry.action === 'Tor' || entry.action === 'Gegner Tor' ||
            entry.action?.includes('7m Tor');
        const isMiss = entry.action === 'Fehlwurf' || entry.action === 'Gegner Wurf Vorbei' ||
            entry.action?.includes('Verworfen') || entry.action?.includes('Gehalten');

        if (isGoal && !showTore) return;
        if (isMiss && !showMissed) return;

        if (entry.wurfbild) {
            pointsTor.push({
                x: parseFloat(entry.wurfbild.x),
                y: parseFloat(entry.wurfbild.y),
                isOpponent,
                isGoal,
                isMiss
            });
        }

        if (entry.wurfposition) {
            pointsFeld.push({
                x: parseFloat(entry.wurfposition.x),
                y: parseFloat(entry.wurfposition.y),
                isOpponent,
                isGoal,
                isMiss
            });
        }
    });

    // SVG Generation helpers
    const drawGoalHeatmap = (pts, yOffset = 0) => {
        let content = `
            <g transform="translate(0, ${yOffset})">
                <defs>
                    <radialGradient id="heatGradient${isHistory ? 'H' : ''}${yOffset}">
                        <stop offset="0%" style="stop-color:rgba(255,0,0,0.6)"/>
                        <stop offset="100%" style="stop-color:rgba(255,0,0,0)"/>
                    </radialGradient>
                    <radialGradient id="heatGradientBlue${isHistory ? 'H' : ''}${yOffset}">
                        <stop offset="0%" style="stop-color:rgba(13,110,253,0.6)"/>
                        <stop offset="100%" style="stop-color:rgba(13,110,253,0)"/>
                    </radialGradient>
                </defs>
                <rect x="25" y="10" width="250" height="180" fill="none" stroke="#333" stroke-width="3"/>
                <line x1="100" y1="10" x2="100" y2="190" stroke="#ccc" stroke-width="1" stroke-dasharray="5,5"/>
                <line x1="200" y1="10" x2="200" y2="190" stroke="#ccc" stroke-width="1" stroke-dasharray="5,5"/>
                <line x1="25" y1="70" x2="275" y2="70" stroke="#ccc" stroke-width="1" stroke-dasharray="5,5"/>
                <line x1="25" y1="130" x2="275" y2="130" stroke="#ccc" stroke-width="1" stroke-dasharray="5,5"/>
        `;

        pts.forEach(p => {
            if (p.isMiss) return;
            let x = 25 + (p.x / 100) * 250;
            let y = 10 + (p.y / 100) * 180;
            x = Math.max(-10, Math.min(310, x));
            y = Math.max(-55, Math.min(195, y));
            const gradient = p.isOpponent ? `url(#heatGradientBlue${isHistory ? 'H' : ''}${yOffset})` : `url(#heatGradient${isHistory ? 'H' : ''}${yOffset})`;
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

    const drawFieldHeatmap = (pts, yOffset = 0) => {
        let content = `
            <g transform="translate(0, ${yOffset})">
                <defs>
                    <radialGradient id="heatGradientF${isHistory ? 'H' : ''}${yOffset}">
                        <stop offset="0%" style="stop-color:rgba(255,0,0,0.5)"/>
                        <stop offset="100%" style="stop-color:rgba(255,0,0,0)"/>
                    </radialGradient>
                    <radialGradient id="heatGradientBlueF${isHistory ? 'H' : ''}${yOffset}">
                        <stop offset="0%" style="stop-color:rgba(13,110,253,0.5)"/>
                        <stop offset="100%" style="stop-color:rgba(13,110,253,0)"/>
                    </radialGradient>
                </defs>
                <rect x="10" y="10" width="280" height="380" fill="none" stroke="#333" stroke-width="2"/>
                <rect x="112" y="10" width="76" height="8" fill="#333"/>
                <path d="M 75 18 Q 75 90 150 90 Q 225 90 225 18" fill="none" stroke="#333" stroke-width="2"/>
                <path d="M 37 18 Q 37 150 150 150 Q 263 150 263 18" fill="none" stroke="#333" stroke-width="1" stroke-dasharray="6,3"/>
                <circle cx="150" cy="65" r="4" fill="#333"/>
                <line x1="10" y1="388" x2="290" y2="388" stroke="#333" stroke-width="2"/>
        `;

        pts.forEach(p => {
            if (p.isMiss) return;
            const x = 10 + (p.x / 100) * 280;
            const y = 10 + (p.y / 100) * 380;
            const gradient = p.isOpponent ? `url(#heatGradientBlueF${isHistory ? 'H' : ''}${yOffset})` : `url(#heatGradientF${isHistory ? 'H' : ''}${yOffset})`;
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

    // Generate SVG content
    let svgContent = '';

    if (currentHeatmapTab === 'tor') {
        svgElement.setAttribute('viewBox', '0 -60 300 260');
        svgContent = drawGoalHeatmap(pointsTor, 0);
        svgContent += `
        <text x="10" y="195" font-size="10" fill="#666">
            ${pointsTor.length} Würfe angezeigt
        </text>`;

    } else if (currentHeatmapTab === 'feld') {
        svgElement.setAttribute('viewBox', '0 0 300 400');
        svgContent = drawFieldHeatmap(pointsFeld, 0);
        svgContent += `
        <text x="10" y="395" font-size="10" fill="#666">
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
                if (showHeim && isOpponent) return;
                if (showGegner && !isOpponent) return;
            }

            const isGoal = entry.action === 'Tor' || entry.action === 'Gegner Tor' || entry.action?.includes('7m Tor');
            const isMiss = entry.action === 'Fehlwurf' || entry.action === 'Gegner Wurf Vorbei' || entry.action?.includes('Verworfen') || entry.action?.includes('Gehalten');

            if (isGoal && !showTore) return;
            if (isMiss && !showMissed) return;

            if (entry.wurfbild && entry.wurfposition) {
                let rawGx = 25 + (parseFloat(entry.wurfbild.x) / 100) * 250;
                let rawGy = 10 + (parseFloat(entry.wurfbild.y) / 100) * 180;
                rawGx = Math.max(-10, Math.min(310, rawGx));
                rawGy = Math.max(-55, Math.min(195, rawGy));

                const gx = xOffsetGoal + (rawGx * scaleGoal);
                const gy = yOffsetGoal + (rawGy * scaleGoal);

                const fx = 10 + (parseFloat(entry.wurfposition.x) / 100) * 280;
                const fy = 10 + (parseFloat(entry.wurfposition.y) / 100) * 380 + yOffsetField;

                const color = isMiss ? 'rgba(108, 117, 125, 0.5)' : (isOpponent ? 'rgba(13, 110, 253, 0.5)' : 'rgba(220, 53, 69, 0.5)');

                linesContent += `<line x1="${fx}" y1="${fy}" x2="${gx}" y2="${gy}" stroke="${color}" stroke-width="2" />`;
            }
        });
        linesContent += '</g>';

        svgContent += drawFieldHeatmap(pointsFeld, yOffsetField);
        svgContent += linesContent;
        svgContent += `<g transform="translate(${xOffsetGoal}, ${yOffsetGoal}) scale(${scaleGoal})">`;
        svgContent += drawGoalHeatmap(pointsTor, 0);
        svgContent += `</g>`;
    }

    svgElement.innerHTML = svgContent;
}
