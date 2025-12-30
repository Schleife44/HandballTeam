// modules/settingsManager.js
import { spielstand, speichereSpielstand } from './state.js';
import { customAlert } from './customDialog.js';

/**
 * Validates and locks the team settings
 */
export function validateTeamSettings() {
    const myTeamName = spielstand.settings.myTeamName?.trim();
    const myTeamColor = spielstand.settings.myTeamColor;

    if (!myTeamName) {
        customAlert('Bitte geben Sie zuerst einen Team-Namen ein.');
        return false;
    }

    // Lock the settings
    spielstand.settings.teamSettingsValidated = true;
    speichereSpielstand();

    // Update UI
    updateSettingsUI();

    console.log('Team settings validated:', { myTeamName, myTeamColor });
    return true;
}

/**
 * Unlocks the team settings (for admin purposes)
 */
export function unlockTeamSettings() {
    spielstand.settings.teamSettingsValidated = false;
    speichereSpielstand();
    updateSettingsUI();
}

/**
 * Toggles validation state on/off
 */
export function toggleValidation() {
    const wasValidated = spielstand.settings.teamSettingsValidated;

    if (wasValidated) {
        // Unlock settings
        spielstand.settings.teamSettingsValidated = false;
    } else {
        // Validate and lock settings
        const myTeamName = spielstand.settings.myTeamName?.trim();

        if (!myTeamName) {
            customAlert('Bitte geben Sie zuerst einen Team-Namen ein.');
            return false;
        }

        spielstand.settings.teamSettingsValidated = true;
    }

    speichereSpielstand();
    updateSettingsUI();

    // Also update roster inputs if they exist on the page
    updateRosterInputsForValidation();

    return true;
}

/**
 * Updates the Settings page UI based on validation state
 */
export function updateSettingsUI() {
    const toggleBtn = document.getElementById('toggleValidationBtn');
    const validatedIndicator = document.getElementById('settingsValidatedIndicator');
    const isValidated = spielstand.settings.teamSettingsValidated;

    // Update lock icons with smooth transition
    const iconLocked = document.getElementById('iconLocked');
    const iconUnlocked = document.getElementById('iconUnlocked');

    if (iconLocked && iconUnlocked) {
        if (isValidated) {
            // Show Locked (Green)
            iconLocked.classList.remove('hidden');
            iconLocked.classList.add('visible');

            // Hide Unlocked (Gray)
            iconUnlocked.classList.remove('visible');
            iconUnlocked.classList.add('hidden');
        } else {
            // Hide Locked (Green)
            iconLocked.classList.remove('visible');
            iconLocked.classList.add('hidden');

            // Show Unlocked (Gray)
            iconUnlocked.classList.remove('hidden');
            iconUnlocked.classList.add('visible');
        }
    } else {
        // Fallback for legacy structure if icons not found
        const lockIcon = document.getElementById('lockIcon');
        if (lockIcon) {
            if (isValidated) {
                lockIcon.setAttribute('data-lucide', 'lock');
                lockIcon.style.color = '#22c55e';
            } else {
                lockIcon.setAttribute('data-lucide', 'lock-open');
                lockIcon.style.color = '#9ca3af';
            }
            if (window.lucide) window.lucide.createIcons();
        }
    }

    // Update button title
    if (toggleBtn) {
        toggleBtn.title = isValidated
            ? 'Einstellungen im Kader entsperren'
            : 'Einstellungen im Kader sperren';
    }

    // Show/hide indicator
    if (validatedIndicator) {
        if (isValidated) {
            validatedIndicator.classList.remove('versteckt');
        } else {
            validatedIndicator.classList.add('versteckt');
        }
    }
}

/**
 * Initializes the settings page
 */
export function initSettingsPage() {
    const myTeamNameInput = document.getElementById('myTeamNameInput');
    const myTeamColorInput = document.getElementById('myTeamColorInput');
    const myTeamColorIcon = document.getElementById('myTeamColorIcon');

    // Load current values
    if (myTeamNameInput) {
        myTeamNameInput.value = spielstand.settings.myTeamName || '';
    }

    if (myTeamColorInput) {
        myTeamColorInput.value = spielstand.settings.myTeamColor || '#dc3545';
    }

    // Set shirt icon color to match selected color
    if (myTeamColorIcon) {
        myTeamColorIcon.style.color = spielstand.settings.myTeamColor || '#dc3545';
    }

    // Update UI based on validation state
    updateSettingsUI();
}

