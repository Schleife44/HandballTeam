// modules/events.js
import { navigateTo, handleRouting } from './router.js';
import { sidebar, sidebarOverlay } from './dom.js';
import { 
    starteNeuesSpiel, handleGamePhaseClick, handleRealPauseClick, 
    handleBenchPlayerClick, handleLineupSlotClick,
    loescheProtokollEintrag
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
                    params.teamKey, 
                    params.index ? parseInt(params.index) : null, 
                    params.empty === 'true'
                );
                break;
            case 'bench-player':
                handleBenchPlayerClick(
                    params.index ? parseInt(params.index) : null, 
                    params.teamKey, 
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
                await import('./teamStorage.js').then(m => m.deleteCurrentTeam());
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
                                 e.target.closest('.calendar-event-card');
                
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
