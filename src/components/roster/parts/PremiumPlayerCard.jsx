import React from 'react';
import { Edit2, Activity, Power, PowerOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { calculatePlayerRating, calculateEfficiency, formatPlayerPosition } from '../../../utils/playerUtils';
import PlayerEditForm from './PlayerEditForm';
import MiniStatsDashboard from './MiniStatsDashboard';
import ActionOverlay from './ActionOverlay';

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
  const rating = calculatePlayerRating(stats);
  const efficiency = calculateEfficiency(stats);
  const displayPosition = formatPlayerPosition(player);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={!isEditing ? { y: -5, transition: { duration: 0.2 } } : {}}
      className={`relative group ${player.isInactive && !isEditing ? 'opacity-60 grayscale-[0.5]' : ''}`}
    >
      {!isEditing && !player.isInactive && (
        <div className="absolute -inset-0.5 bg-gradient-to-r from-brand/50 to-blue-500/30 rounded-[2rem] blur opacity-0 group-hover:opacity-30 transition duration-500" />
      )}
      
      <div className={`relative bg-zinc-950/60 backdrop-blur-xl border ${isEditing ? 'border-brand/40 shadow-[0_0_30px_rgba(132,204,22,0.1)]' : 'border-white/5'} rounded-[1.8rem] overflow-hidden p-5 flex flex-col gap-5 transition-all duration-300`}>
        
        {/* Header: Number & Sync Status */}
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
                <div className={`px-2 py-0.5 rounded-full ${player.position === 'TW' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-zinc-800/50 border-white/5 text-zinc-500'}`}>
                  <span className="text-[8px] font-black uppercase tracking-widest">{player.position || 'POS'}</span>
                </div>
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
            <button onClick={onSave} className="px-4 h-8 bg-brand text-black text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-brand/20 hover:scale-105 transition-transform">
              Speichern
            </button>
          )}
        </div>

        {/* Info Area */}
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
              <PlayerEditForm editData={editData} onEditChange={onEditChange} />
            ) : (
              <>
                <h3 className={`text-lg font-black uppercase italic tracking-tighter truncate leading-tight ${player.isInactive ? 'text-zinc-600' : 'text-white'}`}>
                  {player.name}
                </h3>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1 truncate">
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

        {/* Dynamic Display Sections */}
        {!isEditing && (
          <>
            <MiniStatsDashboard stats={stats} efficiency={efficiency} />
            <ActionOverlay 
              isInactive={player.isInactive}
              onOpenStats={onOpenStats}
              onToggleStatus={onToggleStatus}
              onEditStart={onEditStart}
              onRemove={onRemove}
            />
          </>
        )}
      </div>
    </motion.div>
  );
};

export default PremiumPlayerCard;
