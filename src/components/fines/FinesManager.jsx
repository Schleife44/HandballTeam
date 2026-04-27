import React, { useState } from 'react';
import { 
  Euro, Users, History, Settings2, Plus, Trash2, 
  CheckCircle, Circle, TrendingUp, TrendingDown, Wallet 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Store
import useStore from '../../store/useStore';

// UI
import Button from '../ui/Button';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Modal from '../ui/Modal';

// Hooks
import { useFinesData } from '../../hooks/useFinesData';

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
  const finesPaid = history.filter(h => (h.category === 'fine' || !h.category) && h.paid).reduce((sum, h) => sum + (h.amount || 0), 0);
  const finesUnpaid = history.filter(h => (h.category === 'fine' || !h.category) && !h.paid).reduce((sum, h) => sum + (h.amount || 0), 0);
  const otherIncome = history.filter(h => h.category === 'income').reduce((sum, h) => sum + (h.amount || 0), 0);
  const expenses = history.filter(h => h.category === 'expense').reduce((sum, h) => sum + (h.amount || 0), 0);

  const totalBalance = (finesPaid + otherIncome) - expenses;

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
            <Button 
              variant="outline"
              onClick={() => setModalType('expense')}
              icon={TrendingDown}
              className="text-red-500 border-red-500/20 hover:bg-red-500/10"
            >
              Ausgabe
            </Button>
            <Button 
              variant="outline"
              onClick={() => setModalType('income')}
              icon={TrendingUp}
              className="text-blue-500 border-blue-500/20 hover:bg-blue-500/10"
            >
              Einnahme
            </Button>
            <Button 
              variant="primary"
              onClick={() => setModalType('fine')}
              icon={Plus}
            >
              Strafe
            </Button>
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
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <DashStatCard label="Kassenstand (Ist)" value={formatCurrency(totalBalance)} icon={Wallet} color="text-brand" />
              <DashStatCard label="Gezahlte Strafen" value={formatCurrency(finesPaid)} icon={CheckCircle} color="text-brand" />
              <DashStatCard label="Sonst. Einnahmen" value={formatCurrency(otherIncome)} icon={TrendingUp} color="text-blue-400" />
              <DashStatCard label="Ausgaben" value={formatCurrency(expenses)} icon={TrendingDown} color="text-red-400" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12 items-start">
              <Card className="p-8" title="Schulden-Ranking" icon={Users}>
                <div className="space-y-4">
                  {playerStats.map((ps, idx) => (
                    <div key={idx} className="flex items-center justify-between p-5 rounded-[2rem] bg-zinc-900/40 border border-zinc-800/40 hover:border-brand/30 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-500 group-hover:bg-brand group-hover:text-black transition-all italic">
                          #{ps.number}
                        </div>
                        <div>
                          <p className="text-sm font-black text-zinc-100 uppercase italic leading-none">{ps.name}</p>
                          <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest mt-1">Saison 25/26</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`text-xl font-black italic tabular-nums ${ps.debt > 0 ? 'text-red-500' : 'text-brand'}`}>
                          {formatCurrency(ps.debt)}
                        </span>
                        {ps.debt > 0 && <span className="text-[7px] font-bold text-red-500/50 uppercase tracking-tighter">Zahlung ausstehend</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="space-y-8">
                <Card className="p-8 bg-gradient-to-br from-brand/20 to-transparent border-brand/20 relative overflow-hidden group">
                   <div className="absolute -right-6 -bottom-6 text-brand/5 group-hover:text-brand/10 transition-all rotate-12">
                    <Euro size={120} fill="currentColor" />
                  </div>
                  <h3 className="text-xl font-black text-white uppercase italic mb-2 relative z-10">Real Cash</h3>
                  <div className="text-4xl font-black text-brand italic tracking-tighter mb-4 relative z-10">{formatCurrency(totalBalance)}</div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase leading-relaxed max-w-[200px] relative z-10">Aktuell physisch in der Kasse vorhandenes Geld.</p>
                </Card>

                <Card className="p-8" title="Letzte Aktivitäten" icon={History}>
                  <div className="space-y-4">
                    {fines.history.slice(0, 5).map((h, i) => (
                      <div key={i} className="flex items-center gap-3 py-2 border-b border-zinc-800/30 last:border-0">
                        <div className={`w-2 h-2 rounded-full ${h.category === 'expense' ? 'bg-red-500' : h.category === 'income' ? 'bg-blue-500' : (h.paid ? 'bg-brand' : 'bg-red-500/50')}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-black text-zinc-100 uppercase truncate leading-none">{h.playerId === 'TEAM' ? h.category : h.playerId}</p>
                          <p className="text-[8px] font-bold text-zinc-500 uppercase mt-1 truncate">{h.note}</p>
                        </div>
                        <span className={`text-[10px] font-black italic tabular-nums ${h.category === 'expense' ? 'text-red-500' : h.category === 'income' ? 'text-blue-500' : 'text-zinc-400'}`}>
                          {h.category === 'expense' ? '-' : ''}{formatCurrency(h.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </motion.div>
        )}

        {activeView === 'history' && (
          <motion.div 
            key="history"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card noPadding className="p-8" title="Buchungsjournal" icon={History}>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.3em] border-b border-zinc-800/40">
                      <th className="pb-4 px-4">Datum</th>
                      <th className="pb-4 px-4">Typ</th>
                      <th className="pb-4 px-4">Beteiligter</th>
                      <th className="pb-4 px-4">Grund / Notiz</th>
                      <th className="pb-4 px-4">Betrag</th>
                      <th className="pb-4 px-4">Status</th>
                      <th className="pb-4 px-4 text-right">Aktion</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-bold">
                    {fines.history.map((h, i) => (
                      <tr key={i} className="border-b border-zinc-800/10 text-zinc-400 hover:bg-zinc-900/30 transition-colors">
                        <td className="py-5 px-4 tabular-nums opacity-60">
                          {new Date(h.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                        </td>
                        <td className="py-5 px-4">
                          <Badge variant={h.category === 'expense' ? 'danger' : h.category === 'income' ? 'primary' : 'outline'} className="text-[7px]">
                            {h.category}
                          </Badge>
                        </td>
                        <td className="py-5 px-4 font-black text-zinc-100 uppercase italic">
                          {h.playerId === 'TEAM' ? <span className="text-zinc-500">Kasse</span> : h.playerId}
                        </td>
                        <td className="py-5 px-4 opacity-80">{h.note}</td>
                        <td className={`py-5 px-4 font-black italic ${h.category === 'expense' ? 'text-red-500' : h.category === 'income' ? 'text-blue-500' : 'text-zinc-100'}`}>
                          {h.category === 'expense' ? '-' : ''}{formatCurrency(h.amount)}
                        </td>
                        <td className="py-5 px-4">
                          {(h.category === 'fine' || !h.category) ? (
                            <button 
                              onClick={() => togglePayment(h.id)}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all
                                ${h.paid ? 'bg-brand/10 border-brand/50 text-brand' : 'bg-red-500/10 border-red-500/50 text-red-500'}`}
                            >
                              {h.paid ? <CheckCircle size={12} /> : <Circle size={12} />}
                              <span className="text-[8px] font-black uppercase tracking-widest">{h.paid ? 'Bezahlt' : 'Offen'}</span>
                            </button>
                          ) : (
                            <span className="flex items-center gap-2 px-3 py-1.5 text-zinc-600">
                              <CheckCircle size={12} />
                              <span className="text-[8px] font-black uppercase tracking-widest">Abgeschlossen</span>
                            </span>
                          )}
                        </td>
                        <td className="py-5 px-4 text-right">
                          {canManageMoney && (
                            <Button variant="ghost" size="icon" icon={Trash2} onClick={() => removeHistoryEntry(h.id)} className="text-zinc-600 hover:text-red-500" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}

        {activeView === 'catalog' && (
          <motion.div 
            key="catalog" 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }} 
            className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12"
          >
            <Card className="p-8" title="Aktiver Strafenkatalog" icon={Settings2}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fines.catalog.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-6 rounded-[2rem] bg-zinc-900/40 border border-zinc-800 hover:border-brand/30 transition-all group">
                    <div className="min-w-0">
                      <p className="text-xs font-black text-zinc-100 uppercase italic truncate">{item.name}</p>
                      <p className="text-[14px] font-black text-brand italic mt-1">{formatCurrency(item.amount)}</p>
                    </div>
                    <Button variant="ghost" size="icon" icon={Trash2} onClick={() => removeCatalogItem(item.id)} className="text-zinc-500 hover:text-red-500" />
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-8" title="Vorlage hinzufügen" icon={Plus}>
              <div className="space-y-4">
                <Input label="Name der Strafe" id="newFineName" placeholder="z.B. Zu spät Training" />
                <Input label="Betrag (€)" id="newFineAmount" type="number" placeholder="5.00" />
                <Button 
                  variant="primary" 
                  className="w-full py-4 mt-4"
                  onClick={() => { 
                    const name = document.getElementById('newFineName').value; 
                    const amount = document.getElementById('newFineAmount').value; 
                    if (name && amount) { 
                      addCatalogItem(name, amount); 
                      document.getElementById('newFineName').value = ''; 
                      document.getElementById('newFineAmount').value = ''; 
                    } 
                  }}
                >
                  Vorlage Speichern
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {activeView === 'settings' && (
          <motion.div 
            key="settings" 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }} 
            className="grid grid-cols-1 lg:grid-cols-2 gap-12"
          >
            <Card className="p-8" title="Monatsbeiträge" icon={Euro}>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-6 bg-zinc-900/40 rounded-3xl border border-zinc-800">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-brand/10 rounded-2xl text-brand"><Euro size={24} /></div>
                    <div>
                      <h4 className="text-xs font-black uppercase text-zinc-100 italic">Automatischer Einzug</h4>
                      <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-1">Erstellt jeden 1. des Monats Beiträge</p>
                    </div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={fines.settings.enabled} 
                    onChange={(e) => updateSettings({ enabled: e.target.checked })} 
                    className="w-6 h-6 accent-brand rounded-lg" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input 
                    label="Standard (€)" 
                    type="number" 
                    value={fines.settings.amountStandard} 
                    onChange={(e) => updateSettings({ amountStandard: parseFloat(e.target.value) || 0 })} 
                  />
                  <Input 
                    label="Ermäßigt (€)" 
                    type="number" 
                    value={fines.settings.amountReduced} 
                    onChange={(e) => updateSettings({ amountReduced: parseFloat(e.target.value) || 0 })} 
                  />
                </div>
              </div>
            </Card>
            <Card className="p-8" title="Spieler Status" icon={Users}>
              <div className="space-y-3">
                {roster.map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/20 border border-zinc-800/50">
                    <span className="text-[11px] font-black text-zinc-100 uppercase italic">{p.name}</span>
                    <Select 
                      className="w-32"
                      value={fines.settings.playerStatus[p.name] || 'standard'} 
                      onChange={(e) => { 
                        const newStatus = { ...fines.settings.playerStatus, [p.name]: e.target.value }; 
                        updateSettings({ playerStatus: newStatus }); 
                      }}
                      options={[
                        { value: 'standard', label: 'Standard' },
                        { value: 'reduced', label: 'Ermäßigt' },
                        { value: 'excluded', label: 'Befreit' }
                      ]}
                    />
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal
        isOpen={!!modalType}
        onClose={() => { setModalType(null); setError(''); }}
        title={modalType === 'fine' ? 'Strafe vergeben' : modalType === 'income' ? 'Einnahme buchen' : 'Ausgabe buchen'}
        footer={
          <div className="flex flex-col gap-4 w-full">
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl flex items-center gap-3"
                >
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="flex gap-4">
              <Button variant="ghost" className="flex-1 py-4" onClick={() => { setModalType(null); setError(''); }}>Abbrechen</Button>
              <Button variant="primary" className="flex-1 py-4" onClick={handleSubmit}>Bestätigen</Button>
            </div>
          </div>
        }
      >
        <div className="space-y-6 py-4">
          {modalType === 'fine' && (
            <>
              <Select 
                label="Spieler auswählen"
                value={selectedPlayer} 
                onChange={(e) => setSelectedPlayer(e.target.value)}
                options={[
                  { value: '', label: 'Wähle einen Spieler...' },
                  ...roster.map(p => ({ value: p.name, label: `${p.name} (#${p.number})` }))
                ]}
              />
              <Select 
                label="Grund (Vorlage)"
                value={selectedFineId} 
                onChange={(e) => setSelectedFineId(e.target.value)}
                options={[
                  { value: '', label: 'Vorlage wählen...' },
                  ...fines.catalog.map(f => ({ value: f.id, label: `${f.name} (${formatCurrency(f.amount)})` })),
                  { value: 'manual', label: 'Manuelle Buchung (Eigener Betrag)' }
                ]}
              />
            </>
          )}

          {(selectedFineId === 'manual' || modalType === 'income' || modalType === 'expense') && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
              <Input 
                label="Betrag (€)"
                type="number" 
                value={customAmount} 
                onChange={(e) => setCustomAmount(e.target.value)} 
              />
              <Input 
                label="Grund / Notiz"
                value={customNote} 
                onChange={(e) => setCustomNote(e.target.value)} 
              />
            </motion.div>
          )}
        </div>
      </Modal>

    </div>
  );
};

const DashStatCard = ({ icon: Icon, label, value, color }) => (
  <Card className="p-6">
    <div className="flex items-center gap-4">
      <div className={`p-3 bg-zinc-950 rounded-2xl border border-zinc-800 ${color}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{label}</p>
        <p className={`text-xl font-black italic uppercase tracking-tighter mt-1 ${color}`}>{value}</p>
      </div>
    </div>
  </Card>
);

export default FinesManager;
