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
  const opponentTeam = player.team === 'home' ? 'away' : 'home';
  const opponentPlayers = squad[opponentTeam] || [];

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

  const getZoneFromCoords = (x, y, type) => {
    if (type === 'goal') {
      const col = Math.floor(x / 33.34);
      const row = Math.floor(y / 33.34);
      return Math.max(1, Math.min(9, row * 3 + col + 1));
    }
    if (type === 'field') {
      // SVG base is 200x245, but we get percentages (0-100)
      // Convert % to SVG units for mapping
      const sx = (x / 100) * 200;
      const sy = (y / 100) * 245;

      if (sy > 175) return 'Fern';
      if (sy > 100) {
        if (sx < 65) return 'RL_B';
        if (sx > 135) return 'RR_B';
        return 'RM_B';
      }
      
      // Near zones (Arc areas)
      if (sx > 75 && sx < 125 && sy > 70) return 'KM';
      
      // Simple angular/distance mapping for the arc
      const dx = sx - 100;
      const dy = sy - 10;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      
      if (angle < 0) { // Left side
        if (angle < -140) return 'AL';
        return 'RL';
      } else { // Right side
        if (angle > 140) return 'AR';
        return 'RR';
      }
    }
    return null;
  };

  const handleFieldClick = (e) => {
    if (isZoneMode || isSevenMeter) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Background tracking of zone even in precision mode
    const zoneId = getZoneFromCoords(x, y, 'field');
    setShotData(prev => ({ ...prev, fieldPos: { x, y }, fieldZone: zoneId }));
  };

  const handleGoalClick = (e) => {
    if (isZoneMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Background tracking of zone even in precision mode
    const zoneId = getZoneFromCoords(x, y, 'goal');
    setShotData(prev => ({ ...prev, goalPos: { x, y }, goalZone: zoneId }));
  };

  const handleZoneSelect = (type, zoneId) => {
    // If we select a zone directly, we can also set a default center coord for precision view
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
        <div className="p-3 lg:p-6 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-lg lg:text-xl font-black uppercase italic tracking-tighter text-zinc-100 leading-none">Wurf-Details</h2>
            <div className={`px-2 py-0.5 rounded-full text-[7px] lg:text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 ${isZoneMode ? 'bg-blue-500/20 text-blue-400' : 'bg-brand/20 text-brand'}`}>
              {isZoneMode ? <><Layers size={10} /> Zonen</> : <><Target size={10} /> Präzision</>}
            </div>
          </div>
          <button onClick={onCancel} className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className={`p-3 lg:p-6 overflow-y-auto no-scrollbar ${isSevenMeter ? 'flex items-center justify-center min-h-[400px]' : ''}`}>
          {/* Main Responsive Grid */}
          <div className={`grid gap-3 lg:gap-10 items-start w-full ${isSevenMeter ? 'max-w-2xl mx-auto grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
            
            {/* 1. FIELD POSITION (Only if NOT 7m) */}
            {!isSevenMeter && (
              <div className="order-1 lg:order-1 hidden lg:block">
                <div className="space-y-1.5 lg:space-y-3">
                  <h3 className="text-[7px] lg:text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">1. Feld</h3>
                  {/* The actual Field Map */}
                  <div 
                    className="relative aspect-[3/4] w-full bg-zinc-950 border border-zinc-800 rounded-xl lg:rounded-3xl overflow-hidden shadow-inner"
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
                        {/* 9m Line (Dashed) */}
                        <path d="M 10 60 A 90 90 0 0 0 85 100 L 115 100 A 90 90 0 0 0 190 60" fill="none" stroke="#84cc16" strokeWidth="1" strokeDasharray="4,4" opacity="0.6" strokeLinecap="round" />
                        {/* 4m Line (Goalkeeper Limit) - Smaller and thinner */}
                        <line x1="96" y1="50" x2="104" y2="50" stroke="#84cc16" strokeWidth="1" opacity="0.6" />
                        {/* 7m Penalty Mark - Adjusted for visual balance */}
                        <line x1="94" y1="82" x2="106" y2="82" stroke="#84cc16" strokeWidth="2" />
                      </g>
                      {isZoneMode && (
                        <g>{fieldZones.map(zone => (
                          <path key={zone.id} d={zone.d} onClick={(e) => { e.stopPropagation(); handleZoneSelect('fieldPos', zone.id); }}
                            className={`cursor-pointer transition-all duration-300 ${shotData.fieldPos === zone.id ? 'fill-brand/40 stroke-brand stroke-2' : 'fill-zinc-100/5 stroke-zinc-100/10 hover:fill-zinc-100/20'}`}
                          />
                        ))}</g>
                      )}
                    </svg>
                    {!isZoneMode && shotData.fieldPos && (
                      <motion.div className="absolute w-5 h-5 lg:w-8 lg:h-8 -ml-2.5 -mt-2.5 lg:-ml-4 lg:-mt-4 border-2 border-brand rounded-full shadow-[0_0_15px_rgba(132,204,22,0.8)] flex items-center justify-center bg-brand/20 pointer-events-none"
                        animate={{ left: `${shotData.fieldPos.x}%`, top: `${shotData.fieldPos.y}%` }}
                      ><div className="w-1 h-1 bg-brand rounded-full" /></motion.div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* MOBILE ONLY: 2-COLUMN LAYOUT OR FULL-WIDTH GOAL */}
            <div className="lg:hidden order-1 space-y-1.5">
               <div className="flex gap-2">
                  {!isSevenMeter && (
                    <div className="w-[45%] space-y-1.5">
                      <h3 className="text-[7px] font-black uppercase tracking-[0.2em] text-zinc-500">1. Feld</h3>
                      <div className="relative aspect-[3/4] bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-inner" onClick={handleFieldClick}>
                        <svg className="w-full h-full relative z-10" viewBox="0 0 200 245">
                          <g opacity="0.3" pointerEvents="none">
                            <line x1="10" y1="10" x2="190" y2="10" stroke="#3f3f46" strokeWidth="1" />
                            <path d="M 25 10 A 60 60 0 0 0 85 70 L 115 70 A 60 60 0 0 0 175 10" fill="none" stroke="#84cc16" strokeWidth="2.5" strokeLinecap="round" />
                            {/* 9m Line (Dashed) */}
                            <path d="M 10 60 A 90 90 0 0 0 85 100 L 115 100 A 90 90 0 0 0 190 60" fill="none" stroke="#84cc16" strokeWidth="1" strokeDasharray="4,4" opacity="0.6" strokeLinecap="round" />
                            {/* 4m/7m lines for mobile reference */}
                            <line x1="96" y1="50" x2="104" y2="50" stroke="#84cc16" strokeWidth="1" opacity="0.4" />
                            <line x1="94" y1="82" x2="106" y2="82" stroke="#84cc16" strokeWidth="2" opacity="0.6" />
                          </g>
                          {isZoneMode && (
                            <g>{fieldZones.map(zone => (
                              <path key={zone.id} d={zone.d} onClick={(e) => { e.stopPropagation(); handleZoneSelect('fieldPos', zone.id); }}
                                className={`cursor-pointer transition-all duration-300 ${shotData.fieldPos === zone.id ? 'fill-brand/40 stroke-brand stroke-2' : 'fill-zinc-100/5 stroke-zinc-100/10 hover:fill-zinc-100/20'}`}
                              />
                            ))}</g>
                          )}
                          {!isZoneMode && shotData.fieldPos && (
                            <motion.circle cx={shotData.fieldPos.x * 2} cy={shotData.fieldPos.y * 2.45} r="6" fill="#84cc16" fillOpacity="0.4" stroke="#84cc16" strokeWidth="2" />
                          )}
                        </svg>
                      </div>
                    </div>
                  )}

                  <div className={`${!isSevenMeter ? 'w-[55%]' : 'w-full'} space-y-1.5`}>
                    {action !== 'BLOCKED' && (
                      <>
                        <h3 className="text-[7px] font-black uppercase tracking-[0.2em] text-zinc-500">
                          {action?.includes('MISS') ? '2. Fehlwurf' : '2. Tor'}
                        </h3>
                        <div className="relative aspect-[3/2] bg-zinc-950 border-[2px] border-zinc-100/10 rounded-lg overflow-hidden shadow-inner" onClick={handleGoalClick}>
                          {action?.includes('MISS') ? (
                            <div className="absolute inset-0 flex items-end justify-center pointer-events-none">
                              <div className="w-[60%] h-[60%] border-x-2 border-t-2 border-zinc-700/50 rounded-t-sm" />
                            </div>
                          ) : (
                            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-10 pointer-events-none">
                              {[...Array(9)].map((_, i) => <div key={i} className="border border-zinc-100/30" />)}
                            </div>
                          )}
                          
                          {isZoneMode && action !== 'MISS' ? (
                            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                              {goalZones.map(zone => (
                                <button key={zone} onClick={(e) => { e.stopPropagation(); handleZoneSelect('goalPos', zone); }}
                                  className={`flex items-center justify-center transition-all border border-dashed ${shotData.goalPos === zone ? 'bg-brand/40 border-solid border-brand z-10 shadow-[0_0_10px_rgba(132,204,22,0.5)]' : 'border-zinc-100/10 hover:bg-zinc-100/10'}`}
                                />
                              ))}
                            </div>
                          ) : (
                            shotData.goalPos && (
                              <motion.div 
                                className={`absolute w-5 h-5 -ml-2.5 -mt-2.5 border-2 rounded-full flex items-center justify-center pointer-events-none z-20
                                  ${action?.includes('MISS') ? 'border-red-500 bg-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 
                                    (action?.includes('SAVE')) ? 'border-yellow-400 bg-yellow-400/30 shadow-[0_0_10px_rgba(250,204,21,0.8)]' :
                                    'border-brand bg-brand/30 shadow-[0_0_10px_rgba(132,204,22,1)]'}`}
                                animate={{ left: `${shotData.goalPos.x}%`, top: `${shotData.goalPos.y}%` }}
                              >
                                <Target size={10} className={(action?.includes('SAVE')) ? 'text-yellow-400' : action?.includes('MISS') ? 'text-red-500' : 'text-brand'} />
                              </motion.div>
                            )
                          )}
                        </div>
                      </>
                    )}
                    
                    {/* Mobile Settings Section */}
                    <div className="pt-1 space-y-2">
                       {!action?.includes('MISS') && !action?.includes('SAVE') && !action?.includes('BLOCKED') && (
                         <div className="space-y-1">
                            <h3 className="text-[6px] font-black uppercase text-zinc-600">{action === 'BLOCKED' ? 'Geblockt von' : 'Assist'}</h3>
                            <div className="flex flex-wrap gap-1 max-h-[45px] overflow-y-auto no-scrollbar">
                              <button onClick={() => setShotData(p => ({ ...p, assistPlayerId: null, blockedByPlayerId: null }))}
                                className={`px-1.5 py-1 rounded border text-[6px] font-black uppercase tracking-widest ${(!shotData.assistPlayerId && !shotData.blockedByPlayerId) ? 'bg-white text-black border-white' : 'bg-zinc-800 border-zinc-700 text-zinc-500'}`}
                              >Kein</button>
                              {(action === 'BLOCKED' ? opponentPlayers : teamPlayers.filter(p => p.id !== player.id)).map(p => (
                                <button key={p.id} onClick={() => setShotData(prev => ({ ...prev, [action === 'BLOCKED' ? 'blockedByPlayerId' : 'assistPlayerId']: p.id }))}
                                  className={`px-1.5 py-1 rounded border text-[6px] font-black uppercase tracking-widest ${(shotData.assistPlayerId === p.id || shotData.blockedByPlayerId === p.id) ? (action === 'BLOCKED' ? 'bg-red-500 text-white border-red-500' : 'bg-brand text-black border-brand') : 'bg-zinc-800 border-zinc-700 text-zinc-500'}`}
                                >#{p.number}</button>
                              ))}
                            </div>
                         </div>
                       )}
                       <div className="space-y-1">
                          <h3 className="text-[6px] font-black uppercase text-zinc-600">Wurf-Typ</h3>
                          <div className="grid grid-cols-2 gap-1">
                             {shotTypes.map(type => (
                               <button key={type} onClick={() => setShotData(prev => ({ ...prev, shotType: type }))}
                                 className={`py-1 rounded border text-[5px] font-black uppercase tracking-widest ${shotData.shotType === type ? 'bg-zinc-100 text-black border-zinc-100' : 'bg-zinc-800/40 border-zinc-800 text-zinc-600'}`}
                               >{type}</button>
                             ))}
                          </div>
                       </div>
                    </div>
                  </div>
               </div>
            </div>

            {/* 2. DESKTOP ONLY: GOAL + SETTINGS */}
            <div className="hidden lg:block order-2 space-y-8">
              {action !== 'BLOCKED' && (
                <div className="space-y-3">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
                    {action?.includes('MISS') ? '2. Fehlwurf-Ort' : '2. Torbild'}
                  </h3>
                  <div className={`relative aspect-[3/2] bg-zinc-950 border-[6px] border-zinc-100/10 rounded-3xl overflow-hidden shadow-inner ${!isZoneMode ? 'cursor-crosshair' : ''}`} onClick={handleGoalClick}>
                    {action?.includes('MISS') ? (
                      /* MISS VIEW: Smaller goal at bottom-center */
                      <div className="absolute inset-0 flex items-end justify-center pointer-events-none">
                        {/* The Goal Outline */}
                        <div className="w-[60%] h-[60%] border-x-2 lg:border-x-4 border-t-2 lg:border-t-4 border-zinc-500/40 rounded-t-sm relative">
                           {/* Crossbar/Post Glow */}
                           <div className="absolute -inset-1 border-x border-t border-zinc-500/10 blur-sm" />
                        </div>
                        
                        {shotData.goalPos && (
                          <motion.div 
                            className={`absolute w-5 h-5 lg:w-8 lg:h-8 -ml-2.5 -mt-2.5 lg:-ml-4 lg:-mt-4 border-2 rounded-full flex items-center justify-center z-20
                              ${action?.includes('MISS') ? 'border-red-500 bg-red-500/30 shadow-[0_0_15px_rgba(239,68,68,1)]' : 
                                (action?.includes('SAVE')) ? 'border-yellow-400 bg-yellow-400/30 shadow-[0_0_15px_rgba(250,204,21,0.8)]' :
                                'border-brand bg-brand/30 shadow-[0_0_15px_rgba(132,204,22,1)]'}`}
                            animate={{ left: `${shotData.goalPos.x}%`, top: `${shotData.goalPos.y}%` }}
                          >
                            <Target size={12} className={(action?.includes('SAVE')) ? 'text-yellow-400' : action?.includes('MISS') ? 'text-red-500' : 'text-brand'} />
                          </motion.div>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-10 pointer-events-none">
                          {[...Array(9)].map((_, i) => <div key={i} className="border border-zinc-100/30" />)}
                        </div>
                        {isZoneMode ? (
                          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                            {goalZones.map(zone => (
                              <button key={zone} onClick={(e) => { e.stopPropagation(); handleZoneSelect('goalPos', zone); }}
                                className={`flex items-center justify-center transition-all border border-dashed ${shotData.goalPos === zone ? 'bg-brand/40 border-solid border-brand z-10 shadow-[0_0_20px_rgba(132,204,22,0.5)]' : 'border-zinc-100/10 hover:bg-zinc-100/10'}`}
                              />
                            ))}
                          </div>
                        ) : (
                          shotData.goalPos && (
                           <motion.div 
                              className={`absolute w-8 h-8 -ml-4 -mt-4 border-2 rounded-full flex items-center justify-center pointer-events-none z-20
                                ${(action?.includes('SAVE')) ? 'border-yellow-400 bg-yellow-400/30 shadow-[0_0_20px_rgba(250,204,21,0.8)]' :
                                'border-brand bg-brand/30 shadow-[0_0_20px_rgba(132,204,22,1)]'}`}
                              animate={{ left: `${shotData.goalPos.x}%`, top: `${shotData.goalPos.y}%` }}
                            >
                              <Target size={16} className={(action?.includes('SAVE')) ? 'text-yellow-400' : 'text-brand'} />
                            </motion.div>
                          )
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-8">
                {!isSevenMeter && (
                  <>
                    {!action?.includes('MISS') && !action?.includes('SAVE') && (
                      <div className="space-y-3">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
                          {action === 'BLOCKED' ? 'Geblockt von (Gegner)' : 'Assist'}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => setShotData(p => ({ ...p, assistPlayerId: null, blockedByPlayerId: null }))}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${(!shotData.assistPlayerId && !shotData.blockedByPlayerId) ? 'bg-white text-black border-white' : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-zinc-200'}`}
                          >Kein</button>
                          {(action === 'BLOCKED' ? opponentPlayers : teamPlayers.filter(p => p.id !== player.id)).map(p => (
                            <button key={p.id} onClick={() => setShotData(prev => ({ ...prev, [action === 'BLOCKED' ? 'blockedByPlayerId' : 'assistPlayerId']: p.id }))}
                              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${(shotData.assistPlayerId === p.id || shotData.blockedByPlayerId === p.id) ? (action === 'BLOCKED' ? 'bg-red-500 text-white border-red-500' : 'bg-brand text-black border-brand') : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-zinc-200'}`}
                            >#{p.number}</button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Wurf-Typ</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {shotTypes.map(type => (
                          <button key={type} onClick={() => setShotData(prev => ({ ...prev, shotType: type }))}
                            className={`py-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${shotData.shotType === type ? 'bg-zinc-100 text-black border-zinc-100' : 'bg-zinc-800/40 border-zinc-800 text-zinc-600 hover:text-zinc-300'}`}
                          >{type}</button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 lg:p-5 border-t border-zinc-800 grid grid-cols-2 gap-3 bg-black/20 shrink-0">
          <Button 
            variant="primary" 
            className="py-3 lg:py-4 text-[10px] lg:text-[12px] font-black uppercase" 
            onClick={() => onSave(shotData)}
            disabled={!shotData.goalPos || (!isSevenMeter && !shotData.fieldPos)}
          >
            Speichern
          </Button>
          <button 
            onClick={onCancel}
            className="py-3 lg:py-4 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-xl lg:rounded-2xl text-[10px] lg:text-[12px] font-black uppercase active:scale-95 transition-all"
          >
            Abbruch
          </button>
        </div>


      </motion.div>
    </div>
  );
};

export default ShotDetailsModal;
