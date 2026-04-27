import React from 'react';
import { Check, Eye, EyeOff, Edit2, Trash2, TrendingUp, CheckCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../../ui/Button';
import Badge from '../../ui/Badge';
import Card from '../../ui/Card';
import Input from '../../ui/Input';

import useStore from '../../../store/useStore';

const PlayerCard = ({ 
  player, 
  isEditing, 
  editData, 
  onEditChange, 
  onSave, 
  onEditStart, 
  onToggleStatus, 
  onRemove,
  onOpenStats,
  teamColor 
}) => {
  const { allMembers, activeMember, squad } = useStore();

  // Permissions
  const myName = activeMember?.playerName;
  const myUid = activeMember?.uid;
  const isOwner = myUid === squad?.ownerUid;
  const isTrainer = activeMember?.role === 'trainer' || isOwner;
  const isMe = activeMember?.playerName === player.name || activeMember?.playerId === player.id;
  const canEdit = isTrainer || isMe;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full"
    >
      <Card
        noPadding
        variant={isEditing ? 'brand' : 'glass'}
        className={`p-5 group transition-all ${player.isInactive ? 'opacity-40 grayscale hover:opacity-100' : ''} ${isEditing ? 'ring-1 ring-brand/20' : ''}`}
      >
        {isEditing ? (
          <div className="flex items-center gap-4">
            <input 
              type="text" 
              value={editData.number}
              placeholder="00"
              autoFocus
              onFocus={(e) => e.target.select()}
              onChange={(e) => onEditChange({...editData, number: e.target.value})}
              className="w-14 h-14 bg-black/60 border border-brand/30 rounded-2xl text-center text-xl font-black text-brand outline-none placeholder:opacity-20"
            />
            <div className="flex-1">
              <Input 
                value={editData.name}
                placeholder="Name eingeben..."
                onFocus={(e) => e.target.select()}
                onChange={(e) => onEditChange({...editData, name: e.target.value})}
                onKeyDown={(e) => e.key === 'Enter' && onSave()}
                className="bg-black/40 border-zinc-700"
              />
              <div className="flex gap-1 mt-2">
                <button 
                  onClick={() => onEditChange({...editData, isGoalkeeper: !editData.isGoalkeeper})}
                  className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase border transition-all
                    ${editData.isGoalkeeper ? 'bg-brand/20 border-brand text-brand' : 'bg-zinc-800 border-zinc-700 text-zinc-500'}`}
                >
                  TW
                </button>
              </div>
            </div>
            <Button 
              size="icon" 
              variant="primary" 
              icon={Check} 
              onClick={onSave} 
            />
          </div>
        ) : (
          <div className="flex items-center gap-5">
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black italic"
              style={{ backgroundColor: `${teamColor}15`, color: teamColor, border: `1px solid ${teamColor}30` }}
            >
              {player.number}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-black text-zinc-100 uppercase italic tracking-tight truncate">{player.name}</h4>
              <div className="flex items-center gap-2 mt-1">
                {player.isGoalkeeper && <Badge variant="brand">Torwart</Badge>}
                {player.isInactive && <Badge variant="red">Inaktiv</Badge>}
              </div>
            </div>

            {allMembers.some(m => m.playerName === player.name || m.playerId === player.id) && (
              <div 
                className="absolute top-3 right-5 text-brand/50 group-hover:text-brand transition-colors"
                title="Spieler verlinkt"
              >
                <CheckCheck size={14} strokeWidth={3} />
              </div>
            )}
            
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 max-w-0 group-hover:max-w-[200px] overflow-hidden transition-all duration-500 ml-auto whitespace-nowrap">
              <Button size="icon" variant="ghost" icon={TrendingUp} onClick={onOpenStats} className="text-zinc-500 hover:text-emerald-400" />
              {canEdit && (
                <>
                  <Button size="icon" variant="ghost" icon={player.isInactive ? Eye : EyeOff} onClick={onToggleStatus} className="text-zinc-500 hover:text-zinc-100" />
                  <Button size="icon" variant="ghost" icon={Edit2} onClick={onEditStart} className="text-zinc-500 hover:text-brand" />
                  <Button size="icon" variant="ghost" icon={Trash2} onClick={onRemove} className="text-zinc-500 hover:text-red-500" />
                </>
              )}
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
};

export default PlayerCard;
