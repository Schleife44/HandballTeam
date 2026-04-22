import { spielstand, speichereSpielstand, speichereSpielstandSofort } from './state.js';
import { customAlert, customConfirm } from './customDialog.js';
import { createInviteToken, getActiveTeamId, getCurrentUserProfile, leaveTeam, deleteTeam } from './firebase.js';

export function syncSettingsVisuals() {
    if (!spielstand || !spielstand.settings) return;
    
    const isGoalZonesActive = !!spielstand.settings.useGoalZones;
    document.querySelectorAll('.goal-zones-group').forEach(g => {
        if (isGoalZonesActive) g.classList.remove('versteckt');
        else g.classList.add('versteckt');
    });

    const isFieldZonesActive = !!spielstand.settings.useFieldZones;
    document.querySelectorAll('.field-zones-group').forEach(g => {
        if (isFieldZonesActive) g.classList.remove('versteckt');
        else g.classList.add('versteckt');
    });
}

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
    const saveAllSettingsBtn = document.getElementById('saveAllSettingsBtn');
    if (saveAllSettingsBtn) {
        saveAllSettingsBtn.onclick = async () => {
            try {
                saveAllSettingsBtn.disabled = true;
                const originalContent = saveAllSettingsBtn.innerHTML;
                saveAllSettingsBtn.innerHTML = '<i data-lucide="loader-2" class="animate-spin" style="width: 18px; height: 18px;"></i> Speichern...';
                
                await speichereSpielstandSofort();
                
                // Success visual feedback
                saveAllSettingsBtn.innerHTML = '<i data-lucide="check" style="width: 18px; height: 18px;"></i> Gespeichert';
                saveAllSettingsBtn.classList.remove('shadcn-btn-primary');
                saveAllSettingsBtn.classList.add('shadcn-btn-success');
                
                setTimeout(() => {
                    saveAllSettingsBtn.innerHTML = originalContent;
                    saveAllSettingsBtn.classList.remove('shadcn-btn-success');
                    saveAllSettingsBtn.classList.add('shadcn-btn-primary');
                    saveAllSettingsBtn.disabled = false;
                    if (window.lucide) window.lucide.createIcons();
                }, 2000);
            } catch (err) {
                console.error('[Settings] Save failed:', err);
                customAlert('Speichern fehlgeschlagen.');
                saveAllSettingsBtn.disabled = false;
            }
        };
    }

    // Handle Backup Import in Settings
    const importBtn = document.getElementById('importSpielButtonSettings');
    const importInput = document.getElementById('importSpielInputSettings');
    if (importBtn && importInput) {
        importBtn.onclick = () => importInput.click();
        importInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const text = await file.text();
            try {
                const data = JSON.parse(text);
                if (data && data.players && data.history) {
                    const confirmed = await customConfirm('Möchtest du diese Daten wirklich importieren? Bestehende Daten werden überschrieben.', 'Daten importieren');
                    if (confirmed) {
                        Object.assign(spielstand, data);
                        await speichereSpielstandSofort();
                        window.location.reload();
                    }
                } else {
                    customAlert('Ungültige Datei. Die Datei muss Spieler und Historie enthalten.');
                }
            } catch (err) {
                customAlert('Fehler beim Lesen der Datei.');
            }
        };
    }

    console.log('[Settings] Initializing Settings Page UI...');
    
    const myTeamNameInput = document.getElementById('myTeamNameInput');
    const myTeamColorInput = document.getElementById('myTeamColorInput');
    const myTeamColorIcon = document.getElementById('myTeamColorIcon');
    const tournamentIdInput = document.getElementById('handballNetTournamentIdInput');
    
    // Toggles
    const toggleDarkMode = document.getElementById('set_toggleDarkMode');
    const toggleWurfbildHeim = document.getElementById('set_toggleWurfbildHeim');
    const toggleWurfbildGegner = document.getElementById('set_toggleWurfbildGegner');
    const toggleWurfpositionHeim = document.getElementById('set_toggleWurfpositionHeim');
    const toggleWurfpositionGegner = document.getElementById('set_toggleWurfpositionGegner');
    const toggleCombinedThrow = document.getElementById('set_toggleCombinedThrowMode');
    const toggleGoalZones = document.getElementById('set_toggleGoalZones');
    const toggleFieldZones = document.getElementById('set_toggleFieldZones');


    // 1. Sync Values from State to UI
    if (myTeamNameInput) myTeamNameInput.value = spielstand.settings.myTeamName || '';
    if (myTeamColorInput) myTeamColorInput.value = spielstand.settings.myTeamColor || '#dc3545';
    if (myTeamColorIcon) myTeamColorIcon.style.color = spielstand.settings.myTeamColor || '#dc3545';
    if (tournamentIdInput) tournamentIdInput.value = spielstand.settings.handballNetTournamentId || '';

    if (toggleDarkMode) toggleDarkMode.checked = !!spielstand.settings.darkMode;
    if (toggleWurfbildHeim) toggleWurfbildHeim.checked = !!spielstand.settings.showWurfbildHeim;
    if (toggleWurfbildGegner) toggleWurfbildGegner.checked = !!spielstand.settings.showWurfbildGegner;
    if (toggleWurfpositionHeim) toggleWurfpositionHeim.checked = !!spielstand.settings.showWurfpositionHeim;
    if (toggleWurfpositionGegner) toggleWurfpositionGegner.checked = !!spielstand.settings.showWurfpositionGegner;
    if (toggleCombinedThrow) toggleCombinedThrow.checked = !!spielstand.settings.combinedThrowMode;
    if (toggleGoalZones) toggleGoalZones.checked = !!spielstand.settings.useGoalZones;
    if (toggleFieldZones) toggleFieldZones.checked = !!spielstand.settings.useFieldZones;


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

    // Initial run to sync UI state
    updateCombinedModeVisuals();
    updateGoalZonesVisuals();
    updateFieldZonesVisuals();

    // Goal Zones Sync
    if (toggleGoalZones) {
        toggleGoalZones.onchange = () => {
            spielstand.settings.useGoalZones = toggleGoalZones.checked;
            updateGoalZonesVisuals();
            speichereSpielstand();
            console.log(`[Settings] Saved useGoalZones:`, toggleGoalZones.checked);
        };
    }

    if (toggleFieldZones) {
        toggleFieldZones.onchange = () => {
            spielstand.settings.useFieldZones = toggleFieldZones.checked;
            updateFieldZonesVisuals();
            speichereSpielstand();
            console.log(`[Settings] Saved useFieldZones:`, toggleFieldZones.checked);
        };
    }

    /**
     * Shows/Hides the goal zones grid overlay in modals
     */
    function updateGoalZonesVisuals() {
        const isActive = !!spielstand.settings.useGoalZones;
        const groups = document.querySelectorAll('.goal-zones-group');
        groups.forEach(g => {
            if (isActive) g.classList.remove('versteckt');
            else g.classList.add('versteckt');
        });
    }

    /**
     * Shows/Hides the field zones overlay in modals
     */
    function updateFieldZonesVisuals() {
        const isActive = !!spielstand.settings.useFieldZones;
        const groups = document.querySelectorAll('.field-zones-group');
        groups.forEach(g => {
            if (isActive) g.classList.remove('versteckt');
            else g.classList.add('versteckt');
        });
    }

    updateGoalZonesVisuals();
    updateFieldZonesVisuals();

    // Team Name/Color Listeners
    if (myTeamNameInput) {
        myTeamNameInput.oninput = (e) => saveMyTeamName(e.target.value);
    }
    if (myTeamColorInput) {
        myTeamColorInput.oninput = (e) => saveMyTeamColor(e.target.value);
    }
    if (tournamentIdInput) {
        tournamentIdInput.oninput = (e) => {
            spielstand.settings.handballNetTournamentId = e.target.value;
            speichereSpielstand();
        };
    }
    
    const idHelpToggle = document.getElementById('idHelpToggle');
    const idHelpBox = document.getElementById('handballNetIdHelp');
    if (idHelpToggle && idHelpBox) {
        idHelpToggle.onclick = () => {
            idHelpBox.classList.toggle('versteckt');
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

    // Initialize Social Media Settings
    initSocialMediaSettings();
}

/**
 * Social Media Settings (Instagram Ergebnisbild)
 */
export async function initSocialMediaSettings() {
    // Ensure defaults
    const { ensureSocialMediaSettings } = await import('./resultImage.js');
    
    const sm = ensureSocialMediaSettings();

    // --- Image Uploads ---
    const setupImageUpload = (btnId, fileInputId, previewId, settingsKey) => {
        const btn = document.getElementById(btnId);
        const fileInput = document.getElementById(fileInputId);
        const preview = document.getElementById(previewId);
        if (!btn || !fileInput) return;

        btn.onclick = () => fileInput.click();
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (ev) => {
                const img = new Image();
                img.onload = () => {
                    // Resize to max 1200px to save space in Firestore/LocalStorage
                    const MAX_SIZE = 1200;
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > height && width > MAX_SIZE) {
                        height *= MAX_SIZE / width;
                        width = MAX_SIZE;
                    } else if (height > MAX_SIZE) {
                        width *= MAX_SIZE / height;
                        height = MAX_SIZE;
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Compress to JPEG to save space
                    const base64 = canvas.toDataURL('image/jpeg', 0.7);

                    if (!spielstand.settings.socialMedia) spielstand.settings.socialMedia = {};
                    spielstand.settings.socialMedia[settingsKey] = base64;
                    speichereSpielstand();
                    
                    // Update preview
                    if (preview) {
                        preview.innerHTML = '';
                        const previewImg = document.createElement('img');
                        previewImg.src = base64;
                        previewImg.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
                        preview.appendChild(previewImg);
                    }
                    console.log(`[SocialMedia] Saved ${settingsKey}, size: ${Math.round(base64.length / 1024)} KB`);
                };
                img.src = ev.target.result;
            };
            reader.readAsDataURL(file);
        };

        // Restore preview from saved state
        if (sm[settingsKey] && preview) {
            preview.innerHTML = '';
            const img = document.createElement('img');
            img.src = sm[settingsKey];
            img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
            preview.appendChild(img);
        }
    };

    setupImageUpload('smBgUploadBtn', 'smBgFileInput', 'smBgPreview', 'backgroundImage');
    setupImageUpload('smLogoUploadBtn', 'smLogoFileInput', 'smLogoPreview', 'teamLogo');

    // --- Font Family ---
    const fontSelect = document.getElementById('smFontFamily');
    if (fontSelect) {
        fontSelect.value = sm.fontFamily || 'Oswald';
        fontSelect.onchange = () => {
            if (!spielstand.settings.socialMedia) spielstand.settings.socialMedia = {};
            spielstand.settings.socialMedia.fontFamily = fontSelect.value;
            speichereSpielstand();
        };
    }

    // --- Season Name ---
    const seasonInput = document.getElementById('smSeasonName');
    if (seasonInput) {
        seasonInput.value = sm.seasonName || '';
        seasonInput.oninput = () => {
            if (!spielstand.settings.socialMedia) spielstand.settings.socialMedia = {};
            spielstand.settings.socialMedia.seasonName = seasonInput.value;
            speichereSpielstand();
        };
    }

    // --- Team Label ---
    const teamLabelInput = document.getElementById('smTeamLabel');
    if (teamLabelInput) {
        teamLabelInput.value = sm.teamLabel || '';
        teamLabelInput.oninput = () => {
            if (!spielstand.settings.socialMedia) spielstand.settings.socialMedia = {};
            spielstand.settings.socialMedia.teamLabel = teamLabelInput.value;
            speichereSpielstand();
        };
    }

    // --- Overlay Opacity ---
    const opacitySlider = document.getElementById('smOverlayOpacity');
    const opacityValue = document.getElementById('smOverlayValue');
    if (opacitySlider) {
        const pct = Math.round((sm.overlayOpacity ?? 0.55) * 100);
        opacitySlider.value = pct;
        if (opacityValue) opacityValue.textContent = `${pct}%`;
        opacitySlider.oninput = () => {
            if (!spielstand.settings.socialMedia) spielstand.settings.socialMedia = {};
            spielstand.settings.socialMedia.overlayOpacity = parseInt(opacitySlider.value) / 100;
            if (opacityValue) opacityValue.textContent = `${opacitySlider.value}%`;
            speichereSpielstand();
        };
    }

    // --- Team Colors ---
    const ownTeamColorInput = document.getElementById('smOwnTeamColor');
    if (ownTeamColorInput) {
        ownTeamColorInput.value = sm.ownTeamColor || sm.winColor || '#ffffff';
        ownTeamColorInput.oninput = () => {
            sm.ownTeamColor = ownTeamColorInput.value;
            speichereSpielstand();
        };
    }

    const opponentColorInput = document.getElementById('smOpponentColor');
    if (opponentColorInput) {
        opponentColorInput.value = sm.opponentColor || sm.lossColor || '#ef4444';
        opponentColorInput.oninput = () => {
            sm.opponentColor = opponentColorInput.value;
            speichereSpielstand();
        };
    }

    // --- Scorer Sorting ---
    const scorerSortSelect = document.getElementById('smScorerSort');
    if (scorerSortSelect) {
        scorerSortSelect.value = sm.scorerSort || 'goals_desc';
        scorerSortSelect.onchange = () => {
            sm.scorerSort = scorerSortSelect.value;
            speichereSpielstand();
        };
    }

    // --- Scorer Format ---
    const scorerFormatSelect = document.getElementById('smScorerFormat');
    if (scorerFormatSelect) {
        scorerFormatSelect.value = sm.scorerFormat || 'lastname_goals';
        scorerFormatSelect.onchange = () => {
            sm.scorerFormat = scorerFormatSelect.value;
            speichereSpielstand();
        };
    }

    // --- Auto Summary ---
    const autoSummaryInput = document.getElementById('smAutoSummary');
    if (autoSummaryInput) {
        autoSummaryInput.checked = sm.autoSummary !== false;
        autoSummaryInput.onchange = () => {
            sm.autoSummary = autoSummaryInput.checked;
            speichereSpielstand();
        };
    }

    // --- Hashtags ---
    const hashtagsInput = document.getElementById('smHashtags');
    if (hashtagsInput) {
        hashtagsInput.value = sm.hashtags || '';
        hashtagsInput.oninput = () => {
            sm.hashtags = hashtagsInput.value;
            speichereSpielstand();
        };
    }

    // Wire up both the main editor button and the shortcut in Settings
    ['openSmEditorBtn', 'openSmEditorBtnShortcut'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.onclick = async () => {
                const { showResultImageModal } = await import(`./resultImage.js?v=${Date.now()}`);
                // Create dummy game data for the editor preview
                const dummyGame = {
                    id: 'dummy_editor',
                    score: { heim: 27, gegner: 24 },
                    teams: { heim: spielstand.settings.myTeamName || 'Heim', gegner: 'TSV Muster' },
                    date: new Date().toISOString(),
                    settings: { isAuswaertsspiel: false }
                };
                showResultImageModal(dummyGame, true);
            };
        }
    });

    // --- Designs Management Modal ---
    const manageDesignsBtn = document.getElementById('manageSmDesignsBtn');
    console.log('[Settings] manageDesignsBtn found:', !!manageDesignsBtn);
    if (manageDesignsBtn) {
        manageDesignsBtn.onclick = async (e) => {
            e.stopPropagation(); // Prevent outside-click handler from closing modals
            console.log('[Settings] Designs button clicked!');
            const modal = document.getElementById('smDesignsModal');
            const list = document.getElementById('smDesignsList');
            console.log('[Settings] smDesignsModal found:', !!modal, 'smDesignsList found:', !!list);
            if (!modal || !list) return;

            const { ensureSocialMediaSettings } = await import('./resultImage.js');
            const sm = ensureSocialMediaSettings();
            const presets = sm.presets || [];

            if (presets.length === 0) {
                list.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-muted); font-size: 0.9rem;">Keine gespeicherten Designs gefunden.</div>`;
            } else {
                list.innerHTML = '';
                presets.forEach(p => {
                    const item = document.createElement('div');
                    item.className = 'shadcn-card';
                    item.style.padding = '12px 16px';
                    item.style.display = 'flex';
                    item.style.justifyContent = 'space-between';
                    item.style.alignItems = 'center';
                    item.style.background = 'hsl(var(--muted) / 0.1)';
                    item.style.border = '1px solid var(--border-color)';
                    item.style.borderRadius = '8px';

                    item.innerHTML = `
                        <div style="display: flex; flex-direction: column;">
                            <span style="font-weight: 600; font-size: 0.95rem;">${p.name}</span>
                            <span style="font-size: 0.75rem; color: var(--text-muted);">Erstellt: ${new Date(parseInt(p.id)).toLocaleDateString()}</span>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button class="activate-preset-btn shadcn-btn-primary" data-id="${p.id}" style="height: 32px; padding: 0 12px; font-size: 0.8rem;">Aktivieren</button>
                            <button class="delete-preset-btn shadcn-btn-outline" data-id="${p.id}" style="height: 32px; width: 32px; padding: 0; color: #ef4444; border-color: rgba(239,68,68,0.2);"><i data-lucide="trash-2" style="width: 14px; height: 14px;"></i></button>
                        </div>
                    `;
                    list.appendChild(item);
                });

                if (window.lucide) window.lucide.createIcons();

                // Attach listeners
                list.querySelectorAll('.activate-preset-btn').forEach(btn => {
                    btn.onclick = async () => {
                        const id = btn.dataset.id;
                        const preset = presets.find(pr => pr.id === id);
                        if (preset) {
                            const confirmed = await customConfirm(`Möchtest du das Design "${preset.name}" aktivieren? Dies überschreibt deine aktuellen Einstellungen.`, 'Design laden');
                            if (confirmed) {
                                // Keep the presets list!
                                const currentPresets = sm.presets;
                                spielstand.settings.socialMedia = JSON.parse(JSON.stringify(preset.data));
                                spielstand.settings.socialMedia.presets = currentPresets;
                                
                                speichereSpielstand();
                                
                                // Refresh settings UI
                                initSocialMediaSettings();
                                modal.classList.add('versteckt');
                                await customAlert(`Design "${preset.name}" wurde geladen.`, 'Erfolg');
                            }
                        }
                    };
                });

                list.querySelectorAll('.delete-preset-btn').forEach(btn => {
                    btn.onclick = async () => {
                        const id = btn.dataset.id;
                        const presetIndex = presets.findIndex(pr => pr.id === id);
                        if (presetIndex !== -1) {
                            const confirmed = await customConfirm(`Soll das Design "${presets[presetIndex].name}" wirklich gelöscht werden?`, 'Design löschen');
                            if (confirmed) {
                                presets.splice(presetIndex, 1);
                                speichereSpielstand();
                                manageDesignsBtn.click(); // Refresh list
                            }
                        }
                    };
                });
            }

            modal.classList.remove('versteckt');
        };
    }
}

