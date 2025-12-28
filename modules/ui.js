import { berechneTore, berechneWurfbilder, berechneStatistiken, berechneGegnerStatistiken } from './stats.js';
import { drawGoalHeatmap, drawFieldHeatmap } from './heatmap.js';
import { spielstand, speichereSpielstand } from './state.js';
import {
    statistikSidebar, scoreAnzeige, scoreAnzeigeGegner,
    teamNameHeimDisplay, teamNameGegnerDisplay,
    labelSpielerHeimRaster, labelSpielerGegnerRaster, heatmapHeimLabel, heatmapGegnerLabel,
    suspensionContainer, heimSpielerRaster, gegnerSpielerRaster, spielerAuswahlContainer, protokollAusgabe,
    statistikTabelleBody, rosterListe, wurfbildModal, wurfbilderContainer, wurfbilderStatsModal,
    gegnerNummerTitel, gegnerNummerModal, neueGegnerNummer, bekannteGegnerListe,
    aktionsMenueTitel, aktionsMenue, aktionVorauswahl, kommentarBereich,
    playerNameInput, playerNumberInput, editPlayerIndex, addPlayerForm, cancelEditButton,
    spielBeendenButton, historieBereich, historieListe, backToStartFromHistory, historyButton,
    historieDetailBereich, backToHistoryList, histDetailTeams, histDetailScore, histDetailDate,
    histStatsTable, histStatsBody, histStatsGegnerTable, histStatsGegnerBody,
    histHeatmapSvg, histTabStats, histTabHeatmap, histSubTabTor, histSubTabFeld,

    histContentStats, histContentHeatmap, exportHistorieButton,
    liveGameOverviewModal, liveOverviewStatsBody, liveOverviewStatsGegnerBody,
    liveOverviewHeatmapSvg, liveOverviewTabStats, liveOverviewTabHeatmap,
    liveOverviewContentStats, liveOverviewContentHeatmap, closeLiveGameOverview,
    liveOverviewSubTabTor, liveOverviewSubTabFeld, liveOverviewSubTabKombi,
    liveOverviewHeatmapToreFilter, liveOverviewHeatmapMissedFilter,
    settingsBereich, toggleDarkMode, toggleAuswaertsspiel,
    toggleWurfbildHeim, toggleWurfbildGegner, inputTeamNameHeim, inputTeamNameGegner
} from './dom.js';
import { renderHomeStatsInHistory, renderOpponentStatsInHistory, openPlayerHistoryHeatmap } from './historyView.js';
import { renderHeatmap, setCurrentHeatmapContext, setCurrentHeatmapTab } from './heatmap.js';

// We need to be careful with circular dependencies. 
// ui.js imports game.js for click handlers (loescheProtokollEintrag).
// game.js imports ui.js for update functions.
// This is fine as long as we don't call them at top level.

export let aktuellerWurfbildModus = 'standard';

