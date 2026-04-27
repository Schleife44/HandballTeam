import { createTeam, setActiveTeam, getAuthUid, getCurrentUserProfile, updateUserRosterName } from './firebase.js';
import { spielstand, speichereSpielstand } from './state.js';
import { sanitizeHTML, escapeHTML } from './securityUtils.js';

/**
 * Show the team selection / creation overlay.
 */
export function showTeamSelectionOverlay(profile, onFinish) {
    if (document.getElementById('teamSelectionOverlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'teamSelectionOverlay';
    Object.assign(overlay.style, {
        position: 'fixed', inset: '0', zIndex: '100000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'hsl(222.2 84% 2%)', backdropFilter: 'blur(12px)'
    });

    const card = document.createElement('div');
    card.className = 'shadcn-modal-content';
    Object.assign(card.style, {
        width: '100%', maxWidth: '450px', padding: '2rem',
        background: 'hsl(222.2, 84%, 4.9%)', border: '1px solid hsl(217.2, 32.6%, 17.5%)',
        borderRadius: '0.75rem', color: 'white', textAlign: 'center'
    });

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    const renderContent = () => {
        card.innerHTML = '';
        if (!profile.teams || profile.teams.length === 0) {
            renderCreateInitial(card, profile, onFinish, overlay);
        } else {
            renderSelectionList(card, profile, onFinish, overlay, renderContent);
        }
    };

    renderContent();
}

/**
 * View for users with NO teams yet.
 */
function renderCreateInitial(container, profile, onFinish, overlay) {
    container.innerHTML = `
        <h2 style="font-size: 1.5rem; font-weight: 600; margin-bottom: 0.5rem;">Willkommen!</h2>
        <p style="color: #94a3b8; font-size: 0.9rem; margin-bottom: 2rem;">Du bist noch in keinem Team. Erstelle dein erstes Team, um zu starten.</p>
        
        <div style="display: flex; flex-direction: column; gap: 1rem; text-align: left;">
            <label style="font-size: 0.875rem; font-weight: 500;">Teamname</label>
            <input id="newTeamNameInput" type="text" placeholder="z.B. HC Musterstadt 1. Herren" 
                style="height: 2.5rem; background: transparent; border: 1px solid #334155; border-radius: 0.375rem; padding: 0 0.75rem; color: white; outline: none;">
            
            <p id="teamCreateError" style="color: #ef4444; font-size: 0.8rem; min-height: 1.2rem; margin: 0;"></p>
            
            <button id="createTeamBtn" class="shadcn-btn-primary" style="width: 100%; height: 2.5rem; margin-top: 1rem;">
                Team erstellen
            </button>
        </div>
    `;

    const btn = container.querySelector('#createTeamBtn');
    const input = container.querySelector('#newTeamNameInput');
    const error = container.querySelector('#teamCreateError');

    btn.onclick = async () => {
        const name = input.value.trim();
        if (!name) { error.textContent = 'Bitte einen Namen eingeben.'; return; }

        btn.disabled = true;
        btn.textContent = 'Erstelle...';

        const res = await createTeam(name);
        if (res.success) {
            setActiveTeam(res.teamId);
            overlay.remove();
            onFinish(res.teamId);
        } else {
            error.textContent = res.error;
            btn.disabled = false;
            btn.textContent = 'Team erstellen';
        }
    };
}

/**
 * View for users to select from their teams.
 */
function renderSelectionList(container, profile, onFinish, overlay, renderContent) {
    let listHtml = profile.teams.map(t => sanitizeHTML(`
        <div class="team-item" data-id="${escapeHTML(t.teamId)}" style="
            padding: 1rem; border: 1px solid #334155; border-radius: 0.5rem; margin-bottom: 0.75rem;
            cursor: pointer; display: flex; justify-content: space-between; align-items: center;
            transition: background 0.2s;
        ">
            <div>
                <div style="font-weight: 600;">${escapeHTML(t.teamName || t.name || 'Unbekanntes Team')}</div>
                <div style="font-size: 0.75rem; color: #94a3b8; text-transform: capitalize;">${escapeHTML(t.role)}</div>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #64748b;"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </div>
    `)).join('');

    container.innerHTML = `
        <h2 style="font-size: 1.5rem; font-weight: 600; margin-bottom: 0.5rem;">Deine Teams</h2>
        <p style="color: #94a3b8; font-size: 0.9rem; margin-bottom: 2rem;">Wähle ein Team aus, um das Dashboard zu öffnen.</p>
        
        <div style="max-height: 300px; overflow-y: auto; text-align: left;">
            ${listHtml}
        </div>
        
        <div style="margin-top: 1.5rem; border-top: 1px solid #334155; padding-top: 1.5rem;">
            <button id="showCreateBtn" style="background: transparent; border: none; color: #3b82f6; cursor: pointer; font-size: 0.9rem;">
                + Weiteres Team erstellen
            </button>
        </div>
    `;

    // Click on team - fix: disable all items immediately to prevent double-click
    container.querySelectorAll('.team-item').forEach(item => {
        item.onmouseover = () => item.style.background = 'rgba(255,255,255,0.05)';
        item.onmouseout = () => item.style.background = 'transparent';
        item.onclick = () => {
            // Prevent multiple clicks
            container.querySelectorAll('.team-item').forEach(i => {
                i.style.pointerEvents = 'none';
                i.style.opacity = '0.5';
            });
            item.style.opacity = '1';
            item.innerHTML += '<span style="margin-left:8px;font-size:0.8rem;color:#94a3b8;">Lädt...</span>';

            const id = item.dataset.id;
            setActiveTeam(id);
            overlay.remove();
            onFinish(id);
        };
    });

    container.querySelector('#showCreateBtn').onclick = () => {
        renderCreateView(container, profile, onFinish, overlay, renderContent);
    };
}

function renderCreateView(container, profile, onFinish, overlay, onBack) {
    container.innerHTML = `
        <h2 style="font-size: 1.5rem; font-weight: 600; margin-bottom: 2rem;">Neues Team gründen</h2>
        
        <div style="display: flex; flex-direction: column; gap: 1rem; text-align: left;">
            <label style="font-size: 0.875rem; font-weight: 500;">Teamname</label>
            <input id="newTeamNameInput" type="text" placeholder="z.B. HC Musterstadt 1. Herren" 
                style="height: 2.5rem; background: transparent; border: 1px solid #334155; border-radius: 0.375rem; padding: 0 0.75rem; color: white; outline: none;">
            
            <p id="teamCreateError" style="color: #ef4444; font-size: 0.8rem; min-height: 1.2rem; margin: 0;"></p>
            
            <div style="display: flex; gap: 10px; margin-top: 1rem;">
                <button id="cancelCreateBtn" class="shadcn-btn-secondary" style="flex: 1; height: 2.5rem;">Abbrechen</button>
                <button id="createTeamBtn" class="shadcn-btn-primary" style="flex: 2; height: 2.5rem;">Erstellen</button>
            </div>
        </div>
    `;

    const btn = container.querySelector('#createTeamBtn');
    const input = container.querySelector('#newTeamNameInput');
    const error = container.querySelector('#teamCreateError');
    const cancel = container.querySelector('#cancelCreateBtn');

    cancel.onclick = onBack;

    btn.onclick = async () => {
        const name = input.value.trim();
        if (!name) { error.textContent = 'Bitte einen Namen eingeben.'; return; }

        btn.disabled = true;
        btn.textContent = 'Erstelle...';

        const res = await createTeam(name);
        if (res.success) {
            setActiveTeam(res.teamId);
            overlay.remove();
            onFinish(res.teamId);
        } else {
            error.textContent = res.error;
            btn.disabled = false;
            btn.textContent = 'Erstellen';
        }
    };
}

/**
 * Show the player name assignment dialog after joining a team.
 * Only shown if the current user has no rosterAssignment yet.
 * @param {Function} onComplete - Called when user selects/creates their name
 */
export function showPlayerNameSelection(onComplete) {
    const uid = getAuthUid();
    if (!uid) { onComplete(); return; }

    // Prevent duplicate overlays
    if (document.getElementById('playerNameOverlay')) {
        return;
    }

    // 1. Check if we already have a rosterAssignment FOR THIS TEAM
    if (spielstand.rosterAssignments && spielstand.rosterAssignments[uid]) {
        onComplete();
        return;
    }

    // 2. NEW: Check if global profile HAS A NAME or EMAIL we can reuse
    const profile = getCurrentUserProfile();
    let nameExistsInRoster = false;
    let matchedByEmail = null;

    // Check if the trainer mapped an email directly to a player
    if (profile && profile.email) {
        const pEmailStr = profile.email.trim().toLowerCase();
        matchedByEmail = (spielstand.roster || []).find(
            p => p.email && p.email.trim().toLowerCase() === pEmailStr
        );
    }

    if (matchedByEmail) {
        console.log('[App] Auto-assigning via mapped email:', matchedByEmail.name);
        if (!spielstand.rosterAssignments) spielstand.rosterAssignments = {};
        spielstand.rosterAssignments[uid] = matchedByEmail.name;
        speichereSpielstand();
        onComplete();
        return;
    }

    if (profile && profile.rosterName) {
        const pNameLowerCase = profile.rosterName.trim().toLowerCase();
        nameExistsInRoster = (spielstand.roster || []).some(
            p => (p.name || '').trim().toLowerCase() === pNameLowerCase
        );
    }

    if (profile && profile.rosterName && nameExistsInRoster) {
        console.log('[App] Auto-assigning name from profile:', profile.rosterName);
        if (!spielstand.rosterAssignments) spielstand.rosterAssignments = {};
        spielstand.rosterAssignments[uid] = profile.rosterName;
        speichereSpielstand();
        onComplete();
        return;
    }


    // Get taken names
    const takenNames = Object.values(spielstand.rosterAssignments || {});
    const availablePlayers = (spielstand.roster || []).filter(p => !takenNames.includes(p.name));

    const overlay = document.createElement('div');
    overlay.id = 'playerNameOverlay';
    Object.assign(overlay.style, {
        position: 'fixed', inset: '0', zIndex: '100001',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)'
    });

    const card = document.createElement('div');
    Object.assign(card.style, {
        width: '100%', maxWidth: '420px', padding: '2rem',
        background: 'hsl(222.2, 84%, 4.9%)',
        border: '1px solid hsl(217.2, 32.6%, 17.5%)',
        borderRadius: '0.75rem', color: 'white'
    });

    const rosterHtml = availablePlayers.length > 0
        ? availablePlayers.map(p => sanitizeHTML(`
            <button class="player-name-opt" data-name="${escapeHTML(p.name)}" style="
                width: 100%; text-align: left; padding: 0.75rem 1rem;
                border: 1px solid #334155; border-radius: 0.5rem;
                background: transparent; color: white; cursor: pointer;
                margin-bottom: 0.5rem; transition: background 0.15s; font-size: 0.9rem;
            ">
                <span style="font-weight:600;">${escapeHTML(p.name)}</span>
                <span style="color:#94a3b8; margin-left:6px;">${p.number ? `#${escapeHTML(p.number)}` : ''}</span>
            </button>
        `)).join('')
        : sanitizeHTML('<p style="color:#94a3b8; font-size:0.85rem; margin-bottom:1rem;">Kein Kader hinterlegt – bitte gib einfach deinen Namen ein.</p>');

    card.innerHTML = `
        <h2 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 0.4rem;">Wer bist du?</h2>
        <p style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 1.5rem;">
            Wähle deinen Namen aus dem Kader oder erstelle einen neuen.
        </p>

        <div style="max-height: 250px; overflow-y: auto; margin-bottom: 1rem;">
            ${rosterHtml}
        </div>

        <div style="border-top: 1px solid #334155; padding-top: 1rem; margin-top: 0.5rem;">
            <label style="font-size: 0.8rem; color: #94a3b8; display: block; margin-bottom: 0.5rem;">
                Namen nicht dabei? Eigenen Namen eingeben:
            </label>
            <div style="display: flex; gap: 8px;">
                <input id="customPlayerName" type="text" placeholder="Dein Name..."
                    style="flex: 1; height: 2.25rem; background: transparent; border: 1px solid #334155;
                    border-radius: 0.375rem; padding: 0 0.75rem; color: white; outline: none; font-size: 0.875rem;">
                <button id="saveCustomName" class="shadcn-btn-primary" style="height: 2.25rem; padding: 0 1rem; white-space: nowrap;">
                    Speichern
                </button>
            </div>
            <p id="nameError" style="color:#ef4444; font-size:0.75rem; margin-top:4px; min-height:1rem;"></p>
        </div>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    // Hover effects
    card.querySelectorAll('.player-name-opt').forEach(btn => {
        btn.onmouseover = () => btn.style.background = 'rgba(255,255,255,0.06)';
        btn.onmouseout = () => btn.style.background = 'transparent';
        btn.onclick = () => assignPlayerName(btn.dataset.name, overlay, onComplete);
    });

    // Custom name save
    card.querySelector('#saveCustomName').onclick = () => {
        const nameInput = card.querySelector('#customPlayerName');
        const err = card.querySelector('#nameError');
        const name = nameInput.value.trim();
        if (!name) { err.textContent = 'Bitte einen Namen eingeben.'; return; }
        assignPlayerName(name, overlay, onComplete);
    };
}

function assignPlayerName(name, overlay, onComplete) {
    const uid = getAuthUid();
    if (!uid) { overlay.remove(); onComplete(); return; }

    // Save to local team state
    if (!spielstand.rosterAssignments) spielstand.rosterAssignments = {};
    spielstand.rosterAssignments[uid] = name;

    // NEW: Auto-Add to Roster if not exists
    if (!spielstand.roster) spielstand.roster = [];
    const exists = spielstand.roster.some(p => (p.name || '').toLowerCase() === name.toLowerCase());
    if (!exists) {
        console.log('[Roster] Auto-adding new player:', name);
        spielstand.roster.push({
            name: name,
            number: '', // No number assigned yet
            isGoalkeeper: false
        });
        // Sort roster by number if possible
        spielstand.roster.sort((a, b) => {
            if (!a.number && !b.number) return 0;
            if (!a.number) return 1;
            if (!b.number) return -1;
            return a.number - b.number;
        });
    }

    speichereSpielstand();

    // Save to global profile (permanent persistence)
    updateUserRosterName(name);

    overlay.remove();
    onComplete();
}

/**
 * Shows a full-screen overlay when access to a team is denied.
 * Allows the user to remove the team from their profile.
 */
export function showAccessDeniedOverlay(teamId) {
    if (document.getElementById('accessDeniedOverlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'accessDeniedOverlay';
    Object.assign(overlay.style, {
        position: 'fixed', inset: '0', zIndex: '100002',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(15px)'
    });

    const card = document.createElement('div');
    card.className = 'shadcn-modal-content';
    Object.assign(card.style, {
        width: '100%', maxWidth: '400px', padding: '2.5rem',
        background: 'hsl(222.2, 84%, 4.9%)', border: '1px solid #ef4444',
        borderRadius: '1rem', color: 'white', textAlign: 'center'
    });

    card.innerHTML = `
        <div style="margin-bottom: 1.5rem; color: #ef4444;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        </div>
        <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.75rem;">Zugriff verweigert</h2>
        <p style="color: #94a3b8; font-size: 0.95rem; margin-bottom: 2rem; line-height: 1.5;">
            Du hast keine Berechtigung mehr für dieses Team. Möglicherweise wurdest du entfernt oder das Team wurde gelöscht.
        </p>
        
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            <button id="removeGhostTeamBtn" class="shadcn-btn-destructive" style="width: 100%; height: 2.75rem; font-weight: 600;">
                Team aus meinem Profil löschen
            </button>
            <button id="backToSelectionBtn" class="shadcn-btn-outline" style="width: 100%; height: 2.75rem;">
                Zurück zur Team-Auswahl
            </button>
        </div>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    const { leaveTeam } = import('./firebase.js'); // Deferred import to avoid circular dep issues if any

    card.querySelector('#removeGhostTeamBtn').onclick = async () => {
        const btn = card.querySelector('#removeGhostTeamBtn');
        btn.disabled = true;
        btn.textContent = 'Wird entfernt...';
        
        const { leaveTeam: leaveFn } = await import('./firebase.js');
        await leaveFn(teamId);
        
        overlay.remove();
        window.location.reload(); // Hard reload to clear all states
    };

    card.querySelector('#backToSelectionBtn').onclick = () => {
        overlay.remove();
        window.location.reload(); // Safest way to reset app state
    };
}
