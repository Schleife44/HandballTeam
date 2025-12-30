// modules/eventListeners.js
// All Event Listener Registrations

import { spielstand, speichereSpielstand } from './state.js';

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
    heatmapSvg,
    heatmapTeamToggle, heatmapPlayerSelect, heatmapToreFilter, heatmapMissedFilter, heatmap7mFilter,
    spielBeendenButton, historieBereich, historieListe, backToStartFromHistory, historyButton,


    historieDetailBereich, backToHistoryList, histDetailTeams, histDetailScore, histDetailDate,
    histStatsTable, histStatsBody, histStatsGegnerTable, histStatsGegnerBody,
    histHeatmapSvg, histTabStats, histTabHeatmap, histSubTabTor, histSubTabFeld,
    histContentStats, histContentHeatmap, exportHistorieButton,
    importSpielButton, importSpielInput,
    histHeatmapToreFilter, histHeatmapMissedFilter,
    liveOverviewHeatmapToreFilter, liveOverviewHeatmapMissedFilter, liveOverviewHeatmap7mFilter,
    liveOverviewHeatmapSvg,
    mobileMenuBtn, sidebarOverlay, sidebar, navItems
} from './dom.js';
import { addPlayer, schliesseEditModus, oeffneEditModus, deletePlayer, deleteEntireTeam, deleteOpponent, oeffneOpponentEditModus, swapTeams } from './roster.js';
import {
    switchToGame, switchToRoster, handleGamePhaseClick, handleRealPauseClick,
    logGlobalAktion, logScoreKorrektur, schliesseAktionsMenue, logAktion,
    setAktuelleAktionTyp, aktuelleAktionTyp, speichereGegnerNummer,
    skipGegnerNummer, handle7mOutcome, starteNeuesSpiel, setSteuerungAktiv,
    oeffneAktionsMenue, loescheProtokollEintrag, oeffneGegnerAktionsMenue
} from './game.js';
import { handleZeitSprung } from './timer.js';
import { exportTeam, handleFileImport, exportiereAlsPdf } from './export.js';
import {
    applyTheme, applyViewSettings, updateScoreDisplay,
    schliesseWurfbildModal, zeigeWurfstatistik, zeichneSpielerRaster, oeffneWurfbildModal,
    zeichneRosterListe, showLiveGameOverview
} from './ui.js';
import { exportHistorie, importiereSpiel } from './history.js';
import { handleSpielBeenden, renderHistoryList } from './historyView.js';
import { renderHeatmap, setCurrentHeatmapTab, setCurrentHeatmapContext, currentHeatmapContext } from './heatmap.js';
import { saveCurrentTeam, showLoadTeamModal, loadSavedTeam, deleteSavedTeam, viewTeam, updateTeam, deletePlayerFromSavedTeam, loadHistoryTeam } from './teamStorage.js';
import { openSeasonOverview, closeSeasonOverview, showPlayerHeatmap, showTeamHeatmap } from './seasonView.js';
import { customAlert } from './customDialog.js';

