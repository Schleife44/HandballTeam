import { spielstand } from './state.js';
import { saveSpielstandToFirestore, saveSpielstandToFirestoreImmediate } from './firebase.js';

/**
 * Main entry point to render the Fines & Cashbox view.
 */
export function renderFinesView() {
    checkForMonthlyFees();
    syncCurrentMonthlyFees();
    updateSummary();
    renderFinesDashboard();
    renderFinesCatalog();
    renderFinesHistory();
    renderFinesSettings();
}

/**
 * Automatically issue fines if a new month has started.
 */
function checkForMonthlyFees() {
    if (!spielstand.finesSettings || !spielstand.finesSettings.enabled) return;

    const now = new Date();
    const currentMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');

    if (spielstand.finesSettings.lastProcessedMonth !== currentMonth) {
        console.log(`[Fines] Processing monthly fees for ${currentMonth}...`);
        
        spielstand.roster.forEach(player => {
            const status = spielstand.finesStatus?.[player.name] || 'standard';
            
            if (status === 'excluded') return;

            const amount = status === 'reduced' 
                ? spielstand.finesSettings.amountReduced 
                : spielstand.finesSettings.amountStandard;

            // Issue the fine
            const newEntry = {
                id: 'month_' + currentMonth + '_' + player.name.replace(/\s/g, '_'),
                playerId: player.name,
                fineId: 'monthly_fee',
                date: now.toISOString(),
                paid: false,
                amount,
                note: `Monatsbeitrag ${currentMonth}`
            };

            // Check if already exists (anti-duplication)
            if (!spielstand.finesHistory.some(h => h.id === newEntry.id)) {
                spielstand.finesHistory.push(newEntry);
            }
        });

        spielstand.finesSettings.lastProcessedMonth = currentMonth;
        saveSpielstandToFirestoreImmediate();
    }
}

/**
 * Update existing unpaid monthly fees for the current month if statuses or rates changed.
 */
function syncCurrentMonthlyFees() {
    if (!spielstand.finesSettings || !spielstand.finesSettings.enabled) return;

    const now = new Date();
    const currentMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');

    let changed = false;
    spielstand.finesHistory.forEach(entry => {
        // Only update unpaid monthly fees for the CURRENT month
        if (entry.fineId === 'monthly_fee' && entry.id.startsWith(`month_${currentMonth}`) && !entry.paid) {
            const status = spielstand.finesStatus?.[entry.playerId] || 'standard';
            
            let targetAmount = 0;
            if (status === 'standard') targetAmount = spielstand.finesSettings.amountStandard;
            else if (status === 'reduced') targetAmount = spielstand.finesSettings.amountReduced;
            
            if (entry.amount !== targetAmount) {
                console.log(`[Fines] Syncing ${entry.playerId} monthly fee: ${entry.amount}€ -> ${targetAmount}€`);
                entry.amount = targetAmount;
                changed = true;
            }
        }
    });

    if (changed) {
        import('./firebase.js').then(m => m.saveSpielstandToFirestore());
    }
}

/**
 * Render the Settings tab.
 */
function renderFinesSettings() {
    const listEl = document.getElementById('finesStatusList');
    if (!listEl) return;

    // Set input values
    const enableBtn = document.getElementById('finesEnableMonthlyBtn');
    const stdInput = document.getElementById('finesStandardAmountInput');
    const redInput = document.getElementById('finesReducedAmountInput');

    if (enableBtn) enableBtn.checked = spielstand.finesSettings.enabled;
    if (stdInput) stdInput.value = spielstand.finesSettings.amountStandard;
    if (redInput) redInput.value = spielstand.finesSettings.amountReduced;

    if (!spielstand.roster || spielstand.roster.length === 0) {
        listEl.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 20px;">Keine Spieler im Kader.</div>';
        return;
    }

    listEl.innerHTML = spielstand.roster.map(player => {
        const status = spielstand.finesStatus?.[player.name] || 'standard';
        return `
            <div class="fines-player-item" style="gap: 15px;">
                <span style="font-weight: 600; flex: 1;">${player.name}</span>
                <select class="hub-input" style="width: 130px; font-size: 0.8rem; height: 32px; padding: 0 8px;" 
                        onchange="window.setPlayerFineStatus('${player.name}', this.value)">
                    <option value="standard" ${status === 'standard' ? 'selected' : ''}>Standard</option>
                    <option value="reduced" ${status === 'reduced' ? 'selected' : ''}>Ermäßigt</option>
                    <option value="excluded" ${status === 'excluded' ? 'selected' : ''}>Befreit</option>
                </select>
            </div>
        `;
    }).join('');
}