/**
 * Lazy import helper for resultImage module (avoids circular deps)
 */
function importSocialMedia() {
    // Use a synchronous shim; the actual module is loaded when needed
    let cachedModule = null;
    return {
        ensureSocialMediaSettings: () => {
            const defaultPositions = {
                ergebnisLabel: { x: 80, y: 960, fontSize: 110, bold: true },
                seasonLabel: { x: 155, y: 960, fontSize: 28, bold: false },
                statusGroup: { x: 1000, y: 160, fontSize: 72, bold: true },
                dateLabel: { x: 1000, y: 300, fontSize: 24, bold: false },
                vsLabel: { x: 660, y: 560, fontSize: 26, bold: false },
                ourScore: { x: 680, y: 460, fontSize: 160, bold: true },
                theirScore: { x: 680, y: 610, fontSize: 130, bold: true },
                teamLabel: { x: 540, y: 935, fontSize: 22, bold: false },
                logo: { x: 500, y: 950 }
            };

            if (!spielstand.settings.socialMedia) {
                spielstand.settings.socialMedia = {
                    backgroundImage: null,
                    teamLogo: null,
                    fontFamily: 'Oswald',
                    seasonName: '25/26',
                    teamLabel: '1. Herren',
                    overlayOpacity: 0.55,
                    ownTeamColor: '#ffffff',
                    opponentColor: '#ef4444',
                    customElements: [],
                    positions: JSON.parse(JSON.stringify(defaultPositions))
                };
            }
            const defaults = {
                backgroundImage: null, teamLogo: null, fontFamily: 'Oswald',
                seasonName: '25/26', teamLabel: '1. Herren', overlayOpacity: 0.55,
                ownTeamColor: '#ffffff', opponentColor: '#ef4444',
            };
            for (const key in defaults) {
                if (spielstand.settings.socialMedia[key] === undefined) {
                    spielstand.settings.socialMedia[key] = defaults[key];
                }
            }
            if (spielstand.settings.socialMedia.customElements === undefined) {
                spielstand.settings.socialMedia.customElements = [];
            }
            if (!spielstand.settings.socialMedia.positions) {
                spielstand.settings.socialMedia.positions = JSON.parse(JSON.stringify(defaultPositions));
            } else {
                // Ensure all position keys exist with fontSize/bold defaults
                for (const posKey in defaultPositions) {
                    if (!spielstand.settings.socialMedia.positions[posKey]) {
                        spielstand.settings.socialMedia.positions[posKey] = { ...defaultPositions[posKey] };
                    } else {
                        // Ensure fontSize/bold exist on existing positions
                        const p = spielstand.settings.socialMedia.positions[posKey];
                        const d = defaultPositions[posKey];
                        if (p.fontSize === undefined && d.fontSize !== undefined) p.fontSize = d.fontSize;
                        if (p.bold === undefined && d.bold !== undefined) p.bold = d.bold;
                    }
                }
            }
            return spielstand.settings.socialMedia;
        },
        getDefaultPositions: () => {
            return {
                ergebnisLabel: { x: 80, y: 960, fontSize: 110, bold: true },
                seasonLabel: { x: 155, y: 960, fontSize: 28, bold: false },
                statusGroup: { x: 1000, y: 160, fontSize: 72, bold: true },
                dateLabel: { x: 1000, y: 300, fontSize: 24, bold: false },
                vsLabel: { x: 660, y: 580, fontSize: 26, bold: false },
                ourScore: { x: 680, y: 460, fontSize: 160, bold: true },
                theirScore: { x: 680, y: 610, fontSize: 130, bold: true },
                teamLabel: { x: 540, y: 935, fontSize: 22, bold: false },
                logo: { x: 500, y: 950 }
            };
        }
    };
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
