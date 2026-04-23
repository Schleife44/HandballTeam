import { spielstand } from './state.js';
import { getHistorie, updateHistorieSpiel } from './history.js';
import { formatiereZeit, parseTime } from './utils.js';
import { customConfirm, customAlert } from './customDialog.js';
import { toast } from './toast.js';

let videoAnalysisInitialized = false;
let currentVideoGame = null;
let videoOffsets = { h1: 0, h2: 0 }; // Multiple sync points per half

// Caching System to reduce DB reads
let historyCache = null;
let lastCacheUpdate = 0;
const CACHE_TTL = 300000; // 5 minutes cache

// Filter State
let currentFilterPlayer = 'all';
let currentFilterAction = 'all';

// Autoplay State
let isAutoplayActive = false;
let autoplayList = [];
let currentAutoplayIndex = -1;
let autoplayTimer = null;
let currentClipEndTime = 0; // State for playback-aware autoplay
const CLIP_DURATION = 6; // Reduced by 2 seconds as requested
let videoLeadTime = 3; // Default lead time in seconds
let isCinemaMode = false;
let lastSyncTime = 0;

export function initVideoAnalysis() {
    if (videoAnalysisInitialized) return;

    const fileInput = document.getElementById('videoFileInput');
    const videoPlayer = document.getElementById('analysisVideoPlayer');
    const placeholder = document.getElementById('videoPlaceholder');
    const container = placeholder ? placeholder.parentElement : null;
    const setStartBtn = document.getElementById('setGameStartBtn');

    // Initial State: Hide Player, Show Placeholder
    if (videoPlayer) videoPlayer.style.display = 'none';
    if (placeholder) {
        placeholder.style.display = 'flex';
        placeholder.style.flexDirection = 'column';
        placeholder.style.justifyContent = 'center';
        placeholder.style.alignItems = 'center';
        placeholder.style.border = '2px dashed var(--border-color)';
        placeholder.style.width = '100%';
        placeholder.style.height = '100%';
        placeholder.style.backgroundColor = 'rgba(255,255,255,0.05)';
        placeholder.style.cursor = 'pointer';

        placeholder.addEventListener('click', () => {
            if (fileInput) fileInput.click();
        });
    }

    // Helper to load video
    const loadVideo = (file) => {
        if (!file || !file.type.startsWith('video/')) return;

        const fileURL = URL.createObjectURL(file);
        videoPlayer.src = fileURL;
        videoPlayer.style.display = 'block';
        videoPlayer.load();

        // If a game is already selected, prefer its stored offsets
        if (currentVideoGame && currentVideoGame.videoOffsets) {
            videoOffsets = { ...currentVideoGame.videoOffsets };
        } else {
            videoOffsets = { h1: 0, h2: 0 };
        }
        
        updateOffsetUI();

        if (placeholder) placeholder.style.display = 'none';

        updateTitleWithVideoName(file.name);
        checkAndRenderProtocol();
    };

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) loadVideo(file);
        });
    }

    // Sync Button Logic
    const setH1Btn = document.getElementById('setStartH1Btn');
    const setH2Btn = document.getElementById('setStartH2Btn');

    if (setH1Btn) {
        setH1Btn.addEventListener('click', () => setHalfOffset(1));
    }

    if (setH2Btn) {
        setH2Btn.addEventListener('click', () => setHalfOffset(2));
    }

    // Drag & Drop
    if (container) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            container.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            container.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            container.addEventListener(eventName, unhighlight, false);
        });

        function highlight(e) {
            if (placeholder) {
                placeholder.style.borderColor = 'var(--primary)';
                placeholder.style.backgroundColor = 'rgba(var(--primary-rgb), 0.1)';
            }
        }

        function unhighlight(e) {
            if (placeholder) {
                placeholder.style.borderColor = 'var(--border-color)';
                placeholder.style.backgroundColor = 'rgba(255,255,255,0.05)';
            }
        }

        container.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files && files.length > 0) {
                loadVideo(files[0]);
            }
        });
    }

    // Filter Listeners
    const playerFilter = document.getElementById('videoFilterPlayer');
    const actionFilter = document.getElementById('videoFilterAction');
    const clearBtn = document.getElementById('videoClearFilters');
    const autoplayBtn = document.getElementById('videoAutoplayBtn');

    if (playerFilter) {
        playerFilter.addEventListener('change', (e) => {
            currentFilterPlayer = e.target.value;
            checkAndRenderProtocol();
        });
    }

    if (actionFilter) {
        actionFilter.addEventListener('change', (e) => {
            currentFilterAction = e.target.value;
            checkAndRenderProtocol();
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            currentFilterPlayer = 'all';
            currentFilterAction = 'all';
            if (playerFilter) playerFilter.value = 'all';
            if (actionFilter) actionFilter.value = 'all';
            checkAndRenderProtocol();
        });
    }

    if (autoplayBtn) {
        autoplayBtn.addEventListener('click', () => {
            toggleAutoplay();
        });
    }

    const leadTimeInput = document.getElementById('videoLeadTimeInput');
    if (leadTimeInput) {
        leadTimeInput.addEventListener('change', (e) => {
            videoLeadTime = parseFloat(e.target.value) || 0;
        });
    }

    if (videoPlayer) {
        videoPlayer.addEventListener('timeupdate', () => {
            if (isAutoplayActive && !videoPlayer.paused && currentClipEndTime > 0) {
                if (videoPlayer.currentTime >= currentClipEndTime) {
                    playNextClip();
                }
            }
            updateTimelineProgress();
            syncProtocolWithVideo(); // HIGH PRECISION SYNC
        });

        videoPlayer.addEventListener('loadedmetadata', () => {
            renderTimelineMarkers();
        });
    }

    const cinemaBtn = document.getElementById('videoCinemaModeBtn');
    if (cinemaBtn) {
        cinemaBtn.addEventListener('click', toggleCinemaMode);
    }

    const sidebarToggle = document.getElementById('videoSidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleCinemaMode);
    }

    const timelineTrack = document.getElementById('videoTimelineTrack');
    if (timelineTrack) {
        timelineTrack.addEventListener('click', (e) => {
            if (!videoPlayer || !videoPlayer.duration) return;
            const rect = timelineTrack.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const pct = x / rect.width;
            videoPlayer.currentTime = pct * videoPlayer.duration;
        });
    }

    videoAnalysisInitialized = true;
}

