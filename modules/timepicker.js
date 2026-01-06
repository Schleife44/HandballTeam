export let timePickerEl = null;
let currentInput = null;

export function initTimePicker() {
    if (!timePickerEl) {
        timePickerEl = document.createElement('div');
        timePickerEl.className = 'shadcn-timepicker hidden';
        document.body.appendChild(timePickerEl);

        // Generate Slots
        let html = '<div class="tp-list">';
        for (let h = 0; h < 24; h++) {
            for (let m = 0; m < 60; m += 15) {
                const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                html += `<div class="tp-item" data-time="${timeStr}">${timeStr} Uhr</div>`;
            }
        }
        html += '</div>';
        timePickerEl.innerHTML = html;

        // Delegation
        timePickerEl.addEventListener('click', (e) => {
            const item = e.target.closest('.tp-item');
            if (item) {
                const time = item.dataset.time;
                if (currentInput) {
                    currentInput.value = time;
                    currentInput.dispatchEvent(new Event('change'));
                }
                closeTimePicker();
            }
        });

        // Outside Click
        document.addEventListener('click', (e) => {
            if (timePickerEl && !timePickerEl.classList.contains('hidden')) {
                if (!timePickerEl.contains(e.target) && currentInput && !currentInput.contains(e.target)) {
                    closeTimePicker();
                }
            }
        });
    }
}

export function openTimePicker(input) {
    if (!timePickerEl) initTimePicker();
    currentInput = input;

    // Highlight current
    const currentVal = input.value;
    const items = timePickerEl.querySelectorAll('.tp-item');
    items.forEach(el => {
        if (el.dataset.time === currentVal) el.classList.add('selected');
        else el.classList.remove('selected');
    });

    timePickerEl.classList.remove('hidden');
    positionPicker(input);

    // Scroll to selected
    const selected = timePickerEl.querySelector('.selected');
    if (selected) {
        selected.scrollIntoView({ block: 'center' });
    }
}

export function closeTimePicker() {
    if (timePickerEl) timePickerEl.classList.add('hidden');
    currentInput = null;
}

function positionPicker(input) {
    const rect = input.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

    let top = rect.bottom + scrollTop + 4;
    let left = rect.left + scrollLeft;

    // Dimensions
    const width = 120; // Fixed width for time picker
    const height = 200; // max-height

    // Overflow check
    if (left + width > window.innerWidth) {
        left = rect.right + scrollLeft - width;
    }
    if (top + height > window.innerHeight + scrollTop) {
        top = rect.top + scrollTop - height - 4;
    }

    timePickerEl.style.top = `${top}px`;
    timePickerEl.style.left = `${left}px`;
}
