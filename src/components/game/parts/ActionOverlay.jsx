import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, AlertTriangle, Zap } from 'lucide-react';

const ActionOverlay = ({ player, onClose, onAction }) => {
  if (!player) return null;

  const sections = [
    {
      title: 'Ergebnis',
      icon: <Trophy size={14} />,
      color: 'text-brand',
      layout: 'grid-cols-2',
      actions: [
        { id: 'GOAL', label: 'Tor', color: 'bg-brand text-black' },
        { id: 'MISS', label: 'Fehlwurf', color: 'bg-red-500/10 text-red-500 border border-red-500/20' },
        { id: 'BLOCKED', label: 'Geblockt', color: 'bg-zinc-800 text-zinc-300' },
        { id: 'SAVE', label: 'Gehalten', color: 'bg-zinc-800 text-zinc-300' },
      ]
    },
    {
      title: 'Aktionen',
      icon: <Zap size={14} />,
      color: 'text-blue-500',
      layout: 'custom',
      actions: [
        { id: 'OFF_FOUL', label: 'Stürmerfoul', color: 'bg-zinc-800 text-zinc-300', span: 'col-span-4' },
        { id: 'LOST', label: 'Ballverlust', color: 'bg-zinc-800 text-zinc-300', span: 'col-span-4' },
        { id: 'STEAL', label: 'Steal', color: 'bg-zinc-800 text-zinc-300', span: 'col-span-4' },
        { id: 'GET_2MIN', label: '2 MIN+', color: 'bg-blue-500/10 text-blue-500 border border-blue-500/20', span: 'col-span-3' },
        { id: 'GET_7M', label: '7M+', color: 'bg-blue-500/10 text-blue-500 border border-blue-500/20', span: 'col-span-3' },
        { id: '1V1', label: '1V1', color: 'bg-blue-500/10 text-blue-500 border border-blue-500/20', span: 'col-span-3' },
        { id: 'BLOCK', label: 'Block', color: 'bg-blue-500/10 text-blue-500 border border-blue-500/20', span: 'col-span-3' },
      ]
    },
    {
      title: 'Strafen',
      icon: <AlertTriangle size={14} />,
      color: 'text-yellow-500',
      layout: 'grid-cols-3',
      actions: [
        { id: 'YELLOW', label: 'Gelb', color: 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' },
        { id: 'TWO_MIN', label: '2 Min', color: 'bg-orange-500/10 text-orange-500 border border-orange-500/20' },
        { id: 'RED', label: 'Rot', color: 'bg-red-600 text-white shadow-lg shadow-red-500/20' },
      ]
    }
  ];

  return (
    <div 
      className="fixed inset-0 z-[500] flex items-end lg:items-center justify-center p-0 lg:p-6 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 1, y: '100%' }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-zinc-900 border-t lg:border border-zinc-800 w-full lg:max-w-xl rounded-t-[2.5rem] lg:rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[95vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-6 lg:p-8 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 lg:gap-5">
            <div 
              className="w-12 h-12 lg:w-16 lg:h-16 rounded-xl lg:rounded-2xl flex items-center justify-center text-xl lg:text-2xl font-black italic shadow-inner"
              style={{ backgroundColor: `${player.teamColor}15`, color: player.teamColor, border: `1px solid ${player.teamColor}30` }}
            >
              {player.number}
            </div>
            <div>
              <h3 className="text-lg lg:text-xl font-black italic uppercase tracking-tighter text-zinc-100">{player.name || 'Spieler'}</h3>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-0.5">
                {player.team === 'home' ? 'Heim' : 'Gast'} • {player.isGoalkeeper ? 'TW' : 'Feld'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-zinc-800 text-zinc-500 hover:text-zinc-100 rounded-2xl transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 lg:p-8 space-y-6 lg:space-y-8 overflow-y-auto no-scrollbar pb-12 lg:pb-8">
          {sections.map((section) => (
            <div key={section.title} className="space-y-4">
              <div className="flex items-center gap-2 px-2">
                <span className={section.color}>{section.icon}</span>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{section.title}</h4>
              </div>
              
              <div className={`grid gap-2 lg:gap-2.5 ${section.layout === 'custom' ? 'grid-cols-12' : section.layout}`}>
                {section.actions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => onAction(action.id)}
                    className={`py-3.5 lg:py-4 rounded-2xl text-[9px] lg:text-[10px] font-black uppercase transition-all active:scale-95 text-center
                      ${action.color} ${action.span || ''}`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-black/20 border-t border-zinc-800 flex justify-center shrink-0 hidden lg:flex">
          <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-[0.4em]">Handball Live-Tracking System</p>
        </div>
      </motion.div>
    </div>
  );
};

export default ActionOverlay;
