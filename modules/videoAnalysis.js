import { spielstand } from './state.js';
import { getHistorie } from './history.js';

let videoAnalysisInitialized = false;
let currentVideoGame = null;
let videoOffsets = { h1: 0, h2: 0 }; // Multiple sync points per half

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
let videoLeadTime = 5; // Default lead time in seconds

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

        // If a game is already selected, try to KEEP its offsets instead of resetting
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
        setH1Btn.addEventListener('click', () => {
            if (videoPlayer && videoPlayer.src && videoPlayer.style.display !== 'none') {
                videoOffsets.h1 = videoPlayer.currentTime;
                updateOffsetUI('h1');
            }
        });
    }

    if (setH2Btn) {
        setH2Btn.addEventListener('click', () => {
            if (videoPlayer && videoPlayer.src && videoPlayer.style.display !== 'none') {
                videoOffsets.h2 = videoPlayer.currentTime;
                // If 2nd half start is set, we assume event time 30:00 maps to this currentTime.
                // So the offset for H2 is videoPlayer.currentTime - 1800s.
                videoOffsets.h2 = videoPlayer.currentTime - 1800; 
                updateOffsetUI('h2');
            }
        });
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
        });
    }

    videoAnalysisInitialized = true;
}

function updateOffsetUI(half) {
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
            const displayVal = videoOffsets.h2 + 1800;
            btnH2.innerHTML = `<i data-lucide="check-circle" style="width: 12px; height: 12px; margin-right: 4px; color: var(--hub-green);"></i> H2: ${displayVal.toFixed(1)}s`;
            btnH2.style.borderColor = 'var(--hub-green)';
        } else {
            btnH2.innerHTML = `<i data-lucide="clock" style="width: 12px; height: 12px; margin-right: 4px;"></i> Sync H2`;
            btnH2.style.borderColor = '';
        }
    }

    // Persist offsets immediately to the game object
    if (currentVideoGame) {
        currentVideoGame.videoOffsets = { ...videoOffsets };
        saveUpdatedLog();
    }

    if (window.lucide) window.lucide.createIcons();
}

function updateTitleWithVideoName(videoName) {
    const title = document.getElementById('videoAnalyseTitle');
    if (!title) return;

    let gameText = "Kein Spiel ausgewählt";
    if (currentVideoGame) {
        const heim = currentVideoGame.settings?.teamNameHeim || 'Heim';
        const gast = currentVideoGame.settings?.teamNameGegner || 'Gast';
        const dateStr = new Date(currentVideoGame.timestamp).toLocaleDateString('de-DE');
        gameText = `${dateStr}: ${heim} vs ${gast}`;
    }

    title.textContent = `${gameText} | ${videoName}`;
}

export async function handleVideoAnalysisView() {
    initVideoAnalysis();
    await renderVideoGameList();
}

async function renderVideoGameList() {
    const listContainer = document.getElementById('videoGameListContent');
    if (!listContainer) return;

    listContainer.innerHTML = '<div class="loading-spinner">Lade Spiele...</div>';
    
    const games = await getHistorie();

    if (!games || games.length === 0) {
        listContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem; padding: 1rem; text-align: center;">Keine Spiele im Archiv gefunden.</p>';
        return;
    }

    listContainer.innerHTML = '';
    
    // Sort games by timestamp descending
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

            // Load offsets if present
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
    
    // Fill Filters
    populateFilterDropdowns(game);
    
    checkAndRenderProtocol();
}

