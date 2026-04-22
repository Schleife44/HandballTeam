import { 
    speichereSpielstand, 
    spielstand, 
    getOpponentLabel, 
    getMyTeamLabel 
} from './state.js';
import { 
    getAuthUid, 
    isUserTrainer, 
    getCurrentUserProfile,
    getActiveTeamId
} from './firebase.js';
import {
    // Personal Absence Modal
    addAbsenceBtn, absenceModal, closeAbsenceBtn, absenceReasonInput, 
    absenceStartDate, absenceEndDate, saveAbsenceBtn, absenceList,
    absenceTypeRange, absenceTypeWeekly, absenceRangeSettings, 
    absenceWeeklySettings, absenceWeekdaySelect,
    // Calendar UI
    calendarGrid, currentMonthLabel, addEventOverlay, addEventModal, addEventModalTitle,
    eventTitleInput, eventDateInput, eventTimeInput, eventLocationInput,
    eventRepeatInput, eventRepeatEndInput, recurrenceOptions,
    eventDetailsOverlay, eventDetailsModal, detailsTitle, detailsDate, detailsTime, detailsLocation, detailsLocationRow,
    closeDetailsModal, closeDetailsBtn, deleteEventBtn, editEventBtn,
    attendanceReasonInput, attendanceReasonContainer, attendanceStats,
    attendanceFullList, modalDetailsBtn, saveAttendanceReasonBtn,
    // Rules
    eventRequireReasonInput, eventDeadlineInput, eventDefaultStatusInput,
    // Manage UI
    manageCalendarBtn, manageCalendarModal, closeManageBtn, manageUrlInput, addSubBtn, subsList, seriesList, addEventBtn,
    subSettingsOverlay, subSettingsModal
} from './dom.js';
import { customAlert, customConfirm, customPrompt } from './customDialog.js';

import { openDatePicker, closeDatePicker } from './datepicker.js';
import { openTimePicker, closeTimePicker } from './timepicker.js';
import { toast } from './toast.js';
import { parseICS } from './ics.js';
import { fetchWithProxy } from './utils.js';

let currentDate = new Date(); // Start with today
let currentEventId = null; // Store ID for delete/details action
let attendanceListenersBound = false;
let calendarInitialized = false;
let editingEventId = null; // Store ID for edit action

export function initCalendar() {
    if (calendarInitialized) return;
    calendarInitialized = true;

    if (!spielstand.absences) spielstand.absences = [];
    
    renderCalendar();

    // === ROBUST MODAL LOGIC (Overlay-based) ===
    
    // 1. Add/Edit Event
    if (addEventOverlay && addEventModal) {
        addEventOverlay.addEventListener('click', (e) => {
            if (e.target === addEventOverlay) closeAddEventModal();
        });
        addEventModal.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    // 2. Event Details
    if (eventDetailsOverlay && eventDetailsModal) {
        eventDetailsOverlay.addEventListener('click', (e) => {
            if (e.target === eventDetailsOverlay) closeEventDetails();
        });
        eventDetailsModal.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    // 3. Manage Calendar
    if (manageCalendarOverlay && manageCalendarModal) {
        manageCalendarOverlay.addEventListener('click', (e) => {
            if (e.target === manageCalendarOverlay) closeManageModal();
        });
        manageCalendarModal.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    // 4. Subscription Settings
    if (subSettingsOverlay && subSettingsModal) {
        subSettingsOverlay.addEventListener('click', (e) => {
            if (e.target === subSettingsOverlay) closeSubSettingsModal();
        });
        subSettingsModal.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    // Stable Modal Details Toggle (Only bind once)
    if (modalDetailsBtn) {
        modalDetailsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (attendanceFullList) {
                attendanceFullList.classList.toggle('versteckt');
                const label = document.getElementById('modalDetailsBtnLabel');
                if (label) {
                    label.textContent = attendanceFullList.classList.contains('versteckt') ? 'Details' : 'Schließen';
                }
            }
        });
    }

    // Absence Modal Listeners
    setupAbsenceListeners();

    // Custom DatePicker for Date Input
    if (eventDateInput) {
        eventDateInput.addEventListener('click', (e) => {
            e.preventDefault();
            openDatePicker(eventDateInput, (dateStr) => {
                updateModalTitle(dateStr);
            });
        });
        // Also update the header title when the date changes manually
        eventDateInput.addEventListener('change', function () {
            updateModalTitle(this.value);
        });
    }

    // Custom DatePicker for Recurrence End Date
    if (eventRepeatEndInput) {
        eventRepeatEndInput.addEventListener('click', (e) => {
            e.preventDefault();
            openDatePicker(eventRepeatEndInput);
        });
    }

    // Custom TimePicker
    if (eventTimeInput) {
        eventTimeInput.addEventListener('click', function (e) {
            e.preventDefault();
            openTimePicker(eventTimeInput);
        });
    }

    // Recurrence Toggle Listener
    if (eventRepeatInput) {
        eventRepeatInput.addEventListener('change', (e) => {
            if (e.target.checked) {
                recurrenceOptions.classList.remove('versteckt');
            } else {
                recurrenceOptions.classList.add('versteckt');
            }
        });
    }

    /* --- MANAGE CALENDAR (Subscriptions & Series) --- */

    if (manageCalendarBtn) {
        manageCalendarBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (manageCalendarModal) {
                // TOGGLE: If already open, close it
                if (!manageCalendarModal.classList.contains('versteckt')) {
                    closeManageModal();
                    return;
                }

                // Exclusive access: Close other modals
                closeAddEventModal();
                closeEventDetails();

                if (manageCalendarOverlay) manageCalendarOverlay.classList.remove('versteckt');
                if (manageCalendarModal) manageCalendarModal.classList.remove('versteckt');
                
                renderManageView();
            }
        });
    }

    if (closeManageBtn) {
        closeManageBtn.addEventListener('click', closeManageModal);
    }

    if (addSubBtn) {
        addSubBtn.addEventListener('click', () => {
            const url = manageUrlInput.value.trim();
            if (url) {
                const subRules = {
                    requireReason: document.getElementById('subRequireReason')?.checked || false,
                    deadlineHours: parseInt(document.getElementById('subDeadlineHours')?.value) || 0,
                    defaultStatus: document.getElementById('subDefaultStatus')?.checked ? 'going' : 'none'
                };
                addSubscription(url, subRules);
                manageUrlInput.value = '';
            }
        });
    }

    // Details Modal Listeners
    if (addEventModal && typeof addEventBtn !== 'undefined' && addEventBtn) {
        addEventBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = !addEventModal || addEventModal.classList.contains('versteckt');
            if (!isHidden) {
                console.log("[Calendar] Add Event Button: Closing existing modal");
                closeAddEventModal();
            } else {
                console.log("[Calendar] Add Event Button: Opening for TODAY (Force Local Date)");
                const now = new Date();
                const todayLocal = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
                openAddEventModal(todayLocal, e);
            }
        });
    }

    if (closeDetailsModal) closeDetailsModal.addEventListener('click', closeEventDetails);
    if (closeDetailsBtn) closeDetailsBtn.addEventListener('click', closeEventDetails);
    if (deleteEventBtn) deleteEventBtn.addEventListener('click', () => deleteEvent(currentEventId));
    if (editEventBtn) {
        editEventBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            editEvent(currentEventId);
        });
    }

    // Attendance UI Initializers
    setupAttendanceListeners();

    // --- SUB SETTINGS MODAL ---
    const closeSubSettingsBtn = document.getElementById('closeSubSettingsBtn');
    const saveSubSettingsBtn = document.getElementById('saveSubSettingsBtn');
    if (closeSubSettingsBtn) closeSubSettingsBtn.onclick = closeSubSettingsModal;
    if (saveSubSettingsBtn) saveSubSettingsBtn.onclick = saveSubSettings;
}

