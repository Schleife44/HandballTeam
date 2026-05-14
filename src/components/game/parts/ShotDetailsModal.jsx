import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, Layers } from 'lucide-react';
import Button from '../../ui/Button';

// Modular Components
import FieldMap from './shot_details/FieldMap';
import GoalMap from './shot_details/GoalMap';

const ShotDetailsModal = ({ player, action, onSave, onCancel, squad, isZoneMode, isSevenMeter }) => {
  // Lock body scroll when modal is open
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const [shotData, setShotData] = useState({
    fieldPos: isSevenMeter ? (isZoneMode ? 'RM' : { x: 50, y: 35 }) : (isZoneMode ? null : { x: 50, y: 70 }),
    goalPos: isZoneMode ? null : { x: 50, y: 50 },
    assistPlayerId: null,
    shotType: isSevenMeter ? '7m' : 'Spielzug'
  });

  const shotTypes = ['1. Welle', '2. Welle', 'Spielzug', 'Sonstiges'];
  const teamPlayers = squad[player.team] || [];
  const opponentTeam = player.team === 'home' ? 'away' : 'home';
  const opponentPlayers = squad[opponentTeam] || [];

  const renderSettings = () => (
    <div className="grid grid-cols-1 gap-4 lg:gap-8">
      {!isSevenMeter && (
        <>
          {/* Assist / Block Selection */}
          {!action?.includes('MISS') && !action?.includes('SAVE') && (
            <div className="space-y-2 lg:space-y-3">
              <h3 className="text-[7px] lg:text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
                {action === 'BLOCKED' ? 'Geblockt von (Gegner)' : 'Assist'}
              </h3>
              <div className="flex flex-wrap gap-1 lg:gap-2">
                <button 
                  onClick={() => setShotData(p => ({ ...p, assistPlayerId: null, blockedByPlayerId: null }))}
                  className={`px-2 lg:px-4 py-1 lg:py-2 rounded-lg lg:rounded-xl text-[7px] lg:text-[10px] font-black uppercase tracking-widest border transition-all ${(!shotData.assistPlayerId && !shotData.blockedByPlayerId) ? 'bg-white text-black border-white' : 'bg-zinc-800 border-zinc-700 text-zinc-500'}`}
                >Kein</button>
                {(action === 'BLOCKED' ? opponentPlayers : teamPlayers.filter(p => p.id !== player.id)).map(p => (
                  <button 
                    key={p.id} 
                    onClick={() => setShotData(prev => ({ ...prev, [action === 'BLOCKED' ? 'blockedByPlayerId' : 'assistPlayerId']: p.id }))}
                    className={`px-2 lg:px-4 py-1 lg:py-2 rounded-lg lg:rounded-xl text-[7px] lg:text-[10px] font-black uppercase tracking-widest border transition-all ${(shotData.assistPlayerId === p.id || shotData.blockedByPlayerId === p.id) ? (action === 'BLOCKED' ? 'bg-red-500 text-white border-red-500' : 'bg-brand text-black border-brand') : 'bg-zinc-800 border-zinc-700 text-zinc-500'}`}
                  >#{p.number}</button>
                ))}
              </div>
            </div>
          )}

          {/* Shot Type Selection */}
          <div className="space-y-2 lg:space-y-3">
            <h3 className="text-[7px] lg:text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Wurf-Typ</h3>
            <div className="grid grid-cols-2 gap-1 lg:gap-2">
              {shotTypes.map(type => (
                <button 
                  key={type} 
                  onClick={() => setShotData(prev => ({ ...prev, shotType: type }))}
                  className={`py-2 lg:py-4 rounded-lg lg:rounded-xl text-[7px] lg:text-[10px] font-black uppercase tracking-widest border transition-all ${shotData.shotType === type ? 'bg-zinc-100 text-black border-zinc-100' : 'bg-zinc-800/40 border-zinc-800 text-zinc-600'}`}
                >{type}</button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );

  const handleSave = () => {
    onSave(shotData);
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl" onClick={onCancel}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-zinc-900 border border-zinc-800 w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
      >
        {/* Header */}
        <div className="p-3 lg:p-6 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-lg lg:text-xl font-black uppercase italic tracking-tighter text-zinc-100">Wurf-Details</h2>
            <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 ${isZoneMode ? 'bg-blue-500/20 text-blue-400' : 'bg-brand/20 text-brand'}`}>
              {isZoneMode ? <><Layers size={10} /> Zonen</> : <><Target size={10} /> Präzision</>}
            </div>
          </div>
          <button onClick={onCancel} className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 lg:p-8 overflow-hidden no-scrollbar">
          {/* Main Grid: Responsive behavior */}
          <div className={`flex flex-col lg:grid lg:gap-10 ${isSevenMeter ? 'max-w-2xl mx-auto lg:grid-cols-1' : 'lg:grid-cols-2'}`}>
            
            {/* Top Section: Field & Goal side-by-side on mobile, stacked or grid on desktop */}
            <div className={`flex gap-3 lg:contents ${isSevenMeter ? 'justify-center' : ''}`}>
              
              {/* 1. FIELD MAP */}
              {!isSevenMeter && (
                <div className="w-[42%] lg:w-full space-y-2 lg:space-y-3">
                  <h3 className="text-[8px] lg:text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">1. Feld</h3>
                  <FieldMap 
                    value={shotData.fieldPos}
                    isZoneMode={isZoneMode}
                    isSevenMeter={isSevenMeter}
                    onSelect={(data) => setShotData(prev => ({ 
                      ...prev, 
                      fieldPos: isZoneMode ? data.zoneId : { x: data.x, y: data.y },
                      fieldZone: data.zoneId 
                    }))}
                  />
                </div>
              )}

              {/* 2. GOAL MAP */}
              <div className={`${!isSevenMeter ? 'flex-1' : 'w-full max-w-md'} space-y-4 lg:space-y-8`}>
                {action !== 'BLOCKED' && (
                  <div className="space-y-2 lg:space-y-3">
                    <h3 className="text-[8px] lg:text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                      {action?.includes('MISS') ? '2. Fehlwurf' : '2. Torbild'}
                    </h3>
                    <GoalMap 
                      value={shotData.goalPos}
                      action={action}
                      isZoneMode={isZoneMode}
                      onSelect={(data) => setShotData(prev => ({ 
                        ...prev, 
                        goalPos: isZoneMode ? data.zoneId : { x: data.x, y: data.y },
                        goalZone: data.zoneId 
                      }))}
                    />
                  </div>
                )}

                {/* Settings Section (Now always below the goal in its grid column) */}
                <div className="space-y-4 lg:space-y-8">
                  {renderSettings()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 lg:p-6 border-t border-zinc-800 grid grid-cols-2 gap-4 bg-black/20 shrink-0">
          <Button 
            variant="primary" 
            className="py-4 text-[12px] font-black uppercase" 
            onClick={handleSave}
            disabled={!shotData.goalPos || (!isSevenMeter && !shotData.fieldPos)}
          >
            Speichern
          </Button>
          <button 
            onClick={onCancel}
            className="py-4 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-2xl text-[12px] font-black uppercase active:scale-95 transition-all"
          >
            Abbruch
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ShotDetailsModal;
