// modules/firebase.js
// Central Firebase module: Authentication + Firestore sync

import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js';
import {
    getFirestore,
    doc,
    setDoc,
    updateDoc,
    collection,
    query,
    where,
    onSnapshot,
    getDoc,
    getDocs,
    deleteDoc,
    orderBy,
    arrayUnion,
    arrayRemove,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged,
    sendEmailVerification
} from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js';

// ─── Firebase Config ───────────────────────────────────────────────────────────
// Config is loaded from a separate file that is excluded from Git via .gitignore.
// If you are setting up this project locally, copy firebase-config.example.js
// to firebase-config.js and insert your API key.
import { firebaseConfig } from './firebase-config.js';

// ─── Init ──────────────────────────────────────────────────────────────────────
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ─── State ─────────────────────────────────────────────────────────────────────
let isOnline = false;
let currentUserProfile = null; // { uid, email, teams: [] }
let activeTeamId = null;
let activeGameId = 'current';

let saveDebounceTimer = null;
let teamsSaveDebounceTimer = null;
let snapshotUnsubscribe = null;
let isReceivingRemoteUpdate = false;

// ─── Dynamic Paths ────────────────────────────────────────────────────────────
const getGameDoc = (teamId, gameId = 'current') => doc(db, 'teams', teamId, 'games', gameId);
const getHistoryCollection = (teamId) => collection(db, 'teams', teamId, 'history');
const getHistoryDoc = (teamId, gameId) => doc(db, 'teams', teamId, 'history', gameId);
const getRosterDoc = (teamId) => doc(db, 'teams', teamId, 'data', 'roster');
const getUserDoc = (uid) => doc(db, 'users', uid);
const getTeamDoc = (teamId) => doc(db, 'teams', teamId);

// ─── Auth ──────────────────────────────────────────────────────────────────────
/**
 * Listen to auth state changes. Calls onLogin(user) or onLogout() accordingly.
 */
export function onAuthChange(onLogin, onLogout) {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            isOnline = true;
            updateStatusIndicator('online');
            
            // Sync user profile before calling onLogin
            currentUserProfile = await syncUserProfile(user);
            
            // Restore active team if possible
            restoreActiveTeam();
            
            onLogin(user, currentUserProfile);
        } else {
            isOnline = false;
            currentUserProfile = null;
            activeTeamId = null;
            updateStatusIndicator('offline');
            onLogout();
        }
    });
}

/**
 * Sign in with email + password.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function firebaseLogin(email, password) {
    try {
        await signInWithEmailAndPassword(auth, email, password);
        return { success: true };
    } catch (err) {
        console.error('[Firebase] Login error:', err);
        let message = 'Anmeldung fehlgeschlagen.';
        if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
            message = 'Falsche E-Mail oder falsches Passwort.';
        } else if (err.code === 'auth/too-many-requests') {
            message = 'Zu viele Versuche. Bitte warte kurz.';
        } else if (err.code === 'auth/network-request-failed') {
            message = 'Netzwerkfehler. Bitte Internetverbindung prüfen.';
        }
        return { success: false, error: authErrors[err.code] || 'Anmeldung fehlgeschlagen.' };
    }
}

/**
 * Register a new user with email and password.
 */
export async function firebaseRegister(email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Send Email Verification (async but we don't strictly fail the whole registration if it fails)
        try {
            await sendEmailVerification(userCredential.user);
        } catch (emailErr) {
            console.error('[Firebase] Email verification error:', emailErr);
            // We ignore email failure for now to allow user to proceed
        }
        await syncUserProfile(userCredential.user);
        return { success: true };
    } catch (err) {
        console.error('[Firebase] Register error:', err);
        return { success: false, error: authErrors[err.code] || 'Registrierung fehlgeschlagen.' };
    }
}

/** 
 * Error mapping for human-readable messages 
 */
const authErrors = {
    'auth/email-already-in-use': 'Diese E-Mail wird bereits verwendet.',
    'auth/invalid-email': 'Ungültige E-Mail-Adresse.',
    'auth/operation-not-allowed': 'E-Mail/Passwort-Anmeldung ist nicht aktiviert.',
    'auth/weak-password': 'Das Passwort ist zu schwach (mind. 6 Zeichen).',
    'auth/user-not-found': 'Kein Konto mit dieser E-Mail gefunden.',
    'auth/wrong-password': 'Falsches Passwort.',
    'auth/invalid-credential': 'Ungültige Anmeldedaten.'
};

/**
 * Sign in with Google Popup.
 */