async function setHalfOffset(half) {
    const videoPlayer = document.getElementById('analysisVideoPlayer');
    if (!videoPlayer || isNaN(videoPlayer.currentTime)) return;

    if (half === 1) videoOffsets.h1 = videoPlayer.currentTime;
    else if (half === 2) videoOffsets.h2 = videoPlayer.currentTime;

    if (currentVideoGame) {
        currentVideoGame.videoOffsets = { ...videoOffsets };
        await updateHistorieSpiel(currentVideoGame);
    }
    
    updateOffsetUI();
    checkAndRenderProtocol(); // RE-RENDER LIST TO SHOW NEW TIMES IN PARENTHESES
    toast.success(`Startpunkt H${half} gesetzt`, `Video-Position: ${formatiereZeit(videoPlayer.currentTime)}`);
}

function updateOffsetUI() {
    const btnH1 = document.getElementById('setStartH1Btn');
    const btnH2 = document.getElementById('setStartH2Btn');
    
    if (btnH1) {
        if (videoOffsets.h1 !== 0) {
            btnH1.innerHTML = `<i data-lucide="check-circle" style="width: 12px; height: 12px; margin-right: 4px; color: var(--hub-green);"></i> H1: ${videoOffsets.h1.toFixed(1)}s`;
            btnH1.style.borderColor = 'var(--hub-green)';
        } else {
            btnH1.innerHTML = `<i data-lucide="clock" style="width: 12px; height: 12px; margin-right: 4px;"></i> Sync H1`;
            btnH1.style.borderColor = '';
        }
    }
    
    if (btnH2) {
        if (videoOffsets.h2 !== 0) {
            btnH2.innerHTML = `<i data-lucide="check-circle" style="width: 12px; height: 12px; margin-right: 4px; color: var(--hub-green);"></i> H2: ${videoOffsets.h2.toFixed(1)}s`;
            btnH2.style.borderColor = 'var(--hub-green)';
        } else {
            btnH2.innerHTML = `<i data-lucide="clock" style="width: 12px; height: 12px; margin-right: 4px;"></i> Sync H2`;
            btnH2.style.borderColor = '';
        }
    }

    if (window.lucide) window.lucide.createIcons();
    renderTimelineMarkers();
}

function updateTitleWithVideoName(videoName) {
    const title = document.getElementById('videoAnalyseTitle');
    if (!title) return;

    let gameText = "Kein Spiel ausgewählt";
    if (currentVideoGame) {
        const heim = currentVideoGame.settings?.teamNameHeim || 'Heim';
        const gast = currentVideoGame.settings?.teamNameGegner || 'Gast';
        const dateStr = new Date(currentVideoGame.timestamp || currentVideoGame.date).toLocaleDateString('de-DE');
        gameText = `${dateStr}: ${heim} vs ${gast}`;
    }

    title.textContent = `${gameText} | ${videoName}`;
}

export async function handleVideoAnalysisView() {
    initVideoAnalysis();
    // Use cached list unless specifically asked to reload
    await renderVideoGameList(false);
}

async function saveUpdatedLog() {
    if (!currentVideoGame) return;
    try {
        await updateHistorieSpiel(currentVideoGame);
        
        // Update local cache too
        if (historyCache) {
            const idx = historyCache.findIndex(g => g.id === currentVideoGame.id);
            if (idx !== -1) historyCache[idx] = { ...currentVideoGame };
        }
        
        console.log("[VideoAnalysis] Game log saved and cache updated.");
    } catch (err) {
        console.error("[VideoAnalysis] Error saving game log:", err);
        toast.error("Speicherfehler", "Änderungen konnten nicht gesichert werden.");
    }
}

