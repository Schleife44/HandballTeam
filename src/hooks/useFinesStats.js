import { useMemo } from 'react';
import { toNum } from '../utils/financeUtils';

export const useFinesStats = (history, roster) => {
  const stats = useMemo(() => {
    if (!history) return { finesPaid: 0, finesUnpaid: 0, otherIncome: 0, expenses: 0, totalBalance: 0, totalSoll: 0 };

    const finesPaid = history.filter(h => (h.category === 'fine' || !h.category) && h.paid).reduce((sum, h) => sum + toNum(h.amount), 0);
    const finesUnpaid = history.filter(h => (h.category === 'fine' || !h.category) && !h.paid).reduce((sum, h) => sum + toNum(h.amount), 0);
    const otherIncome = history.filter(h => h.category === 'income').reduce((sum, h) => sum + toNum(h.amount), 0);
    const expenses = history.filter(h => h.category === 'expense').reduce((sum, h) => sum + toNum(h.amount), 0);
    
    const totalBalance = (finesPaid + otherIncome) - expenses;
    
    return { 
      finesPaid, 
      finesUnpaid, 
      otherIncome, 
      expenses, 
      totalBalance, 
      totalSoll: totalBalance + finesUnpaid 
    };
  }, [history]);

  const playerStats = useMemo(() => {
    if (!roster || !history) return [];

    const sortedRoster = [...roster].sort((a, b) => a.name.trim().localeCompare(b.name.trim(), 'de'));

    return sortedRoster.map(player => {
      const trimmedName = player.name.trim();
      const playerFines = history.filter(h => (h.playerId || "").trim() === trimmedName && (h.category === 'fine' || !h.category));
      return {
        name: player.name,
        number: player.number,
        totalFine: playerFines.reduce((sum, f) => sum + toNum(f.amount), 0),
        unpaidFine: playerFines.filter(f => !f.paid).reduce((sum, f) => sum + toNum(f.amount), 0),
        count: playerFines.length
      };
    });
  }, [history, roster]);

  return { stats, playerStats };
};
