import { spielstand, speichereSpielstand } from './state.js';
import { zeichneRosterListe, zeichneSpielerRaster } from './ui.js';
import { berechneTore, berechneStatistiken, berechneGegnerStatistiken } from './stats.js';
import { customAlert, customConfirm } from './customDialog.js';

export function exportTeam() {
    const teamToggle = document.getElementById('teamToggle');
    const isOpponentMode = teamToggle && teamToggle.checked;

    const teamToExport = isOpponentMode ? spielstand.knownOpponents : spielstand.roster;
    const teamName = isOpponentMode ? 'Gegner' : 'Heim';

    if (teamToExport.length === 0) {
        customAlert(`Es ist kein ${teamName}-Team zum Exportieren vorhanden.`);
        return;
    }

    const teamDaten = JSON.stringify(teamToExport, null, 2);
    const blob = new Blob([teamDaten], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = isOpponentMode ? 'handball_gegner_team.json' : 'handball_team.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

export function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) { return; }

    const reader = new FileReader();
    reader.onload = async function (e) {
        try {
            const importiertesRoster = JSON.parse(e.target.result);

            if (Array.isArray(importiertesRoster)) {
                const teamToggle = document.getElementById('teamToggle');
                const isOpponentMode = teamToggle && teamToggle.checked;
                const teamName = isOpponentMode ? 'Gegner-Team' : 'Team';

                if (await customConfirm(`Möchtest du das bestehende ${teamName} wirklich überschreiben?`, "Team importieren?")) {
                    if (isOpponentMode) {
                        // Import as opponents - ensure correct format
                        const opponents = importiertesRoster.map(item => {
                            if (item.hasOwnProperty('number')) {
                                return { number: item.number, name: item.name || '' };
                            }
                            return null;
                        }).filter(Boolean);

                        spielstand.knownOpponents = opponents;
                        spielstand.knownOpponents.sort((a, b) => a.number - b.number);
                    } else {
                        // Import as home team
                        if (importiertesRoster.every(p => p.hasOwnProperty('number'))) {
                            spielstand.roster = importiertesRoster.map(p => ({
                                name: p.name || '',
                                number: p.number
                            }));
                            spielstand.roster.sort((a, b) => a.number - b.number);
                        } else {
                            customAlert("Die Datei hat ein ungültiges Format.");
                            return;
                        }
                    }

                    speichereSpielstand();
                    zeichneRosterListe(isOpponentMode);
                    zeichneSpielerRaster();
                    customAlert(`${teamName} erfolgreich importiert!`);
                }
            } else {
                customAlert("Die Datei hat ein ungültiges Format.");
            }
        } catch (error) {
            console.error("Fehler beim Importieren der Datei:", error);
            customAlert("Die Datei konnte nicht gelesen werden. Ist es eine gültige JSON-Datei?");
        }
    };
    reader.readAsText(file);
    event.target.value = null;
}

