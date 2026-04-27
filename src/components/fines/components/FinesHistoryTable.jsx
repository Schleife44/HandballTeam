import React from 'react';
import { motion } from 'framer-motion';
import { History, CheckCircle, Circle, Trash2 } from 'lucide-react';
import Card from '../../ui/Card';
import Badge from '../../ui/Badge';
import Button from '../../ui/Button';

const FinesHistoryTable = ({ 
  history, 
  canManageMoney, 
  togglePayment, 
  removeEntry, 
  formatCurrency 
}) => {
  return (
    <motion.div 
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
              {history.map((h, i) => (
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
                      <Button variant="ghost" size="icon" icon={Trash2} onClick={() => removeEntry(h.id)} className="text-zinc-600 hover:text-red-500" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
};

export default FinesHistoryTable;
