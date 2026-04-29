import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Circle, Triangle, Square, Info, Play } from 'lucide-react';
import Card from '../../../ui/Card';
import { formatiereZeit } from '../../../../utils/timeUtils';

const TacticalTimeline = ({
  virtualGameTime,
  currentTime,
  duration,
  sortedLog,
  getAbsTime,
  seekToEntry,
  getEstimatedVideoTime,
  isCinemaMode,
  isFocusMode,
  onTimelineClick
}) => {
  
  const getMarkerInfo = (entry) => {
    const action = (entry.action || '').toLowerCase();
    const isGegner = !!entry.gegnerNummer;
    
    if (action.includes('tor')) return { icon: Circle, color: '#84cc16', type: 'goal', isGegner };
    if (action.includes('fehlwurf') || action.includes('pfosten') || action.includes('latte') || action.includes('gehalten')) return { icon: Circle, color: '#ef4444', type: 'miss', isGegner };
    if (action.includes('minuten')) return { icon: Triangle, color: '#eab308', type: 'penalty', isGegner };
    if (action.includes('gelb') || action.includes('rot') || action.includes('karte') || action.includes('verwarnung')) return { icon: Square, color: '#f97316', type: 'card', isGegner };
    if (action.includes('timeout')) return { icon: Play, color: '#3b82f6', type: 'timeout', isGegner };
    
    return { icon: Info, color: '#94a3b8', type: 'other', isGegner };
  };

  return (
    <div className="relative w-full">
      <div className={`absolute left-2 right-2 flex justify-between items-center z-50 pointer-events-none transition-all ${isFocusMode ? '-top-6' : '-top-1'}`}>
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex items-center gap-2 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/5 shadow-lg"
        >
          <span className="text-[7px] font-black uppercase tracking-widest text-brand">Match</span>
          <span className="text-[11px] font-black text-zinc-100 tabular-nums italic">{formatiereZeit(virtualGameTime)}</span>
        </motion.div>
        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex items-center gap-2 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/5 shadow-lg"
        >
          <div className="w-1 h-1 rounded-full bg-brand animate-pulse" />
          <span className="text-[10px] font-mono text-zinc-300 tracking-tighter tabular-nums">
            {formatiereZeit(currentTime)} <span className="text-zinc-700">/</span> {formatiereZeit(duration)}
          </span>
        </motion.div>
      </div>

      <div 
        className={`relative bg-zinc-950/80 rounded-2xl border border-white/5 cursor-crosshair group transition-all ${isFocusMode ? 'h-4 mt-2' : (isCinemaMode ? 'h-20 mt-3' : 'h-12 mt-3')}`}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const pct = (e.clientX - rect.left) / rect.width;
          onTimelineClick(pct);
        }}
      >
        {/* Background Gradients for Halves */}
        <div className="absolute inset-0 flex">
          <div className="w-1/2 h-full bg-white/[0.01] border-r border-white/5" />
          <div className="w-1/2 h-full bg-white/[0.02]" />
        </div>

        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/5" />
        
        {/* Progress Bar with Glow */}
        <motion.div 
          className="absolute top-1/2 left-0 h-[2px] bg-brand z-20" 
          animate={{ width: `${(virtualGameTime / 3600) * 100}%` }}
          transition={{ type: "spring", bounce: 0, duration: 0.5 }}
          style={{ transform: 'translateY(-50%)' }}
        />
        
        {/* Playhead */}
        <motion.div 
          className="absolute top-0 bottom-0 w-[1px] bg-white/50 z-40 pointer-events-none"
          animate={{ left: `${(virtualGameTime / 3600) * 100}%` }}
          transition={{ type: "spring", bounce: 0, duration: 0.5 }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_white]" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_white]" />
        </motion.div>

        {sortedLog.map((entry, idx) => {
          const gameSecs = getAbsTime(entry);
          const pct = (gameSecs / 3600) * 100;
          if (pct < 0 || pct > 100) return null;
          const marker = getMarkerInfo(entry);
          const Icon = marker.icon;
          const isGoal = marker.type === 'goal';

          return (
            <motion.div 
              key={idx}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: idx * 0.005, type: "spring", stiffness: 300 }}
              className="absolute transition-all z-20 group/marker"
              style={{ left: `${pct}%`, top: '50%', transform: 'translateX(-50%)' }}
              onClick={(e) => { e.stopPropagation(); seekToEntry(entry); }}
            >
              {/* Marker Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover/marker:opacity-100 group-hover/marker:-translate-y-1 transition-all duration-300 pointer-events-none z-[999]">
                <Card className="px-4 py-2 rounded-[14px] shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col items-center gap-1 min-w-[120px] border-white/20 bg-zinc-900/95 backdrop-blur-md">
                  <span className="text-[7px] font-black text-brand uppercase tracking-widest">{entry.time}</span>
                  <span className="text-[10px] font-black text-zinc-100 uppercase whitespace-nowrap">{entry.action}</span>
                  {entry.playerName && <span className="text-[8px] text-zinc-500 font-bold uppercase truncate max-w-[120px]">{entry.playerName}</span>}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-zinc-900" />
                </Card>
              </div>

              <motion.div 
                whileHover={{ scale: 1.4, zIndex: 50 }}
                className={`relative flex flex-col items-center ${marker.isGegner ? 'translate-y-1.5' : '-translate-y-2.5'}`}
              >
                <div 
                  className={`p-1 rounded-lg transition-all shadow-lg active:scale-95`}
                  style={{ 
                    backgroundColor: `${marker.color}20`, 
                    border: `1px solid ${marker.color}40`, 
                    color: marker.color
                  }}
                >
                  <Icon size={isCinemaMode ? 12 : 10} fill={isGoal ? 'currentColor' : 'none'} strokeWidth={3} />
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default TacticalTimeline;