async function renderVideoGameList(forceRefresh = false) {
    const listContainer = document.getElementById('videoGameListContent');
    if (!listContainer) return;

    const now = Date.now();
    let games = historyCache;

    // Only fetch if forced or cache is old/missing
    if (forceRefresh || !historyCache || (now - lastCacheUpdate > CACHE_TTL)) {
        listContainer.innerHTML = '<div class="loading-spinner">Lade Spiele aus DB...</div>';
        try {
            games = await getHistorie();
            historyCache = games;
            lastCacheUpdate = now;
        } catch (err) {
            console.error("Error fetching history:", err);
            listContainer.innerHTML = '<p style="color: var(--text-muted);">Fehler beim Laden.</p>';
            return;
        }
    }

    if (!games || games.length === 0) {
        listContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem; padding: 1rem; text-align: center;">Keine Spiele im Archiv gefunden.</p>';
        return;
    }

    listContainer.innerHTML = '';
    
    const sortedGames = [...games].sort((a, b) => {
        const tsA = a.timestamp || a.id || 0;
        const tsB = b.timestamp || b.id || 0;
        return tsB - tsA;
    });

    sortedGames.forEach(game => {
        const item = document.createElement('div');
        item.style.padding = '12px';
        item.style.border = '1px solid var(--border-color)';
        item.style.borderRadius = '8px';
        item.style.marginBottom = '6px';
        item.style.cursor = 'pointer';
        item.style.background = 'var(--bg-secondary)';
        item.style.transition = 'background 0.2s';

        item.addEventListener('mouseenter', () => { if (item !== selectedItem) item.style.background = 'var(--bg-hover)'; });
        item.addEventListener('mouseleave', () => { if (item !== selectedItem) item.style.background = 'var(--bg-secondary)'; });

        const ts = game.timestamp || game.id || Date.now();
        const dateStr = new Date(ts).toLocaleDateString('de-DE');
        const scoreStr = `${game.score?.heim ?? '?'}:${game.score?.gegner ?? '?'}`;
        const heim = game.settings?.teamNameHeim || game.teamNameHeim || 'Heim';
        const gast = game.settings?.teamNameGegner || game.teamNameGegner || 'Gast';

        const isHnet = !!game.hnetGameId;
        const sourceLabel = isHnet 
            ? `<span style="font-size: 0.65rem; color: #60a5fa; opacity: 0.8;">handball.net</span>`
            : `<span style="font-size: 0.65rem; color: var(--text-muted); opacity: 0.6;">Eigenes Tracking</span>`;

        item.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span style="font-weight: 600; font-size: 0.85rem; color: var(--text-muted);">${dateStr}</span>
                <span style="font-weight: 700; font-size: 0.95rem; color: var(--primary);">${scoreStr}</span>
            </div>
            <div style="font-size: 0.9rem; font-weight: 500; display: flex; justify-content: space-between; align-items: flex-end;">
                <div>${heim} <span style="font-weight: normal; color: var(--text-muted);">vs</span> ${gast}</div>
                ${sourceLabel}
            </div>
        `;

        item.addEventListener('click', () => {
            if (selectedItem) selectedItem.style.border = '1px solid var(--border-color)';
            item.style.border = '1px solid var(--primary)';
            selectedItem = item;

            videoOffsets = game.videoOffsets || { h1: 0, h2: 0 };
            updateOffsetUI();
            selectGameForAnalysis(game);
        });

        listContainer.appendChild(item);
    });
}

let selectedItem = null;

export function selectGameForAnalysis(game) {
    currentVideoGame = game;
    const title = document.getElementById('videoAnalyseTitle');
    const heim = game.settings?.teamNameHeim || game.teamNameHeim || 'Heim';
    const gast = game.settings?.teamNameGegner || game.teamNameGegner || 'Gast';
    const ts = game.timestamp || game.id || Date.now();
    const dateStr = new Date(ts).toLocaleDateString('de-DE');

    const videoPlayer = document.getElementById('analysisVideoPlayer');
    const hasVideo = videoPlayer && videoPlayer.src && videoPlayer.style.display !== 'none';

    let text = `${dateStr}: ${heim} vs ${gast}`;
    if (hasVideo) {
        if (title.textContent.includes('|')) {
            const suffix = title.textContent.split('|')[1];
            text += ` | ${suffix}`;
        }
    }

    if (title) title.textContent = text;
    
    // Reset Filters when switching games to avoid empty lists
    currentFilterPlayer = 'all';
    currentFilterAction = 'all';
    const pFilter = document.getElementById('videoFilterPlayer');
    const aFilter = document.getElementById('videoFilterAction');
    if (pFilter) pFilter.value = 'all';
    if (aFilter) aFilter.value = 'all';

    populateFilterDropdowns(game);
    checkAndRenderProtocol();
    renderTimelineMarkers();
}

function populateFilterDropdowns(game) {
    const playerFilter = document.getElementById('videoFilterPlayer');
    const actionFilter = document.getElementById('videoFilterAction');
    if (!playerFilter || !actionFilter) return;

    const log = game.gameLog || [];
    
    // Unified Players Map to avoid duplicates (ID -> DisplayName)
    const playersMap = new Map();
    log.forEach(entry => {
        if (!entry.playerName && !entry.playerId && !entry.gegnerNummer) return;

        let id = "";
        let displayName = "";

        if (entry.playerName && entry.playerName !== "SPIEL") {
            id = entry.playerName.trim();
            displayName = entry.playerName.trim();
        } else if (entry.playerId && entry.playerId !== "TEAM_US") {
            id = `Spieler #${entry.playerId}`;
            displayName = id;
        } else if (entry.gegnerNummer) {
            id = `Gegner #${entry.gegnerNummer}`;
            displayName = id;
        }

        if (id) playersMap.set(id, displayName);
    });

    const actions = new Set();
    log.forEach(entry => {
        if (entry.action) actions.add(entry.action);
    });

    playerFilter.innerHTML = '<option value="all">Alle Spieler</option>';
    Array.from(playersMap.keys()).sort().forEach(id => {
        const opt = document.createElement('option');
        opt.value = id;
        opt.textContent = playersMap.get(id);
        playerFilter.appendChild(opt);
    });
    playerFilter.value = currentFilterPlayer;

    actionFilter.innerHTML = '<option value="all">Alle Aktionen</option>';
    Array.from(actions).sort().forEach(a => {
        const opt = document.createElement('option');
        opt.value = a;
        opt.textContent = a;
        actionFilter.appendChild(opt);
    });
    actionFilter.value = currentFilterAction;
}

function checkAndRenderProtocol() {
    const protocolContainer = document.getElementById('videoAnalysisProtocol');
    const list = document.getElementById('videoAnalysisProtocolList');
    const videoPlayer = document.getElementById('analysisVideoPlayer');

    const hasVideo = videoPlayer && videoPlayer.src && videoPlayer.style.display !== 'none';

    if (currentVideoGame && hasVideo) {
        if (protocolContainer) {
            protocolContainer.style.display = 'flex';
            protocolContainer.style.flexDirection = 'column';
            protocolContainer.style.height = '100%';
            protocolContainer.style.minHeight = '400px'; 
            protocolContainer.style.overflow = 'hidden'; 
        }
        
        // Inline Editor detection (prevent rerender while typing)
        const isCurrentlyEditing = list.querySelector('.editing-row') !== null;
        
        if (isCurrentlyEditing) {
            return;
        }

        if (list) {
            list.style.maxHeight = '65vh'; 
            list.style.overflowY = 'auto';
            list.style.border = '1px solid var(--border-color)';
            list.style.borderRadius = '8px';
            list.style.padding = '4px';
            list.style.background = 'var(--bg-secondary)';
        }
        
        renderProtocolList(currentVideoGame, list);
    } else {
        if (protocolContainer) protocolContainer.style.display = 'none';
    }
}

