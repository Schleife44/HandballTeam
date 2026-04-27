import React, { useState } from 'react';
import { User, Plus, Trash2, Edit2, Shield, Sword, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TacticsRoster = ({ squad, onUpdateSquad, onPlayerClick }) => {
  const [activeTab, setActiveTab] = useState('home'); // 'home' oder 'away'
  const [isAdding, setIsAdding] = useState(false);
  const [newPlayer, setNewPlayer] = useState({ name: '', number: '', position: 'player' });

  const teamPlayers = squad[activeTab] || [];

  const handleAddPlayer = () => {
    if (!newPlayer.number) return;
    const updatedSquad = { ...squad };
    updatedSquad[activeTab] = [
      ...teamPlayers,
      { ...newPlayer, id: Date.now(), isGoalkeeper: newPlayer.position === 'goalkeeper' }
    ].sort((a, b) => parseInt(a.number) - parseInt(b.number));
    
    onUpdateSquad(updatedSquad);
    setNewPlayer({ name: '', number: '', position: 'player' });
    setIsAdding(false);
  };

  const removePlayer = (id) => {
    const updatedSquad = { ...squad };
    updatedSquad[activeTab] = teamPlayers.filter(p => p.id !== id);
    onUpdateSquad(updatedSquad);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900/40 border border-zinc-800 rounded-3xl overflow-hidden backdrop-blur-md">
      {/* Tabs */}
      <div className="flex p-2 bg-black/20 gap-2">
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase transition-all
            ${activeTab === 'home' ? 'bg-brand text-black shadow-lg shadow-brand/20' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Sword size={14} /> Mein Team
        </button>
        <button 
          onClick={() => setActiveTab('away')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase transition-all
            ${activeTab === 'away' ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Shield size={14} /> Gegner
        </button>
      </div>

      {/* Player List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {teamPlayers.map((player) => (
            <motion.div
              key={player.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={() => onPlayerClick(player, activeTab)}
              className="group flex items-center justify-between p-3 bg-zinc-800/30 hover:bg-zinc-800/60 border border-zinc-800 rounded-2xl transition-all cursor-pointer active:scale-95"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs
                  ${activeTab === 'home' ? 'bg-brand/10 text-brand border border-brand/20' : 'bg-zinc-700 text-zinc-300 border border-zinc-600'}`}>
                  {player.number}
                </div>
                <div>
                  <h4 className="text-sm font-black text-zinc-200">{player.name || `Spieler ${player.number}`}</h4>
                  {player.isGoalkeeper && <span className="text-[8px] font-bold text-brand uppercase tracking-widest">Torwart</span>}
                </div>
              </div>
              <button 
                onClick={() => removePlayer(player.id)}
                className="p-2 text-zinc-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {isAdding ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-zinc-900 border border-brand/30 rounded-2xl space-y-3 shadow-2xl shadow-brand/5"
          >
            <div className="grid grid-cols-4 gap-2">
              <input 
                type="text" 
                placeholder="Nr." 
                value={newPlayer.number}
                onChange={(e) => setNewPlayer({...newPlayer, number: e.target.value})}
                className="bg-zinc-800 border border-zinc-700 rounded-xl px-2 py-2 text-sm font-black text-zinc-100 outline-none focus:border-brand"
              />
              <input 
                type="text" 
                placeholder="Name..." 
                value={newPlayer.name}
                onChange={(e) => setNewPlayer({...newPlayer, name: e.target.value})}
                className="col-span-3 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm font-black text-zinc-100 outline-none focus:border-brand"
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <button 
                onClick={() => setNewPlayer({...newPlayer, position: newPlayer.position === 'goalkeeper' ? 'player' : 'goalkeeper'})}
                className={`flex-1 py-2 rounded-xl text-[8px] font-black uppercase border transition-all
                  ${newPlayer.position === 'goalkeeper' ? 'bg-brand/20 border-brand text-brand' : 'bg-zinc-800 border-zinc-700 text-zinc-500'}`}
              >
                Torwart
              </button>
              <div className="flex gap-1">
                <button 
                  onClick={() => setIsAdding(false)}
                  className="p-2 bg-zinc-800 text-zinc-400 rounded-xl hover:text-zinc-100"
                >
                  <X size={18} />
                </button>
                <button 
                  onClick={handleAddPlayer}
                  className="p-2 bg-brand text-black rounded-xl hover:bg-brand-light"
                >
                  <Check size={18} strokeWidth={3} />
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <button 
            onClick={() => setIsAdding(true)}
            className="w-full py-4 border-2 border-dashed border-zinc-800 hover:border-brand/30 hover:bg-brand/5 rounded-2xl flex items-center justify-center gap-2 text-zinc-600 hover:text-brand transition-all group"
          >
            <Plus size={18} className="group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Spieler hinzufügen</span>
          </button>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-4 bg-black/20 border-t border-zinc-800">
        <div className="flex items-center justify-between text-[10px] font-black text-zinc-500 uppercase tracking-widest">
          <span>Kader Stärke</span>
          <span className="text-zinc-300">{teamPlayers.length} Spieler</span>
        </div>
      </div>
    </div>
  );
};

export default TacticsRoster;
