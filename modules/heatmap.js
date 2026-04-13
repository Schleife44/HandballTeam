// modules/heatmap.js
// Heatmap Rendering und State Management

import { spielstand, speichereSpielstand } from './state.js';
import {
    heatmapSvg, heatmapTeamToggle,
    heatmapToreFilter, heatmapMissedFilter, heatmap7mFilter, histContentHeatmap,
    histHeatmapToreFilter, histHeatmapMissedFilter, histHeatmap7mFilter,
    liveOverviewHeatmapToreFilter, liveOverviewHeatmapMissedFilter, liveOverviewHeatmap7mFilter,
    liveOverviewHeatmapSvg
} from './dom.js';
import { calculateGoalZone, calculateFieldZone } from './utils.js';

// --- Heatmap State ---
export let currentHeatmapTab = 'tor';
export let currentHeatmapContext = null;
// ...
// (Skipping down to renderHeatmap changes)
// Wait, I cannot skip lines inside ReplacementContent easily without context.
// I will do two separate replaces.
// First: Update Import.


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
// Helper to assume hex to rgb
function hexToRgb(hex) {
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function (m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}

/**
 * Returns colors based on identity (Us vs Them) rather than fixed Heim/Gegner side.
 */
export function getIdentityColors() {
    const sideColorHeim = spielstand?.settings?.teamColor || '#dc3545';
    const sideColorGegner = spielstand?.settings?.teamColorGegner || '#2563eb';
    const isAuswaerts = spielstand?.settings?.isAuswaertsspiel || false;

    return {
        us: isAuswaerts ? sideColorGegner : sideColorHeim,
        them: isAuswaerts ? sideColorHeim : sideColorGegner
    };
}

export const drawGoalHeatmap = (pts, yOffset = 0, prefix = 'gen', isHistory = false) => {
    const colors = getIdentityColors();
    const rgbUs = hexToRgb(colors.us);
    const rgbThem = hexToRgb(colors.them);

    let content = `
        <g transform="translate(0, ${yOffset})">
            <defs>
                <radialGradient id="heatGradient${prefix}${isHistory ? 'H' : ''}${yOffset}">
                    <stop offset="0%" style="stop-color:rgba(${rgbUs.r},${rgbUs.g},${rgbUs.b},0.6)"/>
                    <stop offset="100%" style="stop-color:rgba(${rgbUs.r},${rgbUs.g},${rgbUs.b},0)"/>
                </radialGradient>
                <radialGradient id="heatGradientBlue${prefix}${isHistory ? 'H' : ''}${yOffset}">
                    <stop offset="0%" style="stop-color:rgba(${rgbThem.r},${rgbThem.g},${rgbThem.b},0.6)"/>
                    <stop offset="100%" style="stop-color:rgba(${rgbThem.r},${rgbThem.g},${rgbThem.b},0)"/>
                </radialGradient>
            </defs>
            <rect x="25" y="10" width="250" height="180" fill="none" stroke="#666" stroke-width="3"/>
            <!-- Tactical Grid Lines (Equal Thirds) -->
            <line x1="108.3" y1="10" x2="108.3" y2="190" stroke="#444" stroke-width="1" stroke-dasharray="5,5"/>
            <line x1="191.7" y1="10" x2="191.7" y2="190" stroke="#444" stroke-width="1" stroke-dasharray="5,5"/>
            <line x1="25" y1="70" x2="275" y2="70" stroke="#444" stroke-width="1" stroke-dasharray="5,5"/>
            <line x1="25" y1="130" x2="275" y2="130" stroke="#444" stroke-width="1" stroke-dasharray="5,5"/>
    `;

    const isZoneMode = !!(spielstand && spielstand.settings && spielstand.settings.useGoalZones);
    const stats = {1:{w:0,g:0},2:{w:0,g:0},3:{w:0,g:0},4:{w:0,g:0},5:{w:0,g:0},6:{w:0,g:0},7:{w:0,g:0},8:{w:0,g:0},9:{w:0,g:0}};
    
    // Predetermine statistics
    pts.forEach(p => {
        const z = calculateGoalZone(p.x, p.y);
        if(z >= 1 && z <= 9) {
            stats[z].w++;
            const isGoal = !(p.isSave || p.isMiss || p.isBlocked || (p.action && p.action.toLowerCase().includes('block')));
            if(isGoal) stats[z].g++;
        }
    });

    const maxShots = Math.max(...Object.values(stats).map(s => s.w), 1);

    // 1. Draw individual markers ONLY if zone mode is OFF
    if (!isZoneMode) {
        pts.forEach(p => {
            if (p.isMiss || p.isBlocked) return;
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

            let fillColor;
            if (p.isSave) {
                fillColor = '#ffc107';
            } else if (p.isMiss || p.isBlocked || (p.action && p.action.toLowerCase().includes('block'))) {
                fillColor = '#6c757d';
            } else if (p.isOpponent) {
                fillColor = colors.them;
            } else {
                fillColor = colors.us;
            }

            let glowStyle = '';
            if (p.isSave) {
                glowStyle = `style="filter: drop-shadow(0 0 5px #ffc107); cursor: pointer;"`;
            } else {
                glowStyle = `style="filter: drop-shadow(0 0 5px ${fillColor}); cursor: pointer;"`;
            }

            const radius = 4;
            content += `<circle cx="${x}" cy="${y}" r="${radius}" fill="${fillColor}" stroke="white" stroke-width="1" ${glowStyle}/>`;
        });
    }

    // 2. Draw Zone Highlights and Labels if mode is ON
    if (isZoneMode) {
        const goalZoneCenters = {
            1: { x: 66.6, y: 40 },  2: { x: 150, y: 40 },  3: { x: 233.3, y: 40 },
            4: { x: 66.6, y: 100 }, 5: { x: 150, y: 100 }, 6: { x: 233.3, y: 100 },
            7: { x: 66.6, y: 160 }, 8: { x: 150, y: 160 }, 9: { x: 233.3, y: 160 }
        };

        const colWidth = 250 / 3;
        const rowHeight = 180 / 3;

        Object.keys(stats).forEach(z => {
            const zi = parseInt(z);
            if(stats[zi].w > 0) {
                const c = goalZoneCenters[zi];
                const col = (zi - 1) % 3;
                const row = Math.floor((zi - 1) / 3);
                
                // Calculate intensity (0.1 to 0.7)
                const intensity = 0.1 + (stats[zi].w / maxShots) * 0.6;
                // Use team colors based on data content (if any points are opponent's)
                const hasOpponentShots = pts.some(p => p.isOpponent);
                const rgb = hasOpponentShots ? rgbThem : rgbUs;
                
                // Draw Glowing Rect
                content += `<rect x="${25 + col * colWidth}" y="${10 + row * rowHeight}" width="${colWidth}" height="${rowHeight}" fill="rgba(${rgb.r},${rgb.g},${rgb.b},${intensity})" />`;
                
                // Draw Pill and Text
                content += `<rect x="${c.x - 18}" y="${c.y + 8}" width="36" height="18" rx="6" fill="rgba(0,0,0,0.8)"/>`;
                content += `<text x="${c.x}" y="${c.y + 21}" fill="white" font-size="12" font-weight="bold" text-anchor="middle" style="pointer-events: none;">${stats[zi].g}/${stats[zi].w}</text>`;
            }
        });
    }

    content += `</g>`;
    return content;
};

export const drawFieldHeatmap = (pts, yOffset = 0, prefix = 'gen', isHistory = false) => {
    const colors = getIdentityColors();
    const rgbUs = hexToRgb(colors.us);
    const rgbThem = hexToRgb(colors.them);

    let content = `
        <g transform="translate(0, ${yOffset})">
            <defs>
                <radialGradient id="heatGradientF${prefix}${isHistory ? 'H' : ''}${yOffset}">
                    <stop offset="0%" style="stop-color:rgba(${rgbUs.r},${rgbUs.g},${rgbUs.b},0.5)"/>
                    <stop offset="100%" style="stop-color:rgba(${rgbUs.r},${rgbUs.g},${rgbUs.b},0)"/>
                </radialGradient>
                <radialGradient id="heatGradientBlueF${prefix}${isHistory ? 'H' : ''}${yOffset}">
                    <stop offset="0%" style="stop-color:rgba(${rgbThem.r},${rgbThem.g},${rgbThem.b},0.5)"/>
                    <stop offset="100%" style="stop-color:rgba(${rgbThem.r},${rgbThem.g},${rgbThem.b},0)"/>
                </radialGradient>
            </defs>
            <rect x="10" y="10" width="280" height="380" fill="none" stroke="#666" stroke-width="2"/>
            <rect x="112" y="10" width="76" height="8" fill="#666"/>
            <path d="M 75 18 Q 75 90 150 90 Q 225 90 225 18" fill="none" stroke="#666" stroke-width="2"/>
            <path d="M 37 18 Q 37 150 150 150 Q 263 150 263 18" fill="none" stroke="#666" stroke-width="1" stroke-dasharray="6,3"/>
            <circle cx="150" cy="65" r="4" fill="#666"/>
            <line x1="10" y1="388" x2="290" y2="388" stroke="#666" stroke-width="2"/>
    `;

    const isZoneMode = !!(spielstand && spielstand.settings && spielstand.settings.useFieldZones);
    const stats = {1:{w:0,g:0},2:{w:0,g:0},3:{w:0,g:0},4:{w:0,g:0},5:{w:0,g:0},6:{w:0,g:0},7:{w:0,g:0},8:{w:0,g:0},9:{w:0,g:0}};
    
    pts.forEach(p => {
        const z = calculateFieldZone(p.x, p.y);
        if(z >= 1 && z <= 9) {
            stats[z].w++;
            const isGoal = !(p.isSave || p.isMiss || p.isBlocked || (p.action && p.action.toLowerCase().includes('block')));
            if(isGoal) stats[z].g++;
        }
    });

    const maxShots = Math.max(...Object.values(stats).map(s => s.w), 1);

    // 1. Draw individual markers ONLY if zone mode is OFF
    if (!isZoneMode) {
        pts.forEach(p => {
            if (p.isMiss || p.isBlocked) return;
            const x = 10 + (p.x / 100) * 280;
            const y = 10 + (p.y / 100) * 380;
            const gradient = p.isOpponent ? `url(#heatGradientBlueF${prefix}${isHistory ? 'H' : ''}${yOffset})` : `url(#heatGradientF${prefix}${isHistory ? 'H' : ''}${yOffset})`;
            content += `<circle cx="${x}" cy="${y}" r="40" fill="${gradient}"/>`;
        });

        pts.forEach(p => {
            let x = 10 + (p.x / 100) * 280;
            let y = 10 + (p.y / 100) * 380;
            x = Math.max(0, Math.min(300, x));
            y = Math.max(0, Math.min(500, y));

            let fillColor;
            if (p.isSave) {
                fillColor = '#ffc107';
            } else if (p.isMiss || p.isBlocked || (p.action && p.action.toLowerCase().includes('block'))) {
                fillColor = '#6c757d';
            } else if (p.isOpponent) {
                fillColor = colors.them;
            } else {
                fillColor = colors.us;
            }

            const radius = 4;
            let glowStyle = '';
            if (p.isSave) {
                glowStyle = `style="filter: drop-shadow(0 0 5px #ffc107); cursor: pointer;"`;
            }

            content += `<circle cx="${x}" cy="${y}" r="${radius}" fill="${fillColor}" stroke="white" stroke-width="1" ${glowStyle}/>`;
        });
    }

    // 2. Draw Zone Highlights and Labels if mode is ON
    if (isZoneMode) {
        const fieldZonePaths = {
            1: "M 37 18 L 75 18 Q 75 39.6 81.8 54.7 L 47.2 85.3 Q 37 57.6 37 18 Z",
            2: "M 47.2 85.3 L 81.8 54.7 Q 90.8 74.9 111.8 83.5 L 92.4 138.1 Q 60.7 122.3 47.2 85.3 Z",
            3: "M 92.4 138.1 L 111.8 83.5 Q 127.5 90 150 90 Q 172.5 90 188.2 83.5 L 207.6 138.1 Q 183.9 150 150 150 Q 116.1 150 92.4 138.1 Z",
            4: "M 207.6 138.1 L 188.2 83.5 Q 209.2 74.9 218.2 54.7 L 252.8 85.3 Q 239.3 122.3 207.6 138.1 Z",
            5: "M 263 18 L 225 18 Q 225 39.6 218.2 54.7 L 252.8 85.3 Q 263 57.6 263 18 Z",
            6: "M 10 18 L 37 18 Q 37 57.6 47.2 85.3 Q 60.7 122.3 92.4 138.1 L 63.3 220 L 10 220 Z",
            7: "M 63.3 220 L 92.4 138.1 Q 116.1 150 150 150 Q 183.9 150 207.6 138.1 L 236.7 220 Z",
            8: "M 290 18 L 263 18 Q 263 57.6 252.8 85.3 Q 239.3 122.3 207.6 138.1 L 236.7 220 L 290 220 Z",
            9: "M 10 220 L 290 220 L 290 388 L 10 388 Z"
        };
        const fieldZoneCenters = {
            1: { x: 60, y: 45 },   2: { x: 75, y: 95 },   3: { x: 150, y: 115 },
            4: { x: 225, y: 95 },  5: { x: 240, y: 45 },  6: { x: 40, y: 180 },
            7: { x: 150, y: 180 }, 8: { x: 260, y: 180 }, 9: { x: 150, y: 280 }
        };

        Object.keys(stats).forEach(z => {
            const zi = parseInt(z);
            if(stats[zi].w > 0) {
                const c = fieldZoneCenters[zi];
                const intensity = 0.1 + (stats[zi].w / maxShots) * 0.6;
                const hasOpponentShots = pts.some(p => p.isOpponent);
                const rgb = hasOpponentShots ? rgbThem : rgbUs;

                // Draw Glowing Path
                content += `<path d="${fieldZonePaths[zi]}" fill="rgba(${rgb.r},${rgb.g},${rgb.b},${intensity})" stroke="rgba(${rgb.r},${rgb.g},${rgb.b},0.3)" stroke-width="1" />`;
                
                // Draw Pill and Text
                content += `<rect x="${c.x - 18}" y="${c.y + 10}" width="36" height="18" rx="6" fill="rgba(0,0,0,0.8)"/>`;
                content += `<text x="${c.x}" y="${c.y + 23}" fill="white" font-size="12" font-weight="bold" text-anchor="middle" style="pointer-events: none;">${stats[zi].g}/${stats[zi].w}</text>`;
            }
        });
    }

    content += `</g>`;
    return content;
};

/**
 * Draws lines between shot position and goal position
 */
export function drawShotLines(pts, xOffsetGoal = 0, yOffsetGoal = 0, scaleGoal = 1, yOffsetField = 0) {
    const colors = getIdentityColors();
    const rgbUs = hexToRgb(colors.us);
    const rgbThem = hexToRgb(colors.them);
    let content = '<g class="shot-lines">';

    pts.forEach(p => {
        if (!p.pos || p.gx === undefined || p.gy === undefined) return;

        const fx = 10 + (p.pos.x / 100) * 280;
        const fy = 10 + (p.pos.y / 100) * 380 + yOffsetField;

        let rawGx = 25 + (p.gx / 100) * 250;
        let rawGy = 10 + (p.gy / 100) * 180;
        rawGx = Math.max(-10, Math.min(310, rawGx));
        rawGy = Math.max(-55, Math.min(195, rawGy));

        const gx = xOffsetGoal + (rawGx * scaleGoal);
        const gy = yOffsetGoal + (rawGy * scaleGoal);

        const c = p.isSave ? 'rgba(255, 193, 7, 0.5)' :
            (p.isMiss ? 'rgba(108, 117, 125, 0.5)' :
                (p.isOpponent ? `rgba(${rgbThem.r}, ${rgbThem.g}, ${rgbThem.b}, 0.5)`
                    : `rgba(${rgbUs.r}, ${rgbUs.g}, ${rgbUs.b}, 0.5)`));

        content += `<line x1="${fx}" y1="${fy}" x2="${gx}" y2="${gy}" stroke="${c}" stroke-width="2" />`;
    });

    content += '</g>';
    return content;
}

// // --- Heatmap Renderer ---
export function renderHeatmap(svgElement, logSource, isHistory = false, filterOverride = null) {
    if (!svgElement) return;

    try {
        let log = logSource || (currentHeatmapContext?.log) || spielstand.gameLog;
        if (!Array.isArray(log)) log = [];

        // 1. Resolve Filters
        let showHeim = true;
        let showGegner = false;
        let playerFilter = null;

        if (filterOverride) {
            showHeim = filterOverride.team?.toLowerCase() === 'heim';
            showGegner = !showHeim;
            playerFilter = filterOverride.player;
        } else if (isHistory || svgElement.id === 'histHeatmapSvg') {
            const histToggle = document.getElementById('histHeatmapTeamToggle');
            const isChecked = histToggle?.getAttribute('data-state') === 'checked';
            showHeim = !isChecked;
            showGegner = isChecked;
            const hps = document.getElementById('histHeatmapPlayerSelect');
            if (hps && hps.value !== 'all') playerFilter = parseInt(hps.value, 10);
        } else if (currentHeatmapContext === 'liveOverview' || svgElement.id === 'liveOverviewHeatmapSvg') {
            const selected = document.querySelector('input[name="liveOverviewHeatTeam"]:checked');
            showGegner = selected?.value === 'gegner';
            showHeim = !showGegner;
        } else if (currentHeatmapContext?.type === 'season-specific' || currentHeatmapContext === 'season') {
            const t = currentHeatmapContext.filter?.team?.toLowerCase() || 'all';
            showHeim = (t === 'heim' || t === 'all');
            showGegner = (t === 'gegner' || t === 'all');
            playerFilter = currentHeatmapContext.filter?.player;
        } else {
            // Default Logic (Interactive Main Heatmap)
            const isChecked = heatmapTeamToggle?.getAttribute('data-state') === 'checked';
            showGegner = isChecked;
            showHeim = !isChecked;
            const ps = document.getElementById('heatmapPlayerSelect');
            if (ps && ps.value !== 'all') {
                playerFilter = parseInt(ps.value.includes('|') ? ps.value.split('|')[1] : ps.value, 10);
            }
        }

        // 2. Resolve Shot Filters (Tore/Missed/7m)
        let showTore = true, showMissed = true, show7m = false;
        if (isHistory || svgElement.id === 'histHeatmapSvg') {
            showTore = histHeatmapToreFilter?.checked ?? true;
            showMissed = histHeatmapMissedFilter?.checked ?? true;
            show7m = histHeatmap7mFilter?.checked ?? false;
        } else if (currentHeatmapContext === 'liveOverview' || svgElement.id === 'liveOverviewHeatmapSvg') {
            showTore = liveOverviewHeatmapToreFilter?.checked ?? true;
            showMissed = liveOverviewHeatmapMissedFilter?.checked ?? true;
            show7m = liveOverviewHeatmap7mFilter?.checked ?? false;
        } else {
            showTore = heatmapToreFilter?.checked ?? true;
            showMissed = heatmapMissedFilter?.checked ?? true;
            show7m = heatmap7mFilter?.checked ?? false;
        }

        // 3. Process Log into Points
        const pointsTor = [];
        const pointsFeld = [];
        const pointsLines = [];
        const isAuswaerts = spielstand.settings.isAuswaertsspiel;

        log.forEach(entry => {
            if (!entry) return;
            // Identity Detection
            let isOpponent = entry.isOpponent;
            if (isOpponent === undefined) {
                const logBtnIsGegner = !!(entry.action?.startsWith('Gegner') || entry.gegnerNummer);
                isOpponent = isAuswaerts ? !logBtnIsGegner : logBtnIsGegner;
            }

            // Team / Player Filter
            const entryIsHeimSide = isAuswaerts ? isOpponent : !isOpponent;
            if (entryIsHeimSide && !showHeim) return;
            if (!entryIsHeimSide && !showGegner) return;

            if (playerFilter !== null && playerFilter !== 'all') {
                const pNum = (entry.player && typeof entry.player === 'object') ? entry.player.number : entry.player;
                const checkNum = entry.playerId ?? (isOpponent ? entry.gegnerNummer : pNum);
                if (String(checkNum) !== String(playerFilter)) return;
            }

            const is7m = !!(entry.is7m || entry.action?.toLowerCase().includes('7m'));
            if (is7m && !show7m) return;

            const act = (entry.action || "").toLowerCase();
            const isGoal = act === 'tor' || act === 'gegner tor' || act.includes('7m tor');
            const isSave = act.includes('gehalten') || act.includes('parade');
            const isMiss = act.includes('fehlwurf') || act.includes('vorbei') || act.includes('verworfen') || act.includes('block') || isSave;

            if (isGoal && !is7m && !showTore) return; 
            if (isMiss && !is7m && !showTore && show7m) return; // Hide regular miss if only 7m active
            if (isMiss && !showMissed) return;
            if (!isGoal && !isMiss) return;

            const coreData = {
                isOpponent, isGoal, isMiss, isSave,
                color: entry.wurfbild?.color,
                x: parseFloat(entry.wurfbild?.x ?? entry.x),
                y: parseFloat(entry.wurfbild?.y ?? entry.y)
            };

            if (!isNaN(coreData.x) && !isNaN(coreData.y)) pointsTor.push(coreData);

            let pos = entry.wurfposition || (is7m ? { x: 50, y: 29.0 } : null);
            if (pos) {
                const fieldPt = { ...coreData, x: parseFloat(pos.x), y: parseFloat(pos.y) };
                pointsFeld.push(fieldPt);
                if (!isNaN(coreData.x)) {
                    pointsLines.push({ ...coreData, pos, gx: coreData.x, gy: coreData.y });
                }
            }
        });

        const prefix = (svgElement.id || 'gen').replace(/[^a-zA-Z0-9]/g, '_');
        let svgContent = '';

        if (currentHeatmapTab === 'tor') {
            svgElement.setAttribute('viewBox', '0 -60 300 280');
            svgContent = drawGoalHeatmap(pointsTor, 0, prefix, isHistory);
            svgContent += `<text x="10" y="210" font-size="10" fill="#666">${pointsTor.length} Würfe</text>`;
        } else if (currentHeatmapTab === 'feld') {
            svgElement.setAttribute('viewBox', '0 0 300 420');
            svgContent = drawFieldHeatmap(pointsFeld, 0, prefix, isHistory);
            svgContent += `<text x="10" y="410" font-size="10" fill="#666">${pointsFeld.length} Positionen</text>`;
        } else if (currentHeatmapTab === 'kombiniert') {
            svgElement.setAttribute('viewBox', '0 0 300 500');
            const scaleGoal = 0.35, xOffsetGoal = 97.5, yOffsetGoal = 24, yOffsetField = 80;

            svgContent += drawFieldHeatmap(pointsFeld, yOffsetField, prefix, isHistory);
            svgContent += drawShotLines(pointsLines, xOffsetGoal, yOffsetGoal, scaleGoal, yOffsetField);
            svgContent += `<g transform="translate(${xOffsetGoal}, ${yOffsetGoal}) scale(${scaleGoal})">`;
            svgContent += drawGoalHeatmap(pointsTor, 0, prefix, isHistory);
            svgContent += `</g>`;
            svgContent += `<text x="10" y="490" font-size="10" fill="#666">${pointsLines.length} Kombinierte Ansichten</text>`;
        }
        svgElement.innerHTML = svgContent;
    } catch (error) {
        console.error('[Heatmap] Render failed:', error);
    }
}

