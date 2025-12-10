import { spielstand, speichereSpielstand } from './state.js';
import { playerNameInput, playerNumberInput, editPlayerIndex } from './dom.js';
import { zeichneRosterListe, oeffneEditModusUI, schliesseEditModusUI } from './ui.js';

export function addPlayer(e) {
    e.preventDefault();
    const name = playerNameInput.value.trim();
    const number = parseInt(playerNumberInput.value, 10);
    const editIndex = editPlayerIndex.value;

    if (!name || isNaN(number)) {
        alert("Bitte gib einen gültigen Namen und eine Nummer ein.");
        return;
    }

    const existierenderSpieler = spielstand.roster.find((p, i) => p.number === number && i != editIndex);
    if (existierenderSpieler) {
        alert("Diese Nummer ist bereits vergeben.");
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
    zeichneRosterListe();

    if (!editIndex) {
        playerNameInput.value = '';
        playerNumberInput.value = '';
        playerNameInput.focus();
    }
}

export function deletePlayer(index) {
    if (confirm(`Spieler "${spielstand.roster[index].name}" wirklich löschen?`)) {
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