function renderProtocolList(game, list) {
    if (!list) return;
    list.innerHTML = '';
    const log = game.gameLog || [];
    
    // Apply Filters with Deep Search
    const filteredLog = log.filter(entry => {
        const targetPlayer = String(currentFilterPlayer || 'all').trim().toLowerCase();
        const targetAction = String(currentFilterAction || 'all').trim().toLowerCase();

        // 1. Player Match (Deep Check)
        let pMatch = (targetPlayer === 'all');
        if (!pMatch) {
            const searchPool = [
                String(entry.playerName || ''),
                String(entry.playerId || ''),
                `spieler #${entry.playerId}`,
                String(entry.gegnerNummer || ''),
                `gegner #${entry.gegnerNummer}`
            ].map(v => v.toLowerCase().trim());
            
            pMatch = searchPool.some(val => val === targetPlayer || val.includes(targetPlayer));
        }

        // 2. Action Match
        let aMatch = (targetAction === 'all');
        if (!aMatch) {
            const eAction = String(entry.action || '').trim().toLowerCase();
            aMatch = (eAction === targetAction);
        }
        
        return pMatch && aMatch;
    });

    // Header with Stats & Smart Propagate Toggle
    const header = document.createElement('div');
    header.style.padding = '8px 12px';
    header.style.borderBottom = '1px solid var(--border-color)';
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.justifyContent = 'space-between';
    header.style.background = 'rgba(255,255,255,0.02)';
    header.style.position = 'sticky';
    header.style.top = '0';
    header.style.zIndex = '10';

    header.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 2px;">
            <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-main);">Protokoll (${filteredLog.length} / ${log.length})</span>
            ${(currentFilterPlayer !== 'all' || currentFilterAction !== 'all') ? `<span style="font-size: 0.6rem; color: var(--primary);">Filter: ${currentFilterPlayer !== 'all' ? currentFilterPlayer : ''} ${currentFilterAction !== 'all' ? '['+currentFilterAction+']' : ''}</span>` : ''}
        </div>
        <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 0.7rem; user-select: none; color: var(--text-muted); white-space: nowrap;">
            <input type="checkbox" id="syncFollowToggle" checked style="width: 12px; height: 12px; cursor: pointer; accent-color: var(--primary);">
            Sync folgen
        </label>
    `;
    list.appendChild(header);

    // Update Autoplay Button label
    const autoplayBtn = document.getElementById('videoAutoplayBtn');
    if (autoplayBtn) {
        autoplayBtn.innerHTML = `<i data-lucide="${isAutoplayActive ? 'stop-circle' : 'play-circle'}" style="width: 14px; height: 14px; margin-right: 5px;"></i> ${isAutoplayActive ? 'Autoplay Stoppen' : `Clips abspielen (${filteredLog.length})`}`;
        if (window.lucide) window.lucide.createIcons({ root: autoplayBtn });
    }

    // Unified Absolute Seconds sorting helper
    const getAbsSecs = (e) => {
        const base = parseTime(e.officialTime || e.time || "00:00");
        const actual = base + (e.manualShift || 0);
        const h = e.half || (actual > 1800 ? 2 : 1);
        return (h - 1) * 1800 + actual;
    };

    // Update internal autoplay list (always ascending for chronological playback)
    autoplayList = [...filteredLog].sort((a, b) => {
        const diff = getAbsSecs(a) - getAbsSecs(b);
        if (diff !== 0) return diff;
        if (a.timestamp && b.timestamp) return a.timestamp - b.timestamp;
        return 0;
    });

    // Display order: For Video Analysis, we prefer CHRONOLOGICAL (0:00 first)
    const sortedLogForDisplay = [...autoplayList];

    sortedLogForDisplay.forEach((entry, idx) => {
        const item = document.createElement('div');
        item.className = 'video-protocol-item';
        item.dataset.index = idx;
        item.dataset.timestamp = entry.timestamp;
        item.dataset.action = entry.action;
        item.style.display = 'flex';
        item.style.flexDirection = 'column';
        item.style.padding = '8px';
        item.style.borderBottom = '1px solid var(--border-color)';
        item.style.transition = 'all 0.2s';
        item.style.borderRadius = '4px';

        // Add visual color based on action
        if (entry.action === "Halbzeit" || entry.action === "Spielende") {
            item.style.background = 'rgba(255, 255, 255, 0.08)';
            item.style.borderLeft = '4px solid var(--text-muted)';
            item.style.textAlign = 'center';
            item.style.fontWeight = 'bold';
        } else if (entry.action && entry.action.includes("Timeout")) {
            item.style.borderLeft = '4px solid #3b82f6';
            item.style.background = 'rgba(59, 130, 246, 0.05)';
        } else if (entry.action && entry.action.includes("Tor")) {
            item.style.borderLeft = '4px solid #22c55e';
            item.style.background = 'rgba(34, 197, 94, 0.03)';
        } else if (entry.action && (entry.action.includes("Fehlwurf") || entry.action.includes("Pfosten") || entry.action.includes("Latte"))) {
            item.style.borderLeft = '4px solid #ef4444';
            item.style.background = 'rgba(239, 68, 68, 0.03)';
        } else if (entry.action && (entry.action.includes("Karte") || entry.action.includes("Minuten"))) {
            item.style.borderLeft = '4px solid #eab308';
        }

        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.gap = '10px';
        row.style.width = '100%';

        let playerInfo = "";
        if (entry.gegnerNummer) playerInfo = `#${entry.gegnerNummer} (Gegner)`;
        else if (entry.playerName && entry.playerName !== "SPIEL") playerInfo = entry.playerName;
        const baseSecs = parseTime(entry.officialTime || entry.time || "00:00");
        const isShifted = (entry.manualShift && Math.abs(entry.manualShift) > 0.5);

        // 1. Hotspot for Seeking (Covers Time, Action, and Score/VideoTime)
        const seekHotspot = document.createElement('div');
        seekHotspot.className = 'seek-hotspot';
        seekHotspot.style.flex = '1';
        seekHotspot.style.display = 'flex';
        seekHotspot.style.alignItems = 'center';
        seekHotspot.style.gap = '10px';
        seekHotspot.style.cursor = 'pointer';
        
        const effectiveSecs = baseSecs + (entry.manualShift || 0);
        const timeColor = isShifted ? '#60a5fa' : 'var(--text-muted)';
        const timeStyle = isShifted ? 'italic' : 'normal';
        
        // --- ABSOLUTE VIDEO TIME OR ESTIMATED PREVIEW ---
        const vNow = getEstimatedVideoTime(entry);
        const vDisplay = (entry.videoTime !== undefined && entry.videoTime !== null) 
                         ? formatiereZeit(entry.videoTime) 
                         : (vNow !== null ? `(${formatiereZeit(vNow)})` : "(?)");

        seekHotspot.innerHTML = `
            <div class="game-time-container" style="font-family: monospace; font-weight: bold; width: 80px; color: ${timeColor}; font-style: ${timeStyle}; min-width: 80px; flex-shrink: 0;">
                ${formatiereZeit(baseSecs)}
            </div>
            <div class="action-text-container" style="flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; padding: 0 5px;">
                <span class="action-name" style="font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block;">${entry.action}</span>
                ${playerInfo ? `<span class="player-info-text" style="font-size: 0.75rem; opacity: 0.7; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block;">${playerInfo}</span>` : ''}
            </div>
            <div class="score-video-container" style="display: flex; align-items: center; gap: 8px; margin-right: 5px; flex-shrink: 0;">
                <span style="font-weight: bold; font-family: monospace; color: var(--primary);">${entry.score || ''}</span>
                <div class="video-time-display" style="font-family: monospace; font-size: 0.7rem; opacity: 0.4; text-align: right; width: 75px; min-width: 75px;">
                    ${vDisplay}
                </div>
            </div>
        `;

        seekHotspot.addEventListener('click', (e) => {
            // Don't seek if we click inside an input or on a button
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
            
            stopAutoplay();
            seekToEntry(entry);
        });

        // 2. Action Area (Pen -> OK)
        const actionArea = document.createElement('div');
        actionArea.className = 'action-area';
        actionArea.style.display = 'flex';
        actionArea.style.alignItems = 'center';
        
        actionArea.innerHTML = `
            <button class="icon-btn-ghost edit-entry-btn" style="padding: 6px; cursor: pointer;" title="Zeit korrigieren">
                <i data-lucide="edit-2" style="width: 14px; height: 14px;"></i>
            </button>
        `;

        const editBtn = actionArea.querySelector('.edit-entry-btn');
        editBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (row.classList.contains('editing-row')) {
                checkAndRenderProtocol();
                return;
            }

            row.classList.add('editing-row');
            item.style.background = 'rgba(var(--primary-rgb), 0.15)';

            const gameCont = seekHotspot.querySelector('.game-time-container');
            const videoCont = seekHotspot.querySelector('.video-time-display');
            const scoreVideoCont = seekHotspot.querySelector('.score-video-container');

            // Left: Game Time Input
            gameCont.innerHTML = `<input type="text" class="inline-g-input" value="${entry.time}" style="width: 75px; height: 30px; background: #000; border: 2px solid var(--primary); color: #fff; font-size: 0.85rem; text-align: center; border-radius: 4px; font-family: monospace; outline: none;">`;
            
            // Right: Video Time Input
            const initialV = getEstimatedVideoTime(entry);
            videoCont.style.width = 'auto';
            videoCont.style.opacity = '1';
            videoCont.innerHTML = `
                <div style="display: flex; align-items: center; gap: 5px;">
                    <input type="text" class="inline-v-input" value="${formatiereZeit(initialV || 0)}" style="width: 75px; height: 30px; background: #000; border: 2px solid var(--primary); color: var(--primary); font-size: 0.85rem; text-align: center; border-radius: 4px; font-family: monospace; outline: none;">
                    <button class="inline-sync-btn" style="padding: 0 8px; height: 30px; background: #fbbf24; color: #000; border: none; border-radius: 4px; cursor: pointer; font-size: 0.75rem; font-weight: bold; white-space: nowrap;">Vom Vid</button>
                </div>
            `;
            
            // Remove the old appending logic for button since it's now in innerHTML of videoCont
            
            // Change Pen to OK
            actionArea.innerHTML = `<button class="inline-ok-btn" style="padding: 0 12px; height: 30px; background: var(--hub-green); color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem; font-weight: bold; margin-left: 5px;">OK</button>`;

            const gInp = gameCont.querySelector('input');
            const vInp = videoCont.querySelector('.inline-v-input');
            const syncBtn = videoCont.querySelector('.inline-sync-btn');
            const okBtn = actionArea.querySelector('.inline-ok-btn');

            syncBtn.addEventListener('click', (ev) => {
                ev.stopPropagation();
                const videoPlayer = document.getElementById('analysisVideoPlayer');
                if (videoPlayer && !isNaN(videoPlayer.currentTime)) {
                    vInp.value = formatiereZeit(videoPlayer.currentTime);
                    entry.pendingVideoTime = videoPlayer.currentTime;
                }
            });

            okBtn.addEventListener('click', async (ev) => {
                ev.stopPropagation();
                const newG = gInp.value;
                const newV = vInp.value;

                if (/^\d{1,3}:\d{2}$/.test(newG)) {
                    entry.time = newG;
                    entry.manualShift = 0;
                    entry.half = (parseTime(newG) > 1800) ? 2 : 1;

                    if (entry.pendingVideoTime !== undefined) {
                        entry.videoTime = entry.pendingVideoTime;
                        delete entry.pendingVideoTime;
                    } else {
                        // If they typed a different time than what was estimated
                        const estimated = getEstimatedVideoTime(entry);
                        if (newV !== formatiereZeit(estimated || 0)) {
                            entry.videoTime = parseTime(newV);
                        }
                    }

                    await saveUpdatedLog();
                    row.classList.remove('editing-row'); // Unlock rerender
                    checkAndRenderProtocol();
                    renderTimelineMarkers();
                } else {
                    toast.error("Format", "MM:SS nutzen");
                }
            });

            gInp.focus();
            gInp.select();
        });

        row.appendChild(seekHotspot);
        row.appendChild(actionArea);
        item.appendChild(row);
        list.appendChild(item);
    });

    if (window.lucide) window.lucide.createIcons();
}