export function exportiereAlsTxt() {
    if (spielstand.gameLog.length === 0) {
        customAlert("Das Protokoll ist leer. Es gibt nichts zu exportieren.");
        return;
    }

    const heimName = spielstand.settings.teamNameHeim;

    let dateiInhalt = `Protokoll Handball Team-Tracker: ${heimName} vs ${spielstand.settings.teamNameGegner}\n\n`;
    dateiInhalt += `Team: ${spielstand.roster.map(p => `#${p.number} ${p.name}`).join(', ')}\n\n`;

    dateiInhalt += `--- TOR-ÜBERSICHT ${heimName.toUpperCase()} ---\n`;
    const toreMap = berechneTore();
    spielstand.roster.forEach(player => {
        const tore = toreMap.get(player.number) || 0;
        dateiInhalt += `#${player.number} ${player.name}: ${tore} Tore\n`;
    });
    dateiInhalt += "---------------------\n\n";

    dateiInhalt += "--- SPIEL-STATISTIK ---\n";
    const statsData = berechneStatistiken();

    let maxNameLength = "Spieler".length;
    statsData.forEach(stats => {
        const nameLength = (`#${stats.number} ${stats.name}`).length;
        if (nameLength > maxNameLength) maxNameLength = nameLength;
    });
    maxNameLength += 2;

    const col7m = "7m".length + 3;
    const colGut = "Gut".length + 3;
    const colFehlwurf = "Fehl".length + 3;
    const colTechFehler = "TF".length + 3;
    const colGelb = "Gelb".length + 3;
    const col2min = "2'".length + 3;
    const colRot = "Rot".length + 3;

    let header = "Spieler".padEnd(maxNameLength);
    header += "7m".padEnd(col7m);
    header += "Ast".padEnd(colGut); // Reuse colGut width for Ast
    header += "Gut".padEnd(colGut);
    header += "Fehl".padEnd(colFehlwurf);
    header += "TF".padEnd(colTechFehler);
    header += "Gelb".padEnd(colGelb);
    header += "2'".padEnd(col2min);
    header += "Rot".padEnd(colRot);
    dateiInhalt += header + "\n";

    const totalLength = maxNameLength + col7m + colGut + colFehlwurf + colTechFehler + colGelb + col2min + colRot;
    dateiInhalt += "-".repeat(totalLength).substring(0, totalLength - (colRot.length - 3)) + "\n";

    statsData.forEach(stats => {
        let row = (`#${stats.number} ${stats.name}`).padEnd(maxNameLength);
        row += String(stats.siebenMeterTore || 0).padEnd(col7m);
        row += String(stats.assist || 0).padEnd(colGut);
        row += String(stats.guteAktion).padEnd(colGut);
        row += String(stats.fehlwurf).padEnd(colFehlwurf);
        row += String(stats.techFehler).padEnd(colTechFehler);
        row += String(stats.gelb).padEnd(colGelb);
        row += String(stats.zweiMinuten).padEnd(col2min);
        row += String(stats.rot).padEnd(colRot);
        dateiInhalt += row + "\n";
    });

    dateiInhalt += "-".repeat(totalLength).substring(0, totalLength - (colRot.length - 3)) + "\n\n";


    [...spielstand.gameLog].reverse().forEach(e => {
        if (e.playerId) {
            dateiInhalt += `[${e.time}] #${e.playerId} (${e.playerName}): ${e.action}`;
        } else {
            dateiInhalt += `[${e.time}] ${e.action.toUpperCase()}`;
        }

        if (e.spielstand) {
            dateiInhalt += ` (${e.spielstand})`;
        }

        if (e.kommentar) {
            dateiInhalt += `: ${e.kommentar}`;
        }

        if (e.wurfbild) {
            let farbe = e.wurfbild.color === 'gray' ? '(Gehalten)' : '';
            dateiInhalt += ` [Tor: X=${e.wurfbild.x}%, Y=${e.wurfbild.y}% ${farbe}]`;
        }

        dateiInhalt += "\n";
    });

    const blob = new Blob([dateiInhalt], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `protokoll_${heimName}_vs_${spielstand.settings.teamNameGegner}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

export function exportiereAlsCsv() {
    if (spielstand.gameLog.length === 0) {
        customAlert("Keine Daten zum Exportieren.");
        return;
    }
    let csvContent = "\uFEFF";
    csvContent += "Spieler-Statistik\n";
    csvContent += "Nummer;Name;Tore;7m Tore;Assist;Gute Aktion;Fehlwurf;Tech Fehler;Gelb;2min;Rot\n";
    const statsData = berechneStatistiken();
    const toreMap = berechneTore();
    statsData.forEach(s => {
        const tore = s.tore || 0;
        csvContent += `${s.number};${s.name};${tore};${s.siebenMeterTore || 0};${s.assist || 0};${s.guteAktion};${s.fehlwurf};${s.techFehler || s.ballverlust || 0};${s.gelb};${s.zweiMinuten};${s.rot}\n`;
    });
    csvContent += "\n\nSpielverlauf\nZeit;Aktion;Spieler/Team;Details;Spielstand\n";
    [...spielstand.gameLog].reverse().forEach(e => {
        let akteur = e.playerId ? `#${e.playerId} ${e.playerName}` : "SPIEL/GEGNER";
        let details = e.kommentar ? e.kommentar : "";
        if (e.wurfbild) details += ` (Wurf: X${e.wurfbild.x}|Y${e.wurfbild.y})`;
        akteur = akteur.replace(/;/g, ",");
        details = details.replace(/;/g, ",");
        csvContent += `${e.time};${e.action};${akteur};${details};${e.spielstand || ""}\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `statistik_${spielstand.settings.teamNameHeim}_vs_${spielstand.settings.teamNameGegner}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// --- PDF Helper Functions for Visualizations ---

function drawGoalHeatmapToPdf(doc, x, y, width, height, logEntries, teamFilter) {
    // Goal Dimensions in PDF units
    const goalX = x + width * 0.1;
    const goalY = y + height * 0.1;
    const goalW = width * 0.8;
    const goalH = height * 0.8;

    // Draw Goal Frame
    doc.setDrawColor(50, 50, 50);
    doc.setLineWidth(1.5);
    doc.rect(goalX, goalY, goalW, goalH); // Main frame

    // Draw Net (dashed lines)
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.setLineDash([1, 1], 0);
    // Vertical net lines
    doc.line(goalX + goalW * 0.33, goalY, goalX + goalW * 0.33, goalY + goalH);
    doc.line(goalX + goalW * 0.66, goalY, goalX + goalW * 0.66, goalY + goalH);
    // Horizontal net lines
    doc.line(goalX, goalY + goalH * 0.33, goalX + goalW, goalY + goalH * 0.33);
    doc.line(goalX, goalY + goalH * 0.66, goalX + goalW, goalY + goalH * 0.66);
    doc.setLineDash([], 0); // Reset dash

    // Process Entries
    logEntries.forEach(entry => {
        if (!entry.wurfbild) return;

        const isOpponent = entry.action?.startsWith('Gegner') || entry.gegnerNummer;

        // Filter logic:
        if (teamFilter === 'home' && isOpponent) return;
        if (teamFilter === 'away' && !isOpponent) return;


        const isMiss = entry.action === 'Fehlwurf' || entry.action === 'Gegner Wurf Vorbei' ||
            entry.action?.includes('Verworfen') || entry.action?.includes('Gehalten');

        // Map Coordinates (0-100 range from storage)
        let cx = goalX + (entry.wurfbild.x / 100) * goalW;
        let cy = goalY + (entry.wurfbild.y / 100) * goalH;

        // Color Logic
        if (isMiss) {
            doc.setFillColor(150, 150, 150); // Gray
        } else if (isOpponent) {
            doc.setFillColor(0, 0, 255); // Blue
        } else {
            doc.setFillColor(255, 0, 0); // Red
        }

        // Draw Dot
        doc.circle(cx, cy, 1.5, 'F');
    });

    // Caption
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const title = teamFilter === 'home' ? "Heim: Tor-Heatmap" : "Gegner: Tor-Heatmap";
    doc.text(title, x + width / 2, y + height + 5, { align: 'center' });
}

function drawFieldHeatmapToPdf(doc, x, y, width, height, logEntries, teamFilter) {
    // Field metrics
    const fieldX = x + width * 0.1;
    const fieldW = width * 0.8;
    const fieldH = height * 0.9;

    // Draw Field Boundary
    doc.setDrawColor(50, 50, 50);
    doc.setLineWidth(1);
    doc.rect(fieldX, y, fieldW, fieldH); // Whole field rect

    // Draw Goal Rect (Top Center)
    const goalRectW = fieldW * 0.2;
    const goalRectX = fieldX + (fieldW - goalRectW) / 2;
    doc.setFillColor(50, 50, 50);
    doc.rect(goalRectX, y, goalRectW, 2, 'F');

    const centerX = fieldX + fieldW / 2;

    // 6m Line (Solid Arc)
    doc.setDrawColor(50, 50, 50);
    doc.setLineWidth(0.8);
    const r6 = fieldW * 0.3;
    const r9 = fieldW * 0.45;

    // Simplified Symmetrical Polygon for 6m
    const sixMeterPoints = [
        [centerX - r6, y], // Start Left on goal line
        [centerX - r6, y + r6 * 0.5], // Out a bit
        [centerX - r6 * 0.7, y + r6 * 0.9], // Angled
        [centerX, y + r6], // Center Tip
        [centerX + r6 * 0.7, y + r6 * 0.9],
        [centerX + r6, y + r6 * 0.5],
        [centerX + r6, y] // End Right
    ];

    // Draw 6m
    for (let i = 0; i < sixMeterPoints.length - 1; i++) {
        doc.line(sixMeterPoints[i][0], sixMeterPoints[i][1], sixMeterPoints[i + 1][0], sixMeterPoints[i + 1][1]);
    }


    // 9m Line (Dashed)
    doc.setLineDash([2, 1], 0);
    const nineMeterPoints = [
        [centerX - r9, y],
        [centerX - r9, y + r9 * 0.5],
        [centerX - r9 * 0.7, y + r9 * 0.9],
        [centerX, y + r9],
        [centerX + r9 * 0.7, y + r9 * 0.9],
        [centerX + r9, y + r9 * 0.5],
        [centerX + r9, y]
    ];
    for (let i = 0; i < nineMeterPoints.length - 1; i++) {
        doc.line(nineMeterPoints[i][0], nineMeterPoints[i][1], nineMeterPoints[i + 1][0], nineMeterPoints[i + 1][1]);
    }
    doc.setLineDash([], 0);

    // 7m Spot
    doc.circle(centerX, y + r6 + (r9 - r6) * 0.33, 0.5, 'F');

    // Middle Line
    doc.setLineWidth(1);
    doc.line(fieldX, y + fieldH, fieldX + fieldW, y + fieldH);

    // Process Entries
    logEntries.forEach(entry => {
        if (!entry.wurfposition) return;

        const isOpponent = entry.action?.startsWith('Gegner') || entry.gegnerNummer;

        // Filter logic
        if (teamFilter === 'home' && isOpponent) return;
        if (teamFilter === 'away' && !isOpponent) return;

        const isMiss = entry.action === 'Fehlwurf' || entry.action === 'Gegner Wurf Vorbei' ||
            entry.action?.includes('Verworfen') || entry.action?.includes('Gehalten');

        let cx = fieldX + (entry.wurfposition.x / 100) * fieldW;
        let cy = y + (entry.wurfposition.y / 100) * fieldH;

        if (isMiss) {
            doc.setFillColor(150, 150, 150);
        } else if (isOpponent) {
            doc.setFillColor(0, 0, 255);
        } else {
            doc.setFillColor(255, 0, 0);
        }

        doc.circle(cx, cy, 1.5, 'F');
    });

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const title = teamFilter === 'home' ? "Heim: Wurfpositionen" : "Gegner: Wurfpositionen";
    doc.text(title, x + width / 2, y + height + 5, { align: 'center' });
}

// Helper to aggregate Play Stats for a team
function aggregatePlayStats(statsData) {
    const totals = {
        schnelle_mitte: { tore: 0, fehlwurf: 0 },
        tempo_gegenstoss: { tore: 0, fehlwurf: 0 },
        spielzug: { tore: 0, fehlwurf: 0 },
        freies_spiel: { tore: 0, fehlwurf: 0 }
    };

    statsData.forEach(p => {
        if (!p.playStats) return;
        ['schnelle_mitte', 'tempo_gegenstoss', 'spielzug', 'freies_spiel'].forEach(key => {
            if (p.playStats[key]) {
                totals[key].tore += p.playStats[key].tore || 0;
                totals[key].fehlwurf += p.playStats[key].fehlwurf || 0;
            }
        });
    });
    return totals;
}

// Helper to draw the stats table (Shared logic could go here, but keeping inline for now or duplicating safely)
function drawStatsTableForPdf(doc, statsData, startX, startY, title) {
    let xPos = startX;
    let yPos = startY;

    // Headers
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(title, xPos, yPos);
    yPos += 8;

    doc.setFontSize(7); // Smaller font for many columns
    doc.setFont('helvetica', 'bold');

    // Columns: [Label, Width]
    const columns = [
        { header: 'Spieler', width: 30, key: 'name' },
        { header: 'Zeit', width: 10, key: 'time' },
        { header: 'T', width: 7, key: 'tore', title: 'Tore' },
        { header: 'F', width: 7, key: 'feldtore', title: 'Feldtore' },
        { header: '7m', width: 10, key: '7m', title: '7m Tore/Versuche' },
        { header: 'Fehl', width: 8, key: 'fehl', title: 'Fehlwürfe' },
        { header: 'Ast', width: 8, key: 'assist', title: 'Assists' },
        { header: 'Quote', width: 10, key: 'quote', title: 'Wurfquote' },
        { header: 'Ball', width: 8, key: 'ball', title: 'Ballverlust/Tech.Fehler' },
        { header: 'Foul', width: 8, key: 'foul', title: 'Stürmerfoul' },
        { header: 'Blk', width: 8, key: 'block', title: 'Blocks' },
        { header: '1v1+', width: 8, key: '1v1_won', title: '1v1 Gewonnen' },
        { header: '1v1-', width: 8, key: '1v1_lost', title: '1v1 Verloren' },
        { header: '7m+', width: 8, key: '7m_plus', title: '7m Rausgeholt' },
        { header: '2m+', width: 8, key: '2m_plus', title: '2min Rausgeholt' },
        { header: 'G', width: 6, key: 'gelb' },
        { header: '2\'', width: 6, key: '2min' },
        { header: 'R', width: 6, key: 'rot' }
    ];

    // Draw Headers
    let currentX = xPos;
    columns.forEach(col => {
        doc.text(col.header, currentX, yPos);
        currentX += col.width;
    });

    // Draw Line
    yPos += 2;
    doc.setLineWidth(0.5);
    doc.line(xPos, yPos, currentX, yPos);
    yPos += 4;

    // Draw Rows
    doc.setFont('helvetica', 'normal');

    statsData.forEach(stats => {
        if (yPos > 275) { doc.addPage(); yPos = 20; }

        const goals = stats.tore || 0;
        const sevenMGoals = stats.siebenMeterTore || 0;
        const sevenMAttempts = stats.siebenMeterVersuche || 0;
        const feldtore = goals - sevenMGoals;
        const attempts = goals + (stats.fehlwurf || 0);
        const quote = attempts > 0 ? Math.round((goals / attempts) * 100) + '%' : '-';
        const sevenMDisplay = sevenMAttempts > 0 ? `${sevenMGoals}/${sevenMAttempts}` : "0/0";

        // Time formatting
        const timeOnField = stats.timeOnField || 0;
        const m = Math.floor(timeOnField / 60);
        const s = timeOnField % 60;
        const timeStr = `${m}:${s < 10 ? '0' + s : s}`;

        const rowData = {
            name: (`#${stats.number} ${stats.name}`).substring(0, 18),
            time: timeStr,
            tore: String(goals),
            feldtore: String(feldtore),
            '7m': sevenMDisplay,
            fehl: String(stats.fehlwurf || 0),
            assist: String(stats.assist || 0),
            quote: quote,
            ball: String((stats.techFehler || 0) + (stats.ballverlust || 0)),
            foul: String(stats.stuermerfoul || 0),
            block: String(stats.block || 0),
            '1v1_won': String(stats.gewonnen1v1 || 0),
            '1v1_lost': String(stats.oneOnOneLost || 0),
            '7m_plus': String(stats.rausgeholt7m || 0),
            '2m_plus': String(stats.rausgeholt2min || 0),
            gelb: String(stats.gelb || 0),
            '2min': String(stats.zweiMinuten || 0),
            rot: String(stats.rot || 0)
        };

        currentX = xPos;
        columns.forEach(col => {
            doc.text(rowData[col.key], currentX, yPos);
            currentX += col.width;
        });
        yPos += 4;
    });

    return yPos;
}

function drawPlayStatsSummary(doc, statsData, startX, startY) {
    const totals = aggregatePlayStats(statsData);
    const types = [
        { label: 'Tempo Gegenstoß', key: 'tempo_gegenstoss' },
        { label: 'Schnelle Mitte', key: 'schnelle_mitte' },
        { label: 'Spielzug', key: 'spielzug' },
        { label: 'Freies Spiel', key: 'freies_spiel' }
    ];

    let yPos = startY + 5;
    if (yPos > 260) { doc.addPage(); yPos = 20; }

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text("Angriffsvarianten", startX, yPos);
    yPos += 5;

    // Headers
    doc.setFontSize(8);
    doc.text("Art", startX, yPos);
    doc.text("Tore", startX + 40, yPos);
    doc.text("Würfe", startX + 55, yPos);
    doc.text("Quote", startX + 70, yPos);
    yPos += 2;
    doc.line(startX, yPos, startX + 90, yPos);
    yPos += 4;

    doc.setFont('helvetica', 'normal');
    types.forEach(type => {
        const t = totals[type.key];
        const attempts = t.tore + t.fehlwurf;
        const quote = attempts > 0 ? Math.round((t.tore / attempts) * 100) + '%' : '-';

        doc.text(type.label, startX, yPos);
        doc.text(String(t.tore), startX + 40, yPos);
        doc.text(String(attempts), startX + 55, yPos);
        doc.text(quote, startX + 70, yPos);
        yPos += 4;
    });

    return yPos;
}

// Exportiert ein historisches Spiel als PDF
export function exportiereHistorieAlsPdf(game) {
    if (!game || !game.gameLog || game.gameLog.length === 0) {
        customAlert("Keine Daten zum Exportieren.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const heimName = game.teams?.heim || 'Heim';
    const gegnerName = game.teams?.gegner || 'Gegner';
    const endstand = `${game.score.heim}:${game.score.gegner}`;

    // --- Page 1: Overview & Stats ---

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Spielbericht', 105, 20, { align: 'center' });

    // Match Info
    doc.setFontSize(16);
    doc.text(`${heimName} vs ${gegnerName}`, 105, 32, { align: 'center' });

    doc.setFontSize(24);
    doc.setTextColor(0, 100, 0);
    doc.text(endstand, 105, 45, { align: 'center' });
    doc.setTextColor(0, 0, 0);

    // Date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const spielDatum = new Date(game.date).toLocaleDateString('de-DE', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
    doc.text(`Spiel vom: ${spielDatum}`, 105, 55, { align: 'center' });

    // Separator
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 60, 190, 60);

    // Calc Stats
    const statsData = berechneStatistiken(game.gameLog, game.roster);
    const gegnerStats = berechneGegnerStatistiken(game.gameLog);

    // -- HOME STATS --
    let yPos = drawStatsTableForPdf(doc, statsData, 15, 70, `Statistik ${heimName}`);

    // Play Stats Summary (Home)
    yPos = drawPlayStatsSummary(doc, statsData, 15, yPos);

    // -- OPPONENT STATS --
    yPos += 10;
    if (yPos > 250) { doc.addPage(); yPos = 20; }

    yPos = drawStatsTableForPdf(doc, gegnerStats, 15, yPos, `Statistik ${gegnerName}`);

    // Play Stats Summary (Opponent)
    yPos = drawPlayStatsSummary(doc, gegnerStats, 15, yPos);


    // --- Page 2: Visualizations ---
    doc.addPage();
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Visuelle Auswertung', 20, 20);

    // 2x2 Grid
    drawGoalHeatmapToPdf(doc, 20, 30, 80, 60, game.gameLog, 'home');
    drawGoalHeatmapToPdf(doc, 110, 30, 80, 60, game.gameLog, 'away'); // Corrected logic to away
    drawFieldHeatmapToPdf(doc, 20, 110, 80, 100, game.gameLog, 'home');
    drawFieldHeatmapToPdf(doc, 110, 110, 80, 100, game.gameLog, 'away');

    // --- Page 3+: Full Game Log ---
    doc.addPage();
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Vollständiger Spielverlauf', 20, 20);
    yPos = 30;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');

    game.gameLog.forEach(entry => {
        if (yPos > 280) {
            doc.addPage();
            yPos = 20;
        }

        let text = entry.time ? `[${entry.time}] ` : ' ';
        if (entry.playerId) {
            text += `#${entry.playerId} ${entry.playerName}: ${entry.action}`;
        } else if (entry.gegnerNummer) {
            text += `Gegner #${entry.gegnerNummer}: ${entry.action}`;
        } else {
            text += entry.action;
        }
        if (entry.spielstand) {
            text += ` (${entry.spielstand})`;
        }

        const splitText = doc.splitTextToSize(text, 170);
        doc.text(splitText, 20, yPos);
        yPos += 4 * splitText.length;
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('Erstellt mit Team-Tracker', 105, 290, { align: 'center' });

    // Save
    const dateStr = new Date(game.date).toISOString().slice(0, 10);
    doc.save(`spielbericht_${heimName}_vs_${gegnerName}_${dateStr}.pdf`);
}

// Exportiert die aktuelle LIVE-Statistik als PDF
export function exportiereAlsPdf() {
    if (spielstand.gameLog.length === 0) {
        customAlert("Keine Daten zum Exportieren.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const heimName = spielstand.settings.teamNameHeim || 'Heim';
    const gegnerName = spielstand.settings.teamNameGegner || 'Gegner';
    const endstand = `${spielstand.score.heim}:${spielstand.score.gegner}`;

    // --- Page 1: Overview & Stats ---

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Spielbericht', 105, 20, { align: 'center' });

    // Match Info
    doc.setFontSize(16);
    doc.text(`${heimName} vs ${gegnerName}`, 105, 32, { align: 'center' });

    doc.setFontSize(24);
    doc.setTextColor(0, 100, 0);
    doc.text(endstand, 105, 45, { align: 'center' });
    doc.setTextColor(0, 0, 0);

    // Date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const datum = new Date().toLocaleDateString('de-DE', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
    doc.text(`Erstellt am: ${datum}`, 105, 55, { align: 'center' });

    // Separator line
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 60, 190, 60);

    // Calc Stats
    const statsData = berechneStatistiken(); // Uses global state by default
    const gegnerStats = berechneGegnerStatistiken();

    // -- HOME STATS --
    let yPos = drawStatsTableForPdf(doc, statsData, 15, 70, `Statistik ${heimName}`);

    // Play Stats Summary (Home)
    yPos = drawPlayStatsSummary(doc, statsData, 15, yPos);

    // -- OPPONENT STATS --
    yPos += 10;
    if (yPos > 250) { doc.addPage(); yPos = 20; }

    yPos = drawStatsTableForPdf(doc, gegnerStats, 15, yPos, `Statistik ${gegnerName}`);

    // Play Stats Summary (Opponent)
    yPos = drawPlayStatsSummary(doc, gegnerStats, 15, yPos);


    // --- Page 2: Visualizations ---
    doc.addPage();
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Visuelle Auswertung', 20, 20);

    // 2x2 Grid
    drawGoalHeatmapToPdf(doc, 20, 30, 80, 60, spielstand.gameLog, 'home');
    drawGoalHeatmapToPdf(doc, 110, 30, 80, 60, spielstand.gameLog, 'away');

    drawFieldHeatmapToPdf(doc, 20, 110, 80, 100, spielstand.gameLog, 'home');
    drawFieldHeatmapToPdf(doc, 110, 110, 80, 100, spielstand.gameLog, 'away');


    // --- Page 3+: Full Game Log ---
    doc.addPage();
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Vollständiger Spielverlauf', 20, 20);
    yPos = 30;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');

    // Full log iteration
    [...spielstand.gameLog].reverse().forEach(entry => {
        if (yPos > 280) {
            doc.addPage();
            yPos = 20;
        }

        let text = entry.time ? `[${entry.time}] ` : ' ';
        if (entry.playerId) {
            text += `#${entry.playerId} ${entry.playerName}: ${entry.action}`;
        } else if (entry.gegnerNummer) {
            text += `Gegner #${entry.gegnerNummer}: ${entry.action}`;
        } else {
            text += entry.action;
        }
        if (entry.spielstand) {
            text += ` (${entry.spielstand})`;
        }

        const splitText = doc.splitTextToSize(text, 170);
        doc.text(splitText, 20, yPos);
        yPos += 4 * splitText.length;
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('Erstellt mit Team-Tracker', 105, 290, { align: 'center' });

    // Save PDF
    const dateStr = new Date().toISOString().slice(0, 10);
    doc.save(`spielbericht_live_${heimName}_vs_${gegnerName}_${dateStr}.pdf`);
}
