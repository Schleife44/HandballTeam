import { spielstand, speichereSpielstand } from './state.js';
import {
    playerNameInput, playerNumberInput, playerTorwartInput, editPlayerIndex,
    addGegnerModal, addGegnerNummerInput, addGegnerNameInput,
    rosterTeamNameHeim, rosterTeamNameGegner, teamColorInput, teamColorInputGegner,
    teamColorTrigger, teamColorTriggerGegner, teamToggle, teamHeaderTitle
} from './dom.js';
import { zeichneRosterListe, zeichneSpielerRaster, oeffneEditModusUI, schliesseEditModusUI, updateScoreDisplay, applyTheme } from './ui.js';
import { customAlert, customConfirm } from './customDialog.js';
import { getContrastTextColor } from './utils.js';
import { updateRosterInputsForValidation } from './settingsManager.js';
import { kickMemberFromTeam, getActiveTeamId, getAuthUid } from './firebase.js';

export async function addPlayer(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    const name = playerNameInput.value.trim();
    const rawNumber = playerNumberInput.value.trim();
    const number = (rawNumber === '' || isNaN(rawNumber)) ? null : parseInt(rawNumber, 10);
    const isGoalkeeper = playerTorwartInput.checked;
    const editIndex = editPlayerIndex.value;

    // Check if editing opponent
    if (editIndex && editIndex.startsWith('opponent_')) {
        const opponentIndex = parseInt(editIndex.replace('opponent_', ''));
        await saveOpponent(opponentIndex);
        return;
    }

    // Check if toggle is set to opponent mode
    const teamToggle = document.getElementById('teamToggle');
    const isOpponentMode = teamToggle && teamToggle.getAttribute('aria-checked') === 'true';

    if (isOpponentMode) {
        // Add to opponent team (Opponents don't have goalie flag yet, or maybe they strictly don't need it)
        if (number !== null) {
            const existingOpponent = spielstand.knownOpponents.find((opp, i) => opp.number === number && i != editIndex);
            if (existingOpponent) {
                await customAlert("Diese Nummer ist bereits beim Gegner-Team vergeben.", "Nummer belegt");
                return;
            }
        }

        const isGoalkeeper = playerTorwartInput.checked;
        spielstand.knownOpponents.push({ number, name: name || '', isGoalkeeper });
        spielstand.knownOpponents.sort((a, b) => {
            if (a.number === null && b.number === null) return 0;
            if (a.number === null) return 1;
            if (b.number === null) return -1;
            return a.number - b.number;
        });
        speichereSpielstand();
        zeichneRosterListe(true);
        zeichneSpielerRaster();
    } else {
        // Add to home team
        if (number !== null) {
            const existierenderSpieler = spielstand.roster.find((p, i) => p.number === number && i != editIndex);
            if (existierenderSpieler) {
                await customAlert("Diese Nummer ist bereits vergeben.", "Nummer belegt");
                return;
            }
        }

        if (editIndex !== "") {
            const player = spielstand.roster[parseInt(editIndex, 10)];
            if (player) {
                player.name = name;
                player.number = number;
                player.isGoalkeeper = isGoalkeeper;
                schliesseEditModus();
            }
        } else {
            spielstand.roster.push({ name, number, isGoalkeeper });
        }

        spielstand.roster.sort((a, b) => {
            if (a.number === null && b.number === null) return 0;
            if (a.number === null) return 1;
            if (b.number === null) return -1;
            return a.number - b.number;
        });
        speichereSpielstand();
        zeichneRosterListe(false);
        zeichneSpielerRaster();
    }

    if (editIndex === "") {
        playerNameInput.value = '';
        playerNumberInput.value = '';
        playerTorwartInput.checked = false;
        playerNameInput.focus();
    }
}