function setupAbsenceListeners() {
    if (addAbsenceBtn) {
        addAbsenceBtn.onclick = (e) => {
            e.stopPropagation();
            if (absenceModal && !absenceModal.classList.contains('versteckt')) {
                closeAbsenceModal();
                return;
            }
            openAbsenceModal();
        };
    }
    
    if (closeAbsenceBtn) closeAbsenceBtn.onclick = closeAbsenceModal;
    if (saveAbsenceBtn) saveAbsenceBtn.onclick = saveAbsence;

    if (absenceTypeRange) {
        absenceTypeRange.onchange = () => {
            if (absenceTypeRange.checked) {
                absenceRangeSettings.classList.remove('versteckt');
                absenceWeeklySettings.classList.add('versteckt');
            }
        };
    }
    if (absenceTypeWeekly) {
        absenceTypeWeekly.onchange = () => {
            if (absenceTypeWeekly.checked) {
                absenceWeeklySettings.classList.remove('versteckt');
                absenceRangeSettings.classList.add('versteckt');
            }
        };
    }
}

function openAbsenceModal() {
    if (!absenceModal) return;
    
    if (absenceModal) absenceModal.classList.remove('versteckt');
    
    // Position now handled by CSS .modal-overlay
    // Reset fields
    absenceReasonInput.value = '';
    const today = new Date().toISOString().split('T')[0];
    absenceStartDate.value = today;
    absenceEndDate.value = ''; // Optional
    
    // Default to range
    if (absenceTypeRange) {
        absenceTypeRange.checked = true;
        absenceTypeRange.dispatchEvent(new Event('change'));
    }

    renderAbsenceList();
}

function closeAbsenceModal() {
    if (absenceModal) absenceModal.classList.add('versteckt');
}

function saveAbsence() {
    const reason = absenceReasonInput.value.trim();
    const type = absenceTypeRange.checked ? 'range' : 'recurring';
    
    const absence = {
        id: Date.now().toString(),
        uid: getAuthUid(),
        playerName: null, // Filled below
        reason: reason || 'Abwesend',
        type: type,
        createdAt: Date.now()
    };

    if (type === 'range') {
        const start = absenceStartDate.value;
        const end = absenceEndDate.value;
        if (!start) {
            toast.error("Fehler", "Bitte Startdatum angeben.");
            return;
        }
        absence.startDate = start;
        absence.endDate = end || null; // Null means infinity
    } else {
        absence.weekday = parseInt(absenceWeekdaySelect.value, 10);
    }
    
    const profile = getCurrentUserProfile();
    if (!profile || !profile.rosterName) {
        toast.error("Profil fehlt", "Bitte setze erst deinen Namen im Profil.");
        return;
    }
    absence.playerName = profile.rosterName;

    
    if (!spielstand.absences) spielstand.absences = [];
    spielstand.absences.push(absence);
    
    speichereSpielstand();
    toast.success("Abwesenheit gespeichtert", "Deine Abwesenheit wurde registriert.");
    // Don't close modal yet, just refresh list
    renderAbsenceList();
    renderCalendar(); // Refresh UI to show stats change
}

function renderAbsenceList() {
    if (!absenceList) return;
    absenceList.innerHTML = '';
    const uid = getAuthUid();
    
    const myAbsences = (spielstand.absences || []).filter(a => a.uid === uid);
    
    if (myAbsences.length === 0) {
        absenceList.innerHTML = '<div style="font-size:0.75rem; color:#888; font-style:italic;">Keine Abwesenheiten gemeldet.</div>';
        return;
    }

    // Sort by type (recurring first) then start date
    myAbsences.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'recurring' ? -1 : 1;
        if (a.type === 'recurring') return (a.weekday || 0) - (b.weekday || 0);
        return (b.startDate || "").localeCompare(a.startDate || "");
    });

    myAbsences.forEach(abs => {
        const item = document.createElement('div');
        item.className = 'manage-card-modern';
        
        let displayStr = '';
        if (abs.type === 'recurring') {
            const days = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
            displayStr = `Jeden ${days[abs.weekday]}`;
        } else {
            if (!abs.endDate) {
                displayStr = `Ab ${abs.startDate}`;
            } else if (abs.startDate === abs.endDate) {
                displayStr = `${abs.startDate}`;
            } else {
                displayStr = `${abs.startDate} bis ${abs.endDate}`;
            }
        }

        item.innerHTML = `
            <div class="manage-card-info">
                <div class="manage-card-title">
                    <span>${displayStr}</span>
                </div>
                <div class="manage-card-subtitle">${escapeHTML(abs.reason)}</div>
            </div>
            <div class="manage-card-actions">
                <button class="icon-btn-ghost delete-abs-btn" style="color:#ef4444;" title="Löschen">
                    <i data-lucide="trash-2" style="width:16px; height:16px;"></i>
                </button>
            </div>
        `;
        
        item.querySelector('.delete-abs-btn').onclick = () => deleteAbsence(abs.id);
        absenceList.appendChild(item);
    });

    if (window.lucide) window.lucide.createIcons();
}

async function deleteAbsence(id) {
    if (!await customConfirm("Abwesenheit wirklich löschen?")) return;
    
    if (spielstand.absences) {
        spielstand.absences = spielstand.absences.filter(a => a.id !== id);
        speichereSpielstand();
        renderAbsenceList();
        renderCalendar();
        toast.success("Gelöscht", "Die Abwesenheit wurde entfernt.");
    }
}

/**
 * Helper to check if a specific player (by UID or Name) is absent on a specific date.
 */
export function isPlayerAbsent(dateStr, uid, playerName) {
    if (!spielstand.absences) return null;
    const date = new Date(dateStr);
    
    const abs = spielstand.absences.find(abs => {
        const isUserMatch = (uid && abs.uid === uid) || (playerName && abs.playerName === playerName);
        if (!isUserMatch) return false;
        
        if (abs.type === 'recurring') {
            return date.getDay() === abs.weekday;
        } else {
            // Type range (legacy or explicit)
            const start = new Date(abs.startDate);
            date.setHours(0,0,0,0);
            start.setHours(0,0,0,0);
            
            if (date < start) return false;
            
            if (abs.endDate) {
                const end = new Date(abs.endDate);
                end.setHours(0,0,0,0);
                return date <= end;
            }
            
            // No end date means for ever
            return true;
        }
    });

    if (abs) console.log(`[Calendar] Found absence for ${playerName || uid} on ${dateStr}:`, abs.reason);
    return abs;
}