export function setPlayerFineStatus(playerName, status) {
    if (!spielstand.finesStatus) spielstand.finesStatus = {};
    spielstand.finesStatus[playerName] = status;
    syncCurrentMonthlyFees();
    saveSpielstandToFirestore();
    renderFinesView();
}

export function updateFinesSettings(enabled, std, red) {
    spielstand.finesSettings.enabled = enabled;
    spielstand.finesSettings.amountStandard = parseFloat(std) || 0;
    spielstand.finesSettings.amountReduced = parseFloat(red) || 0;
    syncCurrentMonthlyFees();
    saveSpielstandToFirestore();
    renderFinesView();
}

/**
 * Update the top-level balance numbers.
 */
function updateSummary() {
    let paid = 0;
    let unpaid = 0;

    spielstand.finesHistory.forEach(event => {
        if (event.paid) {
            paid += event.amount;
        } else {
            unpaid += event.amount;
        }
    });

    const total = paid + unpaid;

    const balanceEl = document.getElementById('finesTotalBalance');
    const paidEl = document.getElementById('finesPaidTotal');
    const unpaidEl = document.getElementById('finesUnpaidTotal');

    if (balanceEl) balanceEl.textContent = formatCurrency(total);
    if (paidEl) paidEl.textContent = formatCurrency(paid);
    if (unpaidEl) unpaidEl.textContent = formatCurrency(unpaid);
}

/**
 * Render the Player Debt Ranking.
 */
function renderFinesDashboard() {
    const listEl = document.getElementById('finesPlayerList');
    if (!listEl) return;

    if (!spielstand.roster || spielstand.roster.length === 0) {
        listEl.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 40px;">Keine Spieler im Kader gefunden.</div>';
        return;
    }

    // Calculate per player
    const playerStats = spielstand.roster.map(player => {
        const events = spielstand.finesHistory.filter(h => h.playerId === player.name);
        const debt = events.reduce((sum, h) => sum + (h.paid ? 0 : h.amount), 0);
        return { name: player.name, debt: debt };
    });

    // Sort by debt desc
    playerStats.sort((a, b) => b.debt - a.debt);

    listEl.innerHTML = playerStats.map(ps => {
        const status = spielstand.finesStatus?.[ps.name] || 'standard';
        let statusLabel = '';
        if (status === 'reduced') statusLabel = ' <small style="color: #3b82f6; font-size: 0.65rem;">(Erm.)</small>';
        if (status === 'excluded') statusLabel = ' <small style="color: var(--text-muted); font-size: 0.65rem;">(Befreit)</small>';

        return `
            <div class="fines-player-item">
                <span style="font-weight: 600;">${ps.name}${statusLabel}</span>
                <span class="fines-amount-pill" style="${ps.debt > 0 ? 'background: rgba(239, 68, 68, 0.2); color: #ef4444;' : ''}">
                    ${formatCurrency(ps.debt)}
                </span>
            </div>
        `;
    }).join('');
}

/**
 * Render the Fine Templates Catalog.
 */