/**
 * Saves team name changes
 */
export function saveMyTeamName(name) {
    spielstand.settings.myTeamName = name.trim();
    speichereSpielstand();
}

/**
 * Saves team color changes and updates UI
 */
export function saveMyTeamColor(color) {
    spielstand.settings.myTeamColor = color;
    speichereSpielstand();

    // Update the shirt icon color in Settings
    const myTeamColorIcon = document.getElementById('myTeamColorIcon');
    if (myTeamColorIcon) {
        myTeamColorIcon.style.color = color;
    }

    // If validated, also update the roster color pickers
    if (spielstand.settings.teamSettingsValidated) {
        const isAway = spielstand.settings.isAuswaertsspiel;
        const myTeamColorInput = isAway
            ? document.getElementById('teamColorInputGegner')
            : document.getElementById('teamColorInput');
        const myTeamColorTrigger = isAway
            ? document.getElementById('teamColorTriggerGegner')
            : document.getElementById('teamColorTrigger');

        if (myTeamColorInput) {
            myTeamColorInput.value = color;
        }

        if (myTeamColorTrigger) {
            const icon = myTeamColorTrigger.querySelector('i') || myTeamColorTrigger.querySelector('svg');
            if (icon) {
                icon.style.color = color;
            }
        }

        // Update the corresponding setting
        if (isAway) {
            spielstand.settings.teamColorGegner = color;
        } else {
            spielstand.settings.teamColor = color;
        }
    }

    // Update player button colors in game view and theme
    import('./ui.js').then(ui => {
        if (ui.zeichneSpielerRaster) {
            ui.zeichneSpielerRaster();
        }
        if (ui.applyTheme) {
            ui.applyTheme();
        }
    });
}

/**
 * Updates roster inputs based on validation state
 * Called from roster.js when roster is loaded
 */
