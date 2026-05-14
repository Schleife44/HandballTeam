import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Maximize2, Layers } from 'lucide-react';
import Card from '../../ui/Card';
import Select from '../../ui/Select';

const GameStatsHeatmap = ({ 
  selectedTeam, 
  handleTeamChange, 
  selectedPlayer, 
  setSelectedPlayer, 
  heatmapPlayers, 
  viewMode, 
  setViewMode, 
  filters, 
  setFilters,
  getCardStyles,
  activeLayoutMode,
  setActiveLayoutMode,
  filteredPoints,
  getCoordFromZone,
  renderShotMarker
}) => {
  return (
    <div className="w-full flex flex-col items-center gap-8 py-4 overflow-hidden animate-in fade-in duration-500">
      <Card noPadding className="w-full bg-zinc-900/40 backdrop-blur-2xl border border-white/5 p-2 rounded-[2rem] shadow-2xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5">
            <button onClick={() => handleTeamChange('home')} className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-tighter transition-all ${selectedTeam === 'home' ? 'bg-brand text-black shadow-[0_0_20px_rgba(132,204,22,0.3)]' : 'text-zinc-400 hover:text-zinc-200'}`}>Heimteam</button>
            <button onClick={() => handleTeamChange('away')} className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-tighter transition-all ${selectedTeam === 'away' ? 'bg-brand text-black shadow-[0_0_20px_rgba(132,204,22,0.3)]' : 'text-zinc-400 hover:text-zinc-200'}`}>Gegner</button>
          </div>
          <div className="h-8 w-[1px] bg-white/10 mx-2" />
          <Select 
            className="w-48"
            value={selectedPlayer} 
            onChange={(e) => setSelectedPlayer(e.target.value)}
            options={[
              { value: 'all', label: selectedTeam === 'home' ? 'Kader Gesamt' : 'Gegner Gesamt' },
              ...heatmapPlayers.map(p => ({ value: p.id, label: `#${p.id} - ${p.name}` }))
            ]}
          />
        </div>
        <div className="flex bg-black/20 p-1.5 rounded-2xl border border-white/5 mx-4">
          {[
            {id:'tor',l:'Tor',i:Target},
            {id:'feld',l:'Feld',i:Maximize2},
            {id:'kombi',l:'Kombi',i:Layers}
          ].map(btn => (
            <button key={`btn-${btn.id}`} onClick={() => setViewMode(btn.id)} className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === btn.id ? 'bg-white/10 text-white border border-white/10' : 'text-zinc-500 hover:text-zinc-300'}`}>
              <btn.i size={14} className={viewMode === btn.id ? 'text-brand' : ''} /> {btn.l}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-6 pr-6">
          {[
            {id:'field',l:'Feld'},
            {id:'sevenM',l:'7m'},
            {id:'missed',l:'Fehl'}
          ].map(f => (
            <label key={`f-${f.id}`} className="flex items-center gap-2.5 cursor-pointer group">
              <input type="checkbox" checked={filters[f.id]} onChange={(e) => setFilters(p => ({...p,[f.id]:e.target.checked}))} className="hidden" />
              <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${filters[f.id] ? 'bg-brand border-brand shadow-[0_0_15px_rgba(132,204,22,0.2)]' : 'border-white/10 bg-white/5'}`}>
                {filters[f.id] && <div className="w-2 h-2 bg-black rounded-sm" />}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${filters[f.id] ? 'text-zinc-200' : 'text-zinc-500'}`}>{f.l}</span>
            </label>
          ))}
        </div>
      </Card>

      <motion.div layout transition={{ type: "spring", stiffness: 180, damping: 25 }} className="w-full max-w-5xl bg-gradient-to-br from-[#121214] to-black border border-white/5 rounded-[3.5rem] p-10 relative shadow-3xl overflow-hidden flex flex-col items-center justify-start min-h-[500px]">
        <svg style={{ position: 'absolute', width: 0, height: 0 }}>
          <defs>
            <radialGradient id="g-lime-h-archive" x="50%" y="50%" r="50%"><stop offset="0%" stopColor="#84cc16" stopOpacity="0.4" /><stop offset="100%" stopColor="#84cc16" stopOpacity="0" /></radialGradient>
            <radialGradient id="g-red-h-archive" x="50%" y="50%" r="50%"><stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" /><stop offset="100%" stopColor="#ef4444" stopOpacity="0" /></radialGradient>
            <radialGradient id="g-yellow-h-archive" x="50%" y="50%" r="50%"><stop offset="0%" stopColor="#eab308" stopOpacity="0.4" /><stop offset="100%" stopColor="#eab308" stopOpacity="0" /></radialGradient>
          </defs>
        </svg>

        <motion.div layout className={`w-full bg-black/40 rounded-[2rem] border border-white/10 shadow-inner z-10 overflow-hidden flex flex-col items-center justify-center transition-colors duration-500 ${getCardStyles()}`} transition={{ type: "spring", stiffness: 150, damping: 25 }}>
          <AnimatePresence mode="wait" onExitComplete={() => setActiveLayoutMode(viewMode)}>
            <motion.div key={viewMode} initial={{ opacity: 0 }} animate={{ opacity: activeLayoutMode === viewMode ? 1 : 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="w-full h-full flex items-center justify-center">
              {activeLayoutMode === viewMode && (
                <>
                  {viewMode === 'tor' && (
                    <svg viewBox="0 0 350 230" className="w-full h-full overflow-visible">
                      <g transform="translate(50, 40)"><g opacity="0.15">{[...Array(9)].map((_, i) => <rect key={i} x={((i % 3) * 250) / 3} y={(Math.floor(i / 3) * 180) / 3} width={250 / 3} height={180 / 3} fill="none" stroke="white" strokeWidth="1" />)}</g><rect x="0" y="0" width="250" height="180" rx="2" fill="none" stroke="#3f3f46" strokeWidth="2" /></g>
                      {filteredPoints.map((p, idx) => {
                        const rawGoalPos = p.goalPos || p.details?.goalPos || p.metadata?.goalPos || p.wurfbild;
                        const pos = getCoordFromZone(rawGoalPos, 'goal');
                        if (!pos || pos.x === undefined) return null;
                        return renderShotMarker(50 + (pos.x / 100) * 250, 40 + (pos.y / 100) * 180, p.action, `sh-goal-${p.id || idx}`);
                      })}
                    </svg>
                  )}
                  {viewMode === 'feld' && (
                    <svg viewBox="0 0 200 245" className="w-full h-auto overflow-visible">
                      <g pointerEvents="none">
                        <line x1="10" y1="10" x2="190" y2="10" stroke="#3f3f46" strokeWidth="1" /><line x1="10" y1="10" x2="10" y2="245" stroke="#3f3f46" strokeWidth="1" /><line x1="190" y1="10" x2="190" y2="245" stroke="#3f3f46" strokeWidth="1" /><line x1="10" y1="240" x2="190" y2="240" stroke="#3f3f46" strokeWidth="1.5" />
                        <path d="M 25 10 A 60 60 0 0 0 85 70 L 115 70 A 60 60 0 0 0 175 10" fill="none" stroke="#84cc16" strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
                        <path d="M 10 60 A 90 90 0 0 0 85 100 L 115 100 A 90 90 0 0 0 190 60" fill="none" stroke="#84cc16" strokeWidth="1.5" strokeDasharray="8 6" opacity="0.25" />
                      </g>
                      {filteredPoints.map((p, idx) => {
                        const rawFieldPos = p.fieldPos || p.details?.fieldPos || p.metadata?.fieldPos || p.wurfposition;
                        const pos = getCoordFromZone(rawFieldPos, 'field');
                        if (!pos || pos.x === undefined) return null;
                        
                        let xPerc = parseFloat(pos.x);
                        let yPerc = parseFloat(pos.y);
                        return renderShotMarker((xPerc / 100) * 200, 10 + (yPerc / 100) * 230, p.action, `sh-field-${p.id || idx}`);
                      })}
                    </svg>
                  )}
                  {viewMode === 'kombi' && (
                    <svg viewBox="0 0 200 230" className="w-full h-auto overflow-hidden">
                      <g transform="translate(68, 18) scale(0.25)"><rect x="0" y="0" width="250" height="180" rx="2" fill="black" fillOpacity="0.2" stroke="#3f3f46" strokeWidth="3" /><g opacity="0.2">{[...Array(9)].map((_, i) => <rect key={i} x={((i % 3) * 250) / 3} y={(Math.floor(i / 3) * 180) / 3} width={250 / 3} height={180 / 3} fill="none" stroke="white" strokeWidth="2" />)}</g></g>
                      <g transform="translate(35, 56.5) scale(0.65)">
                        <path d="M 10 10 L 190 10 L 190 240 L 10 240 Z" fill="none" stroke="#3f3f46" strokeWidth="1.5" />
                        <path d="M 25 10 A 60 60 0 0 0 85 70 L 115 70 A 60 60 0 0 0 175 10" fill="none" stroke="#84cc16" strokeWidth="2.5" strokeLinecap="round" opacity="0.3" />
                        <path d="M 10 60 A 90 90 0 0 0 85 100 L 115 100 A 90 90 0 0 0 190 60" fill="none" stroke="#84cc16" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.2" />
                        <circle cx="100" cy="80" r="2" fill="#84cc16" opacity="0.3" />
                      </g>
                      {filteredPoints.map((p, idx) => {
                        const rawFPos = p.fieldPos || p.details?.fieldPos || p.metadata?.fieldPos || p.wurfposition;
                        const rawGPos = p.goalPos || p.details?.goalPos || p.metadata?.goalPos || p.wurfbild;
                        
                        const fPos = getCoordFromZone(rawFPos, 'field');
                        const gPos = getCoordFromZone(rawGPos, 'goal');
                        
                        if (!fPos || !gPos || fPos.x === undefined || gPos.x === undefined) return null;
                        
                        const fx = 35 + (fPos.x / 100) * 200 * 0.65;
                        const fy = 56.5 + (fPos.y / 100) * 245 * 0.65;
                        const gx = 68 + (gPos.x / 100) * 250 * 0.25;
                        const gy = 18 + (gPos.y / 100) * 180 * 0.25;
                        return (
                          <g key={idx}>
                            <line x1={fx} y1={fy} x2={gx} y2={gy} stroke={p.action.toLowerCase().includes('tor') ? '#84cc16' : (p.action.toLowerCase().includes('gehalten') || p.action.toLowerCase().includes('save')) ? '#eab308' : '#71717a'} strokeOpacity="0.5" strokeWidth="0.8" />
                            {renderShotMarker(fx, fy, p.action, `f-kombi-${idx}`, true)}
                            {renderShotMarker(gx, gy, p.action, `g-kombi-${idx}`, true)}
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
        <div className="absolute bottom-8 left-12 flex items-center gap-4 bg-black/40 backdrop-blur-md px-6 py-2.5 rounded-2xl border border-white/5 shadow-2xl">
          <div className="relative flex items-center justify-center"><div className="absolute w-2.5 h-2.5 bg-brand rounded-full animate-ping opacity-30" /><div className="w-1.5 h-1.5 bg-brand rounded-full shadow-[0_0_10px_#84cc16]" /></div>
          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest italic">{filteredPoints.length} Tactical Archive Points</span>
        </div>
      </motion.div>
    </div>
  );
};

export default GameStatsHeatmap;
