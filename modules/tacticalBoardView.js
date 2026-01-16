// Tactical Board View Module
import { customAlert, customConfirm, customPrompt } from './customDialog.js';

let frames = [];
let isPlaying = false;
let currentFrameIndex = -1;

export function initTacticalBoard() {
    const container = document.getElementById('tacticalBoardContainer');
    if (!container) return;

    container.innerHTML = `
        <div class="tactical-board-wrapper">
            <div class="tactical-toolbar">
                <div class="tool-group">
                    <span class="tool-label">Objekte</span>
                    <div class="draggable-source home-team" draggable="true" data-type="player" data-team="home">H</div>
                    <div class="draggable-source away-team" draggable="true" data-type="player" data-team="away">G</div>
                    <div class="draggable-source ball" draggable="true" data-type="ball">⚽</div>
                </div>
                <!-- Tools Removed: Select, Pen, Arrow, Eraser, Color Picker -->
                <div class="tool-group">
                    <span class="tool-label">Animation</span>
                    <button id="addFrameBtn" class="shadcn-btn-secondary"><i data-lucide="plus"></i> Frame</button>
                    <button id="playAnimationBtn" class="shadcn-btn-primary"><i data-lucide="play"></i> Abspielen</button>
                </div>
                <div class="tool-group">
                    <span class="tool-label">Board</span>
                    <button id="savePlayBtn" class="shadcn-btn-outline" title="Spielzug speichern"><i data-lucide="save"></i></button>
                    <button id="loadPlayBtn" class="shadcn-btn-outline" title="Spielzug laden"><i data-lucide="folder-open"></i></button>
                    <button id="clearBoardBtn" class="shadcn-btn-outline" title="Board leeren"><i data-lucide="trash-2"></i></button>
                </div>
            </div>

            <div class="tactical-stage-container">
                <svg id="tacticalCourt" viewBox="0 0 800 500" class="tactical-court">
                    <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#ffffff" />
                        </marker>
                    </defs>
                    <!-- Outer border / surroundings (matches reference green) -->
                    <rect x="0" y="0" width="800" height="500" fill="#6b7b5c" />
                    <!-- Playing field (blue) -->
                    <rect x="20" y="20" width="760" height="460" fill="#3498db" stroke="#fff" stroke-width="2" />
                    <!-- Center Line -->
                    <line x1="400" y1="20" x2="400" y2="480" stroke="#fff" stroke-width="2" />
                    
                    <!-- LEFT SIDE -->
                    <!-- Goal (white) -->
                    <rect x="8" y="220" width="12" height="60" fill="#fff" stroke="#333" stroke-width="1" />
                    <!-- 6m Goal Area (Solid D-shape) -->
                    <!-- Top Arc -> Straight -> Bottom Arc -->
                    <path d="M 20 100 A 120 120 0 0 1 140 220 L 140 280 A 120 120 0 0 1 20 400" fill="none" stroke="#fff" stroke-width="2" />
                    <!-- 9m Free-throw Line (Dashed D-shape) -->
                    <path d="M 20 40 A 180 180 0 0 1 200 220 L 200 280 A 180 180 0 0 1 20 460" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="10,10" />
                    <!-- 4m Goalkeeper Line -->
                    <line x1="100" y1="245" x2="100" y2="255" stroke="#fff" stroke-width="2" />
                    <!-- 7m Penalty Mark -->
                    <line x1="160" y1="245" x2="160" y2="255" stroke="#fff" stroke-width="2" />
                    
                    <!-- RIGHT SIDE -->
                    <!-- Goal (white) -->
                    <rect x="780" y="220" width="12" height="60" fill="#fff" stroke="#333" stroke-width="1" />
                    <!-- 6m Goal Area (Solid D-shape mirrored) -->
                    <path d="M 780 400 A 120 120 0 0 1 660 280 L 660 220 A 120 120 0 0 1 780 100" fill="none" stroke="#fff" stroke-width="2" />
                    <!-- 9m Free-throw Line (Dashed D-shape mirrored) -->
                    <path d="M 780 460 A 180 180 0 0 1 600 280 L 600 220 A 180 180 0 0 1 780 40" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="10,10" />
                    <!-- 4m Goalkeeper Line -->
                    <line x1="700" y1="245" x2="700" y2="255" stroke="#fff" stroke-width="2" />
                    <!-- 7m Penalty Mark -->
                    <line x1="640" y1="245" x2="640" y2="255" stroke="#fff" stroke-width="2" />
                    
                    <!-- Dynamic Layer for drawing and players -->
                    <!-- Dynamic Layer for drawing and players -->
                    <g id="pathLayer"></g>
                    <g id="objectLayer"></g>
                </svg>
                <div id="timelineContainer" class="timeline-container">
                    <div id="timelineTrack" class="timeline-track">
                        <!-- Frames will appear here -->
                    </div>
                </div>
            </div>
            </div>
            
            <!-- Context Menu -->
            <div id="playerContextMenu" class="context-menu versteckt" style="position: absolute;">
                <div class="context-menu-form">
                    <div class="context-input-group">
                        <label>Nummer</label>
                        <input type="text" id="ctxNumberInput" maxlength="3" style="width: 50px;">
                    </div>
                    <div class="context-input-group">
                        <label>Name</label>
                        <input type="text" id="ctxNameInput" placeholder="Name...">
                    </div>
                </div>
                <div class="context-menu-item delete-item" id="ctxDeleteBtn">
                    <i data-lucide="trash-2"></i> Entfernen
                </div>
            </div>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    // Reset state on re-init
    frames = [];
    isPlaying = false;

    setupInteractions();
    setupAnimationControls();

    // Default Initialization: Frame 1 with Standard Formation
    if (frames.length === 0) {
        spawnStandardFormation();
        saveFrame(); // Create Frame 1
        renderTimeline();
        applyFrame(0);
    }
}

function setupInteractions() {
    const svg = document.getElementById('tacticalCourt');
    const drawLayer = document.getElementById('drawLayer');
    const objectLayer = document.getElementById('objectLayer');
    // --- Tools Removed: Drag Only ---
    // --- Context Menu Logic ---
    const contextMenu = document.getElementById('playerContextMenu');
    let contextTarget = null;
    const container = document.getElementById('tacticalBoardContainer');
    const ctxNumberInput = document.getElementById('ctxNumberInput');
    const ctxNameInput = document.getElementById('ctxNameInput');
    const ctxDeleteBtn = document.getElementById('ctxDeleteBtn');

    const showContextMenu = (e, target) => {
        if (!target) return;
        e.preventDefault();
        contextTarget = target;
        contextMenu.classList.remove('versteckt');

        const rect = container.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        let x = clientX - rect.left;
        let y = clientY - rect.top;

        if (x + 150 > rect.width) x -= 140;
        if (y + 100 > rect.height) y -= 90;

        contextMenu.style.left = `${x}px`;
        contextMenu.style.top = `${y}px`;

        if (ctxNumberInput) ctxNumberInput.value = target.dataset.number || '';
        if (ctxNameInput) ctxNameInput.value = target.dataset.name || '';
    };

    svg.addEventListener('contextmenu', (e) => {
        const target = e.target.closest('.tactical-object.player');
        if (target) showContextMenu(e, target);
        else contextMenu.classList.add('versteckt');
    });

    let dragTarget = null;
    let pendingSpawn = null;
    let touchTimer = null;

    // --- Dragging Support Refactored ---
    const onStart = (e) => {
        const target = e.target.closest('.tactical-object');

        if (target) {
            if (e.type === 'touchstart') {
                e.preventDefault();
                // Long press for context menu
                touchTimer = setTimeout(() => showContextMenu(e, target), 600);
            }
            dragTarget = target;
            dragTarget.classList.add('dragging');

            document.querySelectorAll('.tactical-object.selected').forEach(el => el.classList.remove('selected'));
            target.classList.add('selected');
        } else {
            // Check for tap-to-spawn
            if (pendingSpawn && (e.type === 'mousedown' || e.type === 'touchstart')) {
                const pt = getSVGPoint(e, svg);
                spawnObject(pendingSpawn.type, pendingSpawn.team, pt.x, pt.y);
                pendingSpawn = null;
                document.querySelectorAll('.draggable-source').forEach(s => s.classList.remove('active-spawn'));
                if (e.type === 'touchstart') e.preventDefault();
                return;
            }

            if (e.type === 'mousedown' || e.type === 'touchstart') {
                document.querySelectorAll('.tactical-object.selected').forEach(el => el.classList.remove('selected'));
                contextMenu.classList.add('versteckt');
            }
        }
    };

    const onMove = (e) => {
        if (touchTimer) clearTimeout(touchTimer);
        if (!dragTarget) return;
        if (e.type === 'touchmove') e.preventDefault();

        const pt = getSVGPoint(e, svg);
        dragTarget.setAttribute('cx', pt.x);
        dragTarget.setAttribute('cy', pt.y);

        if (dragTarget.tagName === 'g') {
            dragTarget.setAttribute('transform', `translate(${pt.x}, ${pt.y})`);
        }

        // Live Path Update
        if (currentFrameIndex > 0) {
            renderPaths(currentFrameIndex);
        }
    };

    const onEnd = () => {
        if (touchTimer) clearTimeout(touchTimer);
        if (dragTarget) {
            dragTarget.classList.remove('dragging');
            dragTarget = null;
        }
        if (currentFrameIndex >= 0 && currentFrameIndex < frames.length) {
            frames[currentFrameIndex] = captureFrameState();
            if (currentFrameIndex > 0) renderPaths(currentFrameIndex);
            if (currentFrameIndex < frames.length - 1) renderPaths(currentFrameIndex + 1);
        }
    };

    svg.addEventListener('mousedown', onStart);
    svg.addEventListener('touchstart', onStart, { passive: false });

    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: false });

    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);

    // --- Eraser Support Removed ---

    // --- Helper to spawn objects ---
    // --- Sidebar Spawning (Standard D&D + Touch Fallback) ---
    const sources = document.querySelectorAll('.draggable-source');
    sources.forEach(source => {
        source.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('type', source.dataset.type);
            e.dataTransfer.setData('team', source.dataset.team || '');
        });

        source.addEventListener('touchstart', (e) => {
            // Toggle selection
            if (pendingSpawn && pendingSpawn.type === source.dataset.type && pendingSpawn.team === (source.dataset.team || '')) {
                pendingSpawn = null;
                source.classList.remove('active-spawn');
            } else {
                pendingSpawn = {
                    type: source.dataset.type,
                    team: source.dataset.team || ''
                };
                sources.forEach(s => s.classList.remove('active-spawn'));
                source.classList.add('active-spawn');
            }
        }, { passive: true });
    });

    svg.addEventListener('dragover', (e) => e.preventDefault());
    svg.addEventListener('drop', (e) => {
        e.preventDefault();
        const pt = getSVGPoint(e, svg);
        const type = e.dataTransfer.getData('type');
        const team = e.dataTransfer.getData('team');
        spawnObject(type, team, pt.x, pt.y);
    });

    // Hide menu on click elsewhere
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.context-menu')) {
            contextMenu.classList.add('versteckt');
        }
    });

    const updateFrame = () => {
        if (currentFrameIndex >= 0 && frames[currentFrameIndex]) {
            frames[currentFrameIndex] = captureFrameState();
        }
    };

    if (ctxNumberInput) {
        ctxNumberInput.addEventListener('input', (e) => {
            if (!contextTarget) return;
            const newNum = e.target.value;
            contextTarget.dataset.number = newNum;
            const textEl = contextTarget.querySelector('text');
            if (textEl) textEl.textContent = newNum;
            updateFrame();
        });
    }

    if (ctxNameInput) {
        ctxNameInput.addEventListener('input', (e) => {
            if (!contextTarget) return;
            const newName = e.target.value;
            contextTarget.dataset.name = newName;
            let title = contextTarget.querySelector('title');
            if (!title) {
                title = document.createElementNS("http://www.w3.org/2000/svg", "title");
                contextTarget.appendChild(title);
            }
            title.textContent = newName;
            updateFrame();
        });
    }

    if (ctxDeleteBtn) {
        ctxDeleteBtn.addEventListener('click', () => {
            if (!contextTarget) return;
            contextMenu.classList.add('versteckt');
            contextTarget.remove();
            updateFrame();
        });
    }
}

function setupAnimationControls() {
    const addFrameBtn = document.getElementById('addFrameBtn');
    const playBtn = document.getElementById('playAnimationBtn');
    const timelineTrack = document.getElementById('timelineTrack');
    const savePlayBtn = document.getElementById('savePlayBtn');
    const loadPlayBtn = document.getElementById('loadPlayBtn');
    const clearBoardBtn = document.getElementById('clearBoardBtn');
    const objectLayer = document.getElementById('objectLayer');
    const drawLayer = document.getElementById('drawLayer');

    if (addFrameBtn) {
        addFrameBtn.addEventListener('click', () => {
            // 1. Update current frame first
            if (currentFrameIndex >= 0) {
                frames[currentFrameIndex] = captureFrameState();
            }
            // 2. Add new frame
            const newFrame = captureFrameState();
            frames.push(newFrame);

            renderTimeline();
            applyFrame(frames.length - 1);
        });
    }

    if (playBtn) {
        playBtn.addEventListener('click', () => {
            if (isPlaying) {
                isPlaying = false;
                return;
            }
            playAnimation();
        });
    }

    if (savePlayBtn) {
        savePlayBtn.addEventListener('click', async () => {
            const playName = await customPrompt("Name für diesen Spielzug:", "Spielzug speichern");
            if (!playName) return;

            const playData = {
                name: playName,
                frames: frames,
                currentBoard: {
                    objects: Array.from(objectLayer.children).map(obj => {
                        const type = obj.classList.contains('player') ? 'player' : 'ball';
                        let x, y;
                        if (type === 'player') {
                            const transform = obj.getAttribute('transform');
                            const match = transform.match(/translate\(\s*([0-9.-]+)[,\s]+\s*([0-9.-]+)\s*\)/);
                            if (match) {
                                x = parseFloat(match[1]);
                                y = parseFloat(match[2]);
                            } else { x = 0; y = 0; }
                        } else {
                            const transform = obj.getAttribute('transform');
                            const match = transform ? transform.match(/translate\(\s*([0-9.-]+)[,\s]+\s*([0-9.-]+)\s*\)/) : null;
                            if (match) {
                                x = parseFloat(match[1]);
                                y = parseFloat(match[2]);
                            } else {
                                x = parseFloat(obj.getAttribute('cx')) || 0;
                                y = parseFloat(obj.getAttribute('cy')) || 0;
                            }
                        }
                        return {
                            type,
                            x,
                            y,
                            team: obj.classList.contains('home') ? 'home' : (obj.classList.contains('away') ? 'away' : ''),
                            number: obj.dataset.number || null,
                            id: obj.dataset.id || Date.now() + Math.random().toString(36).substr(2, 9)
                        };
                    }),
                    drawings: document.getElementById('drawLayer') ? document.getElementById('drawLayer').innerHTML : ''
                }
            };

            let plays = JSON.parse(localStorage.getItem('handball_tactical_plays') || '[]');
            plays.push(playData);
            localStorage.setItem('handball_tactical_plays', JSON.stringify(plays));
            await customAlert("Spielzug gespeichert!", "Erfolg");
        });
    }

    if (loadPlayBtn) {
        loadPlayBtn.addEventListener('click', async () => {
            let plays = JSON.parse(localStorage.getItem('handball_tactical_plays') || '[]');
            if (plays.length === 0) {
                await customAlert("Keine gespeicherten Spielzüge gefunden.", "Info");
                return;
            }

            // NEW: Load via List Modal
            const loadPlayModal = document.getElementById('loadPlayModal');
            const loadPlayList = document.getElementById('loadPlayList');
            const closeLoadPlayModal = document.getElementById('closeLoadPlayModal');

            if (loadPlayModal && loadPlayList) {
                const renderList = () => {
                    loadPlayList.innerHTML = '';
                    // Reload plays from storage to ensure current state
                    let currentPlays = JSON.parse(localStorage.getItem('handball_tactical_plays') || '[]');

                    if (currentPlays.length === 0) {
                        loadPlayList.innerHTML = '<div style="text-align:center; padding:20px; color:gray;">Keine Spielzüge gespeichert</div>';
                        return;
                    }

                    currentPlays.forEach((play, index) => {
                        const row = document.createElement('div');
                        row.className = 'play-item-row';

                        // Load Button Portion
                        const infoBtn = document.createElement('button');
                        infoBtn.className = 'play-item-info';
                        infoBtn.innerHTML = `
                            <span style="font-weight:500;">${index + 1}. ${play.name}</span>
                            <span style="font-size:0.8em; opacity:0.7;">${play.frames ? play.frames.length : 0} Frames</span>
                        `;

                        infoBtn.addEventListener('click', () => {
                            frames = play.frames || [];
                            renderTimeline();

                            const objLayer = document.getElementById('objectLayer');
                            const drwLayer = document.getElementById('drawLayer');

                            if (objLayer) {
                                objLayer.innerHTML = '';
                                play.currentBoard.objects.forEach(obj => {
                                    spawnObject(obj.type, obj.team, obj.x, obj.y, obj.number, obj.id, obj.name);
                                });
                            }

                            if (drwLayer) {
                                drwLayer.innerHTML = play.currentBoard.drawings || '';
                            }

                            if (frames.length > 0) applyFrame(0);
                            loadPlayModal.classList.add('versteckt');
                        });

                        // Delete Button
                        const deleteBtn = document.createElement('button');
                        deleteBtn.className = 'play-item-delete';
                        deleteBtn.innerHTML = '<i data-lucide="trash-2"></i>';
                        deleteBtn.title = 'Löschen';

                        deleteBtn.addEventListener('click', async (e) => {
                            e.stopPropagation(); // Don't trigger load
                            if (await customConfirm(`Spielzug "${play.name}" wirklich löschen?`, "Löschen")) {
                                currentPlays.splice(index, 1);
                                localStorage.setItem('handball_tactical_plays', JSON.stringify(currentPlays));
                                renderList(); // Re-render list
                            }
                        });

                        row.appendChild(infoBtn);
                        row.appendChild(deleteBtn);
                        loadPlayList.appendChild(row);
                    });

                    if (window.lucide) window.lucide.createIcons();
                };

                renderList();
                loadPlayModal.classList.remove('versteckt');

                // Close handler
                const closeHandler = () => {
                    loadPlayModal.classList.add('versteckt');
                    closeLoadPlayModal.removeEventListener('click', closeHandler);
                };
                if (closeLoadPlayModal) {
                    closeLoadPlayModal.onclick = closeHandler;
                }
            } else {
                await customAlert("Lade-Dialog Fehler: Modal nicht gefunden.", "Fehler");
            }
        });
    }

    if (clearBoardBtn) {
        clearBoardBtn.addEventListener('click', async () => {
            if (await customConfirm("Möchtest du das Board wirklich leeren? Alle ungespeicherten Daten gehen verloren.", "Board leeren?")) {
                // Re-query to prevent stale reference
                const currentObjectLayer = document.getElementById('objectLayer');
                const currentDrawLayer = document.getElementById('drawLayer');

                if (currentObjectLayer) currentObjectLayer.innerHTML = '';
                if (currentDrawLayer) currentDrawLayer.innerHTML = '';

                frames = [];
                currentFrameIndex = 0;

                // Reset to standard formation
                spawnStandardFormation();

                // Initialize Frame 1
                saveFrame();

                renderTimeline();
                applyFrame(0);
            }
        });
    }
}

function getSVGPoint(e, svg) {
    const pt = svg.createSVGPoint();
    let clientX, clientY;

    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    pt.x = clientX;
    pt.y = clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
}

function captureFrameState() {
    const objectLayer = document.getElementById('objectLayer');
    return {
        objects: Array.from(objectLayer.children).map(obj => {
            const type = obj.classList.contains('player') ? 'player' : 'ball';
            let x, y;
            if (type === 'player') {
                const transform = obj.getAttribute('transform');
                // Regex to handle both comma and space separators in translate(x, y) or translate(x y)
                const match = transform.match(/translate\(\s*([0-9.-]+)[,\s]+\s*([0-9.-]+)\s*\)/);
                if (match) {
                    x = parseFloat(match[1]);
                    y = parseFloat(match[2]);
                } else {
                    x = 0; y = 0; // Fallback
                }
            } else {
                const transform = obj.getAttribute('transform');
                const match = transform ? transform.match(/translate\(\s*([0-9.-]+)[,\s]+\s*([0-9.-]+)\s*\)/) : null;
                if (match) {
                    x = parseFloat(match[1]);
                    y = parseFloat(match[2]);
                } else {
                    // Fallback if it's still a circle or parsing fails
                    x = parseFloat(obj.getAttribute('cx')) || 0;
                    y = parseFloat(obj.getAttribute('cy')) || 0;
                }
            }
            return {
                type,
                x,
                y,
                team: obj.classList.contains('home') ? 'home' : (obj.classList.contains('away') ? 'away' : ''),
                id: obj.dataset.id || Date.now() + Math.random().toString(36).substr(2, 9),
                number: obj.dataset.number || null,
                name: obj.dataset.name || null, // Capture Name
                controlPointOffset: obj.controlPointOffset || null
            };
        })
    };
}

function saveFrame() {
    frames.push(captureFrameState());
}

function renderTimeline() {
    const timelineTrack = document.getElementById('timelineTrack');
    timelineTrack.innerHTML = '';
    frames.forEach((frame, index) => {
        const thumb = document.createElement('div');
        thumb.className = 'timeline-thumb';
        thumb.innerHTML = `
            <span>Frame ${index + 1}</span>
            <button class="delete-frame-btn" title="Frame löschen"><i data-lucide="x"></i></button>
        `;

        thumb.addEventListener('click', (e) => {
            if (e.target.closest('.delete-frame-btn')) {
                e.stopPropagation();
                frames.splice(index, 1);
                renderTimeline();
            } else {
                applyFrame(index);
            }
        });

        timelineTrack.appendChild(thumb);
    });
    if (window.lucide) window.lucide.createIcons();
}

function applyFrame(index) {
    currentFrameIndex = index;
    const frame = frames[index];
    const objectLayer = document.getElementById('objectLayer');
    objectLayer.innerHTML = '';
    frame.objects.forEach(obj => {
        spawnObject(obj.type, obj.team, obj.x, obj.y, obj.number, obj.id, obj.name);
    });

    // Always render paths from previous frame if available
    renderPaths(index);

    // Highlight timeline thumb? (Visual polish for later)
    document.querySelectorAll('.timeline-thumb').forEach((t, i) => {
        t.style.border = i === index ? '2px solid var(--primary-color)' : '1px solid #444';
    });
}

async function playAnimation() {
    const playBtn = document.getElementById('playAnimationBtn');
    const objectLayer = document.getElementById('objectLayer');

    if (frames.length < 2) return;
    isPlaying = true;
    playBtn.innerHTML = '<i data-lucide="square"></i> Stopp';
    if (window.lucide) window.lucide.createIcons();

    const pathLayer = document.getElementById('pathLayer');
    pathLayer.innerHTML = ''; // Hide paths/ghosts during animation

    for (let i = 0; i < frames.length - 1; i++) {
        if (!isPlaying) break;
        // Optional: Highlight timeline thumb during playback
        // applyFrame is not called here to avoid full re-render, but we could update UI
        await animateTransition(frames[i], frames[i + 1], 1000);
    }

    isPlaying = false;
    playBtn.innerHTML = '<i data-lucide="play"></i> Abspielen';
    if (window.lucide) window.lucide.createIcons();

    // Restore state (select last frame)
    applyFrame(frames.length - 1);
}

function animateTransition(start, end, duration) {
    const objectLayer = document.getElementById('objectLayer');
    return new Promise(resolve => {
        const startTime = performance.now();

        function tick(now) {
            const progress = Math.min((now - startTime) / duration, 1);
            // Ease in-out cubic
            const eased = progress < 0.5
                ? 4 * progress * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;

            // Update object positions
            objectLayer.innerHTML = '';
            end.objects.forEach((endObj) => {
                // Find start object by ID if possible, else index fallback (but index is risky if count changes)
                // Actually if IDs exist, strictly use them.
                const startObj = start.objects.find(o => o.id === endObj.id) || endObj;

                let x, y;
                if (startObj.controlPointOffset) {
                    // Quadratic Bezier: B(t) = (1-t)^2 P0 + 2(1-t)t P1 + t^2 P2
                    const t = eased;
                    const p0 = { x: startObj.x, y: startObj.y };
                    const p2 = { x: endObj.x, y: endObj.y };

                    // P1 = Midpoint + Offset
                    const midX = (p0.x + p2.x) / 2;
                    const midY = (p0.y + p2.y) / 2;
                    const p1 = { x: midX + startObj.controlPointOffset.x, y: midY + startObj.controlPointOffset.y };

                    x = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x;
                    y = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y;
                } else {
                    x = startObj.x + (endObj.x - startObj.x) * eased;
                    y = startObj.y + (endObj.y - startObj.y) * eased;
                }

                spawnObject(endObj.type, endObj.team, x, y, endObj.number, endObj.id);
            });

            if (progress < 1) {
                requestAnimationFrame(tick);
            } else {
                resolve();
            }
        }
        requestAnimationFrame(tick);
    });
}

function spawnObject(type, team, x, y, number = null, id = null, name = null) {
    const objectLayer = document.getElementById('objectLayer');
    if (type === 'player') {
        // Calculate next number for this team if not provided
        let playerNumber = number;
        if (playerNumber === null) {
            const existingPlayers = objectLayer.querySelectorAll(`.player.${team}`);
            playerNumber = existingPlayers.length + 1;
        }

        const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        group.setAttribute('transform', `translate(${x}, ${y})`);
        group.classList.add('tactical-object', 'player', team);
        group.dataset.number = playerNumber;
        group.dataset.number = playerNumber;
        group.dataset.id = id || Date.now() + Math.random().toString(36).substr(2, 9);
        if (name) {
            group.dataset.name = name;
            const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
            title.textContent = name;
            group.appendChild(title);
        }

        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute('r', '15');
        circle.setAttribute('fill', team === 'home' ? 'var(--team-primary-color, #dc3545)' : 'var(--team-opponent-color, #2563eb)');
        circle.setAttribute('stroke', '#fff');
        circle.setAttribute('stroke-width', '2');

        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dy', '.35em');
        text.setAttribute('fill', '#fff');
        text.setAttribute('font-size', '12');
        text.setAttribute('font-weight', 'bold');
        text.textContent = playerNumber;

        group.appendChild(circle);
        group.appendChild(text);
        objectLayer.appendChild(group);
    } else if (type === 'ball') {
        const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        group.setAttribute('transform', `translate(${x}, ${y})`);
        group.classList.add('tactical-object', 'ball');
        group.dataset.id = id || Date.now() + Math.random().toString(36).substr(2, 9);

        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dy', '.35em');
        text.setAttribute('font-size', '20');
        text.textContent = '⚽';

        group.appendChild(text);
        objectLayer.appendChild(group);
    }
}

function renderPaths(currentIndex) {
    const svg = document.getElementById('tacticalCourt');
    const pathLayer = document.getElementById('pathLayer');
    pathLayer.innerHTML = '';

    // specific check: if playing, do not render paths
    if (isPlaying) return;

    // We need at least index 1 to show a path from index 0
    if (currentIndex < 1 || currentIndex >= frames.length) return;

    const prevFrame = frames[currentIndex - 1];

    // Use LIVE object positions from the DOM instead of the saved frame state
    // This allows the paths to update while dragging.
    const objectLayer = document.getElementById('objectLayer');

    prevFrame.objects.forEach(prevObj => {
        // Find the corresponding LIVE object in the DOM
        const currObjEl = objectLayer.querySelector(`[data-id="${prevObj.id}"]`);

        if (currObjEl) {
            // Extract position from DOM element
            let currX, currY;
            if (currObjEl.classList.contains('player') || currObjEl.tagName === 'g') {
                const transform = currObjEl.getAttribute('transform');
                const match = transform.match(/translate\(\s*([0-9.-]+)[,\s]+\s*([0-9.-]+)\s*\)/);
                if (match) {
                    currX = parseFloat(match[1]);
                    currY = parseFloat(match[2]);
                }
            } else {
                const transform = currObjEl.getAttribute('transform');
                const match = transform ? transform.match(/translate\(\s*([0-9.-]+)[,\s]+\s*([0-9.-]+)\s*\)/) : null;
                if (match) {
                    currX = parseFloat(match[1]);
                    currY = parseFloat(match[2]);
                } else {
                    currX = parseFloat(currObjEl.getAttribute('cx'));
                    currY = parseFloat(currObjEl.getAttribute('cy'));
                }
            }

            // Construct a temporary object for calculation
            const currObj = { x: currX, y: currY };

            // Draw Ghost of Previous Position (Origin)
            const ghostGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
            ghostGroup.setAttribute('transform', `translate(${prevObj.x}, ${prevObj.y})`);
            ghostGroup.setAttribute('opacity', '0.4'); // 40% opacity for ghost

            if (prevObj.type === 'player') {
                const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                circle.setAttribute('r', '15');
                circle.setAttribute('fill', prevObj.team === 'home' ? 'var(--team-primary-color, #dc3545)' : 'var(--team-opponent-color, #2563eb)');
                circle.setAttribute('stroke', '#fff');
                circle.setAttribute('stroke-width', '2');
                circle.setAttribute('stroke-dasharray', '4,2'); // Dashed stroke for ghost

                const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('dy', '.35em');
                text.setAttribute('fill', '#fff');
                text.setAttribute('font-size', '12');
                text.textContent = prevObj.number;

                ghostGroup.appendChild(circle);
                ghostGroup.appendChild(text);
            } else {
                const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('dy', '.35em');
                text.setAttribute('font-size', '20');
                text.setAttribute('opacity', '0.6');
                text.textContent = '⚽';
                ghostGroup.appendChild(text);
            }
            pathLayer.appendChild(ghostGroup);

            // Check if position changed
            if (Math.abs(prevObj.x - currObj.x) < 1 && Math.abs(prevObj.y - currObj.y) < 1) return;

            // Calculate Control Point
            const midX = (prevObj.x + currObj.x) / 2;
            const midY = (prevObj.y + currObj.y) / 2;

            let cpX = midX;
            let cpY = midY;

            if (prevObj.controlPointOffset) {
                cpX += prevObj.controlPointOffset.x;
                cpY += prevObj.controlPointOffset.y;
            }

            // Draw Dashed Path (Bezier)
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", `M ${prevObj.x} ${prevObj.y} Q ${cpX} ${cpY} ${currObj.x} ${currObj.y}`);
            path.setAttribute("stroke", "#ffffff");
            path.setAttribute("stroke-width", "2");
            path.setAttribute("stroke-dasharray", "5,5"); // Dashed line for path
            path.setAttribute("fill", "none");
            path.setAttribute("opacity", "0.8");
            pathLayer.appendChild(path);

            // Draw Control Handle
            const handle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            handle.setAttribute("cx", cpX);
            handle.setAttribute("cy", cpY);
            handle.setAttribute("r", "6");
            handle.setAttribute("fill", "#facc15"); // Yellow handle
            handle.setAttribute("stroke", "#000");
            handle.setAttribute("cursor", "move");
            handle.classList.add("path-handle");

            // Make handle draggable
            let isDragging = false;

            handle.addEventListener('mousedown', (e) => {
                isDragging = true;
                e.stopPropagation();
            });

            const moveHandle = (e) => {
                if (!isDragging) return;
                const pt = getSVGPoint(e, svg);

                handle.setAttribute("cx", pt.x);
                handle.setAttribute("cy", pt.y);

                // Update Path Visual
                path.setAttribute("d", `M ${prevObj.x} ${prevObj.y} Q ${pt.x} ${pt.y} ${currObj.x} ${currObj.y}`);

                // Update Data
                // Offset = NewPos - Midpoint
                prevObj.controlPointOffset = {
                    x: pt.x - midX,
                    y: pt.y - midY
                };
            };

            const stopDrag = () => {
                isDragging = false;
                window.removeEventListener('mousemove', moveHandle);
                window.removeEventListener('mouseup', stopDrag);
            };

            handle.addEventListener('mousedown', () => {
                window.addEventListener('mousemove', moveHandle);
                window.addEventListener('mouseup', stopDrag);
            });

            pathLayer.appendChild(handle);
        }
    });
}

function spawnStandardFormation() {
    // Standard Attack Formation (Home Team - Red) Attacking Left Goal
    // Numbering 1-5 from Bottom to Top (User Request)
    // Wings deeper in corners (x closer to 20)

    // Home Team (Attack)
    const attackPositions = [
        // 1: Bottom Wing (Right Wing physically)
        { x: 30, y: 460, num: '1' },

        // 2: Bottom Back (Right Back)
        { x: 280, y: 380, num: '2' }, // Outside 9m

        // 3: Center Back
        { x: 300, y: 250, num: '3' }, // Outside 9m

        // 4: Top Back (Left Back)
        { x: 280, y: 120, num: '4' }, // Outside 9m

        // 5: Top Wing (Left Wing)
        { x: 20, y: 40, num: '5' },

        // 6: Pivot (Near 6m line)
        { x: 190, y: 280, num: '6' }
    ];

    attackPositions.forEach(pos => {
        spawnObject('player', 'home', pos.x, pos.y, pos.num);
    });

    // Opponent Team (Defense - Blue) - 6:0 Formation around 6m line (x=140 arc)
    // They defend the LEFT goal (x=0)

    // Home Goalkeeper (Right Goal)
    spawnObject('player', 'home', 750, 250, 'TW');

    // Defense (Away Team - Blue) at Left Goal (6m line is approx x=100-140)
    // Standard 6-0 Defense - Compact/"Enger"
    // Numbering 1-6 from Bottom to Top based on user instructions:
    // 1 -> Old 2, 2 -> Between 2&3, 3&4 Closer, 5 -> Inward, 6 -> Old 5
    const defPositions = [
        { x: 90, y: 380, num: '1' },  // Was at 2's spot
        { x: 120, y: 330, num: '2' }, // Between old 2 and 3
        { x: 140, y: 270, num: '3' }, // Closer to center
        { x: 140, y: 230, num: '4' }, // Closer to center
        { x: 120, y: 170, num: '5' }, // Inward towards half
        { x: 90, y: 120, num: '6' }   // Was at 5's spot
    ];

    defPositions.forEach(pos => {
        spawnObject('player', 'away', pos.x, pos.y, pos.num);
    });

    // Opponent Goalkeeper (Left Goal)
    spawnObject('player', 'away', 40, 250, 'TW');

    // Ball with Center Back
    spawnObject('ball', null, 320, 270);
}