function renderFinesCatalog() {
    const bodyEl = document.getElementById('finesCatalogBody');
    if (!bodyEl) return;

    if (spielstand.finesCatalog.length === 0) {
        bodyEl.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--text-muted); padding: 20px;">Katalog ist leer.</td></tr>';
        return;
    }

    bodyEl.innerHTML = spielstand.finesCatalog.map(fine => `
        <tr>
            <td style="font-weight: 600;">${fine.name}</td>
            <td><span class="fines-amount-pill">${formatCurrency(fine.amount)}</span></td>
            <td style="text-align: right;">
                <button class="icon-btn-ghost" onclick="window.removeFineFromCatalog('${fine.id}')">
                    <i data-lucide="trash-2" style="width: 16px; color: #ef4444;"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    if (window.lucide) lucide.createIcons();
}

/**
 * Render all historical fine events.
 */
function renderFinesHistory() {
    const bodyEl = document.getElementById('finesHistoryBody');
    if (!bodyEl) return;

    if (spielstand.finesHistory.length === 0) {
        bodyEl.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 20px;">Keine Einträge vorhanden.</td></tr>';
        return;
    }

    // Sort by date desc
    const sorted = [...spielstand.finesHistory].sort((a, b) => new Date(b.date) - new Date(a.date));

    bodyEl.innerHTML = sorted.map(event => `
        <tr>
            <td style="font-size: 0.8rem; color: var(--text-muted);">${formatDate(event.date)}</td>
            <td style="font-weight: 700;">${event.playerId}</td>
            <td style="font-size: 0.9rem;">${event.fineId === 'monthly_fee' ? 'Monatsbeitrag' : (event.fineId === 'manual' ? event.note : getFineName(event.fineId))}</td>
            <td><span style="font-weight: 700;">${formatCurrency(event.amount)}</span></td>
            <td>
                <span class="status-badge ${event.paid ? 'paid' : 'unpaid'}" style="cursor: pointer;" onclick="window.toggleFinePayment('${event.id}')">
                    <i data-lucide="${event.paid ? 'check-circle' : 'circle'}"></i>
                    ${event.paid ? 'Bezahlt' : 'Offen'}
                </span>
            </td>
            <td style="text-align: right;">
                <button class="icon-btn-ghost" onclick="window.removeFineHistoryEntry('${event.id}')">
                    <i data-lucide="trash-2" style="width: 16px; color: #ef4444;"></i>
                </button>
            </td>
        </tr>
    `).join('');

    if (window.lucide) lucide.createIcons();
}

// --- LOGIC FUNCTIONS ---

export function addFineToCatalog(name, amount) {
    const newFine = {
        id: 'fine_' + Date.now(),
        name,
        amount: parseFloat(amount)
    };
    spielstand.finesCatalog.push(newFine);
    saveSpielstandToFirestore();
    renderFinesCatalog();
}

export function issueFine(playerId, fineId, customAmount = null) {
    const fine = spielstand.finesCatalog.find(f => f.id === fineId);
    const amount = customAmount !== null && customAmount !== '' ? parseFloat(customAmount) : (fine ? fine.amount : 0);
    
    const newEntry = {
        id: 'ev_' + Date.now(),
        playerId,
        fineId,
        date: new Date().toISOString(),
        paid: false,
        amount,
        note: fine ? '' : 'Manuelle Buchung'
    };
    
    spielstand.finesHistory.push(newEntry);
    saveSpielstandToFirestore();
    renderFinesView();
}

export function togglePayment(eventId) {
    const entry = spielstand.finesHistory.find(e => e.id === eventId);
    if (entry) {
        entry.paid = !entry.paid;
        saveSpielstandToFirestore();
        renderFinesView();
    }
}

export function removeFineHistory(eventId) {
    spielstand.finesHistory = spielstand.finesHistory.filter(e => e.id !== eventId);
    saveSpielstandToFirestore();
    renderFinesView();
}

export function removeFineCatalog(fineId) {
    spielstand.finesCatalog = spielstand.finesCatalog.filter(f => f.id !== fineId);
    saveSpielstandToFirestore();
    renderFinesCatalog();
}

// --- HELPERS ---

function formatCurrency(val) {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(val);
}

function formatDate(isoString) {
    const d = new Date(isoString);
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' }) + ' ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

function getFineName(id) {
    const fine = spielstand.finesCatalog.find(f => f.id === id);
    return fine ? fine.name : 'Gelöschte Strafe';
}

// Expose to window
window.toggleFinePayment = togglePayment;
window.removeFineHistoryEntry = removeFineHistory;
window.removeFineFromCatalog = removeFineCatalog;
window.setPlayerFineStatus = setPlayerFineStatus;
