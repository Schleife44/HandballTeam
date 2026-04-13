// modules/resultImage.js
// Instagram Result Image Generator using HTML5 Canvas

import { spielstand, speichereSpielstand } from './state.js';
import { customAlert, customConfirm } from './customDialog.js';
import { getGameResult } from './utils.js';

/**
 * Default social media settings
 */
function getSocialMediaDefaults() {
    return {
        backgroundImage: null,
        teamLogo: null,
        fontFamily: 'Oswald',
        seasonName: '25/26',
        teamLabel: '1. Herren',
        overlayOpacity: 0.55,
        ownTeamColor: '#ffffff',
        opponentColor: '#ef4444',
        customElements: [],
        positions: {
            ergebnisLabel: { x: 80, y: 960, fontSize: 110, bold: true },
            seasonLabel: { x: 155, y: 960, fontSize: 28, bold: false },
            statusGroup: { x: 1000, y: 160, fontSize: 72, bold: true },
            dateLabel: { x: 1000, y: 300, fontSize: 24, bold: false },
            vsLabel: { x: 660, y: 560, fontSize: 26, bold: false },
            ourScore: { x: 680, y: 460, fontSize: 160, bold: true },
            theirScore: { x: 680, y: 610, fontSize: 130, bold: true },
            teamLabel: { x: 540, y: 935, fontSize: 22, bold: false },
            logo: { x: 500, y: 950 }
        }
    };
}

/**
 * Ensures socialMedia settings exist with defaults
 */
export function ensureSocialMediaSettings() {
    const defaults = getSocialMediaDefaults();
    if (!spielstand.settings.socialMedia) {
        spielstand.settings.socialMedia = JSON.parse(JSON.stringify(defaults));
    } else {
        for (const key in defaults) {
            if (spielstand.settings.socialMedia[key] === undefined) {
                spielstand.settings.socialMedia[key] = JSON.parse(JSON.stringify(defaults[key]));
            }
        }
        // Ensure all position keys exist recursively
        for (const posKey in defaults.positions) {
            if (!spielstand.settings.socialMedia.positions[posKey]) {
                spielstand.settings.socialMedia.positions[posKey] = { ...defaults.positions[posKey] };
            }
        }
    }
    return spielstand.settings.socialMedia;
}

/**
 * Loads an image from a base64 string or URL
 */
function loadImage(src) {
    return new Promise((resolve, reject) => {
        if (!src) { resolve(null); return; }
        const img = new Image();
        if (src.startsWith('http')) {
            img.crossOrigin = 'anonymous';
        }
        img.onload = () => resolve(img);
        img.onerror = () => {
            console.error('[ResultImage] Fehler beim Laden des Bildes:', src.substring(0, 50) + '...');
            resolve(null);
        };
        img.src = src;
    });
}

/**
 * Draws text rotated -90 degrees (vertical, bottom to top)
 */
function drawVerticalText(ctx, text, x, y, font, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-Math.PI / 2);
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, 0);
    ctx.restore();
}

/**
 * Formats a date for display: "SA., 21.03. UM 19.30 UHR"
 */
