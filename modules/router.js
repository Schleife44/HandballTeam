// modules/router.js
import { spielstand } from './state.js';
import {
    rosterBereich, spielBereich, calendarBereich,
    seasonBereich, historieBereich, settingsBereich,
    liveOverviewBereich, shotsBereich, liveHeatmapBereich,
    protokollBereich, socialMediaBereich,
    sidebar, sidebarOverlay
} from './dom.js';
import {
    showLiveOverviewInline, showShotsInline, showLiveHeatmapInline,
    applyTheme, updateProtokollAnzeige, zeichneRosterListe
} from './ui.js';
import { showDashboardInline } from './dashboardView.js';
import { updateRosterInputsForValidation, initSettingsPage, initSocialMediaSettings } from './settingsManager.js';
import { renderHistoryList } from './historyView.js';
import { openSeasonOverview } from './seasonView.js';

/**
 * Maps hashes to view rendering functions.
 */
const routes = {
    'dashboard': async () => {
        hideAllSections();
        await showDashboardInline();
    },
    'roster': () => {
        hideAllSections();
        if (rosterBereich) rosterBereich.classList.remove('versteckt');
        // Redraw roster
        const teamToggle = document.getElementById('teamToggle');
        const isOpponent = teamToggle && teamToggle.getAttribute('aria-checked') === 'true';
        zeichneRosterListe(isOpponent);
        updateRosterInputsForValidation();
    },
    'game': () => {
        hideAllSections();
        if (spielBereich) spielBereich.classList.remove('versteckt');
        // Handle game mode selection vs content
        const modeSelection = document.getElementById('gameModeSelection');
        const gameContent = document.getElementById('gameContent');
        if (spielstand.timer.gamePhase === 1 && !spielstand.modeSelected) {
            if (modeSelection) modeSelection.classList.remove('versteckt');
            if (gameContent) gameContent.classList.add('versteckt');
        } else {
            if (modeSelection) modeSelection.classList.add('versteckt');
            if (gameContent) gameContent.classList.remove('versteckt');
        }
    },
    'calendar': () => {
        hideAllSections();
        if (calendarBereich) calendarBereich.classList.remove('versteckt');
        import('./calendar.js').then(cal => {
            if (!window.calendarInitialized) {
                cal.initCalendar();
                window.calendarInitialized = true;
            } else {
                cal.renderCalendar();
            }
        });
    },
    'season': () => {
        hideAllSections();
        if (seasonBereich) seasonBereich.classList.remove('versteckt');
        openSeasonOverview();
    },
    'seasonStats': () => {
        hideAllSections();
        const seasonStatsBereich = document.getElementById('seasonStatsBereich');
        if (seasonStatsBereich) seasonStatsBereich.classList.remove('versteckt');
        import('./seasonView.js').then(mod => {
            mod.renderSeasonStats();
            if (mod.initSeasonSubTabs) mod.initSeasonSubTabs();
        });
    },
    'history': () => {
        hideAllSections();
        if (historieBereich) {
            historieBereich.classList.remove('versteckt');
            renderHistoryList();
        }
    },
    'settings': () => {
        hideAllSections();
        if (settingsBereich) settingsBereich.classList.remove('versteckt');
        initSettingsPage();
    },
    'overview': () => {
        hideAllSections();
        showLiveOverviewInline();
    },
    'shots': () => {
        hideAllSections();
        showShotsInline();
    },
    'heatmap': () => {
        hideAllSections();
        showLiveHeatmapInline();
    },
    'protocol': () => {
        hideAllSections();
        if (protokollBereich) protokollBereich.classList.remove('versteckt');
        updateProtokollAnzeige();
    },
    'videoanalyse': () => {
        hideAllSections();
        const vaBereich = document.getElementById('videoAnalyseBereich');
        if (vaBereich) vaBereich.classList.remove('versteckt');
        import('./videoAnalysis.js').then(mod => mod.handleVideoAnalysisView());
    },
    'tacticalboard': () => {
        hideAllSections();
        const tbBereich = document.getElementById('tacticalBoardBereich');
        if (tbBereich) tbBereich.classList.remove('versteckt');
        import('./tacticalBoardView.js').then(mod => mod.initTacticalBoard());
    },
    'socialmedia': () => {
        hideAllSections();
        if (socialMediaBereich) socialMediaBereich.classList.remove('versteckt');
        initSocialMediaSettings();
    }
};

/**
 * Utility to hide all main content sections.
 */
function hideAllSections() {
    const sections = [
        rosterBereich, spielBereich, calendarBereich,
        seasonBereich, historieBereich, settingsBereich,
        liveOverviewBereich, shotsBereich, liveHeatmapBereich,
        protokollBereich,
        document.getElementById('seasonStatsBereich'),
        document.getElementById('videoAnalyseBereich'),
        document.getElementById('tacticalBoardBereich'),
        document.getElementById('dashboardBereich'),
        socialMediaBereich,
        historieDetailBereich
    ];
    sections.forEach(s => {
        if (s) {
            s.classList.add('versteckt');
            s.classList.remove('active'); // Some might use active
        }
    });
}

/**
 * Navigates to a specific view by updating the hash.
 */
export function navigateTo(view) {
    window.location.hash = view;
}

/**
 * Handles the hashchange event and renders the appropriate view.
 */
export async function handleRouting() {
    const hash = window.location.hash.substring(1) || 'dashboard';
    console.log('[DEBUG] handleRouting: Hash is "%s", isSpielAktiv: %s', hash, spielstand.isSpielAktiv);
    
    // Support nested or specialized routes if needed in future
    const routeAction = routes[hash] || routes['dashboard'];

    await routeAction();

    // Update active state in sidebar
    updateSidebarActiveState(hash);

    // Update state for persistence
    spielstand.uiState = hash;

    // Close mobile sidebar if open
    closeMobileSidebar();
}

function updateSidebarActiveState(activeHash) {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        if (item.dataset.view === activeHash) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

function closeMobileSidebar() {
    if (sidebar && sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
        if (sidebarOverlay) sidebarOverlay.classList.remove('active');
    }
}

/**
 * Initializes the router.
 */
export function initRouter() {
    console.log('[DEBUG] Initializing router. Initial hash:', window.location.hash);
    window.addEventListener('hashchange', handleRouting);
    // Trigger initial route
    handleRouting();
}
