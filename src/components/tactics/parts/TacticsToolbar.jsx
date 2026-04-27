import React from 'react';
import { Plus, Trash2, User, RotateCcw, Save, FolderOpen } from 'lucide-react';

const TacticsToolbar = ({ onAddPlayer, onClear, onReset, onSave, onLoad }) => {
  return (
    <div className="flex items-center gap-3 bg-zinc-900/50 p-3 rounded-2xl border border-zinc-800 backdrop-blur-md">
      <div className="flex gap-1 pr-3 border-r border-zinc-800">
        <button 
          onClick={() => onAddPlayer('attack')}
          className="flex items-center justify-center p-2.5 bg-brand text-black rounded-xl hover:bg-brand-light transition-all active:scale-95 shadow-lg shadow-brand/20"
          title="Angreifer hinzufügen"
        >
          <User size={18} strokeWidth={3} />
        </button>
        <button 
          onClick={() => onAddPlayer('defense')}
          className="flex items-center justify-center p-2.5 bg-zinc-800 text-zinc-100 rounded-xl hover:bg-zinc-700 transition-all active:scale-95 border border-zinc-700 shadow-lg shadow-black/20"
          title="Abwehrspieler hinzufügen"
        >
          <User size={18} strokeWidth={3} />
        </button>
      </div>

      <div className="flex gap-1 pr-3 border-r border-zinc-800">
        <button 
          onClick={onSave}
          className="flex items-center gap-2 p-2 text-zinc-500 hover:text-brand transition-all hover:bg-brand/10 rounded-lg"
          title="Spielzug speichern"
        >
          <Save size={18} />
          <span className="text-[10px] font-black uppercase">Save</span>
        </button>
        <button 
          onClick={onLoad}
          className="flex items-center gap-2 p-2 text-zinc-500 hover:text-blue-400 transition-all hover:bg-blue-400/10 rounded-lg"
          title="Spielzüge laden"
        >
          <FolderOpen size={18} />
          <span className="text-[10px] font-black uppercase">Load</span>
        </button>
      </div>

      <div className="flex gap-2">
        <button 
          onClick={onReset}
          className="p-2 text-zinc-500 hover:text-zinc-100 transition-all hover:bg-zinc-800 rounded-lg"
          title="Grundaufstellung"
        >
          <RotateCcw size={18} />
        </button>
        <button 
          onClick={onClear}
          className="p-2 text-zinc-500 hover:text-red-500 transition-all hover:bg-red-500/10 rounded-lg"
          title="Board leeren"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

export default TacticsToolbar;
