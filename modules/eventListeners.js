// modules/eventListeners.js
// All Event Listener Registrations

import { spielstand, speichereSpielstand } from './state.js';
import {
    addPlayerForm, startGameButton, cancelEditButton, exportTeamButton,
    importTeamButton, importFileInput, backToRosterButton, gamePhaseButton,
    pauseButton, zurueckButton, vorButton, neuesSpielButton,
    heimScoreUp, heimScoreDown, gegnerScoreUp, gegnerScoreDown,
    aktionAbbrechen, guteAktionModalButton, aktionVorauswahlAbbrechen,
    kommentarSpeichernButton, settingsButton, settingsSchliessen,
    toggleDarkMode, toggleTorTracker, toggleTorTrackerGegner,
    toggleWurfbildHeim, toggleWurfbildGegner, inputTeamNameHeim,
    inputTeamNameGegner, toggleAuswaertsspiel, torRahmen, wurfbildUeberspringen,
    showWurfbilderButton, closeWurfbilderStats, gegnerNummerSpeichern,
    gegnerNummerUeberspringen, aktionsMenue, aktionVorauswahl,
    kommentarBereich, kommentarTitel, kommentarInput, settingsModal,
    wurfbilderStatsModal, neueGegnerNummer, sevenMeterOutcomeModal,
    rosterBereich, spielBereich, globalAktionen, scoreWrapper, timerAnzeige,
    statistikWrapper, rosterListe, heimSpielerRaster, gegnerSpielerRaster, protokollAusgabe, bekannteGegnerListe,
    wurfbildUmgebung, addGegnerModal, addGegnerNummerInput, addGegnerSpeichern, addGegnerAbbrechen,
    toggleWurfpositionHeim, toggleWurfpositionGegner, wurfpositionModal, wurfpositionFeld, wurfpositionUeberspringen,
    showHeatmapButton, heatmapModal, heatmapSvg, closeHeatmapModal,
    heatmapHeimFilter, heatmapGegnerFilter, heatmapToreFilter, heatmapMissedFilter,
    exportPdfButton,
    spielBeendenButton, historieBereich, historieListe, backToStartFromHistory, historyButton,
    historieDetailBereich, backToHistoryList, histDetailTeams, histDetailScore, histDetailDate,
    histStatsTable, histStatsBody, histStatsGegnerTable, histStatsGegnerBody,
    histHeatmapSvg, histTabStats, histTabHeatmap, histSubTabTor, histSubTabFeld,
    histContentStats, histContentHeatmap, exportHistorieButton,
    importSpielButton, importSpielInput
} from './dom.js';
import { addPlayer, schliesseEditModus, oeffneEditModus, deletePlayer } from './roster.js';
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
    applyTheme, applyViewSettings, updateScoreDisplay, updateTorTracker,
    schliesseWurfbildModal, zeigeWurfstatistik, zeichneSpielerRaster, oeffneWurfbildModal
} from './ui.js';
import { exportHistorie, importiereSpiel } from './history.js';
import { handleSpielBeenden, renderHistoryList } from './historyView.js';
import { renderHeatmap, setCurrentHeatmapTab, setCurrentHeatmapContext } from './heatmap.js';

