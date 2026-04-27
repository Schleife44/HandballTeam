import React from 'react';
import { Trash2 } from 'lucide-react';

const DataManagementSection = ({ showResetConfirm, onReset, onConfirmToggle }) => (
  <div className="flex items-center justify-between p-6 bg-red-500/5 border border-red-500/20 rounded-3xl">
    <div className="flex items-center gap-4">
      <div className="p-3 bg-red-500/20 rounded-2xl text-red-500">
        <Trash2 size={24} />
      </div>
      <div>
        <h4 className="text-xs font-black uppercase text-zinc-100">Alle Daten zurücksetzen</h4>
        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-1">Löscht alle Kader und Taktik-Daten permanent</p>
      </div>
    </div>
    <button 
      onClick={onConfirmToggle}
      className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all shadow-lg ${showResetConfirm ? 'bg-red-600 text-white animate-pulse' : 'bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white'}`}
    >
      {showResetConfirm ? 'JETZT ENDGÜLTIG LÖSCHEN?' : 'Reset Ausführen'}
    </button>
  </div>
);

export default DataManagementSection;
