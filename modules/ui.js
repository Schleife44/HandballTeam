import { berechneTore, berechneWurfbilder } from './stats.js';
import { spielstand } from './state.js';
import {
    torTrackerHeimContainer, torTrackerGegnerContainer, statistikSidebar, scoreAnzeige,
    teamNameHeimDisplay, teamNameGegnerDisplay, labelTorTrackerHeim, labelTorTrackerGegner,
    suspensionContainer, heimSpielerRaster, gegnerSpielerRaster, protokollAusgabe, torTabelleBody, torTabelleGegnerBody,
    statistikTabelleBody, rosterListe, wurfbildModal, wurfbilderContainer, wurfbilderStatsModal,
    gegnerNummerTitel, gegnerNummerModal, neueGegnerNummer, bekannteGegnerListe,
    aktionsMenueTitel, aktionsMenue, aktionVorauswahl, kommentarBereich,
    playerNameInput, playerNumberInput, editPlayerIndex, addPlayerForm, cancelEditButton,
    spielBeendenButton, historieBereich, historieListe, backToStartFromHistory, historyButton,
    historieDetailBereich, backToHistoryList, histDetailTeams, histDetailScore, histDetailDate,
    histStatsTable, histStatsBody, histStatsGegnerTable, histStatsGegnerBody,
    histHeatmapSvg, histTabStats, histTabHeatmap, histSubTabTor, histSubTabFeld,
    histContentStats, histContentHeatmap, exportHistorieButton
} from './dom.js';
// Removed imports from game.js and roster.js to prevent circular dependencies

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
    const showHeim = spielstand.settings.showTorTracker;
    const showGegner = spielstand.settings.showTorTrackerGegner;
    const isGameEnd = spielstand.timer.gamePhase === 5;

    if (torTrackerHeimContainer) {
        if (showHeim) torTrackerHeimContainer.classList.remove('versteckt');
        else torTrackerHeimContainer.classList.add('versteckt');
    }

    if (torTrackerGegnerContainer) {
        if (showGegner) torTrackerGegnerContainer.classList.remove('versteckt');
        else torTrackerGegnerContainer.classList.add('versteckt');
    }

    const showSidebar = (showHeim || showGegner || isGameEnd);

    if (spielstand.uiState === 'game' && showSidebar) {
        statistikSidebar.classList.remove('versteckt');
    } else {
        statistikSidebar.classList.add('versteckt');
    }
}

export function updateScoreDisplay() {
    if (scoreAnzeige) {
        scoreAnzeige.textContent = `${spielstand.score.heim}:${spielstand.score.gegner}`;
    }
    if (teamNameHeimDisplay) teamNameHeimDisplay.textContent = spielstand.settings.teamNameHeim.toUpperCase();
    if (teamNameGegnerDisplay) teamNameGegnerDisplay.textContent = spielstand.settings.teamNameGegner.toUpperCase();
    if (labelTorTrackerHeim) labelTorTrackerHeim.textContent = spielstand.settings.teamNameHeim;
    if (labelTorTrackerGegner) labelTorTrackerGegner.textContent = spielstand.settings.teamNameGegner;
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
        btn.innerHTML = `
            <span class="spieler-nummer">#${player.number}</span>
            <span class="spieler-name">${player.name}</span>
        `;
        btn.className = 'spieler-button';
        btn.dataset.index = index; // For event delegation
        heimSpielerRaster.appendChild(btn);
    });

    // Populate opponent players
    if (spielstand.knownOpponents && spielstand.knownOpponents.length > 0) {
        spielstand.knownOpponents.forEach((opponentNumber) => {
            const btn = document.createElement('button');
            btn.innerHTML = `
                <span class="spieler-nummer">#${opponentNumber}</span>
            `;
            btn.className = 'spieler-button gegner-button';
            btn.dataset.gegnerNummer = opponentNumber;
            gegnerSpielerRaster.appendChild(btn);
        });
    }

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
    addGegnerBtn.title = 'Gegner hinzufügen';
    gegnerSpielerRaster.appendChild(addGegnerBtn);
}