function setupAttendanceListeners() {
    if (attendanceListenersBound) return;
    
    // Bind only to actual RSVP buttons (exclude the 4th details/participants button)
    const pills = document.querySelectorAll('.att-btn:not(#deleteEventBtn)');
    pills.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const status = btn.dataset.status;
            const reason = attendanceReasonInput ? attendanceReasonInput.value.trim() : '';
            updateParticipation(currentEventId, status, reason);
        });
    });

    // Logic moved to initCalendar for stability (Fix: icon loss)

    if (attendanceReasonInput) {
        attendanceReasonInput.addEventListener('change', () => {
            // If user already has a status, update reason immediately
            const event = spielstand.calendarEvents.find(e => e.id === currentEventId);
            const uid = getAuthUid();
            const profile = getCurrentUserProfile();
            const rName = profile ? profile.rosterName : null;
            let myStatus = null;
            if (event?.responses) {
                if (event.responses[uid]) myStatus = event.responses[uid].status;
                else {
                    const tempKey = `manual_${rName?.replace(/\s+/g, '_')}`;
                    if (event.responses[tempKey]) myStatus = event.responses[tempKey].status;
                }
            }
            if (myStatus) {
                updateParticipation(currentEventId, myStatus, attendanceReasonInput.value.trim());
            }
        });
    }

    if (saveAttendanceReasonBtn && attendanceReasonInput) {
        saveAttendanceReasonBtn.addEventListener('click', () => {
            if (!currentEventId) return;
            const event = spielstand.calendarEvents.find(e => e.id === currentEventId);
            const uid = getAuthUid();
            const profile = getCurrentUserProfile();
            const rName = profile ? profile.rosterName : null;
            let myStatus = 'maybe'; // Fallback
            if (event?.responses) {
                if (event.responses[uid]) myStatus = event.responses[uid].status;
                else {
                    const tempKey = `manual_${rName?.replace(/\s+/g, '_')}`;
                    if (event.responses[tempKey]) myStatus = event.responses[tempKey].status;
                }
            }
            updateParticipation(currentEventId, myStatus, attendanceReasonInput.value);
        });
    }
    
    attendanceListenersBound = true;
}

export function handlePrevMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
}

export function handleNextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
}

export function renderCalendar() {
    if (!calendarGrid || !currentMonthLabel) return;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthNames = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
    currentMonthLabel.textContent = `${monthNames[month]} ${year} `;

    calendarGrid.innerHTML = '';

    const firstDay = new Date(year, month, 1).getDay();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1; // Mon start
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Empty Cells
    for (let i = 0; i < startOffset; i++) {
        const cell = document.createElement('div');
        cell.className = 'calendar-day empty';
        calendarGrid.appendChild(cell);
    }

    // Days
    for (let day = 1; day <= daysInMonth; day++) {
        const cell = document.createElement('div');
        cell.className = 'calendar-day';
        cell.style.cursor = 'pointer'; // Make it obvious it's clickable

        // Check local date string YYYY-MM-DD
        const localDate = new Date(year, month, day);
        const yStr = localDate.getFullYear();
        const mStr = String(localDate.getMonth() + 1).padStart(2, '0');
        const dStr = String(localDate.getDate()).padStart(2, '0');
        const localDateStr = `${yStr}-${mStr}-${dStr}`;

        // Add classes for styling
        const todayStr = new Date().toISOString().split('T')[0];
        if (localDateStr === todayStr) cell.classList.add('is-today');

        // Sat/Sun differentiation
        const dayOfWeek = localDate.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) cell.classList.add('is-weekend');

        // Add past class
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        if (localDate < now) cell.classList.add('is-past');

        const header = document.createElement('div');
        header.className = 'day-header';
        header.textContent = day;
        cell.appendChild(header);

        // Content Area for Events
        const content = document.createElement('div');
        content.className = 'day-events';
        content.dataset.date = localDateStr;
        cell.appendChild(content);

        // Render Events
        const events = (spielstand.calendarEvents || []).filter(e => e.date === localDateStr);
        // Sort by time
        events.sort((a, b) => (a.time || '').localeCompare(b.time || ''));

        events.forEach(ev => {
            const stats = getEventStats(ev);
            
            const pill = document.createElement('div');
            pill.className = `event-pill event-${ev.type}`;
            pill.innerHTML = `
                <div class="pill-title-row">
                    <span class="event-time">${ev.time}</span>
                    <span class="event-name">${ev.title}</span>
                </div>
                <div class="pill-stats-row">
                    <span class="pill-stat"><i data-lucide="thumbs-up"></i> ${stats.going}</span>
                </div>
            `;

            // Show Details on Click
            pill.addEventListener('click', (e) => {
                e.stopPropagation();
                openEventDetails(ev, e);
            });

            content.appendChild(pill);
        });

        // Click to add event on this day
        cell.addEventListener('click', (e) => {
            // If click is on an event pill, the pill's listener (with e.stopPropagation()) should have fired
            // But just in case, we check here too
            if (e.target.closest('.event-pill')) return;
            
            e.stopPropagation();
            
            const isOpen = addEventModal && !addEventModal.classList.contains('versteckt');
            const isSameDay = eventDateInput && eventDateInput.value === localDateStr;
            
            if (isOpen && isSameDay) {
                console.log("[Calendar] Same day clicked: Closing modal");
                closeAddEventModal();
            } else {
                console.log("[Calendar] Day cell clicked:", localDateStr);
                openAddEventModal(localDateStr, e);
            }
        });

        calendarGrid.appendChild(cell);
    }

    if (window.lucide) window.lucide.createIcons();
}

// --- CRUD ---

function updateModalTitle(dateStr) {
    if (addEventModalTitle && dateStr) {
        const d = new Date(dateStr);
        const options = { weekday: 'long', day: 'numeric', month: 'long' };
        addEventModalTitle.textContent = d.toLocaleDateString('de-DE', options);
    }
}

export function openAddEventModal(preselectDate = null, clickEvent = null, positionOverride = null) {
    const isAlreadyOpen = addEventModal && !addEventModal.classList.contains('versteckt');
    console.log("[Calendar] openAddEventModal called. preselectDate:", preselectDate, "isAlreadyOpen:", isAlreadyOpen);
    
    if (!positionOverride) {
        try { closeEventDetails(); } catch(e) { console.warn("[Calendar] closeEventDetails failed:", e); }
    }
    try { closeManageModal(); } catch(e) { console.warn("[Calendar] closeManageModal failed:", e); }

    if (!addEventModal) {
        console.error("[Calendar] addEventModal is NULL!");
        return;
    }

    try {
        if (!isAlreadyOpen) {
            // Default values ONLY if opening fresh
            eventTitleInput.value = '';
            eventTimeInput.value = '19:00';
            eventLocationInput.value = '';
            if (eventRepeatInput) eventRepeatInput.checked = false;
            if (recurrenceOptions) recurrenceOptions.classList.add('versteckt');
            if (eventRepeatEndInput) eventRepeatEndInput.value = '';
            
            // Rules Reset
            if (eventRequireReasonInput) eventRequireReasonInput.checked = false;
            if (eventDeadlineInput) eventDeadlineInput.value = 0;
            if (eventDefaultStatusInput) eventDefaultStatusInput.checked = false;

            // Reset Edit State
            editingEventId = null;
        }

        // ALWAYS remove versteckt and set display, even if already open
        // This handles cases where state might get out of sync
        if (addEventOverlay) addEventOverlay.classList.remove('versteckt');
        addEventModal.classList.remove('versteckt');
        addEventModal.style.display = 'block';

        // Always update Date
        const now = new Date();
        const localToday = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
        const targetDate = preselectDate || localToday;
        
        console.log("[Calendar] Setting targetDate to:", targetDate);
        eventDateInput.value = targetDate;
        updateModalTitle(targetDate);

        if (!isAlreadyOpen) {
            // Focus Title for quick entry
            setTimeout(() => {
                eventTitleInput?.focus();
            }, 50);

            if (window.lucide) window.lucide.createIcons();
        }
        console.log("[Calendar] openAddEventModal completed.");
    } catch (err) {
        console.error("[Calendar] CRASH in openAddEventModal:", err);
    }
}