export async function loginWithGoogle() {
    try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        return { success: true };
    } catch (err) {
        console.error('[Firebase] Google login error:', err);
        return { success: false, error: 'Google-Anmeldung fehlgeschlagen.' };
    }
}

/**
 * Sign out the current user.
 */
export async function firebaseLogout() {
    try {
        if (snapshotUnsubscribe) {
            snapshotUnsubscribe();
            snapshotUnsubscribe = null;
        }
        await signOut(auth);
    } catch (err) {
        console.error('[Firebase] Logout error:', err);
    }
}

/**
 * Sync user profile in Firestore. Creates it if not exists.
 * @returns {Promise<Object>} The profile data
 */
async function syncUserProfile(user) {
    const userRef = getUserDoc(user.uid);
    const snap = await getDoc(userRef);
    
    if (snap.exists()) {
        const data = snap.data();
        if (data.email !== user.email) {
            await updateDoc(userRef, { email: user.email });
        }
        return { uid: user.uid, ...data };
    } else {
        const newProfile = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || '',
            rosterName: '', // New: Global player name
            teams: [], // List of { teamId, role, teamName }
            createdAt: serverTimestamp()
        };
        await setDoc(userRef, newProfile);
        return newProfile;
    }
}

/**
 * Updates the rosterName in the user's profile.
 */
export async function updateUserRosterName(name) {
    if (!auth.currentUser) return;
    try {
        const userRef = getUserDoc(auth.currentUser.uid);
        await updateDoc(userRef, { rosterName: name });
        if (currentUserProfile) currentUserProfile.rosterName = name;
    } catch (err) {
        console.error('[Firebase] Update rosterName error:', err);
    }
}

/**
 * Create a new team and add current user as 'trainer' (owner).
 */
export async function createTeam(teamName) {
    if (!auth.currentUser) return { success: false, error: 'Nicht angemeldet' };

    try {
        const teamRef = doc(collection(db, 'teams'));
        const teamId = teamRef.id;

        // 1. Create Team Doc
        await setDoc(teamRef, {
            teamName,
            ownerUid: auth.currentUser.uid,
            createdAt: serverTimestamp()
        });

        // 2. Add to Members Subcollection (NEW: for hardened rules)
        const memberRef = doc(db, 'teams', teamId, 'members', auth.currentUser.uid);
        await setDoc(memberRef, {
            uid: auth.currentUser.uid,
            role: 'trainer',
            joinedAt: serverTimestamp()
        });

        // 3. Add to User Profile
        const userRef = getUserDoc(auth.currentUser.uid);
        const teamEntry = { teamId, teamName, role: 'trainer' };
        await updateDoc(userRef, {
            teams: arrayUnion(teamEntry)
        });

        // Update local state
        if (currentUserProfile) {
            currentUserProfile.teams.push(teamEntry);
        }

        return { success: true, teamId };
    } catch (err) {
        console.error('[Firebase] Create Team error:', err);
        return { success: false, error: 'Team konnte nicht erstellt werden.' };
    }
}

/**
 * Cloud History Functions
 */
export async function saveGameToHistory(teamId, gameData) {
    if (!isOnline) return { success: false, error: 'Offline' };
    try {
        const gameId = gameData.id ? String(gameData.id) : String(Date.now());
        const historyRef = getHistoryDoc(teamId, gameId);
        await setDoc(historyRef, {
            ...gameData,
            serverTimestamp: serverTimestamp()
        });
        return { success: true };
    } catch (err) {
        console.error('[Firebase] Save History error:', err);
        return { success: false, error: err.message };
    }
}

