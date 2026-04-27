import { spielstand, getMyTeamLabel } from './state.js';
import { getSeasonSummary } from './seasonStats.js';
import { sanitizeHTML, escapeHTML } from './securityUtils.js';
import { navigateTo } from './router.js';
import { 
    playerProfileBereich, profilePlayerName, 
    backFromProfileBtn 
} from './dom.js';

/**
 * Initializes listeners for the player profile page.
 */
export function initPlayerProfile() {
    if (backFromProfileBtn) {
        backFromProfileBtn.addEventListener('click', () => {
            navigateTo('roster');
        });
    }
}

/**
 * Renders the full player profile page based on the selected player in state.
 */
export async function renderPlayerProfilePage() {
    const { index, isOpponent } = spielstand.activeProfilePlayer;
    if (index === null) {
        navigateTo('roster');
        return;
    }

    const list = isOpponent ? spielstand.knownOpponents : spielstand.roster;
    const player = list[index];
    if (!player) {
        navigateTo('roster');
        return;
    }

    // Set Header
    if (profilePlayerName) {
        profilePlayerName.textContent = player.name ? `#${player.number} - ${player.name}` : `#${player.number}`;
    }

    const content = document.getElementById('playerProfileContent');
    if (!content) return;

    content.innerHTML = '<div style="text-align:center; padding:50px;"><div class="loading-spinner"></div><p>Berechne Statistiken...</p></div>';

    // Fetch Season Stats & Attendance
    const summary = await getSeasonSummary();
    const attendance = calculateAttendance(player.name);
    
    // Find player in aggregated stats
    const stats = summary.players.find(p => 
        String(p.number) === String(player.number) && 
        (isOpponent ? p.team !== 'Heim' : p.team === 'Heim')
    );

    renderProfileUI(content, player, stats, attendance);
}

/**
 * Calculates training attendance percentage for a player.
 */
function calculateAttendance(playerName) {
    if (!playerName || !spielstand.calendarEvents) return { percent: 0, attended: 0, total: 0 };

    const now = new Date();
    const trainings = spielstand.calendarEvents.filter(e => {
        if (e.type !== 'training') return false;
        // Only include past trainings
        const eventDate = new Date(e.date + (e.time ? `T${e.time}` : ''));
        return eventDate <= now;
    });
    
    if (trainings.length === 0) return { percent: 0, attended: 0, total: 0 };

    let attended = 0;
    const manualKey = `manual_${playerName.replace(/\s+/g, '_')}`;

    trainings.forEach(event => {
        if (!event.responses) return;

        // Check for manual response or UID response
        const response = Object.values(event.responses).find(r => 
            r.name === playerName || 
            (spielstand.rosterAssignments && Object.keys(spielstand.rosterAssignments).find(uid => 
                spielstand.rosterAssignments[uid] === playerName && event.responses[uid]
            ))
        );

        if (response && response.status === 'going') {
            attended++;
        }
    });

    return {
        percent: Math.round((attended / trainings.length) * 100),
        attended: attended,
        total: trainings.length
    };
}

/**
 * Builds the HTML for the profile dashboard.
 */