export function applyTheme() {
    if (spielstand.settings.darkMode) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

export function applyViewSettings() {
    const showHeim = false; // Removed feature
    const showGegner = false; // Removed feature
    const isGameEnd = spielstand.timer.gamePhase === 5;

    // Tor Tracker Containers removed from DOM, logic removed here.

    const showSidebar = (isGameEnd);

    if (spielstand.uiState === 'game' && showSidebar) {
        statistikSidebar.classList.remove('versteckt');
    } else {
        statistikSidebar.classList.add('versteckt');
    }
}

export function getOpponentLabel() {
    return spielstand.settings.isAuswaertsspiel ? 'Heim' : 'Gast';
}

export function getMyTeamLabel() {
    return spielstand.settings.isAuswaertsspiel ? 'Gast' : 'Heim';
}

export function updateScoreDisplay() {
    const isAway = spielstand.settings.isAuswaertsspiel;

    if (scoreAnzeige && scoreAnzeigeGegner) {
        if (isAway) {
            scoreAnzeige.textContent = spielstand.score.gegner;
            scoreAnzeigeGegner.textContent = spielstand.score.heim;
        } else {
            scoreAnzeige.textContent = spielstand.score.heim;
            scoreAnzeigeGegner.textContent = spielstand.score.gegner;
        }
    } else if (scoreAnzeige) {
        // Fallback for views using old combined display
        if (isAway) {
            scoreAnzeige.textContent = `${spielstand.score.gegner}:${spielstand.score.heim}`;
        } else {
            scoreAnzeige.textContent = `${spielstand.score.heim}:${spielstand.score.gegner}`;
        }
    }

    // Bei Auswärtspielen: Team-Namen-Anzeige beim Score tauschen
    if (isAway) {
        if (teamNameHeimDisplay) teamNameHeimDisplay.textContent = spielstand.settings.teamNameGegner.toUpperCase();
        if (teamNameGegnerDisplay) teamNameGegnerDisplay.textContent = spielstand.settings.teamNameHeim.toUpperCase();
    } else {
        if (teamNameHeimDisplay) teamNameHeimDisplay.textContent = spielstand.settings.teamNameHeim.toUpperCase();
        if (teamNameGegnerDisplay) teamNameGegnerDisplay.textContent = spielstand.settings.teamNameGegner.toUpperCase();
    }

    // Spieler-Raster Labels & Container-Direction
    if (spielerAuswahlContainer) {
        if (isAway) spielerAuswahlContainer.classList.add('side-swapped');
        else spielerAuswahlContainer.classList.remove('side-swapped');
    }

    if (labelSpielerHeimRaster) labelSpielerHeimRaster.textContent = spielstand.settings.teamNameHeim;
    if (labelSpielerGegnerRaster) labelSpielerGegnerRaster.textContent = spielstand.settings.teamNameGegner;


    // Heatmap Filter Labels
    if (heatmapHeimLabel) heatmapHeimLabel.textContent = spielstand.settings.teamNameHeim || getMyTeamLabel().toUpperCase();
    if (heatmapGegnerLabel) heatmapGegnerLabel.textContent = spielstand.settings.teamNameGegner || getOpponentLabel().toUpperCase();
}

export function updateSuspensionDisplay() {
    if (!suspensionContainer) return;
    suspensionContainer.innerHTML = '';

    spielstand.activeSuspensions.forEach(s => {
        const div = document.createElement('div');
        div.className = `suspension-card ${s.type}`;
        const min = Math.floor(s.remaining / 60);
        const sec = s.remaining % 60;
        const timeStr = `${min}:${sec < 10 ? '0' + sec : sec}`;

        div.innerHTML = `
            <div>#${s.number}</div>
            <div class="suspension-time">${timeStr}</div>
        `;
        suspensionContainer.appendChild(div);
    });
}

export function zeichneSpielerRaster() {
    // Clear both grids
    heimSpielerRaster.innerHTML = '';
    gegnerSpielerRaster.innerHTML = '';

    // Populate home players
    spielstand.roster.forEach((player, index) => {
        const btn = document.createElement('button');

        // Define display content
        const numberSpan = `<span class="spieler-nummer-display">${player.number}</span>`;
        const nameSpan = `<span class="spieler-name-display">${player.name || ''}</span>`;

        btn.innerHTML = `${numberSpan}${nameSpan}`;
        btn.className = 'spieler-button';
        btn.dataset.index = index; // For event delegation
        heimSpielerRaster.appendChild(btn);
    });

    // Populate opponent players
    if (spielstand.knownOpponents && spielstand.knownOpponents.length > 0) {
        spielstand.knownOpponents.forEach((opponent) => {
            const btn = document.createElement('button');

            const numberSpan = `<span class="spieler-nummer-display">${opponent.number}</span>`;
            const nameSpan = `<span class="spieler-name-display">${opponent.name || ''}</span>`;

            btn.innerHTML = `${numberSpan}${nameSpan}`;
            btn.className = 'spieler-button gegner-button';
            btn.dataset.gegnerNummer = opponent.number;
            gegnerSpielerRaster.appendChild(btn);
        });
    }

    // Update Header Labels
    if (labelSpielerHeimRaster) labelSpielerHeimRaster.textContent = spielstand.settings.teamNameHeim || getMyTeamLabel();
    if (labelSpielerGegnerRaster) labelSpielerGegnerRaster.textContent = spielstand.settings.teamNameGegner || getOpponentLabel();

    // Add "+" button for home team
    const addHeimBtn = document.createElement('button');
    addHeimBtn.innerHTML = '<span class="spieler-nummer">+</span>';
    addHeimBtn.className = 'spieler-button add-player-button';
    addHeimBtn.id = 'addHeimSpielerButton';
    addHeimBtn.title = 'Spieler hinzufügen';
    heimSpielerRaster.appendChild(addHeimBtn);

    // Add "+" button for opponent team
    const addGegnerBtn = document.createElement('button');
    addGegnerBtn.innerHTML = '<span class="spieler-nummer">+</span>';
    addGegnerBtn.className = 'spieler-button gegner-button add-player-button';
    addGegnerBtn.id = 'addGegnerSpielerButton';
    addGegnerBtn.title = getOpponentLabel() + ' hinzufügen';
    gegnerSpielerRaster.appendChild(addGegnerBtn);
}

export function updateProtokollAnzeige() {
    protokollAusgabe.innerHTML = '';

    spielstand.gameLog.slice().reverse().forEach((eintrag, idxReverse) => {
        const index = spielstand.gameLog.length - 1 - idxReverse;
        const div = document.createElement('div');
        div.className = 'log-entry';

        // Add specific classes based on action type
        if (eintrag.action.toLowerCase().includes('tor') && !eintrag.action.toLowerCase().includes('gegner')) {
            div.classList.add('tor');
        } else if (eintrag.action.toLowerCase().includes('gegner tor') || (eintrag.gegnerNummer && eintrag.action.toLowerCase().includes('tor'))) {
            div.classList.add('gegner-tor');
        } else if (eintrag.action.toLowerCase().includes('gelb') || eintrag.action.toLowerCase().includes('2 min') || eintrag.action.toLowerCase().includes('rot')) {
            div.classList.add('strafe');
        }

        const spielstandText = eintrag.spielstand ? ` (${eintrag.spielstand})` : '';

        let contentHtml = `<span class="log-time">${eintrag.time}</span>`;
        let text = '';

        if (eintrag.playerId) {
            text = `#${eintrag.playerId} (${eintrag.playerName}): ${eintrag.action}`;
        } else if (eintrag.gegnerNummer) {
            text = `${getOpponentLabel()} #${eintrag.gegnerNummer}: ${eintrag.action}`;
        } else {
            text = `${eintrag.action.toUpperCase()}`;
        }

        if (eintrag.kommentar) {
            text += ` - ${eintrag.kommentar}`;
        }

        contentHtml += `<span class="log-text"><strong>${text}</strong><span style="opacity: 0.6; margin-left:8px;">${spielstandText}</span></span>`;
        contentHtml += `<span class="log-delete" data-index="${index}" title="Löschen"><i data-lucide="trash-2" style="width: 16px; height: 16px;"></i></span>`;

        div.innerHTML = contentHtml;
        protokollAusgabe.appendChild(div);
    });

    if (window.lucide) window.lucide.createIcons();
}



export function zeichneStatistikTabelle(statsData) {
    if (!statistikTabelleBody) return;

    statistikTabelleBody.innerHTML = '';

    statsData.forEach(stats => {
        const tr = document.createElement('tr');
        const displayName = stats.name ? `#${stats.number} ${stats.name}` : `#${stats.number}`;
        tr.innerHTML = `
            <td>${displayName}</td>
            <td>${stats.siebenMeter}</td>
            <td>${stats.guteAktion}</td>
            <td>${stats.fehlwurf}</td>
            <td>${stats.techFehler}</td>
            <td>${stats.gelb}</td>
            <td>${stats.zweiMinuten}</td>
            <td>${stats.rot}</td>
        `;
        statistikTabelleBody.appendChild(tr);
    });
}

export function zeichneRosterListe(showOpponents = false) {
    rosterListe.innerHTML = '';

    const list = showOpponents ? spielstand.knownOpponents : spielstand.roster;

    if (list.length === 0) {
        rosterListe.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">Noch keine Spieler im ${showOpponents ? getOpponentLabel() : getMyTeamLabel()}-Team hinzugefügt.</div>`;
        return;
    }

    list.forEach((player, index) => {
        const div = document.createElement('div');
        div.className = 'roster-player-card';

        // Read-only state
        const infoDiv = document.createElement('div');
        infoDiv.className = 'roster-player-info';
        infoDiv.innerHTML = `
            <div class="roster-player-number">${player.number}</div>
            <div class="roster-player-name">${player.name || '<i>Kein Name</i>'}</div>
        `;

        // Edit state (hidden)
        const editDiv = document.createElement('div');
        editDiv.className = 'roster-inline-edit-grid versteckt';
        editDiv.innerHTML = `
            <div class="edit-row-name">
                <input type="text" class="shadcn-input inline-name-input" value="${player.name || ''}" placeholder="Name">
            </div>
            <div class="edit-row-controls">
                <input type="number" class="shadcn-input inline-number-input" value="${player.number}" min="1" max="99" placeholder="Nr.">
                <div class="inline-edit-actions">
                    <button class="inline-save-btn shadcn-btn-primary shadcn-btn-sm" title="Speichern">✓</button>
                    <button class="inline-cancel-btn shadcn-btn-outline shadcn-btn-sm" title="Abbrechen">✕</button>
                </div>
            </div>
        `;

        // Actions
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'roster-player-actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'shadcn-btn-outline shadcn-btn-sm roster-edit-btn';
        editBtn.innerHTML = 'Bearbeiten';

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'shadcn-btn-outline shadcn-btn-sm delete-player';
        deleteBtn.style.color = 'hsl(var(--destructive))';
        deleteBtn.style.borderColor = 'hsl(var(--destructive))';
        deleteBtn.innerHTML = 'Löschen';
        deleteBtn.dataset.index = index;
        if (showOpponents) deleteBtn.dataset.opponentIndex = index;

        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);

        div.appendChild(infoDiv);
        div.appendChild(editDiv);
        div.appendChild(actionsDiv);

        // Handlers
        editBtn.onclick = () => {
            infoDiv.classList.add('versteckt');
            actionsDiv.classList.add('versteckt');
            editDiv.classList.remove('versteckt');
            editDiv.querySelector('.inline-name-input').focus();
        };

        const cancelEdit = () => {
            infoDiv.classList.remove('versteckt');
            actionsDiv.classList.remove('versteckt');
            editDiv.classList.add('versteckt');
        };

        editDiv.querySelector('.inline-cancel-btn').onclick = cancelEdit;

        editDiv.querySelector('.inline-save-btn').onclick = async () => {
            const newName = editDiv.querySelector('.inline-name-input').value.trim();
            const newNum = parseInt(editDiv.querySelector('.inline-number-input').value);

            if (isNaN(newNum)) {
                await customAlert('Bitte Nummer eingeben');
                return;
            }

            // Duplicate check
            const duplicate = list.find((p, i) => i !== index && p.number === newNum);
            if (duplicate) {
                await customAlert('Diese Nummer ist bereits vergeben.');
                return;
            }

            player.name = newName;
            player.number = newNum;
            list.sort((a, b) => a.number - b.number);
            speichereSpielstand();
            zeichneRosterListe(showOpponents);
            zeichneSpielerRaster();
        };

        rosterListe.appendChild(div);
    });
}

