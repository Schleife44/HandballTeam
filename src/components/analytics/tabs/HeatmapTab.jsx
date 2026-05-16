import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, 
  Layers, 
  Maximize2,
  ChevronDown,
  Filter
} from 'lucide-react';
import { FIELD_ZONES, GOAL_ZONES } from '../../../data/analyticsConstants';

const HeatmapTab = ({ match, squad }) => {
  const isZoneMode = match?.isZoneMode || false;
  const [viewMode, setViewMode] = useState('tor');
  const [activeLayoutMode, setActiveLayoutMode] = useState('tor');
  const [teamFilter, setTeamFilter] = useState('home'); // home | away | goalkeeper
  const [selectedPlayer, setSelectedPlayer] = useState('all');
  const [selectedGk, setSelectedGk] = useState('all');
  const [filters, setFilters] = useState({ field: true, sevenM: true, missed: true });

  const goalkeepers = useMemo(() => squad?.home?.filter(p => p.position === 'TW' || p.isGoalkeeper === true) || [], [squad]);

  // Zone Heat Analysis
  const zoneStats = useMemo(() => {
    if (!isZoneMode) return null;
    const log = match?.log || match?.gameLog || [];
    
    const isGkMode = teamFilter === 'goalkeeper';
    const isSingleGk = goalkeepers.length === 1;
    const currentActiveGk = match?.activeGoalkeeperId;

    const stats = { field: {}, goal: {} };
    log.forEach(e => {
      const actionLower = e.action?.toLowerCase() || "";
      const isShot = ['GOAL', 'MISS', 'BLOCKED', 'SAVE', '7M_GOAL', '7M_SAVE', '7M_MISS'].includes(e.type);
      if (!isShot) return;
      
      const isOpponentAction = e.isOpponent === true || actionLower.includes('gegner');
      
      if (isGkMode) {
        if (!isOpponentAction) return;
        if (selectedGk !== 'all') {
          const gkId = e.details?.goalkeeperId;
          if (gkId) {
            if (gkId !== selectedGk) return;
          } else {
            if (currentActiveGk !== selectedGk && !isSingleGk) return;
          }
        }
      } else {
        if ((teamFilter === 'home') !== !isOpponentAction) return;
        if (selectedPlayer !== 'all' && String(e.playerNumber) !== String(selectedPlayer)) return;
      }
      
      const is7m = e.type.startsWith('7M') || actionLower.includes('7m');
      if (is7m && !filters.sevenM) return;
      if (!is7m && !filters.field) return;
      
      const isGoal = e.type === 'GOAL' || e.type === '7M_GOAL';
      const isSave = e.type === 'SAVE' || e.type === '7M_SAVE';
      if (!isGoal && !filters.missed) return;

      const successCondition = isGkMode ? isSave : isGoal;

      const fZone = e.details?.fieldZone || (typeof e.details?.fieldPos === 'string' ? e.details?.fieldPos : null) || (typeof e.fieldPos === 'string' ? e.fieldPos : null);
      const gZone = e.details?.goalZone || (typeof e.details?.goalPos === 'string' ? e.details?.goalPos : (typeof e.details?.goalPos === 'number' ? e.details?.goalPos : null)) || (typeof e.goalPos === 'string' ? e.goalPos : (typeof e.goalPos === 'number' ? e.goalPos : null));

      if (fZone && typeof fZone === 'string') {
        if (!stats.field[fZone]) stats.field[fZone] = { goals: 0, total: 0 };
        stats.field[fZone].total++;
        if (successCondition) stats.field[fZone].goals++;
      }
      if (gZone && (typeof gZone === 'string' || typeof gZone === 'number')) {
        if (!stats.goal[gZone]) stats.goal[gZone] = { goals: 0, total: 0 };
        stats.goal[gZone].total++;
        if (successCondition) stats.goal[gZone].goals++;
      }
    });

    const maxField = Math.max(0, ...Object.values(stats.field).map(s => s.total));
    const maxGoal = Math.max(0, ...Object.values(stats.goal).map(s => s.total));

    return { ...stats, maxField, maxGoal };
  }, [match, teamFilter, selectedPlayer, selectedGk, filters, isZoneMode, goalkeepers]);

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

  const filteredPoints = useMemo(() => {
    const log = match?.log || match?.gameLog || [];
    if (!log.length) return [];

    const isGkMode = teamFilter === 'goalkeeper';
    const isSingleGk = goalkeepers.length === 1;
    const currentActiveGk = match?.activeGoalkeeperId;

    return log.filter(e => {
      const actionLower = e.action?.toLowerCase() || "";
      const isShot = ['GOAL', 'MISS', 'BLOCKED', 'SAVE', '7M_GOAL', '7M_SAVE', '7M_MISS'].includes(e.type);
      if (!isShot) return false;
      
      const isOpponentAction = e.isOpponent === true || actionLower.includes('gegner');
      
      if (isGkMode) {
        if (!isOpponentAction) return false;
        if (selectedGk !== 'all') {
          const gkId = e.details?.goalkeeperId;
          if (gkId) {
            if (gkId !== selectedGk) return false;
          } else {
            if (currentActiveGk !== selectedGk && !isSingleGk) return false;
          }
        }
      } else {
        const isHomeAction = !isOpponentAction;
        const wantsHome = teamFilter === 'home';
        if (wantsHome !== isHomeAction) return false;
        
        if (selectedPlayer !== 'all' && String(e.playerNumber) !== String(selectedPlayer)) return false;
      }
      
      const pAction = String(e.details?.playerAction || e.action || '').toLowerCase();
      const is7m = pAction.includes('7m') || e.type.startsWith('7M');
      
      if (is7m && !filters.sevenM) return false;
      if (!is7m && !filters.field) return false;
      
      const isGoal = e.type === 'GOAL' || e.type === '7M_GOAL';
      if (!isGoal && !filters.missed) return false;
      
      const hasCoords = !!(e.details?.fieldPos || e.details?.goalPos || e.goalPos || e.fieldPos);
      return hasCoords;
    });
  }, [match, teamFilter, selectedPlayer, selectedGk, filters, goalkeepers]);

  const normalizeGoalCoords = (pos, isMiss) => {
    if (!pos || pos.x === undefined) return null;
    if (!isMiss) return pos;
    const normX = ((pos.x - 20) / 60) * 100;
    const normY = ((pos.y - 40) / 60) * 100;
    return { x: normX, y: normY };
  };

  const renderShotMarker = (x, y, type, id, isSmall = false) => {
    let color = '#ef4444'; // Default MISS
    let gradId = 'g-red-h';

    if (type === 'GOAL' || type === '7M_GOAL') {
      color = '#84cc16';
      gradId = 'g-lime-h';
    } else if (type === 'SAVE' || type === '7M_SAVE') {
      color = '#facc15';
      gradId = 'g-yellow-h';
    } else if (type === 'BLOCKED') {
      color = '#71717a';
      gradId = 'g-zinc-h';
    }

    const radius = isSmall ? 2.5 : 4;
    const glowRadius = isSmall ? 10 : 18;
    return (
      <g key={id}>
        <circle cx={x} cy={y} r={glowRadius} fill={`url(#${gradId})`} opacity="0.4" />
        <circle cx={x} cy={y} r={radius} fill={color} />
        <circle cx={x} cy={y} r={radius} fill="none" stroke="white" strokeWidth="1" />
      </g>
    );
  };

  const getCardStyles = () => {
    switch (activeLayoutMode) {
      case 'tor': return "max-w-[550px] aspect-[1.4/1] p-4";
      case 'feld': return "max-w-[340px] p-10";
      case 'kombi': return "max-w-[480px] p-6";
      default: return "";
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-8 py-4 overflow-hidden">
      {/* 1. HEADER */}
      <div className="w-full max-w-5xl bg-zinc-900/40 backdrop-blur-2xl border border-white/5 p-2 rounded-[2rem] shadow-2xl flex flex-col xl:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5">
            <button onClick={() => setTeamFilter('home')} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-tighter transition-all ${teamFilter === 'home' ? 'bg-brand text-black shadow-[0_0_20px_rgba(132,204,22,0.3)]' : 'text-zinc-400 hover:text-zinc-200'}`}>Schützen Heim</button>
            <button onClick={() => setTeamFilter('away')} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-tighter transition-all ${teamFilter === 'away' ? 'bg-brand text-black shadow-[0_0_20px_rgba(132,204,22,0.3)]' : 'text-zinc-400 hover:text-zinc-200'}`}>Schützen Gegner</button>
            <button onClick={() => setTeamFilter('goalkeeper')} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-tighter transition-all ${teamFilter === 'goalkeeper' ? 'bg-brand text-black shadow-[0_0_20px_rgba(132,204,22,0.3)]' : 'text-zinc-400 hover:text-zinc-200'}`}>Torwart Heatmap</button>
          </div>
          <div className="h-8 w-[1px] bg-white/10 mx-2 hidden sm:block" />
          <div className="relative group">
            {teamFilter === 'goalkeeper' ? (
              <select value={selectedGk} onChange={(e) => setSelectedGk(e.target.value)} className="bg-black/40 border border-white/5 rounded-2xl px-6 py-2.5 text-[10px] font-bold text-zinc-100 appearance-none outline-none focus:border-brand/50 min-w-[160px] cursor-pointer">
                <option value="all">Alle Torhüter</option>
                {goalkeepers.map(gk => <option key={`gk-${gk.id}`} value={gk.id}>#{gk.number} - {gk.name}</option>)}
              </select>
            ) : (
              <select value={selectedPlayer} onChange={(e) => setSelectedPlayer(e.target.value)} className="bg-black/40 border border-white/5 rounded-2xl px-6 py-2.5 text-[10px] font-bold text-zinc-100 appearance-none outline-none focus:border-brand/50 min-w-[160px] cursor-pointer">
                <option value="all">Kader Gesamt</option>
                {squad?.home?.map(p => <option key={`p-${p.id}`} value={p.number}>#{p.number} - {p.name}</option>)}
              </select>
            )}
            <ChevronDown size={12} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-black/20 p-1.5 rounded-2xl border border-white/5">
            {[{id:'tor',l:'Tor',i:Target},{id:'feld',l:'Feld',i:Maximize2},{id:'kombi',l:'Kombi',i:Layers}].map(btn => (
              <button key={`btn-${btn.id}`} onClick={() => setViewMode(btn.id)} className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === btn.id ? 'bg-white/10 text-white border border-white/10' : 'text-zinc-500 hover:text-zinc-300'}`}>
                <btn.i size={14} className={viewMode === btn.id ? 'text-brand' : ''} /> {btn.l}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4 pr-2">
            {[{id:'field',l:'Feld'},{id:'sevenM',l:'7m'},{id:'missed',l:'Fehl'}].map(f => (
              <label key={`f-${f.id}`} className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" checked={filters[f.id]} onChange={(e) => setFilters(p => ({...p,[f.id]:e.target.checked}))} className="hidden" />
                <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${filters[f.id] ? 'bg-brand border-brand shadow-[0_0_15px_rgba(132,204,22,0.2)]' : 'border-white/10 bg-white/5'}`}>
                  {filters[f.id] && <div className="w-2 h-2 bg-black rounded-sm" />}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${filters[f.id] ? 'text-zinc-200' : 'text-zinc-500'}`}>{f.l}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* 2. CANVAS */}
      <motion.div 
        layout
        transition={{ type: "spring", stiffness: 180, damping: 25 }}
        style={{ originY: 0 }}
        className="w-full max-w-5xl bg-gradient-to-br from-[#121214] to-black border border-white/5 rounded-[3.5rem] p-10 relative shadow-3xl overflow-hidden flex flex-col items-center justify-start min-h-[100px]"
      >
        <svg style={{ position: 'absolute', width: 0, height: 0 }}>
          <defs>
            <radialGradient id="g-lime-h" x="50%" y="50%" r="50%">
              <stop offset="0%" stopColor="#84cc16" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#84cc16" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="g-red-h" x="50%" y="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="g-yellow-h" x="50%" y="50%" r="50%">
              <stop offset="0%" stopColor="#facc15" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#facc15" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="g-zinc-h" x="50%" y="50%" r="50%">
              <stop offset="0%" stopColor="#71717a" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#71717a" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>

        {/* MORPHING CARD - Size controlled by activeLayoutMode */}
        <motion.div 
          layout
          className={`w-full bg-black/40 rounded-[2rem] border border-white/10 shadow-inner z-10 overflow-hidden flex flex-col items-center justify-center transition-colors duration-500 ${getCardStyles()}`}
          transition={{ type: "spring", stiffness: 150, damping: 25 }}
          style={{ originY: 0 }}
        >
          {/* AnimatePresence with onExitComplete to trigger Morphing */}
          <AnimatePresence 
            mode="wait" 
            onExitComplete={() => {
              setActiveLayoutMode(viewMode);
            }}
          >
            <motion.div
              key={viewMode}
              initial={{ opacity: 0 }}
              animate={{ opacity: activeLayoutMode === viewMode ? 1 : 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-full h-full flex items-center justify-center"
            >
              {activeLayoutMode === viewMode && (
                <>
                  {viewMode === 'tor' && (
                    <svg viewBox="0 0 350 230" className="w-full h-full overflow-visible">
                      <g transform="translate(50, 40)">
                        <g opacity="0.15">
                          {GOAL_ZONES.map((zone, i) => (
                            <rect key={`grid-tor-${i}`} x={(zone.x * 250) / 100} y={(zone.y * 180) / 100} width={250 / 3} height={180 / 3} fill="none" stroke="white" strokeWidth="1" />
                          ))}
                        </g>
                        {isZoneMode && zoneStats && GOAL_ZONES.map(zone => {
                          const stats = zoneStats.goal[zone.id] || { goals: 0, total: 0 };
                          if (stats.total === 0) return null;
                          const intensity = zoneStats.maxGoal > 0 ? (stats.total / zoneStats.maxGoal) : 0;
                          return (
                            <g key={`heat-goal-${zone.id}`}>
                              <rect x={(zone.x * 250) / 100} y={(zone.y * 180) / 100} width={250 / 3} height={180 / 3} fill="#84cc16" opacity={0.1 + intensity * 0.7} />
                              <text x={(zone.tx * 250) / 100} y={(zone.ty * 180) / 100} textAnchor="middle" dominantBaseline="middle" fill="white" className="text-[12px] font-black italic select-none pointer-events-none drop-shadow-md">
                                {stats.goals}/{stats.total}
                              </text>
                            </g>
                          );
                        })}
                        <rect x="0" y="0" width="250" height="180" rx="2" fill="none" stroke="#3f3f46" strokeWidth="2" />
                      </g>
                      {!isZoneMode && filteredPoints.map((p, idx) => {
                        const rawGoalPos = p.details?.goalPos || p.goalPos;
                        const isMiss = p.type?.includes('MISS');
                        const pos = normalizeGoalCoords(getCoordFromZone(rawGoalPos, 'goal'), isMiss);
                        if (!pos || pos.x === undefined) return null;
                        if (p.type === 'BLOCKED') return null;
                        return renderShotMarker(50 + (pos.x / 100) * 250, 40 + (pos.y / 100) * 180, p.type, `sh-goal-${p.id || idx}`);
                      })}
                    </svg>
                  )}

                  {viewMode === 'feld' && (
                    <svg viewBox="0 0 200 245" className="w-full h-auto overflow-visible">
                      <g pointerEvents="none">
                        <line x1="10" y1="10" x2="190" y2="10" stroke="#3f3f46" strokeWidth="1" />
                        <line x1="10" y1="10" x2="10" y2="245" stroke="#3f3f46" strokeWidth="1" />
                        <line x1="190" y1="10" x2="190" y2="245" stroke="#3f3f46" strokeWidth="1" />
                        <line x1="10" y1="240" x2="190" y2="240" stroke="#3f3f46" strokeWidth="1.5" />
                        <path d="M 60 240 A 40 40 0 0 1 140 240" fill="none" stroke="#3f3f46" strokeWidth="1" />
                        <path d="M 25 10 A 60 60 0 0 0 85 70 L 115 70 A 60 60 0 0 0 175 10" fill="none" stroke="#84cc16" strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
                        <path d="M 10 60 A 90 90 0 0 0 85 100 L 115 100 A 90 90 0 0 0 190 60" fill="none" stroke="#84cc16" strokeWidth="1.5" strokeDasharray="8 6" opacity="0.25" />
                        <line x1="94" y1="80" x2="106" y2="80" stroke="#84cc16" strokeWidth="1.5" opacity="0.3" />
                      </g>
                      
                      {isZoneMode && zoneStats && FIELD_ZONES.map(zone => {
                        const stats = zoneStats.field[zone.id] || { goals: 0, total: 0 };
                        if (stats.total === 0) return null;
                        const intensity = zoneStats.maxField > 0 ? (stats.total / zoneStats.maxField) : 0;
                        return (
                          <g key={`heat-field-${zone.id}`}>
                            <path d={zone.d} fill="#84cc16" opacity={0.1 + intensity * 0.7} />
                            <text x={zone.tx} y={zone.ty} textAnchor="middle" dominantBaseline="middle" fill="white" className="text-[10px] font-black italic select-none pointer-events-none drop-shadow-md">
                              {stats.goals}/{stats.total}
                            </text>
                          </g>
                        );
                      })}

                      {!isZoneMode && filteredPoints.map((p, idx) => {
                        const rawFieldPos = p.details?.fieldPos || p.fieldPos;
                        const pos = getCoordFromZone(rawFieldPos, 'field');
                        if (!pos || pos.x === undefined) return null;
                        return renderShotMarker((pos.x / 100) * 200, (pos.y / 100) * 245, p.type, `sh-field-${p.id || idx}`);
                      })}
                    </svg>
                  )}

                  {viewMode === 'kombi' && (
                    <svg viewBox="0 0 200 230" className="w-full h-auto overflow-hidden">
                      <g transform="translate(68, 18) scale(0.25)">
                        <rect x="0" y="0" width="250" height="180" rx="2" fill="black" fillOpacity="0.2" stroke="#3f3f46" strokeWidth="3" />
                        <g opacity="0.2">
                          {GOAL_ZONES.map((zone, i) => (
                            <rect key={`grid-kombi-${i}`} x={(zone.x * 250) / 100} y={(zone.y * 180) / 100} width={250 / 3} height={180 / 3} fill="none" stroke="white" strokeWidth="2" />
                          ))}
                        </g>
                        {isZoneMode && zoneStats && GOAL_ZONES.map(zone => {
                          const stats = zoneStats.goal[zone.id] || { goals: 0, total: 0 };
                          if (stats.total === 0) return null;
                          const intensity = zoneStats.maxGoal > 0 ? (stats.total / zoneStats.maxGoal) : 0;
                          return (
                            <g key={`heat-kombi-goal-${zone.id}`}>
                              <rect x={(zone.x * 250) / 100} y={(zone.y * 180) / 100} width={250 / 3} height={180 / 3} fill="#84cc16" opacity={0.1 + intensity * 0.7} />
                              <text x={(zone.tx * 250) / 100} y={(zone.ty * 180) / 100} textAnchor="middle" dominantBaseline="middle" fill="white" className="text-[12px] font-black italic select-none pointer-events-none drop-shadow-md">
                                {stats.goals}/{stats.total}
                              </text>
                            </g>
                          );
                        })}
                      </g>
                      <g transform="translate(35, 56.5) scale(0.65)">
                        <path d="M 10 10 L 190 10 L 190 240 L 10 240 Z" fill="none" stroke="#3f3f46" strokeWidth="1.5" />
                        <path d="M 60 240 A 40 40 0 0 1 140 240" fill="none" stroke="#3f3f46" strokeWidth="1" opacity="0.5" />
                        <path d="M 25 10 A 60 60 0 0 0 85 70 L 115 70 A 60 60 0 0 0 175 10" fill="none" stroke="#84cc16" strokeWidth="2.5" strokeLinecap="round" opacity="0.3" />
                        <path d="M 10 60 A 90 90 0 0 0 85 100 L 115 100 A 90 90 0 0 0 190 60" fill="none" stroke="#84cc16" strokeWidth="1.5" strokeDasharray="8 6" opacity="0.15" />
                        <line x1="94" y1="80" x2="106" y2="80" stroke="#84cc16" strokeWidth="1.5" opacity="0.2" />
                        
                        {isZoneMode && zoneStats && FIELD_ZONES.map(zone => {
                          const stats = zoneStats.field[zone.id] || { goals: 0, total: 0 };
                          if (stats.total === 0) return null;
                          const intensity = zoneStats.maxField > 0 ? (stats.total / zoneStats.maxField) : 0;
                          return (
                            <g key={`heat-kombi-field-${zone.id}`}>
                              <path d={zone.d} fill="#84cc16" opacity={0.1 + intensity * 0.7} />
                              <text x={zone.tx} y={zone.ty} textAnchor="middle" dominantBaseline="middle" fill="white" className="text-[10px] font-black italic select-none pointer-events-none drop-shadow-md">
                                {stats.goals}/{stats.total}
                              </text>
                            </g>
                          );
                        })}
                      </g>
                      {!isZoneMode && filteredPoints.map((p, idx) => {
                        const rawFPos = p.details?.fieldPos || p.fieldPos;
                        const rawGPos = p.details?.goalPos || p.goalPos;
                        
                        const fPos = getCoordFromZone(rawFPos, 'field');
                        const gPos = getCoordFromZone(rawGPos, 'goal');
                        
                        if (!fPos || !gPos || fPos.x === undefined || gPos.x === undefined) return null;
                        
                        const fx = 35 + (fPos.x / 100) * 200 * 0.65;
                        const fy = 56.5 + (fPos.y / 100) * 245 * 0.65;
                        
                        const isGoal = p.type?.includes('GOAL');
                        const isSave = p.type?.includes('SAVE');
                        const isMiss = p.type?.includes('MISS');
                        const isBlocked = p.type === 'BLOCKED';

                        const normGPos = normalizeGoalCoords(gPos, isMiss);
                        if (!normGPos || normGPos.x === undefined) return null;

                        const gx = 68 + (normGPos.x / 100) * 250 * 0.25;
                        const gy = 18 + (normGPos.y / 100) * 180 * 0.25;

                        return (
                          <g key={`path-kombi-${p.id || idx}`}>
                            {!isBlocked && (
                              <line 
                                x1={fx} y1={fy} x2={gx} y2={gy} 
                                stroke={isGoal ? '#84cc16' : (isSave ? '#facc15' : '#ef4444')} 
                                strokeOpacity="0.35" strokeWidth="1" strokeDasharray="2,2" 
                              />
                            )}
                            {renderShotMarker(fx, fy, p.type, `f-kombi-${idx}`, true)}
                            {!isBlocked && renderShotMarker(gx, gy, p.type, `g-kombi-${idx}`, true)}
                          </g>
                        );
                      })}
                    </svg>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Statistics Badge */}
        <div className="absolute bottom-8 left-12 flex items-center gap-4 bg-black/40 backdrop-blur-md px-6 py-2.5 rounded-2xl border border-white/5 shadow-2xl">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-2.5 h-2.5 bg-brand rounded-full animate-ping opacity-30" />
            <div className="w-1.5 h-1.5 bg-brand rounded-full shadow-[0_0_10px_#84cc16]" />
          </div>
          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest italic">
            {filteredPoints.length} {isZoneMode ? 'Tactical Zone Points' : 'Live Tactical Points'}
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default HeatmapTab;
