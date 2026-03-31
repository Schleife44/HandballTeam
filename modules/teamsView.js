import { createTeam, setActiveTeam } from './firebase.js';

/**
 * Show the team selection / creation overlay.
 * @param {Object} profile - The user profile { uid, email, teams: [] }
 * @param {Function} onFinish - Called with the selected teamId
 */
export function showTeamSelectionOverlay(profile, onFinish) {
    // 1. Create Overlay
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
        borderRadius: '0.75rem', color: 'white',textAlign: 'center'
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
    let listHtml = profile.teams.map(t => `
        <div class="team-item" data-id="${t.teamId}" style="
            padding: 1rem; border: 1px solid #334155; border-radius: 0.5rem; margin-bottom: 0.75rem;
            cursor: pointer; display: flex; justify-content: space-between; align-items: center;
            transition: background 0.2s;
        ">
            <div>
                <div style="font-weight: 600;">${t.teamName || t.name || 'Unbekanntes Team'}</div>
                <div style="font-size: 0.75rem; color: #94a3b8; text-transform: capitalize;">${t.role}</div>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #64748b;"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </div>
    `).join('');

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

    // Click on team
    container.querySelectorAll('.team-item').forEach(item => {
        item.onmouseover = () => item.style.background = 'rgba(255,255,255,0.05)';
        item.onmouseout = () => item.style.background = 'transparent';
        item.onclick = (e) => {
            const id = item.dataset.id;
            setActiveTeam(id);
            overlay.remove();
            onFinish(id);
        };
    });

    // Show create form
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
