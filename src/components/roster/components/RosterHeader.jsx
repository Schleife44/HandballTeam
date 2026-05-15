import React from 'react';
import { Users, Search, Sparkles, LayoutGrid, List, Plus } from 'lucide-react';
import Button from '../../ui/Button';

const RosterHeader = ({ 
  searchTerm, 
  setSearchTerm, 
  viewMode, 
  setViewMode, 
  onAddPlayer, 
  isTrainer 
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
      <div className="flex items-center gap-5">
        <div className="w-16 h-16 rounded-[1.8rem] bg-brand/10 border border-brand/20 flex items-center justify-center text-brand shadow-xl shadow-brand/10">
          <Users size={32} />
        </div>
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3 leading-none">
            Kader 
            <span className="text-[10px] not-italic font-bold bg-zinc-800 text-zinc-400 border border-white/5 px-3 py-1 rounded-full tracking-[0.2em]">S-25/26</span>
          </h1>
          <p className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.3em] mt-1 flex items-center gap-2">
            <Sparkles size={12} className="text-brand/50" /> Performance Management
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative group">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-brand transition-colors" />
          <input 
            type="text"
            placeholder="Spieler suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2.5 bg-zinc-950/40 border border-white/5 rounded-xl text-xs font-bold text-white outline-none focus:border-brand/30 focus:ring-4 focus:ring-brand/5 transition-all w-64"
          />
        </div>
        <div className="flex bg-zinc-950/40 p-1 rounded-xl border border-white/5">
          <button 
            onClick={() => setViewMode('grid')} 
            className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-brand text-black shadow-lg shadow-brand/20' : 'text-zinc-600 hover:text-zinc-400'}`}
          >
            <LayoutGrid size={18} />
          </button>
          <button 
            onClick={() => setViewMode('list')} 
            className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-brand text-black shadow-lg shadow-brand/20' : 'text-zinc-600 hover:text-zinc-400'}`}
          >
            <List size={18} />
          </button>
        </div>
        {isTrainer && (
          <Button 
            variant="primary" 
            icon={Plus} 
            onClick={onAddPlayer} 
            className="shadow-lg shadow-brand/20"
          >
            Spieler hinzufügen
          </Button>
        )}
      </div>
    </div>
  );
};

export default RosterHeader;
