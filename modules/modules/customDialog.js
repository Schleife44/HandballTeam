// modules/customDialog.js
// Custom Confirm- und Alert-Dialoge, um Browser-Dialoge zu ersetzen

import {
    customConfirmModal, customConfirmTitle, customConfirmMessage,
    customConfirmYes, customConfirmNo,
    customAlertModal, customAlertTitle, customAlertMessage, customAlertOk
} from './dom.js';

// Speichere Resolve-Funktion für Confirm-Dialog
let confirmResolve = null;

/**
 * Zeigt einen benutzerdefinierten Bestätigungs-Dialog
 * @param {string} message - Anzuzeigende Nachricht
 * @param {string} title - Titel (optional, Standard: "Bestätigung")
 * @returns {Promise<boolean>} - Gibt true zurück bei Ja, false bei Nein
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
 * Zeigt einen benutzerdefinierten Hinweis-Dialog
 * @param {string} message - Anzuzeigende Nachricht  
 * @param {string} title - Titel (optional, Standard: "Hinweis")
 * @returns {Promise<void>} - Wird aufgelöst, wenn OK geklickt wird
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

// Initialisiere Event-Listener
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