export function oeffneWurfbildModal(modus) {
    aktuellerWurfbildModus = modus;
    wurfbildModal.classList.remove('versteckt');
}

export function schliesseWurfbildModal() {
    wurfbildModal.classList.add('versteckt');
    aktuellerWurfbildModus = 'standard';
}

export function zeigeWurfstatistik() {
    const daten = berechneWurfbilder();
    if (!wurfbilderContainer) {
        console.error("wurfbilderContainer not found!");
        return;
    }
    wurfbilderContainer.innerHTML = '';
    const renderPlayerGroup = (playerData, is7m = false) => {
        const div = document.createElement('div');
        div.className = 'player-shot-card';
        let tore = 0; let gehalten = 0; let vorbei = 0;
        const isOpponent = playerData.isOpponent || false;

        playerData.wuerfe.forEach(w => {
            if (w.color === 'yellow') gehalten++;
            else if (w.color === 'gray') vorbei++;
            else tore++;
        });

        const totalWuerfe = tore + gehalten + vorbei;
        const quote = totalWuerfe > 0 ? Math.round((tore / totalWuerfe) * 100) : 0;

        const infoDiv = document.createElement('div');
        infoDiv.className = 'player-shot-info';
        infoDiv.innerHTML = `<strong>#${playerData.number} ${playerData.name}${is7m ? ' (7m)' : ''}</strong>${tore} Tore${gehalten > 0 ? `, ${gehalten} Geh.` : ''}${vorbei > 0 ? `, ${vorbei} Vorb.` : ''} <strong>(${quote}%)</strong>`;
        div.appendChild(infoDiv);

        const hasWurfposition = is7m ? false : playerData.wuerfe.some(w => w.wurfposition);
        const hasWurfbild = playerData.wuerfe.some(w => w.x && w.y);

        // Prepare points for drawing functions
        const pointsTor = playerData.wuerfe
            .filter(w => w.x && w.y)
            .map(w => ({
                x: parseFloat(w.x),
                y: parseFloat(w.y),
                isOpponent: isOpponent,
                isMiss: w.color === 'gray' || w.action === 'Fehlwurf' || w.action === 'Gegner Wurf Vorbei' || w.action?.includes('Verworfen')
            }));

        const pointsFeld = playerData.wuerfe
            .filter(w => w.wurfposition)
            .map(w => ({
                x: parseFloat(w.wurfposition.x),
                y: parseFloat(w.wurfposition.y),
                isOpponent: isOpponent,
                isMiss: w.color === 'gray' || w.action === 'Fehlwurf' || w.action === 'Gegner Wurf Vorbei' || w.action?.includes('Verworfen')
            }));

        const prefix = 'wb_' + (playerData.number || '0') + (isOpponent ? 'opp' : 'hm');
        let svgContent = '';
        let viewBox = '0 0 200 200';

        if (hasWurfposition && hasWurfbild) {
            viewBox = '0 0 300 500';

            // Combined
            const scaleGoal = 0.35;
            const xOffsetGoal = (300 - (300 * scaleGoal)) / 2;
            const yOffsetGoal = 24;
            const yOffsetField = 80;
            let linesContent = '<g>';

            playerData.wuerfe.forEach(w => {
                if (w.x && w.y && w.wurfposition) {
                    let rawGx = 25 + (parseFloat(w.x) / 100) * 250;
                    let rawGy = 10 + (parseFloat(w.y) / 100) * 180;
                    rawGx = Math.max(-10, Math.min(310, rawGx));
                    rawGy = Math.max(-55, Math.min(195, rawGy));

                    const gx = xOffsetGoal + (rawGx * scaleGoal);
                    const gy = yOffsetGoal + (rawGy * scaleGoal);

                    const fx = 10 + (parseFloat(w.wurfposition.x) / 100) * 280;
                    const fy = 10 + (parseFloat(w.wurfposition.y) / 100) * 380 + yOffsetField;

                    const isMiss = w.color === 'gray' || w.action === 'Fehlwurf' || w.action === 'Gegner Wurf Vorbei' || w.action?.includes('Verworfen');
                    const color = isMiss ? 'rgba(108, 117, 125, 0.5)' : (isOpponent ? 'rgba(13, 110, 253, 0.5)' : 'rgba(220, 53, 69, 0.5)');
                    linesContent += `<line x1="${fx}" y1="${fy}" x2="${gx}" y2="${gy}" stroke="${color}" stroke-width="2" />`;
                }
            });
            linesContent += '</g>';

            svgContent += drawFieldHeatmap(pointsFeld, yOffsetField, prefix);
            svgContent += `<g transform="translate(${xOffsetGoal}, ${yOffsetGoal}) scale(${scaleGoal})">`;
            svgContent += drawGoalHeatmap(pointsTor, 0, prefix);
            svgContent += `</g>`;
            svgContent += linesContent;

        } else if (hasWurfposition) {
            viewBox = '0 0 300 400';
            svgContent = drawFieldHeatmap(pointsFeld, 0, prefix);
        } else if (hasWurfbild) {
            viewBox = '0 -60 300 260';
            svgContent = drawGoalHeatmap(pointsTor, 0, prefix);
        }

        if (svgContent) {
            const svgContainer = document.createElement('div');
            svgContainer.className = 'combined-shot-visual';
            svgContainer.innerHTML = `<svg viewBox="${viewBox}" width="200" height="280">${svgContent}</svg>`;
            div.appendChild(svgContainer);
        }
        return div;
    };

    if (daten.heim.length > 0) {
        const h4 = document.createElement('h4'); h4.textContent = spielstand.settings.teamNameHeim;
        const groupDiv = document.createElement('div'); groupDiv.className = 'wurfbild-gruppe'; groupDiv.appendChild(h4);
        daten.heim.sort((a, b) => a.nummer - b.nummer).forEach(p => groupDiv.appendChild(renderPlayerGroup(p)));
        wurfbilderContainer.appendChild(groupDiv);
    }
    if (daten.heim7m && daten.heim7m.length > 0) {
        const h4 = document.createElement('h4'); h4.textContent = spielstand.settings.teamNameHeim + " (7m)";
        const groupDiv = document.createElement('div'); groupDiv.className = 'wurfbild-gruppe'; groupDiv.appendChild(h4);
        daten.heim7m.sort((a, b) => a.nummer - b.nummer).forEach(p => groupDiv.appendChild(renderPlayerGroup(p, true)));
        wurfbilderContainer.appendChild(groupDiv);
    }
    if (daten.gegner.length > 0) {
        const h4 = document.createElement('h4'); h4.textContent = spielstand.settings.teamNameGegner + " (" + getOpponentLabel() + " Feldtore)";
        const groupDiv = document.createElement('div'); groupDiv.className = 'wurfbild-gruppe'; groupDiv.appendChild(h4);
        daten.gegner.sort((a, b) => a.nummer - b.nummer).forEach(p => groupDiv.appendChild(renderPlayerGroup(p)));
        wurfbilderContainer.appendChild(groupDiv);
    }
    if (daten.gegner7m.length > 0) {
        const h4 = document.createElement('h4'); h4.textContent = getOpponentLabel() + " 7m";
        const groupDiv = document.createElement('div'); groupDiv.className = 'wurfbild-gruppe'; groupDiv.appendChild(h4);
        daten.gegner7m.sort((a, b) => a.nummer - b.nummer).forEach(p => groupDiv.appendChild(renderPlayerGroup(p, true)));
        wurfbilderContainer.appendChild(groupDiv);
    }
    if (daten.heim.length === 0 && (!daten.heim7m || daten.heim7m.length === 0) && daten.gegner.length === 0 && daten.gegner7m.length === 0) {
        wurfbilderContainer.innerHTML = '<p style="text-align:center; padding:20px;">Noch keine Wurfbilder aufgezeichnet.</p>';
    }
    wurfbilderStatsModal.classList.remove('versteckt');
}