// --- Register All Event Listeners ---
export function registerEventListeners() {
    // === Bildschirm 1: Roster ===
    addPlayerForm.addEventListener('submit', addPlayer);
    startGameButton.addEventListener('click', switchToGame);
    cancelEditButton.addEventListener('click', schliesseEditModus);
    exportTeamButton.addEventListener('click', exportTeam);
    importTeamButton.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', handleFileImport);

    // === History Buttons ===
    if (historyButton) {
        historyButton.addEventListener('click', () => {
            rosterBereich.classList.add('versteckt');
            historieBereich.classList.remove('versteckt');
            renderHistoryList();
        });
    }
    if (backToStartFromHistory) {
        backToStartFromHistory.addEventListener('click', () => {
            historieBereich.classList.add('versteckt');
            rosterBereich.classList.remove('versteckt');
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
                alert(result.message);
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
    backToRosterButton.addEventListener('click', switchToRoster);
    gamePhaseButton.addEventListener('click', handleGamePhaseClick);
    pauseButton.addEventListener('click', handleRealPauseClick);
    zurueckButton.addEventListener('click', () => handleZeitSprung(-30));
    vorButton.addEventListener('click', () => handleZeitSprung(30));
    neuesSpielButton.addEventListener('click', starteNeuesSpiel);

    // === Score Korrektur ===
    heimScoreUp.addEventListener('click', () => logScoreKorrektur('heim', 1));
    heimScoreDown.addEventListener('click', () => logScoreKorrektur('heim', -1));
    gegnerScoreUp.addEventListener('click', () => logScoreKorrektur('gegner', 1));
    gegnerScoreDown.addEventListener('click', () => logScoreKorrektur('gegner', -1));

    // === Modal 1: Haupt-Aktionsmenü ===
    aktionAbbrechen.addEventListener('click', schliesseAktionsMenue);
    guteAktionModalButton.addEventListener('click', () => {
        aktionsMenue.classList.add('versteckt');
        aktionVorauswahl.classList.remove('versteckt');
    });

    document.querySelectorAll('#aktionsMenue .aktion-button[data-aktion]').forEach(btn => {
        btn.addEventListener('click', () => {
            logAktion(btn.dataset.aktion);
        });
    });

    // === Modal 2: "Gute Aktion" Vorauswahl ===
    aktionVorauswahlAbbrechen.addEventListener('click', () => {
        aktionVorauswahl.classList.add('versteckt');
        aktionsMenue.classList.remove('versteckt');
    });

    document.querySelectorAll('#aktionVorauswahl .aktion-button[data-aktion]').forEach(btn => {
        btn.addEventListener('click', () => {
            setAktuelleAktionTyp('Gute Aktion: ' + btn.dataset.aktion);
            kommentarTitel.textContent = `Kommentar für: ${aktuelleAktionTyp}`;
            aktionVorauswahl.classList.add('versteckt');
            kommentarBereich.classList.remove('versteckt');
            kommentarInput.focus();
        });
    });

    // === Modal 3: Kommentar ===
    kommentarSpeichernButton.addEventListener('click', () => {
        const kommentar = kommentarInput.value.trim() || null;
        logAktion(aktuelleAktionTyp, kommentar);
        kommentarInput.value = '';
    });

    // === Einstellungen ===
    if (settingsButton) {
        settingsButton.addEventListener('click', () => {
            if (spielstand.settings) {
                if (toggleDarkMode) toggleDarkMode.checked = spielstand.settings.darkMode;
                if (toggleAuswaertsspiel) toggleAuswaertsspiel.checked = spielstand.settings.isAuswaertsspiel;
                if (toggleTorTracker) toggleTorTracker.checked = spielstand.settings.showTorTracker;
                if (toggleTorTrackerGegner) toggleTorTrackerGegner.checked = spielstand.settings.showTorTrackerGegner;
                if (toggleWurfbildHeim) toggleWurfbildHeim.checked = spielstand.settings.showWurfbildHeim;
                if (toggleWurfbildGegner) toggleWurfbildGegner.checked = spielstand.settings.showWurfbildGegner;
                if (inputTeamNameHeim) inputTeamNameHeim.value = spielstand.settings.teamNameHeim || 'Heim';
                if (inputTeamNameGegner) inputTeamNameGegner.value = spielstand.settings.teamNameGegner || 'Gegner';
            }
            settingsModal.classList.remove('versteckt');
        });
    }

    if (settingsSchliessen) {
        settingsSchliessen.addEventListener('click', () => {
            if (spielstand.settings) {
                spielstand.settings.teamNameHeim = inputTeamNameHeim.value || 'Heim';
                spielstand.settings.teamNameGegner = inputTeamNameGegner.value || 'Gegner';
                updateScoreDisplay();
                speichereSpielstand();
            }
            settingsModal.classList.add('versteckt');
        });
    }

    if (toggleDarkMode) {
        toggleDarkMode.addEventListener('change', (e) => {
            if (!spielstand.settings) spielstand.settings = {};
            spielstand.settings.darkMode = e.target.checked;
            applyTheme();
            speichereSpielstand();
        });
    }

    if (toggleTorTracker) {
        toggleTorTracker.addEventListener('change', (e) => {
            if (!spielstand.settings) spielstand.settings = {};
            spielstand.settings.showTorTracker = e.target.checked;
            applyViewSettings();
            speichereSpielstand();
        });
    }

    if (toggleTorTrackerGegner) {
        toggleTorTrackerGegner.addEventListener('change', (e) => {
            if (!spielstand.settings) spielstand.settings = {};
            spielstand.settings.showTorTrackerGegner = e.target.checked;
            applyViewSettings();
            updateTorTracker();
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
            const showWurfbild = isOpponent ? spielstand.settings.showWurfbildGegner : spielstand.settings.showWurfbildHeim;

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
                const showWurfbild = isOpponent ? spielstand.settings.showWurfbildGegner : spielstand.settings.showWurfbildHeim;

                if (showWurfbild && (lastEntry.action === 'Tor' || lastEntry.action === 'Fehlwurf' || lastEntry.action === 'Gegner Tor' || lastEntry.action === 'Gegner Wurf Vorbei')) {
                    oeffneWurfbildModal(isOpponent ? 'gegner' : 'standard');
                }
            }
        });
    }

    // === Wurfbild Logic ===
    if (wurfbildUmgebung) {
        wurfbildUmgebung.addEventListener('click', (e) => {
            const rect = torRahmen.getBoundingClientRect();
            const clickX = e.clientX;
            const clickY = e.clientY;

            const x = ((clickX - rect.left) / rect.width) * 100;
            const y = ((clickY - rect.top) / rect.height) * 100;

            let color = 'gray';

            if (spielstand.gameLog.length > 0) {
                const lastEntry = spielstand.gameLog[0];
                const action = lastEntry.action;

                if (action === "Tor" || action === "Gegner Tor" || action === "Gegner 7m Tor" || action === "7m Tor") {
                    color = 'red';
                } else if (action === "Fehlwurf" || action === "Gegner Wurf Vorbei" || action === "Gegner 7m Verworfen" || action === "7m Verworfen") {
                    color = 'gray';
                } else if (action === "Gegner 7m Gehalten" || action === "7m Gehalten") {
                    color = 'yellow';
                }

                lastEntry.wurfbild = { x: x.toFixed(1), y: y.toFixed(1), color: color };
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

    if (showWurfbilderButton) showWurfbilderButton.addEventListener('click', zeigeWurfstatistik);
    if (closeWurfbilderStats) closeWurfbilderStats.addEventListener('click', () => wurfbilderStatsModal.classList.add('versteckt'));

    if (gegnerNummerSpeichern) {
        gegnerNummerSpeichern.addEventListener('click', () => {
            const val = neueGegnerNummer.value;
            if (val) speichereGegnerNummer(val);
        });
    }
    if (gegnerNummerUeberspringen) {
        gegnerNummerUeberspringen.addEventListener('click', skipGegnerNummer);
    }

    // === 7m Outcome Buttons ===
    document.querySelectorAll('#sevenMeterOutcomeModal .aktion-button[data-outcome]').forEach(btn => {
        btn.addEventListener('click', () => {
            handle7mOutcome(btn.dataset.outcome);
        });
    });

    // === Event Delegation for Dynamic Elements ===

    rosterListe.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-player')) {
            const index = e.target.dataset.index;
            oeffneEditModus(index);
        } else if (e.target.classList.contains('delete-player')) {
            const index = e.target.dataset.index;
            deletePlayer(index);
        }
    });

    heimSpielerRaster.addEventListener('click', (e) => {
        const btn = e.target.closest('.spieler-button');
        if (btn) {
            if (btn.id === 'addHeimSpielerButton') {
                switchToRoster();
            } else {
                const index = btn.dataset.index;
                if (index !== undefined) {
                    oeffneAktionsMenue(index);
                }
            }
        }
    });

    gegnerSpielerRaster.addEventListener('click', (e) => {
        const btn = e.target.closest('.spieler-button');
        if (btn) {
            if (btn.id === 'addGegnerSpielerButton') {
                addGegnerNummerInput.value = '';
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
        if (e.target.classList.contains('loeschButton')) {
            const index = e.target.dataset.index;
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
            if (nummer && !isNaN(nummer)) {
                const nummerInt = parseInt(nummer);
                if (!spielstand.knownOpponents.includes(nummerInt)) {
                    spielstand.knownOpponents.push(nummerInt);
                    spielstand.knownOpponents.sort((a, b) => a - b);
                    speichereSpielstand();
                    zeichneSpielerRaster();
                    addGegnerModal.classList.add('versteckt');
                } else {
                    alert('Dieser Gegner ist bereits in der Liste.');
                }
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

    // === Heatmap button (Live Game) ===
    if (showHeatmapButton) {
        showHeatmapButton.addEventListener('click', () => {
            setCurrentHeatmapContext(null);

            const filterContainer = heatmapModal.querySelector('.heatmap-filter');
            if (filterContainer) filterContainer.classList.remove('versteckt');

            heatmapModal.classList.remove('versteckt');
            renderHeatmap(heatmapSvg, null, false);
        });
    }

    if (closeHeatmapModal) {
        closeHeatmapModal.addEventListener('click', () => {
            heatmapModal.classList.add('versteckt');
            setCurrentHeatmapContext(null);
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
    [heatmapHeimFilter, heatmapGegnerFilter, heatmapToreFilter, heatmapMissedFilter].forEach(filter => {
        if (filter) {
            filter.addEventListener('change', () => renderHeatmap(heatmapSvg, null, false));
        }
    });

    // === PDF Export ===
    if (exportPdfButton) {
        exportPdfButton.addEventListener('click', exportiereAlsPdf);
    }
}
