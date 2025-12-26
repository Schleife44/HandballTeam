import { spielstand, speichereSpielstand } from './state.js';
import { playerNameInput, playerNumberInput, editPlayerIndex, addGegnerModal, addGegnerNummerInput, addGegnerNameInput } from './dom.js';
import { zeichneRosterListe, oeffneEditModusUI, schliesseEditModusUI } from './ui.js';
import { customAlert, customConfirm } from './customDialog.js';

export async function addPlayer(e) {
    e.preventDefault();
    const name = playerNameInput.value.trim();
    const number = parseInt(playerNumberInput.value, 10);
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
    const isOpponentMode = teamToggle && teamToggle.checked;

    if (isOpponentMode) {
        // Add to opponent team
        const existingOpponent = spielstand.knownOpponents.find((opp, i) => opp.number === number && i != editIndex);
        if (existingOpponent) {
            await customAlert("Diese Nummer ist bereits beim Gegner-Team vergeben.", "Nummer belegt");
            return;
        }

        spielstand.knownOpponents.push({ number, name: name || '' });
        spielstand.knownOpponents.sort((a, b) => a.number - b.number);
        speichereSpielstand();
        zeichneRosterListe(true);
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
            schliesseEditModus();
        } else {
            spielstand.roster.push({ name, number });
        }

        spielstand.roster.sort((a, b) => a.number - b.number);
        speichereSpielstand();
        zeichneRosterListe(false);
    }

    if (!editIndex) {
        playerNameInput.value = '';
        playerNumberInput.value = '';
        playerNameInput.focus();
    }
}

export async function deletePlayer(index) {
    const confirmed = await customConfirm(`Spieler "${spielstand.roster[index].name}" wirklich löschen?`, "Spieler löschen?");
    if (confirmed) {
        spielstand.roster.splice(index, 1);
        speichereSpielstand();
        zeichneRosterListe();
    }
}

export function oeffneEditModus(index) {
    oeffneEditModusUI(index);
}

export function schliesseEditModus() {
    schliesseEditModusUI();
}

export async function deleteEntireTeam() {
    const isOpponentMode = document.getElementById('teamToggle').checked;
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
    }
}

export function oeffneOpponentEditModus(index) {
    const opponent = spielstand.knownOpponents[index];
    playerNameInput.value = opponent.name || '';
    playerNumberInput.value = opponent.number;
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

    spielstand.knownOpponents[index] = { number, name: name || '' };
    spielstand.knownOpponents.sort((a, b) => a.number - b.number);
    speichereSpielstand();
    zeichneRosterListe(true);
    schliesseEditModus();
}

export function manageOpponents() {
    // Öffnet das addGegnerModal für Gegnerverwaltung
    addGegnerNummerInput.value = '';
    addGegnerNameInput.value = '';
    addGegnerModal.classList.remove('versteckt');
    addGegnerNummerInput.focus();
}
