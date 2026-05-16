import { useEffect, useRef } from 'react';
import useStore from '../store/useStore';
import syncService from '../services/SyncService';
import { toNum, getCurrentMonthString } from '../utils/financeUtils';

export const useFines = () => {
  const { 
    squad, 
    fines, 
    activeTeamId,
    updateFinesSettings, 
    addFineToHistory, 
    setFinesHistory,
    updateFineHistory,
    updateFineCatalog,
    removeFineFromHistory
  } = useStore();

  const roster = squad?.home || [];
  const isSyncingRef = useRef(false);
  const historyRef = useRef(fines.history);
  const lastSavedSettingsRef = useRef(JSON.stringify(fines.settings));

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
        
        if (historyRef.current.some(h => h.id === entryId)) return;

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
        if (activeTeamId) syncService.saveBulkFineEntries(activeTeamId, newHistoryEntries);
        setFinesHistory([...newHistoryEntries, ...fines.history]);
        updateFinesSettings({ lastProcessedMonth: currentMonth });
        setTimeout(() => { isSyncingRef.current = false; }, 2000);
      }
    }
  };

  // Monthly Fees Auto-Check
  useEffect(() => {
    if (fines.settings.enabled && !isSyncingRef.current && fines.settings.lastProcessedMonth !== getCurrentMonthString()) {
      requestMonthlyContributions();
    }
  }, [fines.settings.lastProcessedMonth, fines.settings.enabled, roster.length]);

  // Sync current month fees if settings or player status changed
  const playerStatusHash = JSON.stringify(fines.settings.playerStatus);
  useEffect(() => {
    if (!fines.settings.enabled || isSyncingRef.current) return;
    
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
        if (idsToDelete.length > 0) {
          idsToDelete.forEach(id => syncService.deleteFineEntry(activeTeamId, id));
        }
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
    
    addFineToHistory({
      id: `ev_${Date.now()}`,
      playerId: playerName,
      fineId: fineId || 'manual',
      category: 'fine',
      date: new Date().toISOString(),
      paid: false,
      amount,
      note: note || (template ? template.name : 'Manuelle Buchung')
    });
  };

  const addTransaction = (type, amount, note) => {
    addFineToHistory({
      id: `tr_${Date.now()}`,
      playerId: 'TEAM',
      fineId: type,
      category: type,
      date: new Date().toISOString(),
      paid: true, 
      amount: toNum(amount),
      note: note
    });
  };

  const togglePayment = (eventId) => {
    updateFineHistory(fines.history.map(e => e.id === eventId ? { ...e, paid: !e.paid } : e));
  };

  const payAllForPlayer = (playerName) => {
    updateFineHistory(fines.history.map(e => (e.playerId === playerName && !e.paid) ? { ...e, paid: true } : e));
  };

  const addCatalogItem = (name, amount) => {
    updateFineCatalog([...fines.catalog, { id: `fine_${Date.now()}`, name, amount: toNum(amount) }]);
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
    removeHistoryEntry: removeFineFromHistory,
    addCatalogItem,
    removeCatalogItem,
    updateSettings: updateFinesSettings,
    requestMonthlyContributions
  };
};
