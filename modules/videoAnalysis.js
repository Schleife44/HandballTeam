import { spielstand } from './state.js';

let videoAnalysisInitialized = false;
let currentVideoGame = null;
let videoOffset = 0; // Seconds offset (Video Time = Game Log Time + Offset)

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

        // Reset Offset on new video
        videoOffset = 0;
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
    if (setStartBtn) {
        setStartBtn.addEventListener('click', () => {
            if (videoPlayer && videoPlayer.src && videoPlayer.style.display !== 'none') {
                videoOffset = videoPlayer.currentTime;
                updateOffsetUI();
                // Feedback
                const originalText = setStartBtn.innerHTML;
                setStartBtn.textContent = `Gesetzt: ${videoOffset.toFixed(1)}s`;
                setTimeout(() => {
                    setStartBtn.innerHTML = originalText;
                }, 2000);
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

    videoAnalysisInitialized = true;
}

function updateOffsetUI() {
    // Maybe show offset somewhere permanent?
    const title = document.getElementById('videoAnalyseTitle');
    if (title && videoOffset > 0) {
        // Append offset info if not already there? 
        // Or just let the button feedback be enough.
    }
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

export function handleVideoAnalysisView() {
    initVideoAnalysis();
    renderVideoGameList();
}

function renderVideoGameList() {
    const listContainer = document.getElementById('videoGameListContent');
    if (!listContainer) return;

    listContainer.innerHTML = '';
    const historyData = localStorage.getItem('handball_history');

    if (!historyData) {
        listContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">Keine Spiele im Archiv.</p>';
        return;
    }

    let games = [];
    try {
        games = JSON.parse(historyData);
    } catch (e) {
        listContainer.innerHTML = '<p style="color: var(--destructive); font-size: 0.9rem;">Fehler beim Laden.</p>';
        return;
    }

    if (!Array.isArray(games)) games = [games];
    games.sort((a, b) => (b.timestamp || b.id || 0) - (a.timestamp || a.id || 0));

    if (games.length === 0) {
        listContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">Keine Spiele.</p>';
        return;
    }

    games.forEach(game => {
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

        item.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span style="font-weight: 600; font-size: 0.85rem; color: var(--text-muted);">${dateStr}</span>
                <span style="font-weight: 700; font-size: 0.95rem; color: var(--primary);">${scoreStr}</span>
            </div>
            <div style="font-size: 0.9rem; font-weight: 500;">
                ${heim} <span style="font-weight: normal; color: var(--text-muted);">vs</span> ${gast}
            </div>
        `;

        item.addEventListener('click', () => {
            if (selectedItem) selectedItem.style.border = '1px solid var(--border-color)';
            item.style.border = '1px solid var(--primary)';
            selectedItem = item;

            // Reset offset on new game? Maybe not if same video. 
            // But usually new game = new video context. Reset for safety.
            videoOffset = 0;
            updateOffsetUI();
            selectGameForAnalysis(game);
        });

        listContainer.appendChild(item);
    });
}

let selectedItem = null;

function selectGameForAnalysis(game) {
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
    checkAndRenderProtocol();
}

function checkAndRenderProtocol() {
    const protocolContainer = document.getElementById('videoAnalysisProtocol');
    const list = document.getElementById('videoAnalysisProtocolList');
    const videoPlayer = document.getElementById('analysisVideoPlayer');

    const hasVideo = videoPlayer && videoPlayer.src && videoPlayer.style.display !== 'none';

    if (currentVideoGame && hasVideo) {
        if (protocolContainer) protocolContainer.style.display = 'flex';
        renderProtocolList(currentVideoGame, list);
    } else {
        if (protocolContainer) protocolContainer.style.display = 'none';
    }
}

function renderProtocolList(game, list) {
    if (!list) return;
    list.innerHTML = '';

    const log = game.gameLog || [];
    const sortedLog = [...log].reverse();

    sortedLog.forEach(entry => {
        const item = document.createElement('div');
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        item.style.gap = '10px';
        item.style.padding = '6px';
        item.style.borderBottom = '1px solid var(--border-color)';
        item.style.cursor = 'pointer';
        item.style.fontSize = '0.85rem';
        item.style.transition = 'background 0.2s';

        item.addEventListener('mouseenter', () => item.style.backgroundColor = 'var(--bg-hover)');
        item.addEventListener('mouseleave', () => item.style.backgroundColor = 'transparent');

        const timeStr = entry.time || "00:00";

        item.addEventListener('click', () => {
            const videoPlayer = document.getElementById('analysisVideoPlayer');
            if (videoPlayer) {
                // Calculate Target Time
                let targetTime = 0;
                if (entry.videoTime !== undefined) {
                    targetTime = entry.videoTime;
                } else {
                    targetTime = parseTime(timeStr);
                }

                // Apply Offset
                targetTime += videoOffset;

                videoPlayer.currentTime = Math.max(0, targetTime);

                // Auto scroll or highlight? 
                // videoPlayer.play();
            }
        });

        let playerInfo = "";

        if (entry.gegnerNummer) {
            playerInfo = `#${entry.gegnerNummer} (Gegner)`;
        } else if (entry.playerName && entry.playerName !== "SPIEL") {
            playerInfo = entry.playerName;
        } else if (entry.playerId) {
            playerInfo = `#${entry.playerId}`;
        }

        item.innerHTML = `
            <span style="font-family: monospace; font-weight: bold; width: 45px; color: var(--text-muted);">${timeStr}</span>
            <div style="flex: 1; display: flex; flex-direction: column;">
                <span style="font-weight: 500;">${entry.action}</span>
                ${playerInfo ? `<span style="font-size: 0.75rem; opacity: 0.7;">${playerInfo}</span>` : ''}
            </div>
            <span style="font-weight: bold; font-family: monospace;">${entry.score || ''}</span>
        `;

        list.appendChild(item);
    });
}

function parseTime(timeStr) {
    const parts = timeStr.split(':');
    if (parts.length === 2) {
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    return 0;
}
