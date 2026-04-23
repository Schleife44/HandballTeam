// modules/eventListeners.js
// All Event Listener Registrations

import { spielstand, speichereSpielstand } from './state.js';
import { calculateGoalZone, calculateFieldZone } from './utils.js';

import {
    addPlayerForm, cancelEditButton, exportTeamButton,
    importTeamButton, importFileInput, backToRosterButton, gamePhaseButton,
    deleteTeamButton, teamToggle, teamHeaderTitle,
    rosterTeamNameHeim, rosterTeamNameGegner,
    seasonOverviewButton, seasonOverviewModal, seasonSummary, seasonStatsContainer, seasonOverviewClose,
    pauseButton, zurueckButton, vorButton, neuesSpielButton,
    heimScoreUp, heimScoreDown, gegnerScoreUp, gegnerScoreDown,
    aktionAbbrechen, guteAktionModalButton, aktionVorauswahlAbbrechen,
    inputTeamNameHeim, inputTeamNameGegner, toggleAuswaertsspiel, inputGoalSvg, wurfbildUeberspringen,
    settingsBereich, myTeamNameInput,
    closeWurfbilderStats, gegnerNummerSpeichern,
    gegnerNummerUeberspringen, aktionsMenue, aktionVorauswahl,
    kommentarBereich, kommentarTitel, kommentarInput,
    wurfbilderStatsModal, neueGegnerNummer, sevenMeterOutcomeModal,
    rosterBereich, spielBereich, globalAktionen, scoreWrapper, timerAnzeige,
    statistikWrapper, rosterListe, heimSpielerRaster, gegnerSpielerRaster, protokollAusgabe, bekannteGegnerListe,
    wurfbildUmgebung, addGegnerModal, addGegnerNummerInput, addGegnerNameInput, addGegnerTorwartInput, addGegnerSpeichern, addGegnerAbbrechen, neueGegnerName, neueGegnerTorwart,
    quickAddPlayerModal, quickPlayerNumber, quickPlayerName, quickPlayerTorwart, quickAddPlayerSave, quickAddPlayerCancel,
    saveTeamButton, loadTeamButton, loadTeamModal, savedTeamsList, loadTeamCancel,
    viewTeamModal, viewTeamTitle, editTeamNameInput, viewTeamPlayersList, saveTeamChanges, viewTeamClose,
    rosterSwapTeamsBtn,
    toggleWurfpositionHeim, toggleWurfpositionGegner, wurfpositionModal, wurfpositionFeld, wurfpositionUeberspringen,
    combinedThrowModal, combinedWurfpositionFeld, combinedWurfbildUmgebung, combinedGoalSvg,
    combinedFieldMarker, combinedGoalMarker, combinedThrowSave, combinedThrowSkip, toggleCombinedThrow,
    combinedAssistPlayerList, combinedAssistNone, combinedPlayTypeList,
    heatmapSvg,
    heatmapTeamToggle, heatmapPlayerSelect, heatmapToreFilter, heatmapMissedFilter, heatmap7mFilter,
    spielBeendenButton, historieBereich, historieListe, backToStartFromHistory, historyButton,


    historieDetailBereich, backToHistoryList, histDetailTeams, histDetailScore, histDetailDate,
    histStatsBody, histStatsGegnerBody,
    histHeatmapSvg, histTabHeatmap, histTabProtokoll, histTabTorfolge, histSubTabTor, histSubTabFeld,
    histContentHeatmap, histContentProtokoll, histContentTorfolge, histProtokollAusgabe, histTorfolgeChart, exportHistorieButton,
    importSpielButton, importSpielInput,
    histHeatmapToreFilter, histHeatmapMissedFilter,
    liveOverviewHeatmapToreFilter, liveOverviewHeatmapMissedFilter, liveOverviewHeatmap7mFilter,
    liveOverviewHeatmapSvg,
    mobileMenuBtn, sidebarOverlay, sidebar, navItems,
    closeCombinedThrowModal,
    closeEventModal, saveEventBtn, cancelEventBtn
} from './dom.js';
import { handlePrevMonth, handleNextMonth, openAddEventModal, closeAddEventModal, saveEvent } from './calendar.js';
import { addPlayer, schliesseEditModus, oeffneEditModus, deletePlayer, deleteEntireTeam, deleteOpponent, oeffneOpponentEditModus, swapTeams } from './roster.js';
import {
    switchToGame, switchToRoster, handleGamePhaseClick, handleRealPauseClick,
    logGlobalAktion, logScoreKorrektur, schliesseAktionsMenue, logAktion,
    setAktuelleAktionTyp, aktuelleAktionTyp, speichereGegnerNummer,
    skipGegnerNummer, handle7mOutcome, starteNeuesSpiel, setSteuerungAktiv,
    loescheProtokollEintrag, selectPlayer, executeAction, deselectPlayer
} from './game.js';
import { handleZeitSprung } from './timer.js';
import { exportTeam, handleFileImport, exportiereAlsPdf } from './export.js';
import {
    applyTheme, applyViewSettings, updateScoreDisplay, updateProtokollAnzeige,
    schliesseWurfbildModal, zeigeWurfstatistik, zeichneSpielerRaster, oeffneWurfbildModal,
    zeichneRosterListe, showLiveGameOverview, updateHeatmapPlayerSelect
} from './ui.js';
import { exportHistorie, importiereSpiel } from './history.js';
import { handleSpielBeenden, renderHistoryList } from './historyView.js';
import { renderHeatmap, setCurrentHeatmapTab, setCurrentHeatmapContext, currentHeatmapContext } from './heatmap.js';
import { saveCurrentTeam, showLoadTeamModal, loadSavedTeam, deleteSavedTeam, viewTeam, updateTeam, deletePlayerFromSavedTeam, loadHistoryTeam } from './teamStorage.js';
import { openSeasonOverview, closeSeasonOverview, showPlayerHeatmap, showTeamHeatmap } from './seasonView.js';
import { customAlert } from './customDialog.js';
import { validateTeamSettings, initSettingsPage, saveMyTeamName, saveMyTeamColor, updateRosterInputsForValidation, toggleValidation } from './settingsManager.js';
import { addFineToCatalog, issueFine, renderFinesView, updateFinesSettings } from './fines.js';

