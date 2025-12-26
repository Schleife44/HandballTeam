import { spielstand, speichereSpielstand } from './state.js';
import { zeichneRosterListe } from './ui.js';
import { customAlert, customConfirm } from './customDialog.js';
import { getHistorie } from './history.js';

const SAVED_TEAMS_KEY = 'handball_saved_teams';

// Get all saved teams from localStorage
function getSavedTeams() {
    const saved = localStorage.getItem(SAVED_TEAMS_KEY);
    return saved ? JSON.parse(saved) : { home: [], opponent: [] };
}

// Save teams to localStorage
function setSavedTeams(teams) {
    localStorage.setItem(SAVED_TEAMS_KEY, JSON.stringify(teams));
}

// Save current team
export async function saveCurrentTeam() {
    const teamToggle = document.getElementById('teamToggle');
    const isOpponentMode = teamToggle && teamToggle.checked;

    const teamToSave = isOpponentMode ? spielstand.knownOpponents : spielstand.roster;
    const teamType = isOpponentMode ? 'Gegner' : 'Heim';

    if (teamToSave.length === 0) {
        await customAlert(`Es gibt keine ${teamType}-Spieler zum Speichern.`, "Team leer");
        return;
    }

    // Get team name from input fields
    const rosterTeamNameHeim = document.getElementById('rosterTeamNameHeim');
    const rosterTeamNameGegner = document.getElementById('rosterTeamNameGegner');

    let teamName = isOpponentMode
        ? (rosterTeamNameGegner?.value || '').trim()
        : (rosterTeamNameHeim?.value || '').trim();

    // If no name in fields, prompt via modal
    if (!teamName) {
        teamName = await promptTeamName();
        if (!teamName) {
            return; // User cancelled
        }
    }

    const savedTeams = getSavedTeams();
    const teamKey = isOpponentMode ? 'opponent' : 'home';

    // Create team object
    const teamObject = {
        name: teamName,
        players: JSON.parse(JSON.stringify(teamToSave)), // Deep copy
        savedAt: new Date().toISOString(),
        type: teamType
    };

    // Add to saved teams
    savedTeams[teamKey].push(teamObject);
    setSavedTeams(savedTeams);

    await customAlert(`${teamType}-Team "${teamName}" wurde gespeichert!`, "Team gespeichert");
}

// Prompt for team name via modal
function promptTeamName() {
    return new Promise((resolve) => {
        const saveTeamNameModal = document.getElementById('saveTeamNameModal');
        const saveTeamNameInput = document.getElementById('saveTeamNameInput');
        const saveTeamNameConfirm = document.getElementById('saveTeamNameConfirm');
        const saveTeamNameCancel = document.getElementById('saveTeamNameCancel');

        if (!saveTeamNameModal || !saveTeamNameInput || !saveTeamNameConfirm || !saveTeamNameCancel) {
            resolve(null);
            return;
        }

        saveTeamNameInput.value = '';
        saveTeamNameModal.classList.remove('versteckt');
        saveTeamNameInput.focus();

        const handleConfirm = () => {
            const name = saveTeamNameInput.value.trim();
            cleanup();
            resolve(name || null);
        };

        const handleCancel = () => {
            cleanup();
            resolve(null);
        };

        const handleEnter = (e) => {
            if (e.key === 'Enter') {
                handleConfirm();
            }
        };

        const cleanup = () => {
            saveTeamNameModal.classList.add('versteckt');
            saveTeamNameConfirm.removeEventListener('click', handleConfirm);
            saveTeamNameCancel.removeEventListener('click', handleCancel);
            saveTeamNameInput.removeEventListener('keypress', handleEnter);
        };

        saveTeamNameConfirm.addEventListener('click', handleConfirm);
        saveTeamNameCancel.addEventListener('click', handleCancel);
        saveTeamNameInput.addEventListener('keypress', handleEnter);
    });
}

// Load a saved team
export async function loadSavedTeam(teamKey, index) {
    const savedTeams = getSavedTeams();
    const team = savedTeams[teamKey][index];

    if (!team) {
        await customAlert("Team nicht gefunden.", "Fehler");
        return;
    }

    // Check current toggle state to determine where to load
    const teamToggle = document.getElementById('teamToggle');
    const isOpponentMode = teamToggle && teamToggle.checked;
    const targetType = isOpponentMode ? 'Gegner' : 'Heim';

    const confirmed = await customConfirm(
        `Möchtest du das Team "${team.name}" ins ${targetType}-Team laden? Das aktuelle ${targetType}-Team wird überschrieben.`,
        "Team laden?"
    );

    if (!confirmed) {
        return;
    }

    // Load team based on current toggle state, not original team type
    if (isOpponentMode) {
        // Load into opponent roster
        spielstand.knownOpponents = JSON.parse(JSON.stringify(team.players));
        spielstand.knownOpponents.sort((a, b) => a.number - b.number);
    } else {
        // Load into home roster
        spielstand.roster = JSON.parse(JSON.stringify(team.players));
        spielstand.roster.sort((a, b) => a.number - b.number);
    }

    speichereSpielstand();

    // Update display
    zeichneRosterListe(isOpponentMode);

    // Close modal
    const loadTeamModal = document.getElementById('loadTeamModal');
    if (loadTeamModal) {
        loadTeamModal.classList.add('versteckt');
    }

    await customAlert(`Team "${team.name}" wurde ins ${targetType}-Team geladen!`, "Team geladen");
}

