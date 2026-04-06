// modules/events.js
import { navigateTo, handleRouting } from './router.js';
import { 
    sidebar, sidebarOverlay, 
    kommentarBereich, kommentarTitel, kommentarInput 
} from './dom.js';
import { 
    starteNeuesSpiel, handleGamePhaseClick, handleRealPauseClick, 
    handleBenchPlayerClick, handleLineupSlotClick,
    loescheProtokollEintrag, setAktuelleAktionTyp
} from './game.js';
import { handleZeitSprung } from './timer.js';
import { handleSpielBeenden } from './historyView.js';
import { schliesseEditModus, deleteEntireTeam } from './roster.js';
import { exportTeam } from './export.js';
import { 
    saveCurrentTeam, showLoadTeamModal, loadSavedTeam, 
    deleteSavedTeam, viewTeam, updateTeam 
} from './teamStorage.js';
import { firebaseLogout } from './firebase.js';
import { executeAction } from './game.js';
import { addPlayer, oeffneOpponentEditModus } from './roster.js';
import { zeichneSpielerRaster, applyGameMode } from './ui.js';
import { spielstand, speichereSpielstand } from './state.js';

/**
 * Central event delegation hub.
 * Listens for all clicks and dispatches to appropriate handlers based on data-action.
 */
export function initEventListeners() {
    document.body.addEventListener('click', async (e) => {
        const target = e.target.closest('[data-action]');
        
        // --- Outside Click Modal Closing ---
        const activeModal = document.querySelector('.modal-overlay:not(.versteckt), .event-popover:not(.versteckt)');
        if (activeModal && !e.target.closest('.shadcn-modal-content, .event-popover, .modal-content, .dashboard-overlay-content')) {
            // Only close if we didn't just click an opener or a data-action (unless it's close)
            if (!target || target.dataset.action === 'close-modal') {
                activeModal.classList.add('versteckt');
                return;
            }
        }

        if (!target) return;

        const action = target.dataset.action;
        const params = target.dataset;

        console.log(`[Events] Action: ${action}`, params);
        
        // Diagnostic Log for Game Actions
        if (action === 'game-btn') {
            console.log('[Events] Game button clicked. Current Selection State:', 
                spielstand.selectedPlayer ? JSON.parse(JSON.stringify(spielstand.selectedPlayer)) : 'NULL');
        }

        // --- DRAG & DROP HANDLERS ---
        document.body.addEventListener('dragstart', (e) => {
            const target = e.target.closest('[draggable="true"]');
            if (target) {
                const params = target.dataset;
                const data = {
                    index: params.index,
                    teamKey: params.teamKey,
                    slotType: params.slotType,
                    slotIndex: params.slotIndex,
                    isBench: params.isBench
                };
                e.dataTransfer.setData('application/json', JSON.stringify(data));
                e.dataTransfer.effectAllowed = 'move';
                target.classList.add('dragging');
            }
        });

        document.body.addEventListener('dragend', (e) => {
            const target = e.target.closest('[draggable="true"]');
            if (target) target.classList.remove('dragging');
            document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
        });

        document.body.addEventListener('dragover', (e) => {
            const target = e.target.closest('.spieler-button');
            if (target) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                target.classList.add('drag-over');
            }
        });

        document.body.addEventListener('dragleave', (e) => {
            const target = e.target.closest('.spieler-button');
            if (target) target.classList.remove('drag-over');
        });

        document.body.addEventListener('drop', async (e) => {
            e.preventDefault();
            const target = e.target.closest('.spieler-button');
            document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
            
            if (target) {
                try {
                    const sourceData = JSON.parse(e.dataTransfer.getData('application/json'));
                    const targetParams = target.dataset;
                    
                    // console.log('Drop!', { sourceData, targetParams });
                    
                    // Handle Swap logic (Complex Mode only)
                    if (spielstand.gameMode === 'complex' && sourceData.teamKey === targetParams.teamKey) {
                        const { handleLineupSlotClick, handleBenchPlayerClick } = await import('./game.js');
                        
                        // We trick the existing click handlers to perform the swap
                        // Source => Target
                        if (sourceData.isBench === 'true') {
                            // Dragging bench player to a slot or another bench player
                            if (targetParams.slotType) {
                                // Drop on slot: Perform swap
                                handleLineupSlotClick(targetParams.slotType, parseInt(targetParams.slotIndex), targetParams.teamKey, parseInt(sourceData.index), targetParams.empty === 'true');
                            }
                        } else if (sourceData.slotType) {
                            // Dragging slot player to bench or another slot
                            if (targetParams.isBench === 'true') {
                                // Drop on bench: Just select the slot first, then swap will be handled by game.js logic?
                                // Better: Manual swap logic implementation 
                                handleBenchPlayerClick(parseInt(targetParams.index), targetParams.teamKey);
                                handleLineupSlotClick(sourceData.slotType, parseInt(sourceData.slotIndex), sourceData.teamKey);
                            } else if (targetParams.slotType) {
                                // Slot to Slot swap
                                handleLineupSlotClick(targetParams.slotType, parseInt(targetParams.slotIndex), targetParams.teamKey, parseInt(sourceData.index), targetParams.empty === 'true');
                            }
                        }
                    }
                } catch (err) {
                    console.error('[Events] Drop failed:', err);
                }
            }
        });

        switch (action) {
            // --- Navigation ---
            case 'nav':
                if (params.view) navigateTo(params.view);
                break;
            
            case 'toggle-mobile-menu':
                toggleMobileMenu();
                break;

            // --- Game Actions ---
            case 'game-phase':
                handleGamePhaseClick();
                break;
            case 'game-pause':
                handleRealPauseClick();
                break;
            case 'game-timer-jump':
                handleZeitSprung(parseInt(params.seconds || '0'));
                break;
            case 'game-finish':
                handleSpielBeenden();
                break;
            case 'game-reset':
                starteNeuesSpiel();
                break;

            // --- Roster Actions ---
            case 'roster-cancel-edit':
                schliesseEditModus();
                break;
            case 'roster-delete-team':
                deleteEntireTeam();
                break;
            case 'roster-export-team':
                exportTeam();
                break;
            case 'roster-save-team':
                saveCurrentTeam();
                break;
            case 'roster-load-team-modal':
                showLoadTeamModal();
                break;
            case 'team-load':
                loadSavedTeam(params.key, parseInt(params.index));
                break;
            case 'team-delete':
                deleteSavedTeam(params.key, parseInt(params.index));
                break;
            case 'team-view':
                viewTeam(params.key, parseInt(params.index));
                break;

            // --- Game Board / Lineup ---
            case 'lineup-player':
                handleLineupSlotClick(
                    params.slotType, 
                    parseInt(params.slotIndex), 
                    params.teamKey || params.team, 
                    (params.index !== undefined && params.index !== null) ? parseInt(params.index) : null, 
                    params.empty === 'true'
                );
                break;
            case 'bench-player':
                handleBenchPlayerClick(
                    (params.index !== undefined && params.index !== null) ? parseInt(params.index) : null, 
                    params.teamKey || params.team, 
                    params.gegnerNummer
                );
                break;

            // --- Auth ---
            case 'logout':
                firebaseLogout();
                break;

            // --- Generic UI ---
            case 'close-modal':
                const modal = target.closest('.modal-overlay') || target.closest('.modal-content') || target.closest('.dashboard-overlay');
                if (modal) modal.classList.add('versteckt');
                break;

            case 'game-btn':
                if (params.type) {
                    executeAction(params.type);
                }
                break;

            case 'more-actions':
                if (kommentarBereich) {
                    setAktuelleAktionTyp('Sonstiges');
                    if (kommentarTitel) kommentarTitel.textContent = `Kommentar für: Sonstiges`;
                    kommentarBereich.classList.remove('versteckt');
                    if (kommentarInput) kommentarInput.focus();
                }
                break;

            case 'undo':
                if (spielstand.gameLog && spielstand.gameLog.length > 0) {
                    loescheProtokollEintrag(0);
                }
                break;
            
            case 'team-save':
                await import('./teamStorage.js').then(m => m.saveCurrentTeam());
                break;
            case 'team-load-modal':
                await import('./teamStorage.js').then(m => m.showLoadTeamModal());
                break;
            case 'delete-current-team':
                await import('./roster.js').then(m => m.deleteEntireTeam());
                break;
            case 'team-load':
                await import('./teamStorage.js').then(m => m.loadSavedTeam(params.key, parseInt(params.index)));
                break;
            case 'team-delete':
                await import('./teamStorage.js').then(m => m.deleteSavedTeam(params.key, parseInt(params.index)));
                break;
            case 'team-view':
                await import('./teamStorage.js').then(m => m.viewTeam(params.key, parseInt(params.index)));
                break;
            case 'delete-player':
                if (params.index !== undefined) {
                    const roster = await import('./roster.js');
                    if (params.isOpponent === 'true') {
                        roster.deleteOpponent(parseInt(params.index));
                    } else {
                        roster.deletePlayer(parseInt(params.index));
                    }
                }
                break;
            case 'load-history-team':
                await import('./teamStorage.js').then(m => m.loadHistoryTeam(parseInt(params.index)));
                break;
            case 'delete-player-from-saved-team':
                await import('./teamStorage.js').then(m => m.deletePlayerFromSavedTeam(parseInt(params.playerIndex)));
                break;

            // --- Roster ---
            case 'toggle-nav-group':
                if (params.group) {
                    const groupContent = document.getElementById(`nav-group-${params.group}`);
                    const toggleIcon = target.querySelector('.nav-group-toggle');
                    if (groupContent) {
                        groupContent.classList.toggle('collapsed');
                        if (toggleIcon) toggleIcon.classList.toggle('rotated');
                    }
                }
                break;

            case 'roster-add-player':
                const quickModal = document.getElementById('quickAddPlayerModal');
                if (quickModal) {
                    quickModal.classList.remove('versteckt');
                    const numInput = document.getElementById('quickPlayerNumber');
                    if (numInput) numInput.focus();
                }
                break;
            
            case 'roster-add-opponent':
                const oppModal = document.getElementById('addGegnerModal');
                if (oppModal) {
                    oppModal.classList.remove('versteckt');
                    const oppNumInput = document.getElementById('addGegnerNummerInput');
                    if (oppNumInput) oppNumInput.focus();
                }
                break;

            case 'save-player':
                await import('./roster.js').then(m => m.updatePlayerInline(e));
                break;

            case 'game-select-mode':
                if (params.mode) {
                    spielstand.gameMode = params.mode;
                    spielstand.modeSelected = true;
                    
                    // Save state
                    speichereSpielstand();
                    
                    // Force immediate UI Update
                    applyGameMode();
                    zeichneSpielerRaster();
                    
                    // Hide the mode selection overlay if it exists
                    const overlay = document.getElementById('modeSelectionOverlay');
                    if (overlay) overlay.classList.add('versteckt');
                    
                    // Handle routing (navigation to #spiel if needed)
                    handleRouting();
                }
                break;

            default:
                // If action is not handled here, it might be handled by legacy listeners 
                // or specific module listeners. We slowly migrate them all here.
                break;
        }
    });

    // --- Global Outside Click for Modals/Popovers ---
    document.addEventListener('mousedown', (e) => {
        // Modal Overlays (fullscreen backgrounds)
        if (e.target.classList.contains('modal-overlay')) {
            e.target.classList.add('versteckt');
            return;
        }

        // Popovers (smaller floating div, need to check if click is outside)
        const openPopovers = document.querySelectorAll('.event-popover:not(.versteckt)');
        openPopovers.forEach(popover => {
            if (!popover.contains(e.target)) {
                // Check if target is not the button that opens it (to avoid immediate re-toggle)
                const isOpener = e.target.closest('[data-action="open-absence"]') || 
                                 e.target.closest('#openSubSettings') ||
                                 e.target.closest('.calendar-event-card') ||
                                 e.target.closest('.shadcn-datepicker') ||
                                 e.target.closest('.shadcn-timepicker') ||
                                 e.target.closest('.calendar-container') ||
                                 e.target.closest('#manageCalendarBtn') ||
                                 e.target.closest('#addAbsenceBtn') ||
                                 e.target.closest('#addEventBtn');
                
                if (!isOpener) {
                    popover.classList.add('versteckt');
                }
            }
        });
    });
}

function toggleMobileMenu() {
    if (sidebar) {
        const isActive = sidebar.classList.toggle('active');
        if (sidebarOverlay) {
            sidebarOverlay.classList.toggle('active', isActive);
        }
    }
}
