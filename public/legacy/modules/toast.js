let toastContainer = null;

function initToastContainer() {
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'sonner-toaster';
        document.body.appendChild(toastContainer);
    }
}

export const toast = {
    success: (message, description = '') => {
        showToast(message, description, 'success');
    },
    error: (message, description = '') => {
        showToast(message, description, 'error');
    },
    info: (message, description = '') => {
        showToast(message, description, 'info');
    }
};

function showToast(message, description, type) {
    initToastContainer();

    const toastEl = document.createElement('div');
    toastEl.className = `sonner-toast toast-${type}`;

    // Icon based on type
    let icon = '';
    if (type === 'success') icon = '<i data-lucide="check-circle" class="toast-icon success-icon"></i>';
    if (type === 'error') icon = '<i data-lucide="alert-circle" class="toast-icon error-icon"></i>';
    if (type === 'info') icon = '<i data-lucide="info" class="toast-icon info-icon"></i>';

    toastEl.innerHTML = `
        <div class="toast-content">
            ${icon}
            <div class="toast-text">
                <div class="toast-title">${message}</div>
                ${description ? `<div class="toast-desc">${description}</div>` : ''}
            </div>
        </div>
        <button class="toast-close">&times;</button>
    `;

    // Close Logic
    const closeBtn = toastEl.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => removeToast(toastEl));

    // Auto Remove
    setTimeout(() => {
        removeToast(toastEl);
    }, 4000);

    // Prepend to show stack effect (newest at bottom usually for sonner, or top)
    // Sonner default: bottom-right, newest at bottom.
    toastContainer.appendChild(toastEl);

    // Lucide
    if (window.lucide) window.lucide.createIcons();

    // Animation In
    requestAnimationFrame(() => {
        toastEl.classList.add('visible');
    });
}

function removeToast(el) {
    el.classList.remove('visible');
    el.classList.add('removing');
    el.addEventListener('transitionend', () => {
        if (el.parentElement) el.parentElement.removeChild(el);
    });
}
