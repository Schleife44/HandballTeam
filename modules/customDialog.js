// modules/customDialog.js
// Custom Confirm- und Alert-Dialoge, um Browser-Dialoge zu ersetzen

import {
    customConfirmModal, customConfirmTitle, customConfirmMessage,
    customConfirmYes, customConfirmNo,
    customAlertModal, customAlertTitle, customAlertMessage, customAlertOk,
    customPromptModal, customPromptTitle, customPromptMessage, customPromptInput, customPromptConfirm, customPromptCancel
} from './dom.js';

// Speichere Resolve-Funktion für Confirm-Dialog
let confirmResolve = null;
let promptResolve = null;

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

/**
 * Zeigt einen benutzerdefinierten Eingabe-Dialog
 * @param {string} message - Nachricht
 * @param {string} title - Titel
 * @returns {Promise<string|null>} - Gibt den eingegebenen Text zurück oder null bei Abbrechen
 */
export function customPrompt(message, title = "Eingabe") {
    return new Promise((resolve) => {
        promptResolve = resolve;
        customPromptTitle.textContent = title;
        customPromptMessage.textContent = message;
        customPromptInput.value = ''; // Reset input
        customPromptModal.classList.remove('versteckt');
        customPromptInput.focus();
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

    if (customPromptConfirm) {
        customPromptConfirm.addEventListener('click', () => {
            const value = customPromptInput.value;
            customPromptModal.classList.add('versteckt');
            if (promptResolve) {
                promptResolve(value);
                promptResolve = null;
            }
        });
    }

    if (customPromptCancel) {
        customPromptCancel.addEventListener('click', () => {
            customPromptModal.classList.add('versteckt');
            if (promptResolve) {
                promptResolve(null);
                promptResolve = null;
            }
        });
    }
}
