import React from 'react';
import { Users, Plus } from 'lucide-react';

const RosterHeader = ({ teamName, activeTab, onTabChange, onAddPlayer }) => (
  <div className="flex flex-col lg:flex-row items-center justify-between gap-6 bg-zinc-900/40 p-5 lg:p-6 rounded-3xl lg:rounded-[2.5rem] border border-zinc-800 backdrop-blur-xl">
    <div className="flex items-center gap-4">
      <div className="p-4 bg-brand/10 border border-brand/20 rounded-3xl">
        <Users size={24} className="text-brand" />
      </div>
      <div>
        <h2 className="text-2xl font-black tracking-tighter uppercase italic text-zinc-100">{teamName}</h2>
        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-0.5">Kader-Verwaltung</p>
      </div>
    </div>

    <div className="flex items-center gap-3">
      <div className="flex p-1.5 bg-black/40 rounded-2xl border border-zinc-800">
        <button 
          onClick={() => onTabChange('home')}
          className={`flex items-center gap-2 px-8 py-3 rounded-xl text-[10px] font-black uppercase transition-all
            ${activeTab === 'home' ? 'bg-brand text-black shadow-lg shadow-brand/20' : 'text-zinc-500 hover:text-zinc-100'}`}
        >
          Heim
        </button>
        <button 
          onClick={() => onTabChange('away')}
          className={`flex items-center gap-2 px-8 py-3 rounded-xl text-[10px] font-black uppercase transition-all
            ${activeTab === 'away' ? 'bg-zinc-700 text-zinc-100 shadow-lg' : 'text-zinc-500 hover:text-zinc-100'}`}
        >
          Gast
        </button>
      </div>
      <button 
        onClick={onAddPlayer}
        className="flex items-center gap-2 px-6 py-3 bg-zinc-100 text-black hover:bg-white rounded-xl text-[10px] font-black uppercase transition-all shadow-lg active:scale-95 ml-4"
      >
        <Plus size={16} strokeWidth={3} /> Spieler Hinzufügen
      </button>
    </div>
  </div>
);

export default RosterHeader;
