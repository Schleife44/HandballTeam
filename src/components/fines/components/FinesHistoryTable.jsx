import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, CheckCircle, Circle, Trash2, Wallet, X, Check, Receipt } from 'lucide-react';
import Card from '../../ui/Card';
import Badge from '../../ui/Badge';
import Button from '../../ui/Button';

const FinesHistoryTable = ({ 
  history, 
  canManageMoney, 
  togglePayment, 
  payAllForPlayer,
  removeEntry, 
  formatCurrency 
}) => {
  const [expandedPlayer, setExpandedPlayer] = useState(null);
  const [confirmPayAll, setConfirmPayAll] = useState(null); 
  const [showFullJournal, setShowFullJournal] = useState(false);

  // Grouping logic for open debts
  const openPlayerDebts = history.reduce((acc, entry) => {
    if (entry.playerId === 'TEAM' || entry.paid) return acc;
    if (!acc[entry.playerId]) acc[entry.playerId] = { entries: [], total: 0 };
    acc[entry.playerId].entries.push(entry);
    acc[entry.playerId].total += (parseFloat(entry.amount) || 0);
    return acc;
  }, {});

  const playerEntries = Object.entries(openPlayerDebts).sort((a, b) => b[1].total - a[1].total);

  const handlePayAll = (playerName) => {
    payAllForPlayer(playerName);
    setConfirmPayAll(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-12"
    >
      {/* SECTION 1: OPEN DEBTS (GROUPED) */}
      <section className="space-y-6">
        <div className="flex items-center gap-4 px-2">
          <div className="p-2 bg-brand/10 rounded-xl text-brand"><Receipt size={18} /></div>
          <h2 className="text-xl font-black text-white uppercase italic tracking-tight">Offene Forderungen</h2>
        </div>

        {playerEntries.length === 0 ? (
          <Card className="p-8 text-center bg-zinc-900/20 border-zinc-800/40">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Keine offenen Schulden vorhanden. Alles erledigt.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {playerEntries.map(([playerName, data]) => (
              <Card key={playerName} noPadding className="overflow-hidden border-zinc-800 hover:border-zinc-700 transition-colors">
                <div className="p-6 flex flex-wrap items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-xs font-black text-zinc-400 italic">
                      {data.entries.length}x
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-white uppercase italic leading-none">{playerName}</h4>
                      <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-2">Gesamtbetrag ausstehend</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <div className="text-2xl font-black text-red-500 italic">{formatCurrency(data.total)}</div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setExpandedPlayer(expandedPlayer === playerName ? null : playerName)}
                        className="rounded-xl px-4 text-[9px]"
                      >
                        {expandedPlayer === playerName ? 'Schließen' : 'Details'}
                      </Button>
                      
                      {canManageMoney && (
                        <div className="relative min-w-[140px] h-9">
                          <AnimatePresence>
                            {confirmPayAll !== playerName ? (
                              <motion.div
                                key="pay-btn"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                className="h-full"
                              >
                                <Button 
                                  variant="primary" 
                                  size="sm"
                                  onClick={() => setConfirmPayAll(playerName)}
                                  className="w-full h-full rounded-xl px-4 bg-brand text-black hover:bg-brand/90 text-[9px]"
                                  icon={CheckCircle}
                                >
                                  Alles Bezahlt
                                </Button>
                              </motion.div>
                            ) : (
                              <motion.div
                                key="confirm-pay"
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                transition={{ duration: 0.15 }}
                                className="w-full h-full bg-brand p-0.5 rounded-xl flex items-stretch gap-0.5 absolute inset-0"
                              >
                                <button 
                                  onClick={() => setConfirmPayAll(null)}
                                  className="flex-1 bg-black/10 hover:bg-black/20 rounded-lg flex items-center justify-center text-black transition-colors"
                                  title="Abbruch"
                                >
                                  <X size={14} strokeWidth={3} />
                                </button>
                                <button 
                                  onClick={() => handlePayAll(playerName)}
                                  className="flex-[2] bg-black rounded-lg flex items-center justify-center gap-2 text-brand hover:bg-zinc-900 transition-colors"
                                >
                                  <Check size={14} strokeWidth={3} />
                                  <span className="text-[8px] font-black uppercase tracking-widest italic">Zahlen</span>
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedPlayer === playerName && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-zinc-800/50 bg-black/20"
                    >
                      <div className="p-6 space-y-3">
                        {data.entries.map((entry) => (
                          <div key={entry.id} className="flex items-center justify-between py-2 border-b border-zinc-800/30 last:border-0 opacity-80 hover:opacity-100 transition-opacity">
                            <div className="flex items-center gap-4">
                              <span className="text-[9px] font-bold text-zinc-600 tabular-nums uppercase">
                                {new Date(entry.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                              </span>
                              <div className="w-1 h-1 rounded-full bg-red-500/50" />
                              <span className="text-xs font-bold text-zinc-300 uppercase italic">{entry.note}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-xs font-black text-white italic">{formatCurrency(entry.amount)}</span>
                              {canManageMoney && (
                                <button onClick={() => togglePayment(entry.id)} className="text-zinc-600 hover:text-brand transition-colors">
                                  <Circle size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* SECTION 2: FULL JOURNAL (HIDDEN BY DEFAULT) */}
      <section className="pt-12 border-t border-zinc-800/50 space-y-6">
        {!showFullJournal ? (
          <div className="flex justify-center">
            <Button 
              variant="ghost" 
              onClick={() => setShowFullJournal(true)}
              icon={History}
              className="text-zinc-500 hover:text-zinc-300 text-[10px] uppercase font-black tracking-widest py-4 px-8 rounded-2xl bg-zinc-900/40 border border-zinc-800"
            >
              Vollständiges Buchungsjournal anzeigen
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500"><History size={18} /></div>
                <h2 className="text-xl font-black text-white uppercase italic tracking-tight">Buchungsjournal</h2>
              </div>
              <button onClick={() => setShowFullJournal(false)} className="text-[10px] font-black uppercase text-zinc-500 hover:text-white transition-colors">Ausblenden</button>
            </div>
            
            <Card noPadding className="overflow-hidden border-zinc-800/40">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] bg-zinc-900/40 border-b border-zinc-800">
                      <th className="py-4 px-6">Datum</th>
                      <th className="py-4 px-6">Typ</th>
                      <th className="py-4 px-6">Beteiligter</th>
                      <th className="py-4 px-6">Notiz</th>
                      <th className="py-4 px-6 text-right">Betrag</th>
                      <th className="py-4 px-6 text-center">Aktion</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-bold">
                    {history.slice(0, 50).map((h, i) => (
                      <tr key={i} className="border-b border-zinc-800/10 text-zinc-400 hover:bg-zinc-900/20 transition-colors group">
                        <td className="py-4 px-6 tabular-nums opacity-50">
                          {new Date(h.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                        </td>
                        <td className="py-4 px-6">
                          <Badge variant={h.category === 'expense' ? 'danger' : h.category === 'income' ? 'primary' : 'outline'} className="text-[7px]">
                            {h.category}
                          </Badge>
                        </td>
                        <td className="py-4 px-6 font-black text-zinc-200 uppercase italic">
                          {h.playerId === 'TEAM' ? <span className="text-zinc-600">VEREIN</span> : h.playerId}
                        </td>
                        <td className="py-4 px-6 opacity-60 truncate max-w-[200px]">{h.note}</td>
                        <td className={`py-4 px-6 text-right font-black italic tabular-nums ${h.category === 'expense' ? 'text-red-500' : h.category === 'income' ? 'text-blue-500' : (h.paid ? 'text-brand/70' : 'text-zinc-100')}`}>
                          {h.category === 'expense' ? '-' : ''}{formatCurrency(h.amount)}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {(h.category === 'fine' || !h.category) && (
                              <button 
                                onClick={() => togglePayment(h.id)}
                                className={`p-1.5 rounded-lg transition-all ${h.paid ? 'text-brand hover:bg-brand/10' : 'text-red-500 hover:bg-red-500/10'}`}
                              >
                                {h.paid ? <CheckCircle size={14} /> : <Circle size={14} />}
                              </button>
                            )}
                            {canManageMoney && (
                              <button onClick={() => removeEntry(h.id)} className="p-1.5 text-zinc-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </section>
    </motion.div>
  );
};

export default FinesHistoryTable;