export async function loadTeamHistory(teamId) {
    if (!isOnline) return [];
    try {
        const q = query(getHistoryCollection(teamId), orderBy('date', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
        console.error('[Firebase] Load History error:', err);
        return [];
    }
}

export async function deleteGameFromHistory(teamId, gameId) {
    if (!isOnline) return;
    try {
        await deleteDoc(getHistoryDoc(teamId, String(gameId)));
    } catch (err) {
        console.error('[Firebase] Delete History error:', err);
    }
}

export async function setActiveTeam(teamId) {
    activeTeamId = teamId;
    console.log(`[Firebase] Active team set to: ${teamId}`);
    
    // Persist active team to localStorage for refresh recovery
    if (auth.currentUser) {
        localStorage.setItem(`handballActiveTeam_${auth.currentUser.uid}`, teamId);
    }
    
    // Auto-sync membership for legacy teams or consistency
    if (auth.currentUser && teamId) {
        ensureTeamMembershipSynced(teamId);
    }
}

/**
 * Restore active team from localStorage on page refresh.
 */
export function restoreActiveTeam() {
    if (!auth.currentUser) return;
    const storedId = localStorage.getItem(`handballActiveTeam_${auth.currentUser.uid}`);
    if (storedId) {
        console.log(`[Firebase] Restoring active team from storage: ${storedId}`);
        activeTeamId = storedId;
        // Membership sync will happen in setActiveTeam if called, but here we just restore the ID
        // so that isUserTrainer() and firestore paths work immediately.
    }
}

/**
 * Migration helper: Ensures the user has a record in the 'members' subcollection
 * if they are listed as a member in their profile. This handles legacy teams
 * created before the hardened rules were applied.
 */
async function ensureTeamMembershipSynced(teamId) {
    if (!auth.currentUser || !currentUserProfile) return;
    
    const teamInProfile = currentUserProfile.teams.find(t => String(t.teamId) === String(teamId));
    if (!teamInProfile) return;

    try {
        const memberRef = doc(db, 'teams', teamId, 'members', auth.currentUser.uid);
        const snap = await getDoc(memberRef);
        
        if (!snap.exists()) {
            console.log(`[Firebase] Syncing membership for team: ${teamId}`);
            await setDoc(memberRef, {
                uid: auth.currentUser.uid,
                role: teamInProfile.role || 'member',
                joinedAt: serverTimestamp(),
                syncedAt: serverTimestamp() // Mark as migrated
            });
        }
    } catch (err) {
        // This might fail if rules are already applied and user isn't yet synced.
        // In that case, we might need a more privileged way or a graceful failure.
        console.warn('[Firebase] Membership sync failed (possibly rules already active):', err);
    }
}

export function getActiveTeamId() {
    return activeTeamId;
}

export function getAuthUid() {
    return auth.currentUser ? auth.currentUser.uid : null;
}

export function getCurrentUserProfile() {
    return currentUserProfile;
}

/**
 * Helper to check if current user is trainer for active team
 */
export function isUserTrainer() {
    if (!currentUserProfile || !activeTeamId) return false;
    
    // 1. Check user profile for explicit trainer role
    const teamRecord = currentUserProfile.teams.find(t => {
        const tid = String(t.teamId || t.id);
        const aid = String(activeTeamId);
        return tid === aid;
    });
    
    // Trainers or Owners are the same in terms of UI permissions
    const isTrainer = teamRecord && (
        teamRecord.role === 'trainer' || 
        teamRecord.role === 'owner' || 
        teamRecord.role === 'Creator' ||
        teamRecord.role === 'coach'
    );

    if (!isTrainer) {
        console.warn('[Firebase] isUserTrainer: Permission denied or Team not found.', {
            activeTeamId,
            userTeams: currentUserProfile.teams
        });
    }

    return isTrainer;
}

// ─── Team Invitations ─────────────────────────────────────────────────────────

/**
 * Creates an invite token for a team.
 */
export async function createInviteToken(teamId, teamName) {
    if (!auth.currentUser) return null;
    const tokenId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const inviteRef = doc(db, 'invites', tokenId);
    
    // Expires in 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await setDoc(inviteRef, {
        teamId,
        teamName,
        createdBy: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        expiresAt: expiresAt.getTime()
    });

    return tokenId;
}

/**
 * Redeems an invite token and adds the user to the team.
 */
export async function redeemInviteToken(tokenId) {
    if (!auth.currentUser) return { success: false, error: 'Bitte zuerst anmelden.' };
    
    try {
        const inviteRef = doc(db, 'invites', tokenId);
        const inviteSnap = await getDoc(inviteRef);

        if (!inviteSnap.exists()) {
            return { success: false, error: 'Einladungs-Link ist ungültig oder abgelaufen.' };
        }

        const inviteData = inviteSnap.data();
        if (inviteData.expiresAt < Date.now()) {
            return { success: false, error: 'Dieser Link ist leider abgelaufen.' };
        }

        // Add to User Profile
        const userRef = getUserDoc(auth.currentUser.uid);
        const teamEntry = {
            teamId: inviteData.teamId,
            teamName: inviteData.teamName,
            role: 'member'
        };
        await updateDoc(userRef, {
            teams: arrayUnion(teamEntry)
        });

        // Add to Members Subcollection (NEW: for hardened rules)
        const memberRef = doc(db, 'teams', inviteData.teamId, 'members', auth.currentUser.uid);
        await setDoc(memberRef, {
            uid: auth.currentUser.uid,
            role: 'member',
            joinedAt: serverTimestamp()
        });

        // Update local profile if loaded
        if (currentUserProfile) {
            currentUserProfile.teams.push(teamEntry);
        }

        return { success: true, teamId: inviteData.teamId, teamName: inviteData.teamName };
    } catch (err) {
        console.error('[Firebase] Redeem invite error:', err);
        return { success: false, error: 'Beitritt fehlgeschlagen.' };
    }
}

