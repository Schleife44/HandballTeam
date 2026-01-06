import { spielstand, speichereSpielstand } from './state.js';
import {
    calendarGrid, currentMonthLabel, addEventModal, addEventModalTitle,
    eventTitleInput, eventDateInput, eventTimeInput, eventLocationInput,
    eventRepeatInput, eventRepeatEndInput, recurrenceOptions,
    eventDetailsModal, detailsTitle, detailsDate, detailsTime, detailsLocation, detailsLocationRow,
    closeDetailsModal, closeDetailsBtn, deleteEventBtn, editEventBtn,
    // Manage UI
    manageCalendarBtn, manageCalendarModal, closeManageBtn, manageUrlInput, addSubBtn, subsList, seriesList, addEventBtn
} from './dom.js';
import { customAlert, customConfirm } from './customDialog.js';

import { openDatePicker, closeDatePicker } from './datepicker.js';
import { openTimePicker, closeTimePicker } from './timepicker.js';
import { toast } from './toast.js';
import { parseICS } from './ics.js';

let currentDate = new Date(); // Start with today
let currentEventId = null; // Store ID for delete/details action
let editingEventId = null; // Store ID for edit action

export function initCalendar() {
    renderCalendar();

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
                // Exclusive access: Close other modals
                closeAddEventModal();
                closeEventDetails();

                document.body.appendChild(manageCalendarModal);
                manageCalendarModal.classList.remove('versteckt');

                // Center Modal Logic
                manageCalendarModal.style.position = 'fixed'; // Force Fixed

                const target = e.currentTarget || e.target;
                const rect = target.getBoundingClientRect();

                const modalWidth = 450;
                const modalHeight = 400; // estimated max

                // Fixed: rect is already viewport relative
                let top = rect.bottom + 10;
                let left = rect.left + (rect.width / 2) - (modalWidth / 2);

                // Check Right
                if (left + modalWidth > window.innerWidth) {
                    left = window.innerWidth - modalWidth - 10;
                }
                // Check Left
                if (left < 10) left = 10;

                // Check Bottom
                if (top + modalHeight > window.innerHeight) {
                    top = rect.top - modalHeight - 10;
                }
                // Check Top (if flipped up)
                if (top < 10) top = 10;

                manageCalendarModal.style.top = `${top}px`;
                manageCalendarModal.style.left = `${left}px`;

                renderManageView();

                // Add outside click listener
                setTimeout(() => {
                    document.addEventListener('click', handleManageOutsideClick);
                }, 0);
            }
        });
    }

    if (closeManageBtn) {
        closeManageBtn.addEventListener('click', closeManageModal);
    }

    if (addSubBtn) {
        addSubBtn.addEventListener('click', async () => {
            const url = manageUrlInput.value.trim();
            if (!url) { toast.error("Fehler", "Bitte URL eingeben"); return; }

            await addSubscription(url);
            manageUrlInput.value = '';
            renderManageView();
        });
    }

    // Details Modal Listeners
    if (addEventModal && typeof addEventBtn !== 'undefined' && addEventBtn) {
        addEventBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openAddEventModal(null, e);
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

        // Check local date string YYYY-MM-DD
        const localDate = new Date(year, month, day);
        const yStr = localDate.getFullYear();
        const mStr = String(localDate.getMonth() + 1).padStart(2, '0');
        const dStr = String(localDate.getDate()).padStart(2, '0');
        const localDateStr = `${yStr}-${mStr}-${dStr}`;

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
            const pill = document.createElement('div');
            pill.className = `event-pill event-${ev.type}`;
            pill.innerHTML = `<span class="event-time">${ev.time}</span> ${ev.title}`;

            // Show Details on Click
            pill.addEventListener('click', (e) => {
                e.stopPropagation();
                openEventDetails(ev, e);
            });

            content.appendChild(pill);
        });

        // Click to add event on this day
        cell.addEventListener('click', (e) => {
            if (e.target.closest('.event-pill')) return;
            openAddEventModal(localDateStr, e);
        });

        calendarGrid.appendChild(cell);
    }
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
    if (!positionOverride) closeEventDetails();
    closeManageModal();

    if (addEventModal) {
        document.body.appendChild(addEventModal);
        addEventModal.classList.remove('versteckt');

        // Use Fixed to avoid scrolling bugs
        addEventModal.style.position = 'fixed';

        let top, left;

        // Priority 1: Explicit Override (used by Edit)
        if (positionOverride) {
            top = positionOverride.top;
            left = positionOverride.left;
        }
        else {
            // Priority 2: Click Event (used by New)
            // Try to resolve target safely
            const target = clickEvent ? (clickEvent.currentTarget || clickEvent.target) : null;

            if (target) {
                const rect = target.getBoundingClientRect();

                const popWidth = 350;
                const popHeight = 500;

                // Center horiz over click
                left = rect.left + (rect.width / 2) - (popWidth / 2);
                top = rect.top + (rect.height / 2) - (popHeight / 2);

                // Bounds
                if (left + popWidth > window.innerWidth) left = window.innerWidth - popWidth - 10;
                if (left < 10) left = 10;

                if (top + popHeight > window.innerHeight) {
                    top = window.innerHeight - popHeight - 10;
                }
                if (top < 10) top = 10;
            }
            // Priority 3: Fallback Center (No valid target)
            else {
                top = (window.innerHeight / 2) - 250;
                left = (window.innerWidth / 2) - 175;
            }
        }

        addEventModal.style.top = `${top}px`;
        addEventModal.style.left = `${left}px`;
        addEventModal.style.transform = 'none';

        setTimeout(() => {
            document.addEventListener('click', handleAddOutsideClick);
        }, 0);
    }

    // Reset Edit State
    editingEventId = null;

    // Default values
    eventTitleInput.value = '';
    eventTimeInput.value = '19:00';
    eventLocationInput.value = '';

    if (eventRepeatInput) eventRepeatInput.checked = false;
    if (recurrenceOptions) recurrenceOptions.classList.add('versteckt');
    if (eventRepeatEndInput) eventRepeatEndInput.value = '';

    const targetDate = preselectDate || new Date().toISOString().slice(0, 10);
    eventDateInput.value = targetDate;
    updateModalTitle(targetDate);

    // Focus Title for quick entry
    setTimeout(() => eventTitleInput.focus(), 50);

    if (window.lucide) window.lucide.createIcons();
}