function formatGameDate(dateStr) {
    const date = new Date(dateStr);
    const days = ['SO.', 'MO.', 'DI.', 'MI.', 'DO.', 'FR.', 'SA.'];
    const day = days[date.getDay()];
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${day}, ${dd}.${mm}. UM ${hh}.${min} UHR`;
}

/**
 * Looks up game time from calendar events if game.date has no time (00:00)
 */
function findCalendarTimeForDate(gameDate) {
    if (!gameDate) return null;
    const d = new Date(gameDate);
    // If the date already has a non-midnight time, use it
    if (d.getHours() !== 0 || d.getMinutes() !== 0) return null;
    
    const dateStr = d.toISOString().slice(0, 10); // YYYY-MM-DD
    const events = spielstand.calendarEvents || [];
    for (const ev of events) {
        if (ev.date === dateStr && ev.time) {
            return ev.time; // e.g. "19:30"
        }
    }
    return null;
}


// --- Editor State ---
let isEditMode = false;
let selectedBox = null;
let currentBoxes = [];
let dragState = {
    isDragging: false,
    action: null,
    activeBox: null,
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
    origScale: 1,
    origRot: 0,
    origCx: 0,
    origCy: 0,
    renderPending: false
};

// Caching to prevent flicker
let cachedBgImgSrc = null;
let cachedBgImg = null;
let cachedLogoImgSrc = null;
let cachedLogoImg = null;

/**
 * Helper to snap a value to a grid
 */
function snapToGrid(val, step = 20) {
    return Math.round(val / step) * step;
}

/**
 * Main render function — generates the result image on a canvas
 * @param {Object} game - The game data from history
 * @returns {HTMLCanvasElement}
 */
export async function generateResultImage(game) {
    const sm = ensureSocialMediaSettings();
    const pos = sm.positions || {};
    const canvas = document.getElementById('resultImageCanvas');
    if (!canvas) return null;

    const W = 1080;
    const H = 1080;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Reset boxes for this render
    currentBoxes = [];

    // Determine and load all required fonts
    const globalFont = sm.fontFamily || 'Oswald';
    const usedFonts = new Set([globalFont]);
    Object.values(pos).forEach(p => { if (p.fontFamily) usedFonts.add(p.fontFamily); });
    (sm.customElements || []).forEach(el => { if (el.type === 'text' && el.fontFamily) usedFonts.add(el.fontFamily); });

    try {
        const loadPromises = [];
        usedFonts.forEach(font => {
            loadPromises.push(document.fonts.load(`bold 60px "${font}"`));
            loadPromises.push(document.fonts.load(`400 30px "${font}"`));
        });
        await Promise.all(loadPromises);
    } catch (e) {
        console.warn('[ResultImage] Some fonts failed to load:', e);
    }

    // --- 1. Background ---
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, W, H);

    if (sm.backgroundImage && sm.backgroundImage !== cachedBgImgSrc) {
        cachedBgImgSrc = sm.backgroundImage;
        cachedBgImg = await loadImage(sm.backgroundImage);
    }
    const bgImg = sm.backgroundImage ? cachedBgImg : null;

    if (bgImg) {
        // Cover-fit the background
        const scale = Math.max(W / bgImg.width, H / bgImg.height);
        const sw = bgImg.width * scale;
        const sh = bgImg.height * scale;
        const sx = (W - sw) / 2;
        const sy = (H - sh) / 2;
        ctx.drawImage(bgImg, sx, sy, sw, sh);
    }

    // --- 2. Dark Overlay ---
    const overlayAlpha = sm.overlayOpacity ?? 0.55;
    ctx.fillStyle = `rgba(0, 0, 0, ${overlayAlpha})`;
    ctx.fillRect(0, 0, W, H);

    // --- 3. Determine game result ---
    const heimScore = game.score?.heim ?? 0;
    const gegnerScore = game.score?.gegner ?? 0;
    const result = getGameResult(game, spielstand.settings.myTeamName);

    let statusText = 'UNENTSCHIEDEN';
    if (result === 'win') {
        statusText = game.settings?.isAuswaertsspiel ? 'AUSWÄRTSSIEG' : 'HEIMSIEG';
    } else if (result === 'loss') {
        statusText = 'NIEDERLAGE';
    }

    // Migrate old win/loss color keys to new team color keys
    if (sm.winColor && !sm._colorMigrated) {
        if (!sm.ownTeamColor || sm.ownTeamColor === '#ef4444') sm.ownTeamColor = sm.winColor;
        if (!sm.opponentColor) sm.opponentColor = sm.lossColor || '#ef4444';
        sm._colorMigrated = true;
    }

    const ownTeamColor = sm.ownTeamColor || '#ffffff';
    const opponentColor = sm.opponentColor || '#ef4444';


    // Top score = ALWAYS Heim, Bottom score = ALWAYS Auswärts (Gegner)
    // Colors follow own team vs opponent
    const topScore = heimScore;
    const bottomScore = gegnerScore;
    const opponentName = game.settings?.isAuswaertsspiel
        ? game.teams?.heim || 'Gegner'    // We're away, opponent is the home team
        : game.teams?.gegner || 'Gegner'; // We're home, opponent is the away team

    let topScoreColor, bottomScoreColor;
    if (game.settings?.isAuswaertsspiel) {
        // We are the away team (bottom), opponent is home (top)
        topScoreColor = opponentColor;   // Top = Heim = Gegner
        bottomScoreColor = ownTeamColor; // Bottom = Auswärts = Wir
    } else {
        // We are the home team (top), opponent is away (bottom)
        topScoreColor = ownTeamColor;    // Top = Heim = Wir
        bottomScoreColor = opponentColor; // Bottom = Auswärts = Gegner
    }

    // Helper: Register a bounding box
    const registerBox = (key, x, y, w, h, drawFn) => {
        const p = sm.positions[key] || {};
        const scale = p.scale || 1;
        const rot = p.rotation || 0;
        const cx = x + w / 2;
        const cy = y + h / 2;

        currentBoxes.push({ key, x, y, w, h, scale, rot, cx, cy });

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate((rot * Math.PI) / 180);
        ctx.scale(scale, scale);
        ctx.translate(-cx, -cy);

        drawFn();
        
        if (isEditMode) {
            if (selectedBox === key) {
                // Selected item: Draw distinct handles
                ctx.strokeStyle = '#3b82f6'; // Bright blue
                ctx.setLineDash([]);
                ctx.lineWidth = 2 / scale;
                ctx.strokeRect(x, y, w, h);
                
                // Draw 4 corner resize handles
                ctx.fillStyle = '#ffffff';
                const s = 10 / scale; // Visual size 10px
                ctx.fillRect(x - s/2, y - s/2, s, s);
                ctx.fillRect(x + w - s/2, y - s/2, s, s);
                ctx.fillRect(x - s/2, y + h - s/2, s, s);
                ctx.fillRect(x + w - s/2, y + h - s/2, s, s);

                // Add a small rotation indicator line at the top
                ctx.beginPath();
                ctx.moveTo(x + w/2, y);
                ctx.lineTo(x + w/2, y - 20 / scale);
                ctx.stroke();
                // Rotation Handle circle
                ctx.beginPath();
                ctx.arc(x + w/2, y - 24 / scale, 4 / scale, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            } else {
                // Secondary items: dashed lines
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.setLineDash([5 / scale, 5 / scale]);
                ctx.lineWidth = 2 / scale;
                ctx.strokeRect(x, y, w, h);
            }
        }
        ctx.restore();
    };

    // --- 4. Vertical "ERGEBNIS" text ---
    const pErg = pos.ergebnisLabel || { x: 80, y: 960 };
    const ergFS = pErg.fontSize || 110;
    const ergBold = pErg.bold !== false ? 'bold' : '400';
    const ergFont = pErg.fontFamily || globalFont;
    ctx.font = `${ergBold} ${ergFS}px "${ergFont}", sans-serif`;
    const ergWidth = ctx.measureText('ERGEBNIS').width;
    registerBox('ergebnisLabel', pErg.x - ergFS/2, pErg.y - ergWidth, ergFS, ergWidth, () => {
        drawVerticalText(ctx, 'ERGEBNIS', pErg.x, pErg.y, `${ergBold} ${ergFS}px "${ergFont}", sans-serif`, '#ffffff');
    });

    const pSea = pos.seasonLabel || { x: 155, y: 960 };
    const seaFS = pSea.fontSize || 28;
    const seaBold = pSea.bold ? 'bold' : '400';
    const seaFont = pSea.fontFamily || globalFont;
    const seasonText = `DER SAISON ${sm.seasonName || '25/26'}`;
    ctx.font = `${seaBold} ${seaFS}px "${seaFont}", sans-serif`;
    const seaWidth = ctx.measureText(seasonText).width;
    registerBox('seasonLabel', pSea.x - seaFS/2, pSea.y - seaWidth, seaFS, seaWidth, () => {
        drawVerticalText(ctx, seasonText, pSea.x, pSea.y, `${seaBold} ${seaFS}px "${seaFont}", sans-serif`, 'rgba(255,255,255,0.7)');
    });

    // --- 5. Status text (Heimsieg/Niederlage) ---
    const pStatus = pos.statusGroup || { x: 1000, y: 160 };
    const statusFS = pStatus.fontSize || 72;
    const statusBold = pStatus.bold !== false ? 'bold' : '400';
    const statusFont = pStatus.fontFamily || globalFont;
    ctx.font = `${statusBold} ${statusFS}px "${statusFont}", sans-serif`;
    const statusMetrics = ctx.measureText(statusText);
    const sWidth = statusMetrics.width;
    registerBox('statusGroup', pStatus.x - sWidth, pStatus.y + 10, sWidth, statusFS + 8, () => {
        ctx.font = `${statusBold} ${statusFS}px "${statusFont}", sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillText(statusText, pStatus.x, pStatus.y + 10);
    });

    // --- 6. Date ---
    // Try to enrich the date with calendar time
    let gameDateStr = game.date;
    if (gameDateStr) {
        const calTime = findCalendarTimeForDate(gameDateStr);
        if (calTime) {
            const d = new Date(gameDateStr);
            const [hh, mm] = calTime.split(':');
            d.setHours(parseInt(hh), parseInt(mm));
            gameDateStr = d.toISOString();
        }
    }
    const dateText = gameDateStr ? formatGameDate(gameDateStr) : '';
    if (dateText) {
        const pDate = pos.dateLabel || { x: 1000, y: 300 };
        const dateFS = pDate.fontSize || 24;
        const dateBold = pDate.bold ? 'bold' : '400';
        const dateFont = pDate.fontFamily || globalFont;
        ctx.font = `${dateBold} ${dateFS}px "${dateFont}", sans-serif`;
        const dWidth = ctx.measureText(dateText).width;
        registerBox('dateLabel', pDate.x - dWidth, pDate.y, dWidth, dateFS + 6, () => {
            ctx.font = `${dateBold} ${dateFS}px "${dateFont}", sans-serif`;
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'top';
            ctx.fillText(dateText, pDate.x, pDate.y);
        });
    }

    // --- 7. Score components ---
    const pVs = pos.vsLabel || { x: 670, y: 560 };
    const vsFS = pVs.fontSize || 26;
    const vsBold = pVs.bold ? 'bold' : '400';
    const vsFont = pVs.fontFamily || globalFont;
    const vsTxt = `VS. ${opponentName.toUpperCase()}`;
    ctx.font = `${vsBold} ${vsFS}px "${vsFont}", sans-serif`;
    const vsW = ctx.measureText(vsTxt).width;
    registerBox('vsLabel', pVs.x - vsW, pVs.y - vsFS/2, vsW, vsFS + 4, () => {
        ctx.font = `${vsBold} ${vsFS}px "${vsFont}", sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(vsTxt, pVs.x, pVs.y);
    });

    const pOur = pos.ourScore || { x: 680, y: 460 };
    const ourFS = pOur.fontSize || 160;
    const ourBold = pOur.bold !== false ? 'bold' : '400';
    const ourFont = pOur.fontFamily || globalFont;
    ctx.font = `${ourBold} ${ourFS}px "${ourFont}", sans-serif`;
    const ourW = ctx.measureText(String(topScore)).width;
    registerBox('ourScore', pOur.x, pOur.y, ourW, ourFS, () => {
        ctx.font = `${ourBold} ${ourFS}px "${ourFont}", sans-serif`;
        ctx.fillStyle = topScoreColor;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(String(topScore), pOur.x, pOur.y);
    });

    const pTheir = pos.theirScore || { x: 680, y: 610 };
    const theirFS = pTheir.fontSize || 130;
    const theirBold = pTheir.bold !== false ? 'bold' : '400';
    const theirFont = pTheir.fontFamily || globalFont;
    ctx.font = `${theirBold} ${theirFS}px "${theirFont}", sans-serif`;
    const theirW = ctx.measureText(String(bottomScore)).width;
    registerBox('theirScore', pTheir.x, pTheir.y, theirW, theirFS, () => {
        ctx.font = `${theirBold} ${theirFS}px "${theirFont}", sans-serif`;
        ctx.fillStyle = bottomScoreColor;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(String(bottomScore), pTheir.x, pTheir.y);
    });

    // --- 8. Team Label ---
    const pTeam = pos.teamLabel || { x: 540, y: 935 };
    const teamFS = pTeam.fontSize || 22;
    const teamBold = pTeam.bold ? 'bold' : '400';
    const teamFont = pTeam.fontFamily || globalFont;
    const teamLabel = (sm.teamLabel || '1. Herren').toUpperCase();
    ctx.font = `${teamBold} ${teamFS}px "${teamFont}", sans-serif`;
    const teamW = ctx.measureText(teamLabel).width;
    registerBox('teamLabel', pTeam.x - teamW / 2, pTeam.y - teamFS, teamW, teamFS + 3, () => {
        ctx.font = `${teamBold} ${teamFS}px "${teamFont}", sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(teamLabel, pTeam.x, pTeam.y);
    });

    // --- 9. Logo ---
    const pLogo = pos.logo || { x: 500, y: 950 };
    if (sm.teamLogo && sm.teamLogo !== cachedLogoImgSrc) {
        cachedLogoImgSrc = sm.teamLogo;
        cachedLogoImg = await loadImage(sm.teamLogo);
    }
    const logoImg = sm.teamLogo ? cachedLogoImg : null;

    if (logoImg) {
        const logoSize = 80;
        registerBox('logo', pLogo.x, pLogo.y, logoSize, logoSize, () => {
            ctx.drawImage(logoImg, pLogo.x, pLogo.y, logoSize, logoSize);
        });
    }

    // --- 10. Custom Elements (user-added text & lines) ---
    const customEls = sm.customElements || [];
    customEls.forEach(el => {
        if (!pos[el.id]) {
            pos[el.id] = { x: el.x || 540, y: el.y || 540, fontSize: el.fontSize || 24, bold: !!el.bold };
        }
        const p = pos[el.id];
        if (el.type === 'text') {
            const fs = p.fontSize || el.fontSize || 24;
            const bw = p.bold ? 'bold' : '400';
            const fFam = p.fontFamily || el.fontFamily || globalFont;
            const color = el.color || '#ffffff';
            ctx.font = `${bw} ${fs}px "${fFam}", sans-serif`;
            const tw = ctx.measureText(el.text).width;
            registerBox(el.id, p.x, p.y, tw, fs + 4, () => {
                ctx.font = `${bw} ${fs}px "${fFam}", sans-serif`;
                ctx.fillStyle = color;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                ctx.fillText(el.text, p.x, p.y);
            });
        } else if (el.type === 'line') {
            const lineW = el.width || 400;
            const thickness = el.thickness || 2;
            const color = el.color || 'rgba(255,255,255,0.4)';
            registerBox(el.id, p.x - lineW/2, p.y - thickness/2, lineW, Math.max(thickness, 8), () => {
                ctx.strokeStyle = color;
                ctx.lineWidth = thickness;
                ctx.beginPath();
                ctx.moveTo(p.x - lineW/2, p.y);
                ctx.lineTo(p.x + lineW/2, p.y);
                ctx.stroke();
            });
        }
    });

    return canvas;
}

