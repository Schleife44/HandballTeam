import { spielstand, speichereSpielstand } from './state.js';
import { zeichneRosterListe } from './ui.js';
import { berechneTore, berechneStatistiken, berechneGegnerStatistiken } from './stats.js';

export function exportTeam() {
    if (spielstand.roster.length === 0) {
        alert("Es ist kein Team zum Exportieren vorhanden.");
        return;
    }

    const teamDaten = JSON.stringify(spielstand.roster, null, 2);
    const blob = new Blob([teamDaten], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'handball_team.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

export function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) { return; }

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const importiertesRoster = JSON.parse(e.target.result);

            if (Array.isArray(importiertesRoster) && importiertesRoster.every(p => p.hasOwnProperty('name') && p.hasOwnProperty('number'))) {
                if (confirm("Möchtest du das bestehende Team wirklich überschreiben?")) {
                    spielstand.roster = importiertesRoster;
                    spielstand.roster.sort((a, b) => a.number - b.number);
                    speichereSpielstand();
                    zeichneRosterListe();
                    alert("Team erfolgreich importiert!");
                }
            } else {
                alert("Die Datei hat ein ungültiges Format.");
            }
        } catch (error) {
            console.error("Fehler beim Importieren der Datei:", error);
            alert("Die Datei konnte nicht gelesen werden. Ist es eine gültige JSON-Datei?");
        }
    };
    reader.readAsText(file);
    event.target.value = null;
}

export function exportiereAlsTxt() {
    if (spielstand.gameLog.length === 0) {
        alert("Das Protokoll ist leer. Es gibt nichts zu exportieren.");
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
        row += String(stats.siebenMeter).padEnd(col7m);
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
        alert("Keine Daten zum Exportieren.");
        return;
    }
    let csvContent = "\uFEFF";
    csvContent += "Spieler-Statistik\n";
    csvContent += "Nummer;Name;Tore;7m Raus;Gute Aktion;Fehlwurf;Tech Fehler;Gelb;2min;Rot\n";
    const statsData = berechneStatistiken();
    const toreMap = berechneTore();
    statsData.forEach(s => {
        const tore = toreMap.get(s.number) || 0;
        csvContent += `${s.number};${s.name};${tore};${s.siebenMeter};${s.guteAktion};${s.fehlwurf};${s.techFehler};${s.gelb};${s.zweiMinuten};${s.rot}\n`;
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

export function exportiereAlsPdf() {
    if (spielstand.gameLog.length === 0) {
        alert("Keine Daten zum Exportieren.");
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

    // -- HOME STATS --
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Statistik ${heimName}`, 20, 70);

    const statsData = berechneStatistiken();
    const toreMap = berechneTore();

    // Table headers
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    const headers = ['Spieler', 'Tore', '7m', 'Fehl', 'Quote', 'Gut', 'TF', 'Gelb', '2min', 'Rot'];
    const colWidths = [45, 12, 12, 12, 15, 12, 12, 12, 12, 12];

    let xPos = 20;
    let yPos = 78;

    headers.forEach((header, i) => {
        doc.text(header, xPos, yPos);
        xPos += colWidths[i];
    });

    // Table data
    doc.setFont('helvetica', 'normal');
    yPos += 6;

    statsData.forEach(stats => {
        if (yPos > 270) {
            doc.addPage();
            yPos = 20;
        }

        xPos = 20;
        const tore = toreMap.get(stats.number) || 0;

        // Calculate Quote
        const totalSchuesse = tore + stats.fehlwurf;
        let quote = "-";
        if (totalSchuesse > 0) {
            quote = Math.round((tore / totalSchuesse) * 100) + "%";
        }

        // Format 7m: "Tore/Versuche"
        // If no attempts, show "-" or "0/0"? User asked for fraction.
        // If 0 attempts, maybe just "0/0" or "-"
        let sevenMeterDisplay = "0/0";
        if (stats.siebenMeterVersuche > 0) {
            sevenMeterDisplay = `${stats.siebenMeterTore}/${stats.siebenMeterVersuche}`;
        } else if (stats.siebenMeter > 0 && stats.siebenMeterVersuche === 0) {
            // Fallback if older data or legacy: use "siebenMeter" as 'Rausgeholt' or similar? 
            // No, user specifically asked for Goals/Attempts stats.
            sevenMeterDisplay = "0/0";
        }

        const rowData = [
            `#${stats.number} ${stats.name}`,
            String(tore),
            sevenMeterDisplay, // New Format
            String(stats.fehlwurf),
            quote,
            String(stats.guteAktion),
            String(stats.techFehler),
            String(stats.gelb),
            String(stats.zweiMinuten),
            String(stats.rot)
        ];

        rowData.forEach((cell, i) => {
            doc.text(cell.substring(0, 15), xPos, yPos);
            xPos += colWidths[i];
        });
        yPos += 5;
    });

    // -- OPPONENT STATS --
    yPos += 10;
    if (yPos > 250) { doc.addPage(); yPos = 20; }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Statistik ${gegnerName}`, 20, yPos);
    yPos += 8;

    // Headers again
    xPos = 20;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    headers.forEach((header, i) => {
        doc.text(header, xPos, yPos);
        xPos += colWidths[i];
    });
    yPos += 6;

    // Opponent Data
    const gegnerStats = berechneGegnerStatistiken();
    doc.setFont('helvetica', 'normal');

    gegnerStats.forEach(stats => {
        if (yPos > 270) { doc.addPage(); yPos = 20; }

        xPos = 20;

        const totalSchuesse = stats.tore + stats.fehlwurf;
        let quote = "-";
        if (totalSchuesse > 0) {
            quote = Math.round((stats.tore / totalSchuesse) * 100) + "%";
        }

        let sevenMeterDisplay = "0/0";
        if (stats.siebenMeterVersuche > 0) {
            sevenMeterDisplay = `${stats.siebenMeterTore}/${stats.siebenMeterVersuche}`;
        }

        const rowData = [
            stats.name.substring(0, 20),
            String(stats.tore),
            sevenMeterDisplay, // New Format
            String(stats.fehlwurf),
            quote,
            String(stats.guteAktion),
            String(stats.techFehler),
            String(stats.gelb),
            String(stats.zweiMinuten),
            String(stats.rot)
        ];

        rowData.forEach((cell, i) => {
            doc.text(cell, xPos, yPos);
            xPos += colWidths[i];
        });
        yPos += 5;
    });


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

    // Full log iteration (no slice)
    spielstand.gameLog.forEach(entry => {
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
    doc.save(`spielbericht_${heimName}_vs_${gegnerName}.pdf`);
}
