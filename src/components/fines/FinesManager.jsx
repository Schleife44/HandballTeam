import React, { useState } from 'react';
import { 
  Plus, TrendingUp, TrendingDown, Wallet, History, Settings2, Users 
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

// Store
import useStore from '../../store/useStore';

// UI
import Button from '../ui/Button';
import Badge from '../ui/Badge';

// Hooks
import { useFinesData } from '../../hooks/useFinesData';

// Sub-components
import FinesDashboard from './components/FinesDashboard';
import FinesHistoryTable from './components/FinesHistoryTable';
import FinesCatalogManager from './components/FinesCatalogManager';
import FinesSettings from './components/FinesSettings';
import FineTransactionModal from './components/FineTransactionModal';

const FinesManager = () => {
  const { squad, activeMember } = useStore();
  const { 
    fines, 
    issueFine, 
    addTransaction,
    togglePayment, 
    removeHistoryEntry, 
    addCatalogItem, 
    removeCatalogItem, 
    updateSettings 
  } = useFinesData();

  const [activeView, setActiveView] = useState('dashboard');
  const [modalType, setModalType] = useState(null); // 'fine', 'income', 'expense'
  const [error, setError] = useState('');
  
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [selectedFineId, setSelectedFineId] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [customNote, setCustomNote] = useState('');

  const roster = squad?.home || [];
  
  // Permissions
  const myUid = activeMember?.uid || '';
  const isOwner = myUid === (squad?.ownerUid || '');
  const memberFunctions = Array.isArray(activeMember?.function) 
    ? activeMember.function 
    : (activeMember?.function ? [activeMember.function] : []);
  const isKassenwart = memberFunctions.includes('kassenwart');
  const canManageMoney = isOwner || isKassenwart;

  // Calculations
  const history = fines?.history || [];
  const stats = {
    finesPaid: history.filter(h => (h.category === 'fine' || !h.category) && h.paid).reduce((sum, h) => sum + (h.amount || 0), 0),
    finesUnpaid: history.filter(h => (h.category === 'fine' || !h.category) && !h.paid).reduce((sum, h) => sum + (h.amount || 0), 0),
    otherIncome: history.filter(h => h.category === 'income').reduce((sum, h) => sum + (h.amount || 0), 0),
    expenses: history.filter(h => h.category === 'expense').reduce((sum, h) => sum + (h.amount || 0), 0),
  };
  stats.totalBalance = (stats.finesPaid + stats.otherIncome) - stats.expenses;

  const playerStats = (Array.isArray(roster) ? roster : []).map(player => {
    const playerFines = history.filter(h => h.playerId === player.name && (h.category === 'fine' || !h.category));
    const debt = playerFines.reduce((sum, h) => sum + (h.paid ? 0 : (h.amount || 0)), 0);
    return { name: player.name, debt, number: player.number };
  }).sort((a, b) => b.debt - a.debt);

  const handleSubmit = () => {
    setError('');
    if (modalType === 'fine') {
      if (!selectedPlayer) { setError('Wähle einen Spieler aus!'); return; }
      if (!selectedFineId) { setError('Wähle eine Strafe oder manuelle Buchung!'); return; }
      if (selectedFineId === 'manual' && !customAmount) { setError('Gib einen Betrag ein!'); return; }
      issueFine(selectedPlayer, selectedFineId, customAmount || null, customNote);
    } else if (modalType === 'income' || modalType === 'expense') {
      if (!customAmount) { setError('Gib einen Betrag ein!'); return; }
      if (!customNote) { setError('Gib einen Grund an!'); return; }
      addTransaction(modalType, customAmount, customNote);
    }
    setModalType(null);
    resetForm();
  };

  const resetForm = () => {
    setSelectedPlayer('');
    setSelectedFineId('');
    setCustomAmount('');
    setCustomNote('');
    setError('');
  };

  const formatCurrency = (val) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(val);

  return (
    <div className="max-w-[1200px] mx-auto pb-32 px-8 pt-4 space-y-12 animate-in fade-in duration-1000">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-5xl font-black tracking-tighter uppercase italic text-zinc-100">Kasse</h1>
            <Badge variant="brand" className="px-3 py-1 text-[10px]">Active</Badge>
          </div>
          <p className="text-[10px] font-black uppercase text-zinc-600 tracking-[0.4em]">Mannschaftskasse & Strafenkatalog</p>
        </div>

        {canManageMoney && (
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setModalType('expense')} icon={TrendingDown} className="text-red-500 border-red-500/20 hover:bg-red-500/10">Ausgabe</Button>
            <Button variant="outline" onClick={() => setModalType('income')} icon={TrendingUp} className="text-blue-500 border-blue-500/20 hover:bg-blue-500/10">Einnahme</Button>
            <Button variant="primary" onClick={() => setModalType('fine')} icon={Plus}>Strafe</Button>
          </div>
        )}
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex p-1.5 bg-zinc-900/40 rounded-[2rem] border border-zinc-800 backdrop-blur-xl w-fit">
        {[
          { id: 'dashboard', label: 'Übersicht', icon: Wallet },
          { id: 'history', label: 'Historie', icon: History },
          { id: 'catalog', label: 'Strafenkatalog', icon: Settings2, restricted: true },
          { id: 'settings', label: 'Einstellungen', icon: Users, restricted: true }
        ].filter(tab => !tab.restricted || canManageMoney).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={`flex items-center gap-2 px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase transition-all
              ${activeView === tab.id ? 'bg-zinc-100 text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-100'}`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeView === 'dashboard' && (
          <FinesDashboard stats={stats} playerStats={playerStats} recentActivity={history.slice(0, 5)} formatCurrency={formatCurrency} />
        )}
        {activeView === 'history' && (
          <FinesHistoryTable history={history} canManageMoney={canManageMoney} togglePayment={togglePayment} removeEntry={removeHistoryEntry} formatCurrency={formatCurrency} />
        )}
        {activeView === 'catalog' && (
          <FinesCatalogManager catalog={fines.catalog} onAddItem={addCatalogItem} onRemoveItem={removeCatalogItem} formatCurrency={formatCurrency} />
        )}
        {activeView === 'settings' && (
          <FinesSettings settings={fines.settings} roster={roster} updateSettings={updateSettings} />
        )}
      </AnimatePresence>

      <FineTransactionModal 
        modalType={modalType}
        onClose={() => { setModalType(null); setError(''); }}
        error={error}
        roster={roster}
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
