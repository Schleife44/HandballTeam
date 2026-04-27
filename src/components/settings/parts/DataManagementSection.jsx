import React from 'react';
import { Trash2, LogOut, AlertTriangle } from 'lucide-react';
import Button from '../../ui/Button';

const DataManagementSection = ({ 
  showResetConfirm, 
  onReset, 
  onConfirmToggle, 
  isOwner, 
  onDeleteTeam, 
  onLeaveTeam 
}) => (
  <div className="space-y-6">
    {/* Reset Section */}
    <div className="flex items-center justify-between p-6 bg-red-500/5 border border-red-500/20 rounded-3xl">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-red-500/20 rounded-2xl text-red-500">
          <Trash2 size={24} />
        </div>
        <div>
          <h4 className="text-xs font-black uppercase text-zinc-100">Aktuelles Spiel zurücksetzen</h4>
          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-1">Löscht den aktuellen Ticker & Kader-Status</p>
        </div>
      </div>
      <button 
        onClick={onConfirmToggle}
        className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all shadow-lg ${showResetConfirm ? 'bg-red-600 text-white animate-pulse' : 'bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white'}`}
      >
        {showResetConfirm ? 'JETZT ENDGÜLTIG LÖSCHEN?' : 'Reset Ausführen'}
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Leave Team */}
      {!isOwner && (
        <button 
          onClick={onLeaveTeam}
          className="flex items-center gap-4 p-6 bg-zinc-900/40 border border-zinc-800 rounded-3xl hover:border-red-500/50 transition-all group"
        >
          <div className="p-3 bg-zinc-800 rounded-2xl text-zinc-500 group-hover:text-red-500 transition-colors">
            <LogOut size={24} />
          </div>
          <div className="text-left">
            <h4 className="text-xs font-black uppercase text-zinc-100">Team verlassen</h4>
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-1">Kein Zugriff mehr auf dieses Team</p>
          </div>
        </button>
      )}

      {/* Delete Team (Owner Only) */}
      {isOwner && (
        <button 
          onClick={onDeleteTeam}
          className="flex items-center gap-4 p-6 bg-red-500/10 border border-red-500/20 rounded-3xl hover:border-red-500 transition-all group"
        >
          <div className="p-3 bg-red-500/20 rounded-2xl text-red-500">
            <AlertTriangle size={24} />
          </div>
          <div className="text-left">
            <h4 className="text-xs font-black uppercase text-white">Team permanent löschen</h4>
            <p className="text-[10px] font-bold text-red-500/60 uppercase tracking-widest mt-1 italic">Vorsicht: Dieser Schritt ist endgültig!</p>
          </div>
        </button>
      )}
    </div>
  </div>
);

export default DataManagementSection;
