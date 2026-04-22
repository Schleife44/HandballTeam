export function formatiereZeit(sekunden) {
    const min = Math.floor(sekunden / 60);
    const sek = Math.floor(sekunden % 60);
    const formatierteMin = min < 10 ? '0' + min : min;
    const formatierteSek = sek < 10 ? '0' + sek : sek;
    return `${formatierteMin}:${formatierteSek}`;
}

/**
 * Calculate appropriate text color (dark or light) based on background color brightness
 * @param {string} hexColor - Hex color code (e.g., "#dc3545")
 * @returns {string} - Either "#000000" for dark text or "#ffffff" for light text
 */
export function getContrastTextColor(hexColor) {
    // Remove # if present
    const hex = hexColor.replace('#', '');

    // Convert to RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Calculate relative luminance using WCAG formula
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return dark text for light backgrounds, light text for dark backgrounds
    return luminance > 0.5 ? '#000000' : '#ffffff';
}

/**
 * Bestimmt, ob "mein Team" gewonnen hat
 * @param {Object} game - Spiel-Objekt mit score und settings
 * @param {string} currentMyTeamName - Aktueller Team-Name aus globalen Settings (optional)
 * @returns {string} - 'win', 'loss', oder 'draw'
 */
export function getGameResult(game, currentMyTeamName = null) {
    // Get team names from the saved game
    const heimName = (game.settings?.teamNameHeim || game.teams?.heim || '').toLowerCase().trim();
    const gastName = (game.settings?.teamNameGegner || game.teams?.gegner || '').toLowerCase().trim();

    // Get "my team name" from the saved game or use current
    let myTeamName = (game.settings?.myTeamName || currentMyTeamName || '').toLowerCase().trim();

    let myScore, opponentScore;

    // STRATEGY 1: Try to match myTeamName to determine which side we were on
    if (myTeamName && heimName && myTeamName === heimName) {
        // We were the Heim team
        myScore = game.score.heim;
        opponentScore = game.score.gegner;
    } else if (myTeamName && gastName && myTeamName === gastName) {
        // We were the Gast team
        myScore = game.score.gegner;
        opponentScore = game.score.heim;
    } else if (game.settings && game.settings.isAuswaertsspiel !== undefined) {
        // STRATEGY 2: Use isAuswaertsspiel if available
        const isAway = game.settings.isAuswaertsspiel;
        myScore = isAway ? game.score.gegner : game.score.heim;
        opponentScore = isAway ? game.score.heim : game.score.gegner;
    } else {
        // FALLBACK: Assume we were Heim
        myScore = game.score.heim;
        opponentScore = game.score.gegner;
    }

    if (myScore > opponentScore) return 'win';
    if (myScore < opponentScore) return 'loss';
    return 'draw';
}

/**
 * Simple HTML Escaper to prevent XSS
 */
export function escapeHTML(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>"']/g, function(m) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[m];
    });
}

/**
 * Basic HTML Sanitizer - allows some safe structural tags for templates
 * This is used to wrap tr.innerHTML or div.innerHTML safely.
 */