export function oeffneGegnerNummerModal(type, currentGegnerActionTypeSetter) {
    // We need to set the action type in game.js or pass it back
    // Better: game.js calls this and handles state. 
    // But here we update UI.
    // Let's say game.js sets the state variable and calls this.

    if (type === '2min') {
        gegnerNummerTitel.textContent = `2 Minuten für (${getOpponentLabel()})`;
    } else {
        gegnerNummerTitel.textContent = `Torschütze (${getOpponentLabel()})`;
    }

    gegnerNummerModal.classList.remove('versteckt');
    renderGegnerButtons();
    neueGegnerNummer.value = '';
    neueGegnerNummer.focus();
}

export function renderGegnerButtons() {
    bekannteGegnerListe.innerHTML = '';
    const sortierteGegner = spielstand.knownOpponents.sort((a, b) => a.number - b.number);

    sortierteGegner.forEach(opponent => {
        const btn = document.createElement('button');
        const displayText = opponent.name ? `#${opponent.number} - ${opponent.name}` : `#${opponent.number}`;
        btn.textContent = displayText;
        btn.className = 'gegner-num-btn';
        btn.dataset.nummer = opponent.number; // For event delegation
        bekannteGegnerListe.appendChild(btn);
    });
}

export function oeffneAktionsMenueUI(index, playerOverride = null) {
    const player = playerOverride || spielstand.roster[index];
    const displayName = player.name ? `#${player.number} (${player.name})` : `#${player.number}`;
    aktionsMenueTitel.textContent = `Aktion für ${displayName}`;
    aktionsMenue.classList.remove('versteckt');
}