// Delete a saved team
export async function deleteSavedTeam(teamKey, index) {
    const savedTeams = getSavedTeams();
    const team = savedTeams[teamKey][index];

    const confirmed = await customConfirm(
        `Möchtest du das gespeicherte Team "${team.name}" wirklich löschen?`,
        "Team löschen?"
    );

    if (!confirmed) {
        return;
    }

    savedTeams[teamKey].splice(index, 1);
    setSavedTeams(savedTeams);

    // Refresh the list
    showLoadTeamModal();
}

// Load opponent team from game history
export async function loadHistoryTeam(index) {
    const historyTeams = getOpponentTeamsFromHistory();
    const team = historyTeams[index];

    if (!team) return;

    const confirmed = await customConfirm(
        `Möchtest du das Team "${team.name}" aus der Spielhistorie ins Gegner-Team laden? Das aktuelle Gegner-Team wird überschrieben.`,
        "Team laden?"
    );

    if (!confirmed) return;

    // Load into opponent roster - zeichneRosterListe uses knownOpponents!
    const playersToLoad = team.players.map(p => ({
        number: p.number,
        name: p.name || ''
    }));

    spielstand.knownOpponents = playersToLoad;

    // Update team name
    spielstand.settings.teamNameGegner = team.name;

    // Switch to opponent view
    spielstand.activeTeam = 'gegner';

    // Update toggle switch UI
    const teamToggle = document.getElementById('teamToggle');
    if (teamToggle) teamToggle.checked = true;

    speichereSpielstand();
    zeichneRosterListe(true);

    // Close modal
    const loadTeamModal = document.getElementById('loadTeamModal');
    if (loadTeamModal) loadTeamModal.classList.add('versteckt');

    await customAlert(`Team "${team.name}" wurde als Gegner geladen! (${playersToLoad.length} Spieler)`, "Team geladen");
}

// Show load team modal
export function showLoadTeamModal() {
    const savedTeams = getSavedTeams();
    const homeTeams = savedTeams.home || [];
    const opponentTeams = savedTeams.opponent || [];

    const savedTeamsList = document.getElementById('savedTeamsList');
    const loadTeamModal = document.getElementById('loadTeamModal');

    if (!savedTeamsList || !loadTeamModal) return;

    savedTeamsList.innerHTML = '';

    const totalTeams = homeTeams.length + opponentTeams.length;

    if (totalTeams === 0) {
        savedTeamsList.innerHTML = `<p style="text-align: center; color: #999; padding: 20px;">Keine gespeicherten Teams vorhanden.</p>`;
    } else {
        // Show Home Teams
        if (homeTeams.length > 0) {
            const homeHeader = document.createElement('h4');
            homeHeader.textContent = '🏠 Heim Teams';
            homeHeader.style.cssText = 'margin: 10px 0; color: var(--text-main);';
            savedTeamsList.appendChild(homeHeader);

            homeTeams.forEach((team, index) => {
                savedTeamsList.appendChild(createTeamCard(team, index, 'home'));
            });
        }

        // Show Opponent Teams
        if (opponentTeams.length > 0) {
            const opponentHeader = document.createElement('h4');
            opponentHeader.textContent = '🚌 Gegner Teams';
            opponentHeader.style.cssText = 'margin: 20px 0 10px 0; color: var(--text-main);';
            savedTeamsList.appendChild(opponentHeader);

            opponentTeams.forEach((team, index) => {
                savedTeamsList.appendChild(createTeamCard(team, index, 'opponent'));
            });
        }
    }

    // Extract opponent teams from game history (not saved)
    const historyTeams = getOpponentTeamsFromHistory();
    if (historyTeams.length > 0) {
        const historyHeader = document.createElement('h4');
        historyHeader.textContent = '📜 Teams aus vergangenen Spielen';
        historyHeader.style.cssText = 'margin: 20px 0 10px 0; color: var(--text-main);';
        savedTeamsList.appendChild(historyHeader);

        historyTeams.forEach((team, index) => {
            savedTeamsList.appendChild(createHistoryTeamCard(team, index));
        });
    }

    // Update empty message if we have history teams but no saved teams
    if (totalTeams === 0 && historyTeams.length > 0) {
        savedTeamsList.innerHTML = '';
        const historyHeader = document.createElement('h4');
        historyHeader.textContent = '📜 Teams aus vergangenen Spielen';
        historyHeader.style.cssText = 'margin: 20px 0 10px 0; color: var(--text-main);';
        savedTeamsList.appendChild(historyHeader);

        historyTeams.forEach((team, index) => {
            savedTeamsList.appendChild(createHistoryTeamCard(team, index));
        });
    }

    loadTeamModal.classList.remove('versteckt');
}