export function closeAddEventModal() {
    if (addEventOverlay) addEventOverlay.classList.add('versteckt');
    if (addEventModal) addEventModal.classList.add('versteckt');
    editingEventId = null;
    closeDatePicker();
    closeTimePicker();
}

export function saveEvent() {
    let title = eventTitleInput.value.trim();
    const startDateStr = eventDateInput.value;
    const time = eventTimeInput.value;
    const location = eventLocationInput.value.trim();
    const type = document.querySelector('input[name="eventType"]:checked').value;

    // Recurrence
    const repeat = eventRepeatInput && eventRepeatInput.checked;
    const repeatEndStr = eventRepeatEndInput ? eventRepeatEndInput.value : null;

    // Optional Title for Training
    if (!title && type === 'training') {
        title = "Training";
    }

    if (!title || !startDateStr) {
        toast.error("Unvollständig", "Bitte Titel und Datum angeben.");
        return;
    }

    if (repeat && !repeatEndStr) {
        toast.error("Fehlende Angabe", "Bitte ein Enddatum für die Wiederholung angeben.");
        return;
    }

    if (!spielstand.calendarEvents) spielstand.calendarEvents = [];

    // EDIT MODE
    if (editingEventId) {
        const index = spielstand.calendarEvents.findIndex(e => e.id === editingEventId);
        if (index !== -1) {
            const rules = {
                requireReason: eventRequireReasonInput?.checked || false,
                deadlineHours: parseInt(eventDeadlineInput?.value) || 0,
                defaultStatus: eventDefaultStatusInput?.checked ? 'going' : 'none'
            };

            const ev = spielstand.calendarEvents[index];
            // Apply default status retroactively to those who haven't voted
            if (rules.defaultStatus === 'going') {
                if (!ev.responses) ev.responses = {};
                const roster = spielstand.roster || [];
                roster.forEach(p => {
                    const name = p.name || `Spieler #${p.number}`;
                    const hasVotedUid = Object.keys(ev.responses).find(u => spielstand.rosterAssignments?.[u] === name);
                    const hasVotedName = Object.values(ev.responses).find(r => r.name === name);
                    
                    if (!hasVotedUid && !hasVotedName) {
                        const assignedUid = Object.keys(spielstand.rosterAssignments || {}).find(u => spielstand.rosterAssignments[u] === name);
                        const key = assignedUid || `manual_${name.replace(/\s+/g, '_')}`;
                        ev.responses[key] = { status: 'going', name, updatedAt: Date.now(), isAutoGenerated: true };
                    }
                });
            }

            spielstand.calendarEvents[index] = {
                ...ev,
                type,
                title,
                date: startDateStr,
                time,
                location,
                rules
            };
        }
        toast.success("Termin aktualisiert", "Deine Änderungen wurden erfolgreich gespeichert.");
    } else {
        // CREATE MODE
        const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 5);
        const newSeriesId = repeat ? generateId() : null; // Generate single Series ID for all

        const datesToSave = [];
        datesToSave.push(startDateStr);

        if (repeat) {
            let currentLoopDate = new Date(startDateStr);
            const endDate = new Date(repeatEndStr);
            let safetyCounter = 0;

            while (safetyCounter < 52) {
                currentLoopDate.setUTCDate(currentLoopDate.getUTCDate() + 7);
                if (currentLoopDate > endDate) break;
                const isoParams = currentLoopDate.toISOString().slice(0, 10);
                datesToSave.push(isoParams);
                safetyCounter++;
            }
        }

        const rules = {
            requireReason: eventRequireReasonInput?.checked || false,
            deadlineHours: parseInt(eventDeadlineInput?.value) || 0,
            defaultStatus: eventDefaultStatusInput?.checked ? 'going' : 'none'
        };

        datesToSave.forEach(dateStr => {
            const newEvent = {
                id: generateId(),
                type,
                title,
                date: dateStr,
                time,
                location,
                isRecurring: repeat,
                seriesId: newSeriesId, // Link them
                responses: {},
                rules
            };

            // Apply default status if configured
            if (rules.defaultStatus === 'going') {
                const roster = spielstand.roster || [];
                const rosterAssignments = spielstand.rosterAssignments || {};
                console.log(`[Calendar] Auto-RSVP (Going) enabled for new event: ${dateStr}. Processing roster...`);
                
                roster.forEach(p => {
                    const name = (p.name || `Spieler #${p.number}`).trim();
                    const assignedUid = Object.keys(rosterAssignments).find(u => rosterAssignments[u]?.trim() === name);
                    const key = assignedUid || `manual_${name.replace(/\s+/g, '_')}`;
                    newEvent.responses[key] = { status: 'going', name, updatedAt: Date.now(), isAutoGenerated: true };
                });
            }
            
            spielstand.calendarEvents.push(newEvent);
        });

        const msg = repeat ? `${datesToSave.length} Termine gespeichert` : "Termin gespeichert";
        toast.success("Erfolgreich erstellt", msg);
    }

    speichereSpielstand();

    closeAddEventModal();
    renderCalendar();
}

function editEvent(id) {
    const event = spielstand.calendarEvents.find(e => e.id === id);
    if (!event) return;

    let positionOverride = null;
    if (eventDetailsModal && !eventDetailsModal.classList.contains('versteckt')) {
        const top = parseFloat(eventDetailsModal.style.top) || 0;
        const left = parseFloat(eventDetailsModal.style.left) || 0;
        positionOverride = { top, left };
    }

    closeEventDetails();
    openAddEventModal(null, null, positionOverride);

    editingEventId = id;
    eventTitleInput.value = event.title;
    eventDateInput.value = event.date;
    eventTimeInput.value = event.time;
    eventLocationInput.value = event.location || '';

    // Load Rules
    if (eventRequireReasonInput) {
        eventRequireReasonInput.checked = event.rules?.requireReason || false;
    }
    if (eventDeadlineInput) {
        eventDeadlineInput.value = event.rules?.deadlineHours || 0;
    }
    if (eventDefaultStatusInput) {
        eventDefaultStatusInput.checked = event.rules?.defaultStatus === 'going';
    }

    updateModalTitle(event.date);

    const radio = document.querySelector(`input[name = "eventType"][value = "${event.type}"]`);
    if (radio) radio.checked = true;
}

