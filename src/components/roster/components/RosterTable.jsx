import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, LayoutGrid, Edit2, Trash2, CheckCircle, Circle, X, Check } from 'lucide-react';
import { normalizeSearchString } from '../../../utils/searchUtils';

const RosterTable = ({ 
  players, 
  statsMap, 
  editingId, 
  setEditingId, 
  editData, 
  setEditData, 
  sortConfig, 
  onSort, 
  onSave, 
  onRemove, 
  onNavigate,
  isTrainer 
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="bg-zinc-950/40 backdrop-blur-xl border border-white/5 rounded-[2rem] overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/5 bg-white/5">
              <th onClick={() => onSort('name')} className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest italic cursor-pointer">
                <div className="flex items-center gap-2">
                  Spieler
                  {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                </div>
              </th>
              <th onClick={() => onSort('training')} className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest italic text-center cursor-pointer">
                <div className="flex items-center justify-center gap-2">
                  Training
                  {sortConfig.key === 'training' && (sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                </div>
              </th>
              <th onClick={() => onSort('position')} className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest italic text-center cursor-pointer">
                <div className="flex items-center justify-center gap-2">
                  Position
                  {sortConfig.key === 'position' && (sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                </div>
              </th>
              <th onClick={() => onSort('goals')} className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest italic text-center cursor-pointer">
                <div className="flex items-center justify-center gap-2">
                  Tore
                  {sortConfig.key === 'goals' && (sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                </div>
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest italic text-right">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {editingId && editingId.startsWith('new_') && (
              <tr className="bg-brand/5">
                <td className="px-6 py-4">
                  <input 
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="bg-black/40 border border-brand/30 rounded-lg px-3 py-1.5 text-xs text-white outline-none w-full"
                    placeholder="Name..."
                    autoFocus
                  />
                </td>
                <td className="px-6 py-4 text-center">
                  <input 
                    value={editData.number}
                    onChange={(e) => setEditData({ ...editData, number: e.target.value })}
                    className="w-12 bg-black/40 border border-brand/30 rounded-lg px-2 py-1.5 text-xs text-center text-brand outline-none"
                    placeholder="00"
                  />
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex gap-1 justify-center">
                    {['LA', 'RL', 'RM', 'RR', 'RA', 'KM', 'TW', 'AB'].map(p => (
                      <button 
                        key={p} 
                        onClick={() => setEditData({ ...editData, position: p, isGoalkeeper: p === 'TW' })}
                        className={`w-6 h-6 rounded flex items-center justify-center text-[7px] font-black border transition-all ${editData.position === p ? 'bg-brand border-brand text-black' : 'bg-zinc-900 border-white/5 text-zinc-600'}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 text-center text-sm font-black text-zinc-600 italic">-</td>
                <td className="px-6 py-4 text-right">
                   <button onClick={() => onSave(editingId, editData)} className="text-[10px] font-black text-brand uppercase tracking-widest mr-2">Speichern</button>
                   <button onClick={() => setEditingId(null)} className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Abbruch</button>
                </td>
              </tr>
            )}
            {players.map(player => {
              const key = normalizeSearchString(player.name);
              const stats = statsMap[key] || { tore: 0, fehlwurf: 0, games: 0, training: 0 };
              const isThisEditing = editingId === player.id;
              
              return (
                <motion.tr 
                  layout
                  key={player.id} 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="hover:bg-white/5 transition-colors group"
                >
                  <td className="px-6 py-4">
                    {isThisEditing ? (
                      <input 
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        className="bg-black/40 border border-brand/30 rounded-lg px-3 py-1.5 text-xs text-white outline-none w-full"
                        autoFocus
                      />
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-[10px] font-black text-brand italic border border-white/5">{player.number || '--'}</div>
                        <span className="text-xs font-bold text-white">{player.name}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {isThisEditing ? (
                      <input 
                        value={editData.number}
                        onChange={(e) => setEditData({ ...editData, number: e.target.value })}
                        className="w-12 bg-black/40 border border-brand/30 rounded-lg px-2 py-1.5 text-xs text-center text-brand outline-none"
                      />
                    ) : (
                      <div className="flex flex-col items-center">
                        <span className={`text-[11px] font-black italic ${stats.training >= 80 ? 'text-brand' : stats.training >= 50 ? 'text-zinc-300' : 'text-red-500/80'}`}>{stats.training}%</span>
                        <div className="w-12 h-1 bg-zinc-800 rounded-full mt-1 overflow-hidden">
                          <div className={`h-full transition-all duration-500 ${stats.training >= 80 ? 'bg-brand' : stats.training >= 50 ? 'bg-zinc-500' : 'bg-red-500'}`} style={{ width: `${stats.training}%` }} />
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center text-[10px] font-black text-zinc-500 uppercase">
                    {isThisEditing ? (
                       <div className="flex gap-1 justify-center">
                        {['LA', 'RL', 'RM', 'RR', 'RA', 'KM', 'TW', 'AB'].map(p => (
                          <button 
                            key={p} 
                            onClick={() => setEditData({ ...editData, position: p, isGoalkeeper: p === 'TW' })}
                            className={`w-6 h-6 rounded flex items-center justify-center text-[7px] font-black border transition-all ${editData.position === p ? 'bg-brand border-brand text-black' : 'bg-zinc-900 border-white/5 text-zinc-600'}`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    ) : (
                      player.position || '-'
                    )}
                  </td>
                  <td className="px-6 py-4 text-center text-sm font-black text-brand italic">{stats.tore}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {isThisEditing ? (
                        <>
                          <button onClick={() => onSave(player.id, editData)} className="text-[10px] font-black text-brand uppercase tracking-widest mr-2">Speichern</button>
                          <button onClick={() => setEditingId(null)} className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Abbruch</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => onNavigate(`/roster/${player.name}`)} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-brand transition-all"><LayoutGrid size={14} /></button>
                          {isTrainer && (
                            <>
                              <button onClick={() => { setEditingId(player.id); setEditData({ ...player }); }} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-all"><Edit2 size={14} /></button>
                              <button onClick={() => onRemove(player.id)} className="p-2 hover:bg-red-900/20 rounded-lg text-zinc-500 hover:text-red-500 transition-all"><Trash2 size={14} /></button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default RosterTable;