export function updateRosterInputsForValidation() {
    const rosterTeamNameHeim = document.getElementById('rosterTeamNameHeim');
    const rosterTeamNameGegner = document.getElementById('rosterTeamNameGegner');
    const teamColorInput = document.getElementById('teamColorInput');
    const teamColorInputGegner = document.getElementById('teamColorInputGegner');

    const isValidated = spielstand.settings.teamSettingsValidated;
    const isAway = spielstand.settings.isAuswaertsspiel;

    if (!isValidated) {
        // Not validated - all inputs should be editable
        if (rosterTeamNameHeim) {
            rosterTeamNameHeim.disabled = false;
            rosterTeamNameHeim.style.opacity = '1';
            rosterTeamNameHeim.style.cursor = 'text';
            const lockIcon = document.getElementById('rosterHeimLockIcon');
            if (lockIcon) lockIcon.style.display = 'none';
        }
        if (rosterTeamNameGegner) {
            rosterTeamNameGegner.disabled = false;
            rosterTeamNameGegner.style.opacity = '1';
            rosterTeamNameGegner.style.cursor = 'text';
            const lockIcon = document.getElementById('rosterGegnerLockIcon');
            if (lockIcon) lockIcon.style.display = 'none';
        }
        if (teamColorInput) {
            teamColorInput.disabled = false;
            teamColorInput.style.pointerEvents = 'auto';
            const trigger = document.getElementById('teamColorTrigger');
            if (trigger) {
                trigger.style.cursor = 'pointer';
                trigger.style.opacity = '1';
                trigger.classList.remove('locked');
            }
            const wrapper = trigger?.closest('.color-picker-wrapper');
            if (wrapper) {
                wrapper.style.cursor = 'pointer';
            }
        }
        if (teamColorInputGegner) {
            teamColorInputGegner.disabled = false;
            teamColorInputGegner.style.pointerEvents = 'auto';
            const trigger = document.getElementById('teamColorTriggerGegner');
            if (trigger) {
                trigger.style.cursor = 'pointer';
                trigger.style.opacity = '1';
                trigger.classList.remove('locked');
            }
            const wrapper = trigger?.closest('.color-picker-wrapper');
            if (wrapper) {
                wrapper.style.cursor = 'pointer';
            }
        }
        return;
    }

    // Validated - lock "my team" inputs based on home/away status
    const myTeamInput = isAway ? rosterTeamNameGegner : rosterTeamNameHeim;
    const opponentInput = isAway ? rosterTeamNameHeim : rosterTeamNameGegner;
    const myTeamColorInput = isAway ? teamColorInputGegner : teamColorInput;
    const opponentColorInput = isAway ? teamColorInput : teamColorInputGegner;

    // Sync my team's name from settings and lock the input
    if (myTeamInput) {
        myTeamInput.value = spielstand.settings.myTeamName || '';
        myTeamInput.disabled = true;
        myTeamInput.style.opacity = '0.6';
        myTeamInput.style.cursor = 'not-allowed';
        myTeamInput.title = 'Team-Name ist in den Einstellungen gesperrt';

        const lockIconId = isAway ? 'rosterGegnerLockIcon' : 'rosterHeimLockIcon';
        const lockIcon = document.getElementById(lockIconId);
        if (lockIcon) {
            lockIcon.style.display = 'block';
            if (window.lucide) window.lucide.createIcons();
        }

        // Also update the corresponding setting to match
        if (isAway) {
            spielstand.settings.teamNameGegner = spielstand.settings.myTeamName;
        } else {
            spielstand.settings.teamNameHeim = spielstand.settings.myTeamName;
        }
    }

    // Keep opponent's name editable
    if (opponentInput) {
        opponentInput.disabled = false;
        opponentInput.style.opacity = '1';
        opponentInput.style.cursor = 'text';
        opponentInput.title = '';

        const lockIconId = isAway ? 'rosterHeimLockIcon' : 'rosterGegnerLockIcon';
        const lockIcon = document.getElementById(lockIconId);
        if (lockIcon) lockIcon.style.display = 'none';
    }

    // Lock and sync my team's color from settings
    if (myTeamColorInput) {
        myTeamColorInput.disabled = true;
        myTeamColorInput.value = spielstand.settings.myTeamColor || '#dc3545';
        myTeamColorInput.style.cursor = 'not-allowed';
        myTeamColorInput.style.pointerEvents = 'none';

        // Update icon color and disable cursor
        const myTeamColorTrigger = isAway
            ? document.getElementById('teamColorTriggerGegner')
            : document.getElementById('teamColorTrigger');

        if (myTeamColorTrigger) {
            const icon = myTeamColorTrigger.querySelector('i') || myTeamColorTrigger.querySelector('svg');
            if (icon) {
                icon.style.color = spielstand.settings.myTeamColor || '#dc3545';
            }
            myTeamColorTrigger.style.cursor = 'not-allowed';
            myTeamColorTrigger.style.opacity = '0.6';
            myTeamColorTrigger.classList.add('locked');

            // Also set cursor on wrapper (but NOT pointer-events, just cursor)
            const wrapper = myTeamColorTrigger.closest('.color-picker-wrapper');
            if (wrapper) {
                wrapper.style.cursor = 'not-allowed';
            }
        }

        // Also update the corresponding setting to match
        if (isAway) {
            spielstand.settings.teamColorGegner = spielstand.settings.myTeamColor;
        } else {
            spielstand.settings.teamColor = spielstand.settings.myTeamColor;
        }
    }

    // Keep opponent's color editable
    if (opponentColorInput) {
        opponentColorInput.disabled = false;
        opponentColorInput.style.cursor = 'pointer';

        const opponentColorTrigger = isAway
            ? document.getElementById('teamColorTrigger')
            : document.getElementById('teamColorTriggerGegner');

        if (opponentColorTrigger) {
            opponentColorTrigger.style.cursor = 'pointer';
            opponentColorTrigger.style.opacity = '1';
            opponentColorTrigger.disabled = false;

            const wrapper = opponentColorTrigger.closest('.color-picker-wrapper');
            if (wrapper) {
                wrapper.style.cursor = 'pointer';
                wrapper.style.pointerEvents = 'auto';
            }
        }
    }
}