export function schliesseAktionsMenueUI() {
    aktionsMenue.classList.add('versteckt');
    aktionVorauswahl.classList.add('versteckt');
    kommentarBereich.classList.add('versteckt');
}

export function oeffneEditModusUI(index) {
    const player = spielstand.roster[index];
    playerNameInput.value = player.name;
    playerNumberInput.value = player.number;
    editPlayerIndex.value = index;
    addPlayerForm.querySelector('button[type="submit"]').textContent = 'Speichern';
    cancelEditButton.classList.remove('versteckt');
}

export function schliesseEditModusUI() {
    playerNameInput.value = '';
    playerNumberInput.value = '';
    editPlayerIndex.value = '';
    addPlayerForm.querySelector('button[type="submit"]').textContent = 'Hinzufügen';
    cancelEditButton.classList.add('versteckt');
}


// --- Live Game Overview ---
export function showLiveGameOverview() {
    liveGameOverviewModal.classList.remove('versteckt');

    // Populate Score Header
    const scoreHeim = document.getElementById('liveOverviewScoreHeim');
    const scoreGegner = document.getElementById('liveOverviewScoreGegner');
    const teamHeim = document.getElementById('liveOverviewTeamHeim');
    const teamGegner = document.getElementById('liveOverviewTeamGegner');
    const timeAnzeige = document.getElementById('liveOverviewTime');

    if (scoreHeim) scoreHeim.textContent = spielstand.score.heim;
    if (scoreGegner) scoreGegner.textContent = spielstand.score.gegner;
    if (teamHeim) teamHeim.textContent = spielstand.settings.teamNameHeim;
    if (teamGegner) teamGegner.textContent = spielstand.settings.teamNameGegner;
    if (timeAnzeige) {
        const formatted = (typeof timerAnzeige !== 'undefined' && timerAnzeige && timerAnzeige.textContent) || "00:00";
        timeAnzeige.textContent = `Spielzeit: ${formatted}`;
    }

    // Stats
    const stats = berechneStatistiken(spielstand.gameLog, spielstand.roster);
    const gegnerStats = berechneGegnerStatistiken(spielstand.gameLog);

    renderHomeStatsInHistory(liveOverviewStatsBody, stats, spielstand.gameLog, true);
    renderOpponentStatsInHistory(liveOverviewStatsGegnerBody, gegnerStats, spielstand.gameLog, true);

    // Initial Tab State
    liveOverviewContentStats.classList.remove('versteckt');
    liveOverviewContentHeatmap.classList.add('versteckt');
    liveOverviewTabStats.classList.add('active');
    liveOverviewTabHeatmap.classList.remove('active');

    // Heatmap Logic
    function updateLiveHeatmap(tab = 'tor') {
        const type = 'combined'; // For overview usually combined
        // Wait, renderHeatmap expects gameLog for data.
        // We need to set context for filters.
        setCurrentHeatmapContext('liveOverview');
        setCurrentHeatmapTab(tab); // Custom helper or reuse existing?

        // renderHeatmap(svg, type, team, filterTore, filterMissed, gameLogOverride)
        // We need to implement filter read logic inside renderHeatmap OR pass filtered data.
        // renderHeatmap reads DOM elements based on context!
        // So we need to ensure renderHeatmap supports 'liveOverview' context.

        // Actually renderHeatmap in heatmap.js currently supports 'history', 'season', 'main'.
        // We should check heatmap.js to see if we can easily add 'liveOverview'.
        // Or we just pass the modal elements if renderHeatmap is flexible.
        // renderHeatmap uses:
        // const context = currentHeatmapContext;
        // const svg = context === 'history' ? histHeatmapSvg : ...

        // So we need to update heatmap.js to support 'liveOverview'.
        // OR we manually call render logic.

        // For now, let's just implement the tabs switch and stats first.
        // Heatmap integration might require heatmap.js update.
    }

    // Tabs
    liveOverviewTabStats.onclick = () => {
        liveOverviewTabStats.classList.add('active');
        liveOverviewTabHeatmap.classList.remove('active');
        liveOverviewContentStats.classList.remove('versteckt');
        liveOverviewContentHeatmap.classList.add('versteckt');
    };

    liveOverviewTabHeatmap.onclick = () => {
        liveOverviewTabStats.classList.remove('active');
        liveOverviewTabHeatmap.classList.add('active');
        liveOverviewContentStats.classList.add('versteckt');
        liveOverviewContentHeatmap.classList.remove('versteckt');

        // Init heatmap with default tab
        setCurrentHeatmapContext('liveOverview');
        setCurrentHeatmapTab('tor');
        liveOverviewSubTabTor.classList.add('active');
        liveOverviewSubTabFeld.classList.remove('active');
        liveOverviewSubTabKombi.classList.remove('active');

        renderHeatmap(liveOverviewHeatmapSvg, null, false);
    };

    closeLiveGameOverview.onclick = () => {
        liveGameOverviewModal.classList.add('versteckt');
    };
}
