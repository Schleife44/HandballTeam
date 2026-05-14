import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const QuickAddModal = ({ quickAdd, setQuickAdd, activeMatch, handleQuickAdd }) => {
  if (!quickAdd.show) return null;

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setQuickAdd({ ...quickAdd, show: false })} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
      <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-md bg-zinc-900 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Schnell-Hinzufügen</h3>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Spieler für {quickAdd.team === 'home' ? (activeMatch.customHomeName || 'Heim') : (activeMatch.customAwayName || 'Gast')}</p>
          </div>
          <button onClick={() => setQuickAdd({ ...quickAdd, show: false })} className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-500 transition-colors"><X size={20} /></button>
        </div>
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-1 space-y-2">
              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Nr.</label>
              <input type="text" autoFocus value={quickAdd.number} onChange={(e) => setQuickAdd({ ...quickAdd, number: e.target.value })} placeholder="Nr" className="w-full bg-black/40 border border-zinc-800 p-4 rounded-xl text-white text-center outline-none focus:border-brand transition-all font-black" />
            </div>
            <div className="col-span-3 space-y-2">
              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Name (Optional)</label>
              <input type="text" value={quickAdd.name} onChange={(e) => setQuickAdd({ ...quickAdd, name: e.target.value })} placeholder="Name des Spielers..." className="w-full bg-black/40 border border-zinc-800 p-4 rounded-xl text-white outline-none focus:border-brand transition-all font-bold" />
            </div>
          </div>
          <button onClick={handleQuickAdd} disabled={!quickAdd.number} className="w-full py-4 bg-brand disabled:opacity-30 text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-brand/20">Spieler Hinzufügen</button>
        </div>
      </motion.div>
    </div>
  );
};

export default QuickAddModal;
