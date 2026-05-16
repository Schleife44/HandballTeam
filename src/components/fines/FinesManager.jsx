import React, { useState, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';

import useStore from '../../store/useStore';
import { useFines } from '../../hooks/useFines';
import { useCollectiveCosts } from '../../hooks/useCollectiveCosts';
import { useFinesStats } from '../../hooks/useFinesStats';
import { formatCurrency } from '../../utils/financeUtils';

// Modular Components
import FinesHeader from './components/FinesHeader';
import FinesNavigation from './components/FinesNavigation';
import FinesDashboard from './components/FinesDashboard';
import FinesHistoryTable from './components/FinesHistoryTable';
import FinesDrinksManager from './components/FinesDrinksManager';
import FinesCatalogManager from './components/FinesCatalogManager';
import FinesSettings from './components/FinesSettings';
import FineTransactionModal from './components/FineTransactionModal';

const FinesManager = () => {
  const { squad, activeMember } = useStore();
  
  // New Modular Hooks
  const { 
    fines, 
    issueFine, 
    addTransaction,
    togglePayment, 
    payAllForPlayer,
    removeHistoryEntry,
    addCatalogItem,
    removeCatalogItem,
    updateSettings,
    requestMonthlyContributions
  } = useFines();

  const {
    pendingDrinks,
    collectiveCostsName,
    updateDrinkAmount,
    bulkUpdateDrinkAmounts,
    settleDrinks,
    setCollectiveCostsName
  } = useCollectiveCosts();

  // Tab State
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Modal State
  const [modalType, setModalType] = useState(null); // 'fine', 'income', 'expense'
  const [error, setError] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [selectedFineId, setSelectedFineId] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [customNote, setCustomNote] = useState('');

  // Permissions
  const myUid = activeMember?.uid || '';
  const isOwner = myUid === (squad?.ownerUid || '');
  const memberFunctions = Array.isArray(activeMember?.function) ? activeMember.function : (activeMember?.function ? [activeMember.function] : []);
  const isKassenwart = memberFunctions.includes('kassenwart');
  const canManageMoney = isOwner || isKassenwart;

  // Data Preparation
  const roster = squad?.home || [];
  const history = useMemo(() => [...(fines.history || [])].sort((a, b) => new Date(b.date) - new Date(a.date)), [fines.history]);
  
  // Externalized Stats Logic
  const { stats, playerStats } = useFinesStats(history, roster);

  const sortedRoster = useMemo(() => [...roster].sort((a, b) => a.name.trim().localeCompare(b.name.trim(), 'de')), [roster]);

  // Handlers
  const resetForm = () => {
    setSelectedPlayer(''); setSelectedFineId(''); setCustomAmount(''); setCustomNote(''); setError('');
  };

  const handleSubmit = () => {
    setError('');
    if (modalType === 'fine') {
      if (!selectedPlayer) { setError('Wähle einen Spieler aus!'); return; }
      if (!selectedFineId) { setError('Wähle eine Strafe oder manuelle Buchung!'); return; }
      if (selectedFineId === 'manual' && !customAmount) { setError('Gib einen Betrag ein!'); return; }
      issueFine(selectedPlayer, selectedFineId, customAmount || null, customNote);
    } else if (modalType === 'income' || modalType === 'expense') {
      if (!customAmount || !customNote) { setError('Betrag und Grund sind Pflichtfelder!'); return; }
      addTransaction(modalType, customAmount, customNote);
    }
    setModalType(null); resetForm();
  };

  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:p-8 space-y-12 animate-in fade-in duration-1000 pb-32">
      
      <FinesHeader 
        canManageMoney={canManageMoney} 
        onOpenModal={setModalType} 
      />

      <FinesNavigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        canManageMoney={canManageMoney} 
      />

      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' && (
          <FinesDashboard 
            key="dash" 
            stats={stats} 
            playerStats={playerStats} 
            roster={sortedRoster}
            history={history}
            teamName={squad?.name}
            finesSettings={fines.settings}
            formatCurrency={formatCurrency} 
          />
        )}
        {activeTab === 'history' && (
          <FinesHistoryTable 
            key="hist" 
            history={history} 
            canManageMoney={canManageMoney} 
            togglePayment={togglePayment} 
            payAllForPlayer={payAllForPlayer} 
            removeEntry={removeHistoryEntry} 
            formatCurrency={formatCurrency} 
          />
        )}
        {activeTab === 'drinks' && (
          <FinesDrinksManager 
            key="drinks" 
            roster={sortedRoster} 
            pendingDrinks={pendingDrinks} 
            collectiveCostsName={collectiveCostsName} 
            onUpdateAmount={updateDrinkAmount} 
            onBulkUpdate={bulkUpdateDrinkAmounts}
            onUpdateName={setCollectiveCostsName} 
            onSettle={settleDrinks} 
            canManage={canManageMoney} 
            formatCurrency={formatCurrency} 
          />
        )}
        {activeTab === 'catalog' && (
          <FinesCatalogManager 
            key="cat" 
            catalog={fines.catalog} 
            addItem={addCatalogItem} 
            removeItem={removeCatalogItem} 
            formatCurrency={formatCurrency} 
          />
        )}
        {activeTab === 'settings' && (
          <FinesSettings 
            key="set" 
            settings={fines.settings} 
            roster={sortedRoster} 
            updateSettings={updateSettings} 
            onRequestMonthly={requestMonthlyContributions} 
          />
        )}
      </AnimatePresence>

      <FineTransactionModal 
        modalType={modalType}
        onClose={() => setModalType(null)}
        error={error}
        roster={sortedRoster}
        catalog={fines.catalog}
        selectedPlayer={selectedPlayer}
        setSelectedPlayer={setSelectedPlayer}
        selectedFineId={selectedFineId}
        setSelectedFineId={setSelectedFineId}
        customAmount={customAmount}
        setCustomAmount={setCustomAmount}
        customNote={customNote}
        setCustomNote={setCustomNote}
        onSubmit={handleSubmit}
        formatCurrency={formatCurrency}
      />
    </div>
  );
};

export default FinesManager;