// --- Register All Event Listeners ---
let listenersRegistered = false;
export function registerEventListeners() {
    if (listenersRegistered) return;
    listenersRegistered = true;
    // === Bildschirm 1: Roster ===
    addPlayerForm.addEventListener('submit', addPlayer);
    cancelEditButton.addEventListener('click', schliesseEditModus);
    exportTeamButton.addEventListener('click', exportTeam);
    importTeamButton.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', handleFileImport);

    deleteTeamButton.addEventListener('click', deleteEntireTeam);

    // Team Namen in Roster
    if (rosterTeamNameHeim) {
        rosterTeamNameHeim.addEventListener('input', (e) => {
            if (!spielstand.settings) spielstand.settings = {};
            spielstand.settings.teamNameHeim = e.target.value || 'Heim';
            speichereSpielstand();
        });
    }

    if (rosterTeamNameGegner) {
        rosterTeamNameGegner.addEventListener('input', (e) => {
            if (!spielstand.settings) spielstand.settings = {};
            spielstand.settings.teamNameGegner = e.target.value || 'Gegner';
            speichereSpielstand();
        });
    }

    if (teamColorInput) {
        teamColorInput.addEventListener('input', (e) => {
            if (!spielstand.settings) spielstand.settings = {};
            spielstand.settings.teamColor = e.target.value;
            speichereSpielstand();
            applyTheme();
        });
    }

    if (teamColorInputGegner) {
        teamColorInputGegner.addEventListener('input', (e) => {
            if (!spielstand.settings) spielstand.settings = {};
            spielstand.settings.teamColorGegner = e.target.value;
            speichereSpielstand();
            applyTheme();
        });
    }



    // View Team Modal
    if (saveTeamChanges) {
        saveTeamChanges.addEventListener('click', updateTeam);
    }

    if (viewTeamClose) {
        viewTeamClose.addEventListener('click', () => {
            viewTeamModal.classList.add('versteckt');
            showLoadTeamModal(); // Return to team list
        });
    }

    if (viewTeamPlayersList) {
        viewTeamPlayersList.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-team-player-btn')) {
                const playerIndex = parseInt(e.target.dataset.playerIndex);
                deletePlayerFromSavedTeam(playerIndex);
            }
        });
    }

    if (viewTeamPlayersList) {
        viewTeamPlayersList.addEventListener('click', (e) => {
            if (e.target.classList.contains('show-heatmap-btn')) {
                const playerIndex = parseInt(e.target.dataset.playerIndex);
                const mode = e.target.dataset.mode || 'field';
                showPlayerHeatmap(playerIndex, mode);
            }
        });
    }

    // Team Toggle Switch
    if (teamToggle) {
        teamToggle.addEventListener('click', (e) => {
            // Toggle state
            const isChecked = teamToggle.getAttribute('aria-checked') === 'true';
            const newState = !isChecked;

            teamToggle.setAttribute('aria-checked', newState);
            teamToggle.dataset.state = newState ? 'checked' : 'unchecked';

            teamHeaderTitle.textContent = newState ? 'Gegner Team' : 'Heim Team';
            zeichneRosterListe(newState);
            // Also need to redraw grid so action buttons have correct context if needed
            // But zeichneRosterListe handles the list.
        });
    }

    // === Roster Action Delegation (Fix for Circular Dependency) ===
    if (rosterListe) {
        rosterListe.addEventListener('click', async (e) => {
            const btn = e.target.closest('button');
            if (!btn || !btn.dataset.action) return;

            const action = btn.dataset.action;
            const index = parseInt(btn.dataset.index);
            const isOpponent = btn.dataset.isOpponent === 'true';

            if (action === 'delete-player') {
                if (isOpponent) {
                    await deleteOpponent(index);
                } else {
                    await deletePlayer(index);
                }
            } else if (action === 'save-player') {
                const card = btn.closest('.roster-player-card');
                if (!card) return;

                const nameInput = card.querySelector('.inline-name-input');
                const numInput = card.querySelector('.inline-number-input');
                const twInput = card.querySelector('.inline-tw-input');

                if (!nameInput || !numInput) return;

                const newName = nameInput.value.trim();
                const newNum = parseInt(numInput.value);
                const newTw = twInput ? twInput.checked : false;

                if (isNaN(newNum)) {
                    await customAlert('Bitte Nummer eingeben');
                    return;
                }

                const list = isOpponent ? spielstand.knownOpponents : spielstand.roster;
                
                // Duplicate check
                const duplicate = list.find((p, i) => i !== index && p.number === newNum);
                if (duplicate) {
                    await customAlert('Diese Nummer ist bereits vergeben.');
                    return;
                }

                const player = list[index];
                if (player) {
                    player.name = newName;
                    player.number = newNum;
                    player.isGoalkeeper = newTw;
                    list.sort((a, b) => a.number - b.number);
                    speichereSpielstand();
                    zeichneRosterListe(isOpponent);
                    zeichneSpielerRaster();
                }
            }
        });
    }


    // Event delegation for heatmap buttons in season view
    if (seasonStatsContainer) {
        seasonStatsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('show-heatmap-btn')) {
                const playerIndex = parseInt(e.target.dataset.playerIndex);
                const mode = e.target.dataset.mode || 'field';
                showPlayerHeatmap(playerIndex, mode);
            } else if (e.target.classList.contains('show-team-heatmap-btn')) {
                const teamName = e.target.dataset.team;
                showTeamHeatmap(teamName);
            }
        });
    }
    if (backToStartFromHistory) {
        backToStartFromHistory.addEventListener('click', () => {
            historieBereich.classList.add('versteckt');
            // Prüfe ob ein Spiel aktiv ist
            if (spielstand.uiState === 'game') {
                // Zurück zur Spielansicht
                spielBereich.classList.remove('versteckt');
            } else {
                // Zurück zur Roster-Ansicht
                rosterBereich.classList.remove('versteckt');
            }
        });
    }
    if (exportHistorieButton) {
        exportHistorieButton.addEventListener('click', exportHistorie);
    }

    // === Import Spiel Button ===
    if (importSpielButton && importSpielInput) {
        importSpielButton.addEventListener('click', () => importSpielInput.click());
        importSpielInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                const result = await importiereSpiel(file);
                if (result.success) {
                    renderHistoryList();
                }
                // Use alert for now (could be customAlert later)
                customAlert(result.message);
                importSpielInput.value = ''; // Reset input
            }
        });
    }

    if (backToHistoryList) {
        backToHistoryList.addEventListener('click', () => {
            historieDetailBereich.classList.add('versteckt');
            historieBereich.classList.remove('versteckt');
        });
    }

    // === History Detail Tabs ===
    if (histTabHeatmap && histTabProtokoll && histTabTorfolge) {
        histTabHeatmap.addEventListener('click', () => {
            histTabHeatmap.classList.add('active');
            histTabProtokoll.classList.remove('active');
            histTabTorfolge.classList.remove('active');

            // Unified View: Show Heatmap Content
            histContentHeatmap.classList.remove('versteckt');
            
            // Re-apply hiding IF it's an imported game
            if (histContentHeatmap.dataset.isImportedOnly === "true") {
                histContentHeatmap.classList.add('hide-heatmap-visuals');
            } else {
                histContentHeatmap.classList.remove('hide-heatmap-visuals');
            }

            // Hide others
            histContentProtokoll.classList.add('versteckt');
            histContentTorfolge.classList.add('versteckt');
        });
        histTabProtokoll.addEventListener('click', () => {
            histTabProtokoll.classList.add('active');
            histTabHeatmap.classList.remove('active');
            histTabTorfolge.classList.remove('active');
            histContentProtokoll.classList.remove('versteckt');

            histContentHeatmap.classList.add('versteckt');
            histContentTorfolge.classList.add('versteckt');
        });
        histTabTorfolge.addEventListener('click', () => {
            histTabTorfolge.classList.add('active');
            histTabHeatmap.classList.remove('active');
            histTabProtokoll.classList.remove('active');
            histContentTorfolge.classList.remove('versteckt');

            histContentHeatmap.classList.add('versteckt');
            histContentProtokoll.classList.add('versteckt');
        });
    }

    // === Bildschirm 2: Game (Redundant: Moved to events.js) ===
    /*
    if (gamePhaseButton) gamePhaseButton.addEventListener('click', handleGamePhaseClick);
    if (pauseButton) pauseButton.addEventListener('click', handleRealPauseClick);
    if (zurueckButton) zurueckButton.addEventListener('click', () => handleZeitSprung(-30));
    if (vorButton) vorButton.addEventListener('click', () => handleZeitSprung(30));
    if (neuesSpielButton) neuesSpielButton.addEventListener('click', starteNeuesSpiel);
    */
    // Redundant handleRosterClick removed (Handled by events.js delegation)

    // === Add/Edit Player Button Handler (Simple Mode) ===
    const handleAddPlayerClick = (e) => {
        const btn = e.target.closest('.add-player-button');
        if (!btn) return;

        const action = btn.dataset.action;
        if (action === 'quickAdd') {
            if (quickAddPlayerModal) {
                quickAddPlayerModal.classList.remove('versteckt');
                if (quickPlayerNumber) quickPlayerNumber.focus();
            }
        } else if (action === 'addOpponent') {
            if (addGegnerModal) {
                addGegnerModal.classList.remove('versteckt');
                if (addGegnerNummerInput) addGegnerNummerInput.focus();
            }
        }
    };

    if (heimActiveRoster) heimActiveRoster.addEventListener('click', handleAddPlayerClick);
    if (gastActiveRoster) gastActiveRoster.addEventListener('click', handleAddPlayerClick);

    // Redundant Game actions moved to events.js delegation hub


    // === Heatmap Filters (Main & Live Overview) ===
    const triggerHeatmapUpdate = (svg, context) => {
        // Ensure context is set if we are in that mode?
        // Actually renderHeatmap checks global context. 
        // If we are in live overview, context is 'liveOverview'.
        renderHeatmap(svg, null, false);
    };

    // Main Heatmap Filters
    if (heatmapToreFilter && heatmapSvg) heatmapToreFilter.addEventListener('change', () => renderHeatmap(heatmapSvg));
    if (heatmapMissedFilter && heatmapSvg) heatmapMissedFilter.addEventListener('change', () => renderHeatmap(heatmapSvg));
    if (heatmap7mFilter && heatmapSvg) heatmap7mFilter.addEventListener('change', () => renderHeatmap(heatmapSvg));



    // Live Overview Heatmap Filters
    if (liveOverviewHeatmapToreFilter && liveOverviewHeatmapSvg) liveOverviewHeatmapToreFilter.addEventListener('change', () => renderHeatmap(liveOverviewHeatmapSvg));
    if (liveOverviewHeatmapMissedFilter && liveOverviewHeatmapSvg) liveOverviewHeatmapMissedFilter.addEventListener('change', () => renderHeatmap(liveOverviewHeatmapSvg));
    if (liveOverviewHeatmap7mFilter && liveOverviewHeatmapSvg) liveOverviewHeatmap7mFilter.addEventListener('change', () => renderHeatmap(liveOverviewHeatmapSvg));

    // Live Overview Team Toggles
    const liveTeamRadios = document.querySelectorAll('input[name="liveOverviewHeatTeam"]');
    liveTeamRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (currentHeatmapContext === 'liveOverview') {
                renderHeatmap(liveOverviewHeatmapSvg);
            }
        });
    });

    // === Score Korrektur ===
    if (heimScoreUp) heimScoreUp.addEventListener('click', () => {
        const target = spielstand.settings.isAuswaertsspiel ? 'gegner' : 'heim';
        logScoreKorrektur(target, 1);
    });
    if (heimScoreDown) heimScoreDown.addEventListener('click', () => {
        const target = spielstand.settings.isAuswaertsspiel ? 'gegner' : 'heim';
        if (spielstand.score[target] > 0) logScoreKorrektur(target, -1);
    });
    if (gegnerScoreUp) gegnerScoreUp.addEventListener('click', () => {
        const target = spielstand.settings.isAuswaertsspiel ? 'heim' : 'gegner';
        logScoreKorrektur(target, 1);
    });
    if (gegnerScoreDown) gegnerScoreDown.addEventListener('click', () => {
        const target = spielstand.settings.isAuswaertsspiel ? 'heim' : 'gegner';
        if (spielstand.score[target] > 0) logScoreKorrektur(target, -1);
    });

    // === Modal 3: Kommentar ===



    // === Modal 3: Kommentar ===
    if (kommentarSpeichernButton) kommentarSpeichernButton.addEventListener('click', () => {
        const kommentar = kommentarInput.value.trim() || null;
        logAktion(aktuelleAktionTyp, kommentar);
        kommentarInput.value = '';
    });

    // ... (Einstellungen listeners omitted for brevity if unchanged) ...

    // === Action Menu Event Delegation (Shadcn) ===
    if (aktionsMenue) {
        aktionsMenue.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-aktion]');
            if (btn) {
                const aktion = btn.dataset.aktion;
                if (aktion === 'Anderes') {
                    aktionsMenue.classList.add('versteckt');
                    aktionVorauswahl.classList.remove('versteckt');
                } else {
                    logAktion(aktion);
                }
            }
        });
    }

    // Settings page listeners moved to settingsManager.js

    // Note: Most settings-page listeners have been moved to settingsManager.js (initSettingsPage)
    // to ensure visual state and saving are always synchronized.


    // === Auswärtsspiel Toggle ===

    if (toggleAuswaertsspiel) {
        toggleAuswaertsspiel.addEventListener('change', (e) => {
            if (!spielstand.settings) spielstand.settings = {};
            spielstand.settings.isAuswaertsspiel = e.target.checked;
            updateScoreDisplay();
            zeichneSpielerRaster();
            speichereSpielstand();
        });
    }

    // === Attributed Player Logic ===
    const attributedPlayerModal = document.getElementById('attributedPlayerModal');
    const attributedPlayerCancel = document.getElementById('attributedPlayerCancel');

    if (attributedPlayerCancel) {
        attributedPlayerCancel.addEventListener('click', () => {
            attributedPlayerModal.classList.add('versteckt');
            // Just close, current temp action stays incomplete (no attribution in log)
        });
    }
    // === Wurfposition Logic ===
    if (wurfpositionFeld) {
        wurfpositionFeld.addEventListener('click', (e) => {
            const svg = wurfpositionFeld.querySelector('svg');
            const rect = svg.getBoundingClientRect();

            const viewBox = svg.viewBox.baseVal;
            const viewBoxWidth = viewBox.width || 300;
            const viewBoxHeight = viewBox.height || 400;

            const clickXOffset = e.clientX - rect.left;
            const clickYOffset = e.clientY - rect.top;

            const scaleX = rect.width / viewBoxWidth;
            const scaleY = rect.height / viewBoxHeight;

            const svgX = clickXOffset / scaleX;
            const svgY = clickYOffset / scaleY;

            let finalX, finalY, zoneId;

            // Zone Mode
            if (spielstand.settings.useFieldZones) {
                const zonePath = e.target.closest('.field-zone-path');
                if (zonePath) {
                    zoneId = parseInt(zonePath.getAttribute('data-zone'));
                    
                    // Tactical Snap Points
                    const snapPoints = {
                        1: { x: 60, y: 45 },
                        2: { x: 75, y: 95 },
                        3: { x: 150, y: 115 },
                        4: { x: 225, y: 95 },
                        5: { x: 240, y: 45 },
                        6: { x: 40, y: 180 },
                        7: { x: 150, y: 180 },
                        8: { x: 260, y: 180 },
                        9: { x: 150, y: 280 }
                    };

                    const point = snapPoints[zoneId] || { x: 150, y: 200 };
                    finalX = ((point.x - 10) / 280) * 100;
                    finalY = ((point.y - 10) / 380) * 100;
                }
            }

            if (finalX === undefined) {
                // Exact Mode
                finalX = ((svgX - 10) / 280) * 100;
                finalY = ((svgY - 10) / 380) * 100;
                zoneId = calculateFieldZone(finalX, finalY);
            }

            if (spielstand.gameLog.length > 0) {
                spielstand.gameLog[0].wurfposition = { 
                    x: finalX.toFixed(1), 
                    y: finalY.toFixed(1),
                    zone: zoneId
                };
                speichereSpielstand();
            }

            wurfpositionModal.classList.add('versteckt');

            const lastEntry = spielstand.gameLog[0];
            const isOpponent = lastEntry && (lastEntry.action.startsWith('Gegner') || lastEntry.gegnerNummer);

            // Logic: Determine active side (Heim/Gest) for settings check
            const isAuswaerts = spielstand.settings.isAuswaertsspiel;
            let sideIsHeim = false;
            if (isOpponent) {
                sideIsHeim = isAuswaerts;
            } else {
                sideIsHeim = !isAuswaerts;
            }

            const showWurfbild = sideIsHeim ? spielstand.settings.showWurfbildHeim : spielstand.settings.showWurfbildGegner;

            if (showWurfbild && lastEntry && (lastEntry.action === 'Tor' || lastEntry.action === 'Fehlwurf' || lastEntry.action === 'Parade' || lastEntry.action === 'Gehalten' || lastEntry.action === 'Gegner Tor' || lastEntry.action === 'Gegner Wurf Vorbei' || lastEntry.action === 'Gegner Parade' || lastEntry.action === 'Gegner Fehlwurf')) {
                oeffneWurfbildModal(isOpponent ? 'gegner' : 'standard');
            } else if (lastEntry && (lastEntry.action === 'Block' || lastEntry.action === 'Gegner Block')) {
                import('./game.js').then(game => {
                    game.oeffneAttributedPlayerModal(isOpponent ? 'myteam' : 'opponent', "Blocker auswählen", "Wer hat den Wurf geblockt?");
                });
            }
        });
    }

    // === Score Adjustment Buttons (Simple Mode) ===
    document.body.addEventListener('click', (e) => {
        const btn = e.target.closest('.score-adjust-btn');
        if (!btn) return;

        const team = btn.dataset.team; // 'heim' or 'gegner'
        const delta = parseInt(btn.dataset.delta, 10);

        if (team && !isNaN(delta)) {
            // Apply correction directly
            if (team === 'heim') {
                spielstand.score.heim = Math.max(0, spielstand.score.heim + delta);
            } else if (team === 'gegner') {
                spielstand.score.gegner = Math.max(0, spielstand.score.gegner + delta);
            }

            // Log this correction? "Manuelle Korrektur"?
            // For Simple Mode, user might expect logs.
            const timestamp = spielstand.timer.minutes + ':' + (spielstand.timer.seconds < 10 ? '0' + spielstand.timer.seconds : spielstand.timer.seconds);
            spielstand.gameLog.push({
                time: timestamp,
                action: delta > 0 ? "Manuelle Korrektur (+)" : "Manuelle Korrektur (-)",
                team: team === 'heim' ? "Heim" : "Gegner",
                details: `Score geändert um ${delta}`
            });

            updateScoreDisplay(); // ui.js
            speichereSpielstand(); // state.js
            updateProtokollAnzeige(); // ui.js
        }
    });

    if (wurfpositionUeberspringen) {
        wurfpositionUeberspringen.addEventListener('click', () => {
            wurfpositionModal.classList.add('versteckt');

            if (spielstand.gameLog.length > 0) {
                const lastEntry = spielstand.gameLog[0];
                const isOpponent = lastEntry && (lastEntry.action.startsWith('Gegner') || lastEntry.gegnerNummer);

                // Logic: Determine active side (Heim/Gest) for settings check
                const isAuswaerts = spielstand.settings.isAuswaertsspiel;
                let sideIsHeim = false;
                if (isOpponent) {
                    sideIsHeim = isAuswaerts;
                } else {
                    sideIsHeim = !isAuswaerts;
                }

                const showWurfbild = sideIsHeim ? spielstand.settings.showWurfbildHeim : spielstand.settings.showWurfbildGegner;

                if (showWurfbild && (lastEntry.action === 'Tor' || lastEntry.action === 'Fehlwurf' || lastEntry.action === 'Parade' || lastEntry.action === 'Gehalten' || lastEntry.action === 'Gegner Tor' || lastEntry.action === 'Gegner Wurf Vorbei' || lastEntry.action === 'Gegner Parade' || lastEntry.action === 'Gegner Fehlwurf')) {
                    oeffneWurfbildModal(isOpponent ? 'gegner' : 'standard');
                } else if (lastEntry.action === 'Block') {
                    import('./game.js').then(game => {
                        game.oeffneAttributedPlayerModal(isOpponent ? 'myteam' : 'opponent', "Blocker auswählen", "Wer hat den Wurf geblockt?");
                    });
                }
            }
        });
    }

    // === Wurfbild Logic ===
    if (wurfbildUmgebung) {
        wurfbildUmgebung.addEventListener('click', (e) => {
            const rect = inputGoalSvg.getBoundingClientRect();
            const viewBox = inputGoalSvg.viewBox.baseVal;
            const vbWidth = viewBox.width || 300;
            const vbHeight = viewBox.height || 200;

            const clickXOffset = e.clientX - rect.left;
            const clickYOffset = e.clientY - rect.top;

            const scaleX = rect.width / vbWidth;
            const scaleY = rect.height / vbHeight;

            // Coordinate in SVG space
            const svgX = clickXOffset / scaleX;
            const svgY = clickYOffset / scaleY;

            let finalX, finalY, zoneId;

            // Check if Zone mode is active
            if (spielstand.settings.useGoalZones) {
                const zoneRect = e.target.closest('.goal-zone-rect');
                if (zoneRect) {
                    zoneId = parseInt(zoneRect.getAttribute('data-zone'));
                    // Center of the zone rect
                    finalX = parseFloat(zoneRect.getAttribute('x')) + (parseFloat(zoneRect.getAttribute('width')) / 2);
                    finalY = parseFloat(zoneRect.getAttribute('y')) + (parseFloat(zoneRect.getAttribute('height')) / 2);
                    
                    // Convert back to percentages (0-100)
                    finalX = ((finalX - 25) / 250) * 100;
                    finalY = ((finalY - 10) / 180) * 100;
                }
            }

            if (finalX === undefined) {
                // Exact mode (or click outside zones)
                finalX = ((svgX - 25) / 250) * 100;
                finalY = ((svgY - 10) / 180) * 100;
                zoneId = calculateGoalZone(finalX, finalY);
            }

            if (spielstand.gameLog.length > 0) {
                const lastEntry = spielstand.gameLog[0];
                // Explicitly set color to null so heatmap.js uses dynamic logic
                lastEntry.wurfbild = { 
                    x: finalX.toFixed(1), 
                    y: finalY.toFixed(1), 
                    zone: zoneId,
                    color: null 
                };
                speichereSpielstand();
            }

            // Visual highlight (optional here as modal closes, but for consistency)
            const zoneRect = e.target.closest('.goal-zone-rect');
            if (zoneRect) {
                const parent = zoneRect.closest('svg');
                parent.querySelectorAll('.goal-zone-rect').forEach(r => r.classList.remove('selected-zone'));
                zoneRect.classList.add('selected-zone');
            }

            spielstand.tempGegnerNummer = null;
            spielstand.temp7mOutcome = null;

            schliesseWurfbildModal();
        });
    }

    if (wurfbildUeberspringen) {
        wurfbildUeberspringen.addEventListener('click', schliesseWurfbildModal);
    }

    // === Combined Throw Modal Logic ===
    // Note: tempCombinedField and tempCombinedGoal are now stored in spielstand for cross-module pre-selection

    if (combinedWurfpositionFeld) {
        combinedWurfpositionFeld.addEventListener('click', (e) => {
            let svg = combinedWurfpositionFeld;
            if (svg.tagName !== 'svg') {
                const found = svg.querySelector('svg');
                if (found) svg = found;
            }

            // Use SVG's own coordinate system for precise positioning
            const pt = svg.createSVGPoint();
            pt.x = e.clientX;
            pt.y = e.clientY;
            const svgPt = pt.matrixTransform(svg.getScreenCTM().inverse());

            const svgX = svgPt.x;
            const svgY = svgPt.y;

            let finalX, finalY, zoneId, markerX = svgX, markerY = svgY;

            // Zone Mode
            if (spielstand.settings.useFieldZones) {
                const zonePath = e.target.closest('.field-zone-path');
                if (zonePath) {
                    zoneId = parseInt(zonePath.getAttribute('data-zone'));
                    
                    // Tactical Snap Points
                    const snapPoints = {
                        1: { x: 60, y: 45 },
                        2: { x: 75, y: 95 },
                        3: { x: 150, y: 115 },
                        4: { x: 225, y: 95 },
                        5: { x: 240, y: 45 },
                        6: { x: 40, y: 180 },
                        7: { x: 150, y: 180 },
                        8: { x: 260, y: 180 },
                        9: { x: 150, y: 280 }
                    };

                    const point = snapPoints[zoneId];
                    if (point) {
                        markerX = point.x;
                        markerY = point.y;
                    }

                    finalX = ((markerX - 10) / 280) * 100;
                    finalY = ((markerY - 10) / 380) * 100;
                }
            }

            if (finalX === undefined) {
                // Exact Mode
                finalX = ((svgX - 10) / 280) * 100;
                finalY = ((svgY - 10) / 380) * 100;
                zoneId = calculateFieldZone(finalX, finalY);
            }

            spielstand.tempCombinedField = { 
                x: finalX.toFixed(1), 
                y: finalY.toFixed(1),
                zone: zoneId
            };

            // Reset marker and highlights
            if (combinedFieldMarker) combinedFieldMarker.style.display = 'none';
            svg.querySelectorAll('.field-zone-path').forEach(p => p.classList.remove('selected-zone'));

            if (spielstand.settings.useFieldZones) {
                const zonePath = e.target.closest('.field-zone-path');
                if (zonePath) zonePath.classList.add('selected-zone');
            } else {
                if (combinedFieldMarker) {
                    combinedFieldMarker.setAttribute('transform', `translate(${markerX}, ${markerY})`);
                    combinedFieldMarker.style.display = 'block';
                }
            }
        });
    }

    if (combinedWurfbildUmgebung) {
        combinedWurfbildUmgebung.addEventListener('click', (e) => {
            let svg = combinedWurfbildUmgebung;
            if (svg.tagName !== 'svg') {
                const found = svg.querySelector('svg');
                if (found) svg = found;
            }

            // Use SVG's own coordinate system for precise positioning
            const pt = svg.createSVGPoint();
            pt.x = e.clientX;
            pt.y = e.clientY;
            const svgPt = pt.matrixTransform(svg.getScreenCTM().inverse());

            const svgX = svgPt.x;
            const svgY = svgPt.y;
            
            let finalX, finalY, zoneId, markerX = svgX, markerY = svgY;

            // Check if Zone mode is active
            if (spielstand.settings.useGoalZones) {
                const zoneRect = e.target.closest('.goal-zone-rect');
                if (zoneRect) {
                    zoneId = parseInt(zoneRect.getAttribute('data-zone'));
                    // Center of the zone rect
                    markerX = parseFloat(zoneRect.getAttribute('x')) + (parseFloat(zoneRect.getAttribute('width')) / 2);
                    markerY = parseFloat(zoneRect.getAttribute('y')) + (parseFloat(zoneRect.getAttribute('height')) / 2);
                    
                    // Convert back to percentages (0-100)
                    finalX = ((markerX - 25) / 250) * 100;
                    finalY = ((markerY - 10) / 180) * 100;
                }
            }

            if (finalX === undefined) {
                // Exact mode
                finalX = ((svgX - 25) / 250) * 100;
                finalY = ((svgY - 10) / 180) * 100;
                zoneId = calculateGoalZone(finalX, finalY);
            }

            spielstand.tempCombinedGoal = { 
                x: finalX.toFixed(1), 
                y: finalY.toFixed(1),
                zone: zoneId
            };

            // Reset marker and zone highlights
            if (combinedGoalMarker) combinedGoalMarker.style.display = 'none';
            const allRects = svg.querySelectorAll('.goal-zone-rect');
            allRects.forEach(r => r.classList.remove('selected-zone'));

            // Show highlight OR marker based on mode
            if (spielstand.settings.useGoalZones) {
                const zoneRect = e.target.closest('.goal-zone-rect');
                if (zoneRect) {
                    zoneRect.classList.add('selected-zone');
                }
            } else {
                // Exact mode: Show marker
                if (combinedGoalMarker) {
                    combinedGoalMarker.setAttribute('transform', `translate(${markerX}, ${markerY})`);
                    combinedGoalMarker.style.display = 'block';
                }
            }
        });
    }

    // === Assist Selection Logic ===
    let selectedAssistPlayer = null;

    // Function to populate assist player list when modal opens
    window.populateAssistPlayerList = function () {
        if (!combinedAssistPlayerList) return;
        combinedAssistPlayerList.innerHTML = '';
        selectedAssistPlayer = null;

        // Determine which players to show based on game mode
        const isComplexMode = spielstand.gameMode === 'complex';
        const isOpponentAction = spielstand.tempSourcePlayer?.isOpponent || false;
        const currentAction = spielstand.tempSourceAction || "";

        // --- Conditional Section Visibility ---
        const goalSection = document.getElementById('combinedWurfbildUmgebung')?.closest('.throw-section');
        const assistSection = document.querySelector('.assist-selection-section');

        // 1. Hide Goal SVG for Block actions (but keep Play Types visible)
        if (goalSection) {
            const isBlock = currentAction.toLowerCase().includes('block');
            const goalHeader = goalSection.querySelector('h4');
            const goalSvgContainer = document.getElementById('combinedWurfbildUmgebung');

            if (goalHeader) goalHeader.style.display = isBlock ? 'none' : 'block';
            if (goalSvgContainer) goalSvgContainer.style.display = isBlock ? 'none' : 'block';
        }

        // 2. Hide Assist for Non-Goal actions (Fehlwurf, Gehalten, Block)
        const isGoal = currentAction === "Tor" || currentAction === "Gegner Tor" || currentAction === "7m Tor" || currentAction === "Gegner 7m Tor";

        const isBlock = currentAction.toLowerCase().includes('block');

        if (!isGoal && !isBlock) {
            if (assistSection) assistSection.style.display = 'none';
            return;
        }
        if (assistSection) {
            assistSection.style.display = 'block';
            const title = assistSection.querySelector('h4');
            if (title) title.textContent = isBlock ? 'Geblockt von' : 'Assist';
        }

        const isAway = spielstand.settings.isAuswaertsspiel;
        let playersToShow = [];
        let scorerNumber = null;
        const lastEntry = spielstand.gameLog[0];

        // Determine if we need opponent roster or home roster
        // Goal -> Same Team Assist. Block -> Other Team Block.
        // Goal -> Same Team Assist. Block -> Other Team Block.
        const useOpponentRoster = isOpponentAction ? !isBlock : isBlock;

        if (useOpponentRoster) {
            scorerNumber = lastEntry?.gegnerNummer;
            if (isComplexMode) {
                // Opponent lineup side
                const oppPrefix = isAway ? 'heim' : 'gast';
                const lineupElements = document.querySelectorAll(`#${oppPrefix}ActiveRoster .spieler-button, #${oppPrefix}GoalkeeperRoster .spieler-button`);
                lineupElements.forEach(el => {
                    const number = el.dataset.gegnerNummer;
                    const index = el.dataset.index;
                    if (number) {
                        const p = spielstand.knownOpponents[index];
                        playersToShow.push({ number: parseInt(number), name: p?.name || '' });
                    }
                });
            } else {
                playersToShow = (spielstand.knownOpponents || []).map(p => ({ number: p.number, name: p.name || '' }));
            }
        } else {
            scorerNumber = lastEntry?.playerId;
            if (isComplexMode) {
                // Our lineup side
                const ourPrefix = isAway ? 'gast' : 'heim';
                const lineupElements = document.querySelectorAll(`#${ourPrefix}ActiveRoster .spieler-button, #${ourPrefix}GoalkeeperRoster .spieler-button`);
                lineupElements.forEach(el => {
                    const index = el.dataset.index;
                    if (index !== undefined && el.dataset.team === 'myteam') {
                        const p = spielstand.roster[index];
                        if (p) playersToShow.push({ number: p.number, name: p.name || '' });
                    }
                });
            } else {
                playersToShow = (spielstand.roster || []).map(p => ({ number: p.number, name: p.name || '' }));
            }
        }

        // Exclude the scorer
        playersToShow = playersToShow.filter(p => p.number != scorerNumber);

        // Create buttons
        playersToShow.sort((a, b) => a.number - b.number).forEach(player => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'assist-player-btn';
            btn.textContent = `#${player.number}`;
            if (player.name) btn.title = player.name;
            btn.dataset.playerNumber = player.number;
            btn.dataset.playerName = player.name;
            btn.addEventListener('click', () => {
                combinedAssistPlayerList.querySelectorAll('.assist-player-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedAssistPlayer = { number: player.number, name: player.name };
            });
            combinedAssistPlayerList.appendChild(btn);
        });
    };

    // "Kein Assist" button
    if (combinedAssistNone) {
        combinedAssistNone.addEventListener('click', () => {
            combinedAssistPlayerList.querySelectorAll('.assist-player-btn').forEach(b => b.classList.remove('selected'));
            selectedAssistPlayer = null;
        });
    }

    // === Spielart (Play Type) Selection ===
    let selectedPlayType = null;

    if (combinedPlayTypeList) {
        combinedPlayTypeList.querySelectorAll('.playtype-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // Deselect all
                combinedPlayTypeList.querySelectorAll('.playtype-btn').forEach(b => b.classList.remove('selected'));
                // Select this one
                btn.classList.add('selected');
                selectedPlayType = btn.dataset.playtype;
            });
        });
    }

    // Reset function for combined modal
    function resetCombinedModal() {
        spielstand.tempCombinedField = null;
        spielstand.tempCombinedGoal = null;
        selectedAssistPlayer = null;
        selectedPlayType = null;
        if (combinedFieldMarker) combinedFieldMarker.style.display = 'none';
        if (combinedGoalMarker) combinedGoalMarker.style.display = 'none';
        if (combinedPlayTypeList) {
            combinedPlayTypeList.querySelectorAll('.playtype-btn').forEach(b => b.classList.remove('selected'));
        }
        combinedThrowModal.classList.add('versteckt');
        spielstand.tempGegnerNummer = null;
        spielstand.temp7mOutcome = null;
    }

    // Helper for auto-save
    function handleCombinedSave() {
        if (spielstand.gameLog.length > 0) {
            const lastEntry = spielstand.gameLog[0];
            if (spielstand.tempCombinedField) {
                lastEntry.wurfposition = spielstand.tempCombinedField;
            }
            if (spielstand.tempCombinedGoal) {
                lastEntry.wurfbild = { x: spielstand.tempCombinedGoal.x, y: spielstand.tempCombinedGoal.y, color: null, zone: spielstand.tempCombinedGoal.zone };
            }
            // Save assist or attribution if selected
            if (selectedAssistPlayer) {
                const action = lastEntry.action || "";
                const isBlock = action.toLowerCase().includes('block');
                const playerObj = { number: selectedAssistPlayer.number, nummer: selectedAssistPlayer.number, name: selectedAssistPlayer.name || '' };

                if (isBlock) {
                    const isOpponentAction = action.startsWith('Gegner') || lastEntry.gegnerNummer;
                    playerObj.teamKey = isOpponentAction ? 'myteam' : 'opponent';
                    lastEntry.attributedPlayer = playerObj;
                } else {
                    lastEntry.assist = playerObj;
                }
            }
            // Save play type
            if (selectedPlayType) {
                lastEntry.playType = selectedPlayType;
            }
            updateProtokollAnzeige();
            updateScoreDisplay(); // Refresh stats table immediately
            speichereSpielstand();
        }
        resetCombinedModal();
    }

    if (combinedThrowSave) {
        combinedThrowSave.addEventListener('click', handleCombinedSave);
    }

    if (closeCombinedThrowModal) {
        closeCombinedThrowModal.addEventListener('click', () => {
            combinedThrowModal.classList.add('versteckt');
            resetCombinedModal();
        });
    }

    if (combinedThrowSkip) {
        combinedThrowSkip.addEventListener('click', () => {
            resetCombinedModal();
        });
    }

    if (closeWurfbilderStats) closeWurfbilderStats.addEventListener('click', () => wurfbilderStatsModal.classList.add('versteckt'));

    if (gegnerNummerSpeichern) {
        gegnerNummerSpeichern.addEventListener('click', () => {
            const val = neueGegnerNummer.value;
            const name = neueGegnerName.value.trim();
            const isTW = neueGegnerTorwart ? neueGegnerTorwart.checked : false;
            if (val) {
                speichereGegnerNummer(val, name, isTW);
            } else {
                customAlert("Bitte eine gültige Nummer eingeben!");
            }
        });
    }
    if (gegnerNummerUeberspringen) {
        gegnerNummerUeberspringen.addEventListener('click', skipGegnerNummer);
    }


    if (aktionVorauswahl) {
        aktionVorauswahl.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-aktion]');
            if (btn) {
                const aktion = btn.dataset.aktion;

                if (aktion === 'Sonstiges') {
                    setAktuelleAktionTyp('Sonstiges');
                    if (kommentarTitel) kommentarTitel.textContent = `Kommentar für: ${aktuelleAktionTyp}`;
                    aktionVorauswahl.classList.add('versteckt');
                    if (kommentarBereich) {
                        kommentarBereich.classList.remove('versteckt');
                        kommentarInput.focus();
                    }
                } else {
                    // Logge direkt ohne Kommentar-Box
                    logAktion(aktion);
                    aktionVorauswahl.classList.add('versteckt');
                    schliesseAktionsMenue(); // Schließe auch das Hauptmenü
                }
            }
        });
    }

    // === 7m Outcome Buttons ===
    if (sevenMeterOutcomeModal) {
        sevenMeterOutcomeModal.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-outcome]');
            if (btn) {
                handle7mOutcome(btn.dataset.outcome);
            }
        });
    }

    // === Event Delegation for Dynamic Elements ===

    rosterListe.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-player')) {
            const index = e.target.dataset.index;
            const opponentIndex = e.target.dataset.opponentIndex;

            if (opponentIndex !== undefined) {
                deleteOpponent(opponentIndex);
            } else if (index !== undefined) {
                deletePlayer(index);
            }
        }
    });

    // Old Roster Grid Listeners Removed (handled above by handleRosterClick)


    // Quick Add Player Modal handlers
    if (quickAddPlayerSave) {
        quickAddPlayerSave.addEventListener('click', async () => {
            const number = parseInt(quickPlayerNumber.value, 10);
            const name = quickPlayerName.value.trim();

            if (isNaN(number)) {
                customAlert("Bitte gib eine gültige Nummer ein.");
                return;
            }

            const existingPlayer = spielstand.roster.find(p => p.number === number);
            if (existingPlayer) {
                customAlert("Diese Nummer ist bereits vergeben.");
                return;
            }

            const isTW = quickPlayerTorwart ? quickPlayerTorwart.checked : false;

            spielstand.roster.push({ number, name: name || '', isGoalkeeper: isTW });
            spielstand.roster.sort((a, b) => a.number - b.number);
            speichereSpielstand();
            zeichneSpielerRaster();
            quickAddPlayerModal.classList.add('versteckt');
        });
    }

    if (quickAddPlayerCancel) {
        quickAddPlayerCancel.addEventListener('click', () => {
            quickAddPlayerModal.classList.add('versteckt');
        });
    }

    if (quickPlayerNumber) {
        quickPlayerNumber.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                quickPlayerName.focus();
            }
        });
    }

    if (quickPlayerName) {
        quickPlayerName.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                quickAddPlayerSave.click();
            }
        });
    }



    protokollAusgabe.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.log-delete');
        if (deleteBtn) {
            const index = deleteBtn.dataset.index;
            loescheProtokollEintrag(index);
        }
    });

    bekannteGegnerListe.addEventListener('click', (e) => {
        if (e.target.classList.contains('gegner-num-btn')) {
            const nummer = e.target.dataset.nummer;
            speichereGegnerNummer(nummer);
        }
    });

    // === Add Gegner Modal Handlers ===
    if (addGegnerSpeichern) {
        addGegnerSpeichern.addEventListener('click', () => {
            const nummer = addGegnerNummerInput.value;
            const name = addGegnerNameInput.value.trim();
            const isTW = addGegnerTorwartInput ? addGegnerTorwartInput.checked : false;
            if (nummer && !isNaN(nummer)) {
                const nummerInt = parseInt(nummer);
                // Prüfe, ob Gegner bereits existiert
                if (!spielstand.knownOpponents.find(opp => opp.number === nummerInt)) {
                    spielstand.knownOpponents.push({ number: nummerInt, name: name || '', isGoalkeeper: isTW });
                    spielstand.knownOpponents.sort((a, b) => a.number - b.number);
                    speichereSpielstand();
                    zeichneSpielerRaster();
                    addGegnerModal.classList.add('versteckt');
                } else {
                    customAlert('Dieser Gegner ist bereits in der Liste.');
                }
            } else {
                customAlert("Bitte eine gültige Nummer eingeben!");
            }
        });
    }

    if (addGegnerAbbrechen) {
        addGegnerAbbrechen.addEventListener('click', () => {
            addGegnerModal.classList.add('versteckt');
        });
    }

    if (addGegnerNummerInput) {
        addGegnerNummerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addGegnerSpeichern.click();
            }
        });
    }


    // === Tab switching (Live Game) ===
    document.querySelectorAll('.heatmap-tab[data-tab]').forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            setCurrentHeatmapTab(target);

            document.querySelectorAll('.heatmap-tab[data-tab]').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            renderHeatmap(heatmapSvg, null, false);
        });
    });

    // === Filter changes (Live Game) ===
    // === Filter changes (Main View) ===
    if (heatmapTeamToggle) {
        heatmapTeamToggle.addEventListener('click', () => {
            // TOGGLE STATE manually (since it's a custom button, not a real checkbox)
            const isChecked = heatmapTeamToggle.getAttribute('aria-checked') === 'true';
            const newState = !isChecked;
            heatmapTeamToggle.setAttribute('aria-checked', newState ? 'true' : 'false');
            heatmapTeamToggle.dataset.state = newState ? 'checked' : 'unchecked';

            // RE-POPULATE PLAYER SELECT when switching teams
            updateHeatmapPlayerSelect();

            // RE-RENDER
            renderHeatmap(heatmapSvg, null, false);
        });
    }

    [heatmapToreFilter, heatmapMissedFilter, heatmap7mFilter].forEach(filter => {
        if (filter) {
            filter.addEventListener('change', () => renderHeatmap(heatmapSvg, null, false));
        }
    });

    if (heatmapPlayerSelect) {
        heatmapPlayerSelect.addEventListener('change', () => renderHeatmap(heatmapSvg, null, false));
    }

    if (rosterSwapTeamsBtn) {
        rosterSwapTeamsBtn.addEventListener('click', swapTeams);
    }

    // === Calendar ===
    if (prevMonthBtn) prevMonthBtn.addEventListener('click', handlePrevMonth);
    if (nextMonthBtn) nextMonthBtn.addEventListener('click', handleNextMonth);
    // Redundant listener removed - already handled by calendar.js with correct toggle/date logic
    if (closeEventModal) closeEventModal.addEventListener('click', closeAddEventModal);
    if (cancelEventBtn) cancelEventBtn.addEventListener('click', closeAddEventModal);
    if (saveEventBtn) saveEventBtn.addEventListener('click', saveEvent);


    // Tab Switching
    document.querySelectorAll('[data-action="fines-tab"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabId = e.currentTarget.dataset.tab;
            document.querySelectorAll('.fines-tab-content').forEach(c => c.classList.add('versteckt'));
            document.getElementById(tabId).classList.remove('versteckt');
            document.querySelectorAll('[data-action="fines-tab"]').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
        });
    });

    // Fines Settings Listeners
    const triggerFinesUpdate = () => {
        const enabled = document.getElementById('finesEnableMonthlyBtn').checked;
        const std = document.getElementById('finesStandardAmountInput').value;
        const red = document.getElementById('finesReducedAmountInput').value;
        updateFinesSettings(enabled, std, red);
    };

    ['finesEnableMonthlyBtn', 'finesStandardAmountInput', 'finesReducedAmountInput'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', triggerFinesUpdate);
        }
    });
}