// --- DETAILS LOGIC ---

export function showEventDetails(eventId, participantsOnly = false) {
    const isAlreadyOpen = eventDetailsModal && !eventDetailsModal.classList.contains('versteckt');
    const isSameEvent = currentEventId === eventId;

    if (isAlreadyOpen && isSameEvent) {
        console.log("[Calendar] showEventDetails: Toggling OFF (same event)");
        closeEventDetails();
        return;
    }

    // SWITCH: Close creation modal before opening details
    closeAddEventModal();

    const event = spielstand.calendarEvents.find(e => e.id === eventId);
    if (!event) return;

    currentEventId = eventId;

    if (eventDetailsOverlay) {
        eventDetailsOverlay.classList.remove('versteckt');
    }
    if (eventDetailsModal) {
        eventDetailsModal.classList.remove('versteckt');
    }

    if (detailsTitle) detailsTitle.textContent = event.title;
    if (detailsDate) {
        const [y, m, d] = event.date.split('-');
        detailsDate.textContent = `${d}.${m}.${y} `;
    }
    if (detailsTime) detailsTime.textContent = event.time + ' Uhr';

    if (detailsLocationRow && detailsLocation) {
        if (event.location) {
            detailsLocation.textContent = event.location;
            detailsLocationRow.classList.remove('versteckt');
        } else {
            detailsLocationRow.classList.add('versteckt');
        }
    }

    renderAttendanceUI(event);

    // Filter elements for "Participants Only" compact mode
    const myTeilnahmeHeader = Array.from(eventDetailsModal.querySelectorAll('h4')).find(el => el.textContent.includes('Teilnahme') || el.textContent.includes('Teilnahmen'));
    const pillContainer = eventDetailsModal.querySelector('.attendance-pills') || eventDetailsModal.querySelector('.att-btn')?.parentElement;
    const reasonContainer = document.getElementById('attendanceReasonContainer');
    
    const displayTop = participantsOnly ? 'none' : 'flex';
    const displayBlock = participantsOnly ? 'none' : 'block';

    if (detailsDate && detailsDate.parentElement) detailsDate.parentElement.style.display = displayTop;
    if (detailsTime && detailsTime.parentElement) detailsTime.parentElement.style.display = displayTop;
    
    if (participantsOnly && detailsLocationRow) detailsLocationRow.classList.add('versteckt');
    
    if (myTeilnahmeHeader) myTeilnahmeHeader.style.display = displayBlock;
    if (pillContainer) {
        pillContainer.style.display = 'flex';
        // In compact mode, we start by hiding the RSVP buttons and showing only the 4th button
        const rsvpButtons = pillContainer.querySelectorAll('.att-btn:not(#modalDetailsBtn)');
        rsvpButtons.forEach(btn => btn.style.display = participantsOnly ? 'none' : 'flex');
        if (modalDetailsBtn) {
            modalDetailsBtn.style.display = 'flex';
            modalDetailsBtn.style.flex = participantsOnly ? '1' : '0 0 auto';
        }
    }
    if (reasonContainer && participantsOnly) reasonContainer.classList.add('versteckt');
    
    // Hide Trainer/Admin controls in compact mode
    if (editEventBtn) editEventBtn.style.display = participantsOnly ? 'none' : '';
    if (deleteEventBtn) deleteEventBtn.style.display = participantsOnly ? 'none' : '';
    
    // Ensure close buttons ALWAYS work, even if dashboard opened this modal without prior init
    const boundClose = () => {
        if (eventDetailsOverlay) eventDetailsOverlay.classList.add('versteckt');
        if (eventDetailsModal) eventDetailsModal.classList.add('versteckt');
        currentEventId = null;
        document.removeEventListener('click', handleOutsideClick);
    };
    if (closeDetailsBtn) closeDetailsBtn.onclick = boundClose;
    if (closeDetailsModal) closeDetailsModal.onclick = boundClose;

    // Auto-Expand list if in compact mode
    if (attendanceFullList) {
        if (participantsOnly) {
            attendanceFullList.classList.remove('versteckt');
            if (modalDetailsBtn) {
                modalDetailsBtn.classList.add('active');
                modalDetailsBtn.style.display = 'flex'; // Ensure it's visible in compact mode
            }
        }
    }

    if (window.lucide) window.lucide.createIcons();
}

function openEventDetails(event, clickEvent) {
    showEventDetails(event.id);
}

export function getEventStats(event) {
    let going = 0, missing = 0, maybe = 0;
    const responses = event.responses || {};
    const roster = spielstand.roster && spielstand.roster.length > 0 ? spielstand.roster : [];
    const rosterAssignments = spielstand.rosterAssignments || {};

    // Determine the list of people we care about
    // Fallback: If no roster, use everyone who has assigned themselves a name and everyone who voted
    const rosterPotential = roster.length > 0 ? roster.map(p => (p.name || '').trim()) : Object.values(rosterAssignments).map(n => n.trim());
    const uniquePotential = [...new Set(rosterPotential)];

    console.log(`[Calendar] Stats Summary:`, { 
        event: event.title, 
        roster: roster.length, 
        assignments: Object.keys(rosterAssignments).length, 
        uniquePotential: uniquePotential.length 
    });

    // 1. Process all responses (Manual + Auto)
    const respondersIdx = new Set();
    Object.keys(responses).forEach(key => {
        const resp = responses[key];
        let status = resp.status;
        const name = (resp.name || '').trim();
        if (name) respondersIdx.add(name);

        // If it's an auto-generated response, a structural absence can still override it
        if (resp.isAutoGenerated) {
            const assignedUid = key.startsWith('manual_') ? null : key;
            const absence = isPlayerAbsent(event.date, assignedUid, name);
            if (absence) status = 'not-going';
        }

        if (status === 'going') going++;
        else if (status === 'not-going') missing++;
        else if (status === 'maybe') maybe++;
    });

    // 2. Count non-responders from potential team members
    uniquePotential.forEach(name => {
        // Find if any responder is linked to this name
        const assignedUid = Object.keys(rosterAssignments).find(u => rosterAssignments[u]?.trim() === name);
        
        // If we have a response for this UID or this name, skip (already counted in Step 1)
        if (respondersIdx.has(name)) return;
        if (assignedUid && responses[assignedUid]) return;

        const absence = isPlayerAbsent(event.date, assignedUid, name);
        if (absence) {
            missing++;
        } else if (event.rules?.defaultStatus === 'going') {
            going++;
        }
    });

    console.log(`[Calendar] Final Count: ${going} Dabei, ${missing} Absagen, ${maybe} ?`);
    return { going, missing, maybe };
}