/**
 * Remove a team from the user's profile.
 */
export async function leaveTeam(teamId) {
    if (!auth.currentUser || !currentUserProfile) return { success: false, error: 'Nicht angemeldet' };

    try {
        const userRef = getUserDoc(auth.currentUser.uid);
        
        // 1. Get current remote state to be absolutely safe (or use local if trusted)
        // We use the local profile but ensure we filter rigorously
        const initialCount = currentUserProfile.teams.length;
        
        // 2. Filter out all variations of this teamId
        const updatedTeams = currentUserProfile.teams.filter(t => 
            t.teamId !== teamId && 
            t.id !== teamId && 
            String(t.teamId) !== String(teamId)
        );

        if (updatedTeams.length === initialCount) {
            console.warn('[Firebase] Team not found in profile during leave attempt:', teamId);
            // We still proceed to update remote just in case local was slightly out of sync
        }

        // 3. Overwrite the entire array (Atomic update of the whole field)
        // This is MUCH more reliable than arrayRemove for complex/legacy objects
        await updateDoc(userRef, {
            teams: updatedTeams
        });

        // 4. Update local state
        currentUserProfile.teams = updatedTeams;

        return { success: true };
    } catch (err) {
        console.error('[Firebase] Leave Team error:', err);
        let errorMsg = 'Team konnte nicht verlassen werden.';
        if (err.code === 'permission-denied') errorMsg = 'Zugriff verweigert (Firebase Rules).';
        return { success: false, error: errorMsg };
    }
}

/**
 * Permanently delete a team (only for owners).
 */
export async function deleteTeam(teamId) {
    if (!auth.currentUser || !currentUserProfile) return { success: false, error: 'Nicht angemeldet' };

    try {
        const teamRef = doc(db, 'teams', teamId);
        const teamSnap = await getDoc(teamRef);
        
        if (!teamSnap.exists()) {
            return { success: false, error: 'Team existiert nicht.' };
        }
        
        if (teamSnap.data().ownerUid !== auth.currentUser.uid) {
            return { success: false, error: 'Nur der Ersteller kann das Team löschen.' };
        }
        
        // 1. Delete the team document
        await deleteDoc(teamRef);
        
        // 2. Remove from user profile (locally and remote)
        await leaveTeam(teamId);
        
        // Note: we might want to clean up invites and history here eventually via Cloud Functions,
        // but for now deleting the team doc makes it inaccessible.
        
        return { success: true };
    } catch (err) {
        console.error('[Firebase] Delete Team error:', err);
        return { success: false, error: 'Team konnte nicht gelöscht werden.' };
    }
}

// ─── Firestore – Spielstand ────────────────────────────────────────────────────
/**
 * Save spielstand to Firestore (debounced by 500ms to avoid thundering writes).
 * @param {Object} spielstand - The full game state object
 */
export function saveSpielstandToFirestore(spielstand) {
    if (!isOnline || isReceivingRemoteUpdate || !activeTeamId) return;

    clearTimeout(saveDebounceTimer);
    saveDebounceTimer = setTimeout(async () => {
        if (isReceivingRemoteUpdate) return;
        
        try {
            updateStatusIndicator('saving');
            const payload = buildFirestorePayload(spielstand);
            await setDoc(getGameDoc(activeTeamId, activeGameId), payload);
            updateStatusIndicator('online');
        } catch (err) {
            console.error('[Firebase] Save error:', err);
            updateStatusIndicator('error');
        }
    }, 500);
}

/**
 * Load spielstand from Firestore once (used on app start).
 * @returns {Promise<Object|null>} - The spielstand data or null
 */
export async function loadSpielstandFromFirestore() {
    if (!isOnline || !activeTeamId) return null;
    try {
        const snap = await getDoc(getGameDoc(activeTeamId, activeGameId));
        if (snap.exists()) {
            return snap.data();
        }
        return null;
    } catch (err) {
        console.error('[Firebase] Load error:', err);
        return null;
    }
}

/**
 * Start real-time listener. Calls callback(data) on every remote change.
 * @param {Function} callback - Called with the new spielstand data
 */