// --- Bulk Shift Helper ---

async function bulkShiftTimes(startTimeStr, deltaSeconds) {
    if (!currentVideoGame || !currentVideoGame.gameLog) return;
    
    const { formatiereZeit } = await import('./utils.js');
    const startSecs = parseTime(startTimeStr);
    
    currentVideoGame.gameLog.forEach(entry => {
        const entrySecs = parseTime(entry.time || "00:00");
        if (entrySecs >= startSecs) {
            // Shift the internal manual offset, keep original display time
            entry.manualShift = (entry.manualShift || 0) + deltaSeconds;
        }
    });

    // Re-sort after bulk shift
    currentVideoGame.gameLog.sort((a, b) => {
        const getT = (e) => {
            const bS = parseTime(e.officialTime || e.time || "00:00");
            const act = bS + (e.manualShift || 0);
            const h = e.half || (act > 1800 ? 2 : 1);
            return (h - 1) * 1800 + act;
        };
        return getT(a) - getT(b);
    });

    await saveUpdatedLog();
}function getEstimatedVideoTime(entry) {
    if (!entry) return null;
    if (entry.videoTime !== undefined && entry.videoTime !== null) return entry.videoTime;

    const baseSecs = parseTime(entry.officialTime || entry.time || "00:00");
    const gameSecs = baseSecs + (entry.manualShift || 0);
    const h = (gameSecs > 1800) ? 2 : 1;

    const syncEnabled = document.getElementById('syncFollowToggle')?.checked;

    let anchorEntry = null;
    if (syncEnabled && currentVideoGame && currentVideoGame.gameLog) {
        const getAbs = (e) => {
            const b = parseTime(e.officialTime || e.time || "00:00");
            const act = b + (e.manualShift || 0);
            const halfNum = e.half || (act > 1800 ? 2 : 1);
            return (halfNum - 1) * 1800 + act;
        };
        const entryAbs = getAbs(entry);
        
        // Find closest preceding entry with videoTime in same half
        let bestCandidate = null;
        currentVideoGame.gameLog.forEach(logE => {
            if (logE === entry) return;
            const candHalf = logE.half || (parseTime(logE.time) > 1800 ? 2 : 1);
            if (candHalf !== h) return; // Only anchor within same half

            if (logE.videoTime !== undefined && logE.videoTime !== null) {
                const candAbs = getAbs(logE);
                if (candAbs <= entryAbs) {
                    if (!bestCandidate || candAbs > getAbs(bestCandidate)) {
                        bestCandidate = logE;
                    }
                }
            }
        });
        anchorEntry = bestCandidate;
    }

    if (anchorEntry) {
        // --- HIGH PRECISION: Unix Timestamp based (Real-world time) ---
        if (entry.timestamp && anchorEntry.timestamp) {
            const msDelta = entry.timestamp - anchorEntry.timestamp;
            return anchorEntry.videoTime + (msDelta / 1000);
        }

        // --- FALLBACK: Protocol Game Time based (Rounded seconds) ---
        const anchorAbs = (parseTime(anchorEntry.officialTime || anchorEntry.time || "00:00") + (anchorEntry.manualShift || 0));
        const deltaProtocol = gameSecs - anchorAbs;
        return anchorEntry.videoTime + deltaProtocol;
    }

    // Fallback: Global Half Offsets
    const activeOffsets = (currentVideoGame && currentVideoGame.videoOffsets) ? currentVideoGame.videoOffsets : videoOffsets;
    const hVideoStart = (h === 2) ? activeOffsets.h2 : activeOffsets.h1;
    const isOffsetSet = (h === 1) ? (activeOffsets.h1 !== undefined && activeOffsets.h1 !== null) : (activeOffsets.h2 !== undefined && activeOffsets.h2 !== null && activeOffsets.h2 !== 0);
    
    if (!isOffsetSet && hVideoStart <= 0) return null;

    const secsInHalf = (h === 2 && gameSecs >= 1800) ? (gameSecs - 1800) : gameSecs;
    return hVideoStart + secsInHalf;
}

