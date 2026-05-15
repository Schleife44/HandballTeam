import React from 'react';
import { TrendingUp, Edit2, Trash2, Shield, Target, Zap, Activity, Power, PowerOff } from 'lucide-react';
import { motion } from 'framer-motion';

const PremiumPlayerCard = ({ 
  player, 
  isEditing,
  editData,
  onEditChange,
  onSave,
  onEditStart, 
  onToggleStatus, 
  onRemove,
  onOpenStats,
  photoURL,
  isConnected,
  stats
}) => {
  // Real stats calculation
  const totalAttempts = (stats?.tore || 0) + (stats?.fehlwurf || 0);
  const efficiency = totalAttempts > 0 ? Math.round((stats.tore / totalAttempts) * 100) : 0;
  
  // Dynamic Rating based on performance
  const baseRating = 7.0;
  const goalBonus = Math.min((stats?.tore || 0) * 0.1, 2.0);
  const efficiencyBonus = (efficiency / 100) * 1.0;
  const rating = (baseRating + goalBonus + efficiencyBonus).toFixed(1);

  const positions = ['LA', 'RL', 'RM', 'RR', 'RA', 'KM', 'TW', 'AB'];
  const positionMap = {
    'LA': 'Linksaußen',
    'RL': 'Rückraum Links',
    'RM': 'Rückraum Mitte',
    'RR': 'Rückraum Rechts',
    'RA': 'Rechtsaußen',
    'KM': 'Kreisläufer',
    'TW': 'Torhüter',
    'AB': 'Abwehr-Spezialist'
  };

  const p1 = positionMap[player.position] || player.position;
  const p2 = player.position2 ? (positionMap[player.position2] || player.position2) : null;
  const displayPosition = p2 ? `${p1} / ${p2}` : (p1 || (player.isGoalkeeper ? 'Torhüter' : 'Feldspieler'));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={!isEditing ? { y: -5, transition: { duration: 0.2 } } : {}}
      className={`relative group ${player.isInactive && !isEditing ? 'opacity-60 grayscale-[0.5]' : ''}`}
    >
      {/* Glow Effect on Hover */}
      {!isEditing && !player.isInactive && (
        <div className="absolute -inset-0.5 bg-gradient-to-r from-brand/50 to-blue-500/30 rounded-[2rem] blur opacity-0 group-hover:opacity-30 transition duration-500" />
      )}
      
      <div className={`relative bg-zinc-950/60 backdrop-blur-xl border ${isEditing ? 'border-brand/40 shadow-[0_0_30px_rgba(132,204,22,0.1)]' : 'border-white/5'} rounded-[1.8rem] overflow-hidden p-5 flex flex-col gap-5 transition-all duration-300`}>
        
        {/* Top Header: Number & Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isEditing ? (
              <input 
                type="text"
                value={editData.number}
                onChange={(e) => onEditChange({ ...editData, number: e.target.value })}
                className="w-10 h-10 rounded-xl bg-black/60 border border-brand/30 text-center text-brand font-black italic text-lg outline-none focus:border-brand"
                placeholder="00"
              />
            ) : (
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${player.isInactive ? 'bg-zinc-900 border-zinc-800' : 'bg-brand/10 border-brand/20'}`}>
                <span className={`${player.isInactive ? 'text-zinc-600' : 'text-brand'} font-black italic text-lg leading-none`}>{player.number || '00'}</span>
              </div>
            )}
            
            {!isEditing && (
              <div className="flex gap-1">
                <div className={`px-2 py-0.5 rounded-full ${player.isGoalkeeper || player.position === 'TW' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-zinc-800/50 border-white/5 text-zinc-500'}`}>
                  <span className="text-[8px] font-black uppercase tracking-widest">{player.position || (player.isGoalkeeper ? 'TW' : 'Pos')}</span>
                </div>
                {player.position2 && (
                  <div className="px-2 py-0.5 rounded-full bg-zinc-800/50 border border-white/5 text-zinc-500">
                    <span className="text-[8px] font-black uppercase tracking-widest">{player.position2}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {!isEditing && (
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-brand shadow-[0_0_8px_rgba(132,204,22,0.6)]' : 'bg-zinc-700'}`} />
              <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">{isConnected ? 'Sync' : 'Offline'}</span>
            </div>
          )}

          {isEditing && (
            <button 
              onClick={onSave}
              className="px-4 h-8 bg-brand text-black text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-brand/20 hover:scale-105 transition-transform"
            >
              Speichern
            </button>
          )}
        </div>

        {/* Player Avatar & Info */}
        <div className="flex items-center gap-5">
          {!isEditing && (
            <div className="relative shrink-0">
              <div className={`w-20 h-20 rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-zinc-900 flex items-center justify-center ${player.isInactive ? 'opacity-50' : ''}`}>
                {photoURL ? (
                  <img src={photoURL} alt={player.name} className="w-full h-full object-cover" />
                ) : (
                  <Activity size={32} className="text-zinc-800" />
                )}
              </div>
              {!player.isInactive && (
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-brand flex items-center justify-center text-[10px] font-black text-black shadow-lg border-2 border-zinc-950">
                  {rating}
                </div>
              )}
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-4">
                <input 
                  type="text"
                  value={editData.name}
                  onChange={(e) => onEditChange({ ...editData, name: e.target.value })}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-white font-black italic uppercase tracking-tighter outline-none focus:border-brand/40"
                  placeholder="Name..."
                />
                <div className="space-y-2">
                  <p className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">Haupt-Position</p>
                  <div className="flex flex-wrap gap-1">
                    {positions.map(pos => (
                      <button
                        key={`p1-${pos}`}
                        onClick={() => onEditChange({ ...editData, position: pos, isGoalkeeper: pos === 'TW' })}
                        className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all
                          ${editData.position === pos ? 'bg-brand/20 border-brand text-brand' : 'bg-zinc-900 border-white/5 text-zinc-600'}`}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">Neben-Position</p>
                  <div className="flex flex-wrap gap-1">
                    <button
                      onClick={() => onEditChange({ ...editData, position2: '' })}
                      className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all
                        ${!editData.position2 ? 'bg-zinc-700 border-white/20 text-white' : 'bg-zinc-900 border-white/5 text-zinc-600'}`}
                    >
                      X
                    </button>
                    {positions.filter(p => p !== editData.position).map(pos => (
                      <button
                        key={`p2-${pos}`}
                        onClick={() => onEditChange({ ...editData, position2: pos })}
                        className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all
                          ${editData.position2 === pos ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-zinc-900 border-white/5 text-zinc-600'}`}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <h3 className={`text-lg font-black uppercase italic tracking-tighter truncate leading-tight ${player.isInactive ? 'text-zinc-600' : 'text-white'}`}>
                  {player.name}
                </h3>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                  {displayPosition}
                </p>
                {player.isInactive && (
                   <span className="inline-block mt-2 px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded text-[7px] font-black text-red-500 uppercase tracking-widest">
                     Inaktiv
                   </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Mini Stats Dashboard */}
        {!isEditing && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/5 rounded-2xl p-2.5 flex flex-col items-center justify-center border border-white/5">
              <Shield size={12} className="text-zinc-600 mb-1.5" />
              <span className="text-[10px] font-black text-white">{stats.tore || 0}</span>
              <span className="text-[7px] font-bold text-zinc-500 uppercase tracking-widest">Tore</span>
            </div>
            <div className="bg-white/5 rounded-2xl p-2.5 flex flex-col items-center justify-center border border-white/5">
              <Target size={12} className="text-brand mb-1.5" />
              <span className="text-[10px] font-black text-white">{efficiency}%</span>
              <span className="text-[7px] font-bold text-zinc-500 uppercase tracking-widest">Quote</span>
            </div>
            <div className="bg-brand/10 rounded-2xl p-2.5 flex flex-col items-center justify-center border border-brand/20">
              <Zap size={12} className="text-brand mb-1.5" />
              <span className="text-[10px] font-black text-brand">{stats.games || 0}</span>
              <span className="text-[7px] font-bold text-brand/60 uppercase tracking-widest">Spiele</span>
            </div>
          </div>
        )}

        {/* Action Overlay (Visible on Hover) */}
        {!isEditing && (
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
              title={player.isInactive ? "Aktivieren" : "Deaktivieren"}
              className={`w-9 h-9 rounded-xl border border-white/5 flex items-center justify-center transition-colors ${player.isInactive ? 'bg-green-500/10 hover:bg-green-500/20 text-green-500' : 'bg-red-500/10 hover:bg-red-500/20 text-red-500'}`}
            >
              {player.isInactive ? <Power size={14} /> : <PowerOff size={14} />}
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
        )}
      </div>
    </motion.div>
  );
};

export default PremiumPlayerCard;
