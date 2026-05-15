import { useEffect, useRef } from 'react';
import useStore from '../store/useStore';
import syncService from '../services/SyncService';
import { toNum, getCurrentMonthString } from '../utils/financeUtils';

export const useFinesData = () => {
  const { 
    squad, 
    fines, 
    activeTeamId,
    setFines, 
    setPendingDrinks,
    setFinesHistory,
    setCollectiveCostsName,
    updateFinesSettings, 
    addFineToHistory, 
    bulkAddFineEntries,
    updateFineHistory,
    updateFineCatalog,
    removeFineFromHistory
  } = useStore();

  const roster = squad?.home || [];
  const isSyncingRef = useRef(false);
  const historyRef = useRef(fines.history);
  const lastSavedSettingsRef = useRef(JSON.stringify(fines.settings));
  const saveTimeoutRef = useRef(null);

  // Keep historyRef updated without triggering effects
  useEffect(() => {
    historyRef.current = fines.history;
  }, [fines.history]);

  const requestMonthlyContributions = () => {
    if (isSyncingRef.current) return;
    
    const currentMonth = getCurrentMonthString();
    
    if (roster.length > 0) {
      const newHistoryEntries = [];
      roster.forEach(player => {
        const trimmedName = (player.name || "").trim();
        if (!trimmedName) return;

        const status = fines.settings.playerStatus?.[trimmedName] || 'standard';
        if (status === 'excluded') return;

        const standard = toNum(fines.settings.amountStandard) || 15;
        const reduced = toNum(fines.settings.amountReduced) || 10;
        const amount = status === 'reduced' ? reduced : standard;
        
        const safeName = trimmedName.replace(/[^a-zA-Z0-9]/g, '_');
        const entryId = `month_${currentMonth}_${safeName}`;
        
        const exists = historyRef.current.some(h => h.id === entryId);
        if (exists) return;

        newHistoryEntries.push({
          id: entryId,
          playerId: trimmedName,
          fineId: 'monthly_fee',
          category: 'fine',
          date: new Date().toISOString(),
          paid: false,
          amount,
          note: `Monatsbeitrag ${currentMonth}`
        });
      });

      if (newHistoryEntries.length > 0) {
        isSyncingRef.current = true;
        if (activeTeamId) {
          syncService.saveBulkFineEntries(activeTeamId, newHistoryEntries);
        }
        setFinesHistory([...newHistoryEntries, ...fines.history]);
        
        // Update settings but block recursive sync
        const updatedSettings = { ...fines.settings, lastProcessedMonth: currentMonth };
        lastSavedSettingsRef.current = JSON.stringify(updatedSettings);
        updateFinesSettings({ lastProcessedMonth: currentMonth });
        
        setTimeout(() => { isSyncingRef.current = false; }, 2000);
      }
    }
  };

  // Monthly Fees Auto-Check
  useEffect(() => {
    if (!fines.settings.enabled || isSyncingRef.current) return;

    const currentMonth = getCurrentMonthString();

    if (fines.settings.lastProcessedMonth !== currentMonth) {
      requestMonthlyContributions();
    }
  }, [fines.settings.lastProcessedMonth, fines.settings.enabled, roster.length]);

  // Sync current month fees if settings or player status changed
  const playerStatusHash = JSON.stringify(fines.settings.playerStatus);
  useEffect(() => {
    if (!fines.settings.enabled || isSyncingRef.current) return;
    
    const settingsStr = JSON.stringify(fines.settings);
    if (settingsStr === lastSavedSettingsRef.current) return; // Skip if we just saved this
    
    const currentMonth = getCurrentMonthString();

    let changed = false;
    const entriesToUpdate = [];
    const idsToDelete = [];

    const updatedHistory = historyRef.current.map(entry => {
      if (entry.fineId === 'monthly_fee' && !entry.paid) {
        if (entry.id.includes(currentMonth) || entry.note?.includes(currentMonth)) {
          const playerName = (entry.playerId || "").trim();
          const status = fines.settings.playerStatus?.[playerName] || 'standard';
          
          if (status === 'excluded') {
            changed = true;
            idsToDelete.push(entry.id);
            return null; 
          }
          
          const standard = toNum(fines.settings.amountStandard);
          const reduced = toNum(fines.settings.amountReduced);
          const correctAmount = status === 'reduced' ? reduced : standard;

          if (toNum(entry.amount) !== correctAmount) {
            changed = true;
            const updatedEntry = { ...entry, amount: correctAmount };
            entriesToUpdate.push(updatedEntry);
            return updatedEntry;
          }
        }
      }
      return entry;
    }).filter(Boolean);

    if (changed) {
      isSyncingRef.current = true;
      if (activeTeamId) {
        syncService.saveBulkFineEntries(activeTeamId, entriesToUpdate);
      }
      if (activeTeamId && idsToDelete.length > 0) {
        idsToDelete.forEach(id => syncService.deleteFineEntry(activeTeamId, id));
      }
      setFinesHistory(updatedHistory);
      setTimeout(() => { isSyncingRef.current = false; }, 2000);
    }
  }, [
    fines.settings.enabled, 
    fines.settings.amountStandard, 
    fines.settings.amountReduced, 
    playerStatusHash
  ]);

  const issueFine = (playerName, fineId, customAmount = null, note = '') => {
    const template = fines.catalog.find(f => f.id === fineId);
    const amount = customAmount !== null ? toNum(customAmount) : (template ? toNum(template.amount) : 0);
    
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
      fineId: type,
      category: type,
      date: new Date().toISOString(),
      paid: true, 
      amount: toNum(amount),
      note: note
    };

    addFineToHistory(newEntry);
  };

  const updateDrinkAmount = (playerName, amount) => {
    const updatedDrinks = { ...fines.pendingDrinks, [playerName]: amount };
    const updatedFines = { ...fines, pendingDrinks: updatedDrinks };
    
    setPendingDrinks(updatedDrinks);
    debouncedSaveFines(updatedFines);
  };

  const bulkUpdateDrinkAmounts = (amountOrData) => {
    let updatedDrinks = {};
    if (typeof amountOrData === 'object' && amountOrData !== null) {
      updatedDrinks = amountOrData;
    } else {
      roster.forEach(p => {
        updatedDrinks[p.name] = amountOrData;
      });
    }
    
    const updatedFines = { ...fines, pendingDrinks: updatedDrinks };
    setPendingDrinks(updatedDrinks);
    debouncedSaveFines(updatedFines);
  };

  const settleDrinks = () => {
    const entries = [];
    const costName = fines.collectiveCostsName || 'Getränke';

    Object.entries(fines.pendingDrinks || {}).forEach(([playerName, amount]) => {
      const numericAmount = toNum(amount);
      if (numericAmount <= 0) return;
      
      entries.push({
        id: `drinks_${Date.now()}_${playerName.replace(/\s/g, '_')}`,
        playerId: playerName,
        fineId: 'drinks',
        category: 'fine',
        date: new Date().toISOString(),
        paid: false,
        amount: numericAmount,
        note: `Sammelkosten: ${costName}`
      });
    });

    if (entries.length > 0) {
      if (activeTeamId) {
        syncService.saveBulkFineEntries(activeTeamId, entries);
      }
      // Update local state in one go without triggering individual syncs
      setFinesHistory([...entries, ...fines.history]);
      
      setPendingDrinks({});
      setCollectiveCostsName('Getränke');
    }
  };

  const togglePayment = (eventId) => {
    updateFineHistory(fines.history.map(e => e.id === eventId ? { ...e, paid: !e.paid } : e));
  };

  const payAllForPlayer = (playerName) => {
    updateFineHistory(fines.history.map(e => 
      (e.playerId === playerName && !e.paid) ? { ...e, paid: true } : e
    ));
  };

  const removeHistoryEntry = (eventId) => {
    removeFineFromHistory(eventId);
  };

  const addCatalogItem = (name, amount) => {
    const newItem = { id: `fine_${Date.now()}`, name, amount: toNum(amount) };
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
    payAllForPlayer,
    removeHistoryEntry,
    addCatalogItem,
    removeCatalogItem,
    updateDrinkAmount,
    bulkUpdateDrinkAmounts,
    settleDrinks,
    setCollectiveCostsName,
    updateSettings: updateFinesSettings,
    requestMonthlyContributions
  };
};
