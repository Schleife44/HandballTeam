import React from 'react';
import { Eye, EyeOff, RotateCcw } from 'lucide-react';

const HiddenEventsList = ({ hiddenIds, onRestore }) => {
  if (!hiddenIds || hiddenIds.length === 0) return null;

  return (
    <div className="mt-8 pt-8 border-t border-zinc-800/50 space-y-4">
      <div className="flex items-center gap-2 px-2">
        <EyeOff size={14} className="text-zinc-500" />
        <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">
          Versteckte Spiele ({hiddenIds.length})
        </h4>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {hiddenIds.map(id => (
          <div 
            key={id} 
            className="flex items-center justify-between p-4 bg-black/20 border border-zinc-800/30 rounded-2xl group hover:border-zinc-700 transition-all"
          >
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-tight truncate max-w-[180px]">
                ID: {id}
              </span>
              <span className="text-[8px] font-bold text-zinc-600 uppercase">
                Wird beim Sync ignoriert
              </span>
            </div>
            <button 
              onClick={() => onRestore(id)}
              className="p-2.5 bg-zinc-900 text-zinc-400 rounded-xl hover:bg-brand hover:text-black transition-all flex items-center gap-2 group/btn"
            >
              <RotateCcw size={14} className="group-hover/btn:rotate-[-45deg] transition-transform" />
              <span className="text-[9px] font-black uppercase hidden sm:inline">Wiederherstellen</span>
            </button>
          </div>
        ))}
      </div>
      <p className="text-[8px] font-medium text-zinc-600 px-2 italic">
        * Versteckte Spiele werden beim automatischen Sync nicht mehr zum Kalender hinzugefügt.
      </p>
    </div>
  );
};

export default HiddenEventsList;