// Extract opponent teams from game history
function getOpponentTeamsFromHistory() {
    const history = getHistorie() || [];
    const teamsMap = new Map(); // Key: team name, Value: { name, players, gameDate }

    history.forEach(game => {
        const opponentName = game.teams?.gegner || 'Gegner';

        // Get opponent players from gameLog
        const opponentPlayers = new Map(); // Use Map to dedupe by number
        if (game.gameLog) {
            game.gameLog.forEach(entry => {
                // Check for opponent entries - either has gegnerNummer or is a Gegner action
                if (entry.gegnerNummer !== undefined && entry.gegnerNummer !== null) {
                    const num = entry.gegnerNummer;
                    if (!opponentPlayers.has(num)) {
                        opponentPlayers.set(num, {
                            number: num,
                            name: '' // Names aren't stored for opponents in gameLog
                        });
                    }
                }
            });
        }

        if (opponentPlayers.size > 0) {
            const players = Array.from(opponentPlayers.values());

            // Use team name as key - merge players if same team played multiple times
            if (teamsMap.has(opponentName)) {
                const existing = teamsMap.get(opponentName);
                // Merge players (avoid duplicates by number)
                const existingNumbers = new Set(existing.players.map(p => p.number));
                players.forEach(p => {
                    if (!existingNumbers.has(p.number)) {
                        existing.players.push(p);
                    }
                });
            } else {
                teamsMap.set(opponentName, {
                    name: opponentName,
                    players: players,
                    gameDate: game.date || game.savedAt
                });
            }
        }
    });

    return Array.from(teamsMap.values());
}

// Create team card for history teams (simpler, no delete button)
function createHistoryTeamCard(team, index) {
    const teamCard = document.createElement('div');
    teamCard.style.cssText = 'border: 1px solid #ddd; border-radius: 5px; padding: 10px; margin-bottom: 10px; background-color: var(--bg-main);';

    const gameDate = team.gameDate ? new Date(team.gameDate).toLocaleDateString('de-DE') : 'Unbekannt';

    teamCard.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
            <div style="flex: 1; min-width: 150px;">
                <strong>📜 ${team.name}</strong><br>
                <small style="color: #666;">${team.players.length} Spieler · Spiel vom ${gameDate}</small>
            </div>
            <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                <button class="load-history-team-btn" data-index="${index}" 
                    style="background-color: #28a745; color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer; font-size: 0.9rem;">
                    Laden
                </button>
            </div>
        </div>
    `;

    return teamCard;
}

// Create team card for list
function createTeamCard(team, index, teamKey) {
    const teamCard = document.createElement('div');
    teamCard.style.cssText = 'border: 1px solid #ddd; border-radius: 5px; padding: 10px; margin-bottom: 10px; background-color: var(--bg-main);';

    const savedDate = new Date(team.savedAt).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const typeLabel = teamKey === 'home' ? '🏠' : '🚌';

    teamCard.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
            <div style="flex: 1; min-width: 150px;">
                <strong>${typeLabel} ${team.name}</strong><br>
                <small style="color: #666;">${team.players.length} Spieler · ${savedDate}</small>
            </div>
            <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                <button class="view-team-btn" data-key="${teamKey}" data-index="${index}" 
                    style="background-color: #6c757d; color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer; font-size: 0.9rem;">
                    Anschauen
                </button>
                <button class="load-team-btn" data-key="${teamKey}" data-index="${index}" 
                    style="background-color: #28a745; color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer; font-size: 0.9rem;">
                    Laden
                </button>
                <button class="delete-saved-team-btn" data-key="${teamKey}" data-index="${index}"
                    style="background-color: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer; font-size: 0.9rem;">
                    Löschen
                </button>
            </div>
        </div>
    `;

    return teamCard;
}

