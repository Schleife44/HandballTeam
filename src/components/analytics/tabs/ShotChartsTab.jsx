import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

const ShotChartsTab = ({ match, squad }) => {
  const getCoordFromZone = (zone, type = 'goal') => {
    if (typeof zone === 'object' && zone !== null) return zone;
    if (type === 'goal') {
      const z = parseInt(zone);
      if (isNaN(z) || z < 1 || z > 9) return null;
      const row = Math.floor((z - 1) / 3);
      const col = (z - 1) % 3;
      return { x: 16.6 + col * 33.3, y: 16.6 + row * 33.3 };
    }
    if (type === 'field') {
      const mapping = {
        'AL': { x: 15, y: 40 }, 'RL': { x: 35, y: 65 }, 'KM': { x: 50, y: 85 },
        'RR': { x: 65, y: 65 }, 'AR': { x: 85, y: 40 }, 'RM_B': { x: 50, y: 140 },
        'RL_B': { x: 25, y: 120 }, 'RR_B': { x: 75, y: 120 }, 'Fern': { x: 50, y: 220 }
      };
      return mapping[zone] || null;
    }
    return null;
  };

  // Common Marker Rendering
  const renderShotMarker = (x, y, isGoal, id) => {
    const color = isGoal ? '#84cc16' : '#ef4444';
    const gradId = isGoal ? 'g-lime-sc' : 'g-red-sc';
    return (
      <g key={id}>
        <circle cx={x} cy={y} r="8" fill={`url(#${gradId})`} opacity="0.4" />
        <circle cx={x} cy={y} r="2.2" fill={color} />
        <circle cx={x} cy={y} r="2.2" fill="none" stroke="white" strokeWidth="0.8" />
      </g>
    );
  };

  const activePlayers = squad?.home?.filter(p => 
    match?.log?.some(e => String(e.playerNumber) === String(p.number) && ['GOAL', 'MISS', 'BLOCKED', 'SAVE', '7M_GOAL', '7M_SAVE', '7M_MISS'].includes(e.type))
  ) || [];

  return (
    <div className="w-full space-y-8 pb-20">
      <header className="flex items-center justify-between px-4">
        <div>
          <h3 className="text-xl font-black uppercase italic tracking-tighter text-zinc-100">Wurfbilder Spieler</h3>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Individuelle Analyse</p>
        </div>
        <div className="flex items-center gap-3 bg-zinc-900/40 px-6 py-2 rounded-2xl border border-white/5 shadow-lg">
          <TrendingUp size={14} className="text-brand" />
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{activePlayers.length} Schützen</span>
        </div>
      </header>

      {/* COMPACT PLAYER GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
        <svg style={{ position: 'absolute', width: 0, height: 0 }}>
          <defs>
            <radialGradient id="g-lime-sc" x="50%" y="50%" r="50%">
              <stop offset="0%" stopColor="#84cc16" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#84cc16" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="g-red-sc" x="50%" y="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>

        {activePlayers.map((player, pIdx) => {
          const playerShots = match.log.filter(e => 
            String(e.playerNumber) === String(player.number) && 
            ['GOAL', 'MISS', 'BLOCKED', 'SAVE', '7M_GOAL', '7M_SAVE', '7M_MISS'].includes(e.type)
          );
          const goals = playerShots.filter(s => s.type === 'GOAL' || s.type === '7M_GOAL').length;

          return (
            <motion.div 
              key={player.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: pIdx * 0.04 }}
              className="group bg-zinc-900/30 border border-white/5 rounded-[2rem] p-4 hover:border-brand/40 transition-all shadow-xl backdrop-blur-md flex flex-col gap-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center font-black text-brand border border-white/5 shadow-inner text-xs">
                    #{player.number}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-zinc-100 uppercase italic truncate max-w-[80px]">{player.name}</span>
                    <span className="text-[7px] font-bold text-zinc-600 uppercase tracking-widest">Aktiv</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-xs font-black text-zinc-100 italic">{goals}/{playerShots.length}</span>
                  <span className="text-[6px] font-black text-brand uppercase tracking-widest">Tore</span>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {/* 1. FIELD SHOTS SECTION */}
                {(() => {
                  const fieldShots = playerShots.filter(s => !(s.action?.toLowerCase().includes('7m') || s.type.startsWith('7M')));
                  if (fieldShots.length === 0) return null;

                  return (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 px-1">
                        <span className="text-[7px] font-black text-zinc-500 uppercase tracking-[0.2em]">Feldwürfe</span>
                        <div className="h-[1px] flex-1 bg-white/5" />
                      </div>
                      <div className="relative aspect-[0.9/1] bg-black/40 rounded-2xl border border-white/5 p-3 overflow-hidden flex items-center justify-center shadow-inner group-hover:bg-black/50 transition-colors">
                        <svg viewBox="0 0 200 230" className="w-full h-full opacity-90">
                          {/* GOAL GEOMETRY */}
                          <g transform="translate(68, 18) scale(0.25)">
                            <rect x="0" y="0" width="250" height="180" rx="2" fill="none" stroke="#3f3f46" strokeWidth={12} opacity="0.3" />
                            <g opacity="0.1">
                              {[...Array(9)].map((_, i) => (
                                <rect key={`p-grid-f-${i}`} x={((i % 3) * 250) / 3} y={(Math.floor(i / 3) * 180) / 3} width={250 / 3} height={180 / 3} fill="none" stroke="white" strokeWidth={8} />
                              ))}
                            </g>
                          </g>
                          {/* FIELD GEOMETRY */}
                          <g transform="translate(35, 56.5) scale(0.65)">
                            <path d="M 10 10 L 190 10 L 190 240 L 10 240 Z" fill="none" stroke="#3f3f46" strokeWidth="1.5" opacity="0.3" />
                            <path d="M 25 10 A 60 60 0 0 0 85 70 L 115 70 A 60 60 0 0 0 175 10" fill="none" stroke="#84cc16" strokeWidth="2" strokeLinecap="round" opacity="0.2" />
                            <path d="M 10 60 A 90 90 0 0 0 85 100 L 115 100 A 90 90 0 0 0 190 60" fill="none" stroke="#84cc16" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.15" />
                            <line x1="94" y1="80" x2="106" y2="80" stroke="#84cc16" strokeWidth="1.5" opacity="0.2" />
                            <path d="M 60 240 A 40 40 0 0 1 140 240" fill="none" stroke="#3f3f46" strokeWidth="1" opacity="0.2" />
                          </g>
                          {fieldShots.map((s, sIdx) => {
                            const rawFPos = s.details?.fieldPos || s.fieldPos;
                            const rawGPos = s.details?.goalPos || s.goalPos;
                            const fPos = getCoordFromZone(rawFPos, 'field');
                            const gPos = getCoordFromZone(rawGPos, 'goal');
                            if (!fPos || !gPos || fPos.x === undefined || gPos.x === undefined) return null;
                            const fx = 35 + (fPos.x / 100) * 200 * 0.65;
                            const fy = 56.5 + (fPos.y / 100) * 245 * 0.65;
                            const gx = 68 + (gPos.x / 100) * 250 * 0.25;
                            const gy = 18 + (gPos.y / 100) * 180 * 0.25;
                            const isGoal = s.type === 'GOAL';
                            return (
                              <g key={`sh-f-${s.id || sIdx}`}>
                                <line x1={fx} y1={fy} x2={gx} y2={gy} stroke={isGoal ? '#84cc16' : '#ef4444'} strokeOpacity="0.35" strokeWidth="0.8" strokeDasharray="2,2" />
                                {renderShotMarker(fx, fy, isGoal, `ff-${sIdx}`)}
                                {renderShotMarker(gx, gy, isGoal, `gg-${sIdx}`)}
                              </g>
                            );
                          })}
                        </svg>
                      </div>
                    </div>
                  );
                })()}

                {/* 2. 7M SHOTS SECTION */}
                {(() => {
                  const sevenMShots = playerShots.filter(s => s.action?.toLowerCase().includes('7m') || s.type.startsWith('7M'));
                  if (sevenMShots.length === 0) return null;

                  return (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 px-1">
                        <span className="text-[7px] font-black text-brand uppercase tracking-[0.2em]">7-Meter</span>
                        <div className="h-[1px] flex-1 bg-brand/10" />
                      </div>
                      <div className="relative aspect-[1.4/1] bg-black/40 rounded-2xl border border-white/5 p-3 overflow-hidden flex items-center justify-center shadow-inner group-hover:bg-black/50 transition-colors">
                        <svg viewBox="0 0 250 180" className="w-full h-full opacity-90">
                          <rect x="0" y="0" width="250" height="180" rx="2" fill="none" stroke="#3f3f46" strokeWidth={4} opacity="0.3" />
                          <g opacity="0.15">
                            {[...Array(9)].map((_, i) => (
                              <rect key={`p-grid-7-${i}`} x={((i % 3) * 250) / 3} y={(Math.floor(i / 3) * 180) / 3} width={250 / 3} height={180 / 3} fill="none" stroke="white" strokeWidth={2} />
                            ))}
                          </g>
                          {sevenMShots.map((s, sIdx) => {
                            const rawGPos = s.details?.goalPos || s.goalPos;
                            const gPos = getCoordFromZone(rawGPos, 'goal');
                            if (!gPos || gPos.x === undefined) return null;
                            const gx = (gPos.x / 100) * 250;
                            const gy = (gPos.y / 100) * 180;
                            const isGoal = s.type === '7M_GOAL';
                            return renderShotMarker(gx, gy, isGoal, `g7-${sIdx}`);
                          })}
                        </svg>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ShotChartsTab;
