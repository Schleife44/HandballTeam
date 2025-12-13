// modules/customDialog.js
// Custom Confirm and Alert dialogs to replace browser dialogs

import {
    customConfirmModal, customConfirmTitle, customConfirmMessage,
    customConfirmYes, customConfirmNo,
    customAlertModal, customAlertTitle, customAlertMessage, customAlertOk
} from './dom.js';

// Store resolve function for confirm dialog
let confirmResolve = null;

/**
 * Shows a custom confirm dialog
 * @param {string} message - Message to display
 * @param {string} title - Title (optional, default: "Bestätigung")
 * @returns {Promise<boolean>} - Resolves true if yes, false if no
 */
export function customConfirm(message, title = "Bestätigung") {
    return new Promise((resolve) => {
        confirmResolve = resolve;
        customConfirmTitle.textContent = title;
        customConfirmMessage.textContent = message;
        customConfirmModal.classList.remove('versteckt');
    });
}

/**
 * Shows a custom alert dialog
 * @param {string} message - Message to display  
 * @param {string} title - Title (optional, default: "Hinweis")
 * @returns {Promise<void>} - Resolves when OK is clicked
 */
export function customAlert(message, title = "Hinweis") {
    return new Promise((resolve) => {
        customAlertTitle.textContent = title;
        customAlertMessage.textContent = message;
        customAlertModal.classList.remove('versteckt');

        const handleOk = () => {
            customAlertModal.classList.add('versteckt');
            customAlertOk.removeEventListener('click', handleOk);
            resolve();
        };
        customAlertOk.addEventListener('click', handleOk);
    });
}

// Initialize event listeners
export function initCustomDialogs() {
    if (customConfirmYes) {
        customConfirmYes.addEventListener('click', () => {
            customConfirmModal.classList.add('versteckt');
            if (confirmResolve) {
                confirmResolve(true);
                confirmResolve = null;
            }
        });
    }

    if (customConfirmNo) {
        customConfirmNo.addEventListener('click', () => {
            customConfirmModal.classList.add('versteckt');
            if (confirmResolve) {
                confirmResolve(false);
                confirmResolve = null;
            }
        });
    }
}