export function startSpielstandListener(callback) {
    if (!activeTeamId) return null;
    if (snapshotUnsubscribe) {
        snapshotUnsubscribe();
    }

    snapshotUnsubscribe = onSnapshot(getGameDoc(activeTeamId, activeGameId), (snap) => {
        if (snap.exists() && snap.metadata.hasPendingWrites === false) {
            isReceivingRemoteUpdate = true;
            callback(snap.data());
            setTimeout(() => { isReceivingRemoteUpdate = false; }, 100);
        }
    }, (err) => {
        console.error('[Firebase] Snapshot error:', err);
        updateStatusIndicator('error');
    });

    return snapshotUnsubscribe;
}

/**
 * Stop the real-time listener.
 */
export function stopSpielstandListener() {
    if (snapshotUnsubscribe) {
        snapshotUnsubscribe();
        snapshotUnsubscribe = null;
    }
}

// ─── Firestore – Saved Teams ───────────────────────────────────────────────────
/**
 * Save teams to Firestore (debounced by 1000ms).
 * @param {Object} teams - { home: [], opponent: [] }
 */
export function saveTeamsToFirestore(teams) {
    if (!isOnline || isReceivingRemoteUpdate || !activeTeamId) return;

    clearTimeout(teamsSaveDebounceTimer);
    teamsSaveDebounceTimer = setTimeout(async () => {
        try {
            await setDoc(getRosterDoc(activeTeamId), { teams, lastUpdated: Date.now() });
        } catch (err) {
            console.error('[Firebase] Teams save error:', err);
        }
    }, 1000);
}

/**
 * Load saved teams from Firestore once.
 * @returns {Promise<Object|null>}
 */
export async function loadTeamsFromFirestore() {
    if (!isOnline || !activeTeamId) return null;
    try {
        const snap = await getDoc(getRosterDoc(activeTeamId));
        if (snap.exists() && snap.data().teams) {
            return snap.data().teams;
        }
        return null;
    } catch (err) {
        console.error('[Firebase] Teams load error:', err);
        return null;
    }
}

/**
 * Start real-time listener for saved teams.
 * @param {Function} callback
 */
export function startTeamsListener(callback) {
    if (!activeTeamId) return null;
    return onSnapshot(getRosterDoc(activeTeamId), (snap) => {
        if (snap.exists() && snap.metadata.hasPendingWrites === false) {
            const data = snap.data();
            if (data && data.teams) {
                callback(data.teams);
            }
        }
    }, (err) => {
        console.error('[Firebase] Teams snapshot error:', err);
    });
}

// ─── Helper: Build Firestore Payload ──────────────────────────────────────────
/**
 * Build a clean, Firestore-safe payload from spielstand.
 * Strips non-serializable values and adds lastUpdated timestamp.
 */
function buildFirestorePayload(spielstand) {
    // Deep clone and strip undefined values (Firestore doesn't like them)
    const clean = JSON.parse(JSON.stringify(spielstand));

    return {
        score: clean.score || { heim: 0, gegner: 0 },
        gameLog: clean.gameLog || [],
        timer: clean.timer || {},
        roster: clean.roster || [],
        knownOpponents: clean.knownOpponents || [],
        settings: clean.settings || {},
        activeSuspensions: clean.activeSuspensions || [],
        calendarEvents: clean.calendarEvents || [],
        calendarSubscriptions: clean.calendarSubscriptions || [],
        uiState: clean.uiState || 'setup',
        gameMode: clean.gameMode || 'complex',
        modeSelected: clean.modeSelected || false,
        lastUpdated: Date.now()
    };
}

// ─── UI: Status Indicator ──────────────────────────────────────────────────────
/**
 * Update the Firebase connection status indicator in the sidebar.
 * @param {'online'|'offline'|'saving'|'error'} status
 */
export function updateStatusIndicator(status) {
    const dot = document.getElementById('firebaseStatusDot');
    const label = document.getElementById('firebaseStatusLabel');
    if (!dot || !label) return;

    const states = {
        online:  { color: '#22c55e', text: 'Live' },
        offline: { color: '#6b7280', text: 'Offline' },
        saving:  { color: '#f59e0b', text: 'Speichern…' },
        error:   { color: '#ef4444', text: 'Fehler' }
    };

    const s = states[status] || states.offline;
    dot.style.background = s.color;
    dot.style.boxShadow = status === 'online' ? `0 0 6px ${s.color}` : 'none';
    label.textContent = s.text;
}

// ─── Exports ───────────────────────────────────────────────────────────────────
export { auth, db };
