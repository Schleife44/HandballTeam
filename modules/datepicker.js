export let datePickerEl = null;
let currentInput = null;
let pickerDate = new Date();
let onSelectCallback = null;

export function initDatePicker() {
    // Create the picker element once
    if (!datePickerEl) {
        datePickerEl = document.createElement('div');
        datePickerEl.className = 'shadcn-datepicker hidden';
        document.body.appendChild(datePickerEl);

        // click outside to close
        document.addEventListener('click', (e) => {
            if (datePickerEl && !datePickerEl.classList.contains('hidden')) {
                if (!datePickerEl.contains(e.target) && currentInput && !currentInput.contains(e.target)) {
                    closeDatePicker();
                }
            }
        });
    }
}

export function openDatePicker(input, onSelect) {
    if (!datePickerEl) initDatePicker();

    currentInput = input;
    onSelectCallback = onSelect;

    // Parse initial date from input or default to today
    if (input.value) {
        pickerDate = new Date(input.value);
        if (isNaN(pickerDate)) pickerDate = new Date();
    } else {
        pickerDate = new Date();
    }

    renderPicker();

    datePickerEl.classList.remove('hidden');
    positionPicker(input);
}

export function closeDatePicker() {
    if (datePickerEl) datePickerEl.classList.add('hidden');
    currentInput = null;
    onSelectCallback = null;
}

function positionPicker(input) {
    const rect = input.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

    let top = rect.bottom + scrollTop + 4;
    let left = rect.left + scrollLeft;

    // Check overflow
    const pickerRect = datePickerEl.getBoundingClientRect();
    if (left + 280 > window.innerWidth) { // 280 approx width
        left = window.innerWidth - 290;
    }
    if (top + 300 > window.innerHeight + scrollTop) {
        top = rect.top + scrollTop - 300 - 4; // flip up
    }

    datePickerEl.style.top = `${top}px`;
    datePickerEl.style.left = `${left}px`;
}

function renderPicker() {
    const year = pickerDate.getFullYear();
    const month = pickerDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const startOffset = firstDay === 0 ? 6 : firstDay - 1; // Mon=0
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const monthNames = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

    let html = `
        <div class="dp-header">
            <button class="dp-nav-btn" id="dpPrev">&lt;</button>
            <div class="dp-title">${monthNames[month]} ${year}</div>
            <button class="dp-nav-btn" id="dpNext">&gt;</button>
        </div>
        <div class="dp-grid">
            <div class="dp-day-header">Mo</div>
            <div class="dp-day-header">Di</div>
            <div class="dp-day-header">Mi</div>
            <div class="dp-day-header">Do</div>
            <div class="dp-day-header">Fr</div>
            <div class="dp-day-header">Sa</div>
            <div class="dp-day-header">So</div>
    `;

    // Empty cells
    for (let i = 0; i < startOffset; i++) {
        html += `<div class="dp-cell empty"></div>`;
    }

    // Days
    const today = new Date();
    const isTodayMonth = today.getFullYear() === year && today.getMonth() === month;
    const todayDay = today.getDate();

    const selectedDate = currentInput.value ? new Date(currentInput.value) : null;
    const isSelectedMonth = selectedDate && selectedDate.getFullYear() === year && selectedDate.getMonth() === month;
    const selectedDay = selectedDate ? selectedDate.getDate() : -1;

    for (let d = 1; d <= daysInMonth; d++) {
        let classes = 'dp-cell dp-day';
        if (isTodayMonth && d === todayDay) classes += ' dp-today';
        if (isSelectedMonth && d === selectedDay) classes += ' dp-selected';

        html += `<div class="${classes}" data-day="${d}">${d}</div>`;
    }

    html += `</div>`;
    datePickerEl.innerHTML = html;

    // Listeners
    datePickerEl.querySelector('#dpPrev').addEventListener('click', (e) => {
        e.stopPropagation();
        pickerDate.setMonth(pickerDate.getMonth() - 1);
        renderPicker();
    });

    datePickerEl.querySelector('#dpNext').addEventListener('click', (e) => {
        e.stopPropagation();
        pickerDate.setMonth(pickerDate.getMonth() + 1);
        renderPicker();
    });

    datePickerEl.querySelectorAll('.dp-day').forEach(cell => {
        cell.addEventListener('click', (e) => {
            e.stopPropagation();
            const day = parseInt(e.target.dataset.day);
            const newDate = new Date(year, month, day);
            // Format YYYY-MM-DD local
            const dateStr = newDate.getFullYear() + '-' + String(newDate.getMonth() + 1).padStart(2, '0') + '-' + String(newDate.getDate()).padStart(2, '0');

            if (currentInput) {
                currentInput.value = dateStr;
                // Dispatch change event manually
                currentInput.dispatchEvent(new Event('change'));
            }
            if (onSelectCallback) onSelectCallback(dateStr);
            closeDatePicker();
        });
    });
}
