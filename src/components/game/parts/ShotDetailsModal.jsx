import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Target, Layers } from 'lucide-react';
import Button from '../../ui/Button';

const ShotDetailsModal = ({ player, action, onSave, onCancel, squad, isZoneMode, isSevenMeter }) => {
  const [shotData, setShotData] = useState({
    fieldPos: isSevenMeter ? (isZoneMode ? 'RM' : { x: 50, y: 35 }) : (isZoneMode ? null : { x: 50, y: 70 }),
    goalPos: isZoneMode ? null : { x: 50, y: 50 },
    assistPlayerId: null,
    shotType: isSevenMeter ? '7m' : 'Spielzug'
  });

  const shotTypes = ['1. Welle', '2. Welle', 'Spielzug', 'Sonstiges'];
  const teamPlayers = squad[player.team] || [];

  // Goal Zone Definitions (3x3)
  const goalZones = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  
  // Tactical Field Zones
  const fieldZones = [
    { id: 'KM', label: 'KM', d: "M 80 70 L 120 70 L 125 100 L 75 100 Z" },
    { id: 'RL', label: 'RL', d: "M 40 48 A 60 60 0 0 0 80 70 L 75 100 A 90 90 0 0 1 16 68 Z" },
    { id: 'AL', label: 'AL', d: "M 25 10 A 60 60 0 0 0 40 48 L 16 68 A 90 90 0 0 1 10 60 L 10 10 Z" },
    { id: 'RR', label: 'RR', d: "M 120 70 A 60 60 0 0 0 160 48 L 184 68 A 90 90 0 0 1 125 100 Z" },
    { id: 'AR', label: 'AR', d: "M 160 48 A 60 60 0 0 0 175 10 L 190 10 L 190 60 A 90 90 0 0 1 184 68 Z" },
    { id: 'RM_B', label: 'RM', d: "M 75 100 L 125 100 L 138 175 L 62 175 Z" },
    { id: 'RL_B', label: 'RL', d: "M 10 60 A 90 90 0 0 0 75 100 L 62 175 L 10 175 Z" },
    { id: 'RR_B', label: 'RR', d: "M 125 100 A 90 90 0 0 0 190 60 L 190 175 L 138 175 Z" },
    { id: 'Fern', label: 'FERN', d: "M 10 175 L 190 175 L 190 280 L 10 280 Z" }
  ];

  const handleFieldClick = (e) => {
    if (isZoneMode || isSevenMeter) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setShotData(prev => ({ ...prev, fieldPos: { x, y } }));
  };

  const handleGoalClick = (e) => {
    if (isZoneMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setShotData(prev => ({ ...prev, goalPos: { x, y } }));
  };

  const handleZoneSelect = (type, zoneId) => {
    setShotData(prev => ({ ...prev, [type]: zoneId }));
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
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black uppercase italic tracking-tighter text-zinc-100">Wurf-Details</h2>
            <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-2 ${isZoneMode ? 'bg-blue-500/20 text-blue-400' : 'bg-brand/20 text-brand'}`}>
              {isZoneMode ? <><Layers size={10} /> Zonen-Modus</> : <><Target size={10} /> Präzisions-Modus</>}
            </div>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-zinc-800 rounded-xl transition-colors text-zinc-500">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            
            {/* LEFT COLUMN: Field Position */}
            {!isSevenMeter ? (
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">1. Feldposition</h3>
                <div 
                  className="relative aspect-[3/4] bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-inner"
                  onClick={handleFieldClick}
                  style={{ cursor: isZoneMode ? 'default' : 'crosshair' }}
                >
                  <svg className="w-full h-full relative z-10" viewBox="0 0 200 245">
                    <g opacity="0.3" pointerEvents="none">
                      <line x1="10" y1="10" x2="190" y2="10" stroke="#3f3f46" strokeWidth="1" />
                      <line x1="10" y1="10" x2="10" y2="245" stroke="#3f3f46" strokeWidth="1" />
                      <line x1="190" y1="10" x2="190" y2="245" stroke="#3f3f46" strokeWidth="1" />
                      <line x1="10" y1="240" x2="190" y2="240" stroke="#3f3f46" strokeWidth="1.5" />
                      <path d="M 25 10 A 60 60 0 0 0 85 70 L 115 70 A 60 60 0 0 0 175 10" fill="none" stroke="#84cc16" strokeWidth="2.5" strokeLinecap="round" />
                    </g>

                    {isZoneMode && (
                      <g>
                        {fieldZones.map(zone => (
                          <path
                            key={zone.id}
                            d={zone.d}
                            onClick={(e) => { e.stopPropagation(); handleZoneSelect('fieldPos', zone.id); }}
                            className={`cursor-pointer transition-all duration-300 ${shotData.fieldPos === zone.id ? 'fill-brand/40 stroke-brand stroke-2' : 'fill-zinc-100/5 stroke-zinc-100/10 hover:fill-zinc-100/20'}`}
                          />
                        ))}
                      </g>
                    )}
                  </svg>

                  {!isZoneMode && shotData.fieldPos && (
                    <motion.div 
                      className="absolute w-8 h-8 -ml-4 -mt-4 border-2 border-brand rounded-full shadow-[0_0_20px_rgba(132,204,22,0.8)] flex items-center justify-center bg-brand/20 pointer-events-none"
                      animate={{ left: `${shotData.fieldPos.x}%`, top: `${shotData.fieldPos.y}%` }}
                    >
                      <div className="w-1.5 h-1.5 bg-brand rounded-full shadow-[0_0_5px_white]" />
                    </motion.div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-6 bg-zinc-950/50 rounded-[3rem] border border-dashed border-zinc-800 p-12">
                <div className="w-24 h-24 bg-brand/10 rounded-full flex items-center justify-center text-brand shadow-[0_0_30px_rgba(132,204,22,0.15)] border border-brand/20">
                  <Target size={48} />
                </div>
                <div className="text-center">
                  <h4 className="text-xl font-black text-white uppercase italic tracking-tighter">7 Meter</h4>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mt-2 opacity-50">Position fixiert</p>
                </div>
              </div>
            )}

            {/* RIGHT COLUMN: Goal + Settings */}
            <div className="space-y-10">
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">2. Torbild</h3>
                <div 
                  className={`relative aspect-[3/2] bg-zinc-950 border-[6px] border-zinc-100/10 rounded-xl overflow-hidden shadow-inner ${!isZoneMode ? 'cursor-crosshair' : ''}`}
                  onClick={handleGoalClick}
                >
                  {isZoneMode ? (
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                      {goalZones.map(zone => (
                        <button
                          key={zone}
                          onClick={(e) => { e.stopPropagation(); handleZoneSelect('goalPos', zone); }}
                          className={`flex items-center justify-center transition-all border border-dashed ${shotData.goalPos === zone ? 'bg-brand/40 border-solid border-brand z-10 shadow-[0_0_20px_rgba(132,204,22,0.5)]' : 'border-zinc-100/10 hover:bg-zinc-100/10'}`}
                        />
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-10">
                        {[...Array(9)].map((_, i) => <div key={i} className="border border-zinc-100/30" />)}
                      </div>
                      <motion.div 
                        className="absolute w-8 h-8 -ml-4 -mt-4 border-2 border-brand rounded-full shadow-[0_0_20px_rgba(132,204,22,1)] flex items-center justify-center bg-brand/30"
                        animate={{ left: `${shotData.goalPos.x}%`, top: `${shotData.goalPos.y}%` }}
                      >
                        <Target size={16} className="text-brand filter drop-shadow-[0_0_8px_rgba(132,204,22,0.8)]" />
                      </motion.div>
                    </>
                  )}
                </div>
              </div>

              {!isSevenMeter && (
                <>
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Assist</h3>
                    <div className="flex flex-wrap gap-2">
                      <button 
                        onClick={() => setShotData(p => ({ ...p, assistPlayerId: null }))}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${!shotData.assistPlayerId ? 'bg-white text-black border-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'}`}
                      >
                        Kein Assist
                      </button>
                      {teamPlayers.filter(p => p.id !== player.id).map(p => (
                        <button 
                          key={p.id}
                          onClick={() => setShotData(prev => ({ ...prev, assistPlayerId: p.id }))}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${shotData.assistPlayerId === p.id ? 'bg-brand text-black border-brand' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'}`}
                        >
                          #{p.number}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Wurf-Typ</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {shotTypes.map(type => (
                        <button 
                          key={type}
                          onClick={() => setShotData(prev => ({ ...prev, shotType: type }))}
                          className={`px-4 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${shotData.shotType === type ? 'bg-zinc-100 text-black border-zinc-100' : 'bg-zinc-800/40 border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-800 grid grid-cols-2 gap-4 bg-black/20">
          <Button 
            variant="primary" 
            className="py-5 text-[12px] font-black uppercase" 
            onClick={() => onSave(shotData)}
            disabled={!shotData.goalPos || (!isSevenMeter && !shotData.fieldPos)}
          >
            Wurf Speichern
          </Button>
          <button 
            onClick={onCancel}
            className="py-5 bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-2xl text-[12px] font-black uppercase active:scale-95 transition-all"
          >
            Abbrechen
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ShotDetailsModal;