function populateFilterDropdowns(game) {
    const playerFilter = document.getElementById('videoFilterPlayer');
    const actionFilter = document.getElementById('videoFilterAction');
    if (!playerFilter || !actionFilter) return;

    const log = game.gameLog || [];
    
    // Extract unique players
    const players = new Set();
    log.forEach(entry => {
        if (entry.playerName && entry.playerName !== "SPIEL") {
            players.add(entry.playerName);
        } else if (entry.gegnerNummer) {
            players.add(`#${entry.gegnerNummer} (Gegner)`);
        }
    });

    // Extract unique actions
    const actions = new Set();
    log.forEach(entry => {
        if (entry.action) actions.add(entry.action);
    });

    // Update Player Dropdown
    playerFilter.innerHTML = '<option value="all">Alle Spieler</option>';
    Array.from(players).sort().forEach(p => {
        const opt = document.createElement('option');
        opt.value = p;
        opt.textContent = p;
        playerFilter.appendChild(opt);
    });
    playerFilter.value = currentFilterPlayer;

    // Update Action Dropdown
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
        if (protocolContainer) protocolContainer.style.display = 'flex';
        
        // Fix: Limit size and enable scrolling
        if (list) {
            list.style.maxHeight = '400px'; 
            list.style.overflowY = 'auto';
            list.style.border = '1px solid var(--border-color)';
            list.style.borderRadius = '8px';
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
    
    // Apply Filters
    const filteredLog = log.filter(entry => {
        const playerMatch = currentFilterPlayer === 'all' || 
                            entry.playerName === currentFilterPlayer || 
                            (`#${entry.gegnerNummer} (Gegner)` === currentFilterPlayer);
        const actionMatch = currentFilterAction === 'all' || entry.action === currentFilterAction;
        return playerMatch && actionMatch;
    });

    // Update Autoplay Button label
    const autoplayBtn = document.getElementById('videoAutoplayBtn');
    if (autoplayBtn) {
        autoplayBtn.innerHTML = `<i data-lucide="${isAutoplayActive ? 'stop-circle' : 'play-circle'}" style="width: 14px; height: 14px; margin-right: 5px;"></i> ${isAutoplayActive ? 'Autoplay Stoppen' : `Clips abspielen (${filteredLog.length})`}`;
        if (window.lucide) window.lucide.createIcons();
    }

    // Update internal autoplay list (always ascending for chronological playback)
    autoplayList = [...filteredLog].sort((a, b) => parseTime(a.time || "00:00") - parseTime(b.time || "00:00"));

    // Display order: Newest at TOP (Descending)
    const sortedLogForDisplay = [...filteredLog].sort((a, b) => parseTime(b.time || "00:00") - parseTime(a.time || "00:00"));

    sortedLogForDisplay.forEach((entry, idx) => {
        const item = document.createElement('div');
        item.className = 'video-protocol-item';
        item.dataset.index = idx;
        item.style.display = 'flex';
        item.style.flexDirection = 'column';
        item.style.padding = '8px';
        item.style.borderBottom = '1px solid var(--border-color)';
        item.style.transition = 'all 0.2s';
        item.style.borderRadius = '4px';

        // Add visual color based on action
        if (entry.action && entry.action.includes("Tor")) {
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

        const timeStr = entry.time || "00:00";
        let playerInfo = "";
        if (entry.gegnerNummer) playerInfo = `#${entry.gegnerNummer} (Gegner)`;
        else if (entry.playerName && entry.playerName !== "SPIEL") playerInfo = entry.playerName;

        // 1. Hotspot for Seeking (Time + Action)
        const seekHotspot = document.createElement('div');
        seekHotspot.style.flex = '1';
        seekHotspot.style.display = 'flex';
        seekHotspot.style.alignItems = 'center';
        seekHotspot.style.gap = '10px';
        seekHotspot.style.cursor = 'pointer';
        seekHotspot.innerHTML = `
            <span style="font-family: monospace; font-weight: bold; width: 45px; color: var(--text-muted);">${timeStr}</span>
            <div style="flex: 1; display: flex; flex-direction: column;">
                <span style="font-weight: 600;">${entry.action}</span>
                ${playerInfo ? `<span style="font-size: 0.75rem; opacity: 0.7;">${playerInfo}</span>` : ''}
            </div>
        `;
        seekHotspot.addEventListener('click', () => {
            stopAutoplay();
            seekToEntry(entry);
        });

        // 2. Score area
        const scoreArea = document.createElement('div');
        scoreArea.style.display = 'flex';
        scoreArea.style.alignItems = 'center';
        scoreArea.style.gap = '8px';
        scoreArea.innerHTML = `
            <span style="font-weight: bold; font-family: monospace; color: var(--primary);">${entry.score || ''}</span>
        `;

        // 3. Edit Button area (Isolated)
        const editArea = document.createElement('div');
        editArea.style.display = 'flex';
        editArea.style.alignItems = 'center';
        editArea.innerHTML = `
            <button class="icon-btn-ghost edit-entry-time" style="padding: 6px; cursor: pointer;" title="Zeit korrigieren">
                <i data-lucide="edit-2" style="width: 16px; height: 16px;"></i>
            </button>
        `;

        // Inline Editor Area (Created but hidden)
        const editor = document.createElement('div');
        editor.className = 'entry-time-editor';
        editor.style.marginTop = '8px';
        editor.style.padding = '8px';
        editor.style.background = 'rgba(255,255,255,0.05)';
        editor.style.borderRadius = '6px';
        editor.style.display = 'none';
        editor.style.flexDirection = 'column';
        editor.style.gap = '8px';

        editor.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                <div style="display: flex; align-items: center; gap: 4px;">
                    <input type="text" class="hub-input" value="${timeStr}" style="width: 60px; height: 30px; font-size: 0.8rem; text-align: center;">
                    <button class="hub-btn-outline compact-btn sync-from-video" style="font-size: 0.7rem; height: 30px;" title="Vom aktuellen Video-Zeitpunkt übernehmen">
                        Vom Video
                    </button>
                    <button class="hub-btn-primary compact-btn save-entry-time" style="font-size: 0.7rem; height: 30px; background: var(--hub-green);">
                        OK
                    </button>
                </div>
                
                <div style="height: 20px; width: 1px; background: var(--border-color);"></div>

                <div style="display: flex; align-items: center; gap: 4px;">
                    <span style="font-size: 0.7rem; color: var(--text-muted);">Bulk:</span>
                    <button class="hub-btn-outline compact-btn bulk-shift-btn" data-delta="-30" style="padding: 0 6px; height: 26px; font-size: 0.65rem;">-30s</button>
                    <button class="hub-btn-outline compact-btn bulk-shift-btn" data-delta="30" style="padding: 0 6px; height: 26px; font-size: 0.65rem;">+30s</button>
                    <button class="hub-btn-outline compact-btn bulk-shift-btn" data-delta="60" style="padding: 0 6px; height: 26px; font-size: 0.65rem;">+60s</button>
                </div>
            </div>
        `;

        // Event for Edit Button
        const editBtn = editArea.querySelector('.edit-entry-time');
        editBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isHidden = editor.style.display === 'none';
            editor.style.display = isHidden ? 'flex' : 'none';
            item.style.background = isHidden ? 'rgba(var(--primary-rgb), 0.15)' : (entry.action === "Tor" ? 'rgba(34, 197, 94, 0.03)' : '');
        });

        // Event for "Vom Video"
        const syncVideoBtn = editor.querySelector('.sync-from-video');
        syncVideoBtn.addEventListener('click', () => {
            const videoPlayer = document.getElementById('analysisVideoPlayer');
            if (videoPlayer && !isNaN(videoPlayer.currentTime)) {
                let currentPos = videoPlayer.currentTime;
                // Reverse offset calculation: GameTime = VideoTime - Offset
                const gameSecs = (currentPos >= (videoOffsets.h2 + 1800) && videoOffsets.h2 !== 0) 
                    ? (currentPos - videoOffsets.h2) 
                    : (currentPos - videoOffsets.h1);
                
                const mins = Math.floor(Math.max(0, gameSecs) / 60);
                const secs = Math.floor(Math.max(0, gameSecs) % 60);
                editor.querySelector('input').value = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            }
        });

        // Event for Bulk Shift
        const bulkBtns = editor.querySelectorAll('.bulk-shift-btn');
        bulkBtns.forEach(btn => {
            btn.addEventListener('click', async () => {
                const delta = parseInt(btn.dataset.delta);
                const startTime = entry.time;
                if (confirm(`Alle Ereignisse ab ${startTime} um ${delta} Sekunden verschieben?`)) {
                    await bulkShiftTimes(startTime, delta);
                    checkAndRenderProtocol();
                }
            });
        });

        // Event for Save
        const saveBtn = editor.querySelector('.save-entry-time');
        saveBtn.addEventListener('click', async () => {
            const newTime = editor.querySelector('input').value;
            if (/^\d{1,3}:\d{2}$/.test(newTime)) {
                const oldTime = entry.time;
                const oldSecs = parseTime(oldTime);
                const newSecs = parseTime(newTime);
                const delta = newSecs - oldSecs;

                // Update current entry
                entry.time = newTime;

                // Smart Propagate: If shifting later (>0), shift all following entries in same half
                if (delta > 0 && currentVideoGame && currentVideoGame.gameLog) {
                    const threshold = 1800;
                    const isSecondHalf = oldSecs >= threshold;
                    
                    currentVideoGame.gameLog.forEach(logEntry => {
                        if (logEntry === entry) return; 
                        
                        const entrySecs = parseTime(logEntry.time || "00:00");
                        const entryIsSecondHalf = entrySecs >= threshold;
                        
                        if (entryIsSecondHalf === isSecondHalf && entrySecs >= oldSecs) {
                            // Access formatiereZeit from utils (locally imported in file but helper needed here)
                            const mins = Math.floor(Math.max(0, entrySecs + delta) / 60);
                            const secs = Math.floor(Math.max(0, entrySecs + delta) % 60);
                            logEntry.time = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                        }
                    });
                }

                // Automatic Sorting: Ensure log remains chronological
                if (currentVideoGame && currentVideoGame.gameLog) {
                    currentVideoGame.gameLog.sort((a, b) => parseTime(a.time) - parseTime(b.time));
                }

                await saveUpdatedLog();
                editor.style.display = 'none';
                checkAndRenderProtocol();
            } else {
                alert("Bitte Zeit im Format MM:SS eingeben.");
            }
        });

        row.appendChild(seekHotspot);
        row.appendChild(scoreArea);
        row.appendChild(editArea);
        item.appendChild(row);
        item.appendChild(editor);
        list.appendChild(item);
    });

    if (window.lucide) window.lucide.createIcons();
}

async function saveUpdatedLog() {
    if (!currentVideoGame) return;
    const { updateHistorieSpiel } = await import('./history.js');
    await updateHistorieSpiel(currentVideoGame);
}

async function bulkShiftTimes(startTimeStr, deltaSeconds) {
    if (!currentVideoGame || !currentVideoGame.gameLog) return;
    
    const { formatiereZeit } = await import('./utils.js');
    const startSecs = parseTime(startTimeStr);
    
    currentVideoGame.gameLog.forEach(entry => {
        const entrySecs = parseTime(entry.time || "00:00");
        if (entrySecs >= startSecs) {
            const newSecs = Math.max(0, entrySecs + deltaSeconds);
            entry.time = formatiereZeit(newSecs);
        }
    });

    // Re-sort after bulk shift
    currentVideoGame.gameLog.sort((a, b) => parseTime(a.time) - parseTime(b.time));

    await saveUpdatedLog();
}

function seekToEntry(entry) {
    const videoPlayer = document.getElementById('analysisVideoPlayer');
    if (!videoPlayer) return;

    let targetTime = 0;
    if (entry.videoTime !== undefined) {
        targetTime = entry.videoTime;
    } else {
        targetTime = parseTime(entry.time || "00:00");
    }

    // Apply Offset based on half (30min threshold)
    const gameSeconds = parseTime(entry.time || "00:00");
    if (gameSeconds >= 1800 && videoOffsets.h2 !== 0) {
        targetTime += videoOffsets.h2;
    } else {
        targetTime += videoOffsets.h1;
    }

    // Start a bit earlier for context (using user preference)
    videoPlayer.currentTime = Math.max(0, targetTime - videoLeadTime);
    videoPlayer.play();
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

function parseTime(timeStr) {
    const parts = timeStr.split(':');
    if (parts.length === 2) {
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    return 0;
}
