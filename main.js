// main.js - Entry Point
// Minimal setup: Load data, initialize UI, register event listeners

import { 
    ladeSpielstandDaten, spielstand, speichereSpielstand, 
    mergeRemoteSpielstand, resetSpielstand 
} from './modules/state.js';
import { 
    onAuthChange, firebaseLogin, firebaseRegister, loginWithGoogle 
} from './modules/firebase.js';
import {
    toggleDarkMode, 
    rosterBereich, spielBereich, globalAktionen, scoreWrapper, timerAnzeige,
    statistikWrapper, pauseButton, gamePhaseButton, spielBeendenButton,
    rosterTeamNameHeim, rosterTeamNameGegner
} from './modules/dom.js';
import { setSteuerungAktiv } from './modules/game.js';
import { formatiereZeit } from './modules/utils.js';
import { berechneStatistiken } from './modules/stats.js';
import {
    applyTheme, updateScoreDisplay,
    zeichneRosterListe, updateSuspensionDisplay, zeichneSpielerRaster,
    updateProtokollAnzeige, zeichneStatistikTabelle, applyGameMode
} from './modules/ui.js';
import { sanitizeHTML, escapeHTML } from './modules/utils.js';
import { registerEventListeners } from './modules/eventListeners.js';
import { initCustomDialogs } from './modules/customDialog.js';
import { initRouter } from './modules/router.js';
import { initEventListeners } from './modules/events.js';
import { showTeamSelectionOverlay } from './modules/teamsView.js';
import { getActiveTeamId } from './modules/firebase.js';
import { initTableSorting } from './modules/sharedViews.js';

/**
 * App Initialization
 */
function initApp(skipLocalLoad = false) {
    console.log('[Main] Initializing App...');
    
    if (!skipLocalLoad) {
        ladeSpielstandDaten();
    }

    // Set UI state from loaded data
    if (toggleDarkMode) toggleDarkMode.checked = spielstand.settings.darkMode;
    if (rosterTeamNameHeim) rosterTeamNameHeim.value = spielstand.settings.teamNameHeim || '';
    if (rosterTeamNameGegner) rosterTeamNameGegner.value = spielstand.settings.teamNameGegner || '';

    applyTheme();

    // Restore state-based UI elements if necessary 
    // (Note: Router will handle view switching via handleRouting)
    const wasInGame = (window.location.hash === '#game' || spielstand.uiState === 'game');
    if (wasInGame) {
        timerAnzeige.textContent = formatiereZeit(spielstand.timer.verstricheneSekundenBisher);
        const phase = spielstand.timer.gamePhase;
        const sindImSpiel = (phase === 2 || phase === 4 || phase === 1.5 || phase === 3.5);
        setSteuerungAktiv(sindImSpiel);

        updateScoreDisplay();
        updateSuspensionDisplay();
        zeichneSpielerRaster();
        updateProtokollAnzeige();
        applyGameMode(); 
    }

    // Initialize Lucide Icons
    if (window.lucide) window.lucide.createIcons();

    // Initialize Router and Event Listeners
    initRouter();
    initEventListeners();
    
    // Register legacy listeners (to be phased out)
    registerEventListeners();

    // Initialize Table Sorting
    initTableSorting(() => {
        const hash = window.location.hash || '#roster';
        if (hash === '#overview') {
             import('./modules/ui.js').then(m => m.showLiveOverviewInline());
        } else if (hash === '#seasonStats') {
             import('./modules/seasonStats.js').then(m => m.loadSeasonStats());
        } else {
             // For history detail, we need to check if the detail section is visible
             const histDetail = document.getElementById('historieDetailBereich');
             if (histDetail && !histDetail.classList.contains('versteckt')) {
                 import('./modules/historyView.js').then(m => m.refreshHistoryStats());
             }
        }
    });

    console.log('[Main] App Initialized.');
}

/**
 * Modern refresh call for UI based on state changes.
 */
export function refreshUIFromState() {
    applyTheme();
    updateScoreDisplay();
    zeichneSpielerRaster();
    updateSuspensionDisplay();
    updateProtokollAnzeige();
}

// Global Fallbacks
window.sanitizeHTML = sanitizeHTML;
window.escapeHTML = escapeHTML;
window.applyGameMode = applyGameMode;

// Start Authentication Flow which handles hiding/showing login and initApp
onAuthChange(
    (user, profile) => {
        // Logged in
        const overlay = document.getElementById('firebaseLoginOverlay');
        if (overlay) overlay.style.display = 'none';
        initCustomDialogs();
        initApp();

        // Ensure team is selected if not restored
        if (!getActiveTeamId()) {
            showTeamSelectionOverlay(profile, (teamId) => {
                // Team selected, refresh UI
                refreshUIFromState();
            });
        }
    },
    () => {
        // Logged out
        const overlay = document.getElementById('firebaseLoginOverlay');
        if (overlay) overlay.style.display = 'flex';
    }
);

// Setup Login Form Listeners
document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('loginSubmitBtn');
    const googleBtn = document.getElementById('googleLoginBtn');
    const toggleModeBtn = document.getElementById('toggleAuthMode');
    const loginForm = document.getElementById('loginFormElem');
    
    let isLoginMode = true;

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmailInput').value;
            const password = document.getElementById('loginPasswordInput').value;
            const errorMsg = document.getElementById('loginErrorMessage');
            
            errorMsg.textContent = 'Lädt...';
            
            let res;
            if (isLoginMode) {
                res = await firebaseLogin(email, password);
            } else {
                res = await firebaseRegister(email, password);
            }
            
            if (!res.success) {
                errorMsg.textContent = res.error;
            } else {
                errorMsg.textContent = '';
                // Overlay will disappear via onAuthChange
            }
        });
    }

    if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (loginForm) loginForm.dispatchEvent(new Event('submit'));
        });
    }

    if (googleBtn) {
        googleBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const res = await loginWithGoogle();
            if (!res.success && res.error) {
                const errorMsg = document.getElementById('loginErrorMessage');
                if (errorMsg) errorMsg.textContent = res.error;
            }
        });
    }

    if (toggleModeBtn) {
        toggleModeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            isLoginMode = !isLoginMode;
            const title = document.querySelector('#firebaseLoginOverlay h1');
            const subtitle = document.getElementById('loginSubtitle');
            
            if (isLoginMode) {
                if (title) title.textContent = 'Handball Dashboard';
                if (subtitle) subtitle.textContent = 'Melde dich an, um fortzufahren';
                loginBtn.textContent = 'Anmelden';
                toggleModeBtn.textContent = 'Noch kein Konto? Registrieren';
            } else {
                if (title) title.textContent = 'Registrierung';
                if (subtitle) subtitle.textContent = 'Erstelle ein neues Konto';
                loginBtn.textContent = 'Registrieren';
                toggleModeBtn.textContent = 'Bereits ein Konto? Anmelden';
            }
        });
    }
});

export { initApp };