export async function deletePlayer(index) {
    const player = spielstand.roster[index];
    const confirmed = await customConfirm(`Spieler "${player.name}" wirklich löschen?`, "Spieler löschen?");
    if (confirmed) {
        let kickSuccess = true;
        
        // Remove rosterAssignment for this player so the name is freed
        let uidToDelete = null;
        if (spielstand.rosterAssignments) {
            uidToDelete = Object.keys(spielstand.rosterAssignments).find(
                k => spielstand.rosterAssignments[k] === player.name
            );
            
            if (uidToDelete) {
                // Fully kick the user from the team if they are not deleting themselves
                if (uidToDelete !== getAuthUid()) {
                    const kickRes = await kickMemberFromTeam(getActiveTeamId(), uidToDelete);
                    if (!kickRes.success) {
                        await customAlert(`Fehler beim Kick: ${kickRes.error}`);
                        kickSuccess = false;
                    }
                }
            }
        }

        if (kickSuccess) {
            // Find ALL UIDs associated with this player name (in case of duplicates)
            const allUids = spielstand.rosterAssignments 
                ? Object.keys(spielstand.rosterAssignments).filter(k => spielstand.rosterAssignments[k] === player.name)
                : [];

            // Cleanup attendance in calendar events
            if (spielstand.calendarEvents && Array.isArray(spielstand.calendarEvents)) {
                const manualKey = `manual_${player.name.replace(/\s+/g, '_')}`;
                
                spielstand.calendarEvents.forEach(event => {
                    if (event.responses) {
                        // 1. Delete by known keys
                        if (event.responses[manualKey]) delete event.responses[manualKey];
                        allUids.forEach(uid => {
                            if (event.responses[uid]) delete event.responses[uid];
                        });

                        // 2. Search deeper: delete any response where the internal name matches
                        Object.keys(event.responses).forEach(key => {
                            const resp = event.responses[key];
                            if (resp && resp.name === player.name) {
                                delete event.responses[key];
                            }
                        });
                    }
                });
            }

            // Cleanup absences
            if (spielstand.absences && Array.isArray(spielstand.absences)) {
                spielstand.absences = spielstand.absences.filter(abs => {
                    const isNameMatch = abs.name === player.name;
                    const isUidMatch = uidToDelete && abs.uid === uidToDelete;
                    return !(isNameMatch || isUidMatch);
                });
            }

            // Finally, clean up the assignment and the roster entry
            if (uidToDelete && spielstand.rosterAssignments) {
                delete spielstand.rosterAssignments[uidToDelete];
            }
            spielstand.roster.splice(index, 1);

            speichereSpielstand();
            zeichneRosterListe();
            zeichneSpielerRaster();
        }
    }
}

export async function saveInlinePlayer(index, newName, newNumber, isOpponent, isInactive = false) {
    const list = isOpponent ? spielstand.knownOpponents : spielstand.roster;
    const player = list[index];
    if (!player) return;

    const oldName = player.name;
    const oldNumber = player.number;

    // Normalize number
    const normalizedNumber = (newNumber === '' || isNaN(newNumber)) ? null : parseInt(newNumber, 10);

    // Check if number is already taken by someone else
    if (normalizedNumber !== null) {
        const exists = list.find((p, i) => i !== index && p.number === normalizedNumber);
        if (exists) {
            await customAlert(`Die Nummer #${normalizedNumber} ist bereits vergeben.`, "Nummer belegt");
            return;
        }
    }

    player.name = newName.trim();
    player.number = normalizedNumber;
    player.isInactive = isInactive;

    if (!isOpponent && spielstand.rosterAssignments && oldName !== player.name) {
        // Update rosterAssignments if name changed
        const uid = Object.keys(spielstand.rosterAssignments).find(k => spielstand.rosterAssignments[k] === oldName);
        if (uid) {
            spielstand.rosterAssignments[uid] = player.name;
        }
    }

    list.sort((a,b) => a.number - b.number);
    speichereSpielstand();
    
    const { setInlineEditing } = await import('./ui.js');
    setInlineEditing(null, null); // Redraws list automatically
    zeichneSpielerRaster();
}

export function oeffneEditModus(index) {
    oeffneEditModusUI(index);
}

export function schliesseEditModus() {
    schliesseEditModusUI();
}

