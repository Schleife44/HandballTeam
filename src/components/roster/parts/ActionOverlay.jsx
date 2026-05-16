import React from 'react';
import { TrendingUp, Edit2, Trash2, Power, PowerOff } from 'lucide-react';

const ActionOverlay = ({ 
  isInactive, 
  onOpenStats, 
  onToggleStatus, 
  onEditStart, 
  onRemove 
}) => (
  <div className="flex gap-2 pt-2 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
    <button 
      onClick={onOpenStats}
      className="flex-1 h-9 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/5 flex items-center justify-center gap-2 transition-colors"
    >
      <TrendingUp size={14} className="text-zinc-400" />
      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-100">Stats</span>
    </button>
    <button 
      onClick={onToggleStatus}
      title={isInactive ? "Aktivieren" : "Deaktivieren"}
      className={`w-9 h-9 rounded-xl border border-white/5 flex items-center justify-center transition-colors ${isInactive ? 'bg-green-500/10 hover:bg-green-500/20 text-green-500' : 'bg-red-500/10 hover:bg-red-500/20 text-red-500'}`}
    >
      {isInactive ? <Power size={14} /> : <PowerOff size={14} />}
    </button>
    <button 
      onClick={onEditStart}
      className="w-9 h-9 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/5 flex items-center justify-center transition-colors"
    >
      <Edit2 size={14} className="text-zinc-400 hover:text-brand" />
    </button>
    <button 
      onClick={onRemove}
      className="w-9 h-9 rounded-xl bg-zinc-900 hover:bg-red-900/20 border border-white/5 hover:border-red-500/30 flex items-center justify-center transition-colors"
    >
      <Trash2 size={14} className="text-zinc-400 hover:text-red-500" />
    </button>
  </div>
);

export default ActionOverlay;