function seekToEntry(entry) {
    const video = document.getElementById('analysisVideoPlayer');
    if (!video || !entry) return;

    const targetVideoTime = getEstimatedVideoTime(entry);
    
    if (targetVideoTime !== null && targetVideoTime >= 0) {
        video.currentTime = Math.max(0, targetVideoTime - videoLeadTime);
        video.play().catch(() => {});
    } else {
        toast.error("Nicht synchronisiert", "Bitte setze erst den Startpunkt für dieses Spiel.");
    }
}

/**
 * Autoplay Sequence Engine
 */
function toggleAutoplay() {
    if (isAutoplayActive) {
        stopAutoplay();
    } else {
        startAutoplay();
    }
}

function startAutoplay() {
    if (autoplayList.length === 0) return;
    
    isAutoplayActive = true;
    currentAutoplayIndex = 0;
    
    const autoplayBtn = document.getElementById('videoAutoplayBtn');
    if (autoplayBtn) {
        autoplayBtn.style.background = '#ef4444'; 
        autoplayBtn.style.color = '#fff';
    }
    
    playNextClip();
}

function stopAutoplay() {
    isAutoplayActive = false;
    currentAutoplayIndex = -1;
    currentClipEndTime = 0;
    if (autoplayTimer) clearTimeout(autoplayTimer);
    
    const autoplayBtn = document.getElementById('videoAutoplayBtn');
    if (autoplayBtn) {
        autoplayBtn.style.background = '';
        autoplayBtn.style.color = '';
    }
    checkAndRenderProtocol();
}

