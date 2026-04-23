export function formatiereZeit(sekunden) {
    const h = Math.floor(sekunden / 3600);
    const min = Math.floor((sekunden % 3600) / 60);
    const sek = Math.floor(sekunden % 60);
    
    const formatierteSek = sek < 10 ? '0' + sek : sek;
    
    if (h > 0) {
        const formatierteMin = min < 10 ? '0' + min : min;
        return `${h}:${formatierteMin}:${formatierteSek}`;
    } else {
        // Only show MM:SS if it's less than an hour
        return `${min}:${formatierteSek}`;
    }
}

/**
 * Parses a time string (MM:SS or HH:MM:SS) into total seconds.
 * @param {string} timeStr - The time string to parse
 * @returns {number} - Total seconds
 */
export function parseTime(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return 0;
    const parts = timeStr.split(':');
    if (parts.length === 2) {
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    } else if (parts.length === 3) {
        return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
    }
    return parseInt(timeStr) || 0;
}

/**
 * Calculate appropriate text color (dark or light) based on background color brightness
 * @param {string} hexColor - Hex color code (e.g., "#dc3545")
 * @returns {string} - Either "#000000" for dark text or "#ffffff" for light text
 */
export function getContrastTextColor(hexColor) {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
}

/**
 * Bestimmt, ob "mein Team" gewonnen hat
 */
export function getGameResult(game, currentMyTeamName = null) {
    const heimName = (game.settings?.teamNameHeim || game.teams?.heim || '').toLowerCase().trim();
    const gastName = (game.settings?.teamNameGegner || game.teams?.gegner || '').toLowerCase().trim();
    let myTeamName = (game.settings?.myTeamName || currentMyTeamName || '').toLowerCase().trim();
    let myScore, opponentScore;

    if (myTeamName && heimName && myTeamName === heimName) {
        myScore = game.score.heim;
        opponentScore = game.score.gegner;
    } else if (myTeamName && gastName && myTeamName === gastName) {
        myScore = game.score.gegner;
        opponentScore = game.score.heim;
    } else if (game.settings && game.settings.isAuswaertsspiel !== undefined) {
        const isAway = game.settings.isAuswaertsspiel;
        myScore = isAway ? game.score.gegner : game.score.heim;
        opponentScore = isAway ? game.score.heim : game.score.gegner;
    } else {
        myScore = game.score.heim;
        opponentScore = game.score.gegner;
    }

    if (myScore > opponentScore) return 'win';
    if (myScore < opponentScore) return 'loss';
    return 'draw';
}

/**
 * Simple HTML Escaper
 */
export function escapeHTML(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>"']/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
}

/**
 * Basic HTML Sanitizer
 */
export function sanitizeHTML(html) {
    if (typeof html !== 'string') return html;
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const scripts = temp.querySelectorAll('script, iframe, object, embed, form');
    scripts.forEach(s => s.remove());
    const allElements = temp.querySelectorAll('*');
    allElements.forEach(el => {
        const attrs = el.attributes;
        for (let i = attrs.length - 1; i >= 0; i--) {
            if (attrs[i].name.startsWith('on')) {
                el.removeAttribute(attrs[i].name);
            }
        }
    });
    return temp.innerHTML;
}

/**
 * Goal Zone Calculation
 */
export function calculateGoalZone(xPercent, yPercent) {
    const col = Math.min(2, Math.floor(xPercent / (100 / 3)));
    const row = Math.min(2, Math.floor(yPercent / (100 / 3)));
    return (row * 3) + col + 1;
}

/**
 * Robust fetch utility
 */
export async function fetchWithProxy(url, options = { json: false }) {
    const cleanUrl = url.replace('webcal://', 'https://').trim();
    let content = null;
    let lastError = null;

    const proxies = [
        { name: 'Codetabs', getUrl: (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`, parse: async (res) => await res.text() },
        { name: 'CORSProxy.io', getUrl: (u) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`, parse: async (res) => await res.text() },
        { name: 'AllOrigins', getUrl: (u) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`, parse: async (res) => { const data = await res.json(); return data.contents; } }
    ];

    for (const proxy of proxies) {
        try {
            const res = await fetch(proxy.getUrl(cleanUrl));
            if (res.ok) {
                const raw = await proxy.parse(res);
                if (raw && raw.length > 5) { content = raw; break; }
            }
        } catch (err) { lastError = err; }
    }

    if (!content) throw new Error(lastError ? `Alle Proxies fehlgeschlagen: ${lastError.message}` : "Inhalt konnte nicht geladen werden.");
    if (options.json) {
        try { return JSON.parse(content); } catch (e) { throw new Error("Proxy-Antwort ist kein gültiges JSON."); }
    }
    return content;
}

/**
 * Field Zone Calculation
 */
export function calculateFieldZone(xPercent, yPercent) {
    const vbX = 10 + (xPercent / 100) * 280;
    const vbY = 10 + (yPercent / 100) * 380;
    if (vbY >= 220) return 9;
    const xSym = 150 - Math.abs(150 - vbX);
    let y9m = 18;
    if (xSym >= 37) {
        const t = Math.sqrt((xSym - 37) / 113);
        y9m = 18 * Math.pow(1 - t, 2) + 150 * (2 * t - t * t);
    }
    const isOutside9m = vbY > y9m || xSym < 37;
    const xDiv2 = 111.8 - 0.355 * (vbY - 83.5);
    const xDiv3 = 300 - xDiv2;
    if (isOutside9m) {
        if (vbX < xDiv2) return 6;
        if (vbX > xDiv3) return 8;
        return 7;
    } else {
        const xDiv1 = 81.8 - 1.13 * (vbY - 54.7);
        const xDiv4 = 300 - xDiv1;
        if (vbX < xDiv1) return 1;
        if (vbX < xDiv2) return 2;
        if (vbX < xDiv3) return 3;
        if (vbX < xDiv4) return 4;
        return 5;
    }
}