function renderAttendanceUI(event) {
    const uid = getAuthUid();
    const profile = getCurrentUserProfile();
    const rosterName = profile ? profile.rosterName : null;
    
    let myResponse = null;
    if (event.responses) {
        if (event.responses[uid]) {
            myResponse = event.responses[uid];
        } else if (rosterName) {
            const tempKey = `manual_${rosterName.replace(/\s+/g, '_')}`;
            if (event.responses[tempKey]) {
                myResponse = event.responses[tempKey];
            }
        }
    }

    // 1. Highlight personal buttons
    let effectiveStatus = myResponse ? myResponse.status : null;
    const isAuto = myResponse?.isAutoGenerated === true;
    if (isAuto || !myResponse) {
        const abs = isPlayerAbsent(event.date, uid, rosterName);
        if (abs) effectiveStatus = 'not-going';
    }

    const pills = document.querySelectorAll('.att-btn:not(#deleteEventBtn)');
    pills.forEach(p => {
        p.classList.remove('active');
        if (effectiveStatus && p.dataset.status === effectiveStatus) {
            p.classList.add('active');
        }
    });

    // 2. Reason Input handling
    if (attendanceReasonContainer && attendanceReasonInput) {
        if (effectiveStatus === 'not-going' || effectiveStatus === 'maybe') {
            attendanceReasonContainer.classList.remove('versteckt');
            if (effectiveStatus === 'not-going' && !myResponse?.reason) {
                 const abs = isPlayerAbsent(event.date, uid, rosterName);
                 attendanceReasonInput.value = abs ? `Abwesend: ${abs.reason}` : '';
            } else {
                 attendanceReasonInput.value = myResponse?.reason || '';
            }
        } else {
            attendanceReasonContainer.classList.add('versteckt');
            attendanceReasonInput.value = '';
        }
    }

    // 3. Stats Summary
    const { going, missing, maybe } = getEventStats(event);
    if (attendanceStats) {
        attendanceStats.innerHTML = `<span style="color:#22c55e;">${going} Dabei</span> | <span style="color:#ef4444;">${missing} Absagen</span>` + (maybe > 0 ? ` | <span style="color:#f59e0b;">${maybe} ?</span>` : '');
    }

    // 4. Build full participants list
    if (attendanceFullList) {
        attendanceFullList.innerHTML = '';
        const responses = event.responses || {};
        const roster = spielstand.roster || [];
        const rosterAssignments = spielstand.rosterAssignments || {};

        // Track who we've already rendered
        const renderedNames = new Set();

        const getEffectivePlayerStatus = (pName, assignedUid) => {
            let resp = null;
            if (assignedUid && responses[assignedUid]) {
                resp = responses[assignedUid];
            } else {
                const rKey = Object.keys(responses).find(k => (responses[k].name || '').trim() === pName);
                if (rKey) resp = responses[rKey];
            }

            const isManualOnly = resp && !resp.isAutoGenerated;
            const absence = (!isManualOnly) ? isPlayerAbsent(event.date, assignedUid, pName) : null;
            
            if (isManualOnly) return { status: resp.status, reason: resp.reason };
            if (absence) return { status: 'not-going', reason: `Abwesend: ${absence.reason}` };
            if (resp) return { status: resp.status, reason: resp.reason || '' };
            if (event.rules?.defaultStatus === 'going') return { status: 'going', reason: '' };
            
            return { status: 'none', reason: '' };
        };

        const renderRosterItem = (pName) => {
            const assignedUid = Object.keys(rosterAssignments).find(u => rosterAssignments[u]?.trim() === pName);
            const effective = getEffectivePlayerStatus(pName, assignedUid);
            renderedNames.add(pName);

            if (effective.status === 'none') return;

            const div = document.createElement('div');
            div.className = 'hub-att-item';

            let statusIcon = 'check-circle-2';
            let statusColor = 'var(--hub-green)';
            if (effective.status === 'not-going') { statusIcon = 'x-circle'; statusColor = 'var(--hub-red)'; }
            if (effective.status === 'maybe') { statusIcon = 'help-circle'; statusColor = '#f59e0b'; }

            div.innerHTML = `
                <div class="hub-att-item-info">
                    <i data-lucide="${statusIcon}" style="width:16px; height:16px; color:${statusColor};"></i>
                    <span class="hub-player-name">${pName}</span>
                    <span class="hub-player-reason">${effective.reason || ''}</span>
                </div>
            `;
            attendanceFullList.appendChild(div);
        };

        // Priority 1: Current Roster
        roster.forEach(player => renderRosterItem((player.name || '').trim()));

        // Priority 2: Other Assignments (if not in roster)
        Object.values(rosterAssignments).forEach(name => {
            if (!renderedNames.has(name.trim())) renderRosterItem(name.trim());
        });

        // Add remaining non-roster responders (Trainers etc)
        Object.keys(responses).forEach(key => {
            const resp = responses[key];
            const name = (resp.name || '').trim();
            if (renderedNames.has(name)) return;

            const displayName = name || 'Neuer Benutzer';
            if (renderedNames.has(displayName)) return;
            renderedNames.add(displayName);

            const div = document.createElement('div');
            div.className = 'hub-att-item';

            let statusIcon = 'check-circle-2';
            let statusColor = 'var(--hub-green)';
            if (resp.status === 'not-going') { statusIcon = 'x-circle'; statusColor = 'var(--hub-red)'; }
            if (resp.status === 'maybe') { statusIcon = 'help-circle'; statusColor = '#f59e0b'; }

            div.innerHTML = `
                <div class="hub-att-item-info">
                    <i data-lucide="${statusIcon}" style="width:16px; height:16px; color:${statusColor};"></i>
                    <span class="hub-player-name">${displayName}</span>
                    <span class="hub-player-reason">${resp.reason || ''}</span>
                </div>
            `;
            attendanceFullList.appendChild(div);
        });

        if (window.lucide) window.lucide.createIcons();
    }
}

