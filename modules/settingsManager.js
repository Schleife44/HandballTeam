import { spielstand, speichereSpielstand } from './state.js';
import { customAlert, customConfirm } from './customDialog.js';
import { createInviteToken, getActiveTeamId, getCurrentUserProfile, leaveTeam, deleteTeam } from './firebase.js';

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


    return true;
}

/**
 * Unlocks the team settings (for admin purposes)
 */
export function unlockTeamSettings() {
    spielstand.settings.teamSettingsValidated = false;
    speichereSpielstand();
    updateSettingsUI();
    // Also update roster inputs if they exist on the page
    updateRosterInputsForValidation();
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
 * Initializes the settings page and syncs UI with spielstand.settings
 */
export function initSettingsPage() {
    console.log('[Settings] Initializing Settings Page UI...');
    
    const myTeamNameInput = document.getElementById('myTeamNameInput');
    const myTeamColorInput = document.getElementById('myTeamColorInput');
    const myTeamColorIcon = document.getElementById('myTeamColorIcon');
    
    // Toggles
    const toggleDarkMode = document.getElementById('set_toggleDarkMode');
    const toggleWurfbildHeim = document.getElementById('set_toggleWurfbildHeim');
    const toggleWurfbildGegner = document.getElementById('set_toggleWurfbildGegner');
    const toggleWurfpositionHeim = document.getElementById('set_toggleWurfpositionHeim');
    const toggleWurfpositionGegner = document.getElementById('set_toggleWurfpositionGegner');
    const toggleCombinedThrow = document.getElementById('set_toggleCombinedThrowMode');

    // Attendance Settings (Modal Sub)
    const modalSubRequireReason = document.getElementById('subRequireReason');
    const modalSubDeadlineHours = document.getElementById('subDeadlineHours');
    const modalSubDefaultStatus = document.getElementById('subDefaultStatus');

    // 1. Sync Values from State to UI
    if (myTeamNameInput) myTeamNameInput.value = spielstand.settings.myTeamName || '';
    if (myTeamColorInput) myTeamColorInput.value = spielstand.settings.myTeamColor || '#dc3545';
    if (myTeamColorIcon) myTeamColorIcon.style.color = spielstand.settings.myTeamColor || '#dc3545';

    if (toggleDarkMode) toggleDarkMode.checked = !!spielstand.settings.darkMode;
    if (toggleWurfbildHeim) toggleWurfbildHeim.checked = !!spielstand.settings.showWurfbildHeim;
    if (toggleWurfbildGegner) toggleWurfbildGegner.checked = !!spielstand.settings.showWurfbildGegner;
    if (toggleWurfpositionHeim) toggleWurfpositionHeim.checked = !!spielstand.settings.showWurfpositionHeim;
    if (toggleWurfpositionGegner) toggleWurfpositionGegner.checked = !!spielstand.settings.showWurfpositionGegner;
    if (toggleCombinedThrow) toggleCombinedThrow.checked = !!spielstand.settings.combinedThrowMode;

    // Sync Attendance
    if (spielstand.settings.calendar) {
        if (modalSubRequireReason) modalSubRequireReason.checked = !!spielstand.settings.calendar.requireReason;
        if (modalSubDeadlineHours) modalSubDeadlineHours.value = spielstand.settings.calendar.deadlineHours || 0;
        if (modalSubDefaultStatus) modalSubDefaultStatus.checked = (spielstand.settings.calendar.defaultStatus === 'going');
    }

    // 2. Attach Event Listeners for Real-time Saving
    const attachChange = (el, key, isCheckbox = true, subKey = null) => {
        if (!el) return;
        el.onchange = () => {
            if (subKey) {
                if (!spielstand.settings[subKey]) spielstand.settings[subKey] = {};
                spielstand.settings[subKey][key] = isCheckbox ? el.checked : el.value;
            } else {
                spielstand.settings[key] = isCheckbox ? el.checked : el.value;
            }
            
            // Special handling for Dark Mode
            if (key === 'darkMode') {
                import('./ui.js').then(ui => ui.applyTheme());
            }

            speichereSpielstand();
            console.log(`[Settings] Saved ${key}:`, el.checked || el.value);
        };
    };

    attachChange(toggleDarkMode, 'darkMode');
    attachChange(toggleWurfbildHeim, 'showWurfbildHeim');
    attachChange(toggleWurfbildGegner, 'showWurfbildGegner');
    attachChange(toggleWurfpositionHeim, 'showWurfpositionHeim');
    attachChange(toggleWurfpositionGegner, 'showWurfpositionGegner');
    
    // Combined Mode has special logic for locking others
    if (toggleCombinedThrow) {
        toggleCombinedThrow.onchange = () => {
            spielstand.settings.combinedThrowMode = toggleCombinedThrow.checked;
            updateCombinedModeVisuals();
            speichereSpielstand();
            console.log(`[Settings] Saved combinedThrowMode:`, toggleCombinedThrow.checked);
        };
    }

    /**
     * Helper to handle visual locking of sub-settings when combined mode is on
     */
    function updateCombinedModeVisuals() {
        const isCombined = !!spielstand.settings.combinedThrowMode;
        const subToggles = [
            toggleWurfbildHeim, 
            toggleWurfbildGegner, 
            toggleWurfpositionHeim, 
            toggleWurfpositionGegner
        ];
        const subKeys = [
            'showWurfbildHeim',
            'showWurfbildGegner',
            'showWurfpositionHeim',
            'showWurfpositionGegner'
        ];

        subToggles.forEach((el, index) => {
            if (!el) return;
            const key = subKeys[index];
            const row = el.closest('.setting-row');

            if (isCombined) {
                // Force visual state
                el.checked = true;
                el.disabled = true;
                if (row) {
                    row.style.opacity = '0.5';
                    row.style.pointerEvents = 'none';
                }
            } else {
                // Restore from actual state
                el.checked = !!spielstand.settings[key];
                el.disabled = false;
                if (row) {
                    row.style.opacity = '1';
                    row.style.pointerEvents = 'auto';
                }
            }
        });
    }

    // Initial run
    updateCombinedModeVisuals();

    // Team Name/Color Listeners
    if (myTeamNameInput) {
        myTeamNameInput.oninput = (e) => saveMyTeamName(e.target.value);
    }
    if (myTeamColorInput) {
        myTeamColorInput.oninput = (e) => saveMyTeamColor(e.target.value);
    }

    // Attendance Listeners
    if (modalSubRequireReason) {
        modalSubRequireReason.onchange = () => {
            if (!spielstand.settings.calendar) spielstand.settings.calendar = {};
            spielstand.settings.calendar.requireReason = modalSubRequireReason.checked;
            speichereSpielstand();
        };
    }
    if (modalSubDeadlineHours) {
        modalSubDeadlineHours.oninput = () => {
            if (!spielstand.settings.calendar) spielstand.settings.calendar = {};
            spielstand.settings.calendar.deadlineHours = parseInt(modalSubDeadlineHours.value) || 0;
            speichereSpielstand();
        };
    }
    if (modalSubDefaultStatus) {
        modalSubDefaultStatus.onchange = () => {
            if (!spielstand.settings.calendar) spielstand.settings.calendar = {};
            spielstand.settings.calendar.defaultStatus = modalSubDefaultStatus.checked ? 'going' : 'none';
            speichereSpielstand();
        };
    }

    const toggleValidationBtn = document.getElementById('toggleValidationBtn');
    if (toggleValidationBtn) {
        toggleValidationBtn.onclick = () => {
            toggleValidation();
        };
    }

    // Save button for sub-settings
    const saveSubBtn = document.getElementById('saveSubSettingsBtn');
    if (saveSubBtn) {
        saveSubBtn.onclick = () => {
            const modal = document.getElementById('subSettingsModal');
            if (modal) modal.classList.add('versteckt');
        };
    }

    // Update UI based on validation state
    updateSettingsUI();

    // Initialize Invite UI
    initInviteUI();

    // Initialize Team Management UI
    initTeamManagementUI();
}

/**
 * Handle Leave/Delete Team
 */
function initTeamManagementUI() {
    const leaveBtn = document.getElementById('leaveTeamBtn');
    const deleteBtn = document.getElementById('deleteTeamBtn');
    if (!leaveBtn || !deleteBtn) return;

    const teamId = getActiveTeamId();
    const profile = getCurrentUserProfile();
    
    console.log('[Settings] Init Team Management. Current Team ID:', teamId);

    if (!teamId) {
        console.warn('[Settings] No active team ID. Hiding management buttons.');
        leaveBtn.style.display = 'none';
        deleteBtn.style.display = 'none';
        return;
    }

    // Default state: Show Leave button, Hide Delete button
    // This ensures we always have a way out even if profile isn't fully loaded yet
    leaveBtn.style.display = 'inline-flex';
    deleteBtn.style.display = 'none';

    // If we HAVE profile data, we can try to be more specific (Trainer vs Member)
    if (profile && profile.teams) {
        // Find the team in the list (handle current teamId or legacy id)
        const currentTeamData = profile.teams.find(t => (t.teamId === teamId) || (t.id === teamId));
        
        if (currentTeamData) {
            console.log('[Settings] Found team role in profile:', currentTeamData.role);
            if (currentTeamData.role === 'trainer') {
                // Trainer: Hide Leave, Show Delete
                leaveBtn.style.display = 'none';
                deleteBtn.style.display = 'inline-flex';
            } else {
                // Member: Show Leave, Hide Delete
                leaveBtn.style.display = 'inline-flex';
                deleteBtn.style.display = 'none';
            }
        } else {
            console.warn('[Settings] Active team context not found in user profile list. Keeping Leave fallback.');
        }
    } else {
        console.warn('[Settings] Profile data not ready. Keeping Leave fallback.');
    }

}

/**
 * Handle Invite Link generation
 */
export function initInviteUI() {
    const genBtn = document.getElementById('generateInviteBtn');
    const container = document.getElementById('inviteLinkContainer');
    const input = document.getElementById('inviteLinkInput');
    const copyBtn = document.getElementById('copyInviteBtn');

    if (!genBtn) return;

    genBtn.onclick = async () => {
        const teamId = getActiveTeamId();
        const teamName = spielstand.settings.myTeamName || 'Handball Team';

        if (!teamId) {
            customAlert('Bitte zuerst ein Team wählen.');
            return;
        }

        genBtn.disabled = true;
        genBtn.textContent = 'Generiere...';

        const token = await createInviteToken(teamId, teamName);
        
        if (token) {
            const url = window.location.origin + window.location.pathname + '?invite=' + token;
            input.value = url;
            container.classList.remove('versteckt');
            if (window.lucide) window.lucide.createIcons();
        } else {
            customAlert('Fehler beim Erstellen des Links.');
        }

        genBtn.disabled = false;
        genBtn.innerHTML = '<i data-lucide="user-plus" style="width: 16px; height: 16px; margin-right: 8px;"></i> Einladungslink generieren';
        if (window.lucide) window.lucide.createIcons();
    };

    if (copyBtn) {
        copyBtn.onclick = () => {
            input.select();
            input.setSelectionRange(0, 99999);
            navigator.clipboard.writeText(input.value);
            
            const originalIcon = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i data-lucide="check" style="width: 16px; height: 16px; color: #22c55e;"></i>';
            if (window.lucide) window.lucide.createIcons();
            
            setTimeout(() => {
                copyBtn.innerHTML = originalIcon;
                if (window.lucide) window.lucide.createIcons();
            }, 2000);
        };
    }
}

/**
 * Saves team name changes
 */
export function saveMyTeamName(name) {
    const newName = name.trim();
    // If the name changed and settings were locked, unlock them
    if (newName !== spielstand.settings.myTeamName && spielstand.settings.teamSettingsValidated) {
        unlockTeamSettings();
    }
    spielstand.settings.myTeamName = newName;
    speichereSpielstand();
}

/**
 * Saves team color changes and updates UI
 */
export function saveMyTeamColor(color) {
    // If the color changed and settings were locked, unlock them
    if (color !== spielstand.settings.myTeamColor && spielstand.settings.teamSettingsValidated) {
        unlockTeamSettings();
    }
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