export async function deleteEntireTeam() {
    const teamToggle = document.getElementById('teamToggle');
    const isOpponentMode = teamToggle && (teamToggle.checked || teamToggle.getAttribute('aria-checked') === 'true');
    const teamToDelete = isOpponentMode ? spielstand.knownOpponents : spielstand.roster;
    const teamName = isOpponentMode ? "Gegner" : "Spieler";

    if (teamToDelete.length === 0) {
        await customAlert(`Es gibt keine ${teamName} zum Löschen.`, "Team leer");
        return;
    }

    const confirmed = await customConfirm(
        `Möchtest du wirklich alle ${teamToDelete.length} ${teamName} löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
        `Gesamtes Team löschen?`
    );

    if (confirmed) {
        if (isOpponentMode) {
            spielstand.knownOpponents = [];
        } else {
            spielstand.roster = [];
            // Remove ALL roster assignments when entire team is deleted
            spielstand.rosterAssignments = {};
        }
        speichereSpielstand();
        zeichneRosterListe(isOpponentMode);
        zeichneSpielerRaster();
        await customAlert(`Alle ${teamName} wurden gelöscht.`, "Team gelöscht");
    }
}

export async function deleteOpponent(index) {
    const opponent = spielstand.knownOpponents[index];
    const displayName = opponent.name ? `#${opponent.number} - ${opponent.name}` : `#${opponent.number}`;
    const confirmed = await customConfirm(`Gegner "${displayName}" wirklich löschen?`, "Gegner löschen?");
    if (confirmed) {
        spielstand.knownOpponents.splice(index, 1);
        speichereSpielstand();
        zeichneRosterListe(true);
        zeichneSpielerRaster();
    }
}

export function oeffneOpponentEditModus(index) {
    const opponent = spielstand.knownOpponents[index];
    playerNameInput.value = opponent.name || '';
    playerNumberInput.value = opponent.number;
    playerTorwartInput.checked = opponent.isGoalkeeper || false;
    editPlayerIndex.value = 'opponent_' + index;
    addPlayerForm.querySelector('button[type="submit"]').textContent = 'Speichern';
    cancelEditButton.classList.remove('versteckt');
}

export async function saveOpponent(index) {
    const name = playerNameInput.value.trim();
    const number = parseInt(playerNumberInput.value, 10);

    if (isNaN(number)) {
        await customAlert("Bitte gib eine gültige Nummer ein.", "Eingabefehler");
        return;
    }

    // Check for duplicates
    const existingOpponent = spielstand.knownOpponents.find((opp, i) => opp.number === number && i != index);
    if (existingOpponent) {
        await customAlert("Diese Nummer ist bereits vergeben.", "Nummer belegt");
        return;
    }

    const isGoalkeeper = playerTorwartInput.checked;
    spielstand.knownOpponents[index] = { number, name: name || '', isGoalkeeper };
    spielstand.knownOpponents.sort((a, b) => a.number - b.number);
    speichereSpielstand();
    zeichneRosterListe(true);
    zeichneSpielerRaster();
    schliesseEditModus();
}

export function manageOpponents() {
    // Öffnet das addGegnerModal für Gegnerverwaltung
    addGegnerNummerInput.value = '';
    addGegnerNameInput.value = '';
    addGegnerModal.classList.remove('versteckt');
    addGegnerNummerInput.focus();
}

export function swapTeams() {
    // Swap Names
    const tempName = spielstand.settings.teamNameHeim;
    spielstand.settings.teamNameHeim = spielstand.settings.teamNameGegner;
    spielstand.settings.teamNameGegner = tempName;

    // Swap Colors
    const tempColor = spielstand.settings.teamColor;
    spielstand.settings.teamColor = spielstand.settings.teamColorGegner;
    spielstand.settings.teamColorGegner = tempColor;

    // Swap Scores (physical swap)
    const tempScore = spielstand.score.heim;
    spielstand.score.heim = spielstand.score.gegner;
    spielstand.score.gegner = tempScore;

    // Toggle Auswärtsspiel state
    spielstand.settings.isAuswaertsspiel = !spielstand.settings.isAuswaertsspiel;

    // Update UI Inputs
    if (rosterTeamNameHeim) rosterTeamNameHeim.value = spielstand.settings.teamNameHeim || '';
    if (rosterTeamNameGegner) rosterTeamNameGegner.value = spielstand.settings.teamNameGegner || '';
    if (teamColorInput) teamColorInput.value = spielstand.settings.teamColor || '#dc3545';
    if (teamColorInputGegner) teamColorInputGegner.value = spielstand.settings.teamColorGegner || '#2563eb';

    const toggleAuswaertsspiel = document.getElementById('toggleAuswaertsspiel');
    if (toggleAuswaertsspiel) toggleAuswaertsspiel.checked = spielstand.settings.isAuswaertsspiel;

    // Update Color Trigger Styles
    if (teamColorTrigger) {
        const icon = teamColorTrigger.querySelector('i') || teamColorTrigger.querySelector('svg');
        if (icon) icon.style.color = spielstand.settings.teamColor;
    }
    if (teamColorTriggerGegner) {
        const icon = teamColorTriggerGegner.querySelector('i') || teamColorTriggerGegner.querySelector('svg');
        if (icon) icon.style.color = spielstand.settings.teamColorGegner;
    }

    // Determine current view state (Heim or Gegner)
    const isOpponentMode = teamToggle && teamToggle.getAttribute('aria-checked') === 'true';

    // Save and Redraw
    speichereSpielstand();
    zeichneRosterListe(isOpponentMode); // Refresh list with current view side
    zeichneSpielerRaster();
    updateScoreDisplay(); // Now handles teamHeaderTitle too
    applyTheme(); // Centralized theme and variable application

    // Update validation state for roster inputs (lock follows the team after swap)
    updateRosterInputsForValidation();
}

/**
 * Handles inline player update from the roster list.
 * Triggered by 'save-player' data-action.
 */
export async function updatePlayerInline(e) {
    const btn = e.target.closest('[data-action="save-player"]');
    if (!btn) return;

    const index = parseInt(btn.dataset.index);
    const isOpponent = btn.dataset.isOpponent === 'true';
    
    // Find the edit container
    const card = btn.closest('.roster-player-card');
    if (!card) return;

    const nameInput = card.querySelector('.inline-name-input');
    const numberInput = card.querySelector('.inline-number-input');
    const twInput = card.querySelector('.inline-tw-input');

    if (!numberInput) return;
    
    const newName = nameInput ? nameInput.value.trim() : '';
    const newNumber = parseInt(numberInput.value, 10);
    const isGoalkeeper = twInput ? twInput.checked : false;

    if (isNaN(newNumber)) {
        await customAlert("Ungültige Nummer.", "Fehler");
        return;
    }

    // Update target array
    if (isOpponent) {
        // Check for duplicates (excluding current index)
        if (spielstand.knownOpponents.some((p, i) => i !== index && p.number === newNumber)) {
            await customAlert("Diese Nummer ist bereits vergeben.", "Nummer belegt");
            return;
        }
        spielstand.knownOpponents[index] = {
            ...spielstand.knownOpponents[index],
            name: newName,
            number: newNumber,
            isGoalkeeper: isGoalkeeper
        };
        spielstand.knownOpponents.sort((a, b) => a.number - b.number);
    } else {
        // Check for duplicates
        if (spielstand.roster.some((p, i) => i !== index && p.number === newNumber)) {
            await customAlert("Diese Nummer ist bereits vergeben.", "Nummer belegt");
            return;
        }
        spielstand.roster[index] = {
            ...spielstand.roster[index],
            name: newName,
            number: newNumber,
            isGoalkeeper: isGoalkeeper
        };
        spielstand.roster.sort((a, b) => a.number - b.number);
    }

    speichereSpielstand();
    zeichneRosterListe(isOpponent);
    zeichneSpielerRaster();
}