export function updateProtokollAnzeige() {
    protokollAusgabe.innerHTML = '';

    spielstand.gameLog.forEach((eintrag, index) => {
        const p = document.createElement('p');
        const textSpan = document.createElement('span');

        let text;
        const spielstandText = eintrag.spielstand ? ` <strong>(${eintrag.spielstand})</strong>` : '';

        if (eintrag.playerId) {
            text = `<strong>[${eintrag.time}] #${eintrag.playerId} (${eintrag.playerName}): ${eintrag.action}</strong>${spielstandText}`;
        } else if (eintrag.gegnerNummer) {
            // Opponent action with player number
            text = `<strong>[${eintrag.time}] Gegner #${eintrag.gegnerNummer}: ${eintrag.action}</strong>${spielstandText}`;
        } else {
            text = `<strong>[${eintrag.time}] ${eintrag.action.toUpperCase()}</strong>${spielstandText}`;
        }

        if (eintrag.kommentar) {
            text += `: ${eintrag.kommentar}`;
        }
        textSpan.innerHTML = text;

        const loeschButton = document.createElement('button');
        loeschButton.textContent = 'Löschen';
        loeschButton.className = 'loeschButton';
        loeschButton.dataset.index = index; // For event delegation

        p.appendChild(textSpan);
        p.appendChild(loeschButton);
        protokollAusgabe.appendChild(p);
    });
}

