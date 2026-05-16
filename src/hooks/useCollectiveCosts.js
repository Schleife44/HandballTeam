import { useCallback } from 'react';
import useStore from '../store/useStore';
import syncService from '../services/SyncService';
import { toNum } from '../utils/financeUtils';

export const useCollectiveCosts = () => {
  const { 
    fines, 
    activeTeamId,
    squad,
    setPendingDrinks,
    setCollectiveCostsName,
    setFinesHistory
  } = useStore();

  const roster = squad?.home || [];

  const updateDrinkAmount = (playerName, amount) => {
    const updatedDrinks = { ...fines.pendingDrinks, [playerName]: amount };
    setPendingDrinks(updatedDrinks);
    
    // Save to sync service (assuming debounced saving is handled by the store or service)
    if (activeTeamId) {
      syncService.savePendingDrinks(activeTeamId, updatedDrinks);
    }
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
    
    setPendingDrinks(updatedDrinks);
    if (activeTeamId) {
      syncService.savePendingDrinks(activeTeamId, updatedDrinks);
    }
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
        syncService.savePendingDrinks(activeTeamId, {});
      }
      
      setFinesHistory([...entries, ...fines.history]);
      setPendingDrinks({});
      setCollectiveCostsName('Getränke');
    }
  };

  return {
    pendingDrinks: fines.pendingDrinks || {},
    collectiveCostsName: fines.collectiveCostsName || 'Getränke',
    updateDrinkAmount,
    bulkUpdateDrinkAmounts,
    settleDrinks,
    setCollectiveCostsName
  };
};