export function sanitizeHTML(html) {
    if (typeof html !== 'string') return html;
    // In a real app we'd use DOMPurify, but for this context:
    // We allow <td> <tr> <span> <strong> <i> <button> and common attributes
    // but strip <script> <iframe> etc.
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    const scripts = temp.querySelectorAll('script, iframe, object, embed, form');
    scripts.forEach(s => s.remove());
    
    // Also remove inline event handlers (onmouseover, onclick, etc.) 
    // unless they are explicitly needed in some templates and we trust them.
    // However, modern web apps should use addEventListener.
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
 * Calculates the goal zone (1-9) based on relative percentage coordinates.
 * @param {number} xPercent - Percent from left (0-100)
 * @param {number} yPercent - Percent from top (0-100)
 * @returns {number} - Zone ID (1-9)
 */
export function calculateGoalZone(xPercent, yPercent) {
    const col = Math.min(2, Math.floor(xPercent / (100 / 3)));
    const row = Math.min(2, Math.floor(yPercent / (100 / 3)));
    return (row * 3) + col + 1;
}

/**
 * Robust fetch utility that tries multiple CORS proxies to bypass browser restrictions.
 * Proxies tried: Codetabs, CORSProxy.io, AllOrigins.
 * 
 * @param {string} url - The target URL to fetch
 * @param {Object} options - Options object. { json: boolean } to auto-parse JSON.
 * @returns {Promise<string|Object>} - The fetched content as string or parsed JSON.
 */
export async function fetchWithProxy(url, options = { json: false }) {
    const cleanUrl = url.replace('webcal://', 'https://').trim();
    let content = null;
    let lastError = null;

    const proxies = [
        // 1. Codetabs (Most reliable for handball.net)
        {
            name: 'Codetabs',
            getUrl: (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
            parse: async (res) => await res.text()
        },
        // 2. CORSProxy.io
        {
            name: 'CORSProxy.io',
            getUrl: (u) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
            parse: async (res) => await res.text()
        },
        // 3. AllOrigins
        {
            name: 'AllOrigins',
            getUrl: (u) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`,
            parse: async (res) => {
                const data = await res.json();
                return data.contents;
            }
        }
    ];

    for (const proxy of proxies) {
        try {
            console.log(`[Proxy] Trying ${proxy.name} for ${cleanUrl}...`);
            const res = await fetch(proxy.getUrl(cleanUrl));
            if (res.ok) {
                const raw = await proxy.parse(res);
                if (raw && raw.length > 5) {
                    content = raw;
                    console.log(`[Proxy] Success with ${proxy.name}`);
                    break;
                }
            }
        } catch (err) {
            console.warn(`[Proxy] ${proxy.name} failed:`, err.message);
            lastError = err;
        }
    }

    if (!content) {
        throw new Error(lastError ? `Alle Proxies fehlgeschlagen: ${lastError.message}` : "Inhalt konnte nicht geladen werden.");
    }

    if (options.json) {
        try {
            return JSON.parse(content);
        } catch (e) {
            console.error("[Proxy] Selected JSON parsing but content is not valid JSON:", e);
            throw new Error("Proxy-Antwort ist kein gültiges JSON.");
        }
    }

    return content;
}

/**
 * Calculates the functional field zone (1-9) based on relative percentage coordinates.
 * Using mathematical boundaries matching the 6m/9m arcs and radial dividers.
 * @param {number} xPercent - Percent from left (0-100)
 * @param {number} yPercent - Percent from top (0-100)
 * @returns {number} - Zone ID (1-9)
 */
export function calculateFieldZone(xPercent, yPercent) {
    // Convert percentages to ViewBox coordinates (300x400 mapping, active 10-290, 10-390)
    const vbX = 10 + (xPercent / 100) * 280;
    const vbY = 10 + (yPercent / 100) * 380;

    // Midfield zone
    if (vbY >= 220) return 9;

    // Check if outside 9m arc based on mapped symmetric X
    const xSym = 150 - Math.abs(150 - vbX);
    let y9m = 18;
    if (xSym >= 37) {
        // Approximate 9m bezier curve Y at given X
        const t = Math.sqrt((xSym - 37) / 113);
        y9m = 18 * Math.pow(1 - t, 2) + 150 * (2 * t - t * t);
    }
    
    const isOutside9m = vbY > y9m || xSym < 37;

    // Diver 2/3 (separating wings/half from center)
    const xDiv2 = 111.8 - 0.355 * (vbY - 83.5);
    const xDiv3 = 300 - xDiv2;

    if (isOutside9m) {
        // Zones 6, 7, 8
        if (vbX < xDiv2) return 6;
        if (vbX > xDiv3) return 8;
        return 7;
    } else {
        // Zones 1, 2, 3, 4, 5 (Between arcs, or even inside 6m assigned outward)
        // Diver 1/4 (separating deep wings from half)
        const xDiv1 = 81.8 - 1.13 * (vbY - 54.7);
        const xDiv4 = 300 - xDiv1;
        
        if (vbX < xDiv1) return 1;
        if (vbX < xDiv2) return 2;
        if (vbX < xDiv3) return 3;
        if (vbX < xDiv4) return 4;
        return 5;
    }
}