// Live Overview Filters
const liveFilters = [liveOverviewHeatmapToreFilter, liveOverviewHeatmapMissedFilter, liveOverviewHeatmap7mFilter];
liveFilters.forEach(f => {
    if (f) {
        f.addEventListener('change', () => {
            if (currentHeatmapContext === 'liveOverview') {
                renderHeatmap(liveOverviewHeatmapSvg, null, false);
            }
        });
    }
});

document.querySelectorAll('input[name="liveOverviewHeatTeam"]').forEach(radio => {
    radio.addEventListener('change', () => {
        if (currentHeatmapContext === 'liveOverview') {
            renderHeatmap(liveOverviewHeatmapSvg, null, false);
        }
    });
});

if (toggleAuswaertsspiel) {
    toggleAuswaertsspiel.addEventListener('change', () => {
        spielstand.settings.isAuswaertsspiel = toggleAuswaertsspiel.checked;
        updateScoreDisplay();
        speichereSpielstand();

        // Refresh Live Overview if active
        // Simplest way is to trigger click on the active nav item if it is 'overview'
        const activeNav = document.querySelector('.nav-item[data-view="overview"]');
        if (activeNav && activeNav.classList.contains('active')) {
            import('../main.js').then(m => m.showLiveOverviewInline());
        }
    });
}

// Subtabs for Live Overview Heatmap
const liveSubTabs = [
    { id: 'liveOverviewSubTabTor', tab: 'tor' },
    { id: 'liveOverviewSubTabFeld', tab: 'feld' },
    { id: 'liveOverviewSubTabKombi', tab: 'kombiniert' }
];

liveSubTabs.forEach(item => {
    const btn = document.getElementById(item.id);
    if (btn) {
        btn.addEventListener('click', () => {
            // Update active class
            liveSubTabs.forEach(t => document.getElementById(t.id).classList.remove('active'));
            btn.classList.add('active');

            setCurrentHeatmapTab(item.tab);
            if (currentHeatmapContext === 'liveOverview') {
                renderHeatmap(liveOverviewHeatmapSvg, null, false);
            }
        });
    }
});
