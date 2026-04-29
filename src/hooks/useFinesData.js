import { useEffect } from 'react';
import useStore from '../store/useStore';

export const useFinesData = () => {
  const { 
    squad, 
    fines, 
    setFines, 
    updateFinesSettings, 
    addFineToHistory, 
    updateFineHistory, 
    updateFineCatalog,
    removeFineFromHistory
  } = useStore();

  const { home: roster } = squad;

  // Monthly Fees Auto-Check
  useEffect(() => {
    if (!fines.settings.enabled) return;

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    if (fines.settings.lastProcessedMonth !== currentMonth) {
      if (roster.length > 0) {
        const newHistoryEntries = [];
        roster.forEach(player => {
          const status = fines.settings.playerStatus[player.name] || 'standard';
          if (status === 'excluded') return;

          const amount = status === 'reduced' ? fines.settings.amountReduced : fines.settings.amountStandard;
          
          newHistoryEntries.push({
            id: `month_${currentMonth}_${player.name.replace(/\s/g, '_')}`,
            playerId: player.name,
            fineId: 'monthly_fee',
            category: 'fine',
            date: new Date().toISOString(),
            paid: false,
            amount,
            note: `Monatsbeitrag ${currentMonth}`
          });
        });

        const mergedHistory = [...newHistoryEntries, ...fines.history].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
        setFines({
          ...fines,
          history: mergedHistory,
          settings: { ...fines.settings, lastProcessedMonth: currentMonth }
        });
      }
    }
  }, [fines, roster, setFines]);

  // Sync current month fees if settings or player status changed
  useEffect(() => {
    if (!fines.settings.enabled) return;
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    let changed = false;
    const updatedHistory = fines.history.map(entry => {
      if (entry.fineId === 'monthly_fee' && entry.id.startsWith(`month_${currentMonth}`) && !entry.paid) {
        const status = fines.settings.playerStatus[entry.playerId] || 'standard';
        
        if (status === 'excluded') {
          changed = true;
          return null; 
        }

        const targetAmount = status === 'reduced' ? fines.settings.amountReduced : fines.settings.amountStandard;
        if (entry.amount !== targetAmount) {
          changed = true;
          return { ...entry, amount: targetAmount };
        }
      }
      return entry;
    }).filter(Boolean);

    if (changed) {
      updateFineHistory(updatedHistory);
    }
  }, [fines.settings, updateFineHistory, fines.history]);

  const issueFine = (playerName, fineId, customAmount = null, note = '') => {
    const template = fines.catalog.find(f => f.id === fineId);
    const amount = customAmount !== null ? parseFloat(customAmount) : (template ? template.amount : 0);
    
    const newEntry = {
      id: `ev_${Date.now()}`,
      playerId: playerName,
      fineId: fineId || 'manual',
      category: 'fine',
      date: new Date().toISOString(),
      paid: false,
      amount,
      note: note || (template ? template.name : 'Manuelle Buchung')
    };

    addFineToHistory(newEntry);
  };

  const addTransaction = (type, amount, note) => {
    const newEntry = {
      id: `tr_${Date.now()}`,
      playerId: 'TEAM',
      fineId: type, // 'income' or 'expense'
      category: type,
      date: new Date().toISOString(),
      paid: true, 
      amount: parseFloat(amount),
      note: note
    };

    addFineToHistory(newEntry);
  };

  const togglePayment = (eventId) => {
    updateFineHistory(fines.history.map(e => e.id === eventId ? { ...e, paid: !e.paid } : e));
  };

  const removeHistoryEntry = (eventId) => {
    removeFineFromHistory(eventId);
  };

  const addCatalogItem = (name, amount) => {
    const newItem = { id: `fine_${Date.now()}`, name, amount: parseFloat(amount) };
    updateFineCatalog([...fines.catalog, newItem]);
  };

  const removeCatalogItem = (id) => {
    updateFineCatalog(fines.catalog.filter(f => f.id !== id));
  };

  return {
    fines,
    issueFine,
    addTransaction,
    togglePayment,
    removeHistoryEntry,
    addCatalogItem,
    removeCatalogItem,
    updateSettings: updateFinesSettings
  };
};
