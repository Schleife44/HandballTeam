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
function getIdentityColors() {
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
            <line x1="100" y1="10" x2="100" y2="190" stroke="#444" stroke-width="1" stroke-dasharray="5,5"/>
            <line x1="200" y1="10" x2="200" y2="190" stroke="#444" stroke-width="1" stroke-dasharray="5,5"/>
            <line x1="25" y1="70" x2="275" y2="70" stroke="#444" stroke-width="1" stroke-dasharray="5,5"/>
            <line x1="25" y1="130" x2="275" y2="130" stroke="#444" stroke-width="1" stroke-dasharray="5,5"/>
    `;

    pts.forEach(p => {
        if (p.isMiss || p.isBlocked) return;
        let x = 25 + (p.x / 100) * 250;
        let y = 10 + (p.y / 100) * 180;
        x = Math.max(-10, Math.min(310, x));
        y = Math.max(-55, Math.min(195, y));
        // isOpponent in pts means Identity: Them
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

    content += `</g>`;
    return content;
};

// --- Heatmap Renderer ---
export function renderHeatmap(svgElement, logSource, isHistory = false, filterOverride = null) {
    if (!svgElement) return;

    // 1. Determine Log Source: Explicitly passed logSource OR current context log OR fallback to live game log
    let log = logSource;
    if (!log && currentHeatmapContext && typeof currentHeatmapContext === 'object' && currentHeatmapContext.log) {
        log = currentHeatmapContext.log;
    }
    if (!log) {
        log = spielstand.gameLog;
    }

    // Filters (Redacted for brevity, unchanged)
    let showHeim = true;
    let showGegner = false;
    let playerFilter = null;

    // ... [Filter Logic] ...
    if (filterOverride) {
        const t = (filterOverride.team || '').toLowerCase();
        if (t === 'heim') { showHeim = true; showGegner = false; }
        else { showHeim = false; showGegner = true; }
        playerFilter = filterOverride.player;
    }
    // PRIORITY 2: History detail view (explicit SVG or flag)
    else if (isHistory || (svgElement && svgElement.id === 'histHeatmapSvg')) {
        const histToggle = document.getElementById('histHeatmapTeamToggle');
        if (histToggle) {
            const isChecked = histToggle.getAttribute('data-state') === 'checked';
            showHeim = !isChecked;
            showGegner = isChecked;
        } else {
            const selected = document.querySelector('input[name="histHeatTeam"]:checked');
            if (selected && selected.value === 'gegner') { showHeim = false; showGegner = true; }
            else { showHeim = true; showGegner = false; }
        }

        const hps = document.getElementById('histHeatmapPlayerSelect');
        if (hps && hps.value !== 'all') {
            playerFilter = parseInt(hps.value, 10);
        }
    }
    // PRIORITY 3: Live Overview Modal
    else if (currentHeatmapContext === 'liveOverview' || (svgElement && (svgElement.id === 'liveOverviewHeatmapSvg' || svgElement === liveOverviewHeatmapSvg))) {
        const selected = document.querySelector('input[name="liveOverviewHeatTeam"]:checked');
        if (selected && selected.value === 'gegner') { showHeim = false; showGegner = true; }
        else { showHeim = true; showGegner = false; }
    }
    // PRIORITY 4: Global Heatmap (Season/Dashboard)
    else if (currentHeatmapContext && typeof currentHeatmapContext === 'object' && (svgElement === heatmapSvg || currentHeatmapContext.type === 'season-specific')) {
        // Log is already assigned above, but we need to set filters accurately
        if (currentHeatmapContext.filter) {
            const t = (currentHeatmapContext.filter.team || '').toLowerCase();
            if (t === 'heim') { showHeim = true; showGegner = false; }
            else if (t === 'all') { showHeim = true; showGegner = true; }
            else { showHeim = false; showGegner = true; }
            playerFilter = currentHeatmapContext.filter.player;
        }

        // Hide old filters if it's the global one
        if (svgElement === heatmapSvg) {
            const modal = svgElement.closest('.modal-content') || svgElement.closest('.modal-overlay');
            const hf = modal ? modal.querySelector('#heatmapHeimFilter') : document.getElementById('heatmapHeimFilter');
            const gf = modal ? modal.querySelector('#heatmapGegnerFilter') : document.getElementById('heatmapGegnerFilter');
            if (hf) hf.closest('label').style.display = 'none';
            if (gf) gf.closest('label').style.display = 'none';
        }
    } else if (currentHeatmapContext === 'season' || (currentHeatmapContext?.type === 'season-specific')) {
        if (currentHeatmapContext?.filter) {
            const t = currentHeatmapContext.filter.team;
            if (t === 'heim' || t === 'Heim') { showHeim = true; showGegner = false; }
            else if (t === 'all') { showHeim = true; showGegner = true; }
            else { showHeim = false; showGegner = true; }
            playerFilter = currentHeatmapContext.filter.player;
        } else { showHeim = true; showGegner = true; }
    } else {
        if (svgElement === heatmapSvg) {
            const hf = document.getElementById('heatmapHeimFilter');
            if (hf) hf.closest('label').style.display = '';
            const gf = document.getElementById('heatmapGegnerFilter');
            if (gf) gf.closest('label').style.display = '';
        }

        // Default Logic (Main Heatmap)
        if (heatmapTeamToggle) {
            const isChecked = heatmapTeamToggle.getAttribute('data-state') === 'checked';
            if (isChecked) { showHeim = false; showGegner = true; }
            else { showHeim = true; showGegner = false; }
        }
        const playerSelect = document.getElementById('heatmapPlayerSelect');
        if (playerSelect && playerSelect.value !== 'all') {
            if (playerSelect.value.includes('|')) {
                const parts = playerSelect.value.split('|');
                if (parts.length === 2) playerFilter = parseInt(parts[1], 10);
            } else {
                playerFilter = parseInt(playerSelect.value, 10);
            }
        }
    }

    let showTore, showMissed, show7m;
    if (isHistory || (svgElement && svgElement.id === 'histHeatmapSvg')) {
        showTore = histHeatmapToreFilter?.checked ?? true;
        showMissed = histHeatmapMissedFilter?.checked ?? true;
        show7m = histHeatmap7mFilter?.checked ?? false;
    } else if (currentHeatmapContext?.type === 'history-specific' || currentHeatmapContext === 'season' || (currentHeatmapContext?.type === 'season-specific')) {
        // Robust filter ID discovery
        const toreF = document.getElementById('subtabSeasonHeatmapToreFilter') || document.getElementById('seasonHeatmapToreFilter');
        const missedF = document.getElementById('subtabSeasonHeatmapMissedFilter') || document.getElementById('seasonHeatmapMissedFilter');
        const sevenMF = document.getElementById('subtabSeasonHeatmap7mFilter') || document.getElementById('seasonHeatmap7mFilter');

        showTore = toreF ? toreF.checked : (heatmapToreFilter?.checked ?? true);
        showMissed = missedF ? missedF.checked : (heatmapMissedFilter?.checked ?? true);
        show7m = sevenMF ? sevenMF.checked : (heatmap7mFilter?.checked ?? false);
    } else if (currentHeatmapContext === 'liveOverview' || (svgElement && (svgElement.id === 'liveOverviewHeatmapSvg' || svgElement === liveOverviewHeatmapSvg))) {
        showTore = liveOverviewHeatmapToreFilter?.checked ?? true;
        showMissed = liveOverviewHeatmapMissedFilter?.checked ?? true;
        show7m = liveOverviewHeatmap7mFilter?.checked ?? false;
    } else {
        showTore = heatmapToreFilter?.checked ?? true;
        showMissed = heatmapMissedFilter?.checked ?? true;
        show7m = heatmap7mFilter?.checked ?? false;
    }

    const pointsTor = [];
    const pointsFeld = [];

    log.forEach(entry => {
        let isOpponent = entry.isOpponent;
        if (isOpponent === undefined) {
            const logActionIsGegner = entry.action?.startsWith('Gegner') || entry.gegnerNummer;
            const weAreGastAktuell = spielstand.settings.isAuswaertsspiel;
            isOpponent = weAreGastAktuell ? !logActionIsGegner : logActionIsGegner;
        }

        // Fix player filtering: skip if 'all' or null
        if (playerFilter !== null && playerFilter !== 'all') {
            if (showHeim) {
                if (isOpponent) return;
                const pNum = (entry.player && typeof entry.player === 'object') ? entry.player.number : entry.player;
                const checkNum = entry.playerId ?? pNum;
                if (String(checkNum) !== String(playerFilter)) return;
            } else {
                if (!isOpponent) return;
                const checkNum = entry.gegnerNummer ?? entry.playerId;
                if (String(checkNum) !== String(playerFilter)) return;
            }
        } else {
            if (isOpponent && !showGegner) return;
            if (!isOpponent && !showHeim) return;
        }

        const is7m = (entry.action && entry.action.toLowerCase().includes('7m')) || entry.is7m;
        if (is7m && !show7m) return;

        const actionLower = (entry.action || "").toLowerCase();
        const isGoal = actionLower === 'tor' || actionLower === 'gegner tor' || actionLower.includes('7m tor');
        const isMiss = actionLower.includes('fehlwurf') || actionLower.includes('vorbei') ||
            actionLower.includes('verworfen') || actionLower.includes('gehalten') || actionLower.includes('parade') ||
            actionLower.includes('block');

        const isSave = actionLower.includes('gehalten') || actionLower.includes('parade');

        if (isGoal && !is7m && !showTore) return;
        if (isMiss && !is7m && !showTore && show7m) return;
        if (isMiss && !showMissed) return;

        if (!isGoal && !isMiss) return;

        if (entry.wurfbild) {
            pointsTor.push({
                x: parseFloat(entry.wurfbild.x),
                y: parseFloat(entry.wurfbild.y),
                isOpponent, isGoal, isMiss,
                color: entry.wurfbild.color,
                isSave: isSave || entry.wurfbild.isSave
            });
        } else if (entry.x !== undefined && entry.x !== null) {
            pointsTor.push({
                x: parseFloat(entry.x), y: parseFloat(entry.y),
                isOpponent, isGoal, isMiss
            });
        }

        let pos = entry.wurfposition;
        if (is7m) pos = { x: 50, y: 29.0 };
        if (pos) {
            pointsFeld.push({
                x: parseFloat(pos.x), y: parseFloat(pos.y),
                isOpponent, isGoal, isMiss, isSave
            });
        }
    });

    const prefix = (svgElement.id || 'gen').replace(/[^a-zA-Z0-9]/g, '_');
    let svgContent = '';

    if (currentHeatmapTab === 'tor') {
        svgElement.setAttribute('viewBox', '0 -60 300 280');
        svgContent = drawGoalHeatmap(pointsTor, 0, prefix, isHistory);
        svgContent += `<text x="10" y="210" font-size="10" fill="#666">${pointsTor.length} Würfe angezeigt</text>`;
    } else if (currentHeatmapTab === 'feld') {
        svgElement.setAttribute('viewBox', '0 0 300 420');
        svgContent = drawFieldHeatmap(pointsFeld, 0, prefix, isHistory);
        svgContent += `<text x="10" y="410" font-size="10" fill="#666">${pointsFeld.length} Würfe angezeigt</text>`;
    } else if (currentHeatmapTab === 'kombiniert') {
        svgElement.setAttribute('viewBox', '0 0 300 500');
        const scaleGoal = 0.35;
        const xOffsetGoal = (300 - (300 * scaleGoal)) / 2;
        const yOffsetGoal = 24;
        const yOffsetField = 80;

        let linesContent = '<g>';
        // Get Colors for Lines
        const colors = getIdentityColors();
        const rgbUs = hexToRgb(colors.us);
        const rgbThem = hexToRgb(colors.them);

        log.forEach(entry => {
            let isOpponent = entry.isOpponent;
            if (isOpponent === undefined) {
                const logActionIsGegner = entry.action?.startsWith('Gegner') || entry.gegnerNummer;
                // Fallback to global setting if no perspective present
                const wag = (typeof weAreGastAktuell !== 'undefined' ? weAreGastAktuell : (spielstand?.settings?.isAuswaertsspiel || false));
                isOpponent = wag ? !logActionIsGegner : logActionIsGegner;
            }

            let visible = true;
            if (playerFilter !== null) {
                // Ensure we use the correct player number for filtering
                const pNum = (entry.player && typeof entry.player === 'object') ? entry.player.number : entry.player;
                const checkNum = entry.playerId ?? pNum;

                if (showHeim) {
                    if (isOpponent || (checkNum !== playerFilter)) visible = false;
                } else {
                    if (!isOpponent || (entry.gegnerNummer !== playerFilter)) visible = false;
                }
            } else {
                if (isOpponent && !showGegner) visible = false;
                if (!isOpponent && !showHeim) visible = false;
            }
            const is7m = entry.action?.includes('7m');
            if (is7m && !show7m) visible = false;
            const isGoal = entry.action === 'Tor' || entry.action === 'Gegner Tor' || entry.action?.includes('7m Tor');
            const isSave = entry.action?.toLowerCase().includes('parade') || entry.action?.toLowerCase().includes('gehalten');
            const isMiss = entry.action?.includes('Fehlwurf') || entry.action?.includes('Vorbei') || entry.action?.includes('Verworfen') || isSave;
            if (isGoal && !is7m && !showTore) visible = false;
            if (isMiss && !is7m && !showTore && show7m) visible = false;
            if (isMiss && !showMissed) visible = false;

            if (!visible) return;

            let pos = entry.wurfposition;
            if (is7m) pos = { x: 50, y: 29.0 };
            let wx = entry.wurfbild?.x ?? entry.x;
            let wy = entry.wurfbild?.y ?? entry.y;

            if (wx != null && wy != null && pos) {
                let rawGx = 25 + (parseFloat(wx) / 100) * 250;
                let rawGy = 10 + (parseFloat(wy) / 100) * 180;
                rawGx = Math.max(-10, Math.min(310, rawGx));
                rawGy = Math.max(-55, Math.min(195, rawGy));
                const gx = xOffsetGoal + (rawGx * scaleGoal);
                const gy = yOffsetGoal + (rawGy * scaleGoal);
                const fx = 10 + (parseFloat(pos.x) / 100) * 280;
                const fy = 10 + (parseFloat(pos.y) / 100) * 380 + yOffsetField;

                let c = isSave ? 'rgba(255, 193, 7, 0.5)' :
                    (isMiss ? 'rgba(108, 117, 125, 0.5)' :
                        (isOpponent ? `rgba(${rgbThem.r}, ${rgbThem.g}, ${rgbThem.b}, 0.5)`
                            : `rgba(${rgbUs.r}, ${rgbUs.g}, ${rgbUs.b}, 0.5)`));

                linesContent += `<line x1="${fx}" y1="${fy}" x2="${gx}" y2="${gy}" stroke="${c}" stroke-width="2" />`;
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