// --- Register All Event Listeners ---
export function registerEventListeners() {
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

    // Save/Load Team buttons
    if (saveTeamButton) {
        saveTeamButton.addEventListener('click', saveCurrentTeam);
    }

    if (loadTeamButton) {
        loadTeamButton.addEventListener('click', showLoadTeamModal);
    }

    if (loadTeamCancel) {
        loadTeamCancel.addEventListener('click', () => {
            loadTeamModal.classList.add('versteckt');
        });
    }

    // Event delegation for dynamically created load/delete buttons
    if (savedTeamsList) {
        savedTeamsList.addEventListener('click', (e) => {
            if (e.target.classList.contains('load-team-btn')) {
                const teamKey = e.target.dataset.key;
                const index = parseInt(e.target.dataset.index);
                loadSavedTeam(teamKey, index);
            } else if (e.target.classList.contains('delete-saved-team-btn')) {
                const teamKey = e.target.dataset.key;
                const index = parseInt(e.target.dataset.index);
                deleteSavedTeam(teamKey, index);
            } else if (e.target.classList.contains('view-team-btn')) {
                const teamKey = e.target.dataset.key;
                const index = parseInt(e.target.dataset.index);
                viewTeam(teamKey, index);
            } else if (e.target.classList.contains('load-history-team-btn')) {
                const index = parseInt(e.target.dataset.index);
                loadHistoryTeam(index);
            }
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

    // === History Buttons ===
    if (historyButton) {
        historyButton.addEventListener('click', () => {
            // Schließe alle anderen Bereiche und Modals
            rosterBereich.classList.add('versteckt');
            spielBereich.classList.add('versteckt');
            settingsBereich.classList.add('versteckt');
            // Zeige Historie
            historieBereich.classList.remove('versteckt');
            renderHistoryList();
        });
    }

    // === Season Overview ===
    if (seasonOverviewButton) {
        seasonOverviewButton.addEventListener('click', openSeasonOverview);
    }

    if (seasonOverviewClose) {
        seasonOverviewClose.addEventListener('click', closeSeasonOverview);
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
    if (spielBeendenButton) {
        spielBeendenButton.addEventListener('click', handleSpielBeenden);
    }

    // === History Detail Tabs ===
    if (histTabStats && histTabHeatmap) {
        histTabStats.addEventListener('click', () => {
            histTabStats.classList.add('active');
            histTabHeatmap.classList.remove('active');
            histContentStats.classList.remove('versteckt');
            histContentHeatmap.classList.add('versteckt');
        });
        histTabHeatmap.addEventListener('click', () => {
            histTabHeatmap.classList.add('active');
            histTabStats.classList.remove('active');
            histContentHeatmap.classList.remove('versteckt');
            histContentStats.classList.add('versteckt');
        });
    }

    // === Bildschirm 2: Game ===
    gamePhaseButton.addEventListener('click', handleGamePhaseClick);
    pauseButton.addEventListener('click', handleRealPauseClick);
    zurueckButton.addEventListener('click', () => handleZeitSprung(-30));
    vorButton.addEventListener('click', () => handleZeitSprung(30));
    neuesSpielButton.addEventListener('click', starteNeuesSpiel);

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
    heimScoreUp.addEventListener('click', () => {
        const target = spielstand.settings.isAuswaertsspiel ? 'gegner' : 'heim';
        logScoreKorrektur(target, 1);
    });
    heimScoreDown.addEventListener('click', () => {
        const target = spielstand.settings.isAuswaertsspiel ? 'gegner' : 'heim';
        if (spielstand.score[target] > 0) logScoreKorrektur(target, -1);
    });
    gegnerScoreUp.addEventListener('click', () => {
        const target = spielstand.settings.isAuswaertsspiel ? 'heim' : 'gegner';
        logScoreKorrektur(target, 1);
    });
    gegnerScoreDown.addEventListener('click', () => {
        const target = spielstand.settings.isAuswaertsspiel ? 'heim' : 'gegner';
        if (spielstand.score[target] > 0) logScoreKorrektur(target, -1);
    });

    // === Modal 1: Haupt-Aktionsmenü ===
    aktionAbbrechen.addEventListener('click', schliesseAktionsMenue);

    // (AktionsMenue listeners are handled by event delegation below)

    // === Modal 2: "Gute Aktion" Vorauswahl ===
    aktionVorauswahlAbbrechen.addEventListener('click', () => {
        aktionVorauswahl.classList.add('versteckt');
        aktionsMenue.classList.remove('versteckt');
    });

    // (AktionVorauswahl buttons are handled by event delegation below)


    // === Modal 3: Kommentar ===
    kommentarSpeichernButton.addEventListener('click', () => {
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

    // === Einstellungen (Inline) ===
    if (toggleDarkMode) {
        toggleDarkMode.addEventListener('change', (e) => {
            if (!spielstand.settings) spielstand.settings = {};
            spielstand.settings.darkMode = e.target.checked;
            applyTheme();
            speichereSpielstand();
        });
    }

    if (myTeamNameInput) {
        myTeamNameInput.addEventListener('input', (e) => {
            if (!spielstand.settings) spielstand.settings = {};
            spielstand.settings.myTeamName = e.target.value.trim();
            speichereSpielstand();
        });
    }

    if (inputTeamNameHeim) {
        inputTeamNameHeim.addEventListener('input', (e) => {
            if (!spielstand.settings) spielstand.settings = {};
            spielstand.settings.teamNameHeim = e.target.value.trim();
            speichereSpielstand();
        });
    }

    if (inputTeamNameGegner) {
        inputTeamNameGegner.addEventListener('input', (e) => {
            if (!spielstand.settings) spielstand.settings = {};
            spielstand.settings.teamNameGegner = e.target.value.trim();
            speichereSpielstand();
        });
    }



    if (toggleWurfbildHeim) {
        toggleWurfbildHeim.addEventListener('change', (e) => {
            if (!spielstand.settings) spielstand.settings = {};
            spielstand.settings.showWurfbildHeim = e.target.checked;
            speichereSpielstand();
        });
    }

    if (toggleWurfbildGegner) {
        toggleWurfbildGegner.addEventListener('change', (e) => {
            if (!spielstand.settings) spielstand.settings = {};
            spielstand.settings.showWurfbildGegner = e.target.checked;
            speichereSpielstand();
        });
    }

    if (toggleWurfpositionHeim) {
        toggleWurfpositionHeim.addEventListener('change', (e) => {
            if (!spielstand.settings) spielstand.settings = {};
            spielstand.settings.showWurfpositionHeim = e.target.checked;
            speichereSpielstand();
        });
    }

    if (toggleWurfpositionGegner) {
        toggleWurfpositionGegner.addEventListener('change', (e) => {
            if (!spielstand.settings) spielstand.settings = {};
            spielstand.settings.showWurfpositionGegner = e.target.checked;
            speichereSpielstand();
        });
    }

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

            const x = (clickXOffset / scaleX) / viewBoxWidth * 100;
            const y = (clickYOffset / scaleY) / viewBoxHeight * 100;

            if (spielstand.gameLog.length > 0) {
                spielstand.gameLog[0].wurfposition = { x: x.toFixed(1), y: y.toFixed(1) };
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

            if (showWurfbild && lastEntry && (lastEntry.action === 'Tor' || lastEntry.action === 'Fehlwurf' || lastEntry.action === 'Gegner Tor' || lastEntry.action === 'Gegner Wurf Vorbei')) {
                oeffneWurfbildModal(isOpponent ? 'gegner' : 'standard');
            }
        });
    }

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

                if (showWurfbild && (lastEntry.action === 'Tor' || lastEntry.action === 'Fehlwurf' || lastEntry.action === 'Gegner Tor' || lastEntry.action === 'Gegner Wurf Vorbei')) {
                    oeffneWurfbildModal(isOpponent ? 'gegner' : 'standard');
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

            // Map to Goal Inner Rect (x=25, y=10, w=250, h=180)
            const x = ((svgX - 25) / 250) * 100;
            const y = ((svgY - 10) / 180) * 100;

            // Clamp values strictly to 0-100? Or allow slight margin?
            // Heatmap clamps display, so allowing slight margin is fine, but maybe clamping is safer for clean data.
            // Let's not clamp tightly, as long as it's reasonable. User clicks where they click.

            if (spielstand.gameLog.length > 0) {
                const lastEntry = spielstand.gameLog[0];
                // Explicitly set color to null so heatmap.js uses dynamic logic
                lastEntry.wurfbild = { x: x.toFixed(1), y: y.toFixed(1), color: null };
                speichereSpielstand();
            }

            spielstand.tempGegnerNummer = null;
            spielstand.temp7mOutcome = null;

            schliesseWurfbildModal();
        });
    }

    if (wurfbildUeberspringen) {
        wurfbildUeberspringen.addEventListener('click', schliesseWurfbildModal);
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

    heimSpielerRaster.addEventListener('click', (e) => {
        const btn = e.target.closest('.spieler-button');
        if (!btn) return;

        if (btn.id === 'addHeimSpielerButton') {
            quickPlayerNumber.value = '';
            quickPlayerName.value = '';
            if (quickPlayerTorwart) quickPlayerTorwart.checked = false;
            quickAddPlayerModal.classList.remove('versteckt');
            quickPlayerNumber.focus();
        } else if (btn.id === 'addGegnerSpielerButton') {
            // Existing logic to add a new opponent
            document.getElementById('addGegnerModal')?.classList.remove('versteckt');
        } else {
            const index = btn.dataset.index;
            const gegnerNummer = btn.dataset.gegnerNummer;
            if (index !== undefined) {
                oeffneAktionsMenue(parseInt(index, 10));
            } else if (gegnerNummer !== undefined) {
                oeffneGegnerAktionsMenue(gegnerNummer);
            }
        }
    });

    if (gegnerSpielerRaster) {
        gegnerSpielerRaster.addEventListener('click', (e) => {
            const btn = e.target.closest('.spieler-button');
            if (!btn) return;

            if (btn.id === 'addHeimSpielerButton') {
                quickPlayerNumber.value = '';
                quickPlayerName.value = '';
                if (quickPlayerTorwart) quickPlayerTorwart.checked = false;
                quickAddPlayerModal.classList.remove('versteckt');
                quickPlayerNumber.focus();
            } else if (btn.id === 'addGegnerSpielerButton') {
                document.getElementById('addGegnerModal')?.classList.remove('versteckt');
            } else {
                const index = btn.dataset.index;
                const gegnerNummer = btn.dataset.gegnerNummer;
                if (index !== undefined) {
                    oeffneAktionsMenue(parseInt(index, 10));
                } else if (gegnerNummer !== undefined) {
                    oeffneGegnerAktionsMenue(gegnerNummer);
                }
            }
        });
    }

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

    gegnerSpielerRaster.addEventListener('click', (e) => {
        const btn = e.target.closest('.spieler-button');
        if (btn) {
            if (btn.id === 'addGegnerSpielerButton') {
                addGegnerNummerInput.value = '';
                addGegnerNameInput.value = '';
                if (addGegnerTorwartInput) addGegnerTorwartInput.checked = false;
                addGegnerModal.classList.remove('versteckt');
                addGegnerNummerInput.focus();
            } else {
                const gegnernummer = btn.dataset.gegnerNummer;
                if (gegnernummer) {
                    oeffneGegnerAktionsMenue(parseInt(gegnernummer));
                }
            }
        }
    });

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
            // RESET PLAYER SELECT when switching teams
            if (heatmapPlayerSelect) {
                heatmapPlayerSelect.value = 'all';
            }

            // Note: A generic listener seems to handle the visual toggle.
            // We just ensure the heatmap re-renders.
            setTimeout(() => {
                renderHeatmap(heatmapSvg, null, false);
            }, 0);
        });
    }

    [heatmapToreFilter, heatmapMissedFilter, heatmap7mFilter].forEach(filter => {
        if (filter) {
            filter.addEventListener('change', () => renderHeatmap(heatmapSvg, null, false));
        }
    });

    // === Mobile Sidebar Toggle ===
    if (mobileMenuBtn && sidebar && sidebarOverlay) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            sidebarOverlay.classList.toggle('active');
        });

        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        });

        // Close sidebar when a nav item is clicked (on mobile)
        if (navItems) {
            navItems.forEach(item => {
                item.addEventListener('click', () => {
                    if (window.innerWidth <= 768) {
                        sidebar.classList.remove('active');
                        sidebarOverlay.classList.remove('active');
                    }
                });
            });
        }
    }
    if (rosterSwapTeamsBtn) {
        rosterSwapTeamsBtn.addEventListener('click', swapTeams);
    }
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
