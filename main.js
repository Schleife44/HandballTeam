// main.js - Entry Point
// Minimal setup: Load data, initialize UI, register event listeners

import { 
    ladeSpielstandDaten, spielstand, speichereSpielstand, 
    mergeRemoteSpielstand, resetSpielstand, isUserAssigned
} from './modules/state.js';
import { 
    onAuthChange, firebaseLogin, firebaseRegister, loginWithGoogle, redeemInviteToken,
    startSpielstandListener, linkMemberToRoster, checkIfOnboardingNeeded, 
    verifyMembership, handleAccessDenied
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
    updateProtokollAnzeige, zeichneStatistikTabelle, applyGameMode, initSidebarGroups
} from './modules/ui.js';
import { sanitizeHTML, escapeHTML } from './modules/utils.js';
import { registerEventListeners } from './modules/eventListeners.js';
import { initCustomDialogs, customAlert, customPrompt } from './modules/customDialog.js';
import { initRouter } from './modules/router.js';
import { initEventListeners } from './modules/events.js?v=v4_safety_net';
import { showTeamSelectionOverlay } from './modules/teamsView.js';
import { getActiveTeamId } from './modules/firebase.js';
import { initTableSorting } from './modules/sharedViews.js';

/**
 * App Initialization
 */
function initApp(skipLocalLoad = false) {
    console.log('[Main] Initializing App...');
    
    // Expose spielstand as a global bridge for cross-module role checks (e.g. firebase.js isUserTrainer)
    window.__spielstand__ = { spielstand };

    if (!skipLocalLoad) {
        ladeSpielstandDaten();
    }

    // Set UI state from loaded data
    if (toggleDarkMode) toggleDarkMode.checked = spielstand.settings.darkMode;
    if (rosterTeamNameHeim) rosterTeamNameHeim.value = spielstand.settings.teamNameHeim || '';
    if (rosterTeamNameGegner) rosterTeamNameGegner.value = spielstand.settings.teamNameGegner || '';

    applyTheme();
    initSidebarGroups();

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

import { syncSettingsVisuals } from './modules/settingsManager.js';

/**
 * Modern refresh call for UI based on state changes.
 */
export function refreshUIFromState() {
    applyTheme();
    updateScoreDisplay();
    zeichneSpielerRaster();
    updateSuspensionDisplay();
    updateProtokollAnzeige();
    syncSettingsVisuals();
    initSidebarGroups();
    
    // Additional view refreshes
    const hash = window.location.hash || '#dashboard';
    if (hash === '#dashboard') {
        import('./modules/dashboardView.js').then(m => m.showDashboardInline());
    } else if (hash === '#calendar') {
        import('./calendar.js').then(m => m.renderCalendar());
    } else if (hash === '#roster') {
        zeichneRosterListe();
    }
}

// Global Fallbacks
window.sanitizeHTML = sanitizeHTML;
window.escapeHTML = escapeHTML;
window.applyGameMode = applyGameMode;

/**
 * Starts the realtime syncing with Firebase for the active team.
 */
function initRealtimeSync() {
    import('./modules/firebase.js').then(m => {
        const teamId = m.getActiveTeamId();
        const uid = m.getAuthUid();
        if (!teamId || !uid) return;

        console.log('[Main] Starting Realtime Sync for Team:', teamId);
        let firstLoad = true;
        
        m.startSpielstandListener(async (remoteData) => {
            mergeRemoteSpielstand(remoteData);
            
            if (firstLoad) {
                firstLoad = false;
                console.log('[Main] First cloud snapshot received.');

                // Reactive Onboarding: Only prompt if sync shows we are missing
                if (!isUserAssigned(uid)) {
                    // Check if they are owner - if so, maybe they dont want a player slot
                    const profile = m.getCurrentUserProfile();
                    const teamRec = profile?.teams?.find(t => String(t.teamId) === String(teamId));
                    const isTrainer = teamRec && (teamRec.role === 'trainer' || teamRec.role === 'owner');

                    if (!isTrainer) {
                        const name = await customPrompt('Willkommen im Team! Wie heißt du? (Wird im Kader angezeigt)', 'Dein Name');
                        if (name && name.trim()) {
                            await linkMemberToRoster(teamId, name.trim());
                        }
                    }
                }
                
                // Success: full navigation refresh
                window.dispatchEvent(new Event('hashchange'));
            } else {
                refreshUIFromState();
            }
        });
    });
}

// Start Authentication Flow which handles hiding/showing login and initApp
onAuthChange(
    async (user, profile) => {
        // Logged in
        const overlay = document.getElementById('firebaseLoginOverlay');
        if (overlay) overlay.style.display = 'none';
        initCustomDialogs();

        // 1. Invite Tokens
        const pendingInvite = sessionStorage.getItem('pendingInviteToken');
        if (pendingInvite) {
            sessionStorage.removeItem('pendingInviteToken');
            const res = await redeemInviteToken(pendingInvite);
            if (res.success) {
                await customAlert(`Erfolgreich dem Team "${res.teamName}" beigetreten!`, 'Willkommen!');
            }
        }

        // 2. Resolve Active Team
        const restoredId = getActiveTeamId();

        if (!restoredId) {
            showTeamSelectionOverlay(profile, async (teamId) => {
                // setActiveTeam(teamId) is already called in teamsView.js
                initRealtimeSync();
            });
        } else {
            const isStillMember = await verifyMembership(restoredId);
            if (!isStillMember) {
                await handleAccessDenied();
            } else {
                initRealtimeSync();
            }
        }
    },
    () => {
        // Logged out
        const overlay = document.getElementById('firebaseLoginOverlay');
        if (overlay) overlay.style.display = 'flex';
        resetSpielstand();
    }
);

// Setup Login Form Listeners
document.addEventListener('DOMContentLoaded', () => {
    initApp();

    // Check for invite token in URL and save it
    const urlParams = new URLSearchParams(window.location.search);
    const inviteToken = urlParams.get('invite');
    if (inviteToken) {
        sessionStorage.setItem('pendingInviteToken', inviteToken);
        const newUrl = window.location.origin + window.location.pathname + window.location.hash;
        window.history.replaceState(null, '', newUrl);
    }

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
