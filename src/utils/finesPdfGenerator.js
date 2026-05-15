import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toNum, formatCurrency } from './financeUtils';

export const generateFinesPdf = (teamName, roster, history, _, finesSettings) => {
  // Create document
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  
  // Header
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text('Mannschaftskasse - Detaillierte Abrechnung', 14, 15);
  
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Team: ${teamName || 'Mein Team'} | Stand: ${new Date().toLocaleDateString('de-DE')}`, 14, 21);
  
  // 1. Identify all unique collective costs
  const collectiveCostTypes = new Set();
  history.forEach(h => {
    if (h.fineId === 'drinks' && !h.paid) {
      const type = h.note.replace('Sammelkosten: ', '').trim();
      collectiveCostTypes.add(type);
    }
  });
  const sortedCostTypes = Array.from(collectiveCostTypes).sort();

  // 2. Build Header
  const head = [['Spieler', 'Satz', 'Mon.', 'Beitrag', 'Strafen', ...sortedCostTypes, 'Gesamt']];

  // 3. Data aggregation
  const tableData = roster.map(player => {
    const trimmedName = player.name.trim();
    const playerFines = history.filter(h => h.playerId.trim() === trimmedName && !h.paid);
    
    // Calculate Monthly Rate (Grundbetrag)
    const status = finesSettings?.playerStatus?.[trimmedName] || 'standard';
    const standard = toNum(finesSettings?.amountStandard) || 15;
    const reduced = toNum(finesSettings?.amountReduced) || 10;
    const grundbetrag = status === 'reduced' ? reduced : (status === 'excluded' ? 0 : standard);

    // Count open months
    const monthlyEntries = playerFines.filter(h => h.fineId === 'monthly_fee');
    const offeneMonate = monthlyEntries.length;
    const beitraegeSum = monthlyEntries.reduce((sum, h) => sum + toNum(h.amount), 0);
    
    const strafen = playerFines
      .filter(h => h.fineId !== 'monthly_fee' && h.fineId !== 'drinks')
      .reduce((sum, h) => sum + toNum(h.amount), 0);
      
    const dynamicCosts = sortedCostTypes.map(type => {
      return playerFines
        .filter(h => h.fineId === 'drinks' && h.note.includes(type))
        .reduce((sum, h) => sum + toNum(h.amount), 0);
    });

    const totalCollective = dynamicCosts.reduce((sum, val) => sum + val, 0);
    const gesamt = beitraegeSum + strafen + totalCollective;
    
    return [
      player.name,
      formatCurrency(grundbetrag),
      offeneMonate > 0 ? offeneMonate : '--',
      formatCurrency(beitraegeSum),
      formatCurrency(strafen),
      ...dynamicCosts.map(val => formatCurrency(val)),
      formatCurrency(gesamt)
    ];
  }).filter(row => {
    // Get numeric value from the last column (Gesamt) for filtering
    const gesamtStr = row[row.length - 1];
    // Simple way to check if total > 0 using our toNum (which handles currency symbols)
    return toNum(gesamtStr) > 0;
  });

  // 4. Generate Table
  autoTable(doc, {
    startY: 25,
    head: head,
    body: tableData,
    theme: 'striped',
    headStyles: { 
      fillColor: [30, 30, 30], 
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 1.5
    },
    margin: { top: 25, left: 10, right: 10 },
    styles: { 
      fontSize: 8, 
      cellPadding: 1.5,
      lineColor: [220, 220, 220],
      lineWidth: 0.05
    },
    didParseCell: function(data) {
      if (data.column.index >= 1) {
        data.cell.styles.halign = 'right';
      }
      if (data.column.index === head[0].length - 1) {
        data.cell.styles.fontStyle = 'bold';
      }
    }
  });
  
  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for(let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`Seite ${i}/${pageCount} | Mannschaftskasse Detail-Report`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 8, { align: 'center' });
  }

  // Save
  doc.save(`Kassenabrechnung_Detail_${new Date().toISOString().split('T')[0]}.pdf`);
};