/**
 * Initializes Drag-and-Drop editor on the canvas
 */
function initCanvasEditor(game) {
    const canvas = document.getElementById('resultImageCanvas');
    if (!canvas) return;

    // Remove old listeners context by cloning node (dirty but effective to prevent duplicates)
    const newCanvas = canvas.cloneNode(true);
    canvas.parentNode.replaceChild(newCanvas, canvas);
    const ctx = newCanvas.getContext('2d');
    
    // Cloning canvas loses its drawn content, so we draw the original canvas content on it
    ctx.drawImage(canvas, 0, 0);

    const getMousePos = (e) => {
        const rect = newCanvas.getBoundingClientRect();
        // Calculate coordinate scale based on actual display size
        const scaleX = newCanvas.width / rect.width;
        const scaleY = newCanvas.height / rect.height;
        
        let clientX = e.clientX;
        let clientY = e.clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    };

    const onDown = (e) => {
        if (!isEditMode) return;
        const pos = getMousePos(e);
        let action = null;
        let targetBox = null;
        
        for (let i = currentBoxes.length - 1; i >= 0; i--) {
            const b = currentBoxes[i];
            
            // Inverse rotate the mouse position into the box's local coordinate space
            const rad = -(b.rot || 0) * Math.PI / 180;
            const dx = pos.x - b.cx;
            const dy = pos.y - b.cy;
            const localX = b.cx + dx * Math.cos(rad) - dy * Math.sin(rad);
            const localY = b.cy + dx * Math.sin(rad) + dy * Math.cos(rad);
            
            const realW = b.w * b.scale;
            const realH = b.h * b.scale;
            const rx = b.cx - realW / 2;
            const ry = b.cy - realH / 2;
            
            // Check Handles (if this box is already selected)
            if (selectedBox === b.key) {
                const s = 15; // Hit zone for corners
                // Top-Left corner
                if (Math.abs(localX - rx) < s && Math.abs(localY - ry) < s) { targetBox = b.key; action = 'resize'; break; }
                if (Math.abs(localX - (rx + realW)) < s && Math.abs(localY - ry) < s) { targetBox = b.key; action = 'resize'; break; }
                if (Math.abs(localX - rx) < s && Math.abs(localY - (ry + realH)) < s) { targetBox = b.key; action = 'resize'; break; }
                if (Math.abs(localX - (rx + realW)) < s && Math.abs(localY - (ry + realH)) < s) { targetBox = b.key; action = 'resize'; break; }
                
                // Rotator Area (slightly further out)
                if (localX >= rx - 30 && localX <= rx + realW + 30 &&
                    localY >= ry - 30 && localY <= ry + realH + 30 &&
                    !(localX >= rx && localX <= rx + realW && localY >= ry && localY <= ry + realH)) {
                    targetBox = b.key; action = 'rotate'; break;
                }
            }
            
            // Checking body of box
            if (localX >= rx && localX <= rx + realW && localY >= ry && localY <= ry + realH) {
                targetBox = b.key; action = 'move'; break;
            }
        }
        
        selectedBox = targetBox;
        if (window._smUpdatePropsPanel) window._smUpdatePropsPanel();
        if (!targetBox) {
            // Clicked outside. Just re-render to hide handles
            requestAnimationFrame(async () => await generateResultImage(game));
            return;
        }

        e.preventDefault();
        dragState.isDragging = true;
        dragState.action = action;
        dragState.activeBox = targetBox;
        dragState.startX = pos.x;
        dragState.startY = pos.y;
        
        const sm = ensureSocialMediaSettings();
        dragState.origX = sm.positions[targetBox].x;
        dragState.origY = sm.positions[targetBox].y;
        dragState.origScale = sm.positions[targetBox].scale || 1;
        dragState.origRot = sm.positions[targetBox].rotation || 0;
        
        const box = currentBoxes.find(b => b.key === targetBox);
        dragState.origCx = box.cx;
        dragState.origCy = box.cy;
        
        requestAnimationFrame(async () => await generateResultImage(game));
    };

    const onMove = async (e) => {
        if (!isEditMode) return;
        
        if (!dragState.isDragging) {
            // Updated cursor hover logic
            const pos = getMousePos(e);
            let hovering = false;
            for (const b of currentBoxes) {
                const rad = -(b.rot || 0) * Math.PI / 180;
                const dx = pos.x - b.cx;
                const dy = pos.y - b.cy;
                const localX = b.cx + dx * Math.cos(rad) - dy * Math.sin(rad);
                const localY = b.cy + dx * Math.sin(rad) + dy * Math.cos(rad);
                const realW = b.w * b.scale;
                const realH = b.h * b.scale;
                const rx = b.cx - realW / 2;
                const ry = b.cy - realH / 2;
                
                if (selectedBox === b.key) {
                    const s = 15;
                    if ((Math.abs(localX - rx) < s && Math.abs(localY - ry) < s) ||
                        (Math.abs(localX - (rx + realW)) < s && Math.abs(localY - ry) < s) ||
                        (Math.abs(localX - rx) < s && Math.abs(localY - (ry + realH)) < s) ||
                        (Math.abs(localX - (rx + realW)) < s && Math.abs(localY - (ry + realH)) < s)) {
                        hovering = 'nwse-resize'; break;
                    }
                    if (localX >= rx - 30 && localX <= rx + realW + 30 &&
                        localY >= ry - 30 && localY <= ry + realH + 30 &&
                        !(localX >= rx && localX <= rx + realW && localY >= ry && localY <= ry + realH)) {
                        const rotateCursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="white" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>') 12 12, auto`;
                        hovering = rotateCursor; break;
                    }
                }
                
                if (localX >= rx && localX <= rx + realW && localY >= ry && localY <= ry + realH) {
                    hovering = 'grab'; break;
                }
            }
            newCanvas.style.cursor = hovering ? hovering : 'default';
            return;
        }

        e.preventDefault();
        const pos = getMousePos(e);
        const sm = ensureSocialMediaSettings();
        
        if (dragState.action === 'move') {
            const dx = pos.x - dragState.startX;
            const dy = pos.y - dragState.startY;
            sm.positions[dragState.activeBox].x = snapToGrid(dragState.origX + dx, 20);
            sm.positions[dragState.activeBox].y = snapToGrid(dragState.origY + dy, 20);
        } else if (dragState.action === 'resize') {
            const origDist = Math.hypot(dragState.startX - dragState.origCx, dragState.startY - dragState.origCy);
            const newDist = Math.hypot(pos.x - dragState.origCx, pos.y - dragState.origCy);
            if (origDist > 0) {
                const ratio = newDist / origDist;
                sm.positions[dragState.activeBox].scale = Math.max(0.1, dragState.origScale * ratio);
            }
        } else if (dragState.action === 'rotate') {
            const origAngle = Math.atan2(dragState.startY - dragState.origCy, dragState.startX - dragState.origCx);
            const newAngle = Math.atan2(pos.y - dragState.origCy, pos.x - dragState.origCx);
            const deltaAngle = (newAngle - origAngle) * 180 / Math.PI;
            
            let rawRot = dragState.origRot + deltaAngle;
            // Magnetic snap to nearest 90 degrees (with a 10-degree catch zone)
            let snapRot = Math.round(rawRot / 90) * 90;
            if (Math.abs(rawRot - snapRot) < 10) {
                rawRot = snapRot;
            }
            
            sm.positions[dragState.activeBox].rotation = Math.round(rawRot);
        }

        if (!dragState.renderPending) {
            dragState.renderPending = true;
            requestAnimationFrame(async () => {
                await generateResultImage(game);
                dragState.renderPending = false;
            });
        }
    };

    const onUp = (e) => {
        if (dragState.isDragging) {
            console.log('[ResultImage] onUp: finished dragging box', dragState.activeBox);
            dragState.isDragging = false;
        }
    };

    const onWheel = (e) => {
        if (!isEditMode) return;
        const pos = getMousePos(e);
        let targetBox = null;
        for (let i = currentBoxes.length - 1; i >= 0; i--) {
            const b = currentBoxes[i];
            const realW = b.w * b.scale;
            const realH = b.h * b.scale;
            const rx = b.cx - realW / 2;
            const ry = b.cy - realH / 2;
            if (pos.x >= rx - 10 && pos.x <= rx + realW + 10 &&
                pos.y >= ry - 10 && pos.y <= ry + realH + 10) {
                targetBox = b.key;
                break;
            }
        }
        
        if (!targetBox) return;
        e.preventDefault();

        const sm = ensureSocialMediaSettings();
        if (sm.positions[targetBox].scale === undefined) sm.positions[targetBox].scale = 1;
        if (sm.positions[targetBox].rotation === undefined) sm.positions[targetBox].rotation = 0;

        if (e.shiftKey) {
            // Rotate
            sm.positions[targetBox].rotation += (e.deltaY > 0 ? 5 : -5);
        } else {
            // Scale
            let delta = e.deltaY > 0 ? -0.05 : 0.05;
            sm.positions[targetBox].scale = Math.max(0.2, sm.positions[targetBox].scale + delta);
        }

        // Render request immediately
        requestAnimationFrame(async () => {
            await generateResultImage(game);
        });
    };

    newCanvas.addEventListener('mousedown', onDown);
    newCanvas.addEventListener('mousemove', onMove);
    newCanvas.addEventListener('mouseup', onUp);
    newCanvas.addEventListener('mouseleave', onUp);
    newCanvas.addEventListener('wheel', onWheel, {passive: false});

    newCanvas.addEventListener('touchstart', onDown, {passive: false});
    newCanvas.addEventListener('touchmove', onMove, {passive: false});
    newCanvas.addEventListener('touchend', onUp);
    console.log('[ResultImage] initCanvasEditor finished attaching events.');
}