export async function updateParticipation(eventId, status, reason = '', targetPlayerName = null) {
    if (!status) return; // Prevent resets from non-RSVP buttons
    const event = spielstand.calendarEvents.find(e => e.id === eventId);
    if (!event) return;

    if (!event.responses) event.responses = {};

    const uid = getAuthUid();
    const profile = getCurrentUserProfile();

    // UNIFY: If targetPlayerName is actually the current user, clear it to use UID
    if (targetPlayerName && profile && profile.rosterName === targetPlayerName) {
        targetPlayerName = null;
    }

    let responseKey = uid;
    let responseName = profile ? (profile.rosterName || profile.displayName || profile.email) : 'Anonym';
    let checkKey = responseKey;

    if (!targetPlayerName && !event.responses[uid] && profile && profile.rosterName) {
        const tempKey = `manual_${profile.rosterName.replace(/\s+/g, '_')}`;
        if (event.responses[tempKey]) checkKey = tempKey;
    }

    if (targetPlayerName) {
        responseKey = `manual_${targetPlayerName.replace(/\s+/g, '_')}`;
        responseName = targetPlayerName;
        checkKey = responseKey;
    }

    // BREAK EARLY: Do nothing if clicking on current status AND reason hasn't changed
    const existingEntry = event.responses[checkKey];
    const oldReason = existingEntry?.reason || '';
    if (existingEntry && existingEntry.status === status && oldReason.trim() === reason.trim()) {
        return; 
    }

    const isTrainer = isUserTrainer();
    
    // Get Rules: Primary from event, Secondary from subscription, Fallback to defaults
    let rules = event.rules;
    if (!rules && event.subscriptionId) {
        const sub = spielstand.calendarSubscriptions.find(s => s.id === event.subscriptionId);
        if (sub) rules = sub.rules;
    }
    if (!rules) rules = { requireReason: false, deadlineHours: 0 };

    // 1. Check Deadline (if not trainer)
    if (!isTrainer && rules.deadlineHours > 0) {
        const eventDateStr = event.date + (event.time ? `T${event.time}` : 'T00:00');
        const eventDate = new Date(eventDateStr);
        const hoursDiff = (eventDate - Date.now()) / (1000 * 60 * 60);
        
        if (status !== 'going' && hoursDiff < rules.deadlineHours) {
            toast.error("Frist abgelaufen", `Abmeldung/Änderung nur bis ${rules.deadlineHours}h vor Termin möglich.`);
            return;
        }
    }

    // 2. Check Mandatory Reason
    if (rules.requireReason && (status === 'not-going' || status === 'maybe')) {
        if (!reason.trim()) {
            const promptMsg = status === 'maybe' ? "Warum vielleicht? (Grund erforderlich)" : "Warum absagen? (Grund erforderlich)";
            let inputReason = await customPrompt(promptMsg, "Grund eingeben");
            if (inputReason === null || !inputReason.trim()) {
                toast.error("Abgebrochen", "Ein Grund ist für diese Aktion zwingend erforderlich.");
                return;
            }
            reason = inputReason.trim();
            // Automatically update the input field visually if present
            const inpd = document.getElementById('attendanceReasonInput');
            if (inpd) inpd.value = reason;
        }
    }

    // CLEANUP RECORD DUPLICATES: Destroy any generic manual ghosts if the real user is voting
    if (!targetPlayerName && profile && profile.rosterName) {
        const ghostKey = `manual_${profile.rosterName.replace(/\s+/g, '_')}`;
        if (event.responses[ghostKey]) delete event.responses[ghostKey];
    }

    event.responses[responseKey] = {
        status,
        reason,
        name: responseName,
        updatedAt: Date.now()
    };

    speichereSpielstand();
    // Update UI if still open - Ensure ID comparison is safe
    if (String(currentEventId) === String(eventId)) {
        renderAttendanceUI(event);
        renderCalendar();
        if (window.lucide) window.lucide.createIcons();
    }
    toast.success("Teilnahme aktualisiert", targetPlayerName ? `Status für ${targetPlayerName} geändert.` : "Deine Antwort wurde gespeichert.");
}


function closeEventDetails() {
    if (eventDetailsOverlay) eventDetailsOverlay.classList.add('versteckt');
    if (eventDetailsModal) eventDetailsModal.classList.add('versteckt');
    currentEventId = null;
}

async function deleteEvent(id) {
    if (!isUserTrainer()) {
        toast.error("Zugriff verweigert", "Nur Trainer können Termine löschen.");
        return;
    }
    const confirmed = await customConfirm("Möchtest du diesen Termin wirklich löschen?");
    if (confirmed) {
        if (spielstand.calendarEvents) {
            spielstand.calendarEvents = spielstand.calendarEvents.filter(e => e.id !== id);
            speichereSpielstand();
            renderCalendar();
            closeEventDetails();
            toast.success("Gelöscht", "Der Termin wurde entfernt.");
        }
    }
}

// --- SUB SETTINGS POPUP ---

let currentEditingBatchId = null;
let currentEditingBatchType = 'sub';

function openSubSettingsModal(batchId, type = 'sub') {
    currentEditingBatchId = batchId;
    currentEditingBatchType = type;
    if (!subSettingsOverlay || !subSettingsModal) return;

    let rulesTarget = null;
    if (type === 'sub') {
        const sub = spielstand.calendarSubscriptions.find(s => s.id === batchId);
        if (!sub) return;
        rulesTarget = sub.rules;
        subSettingsModal.querySelector('h3').textContent = 'Abo-Einstellungen';
    } else {
        const firstEvent = (spielstand.calendarEvents || []).find(e => e.seriesId === batchId);
        if (!firstEvent) return;
        rulesTarget = firstEvent.rules;
        subSettingsModal.querySelector('h3').textContent = 'Serien-Einstellungen';
    }

    document.getElementById('modalSubRequireReason').checked = rulesTarget?.requireReason || false;
    document.getElementById('modalSubDeadlineHours').value = rulesTarget?.deadlineHours || 0;
    document.getElementById('modalSubDefaultStatus').checked = rulesTarget?.defaultStatus === 'going';

    if (subSettingsOverlay) subSettingsOverlay.classList.remove('versteckt');
    subSettingsModal.classList.remove('versteckt');
}


function closeSubSettingsModal() {
    if (subSettingsOverlay) subSettingsOverlay.classList.add('versteckt');
    if (subSettingsModal) subSettingsModal.classList.add('versteckt');
    currentEditingBatchId = null;
}

function saveSubSettings() {
    if (!currentEditingBatchId) return;

    const newRules = {
        requireReason: document.getElementById('modalSubRequireReason').checked,
        deadlineHours: parseInt(document.getElementById('modalSubDeadlineHours').value) || 0,
        defaultStatus: document.getElementById('modalSubDefaultStatus').checked ? 'going' : 'none'
    };

    if (currentEditingBatchType === 'sub') {
        const sub = spielstand.calendarSubscriptions.find(s => s.id === currentEditingBatchId);
        if (sub) sub.rules = { ...newRules };
    }

    // Propagate to all existing events of this batch
    (spielstand.calendarEvents || []).forEach(ev => {
        const matches = (currentEditingBatchType === 'sub') ? (ev.subscriptionId === currentEditingBatchId) : (ev.seriesId === currentEditingBatchId);
        if (matches) {
            if (!ev.rules) ev.rules = {};
            ev.rules.requireReason = newRules.requireReason;
            ev.rules.deadlineHours = newRules.deadlineHours;
            
            if (newRules.defaultStatus === 'going') {
                if (!ev.responses) ev.responses = {};
                const roster = spielstand.roster || [];
                const resValues = Object.values(ev.responses);
                roster.forEach(p => {
                    const name = p.name || `Spieler #${p.number}`;
                    const assignedUid = Object.keys(spielstand.rosterAssignments || {}).find(u => spielstand.rosterAssignments[u] === name);
                    const hasVotedUid = assignedUid && ev.responses[assignedUid];
                    const hasVotedName = resValues.some(r => r.name === name);
                    
                    if (!hasVotedUid && !hasVotedName) {
                        const key = `manual_${name.replace(/\s+/g, '_')}`;
                        ev.responses[key] = { status: 'going', name, updatedAt: Date.now() };
                    }
                });
            }
        }
    });

    speichereSpielstand();
    closeSubSettingsModal();
    toast.success("Gespeichert", currentEditingBatchType === 'sub' ? "Abo-Einstellungen übernommen." : "Serien-Einstellungen übernommen.");
}

// --- MANAGE OUTSIDE CLICK ---
// --- MANAGE HELPERS ---