function handleAddOutsideClick(e) {
    if (addEventModal && !addEventModal.contains(e.target) && !e.target.closest('.calendar-day') && !e.target.closest('.shadcn-datepicker') && !e.target.closest('.shadcn-timepicker')) {
        closeAddEventModal();
    }
}

export function closeAddEventModal() {
    if (addEventModal) addEventModal.classList.add('versteckt');
    editingEventId = null;
    document.removeEventListener('click', handleAddOutsideClick);
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
            spielstand.calendarEvents[index] = {
                ...spielstand.calendarEvents[index],
                type,
                title,
                date: startDateStr,
                time,
                location
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

        datesToSave.forEach(dateStr => {
            const newEvent = {
                id: generateId(),
                type,
                title,
                date: dateStr,
                time,
                location,
                isRecurring: repeat,
                seriesId: newSeriesId // Link them
            };
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

    updateModalTitle(event.date);

    const radio = document.querySelector(`input[name = "eventType"][value = "${event.type}"]`);
    if (radio) radio.checked = true;
}

// --- DETAILS LOGIC ---

function openEventDetails(event, clickEvent) {
    if (!calendarGrid) return;

    closeAddEventModal();

    currentEventId = event.id;
    if (eventDetailsModal) {
        document.body.appendChild(eventDetailsModal);
        eventDetailsModal.classList.remove('versteckt');

        // Use Fixed
        eventDetailsModal.style.position = 'fixed';

        if (clickEvent) {
            const targetElement = clickEvent.target.closest('.event-pill') || clickEvent.target;
            const rect = targetElement.getBoundingClientRect();

            let top = rect.top;
            let left = rect.right + 10; // Right of element

            const popoverWidth = 320;
            // Flip to left if no space
            if (left + popoverWidth > window.innerWidth) {
                left = rect.left - popoverWidth - 10;
            }
            if (left < 10) left = 10; // Safety

            const popHeight = 250;
            // Flip up if no space
            if (top + popHeight > window.innerHeight) {
                top = rect.bottom - popHeight; // aligned bottom
            }
            if (top < 10) top = 10;

            eventDetailsModal.style.top = `${top}px`;
            eventDetailsModal.style.left = `${left}px`;
        }
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

    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
        document.addEventListener('click', handleOutsideClick);
    }, 0);
}

function handleOutsideClick(e) {
    if (eventDetailsModal &&
        !eventDetailsModal.contains(e.target) &&
        !e.target.closest('.event-pill') &&
        !e.target.closest('#addEventModal')
    ) {
        closeEventDetails();
    }
}

function closeEventDetails() {
    if (eventDetailsModal) eventDetailsModal.classList.add('versteckt');
    currentEventId = null;
    document.removeEventListener('click', handleOutsideClick);
}

async function deleteEvent(id) {
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

// --- MANAGE HELPERS ---

export async function addSubscription(url) {
    try {
        toast.info("Lade...", "Abo wird hinzugefügt...");
        let fetchUrl = url.replace('webcal://', 'https://');
        const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(fetchUrl);

        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error("Netzwerkfehler");
        const icsText = await response.text();

        const subId = Date.now().toString();
        const newEvents = parseICS(icsText);

        if (newEvents.length === 0) {
            toast.info("Leer", "Keine Termine gefunden.");
            return;
        }

        // Mark events with Subscription ID
        newEvents.forEach(ev => ev.subscriptionId = subId);

        // Save Subscription
        if (!spielstand.calendarSubscriptions) spielstand.calendarSubscriptions = [];
        spielstand.calendarSubscriptions.push({
            id: subId,
            url: url,
            title: `Kalender (${newEvents.length} Termine)`,
            addedAt: new Date().toISOString()
        });

        // Add Events
        if (!spielstand.calendarEvents) spielstand.calendarEvents = [];
        spielstand.calendarEvents.push(...newEvents);

        speichereSpielstand();
        renderCalendar();
        toast.success("Erfolg", "Kalender abonniert!");

    } catch (err) {
        console.error(err);
        toast.error("Fehler", "Konnte Kalender nicht laden.");
    }
}

function renderManageView() {
    // 1. Render Subscriptions
    if (!subsList) return;
    subsList.innerHTML = '';

    if (spielstand.calendarSubscriptions && spielstand.calendarSubscriptions.length > 0) {
        spielstand.calendarSubscriptions.forEach(sub => {
            const row = document.createElement('div');
            row.className = 'manage-row';
            row.style.display = 'flex';
            row.style.justifyContent = 'space-between';
            row.style.alignItems = 'center';
            row.style.padding = '8px';
            row.style.borderBottom = '1px solid #eee';

            row.innerHTML = `
                <div style="flex:1; overflow:hidden;">
                    <div style="font-weight:600; font-size:0.9rem;">${sub.title || 'Kalender'}</div>
                    <div style="font-size:0.7rem; color:#888; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${sub.url}</div>
                </div>
                <button class="shadcn-btn-ghost active-sub-delete" style="color:red;" data-id="${sub.id}"><i data-lucide="trash-2"></i></button>
            `;
            subsList.appendChild(row);

            // Bind Delete
            row.querySelector('.active-sub-delete').addEventListener('click', (e) => {
                deleteSubscription(sub.id);
            });
        });
    } else {
        subsList.innerHTML = '<div style="font-style:italic;">Keine Abos.</div>';
    }

    // 2. Render Series (Mock logic for now, or real if implementing seriesId)
    // We need to group events by seriesId
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
            row.className = 'manage-row';
            row.style.display = 'flex';
            row.style.justifyContent = 'space-between';
            row.style.alignItems = 'center';
            row.style.padding = '8px';
            row.style.borderBottom = '1px solid #eee';

            row.innerHTML = `
                <div>
                    <div style="font-weight:600; font-size:0.9rem;">${series.title}</div>
                    <div style="font-size:0.7rem; color:#888;">${series.weekday}s – Serie (${series.count} Termine)</div>
                </div>
                <button class="shadcn-btn-ghost series-delete" style="color:red;" data-id="${series.id}"><i data-lucide="trash-2"></i></button>
            `;
            seriesList.appendChild(row);

            row.querySelector('.series-delete').addEventListener('click', () => {
                deleteSeries(series.id);
            });
        });
    } else {
        seriesList.innerHTML = '<div style="font-style:italic;">Keine Serien.</div>';
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

function handleManageOutsideClick(e) {
    if (manageCalendarModal && !manageCalendarModal.classList.contains('versteckt')) {
        // If click is NOT inside modal AND NOT on the button that opened it
        if (!manageCalendarModal.contains(e.target) && !manageCalendarBtn.contains(e.target)) {
            closeManageModal();
        }
    }
}

function closeManageModal() {
    if (manageCalendarModal) {
        manageCalendarModal.classList.add('versteckt');
        document.removeEventListener('click', handleManageOutsideClick);
    }
}
