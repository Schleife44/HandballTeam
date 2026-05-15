import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Receipt, RefreshCw, Euro, AlertCircle, X, Check, Type } from 'lucide-react';
import Card from '../../ui/Card';
import Button from '../../ui/Button';

const FinesDrinksManager = ({ 
  roster, 
  pendingDrinks, 
  collectiveCostsName,
  onUpdateAmount,
  onBulkUpdate,
  onUpdateName,
  onSettle,
  canManage,
  formatCurrency
}) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [bulkAmount, setBulkAmount] = useState('60');
  const [selectedIds, setSelectedIds] = useState(new Set(roster.map(p => p.id)));
  const totalAmount = Object.values(pendingDrinks).reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0);

  const handleSettle = () => {
    onSettle();
    setShowConfirm(false);
  };

  const toggleAll = () => {
    if (selectedIds.size === roster.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(roster.map(p => p.id)));
    }
  };

  const togglePlayer = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const applyBulk = () => {
    if (!bulkAmount) return;
    const updated = { ...pendingDrinks };
    roster.forEach(p => {
      if (selectedIds.has(p.id)) {
        updated[p.name] = bulkAmount;
      }
    });
    onBulkUpdate(updated);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      {/* Stats Summary & Title */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 bg-zinc-900/40 border-zinc-800">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500"><Receipt size={24} /></div>
            <div>
              <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Offen (Gesamte Liste)</p>
              <h3 className="text-3xl font-black text-white italic">{formatCurrency(totalAmount)}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-zinc-900/40 border-zinc-800">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand/10 rounded-2xl text-brand"><Type size={24} /></div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-2">Bezeichnung der Abrechnung</p>
              <input 
                type="text"
                placeholder="z.B. Trikots, Getränke..."
                value={collectiveCostsName}
                onChange={(e) => onUpdateName(e.target.value)}
                disabled={!canManage}
                className="w-full bg-black/40 border border-zinc-800 rounded-xl py-2 px-3 text-sm font-black text-white outline-none focus:border-brand/50 transition-colors uppercase italic"
              />
            </div>
          </div>
        </Card>
        
        <div className="flex items-center">
          {canManage && totalAmount > 0 && (
            <div className="w-full relative h-full">
              <AnimatePresence mode="wait">
                {!showConfirm ? (
                  <motion.div
                    key="settle-btn"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="h-full"
                  >
                    <Button 
                      variant="primary" 
                      className="w-full h-full rounded-[2rem] shadow-xl shadow-brand/10 py-6"
                      onClick={() => setShowConfirm(true)}
                      icon={RefreshCw}
                    >
                      Jetzt Abrechnen
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="confirm-box"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="w-full h-full bg-brand p-1 rounded-[2rem] flex items-stretch gap-1"
                  >
                    <button 
                      onClick={() => setShowConfirm(false)}
                      className="flex-1 bg-black/10 hover:bg-black/20 rounded-[1.8rem] flex items-center justify-center gap-2 text-black transition-colors"
                    >
                      <X size={16} strokeWidth={3} />
                      <span className="text-xs font-black uppercase tracking-widest italic">Abbruch</span>
                    </button>
                    <button 
                      onClick={handleSettle}
                      className="flex-[2] bg-black rounded-[1.8rem] flex items-center justify-center gap-2 text-brand hover:bg-zinc-900 transition-colors shadow-2xl"
                    >
                      <Check size={16} strokeWidth={3} />
                      <span className="text-xs font-black uppercase tracking-widest italic">Bestätigen</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* BULK ACTIONS */}
      {canManage && (
        <Card className="p-6 bg-brand/5 border-brand/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <button 
                onClick={toggleAll}
                className={`p-3 rounded-2xl transition-all ${selectedIds.size === roster.length ? 'bg-brand text-black' : 'bg-zinc-800 text-zinc-500'}`}
              >
                <Check size={24} strokeWidth={3} />
              </button>
              <div>
                <h4 className="text-[10px] font-black uppercase text-brand tracking-widest italic leading-none">Massen-Zuweisung</h4>
                <p className="text-[8px] font-bold text-brand/60 uppercase tracking-[0.2em] mt-1.5">
                  {selectedIds.size} von {roster.length} Spielern ausgewählt
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-32">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Euro size={14} className="text-brand/60" />
                </div>
                <input 
                  type="number"
                  value={bulkAmount}
                  onChange={(e) => setBulkAmount(e.target.value)}
                  placeholder="60"
                  className="w-full bg-black/40 border border-brand/20 rounded-2xl py-3 pl-10 pr-4 text-sm font-black text-brand outline-none focus:border-brand transition-colors"
                />
              </div>
              <Button 
                variant="primary" 
                size="md" 
                disabled={selectedIds.size === 0 || !bulkAmount}
                className="flex-1 md:flex-none whitespace-nowrap"
                onClick={applyBulk}
              >
                Auswahl zuweisen
              </Button>
              <Button 
                variant="brandGhost" 
                size="md" 
                className="px-4"
                onClick={() => onBulkUpdate({})}
              >
                Liste leeren
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* List */}
      <Card noPadding className="p-8" title="Sammelkosten-Liste" icon={Layers}>
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {roster.map((player) => {
            const amount = pendingDrinks[player.name] || '';
            const isSelected = selectedIds.has(player.id);
            return (
              <motion.div 
                key={player.id} 
                variants={itemVariants}
                className={`flex flex-col gap-4 p-5 rounded-3xl border transition-all group ${isSelected ? 'bg-zinc-900/40 border-brand/20 shadow-lg shadow-brand/5' : 'bg-zinc-900/10 border-zinc-800/40 opacity-60'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => togglePlayer(player.id)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isSelected ? 'bg-brand text-black' : 'bg-zinc-800 text-zinc-500'}`}
                    >
                      {isSelected ? <Check size={18} strokeWidth={3} /> : <div className="w-2 h-2 rounded-full bg-zinc-600" />}
                    </button>
                    <div>
                      <h4 className="text-sm font-black text-zinc-100 uppercase italic leading-none">{player.name}</h4>
                      <p className="text-[9px] font-bold text-zinc-600 uppercase mt-1">#{player.number || '--'}</p>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Euro size={14} className={isSelected ? "text-brand" : "text-zinc-500"} />
                  </div>
                  <input 
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => onUpdateAmount(player.name, e.target.value)}
                    disabled={!canManage}
                    className={`w-full bg-black/40 border rounded-2xl py-3 pl-10 pr-4 text-sm font-black outline-none transition-colors tabular-nums ${isSelected ? 'border-brand/30 text-white focus:border-brand' : 'border-zinc-800 text-zinc-400 focus:border-zinc-700'}`}
                  />
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </Card>

      <div className="p-6 bg-brand/5 border border-brand/10 rounded-[2rem] flex items-center gap-4">
        <AlertCircle className="text-brand shrink-0" size={24} />
        <p className="text-[10px] font-bold text-brand/60 uppercase tracking-widest leading-relaxed">
          Trage hier Beträge für Sammelkosten ein (Getränke, Trikots, Turniere etc.). <br />
          Gib der Abrechnung oben einen Namen, damit du später weißt, wofür das Geld war.
        </p>
      </div>
    </motion.div>
  );
};

export default FinesDrinksManager;
