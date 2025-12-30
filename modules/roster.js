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

export async function addPlayer(e) {
    e.preventDefault();
    const name = playerNameInput.value.trim();
    const number = parseInt(playerNumberInput.value, 10);
    const isGoalkeeper = playerTorwartInput.checked;
    const editIndex = editPlayerIndex.value;

    if (isNaN(number)) {
        await customAlert("Bitte gib eine gültige Nummer ein.", "Eingabefehler");
        return;
    }

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
        const existingOpponent = spielstand.knownOpponents.find((opp, i) => opp.number === number && i != editIndex);
        if (existingOpponent) {
            await customAlert("Diese Nummer ist bereits beim Gegner-Team vergeben.", "Nummer belegt");
            return;
        }

        const isGoalkeeper = playerTorwartInput.checked;
        spielstand.knownOpponents.push({ number, name: name || '', isGoalkeeper });
        spielstand.knownOpponents.sort((a, b) => a.number - b.number);
        speichereSpielstand();
        zeichneRosterListe(true);
        zeichneSpielerRaster();
    } else {
        // Add to home team
        const existierenderSpieler = spielstand.roster.find((p, i) => p.number === number && i != editIndex);
        if (existierenderSpieler) {
            await customAlert("Diese Nummer ist bereits vergeben.", "Nummer belegt");
            return;
        }

        if (editIndex) {
            const player = spielstand.roster[editIndex];
            player.name = name;
            player.number = number;
            player.isGoalkeeper = isGoalkeeper;
            schliesseEditModus();
        } else {
            spielstand.roster.push({ name, number, isGoalkeeper });
        }

        spielstand.roster.sort((a, b) => a.number - b.number);
        speichereSpielstand();
        zeichneRosterListe(false);
        zeichneSpielerRaster();
    }

    if (!editIndex) {
        playerNameInput.value = '';
        playerNumberInput.value = '';
        playerTorwartInput.checked = false;
        playerNameInput.focus();
    }
}

export async function deletePlayer(index) {
    const confirmed = await customConfirm(`Spieler "${spielstand.roster[index].name}" wirklich löschen?`, "Spieler löschen?");
    if (confirmed) {
        spielstand.roster.splice(index, 1);
        speichereSpielstand();
        zeichneRosterListe();
        zeichneSpielerRaster();
    }
}

export function oeffneEditModus(index) {
    oeffneEditModusUI(index);
}

export function schliesseEditModus() {
    schliesseEditModusUI();
}

export async function deleteEntireTeam() {
    const isOpponentMode = document.getElementById('teamToggle').getAttribute('aria-checked') === 'true';
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