// View and edit a saved team
export function viewTeam(teamKey, index) {
    const savedTeams = getSavedTeams();
    const team = savedTeams[teamKey][index];

    if (!team) {
        return;
    }

    const viewTeamModal = document.getElementById('viewTeamModal');
    const viewTeamTitle = document.getElementById('viewTeamTitle');
    const editTeamNameInput = document.getElementById('editTeamNameInput');
    const viewTeamPlayersList = document.getElementById('viewTeamPlayersList');

    if (!viewTeamModal || !viewTeamTitle || !editTeamNameInput || !viewTeamPlayersList) return;

    // Store current team info for saving
    viewTeamModal.dataset.teamKey = teamKey;
    viewTeamModal.dataset.teamIndex = index;

    // Set title and name
    const typeLabel = teamKey === 'home' ? '🏠 Heim' : '🚌 Gegner';
    viewTeamTitle.textContent = `${typeLabel} Team bearbeiten`;
    editTeamNameInput.value = team.name;

    // Display players
    viewTeamPlayersList.innerHTML = '';

    if (team.players.length === 0) {
        viewTeamPlayersList.innerHTML = '<p style="text-align: center; color: #999;">Keine Spieler im Team.</p>';
    } else {
        team.players.forEach((player, playerIndex) => {
            const playerCard = document.createElement('div');
            playerCard.style.cssText = 'border: 1px solid #ddd; border-radius: 5px; padding: 8px; margin-bottom: 5px;';

            playerCard.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="number" class="edit-player-number" data-player-index="${playerIndex}" 
                        value="${player.number}" placeholder="Nr."
                        style="width: 60px; padding: 5px; border: 1px solid #ddd; border-radius: 3px;">
                    <input type="text" class="edit-player-name" data-player-index="${playerIndex}" 
                        value="${player.name || ''}" placeholder="Name (optional)"
                        style="flex: 1; padding: 5px; border: 1px solid #ddd; border-radius: 3px;">
                    <button class="delete-team-player-btn" data-player-index="${playerIndex}"
                        style="background-color: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; font-size: 0.85rem;">
                        Löschen
                    </button>
                </div>
            `;

            viewTeamPlayersList.appendChild(playerCard);
        });
    }

    // Close load team modal
    const loadTeamModal = document.getElementById('loadTeamModal');
    if (loadTeamModal) {
        loadTeamModal.classList.add('versteckt');
    }

    viewTeamModal.classList.remove('versteckt');
}

// Update saved team
export async function updateTeam() {
    const viewTeamModal = document.getElementById('viewTeamModal');
    const editTeamNameInput = document.getElementById('editTeamNameInput');
    const viewTeamPlayersList = document.getElementById('viewTeamPlayersList');

    if (!viewTeamModal || !editTeamNameInput) return;

    const teamKey = viewTeamModal.dataset.teamKey;
    const teamIndex = parseInt(viewTeamModal.dataset.teamIndex);

    const newName = editTeamNameInput.value.trim();

    if (!newName) {
        await customAlert("Bitte gib einen Team-Namen ein.", "Name erforderlich");
        return;
    }

    const savedTeams = getSavedTeams();
    const team = savedTeams[teamKey][teamIndex];

    if (!team) return;

    // Update team name
    team.name = newName;

    // Update players from input fields
    if (viewTeamPlayersList) {
        const numberInputs = viewTeamPlayersList.querySelectorAll('.edit-player-number');
        const nameInputs = viewTeamPlayersList.querySelectorAll('.edit-player-name');

        numberInputs.forEach((input, index) => {
            const playerIndex = parseInt(input.dataset.playerIndex);
            if (team.players[playerIndex]) {
                const newNumber = parseInt(input.value, 10);
                const newName = nameInputs[index].value.trim();

                if (!isNaN(newNumber)) {
                    team.players[playerIndex].number = newNumber;
                    team.players[playerIndex].name = newName || '';
                }
            }
        });

        // Sort players by number
        team.players.sort((a, b) => a.number - b.number);
    }

    // Save changes
    setSavedTeams(savedTeams);

    // Close modal and refresh list
    viewTeamModal.classList.add('versteckt');
    await customAlert("Team wurde aktualisiert!", "Gespeichert");
    showLoadTeamModal();
}

// Delete player from saved team
export function deletePlayerFromSavedTeam(playerIndex) {
    const viewTeamModal = document.getElementById('viewTeamModal');

    if (!viewTeamModal) return;

    const teamKey = viewTeamModal.dataset.teamKey;
    const teamIndex = parseInt(viewTeamModal.dataset.teamIndex);

    const savedTeams = getSavedTeams();
    const team = savedTeams[teamKey][teamIndex];

    if (!team) return;

    // Remove player
    team.players.splice(playerIndex, 1);

    // Save changes
    setSavedTeams(savedTeams);

    // Refresh view
    viewTeam(teamKey, teamIndex);
}