export function updateTorTracker() {
    if (torTabelleBody) {
        const toreMap = berechneTore();
        const trackerData = spielstand.roster.map(player => ({
            name: player.name,
            number: player.number,
            tore: toreMap.get(player.number) || 0
        }));

        trackerData.sort((a, b) => b.tore - a.tore);

        torTabelleBody.innerHTML = '';
        trackerData.forEach(data => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>#${data.number} ${data.name}</td><td>${data.tore}</td>`;
            torTabelleBody.appendChild(tr);
        });
    }

    if (torTabelleGegnerBody && spielstand.settings.showTorTrackerGegner) {
        const gegnerToreMap = new Map();
        spielstand.gameLog.forEach(eintrag => {
            if (eintrag.action === "Gegner Tor" || eintrag.action === "Gegner 7m Tor") {
                const nr = eintrag.gegnerNummer ? eintrag.gegnerNummer : "Unbekannt";
                gegnerToreMap.set(nr, (gegnerToreMap.get(nr) || 0) + 1);
            }
        });

        const gegnerData = Array.from(gegnerToreMap, ([nr, tore]) => ({ nr, tore }));

        gegnerData.sort((a, b) => {
            if (a.nr === "Unbekannt") return 1;
            if (b.nr === "Unbekannt") return -1;
            return b.tore - a.tore;
        });

        torTabelleGegnerBody.innerHTML = '';
        if (gegnerData.length === 0) {
            torTabelleGegnerBody.innerHTML = '<tr><td colspan="2" style="text-align:center;color:#999;">Noch keine Tore</td></tr>';
        } else {
            gegnerData.forEach(data => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${data.nr !== "Unbekannt" ? '#' + data.nr : 'Unbekannt'}</td><td>${data.tore}</td>`;
                torTabelleGegnerBody.appendChild(tr);
            });
        }
    }
}

export function zeichneStatistikTabelle(statsData) {
    if (!statistikTabelleBody) return;

    statistikTabelleBody.innerHTML = '';

    statsData.forEach(stats => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${stats.number} ${stats.name}</td>
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

export function zeichneRosterListe() {
    rosterListe.innerHTML = '';
    if (spielstand.roster.length === 0) {
        rosterListe.innerHTML = '<li>Noch keine Spieler hinzugefügt.</li>';
        return;
    }

    spielstand.roster.forEach((player, index) => {
        const li = document.createElement('li');
        const text = document.createElement('span');
        text.textContent = `#${player.number} - ${player.name}`;
        li.appendChild(text);

        const buttonWrapper = document.createElement('div');

        const editBtn = document.createElement('button');
        editBtn.textContent = 'Bearbeiten';
        editBtn.className = 'edit-player';
        editBtn.dataset.index = index; // For event delegation
        buttonWrapper.appendChild(editBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Löschen';
        deleteBtn.className = 'delete-player';
        deleteBtn.dataset.index = index; // For event delegation
        buttonWrapper.appendChild(deleteBtn);

        li.appendChild(buttonWrapper);
        rosterListe.appendChild(li);
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
    const renderPlayerGroup = (playerData) => {
        const div = document.createElement('div');
        div.className = 'player-shot-card';
        let tore = 0; let gehalten = 0; let vorbei = 0;
        const isOpponent = playerData.isOpponent || false;
        const dotColor = isOpponent ? '#0d6efd' : '#dc3545'; // Blue for opponent, Red for home

        playerData.wuerfe.forEach(w => {
            if (w.color === 'yellow') gehalten++;
            else if (w.color === 'gray') vorbei++;
            else tore++;
        });

        // Calculate shooting percentage (goals / total attempts)
        const totalWuerfe = tore + gehalten + vorbei;
        const quote = totalWuerfe > 0 ? Math.round((tore / totalWuerfe) * 100) : 0;

        const infoDiv = document.createElement('div');
        let statsText = `<strong>${playerData.name}</strong><br>${tore} Tore`;
        if (gehalten > 0) statsText += `, ${gehalten} Gehalten`;
        if (vorbei > 0) statsText += `, ${vorbei} Vorbei`;
        statsText += ` <strong>(${quote}%)</strong>`;
        infoDiv.innerHTML = statsText;
        div.appendChild(infoDiv);

        // Check if any throws have wurfposition data
        const hasWurfposition = playerData.wuerfe.some(w => w.wurfposition);
        // Check if any throws have wurfbild (goal position) data
        const hasWurfbild = playerData.wuerfe.some(w => w.x && w.y);

        if (hasWurfposition && hasWurfbild) {
            // Create combined SVG with half-court + goal + area above goal for misses
            const svgContainer = document.createElement('div');
            svgContainer.className = 'combined-shot-visual';
            svgContainer.innerHTML = `
                <svg viewBox="0 -30 200 310" width="200" height="280">
                    <!-- Half-court field -->
                    <rect x="0" y="50" width="200" height="200" fill="var(--mini-tor-bg)" stroke="#333" stroke-width="1"/>
                    
                    <!-- Goal at top (wider for better visibility) -->
                    <rect x="60" y="0" width="80" height="50" fill="var(--mini-tor-bg)" stroke="#333" stroke-width="2"/>
                    <rect x="75" y="45" width="50" height="5" fill="#333"/>
                    
                    <!-- 6m line (solid) -->
                    <path d="M 50 50 Q 50 100 100 100 Q 150 100 150 50" fill="none" stroke="#333" stroke-width="1"/>
                    
                    <!-- 9m line (dashed) -->
                    <path d="M 25 50 Q 25 140 100 140 Q 175 140 175 50" fill="none" stroke="#333" stroke-width="1" stroke-dasharray="4,2"/>
                    
                    <!-- Middle line -->
                    <line x1="0" y1="248" x2="200" y2="248" stroke="#333" stroke-width="1"/>
                    
                    ${playerData.wuerfe.map(coords => {
                if (!coords || !coords.x || !coords.y) return '';

                const rawX = parseFloat(coords.x);
                const rawY = parseFloat(coords.y);

                // Map coordinates to goal area (60-140 X, 0-50 Y in SVG)
                // rawX/rawY are 0-100%, but can be outside this range for misses
                let goalX = 60 + (rawX / 100) * 80;
                let goalY = (rawY / 100) * 50;

                // Clamp to visible area but keep relative position
                goalX = Math.max(10, Math.min(190, goalX));
                goalY = Math.max(-25, Math.min(48, goalY));

                // Field position (if available)
                let fieldX = 100;
                let fieldY = 140;
                let hasFieldPos = false;

                if (coords.wurfposition) {
                    fieldX = (parseFloat(coords.wurfposition.x) / 100) * 200;
                    fieldY = 50 + (parseFloat(coords.wurfposition.y) / 100) * 200;
                    hasFieldPos = true;
                }

                // Determine stroke color based on outcome
                let strokeColor = dotColor;
                if (coords.color === 'yellow') strokeColor = '#ffc107';
                else if (coords.color === 'gray') strokeColor = '#6c757d';

                return `
                            ${hasFieldPos ? `<line x1="${fieldX}" y1="${fieldY}" x2="${goalX}" y2="${goalY}" stroke="${strokeColor}" stroke-width="2" stroke-opacity="0.6"/>` : ''}
                            ${hasFieldPos ? `<circle cx="${fieldX}" cy="${fieldY}" r="5" fill="${dotColor}" stroke="white" stroke-width="1"/>` : ''}
                            <circle cx="${goalX}" cy="${goalY}" r="4" fill="${strokeColor}" stroke="white" stroke-width="1"/>
                        `;
            }).join('')}
                </svg>
            `;
            div.appendChild(svgContainer);
        } else if (hasWurfposition) {
            // Position-only view: just half-court with position dots
            const svgContainer = document.createElement('div');
            svgContainer.className = 'combined-shot-visual';
            svgContainer.innerHTML = `
                <svg viewBox="0 0 200 200" width="200" height="200">
                    <rect x="0" y="0" width="200" height="200" fill="var(--mini-tor-bg)" stroke="#333" stroke-width="1"/>
                    <rect x="75" y="0" width="50" height="5" fill="#333"/>
                    <path d="M 50 0 Q 50 50 100 50 Q 150 50 150 0" fill="none" stroke="#333" stroke-width="1"/>
                    <path d="M 25 0 Q 25 90 100 90 Q 175 90 175 0" fill="none" stroke="#333" stroke-width="1" stroke-dasharray="4,2"/>
                    <line x1="0" y1="198" x2="200" y2="198" stroke="#333" stroke-width="1"/>
                    ${playerData.wuerfe.map(coords => {
                if (!coords || !coords.wurfposition) return '';
                const fieldX = (parseFloat(coords.wurfposition.x) / 100) * 200;
                const fieldY = (parseFloat(coords.wurfposition.y) / 100) * 200;
                const isMiss = coords.color === 'gray' || coords.action === 'Fehlwurf' || coords.action === 'Gegner Wurf Vorbei';
                const posColor = isMiss ? '#6c757d' : dotColor;
                return `<circle cx="${fieldX}" cy="${fieldY}" r="6" fill="${posColor}" stroke="white" stroke-width="1"/>`;
            }).join('')}
                </svg>
            `;
            div.appendChild(svgContainer);
        } else if (hasWurfbild) {
            // Wurfbild-only: original mini-tor wrapper
            const torDiv = document.createElement('div');
            torDiv.className = 'mini-tor-wrapper';
            playerData.wuerfe.forEach(coords => {
                if (coords && coords.x && coords.y) {
                    const dot = document.createElement('div');
                    dot.className = 'mini-shot-dot';
                    dot.style.left = coords.x + '%';
                    dot.style.top = coords.y + '%';
                    if (coords.color === 'yellow') {
                        dot.style.backgroundColor = '#ffc107'; dot.style.zIndex = 5;
                    } else if (coords.color === 'gray') {
                        dot.style.backgroundColor = '#6c757d'; dot.style.zIndex = 5;
                    } else {
                        dot.style.backgroundColor = dotColor;
                    }
                    torDiv.appendChild(dot);
                }
            });
            div.appendChild(torDiv);
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
        daten.heim7m.sort((a, b) => a.nummer - b.nummer).forEach(p => groupDiv.appendChild(renderPlayerGroup(p)));
        wurfbilderContainer.appendChild(groupDiv);
    }
    if (daten.gegner.length > 0) {
        const h4 = document.createElement('h4'); h4.textContent = spielstand.settings.teamNameGegner + " (Feldtore)";
        const groupDiv = document.createElement('div'); groupDiv.className = 'wurfbild-gruppe'; groupDiv.appendChild(h4);
        daten.gegner.sort((a, b) => a.nummer - b.nummer).forEach(p => groupDiv.appendChild(renderPlayerGroup(p)));
        wurfbilderContainer.appendChild(groupDiv);
    }
    if (daten.gegner7m.length > 0) {
        const h4 = document.createElement('h4'); h4.textContent = "Gegner 7m";
        const groupDiv = document.createElement('div'); groupDiv.className = 'wurfbild-gruppe'; groupDiv.appendChild(h4);
        daten.gegner7m.sort((a, b) => a.nummer - b.nummer).forEach(p => groupDiv.appendChild(renderPlayerGroup(p)));
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
        gegnerNummerTitel.textContent = "2 Minuten für (Gegner)";
    } else {
        gegnerNummerTitel.textContent = "Torschütze (Gegner)";
    }

    gegnerNummerModal.classList.remove('versteckt');
    renderGegnerButtons();
    neueGegnerNummer.value = '';
    neueGegnerNummer.focus();
}

export function renderGegnerButtons() {
    bekannteGegnerListe.innerHTML = '';
    const sortierteNummern = spielstand.knownOpponents.sort((a, b) => a - b);

    sortierteNummern.forEach(nummer => {
        const btn = document.createElement('button');
        btn.textContent = nummer;
        btn.className = 'gegner-num-btn';
        btn.dataset.nummer = nummer; // For event delegation
        bekannteGegnerListe.appendChild(btn);
    });
}

export function oeffneAktionsMenueUI(index, playerOverride = null) {
    const player = playerOverride || spielstand.roster[index];
    aktionsMenueTitel.textContent = `Aktion für #${player.number} (${player.name})`;
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