function renderProfileUI(container, player, stats, attendance) {
    const goals = stats?.tore || 0;
    const misses = stats?.fehlwurf || 0;
    const accuracy = stats?.wurfQuote || '0%';
    const games = stats?.totalGames || 0;

    const heatmapIcon = '<i data-lucide="map" style="width:16px; height:16px;"></i>';
    const chartIcon = '<i data-lucide="bar-chart-3" style="width:16px; height:16px;"></i>';
    const calendarIcon = '<i data-lucide="calendar" style="width:16px; height:16px;"></i>';

    container.innerHTML = sanitizeHTML(`
        <!-- KPI Row -->
        <div class="profile-kpi-grid">
            <div class="profile-card kpi-card">
                <div class="kpi-value" style="color: var(--btn-primary);">${attendance.percent}%</div>
                <div class="kpi-label">Training</div>
                <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 4px;">${attendance.attended} von ${attendance.total}</div>
            </div>
            <div class="profile-card kpi-card">
                <div class="kpi-value">${goals}</div>
                <div class="kpi-label">Tore</div>
            </div>
            <div class="profile-card kpi-card">
                <div class="kpi-value">${accuracy}</div>
                <div class="kpi-label">Wurfquote</div>
            </div>
            <div class="profile-card kpi-card">
                <div class="kpi-value">${games}</div>
                <div class="kpi-label">Spiele</div>
            </div>
        </div>

        <div class="profile-grid">
            <!-- Left Column: Details & Roles -->
            <div style="display: flex; flex-direction: column; gap: 20px;">
                <div class="profile-card">
                    <h3 class="profile-section-title"><i data-lucide="user" style="width:18px; height:18px;"></i> Information</h3>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: var(--text-muted);">Position</span>
                            <span>${player.isGoalkeeper ? 'Torwart' : 'Feldspieler'}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: var(--text-muted);">Rückennummer</span>
                            <span>#${player.number || '-'}</span>
                        </div>
                         <div style="display: flex; justify-content: space-between;">
                            <span style="color: var(--text-muted);">Status</span>
                            <span style="color: ${player.isInactive ? 'var(--btn-danger)' : '#22c55e'}">${player.isInactive ? 'Inaktiv' : 'Aktiv'}</span>
                        </div>
                    </div>
                    
                    ${!spielstand.activeProfilePlayer.isOpponent && player.roles ? `
                        <div style="margin-top: 20px; border-top: 1px solid var(--border-color); padding-top: 15px;">
                            <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 8px;">Rollen</div>
                            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                                ${player.roles.map(r => `<span class="role-badge ${r === 'Trainer' ? 'role-badge--trainer' : ''}">${escapeHTML(r)}</span>`).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>

                <div class="profile-card">
                    <h3 class="profile-section-title">${calendarIcon} Trainingsbeteiligung</h3>
                    <div class="attendance-progress-bg">
                        <div class="attendance-progress-fill" style="width: ${attendance.percent}%"></div>
                    </div>
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0;">
                        ${player.name} hat an ${attendance.attended} der letzten ${attendance.total} Trainingseinheiten teilgenommen.
                    </p>
                </div>
            </div>

            <!-- Right Column: Extended Stats -->
            <div style="display: flex; flex-direction: column; gap: 20px;">
                <div class="profile-card">
                    <h3 class="profile-section-title">${chartIcon} Saison Statistiken</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                         <div style="background: var(--secondary); padding: 12px; border-radius: 8px; text-align: center;">
                            <div style="font-size: 1.2rem; font-weight: 700;">${stats?.assist || 0}</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted);">Assists</div>
                        </div>
                        <div style="background: var(--secondary); padding: 12px; border-radius: 8px; text-align: center;">
                            <div style="font-size: 1.2rem; font-weight: 700;">${stats?.guteAktion || 0}</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted);">Gute Aktionen</div>
                        </div>
                        <div style="background: var(--secondary); padding: 12px; border-radius: 8px; text-align: center;">
                            <div style="font-size: 1.2rem; font-weight: 700;">${stats?.techFehler || 0}</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted);">Tech. Fehler</div>
                        </div>
                        <div style="background: var(--secondary); padding: 12px; border-radius: 8px; text-align: center;">
                            <div style="font-size: 1.2rem; font-weight: 700;">${stats?.zweiMinuten || 0}</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted);">2-Minuten</div>
                        </div>
                    </div>
                </div>
                
                <div class="profile-card" style="padding: 0; overflow: hidden;">
                     <button class="shadcn-btn-primary" style="width: 100%; height: 50px; border-radius: 0; margin: 0;" id="openSeasonHeatmapBtn">
                        ${heatmapIcon} Saison-Heatmap öffnen
                     </button>
                </div>
            </div>
        </div>
    `);

    if (window.lucide) window.lucide.createIcons({ root: container });

    // Link to existing heatmap function if available
    const heatmapBtn = container.querySelector('#openSeasonHeatmapBtn');
    if (heatmapBtn) {
        heatmapBtn.addEventListener('click', () => {
            navigateTo('season'); // Or specialize if there's a direct way
        });
    }
}