function playNextClip() {
    if (!isAutoplayActive) return;
    
    if (currentAutoplayIndex >= autoplayList.length) {
        stopAutoplay();
        return;
    }

    const videoPlayer = document.getElementById('analysisVideoPlayer');
    const entry = autoplayList[currentAutoplayIndex];
    seekToEntry(entry);

    // Calculate when this clip should end
    if (videoPlayer) {
        // clip ends CLIP_DURATION seconds after the seek start (which is targetTime - leadTime)
        // so it actually ends (CLIP_DURATION - leadTime) seconds after the event.
        // Actually, let's just use current position + CLIP_DURATION for simplicity.
        currentClipEndTime = videoPlayer.currentTime + CLIP_DURATION;
    }

    currentAutoplayIndex++;
}

function toggleCinemaMode() {
    isCinemaMode = !isCinemaMode;
    const sidebar = document.getElementById('videoSidebar');
    const toggleBtn = document.getElementById('videoSidebarToggle');
    const cinemaBtn = document.getElementById('videoCinemaModeBtn');
    
    if (isCinemaMode) {
        if (sidebar) sidebar.style.display = 'none';
        if (toggleBtn) toggleBtn.classList.remove('versteckt');
        if (cinemaBtn) cinemaBtn.innerHTML = `<i data-lucide="layout" style="width: 14px; height: 14px; margin-right: 4px;"></i> Standard`;
    } else {
        if (sidebar) sidebar.style.display = 'flex';
        if (toggleBtn) toggleBtn.classList.add('versteckt');
        if (cinemaBtn) cinemaBtn.innerHTML = `<i data-lucide="monitor" style="width: 14px; height: 14px; margin-right: 4px;"></i> Kino`;
    }
    if (window.lucide) window.lucide.createIcons();
    
    // Explicitly re-render timeline to ensure visibility and correct width
    renderTimelineMarkers();
}

function syncProtocolWithVideo() {
    const video = document.getElementById('analysisVideoPlayer');
    const syncFollow = document.getElementById('syncFollowToggle');
    const list = document.getElementById('videoAnalysisProtocolList');
    if (!video || !currentVideoGame || !list) return;

    // Use a small throttle to avoid vibrating the scroll
    const now = Date.now();
    if (now - lastSyncTime < 300) return;
    lastSyncTime = now;

    const curV = video.currentTime;
    const log = currentVideoGame.gameLog || [];
    
    // Find active entry (the latest one that has already started)
    let activeEntry = null;
    for (let i = log.length - 1; i >= 0; i--) {
        const estV = getEstimatedVideoTime(log[i]);
        if (estV !== null && curV >= estV - 0.5) { 
            activeEntry = log[i];
            break;
        }
    }

    if (activeEntry) {
        const rows = Array.from(list.children);
        rows.forEach(child => {
            const isMatch = (child.dataset.timestamp == activeEntry.timestamp);
            if (isMatch) {
                if (!child.classList.contains('active-highlight')) {
                    child.classList.add('active-highlight');
                    child.style.backgroundColor = 'rgba(var(--primary-rgb), 0.2)';
                    child.style.borderLeftColor = 'var(--primary)';
                    
                    if (syncFollow && syncFollow.checked) {
                        // Silent update: Using direct scrollTop assignment prevents 
                        // modern browsers from "helping" by scrolling parent containers.
                        const targetScroll = offsetTop - (containerHeight / 2) + (itemHeight / 2);
                        list.scrollTop = targetScroll; 
                    }
                }
            } else {
                if (child.classList.contains('active-highlight')) {
                    child.classList.remove('active-highlight');
                    // Restore original background
                    const action = child.dataset.action;
                    if (action === "Tor") child.style.borderLeft = '4px solid #22c55e';
                    child.style.backgroundColor = (action === "Tor" ? 'rgba(34, 197, 94, 0.03)' : '');
                }
            }
        });
    }
}