export async function addSubscription(url, rules = { requireReason: false, deadlineHours: 0, defaultStatus: 'none' }) {
    try {
        toast.info("Lade...", "Abo wird hinzugefügt...");

        if (spielstand.calendarSubscriptions && spielstand.calendarSubscriptions.some(sub => sub.url === url)) {
            toast.info("Info", "Dieser Kalender ist bereits abonniert.");
            return;
        }

        const fetchUrl = url.replace('webcal://', 'https://').trim();
        const icsText = await fetchWithProxy(fetchUrl);

        if (!icsText || icsText.length < 10) {
            throw new Error("Kalender konnte nicht geladen werden. Bitte prüfe die URL.");
        }

        const subId = Date.now().toString();
        const newEvents = parseICS(icsText);

        if (newEvents.length === 0) {
            toast.info("Leer", "Keine Termine im Kalender gefunden.");
            return;
        }

        // Mark events with Subscription ID and apply default status
        newEvents.forEach(ev => {
            ev.subscriptionId = subId;
            ev.responses = {};
            if (rules.defaultStatus === 'going') {
                const roster = spielstand.roster || [];
                const rosterAssignments = spielstand.rosterAssignments || {};
                roster.forEach(p => {
                    const name = (p.name || `Spieler #${p.number}`).trim();
                    const assignedUid = Object.keys(rosterAssignments).find(u => rosterAssignments[u]?.trim() === name);
                    const key = assignedUid || `manual_${name.replace(/\s+/g, '_')}`;
                    ev.responses[key] = { status: 'going', name, updatedAt: Date.now(), isAutoGenerated: true };
                });
            }
            ev.rules = { 
                requireReason: rules.requireReason, 
                deadlineHours: rules.deadlineHours 
            };
        });

        if (!spielstand.calendarSubscriptions) spielstand.calendarSubscriptions = [];
        spielstand.calendarSubscriptions.push({
            id: subId,
            url: url,
            title: `Abo (${newEvents.length} Termine)`,
            addedAt: new Date().toISOString(),
            rules: rules
        });

        if (!spielstand.calendarEvents) spielstand.calendarEvents = [];
        spielstand.calendarEvents.push(...newEvents);

        speichereSpielstand();
        renderCalendar();
        toast.success("Erfolg", "Kalender erfolgreich abonniert!");

    } catch (err) {
        console.error("[Calendar] Subscription Error:", err);
        toast.error("Fehler", err.message);
    }
}

function renderManageView() {
    // 1. Render Subscriptions
    if (!subsList) return;
    subsList.innerHTML = '';

    if (spielstand.calendarSubscriptions && spielstand.calendarSubscriptions.length > 0) {
        spielstand.calendarSubscriptions.forEach(sub => {
            const row = document.createElement('div');
            row.className = 'manage-card-modern';

            row.innerHTML = `
                <div class="manage-card-info">
                    <div class="manage-card-title">
                        <span>${sub.title || 'Kalender'}</span>
                    </div>
                    <div class="manage-card-subtitle">${sub.url}</div>
                </div>
                <div class="manage-card-actions">
                     <button class="icon-btn-ghost active-sub-settings" data-id="${sub.id}" title="Einstellungen">
                        <i data-lucide="settings" style="width:16px; height:16px;"></i>
                     </button>
                     <button class="icon-btn-ghost active-sub-delete" style="color:hsl(var(--destructive));" data-id="${sub.id}" title="Löschen">
                        <i data-lucide="trash-2" style="width:16px; height:16px;"></i>
                     </button>
                </div>
            `;
            subsList.appendChild(row);

            // Bind Delete
            row.querySelector('.active-sub-delete').addEventListener('click', (e) => {
                deleteSubscription(sub.id);
            });

            // Bind Settings
            row.querySelector('.active-sub-settings').addEventListener('click', (e) => {
                openSubSettingsModal(sub.id);
            });
        });
    } else {
        subsList.innerHTML = '<div style="font-style:italic; opacity:0.5; font-size:0.8rem; padding:10px;">Keine Abos vorhanden.</div>';
    }

    // 2. Render Series
    if (!seriesList) return;
    seriesList.innerHTML = '';

    // Find unique series
    const seriesMap = new Map();
    (spielstand.calendarEvents || []).forEach(ev => {
        if (ev.seriesId) {
            if (!seriesMap.has(ev.seriesId)) {
                // Get Weekday from first event found
                const d = new Date(ev.date);
                const wd = d.toLocaleDateString('de-DE', { weekday: 'long' });
                seriesMap.set(ev.seriesId, { title: ev.title, count: 0, id: ev.seriesId, weekday: wd });
            }
            seriesMap.get(ev.seriesId).count++;
        }
    });

    if (seriesMap.size > 0) {
        seriesMap.forEach(series => {
            const row = document.createElement('div');
            row.className = 'manage-card-modern';

            row.innerHTML = `
                <div class="manage-card-info">
                    <div class="manage-card-title">
                        <span>${series.title}</span>
                    </div>
                    <div class="manage-card-subtitle">${series.weekday}s – Serie (${series.count} Termine)</div>
                </div>
                <div class="manage-card-actions">
                     <button class="icon-btn-ghost active-series-settings" data-id="${series.id}" title="Einstellungen">
                        <i data-lucide="settings" style="width:16px; height:16px;"></i>
                     </button>
                     <button class="icon-btn-ghost series-delete" style="color:hsl(var(--destructive));" data-id="${series.id}" title="Löschen">
                        <i data-lucide="trash-2" style="width:16px; height:16px;"></i>
                     </button>
                </div>
            `;
            seriesList.appendChild(row);

            row.querySelector('.series-delete').addEventListener('click', () => {
                deleteSeries(series.id);
            });
            row.querySelector('.active-series-settings').addEventListener('click', () => {
                openSubSettingsModal(series.id, 'series');
            });
        });
    } else {
        seriesList.innerHTML = '<div style="font-style:italic; opacity:0.5; font-size:0.8rem; padding:10px;">Keine Serien vorhanden.</div>';
    }

    if (window.lucide) window.lucide.createIcons();
}

function deleteSubscription(subId) {
    if (!customConfirm("Abo löschen?", "Alle Termine dieses Kalenders werden entfernt.")) return;

    // Remove Subscription
    spielstand.calendarSubscriptions = spielstand.calendarSubscriptions.filter(s => s.id !== subId);

    // Remove Events with subId
    spielstand.calendarEvents = spielstand.calendarEvents.filter(ev => ev.subscriptionId !== subId);

    speichereSpielstand();
    renderCalendar();
    renderManageView();
    toast.success("Gelöscht", "Kalender entfernt.");
}

function deleteSeries(seriesId) {
    if (!customConfirm("Serie löschen?", "Alle Termine dieser Serie werden entfernt.")) return;

    spielstand.calendarEvents = spielstand.calendarEvents.filter(ev => ev.seriesId !== seriesId);

    speichereSpielstand();
    renderCalendar();
    renderManageView();
    toast.success("Gelöscht", "Serie entfernt.");
}

// --- MANAGE OUTSIDE CLICK ---


function closeManageModal() {
    if (manageCalendarOverlay) manageCalendarOverlay.classList.add('versteckt');
    if (manageCalendarModal) manageCalendarModal.classList.add('versteckt');
}