/**
 * Opens the result image modal and triggers generation
 * @param {Object} game - Game metadata for rendering.
 * @param {boolean} isSettingsMode - If true, boots directly into edit mode and hides download button.
 */
export async function showResultImageModal(gameSource, isSettingsMode = false) {
    const modal = document.getElementById('resultImageModal');
    if (!modal) {
        await customAlert('Ergebnisbild-Modal nicht gefunden.', 'Fehler');
        return;
    }

    // Work on a deep clone of the game so mocking buttons dont affect original state
    const game = JSON.parse(JSON.stringify(gameSource));
    if (game.date === undefined) game.date = new Date().toISOString(); 

    modal.classList.remove('versteckt');
    isEditMode = isSettingsMode;
    document.getElementById('resultImageEditorOverlay')?.classList.toggle('versteckt', !isEditMode);
    document.getElementById('smEditorToolbar')?.classList.toggle('versteckt', !isEditMode);

    const editControls = document.getElementById('resultImageEditorControlsArea');
    const dlControls = document.getElementById('resultImageDownloadControlsArea');
    
    if (editControls) editControls.style.display = isSettingsMode ? 'flex' : 'none';
    if (dlControls) dlControls.style.display = isSettingsMode ? 'none' : 'flex';

    // Show loading state
    const canvas = document.getElementById('resultImageCanvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        canvas.width = 1080;
        canvas.height = 1080;
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, 1080, 1080);
        ctx.font = '24px sans-serif';
        ctx.fillStyle = '#888';
        ctx.textAlign = 'center';
        ctx.fillText('Bild wird generiert...', 540, 540);
    }

    // Generate & bind UI logic
    await generateResultImage(game);
    initCanvasEditor(game);

    // Setup Edit Mode Button
    const toggleBtn = document.getElementById('toggleImageEditorBtn');
    console.log('[ResultImage] Setting up toggle button. Found original toggleBtn:', !!toggleBtn);
    if (toggleBtn) {
        // Clone to remove old listeners
        const newToggle = toggleBtn.cloneNode(true);
        toggleBtn.parentNode.replaceChild(newToggle, toggleBtn);
        // Force state for settings
        newToggle.classList.toggle('shadcn-btn-primary', isEditMode);
        newToggle.classList.toggle('shadcn-btn-outline', !isEditMode);
        
        const updateToggleBtnUI = () => {
            console.log('[ResultImage] updateToggleBtnUI called. isEditMode is now:', isEditMode);
            if (isEditMode) {
                newToggle.innerHTML = '<i data-lucide="eye" style="width: 16px; height: 16px; margin-right: 6px;"></i> Vorschau ansehen';
                document.getElementById('resultImageCanvas').style.cursor = 'grab';
            } else {
                newToggle.innerHTML = '<i data-lucide="edit-3" style="width: 16px; height: 16px; margin-right: 6px;"></i> Layout bearbeiten';
                document.getElementById('resultImageCanvas').style.cursor = 'default';
            }
            if (window.lucide) window.lucide.createIcons();
            
            // Toggle the small top-left hint pill as well
            const overlay = document.getElementById('resultImageEditorOverlay');
            if (overlay) overlay.classList.toggle('versteckt', !isEditMode);

            // Toggle the new top toolbar
            const toolbar = document.getElementById('smEditorToolbar');
            if (toolbar) toolbar.classList.toggle('versteckt', !isEditMode);

            // Toggle the manual save button
            const saveStandard = document.getElementById('saveStandardLayoutBtn');
            if (saveStandard) saveStandard.classList.toggle('versteckt', !isEditMode);
        };
        updateToggleBtnUI();

        newToggle.onclick = async (e) => {
            console.log('[ResultImage] Toggle button CLICKED! Event:', e);
            console.log('[ResultImage] Before toggle, isEditMode =', isEditMode);
            isEditMode = !isEditMode;
            if (!isEditMode) {
                selectedBox = null;
                if (window._smUpdatePropsPanel) window._smUpdatePropsPanel();
            }
            console.log('[ResultImage] After toggle, isEditMode =', isEditMode);
            newToggle.classList.toggle('shadcn-btn-primary', isEditMode);
            newToggle.classList.toggle('shadcn-btn-outline', !isEditMode);
            updateToggleBtnUI();
            console.log('[ResultImage] Re-rendering canvas...');
            await generateResultImage(game); // Re-render to show/hide outlines
            console.log('[ResultImage] Re-render complete.');
        };
    } else {
        console.warn('[ResultImage] toggleImageEditorBtn not found in DOM!');
    }

    // Setup Reset Buttons
    const resetBtn = document.getElementById('resetImageLayoutBtn');
    if (resetBtn) {
        const newReset = resetBtn.cloneNode(true);
        resetBtn.parentNode.replaceChild(newReset, resetBtn);
        newReset.onclick = async () => {
            const confirmed = await customConfirm("Alle Positionen und Skalierungen wirklich zurücksetzen?", "Zurücksetzen?");
            if (confirmed) {
                const sm = ensureSocialMediaSettings();
                sm.positions = {
                    ergebnisLabel: { x: 80, y: 960 },
                    seasonLabel: { x: 155, y: 960 },
                    statusGroup: { x: 1000, y: 160 },
                    dateLabel: { x: 1000, y: 300 },
                    vsLabel: { x: 670, y: 560 },
                    ourScore: { x: 680, y: 460 },
                    theirScore: { x: 680, y: 610 },
                    teamLabel: { x: 540, y: 935 },
                    logo: { x: 500, y: 950 }
                };
                await generateResultImage(game);
            }
        };
    }

    // --- SETUP DATA CORRECTION ---
    const correctionPanel = document.getElementById('smDataCorrectionPanel');
    const toggleCorrectionBtn = document.getElementById('toggleDataCorrectionBtn');
    
    if (correctionPanel) {
        correctionPanel.classList.add('versteckt');
    }

    if (toggleCorrectionBtn && correctionPanel && !isSettingsMode) {
        const newToggleCorr = toggleCorrectionBtn.cloneNode(true);
        toggleCorrectionBtn.parentNode.replaceChild(newToggleCorr, toggleCorrectionBtn);
        newToggleCorr.classList.remove('shadcn-btn-primary'); // Ensure start state is outline
        newToggleCorr.onclick = () => {
            correctionPanel.classList.toggle('versteckt');
            newToggleCorr.classList.toggle('shadcn-btn-primary', !correctionPanel.classList.contains('versteckt'));
        };

        // Initialize values
        const inHeim = document.getElementById('corrScoreHeim');
        const inGegner = document.getElementById('corrScoreGegner');
        const inDate = document.getElementById('corrDate');
        const inTime = document.getElementById('corrTime');

        if (inHeim) inHeim.value = game.score.heim;
        if (inGegner) inGegner.value = game.score.gegner;
        if (inDate && game.date) inDate.value = new Date(game.date).toISOString().split('T')[0];
        if (inTime && game.date) inTime.value = new Date(game.date).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

        const onDataChange = async () => {
            game.score.heim = parseInt(inHeim.value) || 0;
            game.score.gegner = parseInt(inGegner.value) || 0;
            if (inDate.value && inTime.value) {
                game.date = new Date(`${inDate.value}T${inTime.value}`).toISOString();
            }
            await generateResultImage(game);
        };

        [inHeim, inGegner, inDate, inTime].forEach(el => {
            if (el) el.oninput = onDataChange;
        });

        [inHeim, inGegner, inDate, inTime].forEach(el => {
            if (el) el.oninput = onDataChange;
        });
    }

    // Setup Manual Save Button
    const saveStandardBtn = document.getElementById('saveStandardLayoutBtn');
    if (saveStandardBtn) {
        saveStandardBtn.classList.toggle('versteckt', !isEditMode);
        const newSaveStandard = saveStandardBtn.cloneNode(true);
        saveStandardBtn.parentNode.replaceChild(newSaveStandard, saveStandardBtn);
        newSaveStandard.onclick = async () => {
            speichereSpielstand();
            await customAlert('Das aktuelle Layout wurde als Standard gespeichert.', 'Gespeichert');
        };
    }

    // Setup Save Design Button
    const saveBtn = document.getElementById('saveImageLayoutBtn');
    if (saveBtn) {
        saveBtn.style.display = isEditMode ? 'inline-flex' : 'none';
        const newSave = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newSave, saveBtn);
        newSave.onclick = async () => {
            const { customPrompt } = await import('./customDialog.js');
            const designName = await customPrompt('Wie soll das Design heißen? (z.B. "Heimspiel Basis")', 'Design speichern');
            if (!designName) return;

            const sm = ensureSocialMediaSettings();
            if (!sm.presets) sm.presets = [];

            // Full State Snapshot
            const snapshot = JSON.parse(JSON.stringify(sm));
            delete snapshot.presets; // Don't nest presets
            
            sm.presets.push({
                id: Date.now().toString(),
                name: designName,
                data: snapshot
            });

            speichereSpielstand();
            await customAlert(`Design "${designName}" wurde erfolgreich gespeichert.`, 'Gespeichert');
        };
    }

    // Setup Sandbox Mocking Buttons
    const sandboxButtons = document.querySelectorAll('.sm-sandbox-btn');
    const origTeams = JSON.parse(JSON.stringify(game.teams)); // Save original team names
    sandboxButtons.forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.onclick = async () => {
            const mockType = newBtn.dataset.mock;
            if (mockType === 'home-win') {
                // Heimspiel, wir gewinnen
                game.score = { heim: 28, gegner: 22 };
                game.teams = { heim: origTeams.heim, gegner: origTeams.gegner };
                game.settings.isAuswaertsspiel = false;
            } else if (mockType === 'draw') {
                // Heimspiel, Unentschieden
                game.score = { heim: 25, gegner: 25 };
                game.teams = { heim: origTeams.heim, gegner: origTeams.gegner };
                game.settings.isAuswaertsspiel = false;
            } else if (mockType === 'away-win') {
                // Heimspiel, Gegner gewinnt (Gastsieg)
                game.score = { heim: 22, gegner: 28 };
                game.teams = { heim: origTeams.heim, gegner: origTeams.gegner };
                game.settings.isAuswaertsspiel = false;
            } else if (mockType === 'away-loss') {
                // Auswärtsspiel, wir gewinnen (Auswärtssieg)
                // Bei Auswärtsspiel: heim = Gastgeber (Gegner), gegner = Wir
                game.score = { heim: 25, gegner: 30 };
                game.teams = { heim: origTeams.gegner, gegner: origTeams.heim };
                game.settings.isAuswaertsspiel = true;
            }
            await generateResultImage(game);
        };
    });

    // Setup Element Properties Panel
    const propsPanel = document.getElementById('smElementPropsPanel');
    const fontSizeSlider = document.getElementById('smElFontSize');
    const fontSizeVal = document.getElementById('smElFontSizeVal');
    const boldToggle = document.getElementById('smElBoldToggle');
    const fontDropdown = document.getElementById('smElFontFamily');
    const deleteBtn = document.getElementById('smElDeleteBtn');

    const updatePropsPanel = () => {
        if (!propsPanel) return;
        if (!selectedBox || !isEditMode) {
            propsPanel.classList.add('versteckt');
            return;
        }
        const sm = ensureSocialMediaSettings();
        const p = sm.positions[selectedBox];
        if (!p) { propsPanel.classList.add('versteckt'); return; }

        propsPanel.classList.remove('versteckt');
        const fs = p.fontSize || 24;
        if (fontSizeSlider) { fontSizeSlider.value = fs; }
        if (fontSizeVal) { fontSizeVal.textContent = fs; }
        if (fontDropdown) {
            fontDropdown.value = p.fontFamily || sm.fontFamily || 'Oswald';
        }
        if (boldToggle) {
            boldToggle.style.background = p.bold ? '#3b82f6' : 'rgba(255,255,255,0.15)';
        }
        // Only show delete for custom elements
        const isCustom = selectedBox.startsWith('txt_') || selectedBox.startsWith('line_');
        if (deleteBtn) deleteBtn.style.display = isCustom ? 'inline-flex' : 'none';
        // Hide font controls for non-text elements (like logo, line)
        const isLine = selectedBox.startsWith('line_') || selectedBox === 'logo';
        if (fontSizeSlider) fontSizeSlider.style.display = isLine ? 'none' : 'inline';
        if (fontSizeVal) fontSizeVal.style.display = isLine ? 'none' : 'inline';
        if (fontDropdown) fontDropdown.style.display = isLine ? 'none' : 'inline';
        if (boldToggle) boldToggle.style.display = isLine ? 'none' : 'inline-flex';
        const sizeLabel = propsPanel.querySelector('label');
        if (sizeLabel) sizeLabel.style.display = isLine ? 'none' : 'inline';
    };

    if (fontDropdown) {
        fontDropdown.onchange = async () => {
            if (!selectedBox) return;
            const sm = ensureSocialMediaSettings();
            if (sm.positions[selectedBox]) {
                sm.positions[selectedBox].fontFamily = fontDropdown.value;
                await generateResultImage(game);
            }
        };
    }

    if (fontSizeSlider) {
        fontSizeSlider.oninput = async () => {
            if (!selectedBox) return;
            const sm = ensureSocialMediaSettings();
            if (sm.positions[selectedBox]) {
                sm.positions[selectedBox].fontSize = parseInt(fontSizeSlider.value);
                if (fontSizeVal) fontSizeVal.textContent = fontSizeSlider.value;
                await generateResultImage(game);
            }
        };
    }

    if (boldToggle) {
        boldToggle.onclick = async () => {
            if (!selectedBox) return;
            const sm = ensureSocialMediaSettings();
            if (sm.positions[selectedBox]) {
                sm.positions[selectedBox].bold = !sm.positions[selectedBox].bold;
                boldToggle.style.background = sm.positions[selectedBox].bold ? '#3b82f6' : 'rgba(255,255,255,0.15)';
                await generateResultImage(game);
            }
        };
    }

    if (deleteBtn) {
        deleteBtn.onclick = async () => {
            if (!selectedBox) return;
            const sm = ensureSocialMediaSettings();
            const isCustom = selectedBox.startsWith('txt_') || selectedBox.startsWith('line_');
            if (!isCustom) return;
            sm.customElements = (sm.customElements || []).filter(e => e.id !== selectedBox);
            delete sm.positions[selectedBox];
            selectedBox = null;
            updatePropsPanel();
            await generateResultImage(game);
        };
    }

    // Expose updatePropsPanel so canvas click can trigger it
    window._smUpdatePropsPanel = updatePropsPanel;

    // Setup Add Text Button
    const addTextBtn = document.getElementById('smAddTextBtn');
    if (addTextBtn) {
        const newAddText = addTextBtn.cloneNode(true);
        addTextBtn.parentNode.replaceChild(newAddText, addTextBtn);
        newAddText.onclick = async () => {
            const { customPrompt } = await import('./customDialog.js');
            const text = await customPrompt('Welchen Text möchtest du hinzufügen?', 'Text hinzufügen');
            if (!text) return;
            const sm = ensureSocialMediaSettings();
            if (!sm.customElements) sm.customElements = [];
            const id = 'txt_' + Date.now();
            sm.customElements.push({ id, type: 'text', text, x: 540, y: 540, fontSize: 32, bold: false, color: '#ffffff' });
            sm.positions[id] = { x: 540, y: 540, fontSize: 32, bold: false };
            selectedBox = id;
            await generateResultImage(game);
            updatePropsPanel();
        };
    }

    // Setup Add Line Button
    const addLineBtn = document.getElementById('smAddLineBtn');
    if (addLineBtn) {
        const newAddLine = addLineBtn.cloneNode(true);
        addLineBtn.parentNode.replaceChild(newAddLine, addLineBtn);
        newAddLine.onclick = async () => {
            const sm = ensureSocialMediaSettings();
            if (!sm.customElements) sm.customElements = [];
            const id = 'line_' + Date.now();
            sm.customElements.push({ id, type: 'line', x: 540, y: 540, width: 400, color: 'rgba(255,255,255,0.4)', thickness: 2 });
            sm.positions[id] = { x: 540, y: 540 };
            selectedBox = id;
            await generateResultImage(game);
            updatePropsPanel();
        };
    }

    // Setup download button
    const downloadBtn = document.getElementById('downloadResultImage');
    if (downloadBtn) {
        const newDl = downloadBtn.cloneNode(true);
        downloadBtn.parentNode.replaceChild(newDl, downloadBtn);
        newDl.onclick = () => {
            const finalCanvas = document.getElementById('resultImageCanvas');
            triggerDownloadClick(finalCanvas, game);
        };
    }
}

function triggerDownloadClick(canvas, game) {
    const link = document.createElement('a');
    const dateStr = game.date ? new Date(game.date).toISOString().slice(0, 10) : 'spiel';
    const opponent = (game.teams?.gegner || 'gegner').replace(/\s+/g, '_');
    link.download = `ergebnis_vs_${opponent}_${dateStr}.png`;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