function updateTimelineProgress() {
    const video = document.getElementById('analysisVideoPlayer');
    const progress = document.getElementById('timelineProgress');
    const label = document.getElementById('timelineTimeLabel');
    if (!video || !progress || !video.duration || !videoOffsets.h1) return;

    const HALF_DUR = 1800; // 30 minutes in seconds
    const TOTAL_GAME_TIME = HALF_DUR * 2;
    
    const curV = video.currentTime;
    const log = currentVideoGame.gameLog || [];
    
    // Find latest entry that has passed in video (Search backwards)
    let lastPassedEntry = null;
    for (let i = log.length - 1; i >= 0; i--) {
        const estV = getEstimatedVideoTime(log[i]);
        if (estV !== null && curV >= estV) {
            lastPassedEntry = log[i];
            break;
        }
    }

    let virtualTime = 0;
    if (lastPassedEntry) {
        const baseSecs = parseTime(lastPassedEntry.officialTime || lastPassedEntry.time || "00:00");
        const gameSecs = baseSecs + (lastPassedEntry.manualShift || 0);
        const estV = getEstimatedVideoTime(lastPassedEntry);
        
        // Virtual time = Game Time of entry + time passed in video since then
        virtualTime = gameSecs + (curV - estV);
    } else {
        // Fallback before any entries: Use H1/H2 global logic
        if (curV < videoOffsets.h1) {
            virtualTime = 0;
        } else if (curV < videoOffsets.h1 + HALF_DUR) {
            virtualTime = curV - videoOffsets.h1;
        } else if (videoOffsets.h2 > 0 && curV >= videoOffsets.h2) {
            virtualTime = HALF_DUR + Math.min(HALF_DUR, curV - videoOffsets.h2);
        } else {
            virtualTime = HALF_DUR;
        }
    }

    // Clamp to 60 mins
    virtualTime = Math.max(0, Math.min(TOTAL_GAME_TIME, virtualTime));

    const pct = (virtualTime / TOTAL_GAME_TIME) * 100;
    progress.style.width = pct + '%';

    if (label) {
        // Show the actual GAME time in the label for better context
        const m = Math.floor(virtualTime / 60);
        const s = Math.floor(virtualTime % 60);
        label.textContent = `Spielzeit: ${m}:${s.toString().padStart(2, '0')} / 60:00`;
    }
}

function renderTimelineMarkers() {
    const video = document.getElementById('analysisVideoPlayer');
    const markersContainer = document.getElementById('timelineMarkers');
    const timelineContainer = document.getElementById('videoTimelineContainer');

    if (!video || !video.duration || !currentVideoGame || !markersContainer) return;
    if (!videoOffsets.h1) return; // Need at least H1 sync for the new scale

    timelineContainer.classList.remove('versteckt');
    markersContainer.innerHTML = '';
    
    // Ensure parent container doesn't clip timeline in cinema mode
    const mainSection = document.getElementById('videoAnalyseBereich');
    if (mainSection) mainSection.style.overflowY = 'auto';

    const log = currentVideoGame.gameLog || [];
    const HALF_DUR = 1800;
    const TOTAL_GAME_TIME = HALF_DUR * 2;
    
    log.forEach(entry => {
        const baseSecs = parseTime(entry.officialTime || entry.time || "00:00");
        const gameSecs = baseSecs + (entry.manualShift || 0);
        
        const h = entry.half || (gameSecs > 1800 ? 2 : 1);
        const offset = (h === 1) ? videoOffsets.h1 : videoOffsets.h2;
        
        // --- POSITIONING LOGIC ---
        // For virtual timeline width, we still need calculated game times
        let virtualEventTime = 0;
        if (h === 1) {
            virtualEventTime = Math.min(1800, gameSecs);
        } else {
            const h2GameSecs = gameSecs > 1800 ? (gameSecs - 1800) : gameSecs;
            virtualEventTime = 1800 + Math.min(1800, h2GameSecs);
        }

        const pct = (virtualEventTime / 3600) * 100;
        
        // --- SEEKING LOGIC (Marker specific) ---
        // Use the unified estimation logic (Anchor/Timestamp/Linear)
        const markerVTime = getEstimatedVideoTime(entry);
        if (markerVTime === null || markerVTime === -1) return; 

        const dot = document.createElement('div');
        // ... rest of dot creation ...
        dot.className = 'timeline-marker';
        dot.style.position = 'absolute';
        dot.style.left = pct + '%';
        
        // --- NEW TRACK LOGIC (Home vs Away) ---
        const action = (entry.action || "").toLowerCase();
        const isOpponent = action.includes("gegner") || action.includes("gast") || entry.gegnerNummer;
        
        // Base Y position (Home: 10-45%, Away: 55-90%)
        let yBase = isOpponent ? 55 : 10;
        let yOffset = 15; 
        let color = 'rgba(255,255,255,0.6)';
        
        if (action.includes("tor")) {
            yOffset = 8; 
            color = '#22c55e';
        } else if (action.includes("fehlwurf") || action.includes("pfosten") || action.includes("latte") || action.includes("gehalten")) {
            yOffset = 8; 
            color = '#ef4444';
        } else if (action.includes("karte") || action.includes("minuten") || action.includes("hinausstellung") || action.includes("bestrafung") || action.includes("gelb") || action.includes("rot") || action.includes("2 min")) {
            yOffset = 25; 
            color = '#eab308';
        } else if (action.includes("timeout")) {
            yOffset = 35; 
            color = '#3b82f6';
        } else {
            yOffset = 35;
        }

        const finalTop = yBase + yOffset;
        const displayTime = formatiereZeit(gameSecs);
        
        dot.style.top = finalTop + '%';
        dot.style.transform = 'translate(-50%, -50%)';
        dot.style.width = '10px';
        dot.style.height = '10px';
        dot.style.borderRadius = '50%';
        dot.style.border = '2px solid rgba(255,255,255,1)';
        dot.style.zIndex = '3';
        dot.style.cursor = 'pointer';
        dot.style.background = color;
        dot.title = `${displayTime}: ${entry.playerName || ''} - ${entry.action}`;

        // Large invisible hit target
        const hitArea = document.createElement('div');
        hitArea.style.position = 'absolute';
        hitArea.style.width = '20px';
        hitArea.style.height = '30px'; 
        hitArea.style.left = '50%';
        hitArea.style.top = '50%';
        hitArea.style.transform = 'translate(-50%, -50%)';
        hitArea.style.cursor = 'pointer';
        dot.appendChild(hitArea);

        dot.addEventListener('click', (e) => {
            e.stopPropagation();
            video.currentTime = Math.max(0, markerVTime - videoLeadTime);
        });

        markersContainer.appendChild(dot);
    });
}
