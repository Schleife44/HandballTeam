import React from 'react';
import { motion } from 'framer-motion';
import { Target } from 'lucide-react';
import { GOAL_ZONES, getZoneFromCoords } from './shotLogic';

const GoalMap = ({ value, action, isZoneMode, onSelect, className = "" }) => {
  const isMiss = action?.includes('MISS');
  const isSave = action?.includes('SAVE');

  const handleGoalClick = (e) => {
    if (isZoneMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const zoneId = getZoneFromCoords(x, y, 'goal');
    onSelect({ x, y, zoneId });
  };

  const handleZoneClick = (e, zoneId) => {
    if (!isZoneMode) return;
    e.stopPropagation(); 
    onSelect({ zoneId });
  };

  return (
    <div 
      className={`relative aspect-[3/2] bg-zinc-950 border-[2px] lg:border-[6px] border-zinc-100/10 rounded-lg lg:rounded-3xl overflow-hidden shadow-inner ${!isZoneMode ? 'cursor-crosshair' : ''} ${className}`}
      onClick={handleGoalClick}
    >
      {isMiss ? (
        <div className="absolute inset-0 flex items-end justify-center pointer-events-none">
          <div className="w-[60%] h-[60%] border-x-2 lg:border-x-4 border-t-2 lg:border-t-4 border-zinc-500/40 rounded-t-sm relative">
             <div className="absolute -inset-1 border-x border-t border-zinc-500/10 blur-sm" />
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-10 pointer-events-none">
          {GOAL_ZONES.map((_, i) => <div key={i} className="border border-zinc-100/30" />)}
        </div>
      )}

      {isZoneMode && !isMiss ? (
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
          {GOAL_ZONES.map(zone => (
            <button 
              key={zone} 
              onClick={(e) => handleZoneClick(e, zone)}
              className={`flex items-center justify-center transition-all border border-dashed ${value === zone ? 'bg-brand/40 border-solid border-brand z-10 shadow-[0_0_20px_rgba(132,204,22,0.5)]' : 'border-zinc-100/10 hover:bg-zinc-100/10'}`}
            />
          ))}
        </div>
      ) : (
        value && typeof value === 'object' && (
          <motion.div 
            className={`absolute w-5 h-5 lg:w-8 lg:h-8 -ml-2.5 -mt-2.5 lg:-ml-4 lg:-mt-4 border-2 rounded-full flex items-center justify-center z-20
              ${isMiss ? 'border-red-500 bg-red-500/30 shadow-[0_0_15px_rgba(239,68,68,1)]' : 
                isSave ? 'border-yellow-400 bg-yellow-400/30 shadow-[0_0_15px_rgba(250,204,21,0.8)]' :
                'border-brand bg-brand/30 shadow-[0_0_15px_rgba(132,204,22,1)]'}`}
            animate={{ left: `${value.x}%`, top: `${value.y}%` }}
          >
            <Target size={12} className={isSave ? 'text-yellow-400' : isMiss ? 'text-red-500' : 'text-brand'} />
          </motion.div>
        )
      )}
    </div>
  );
};

export default GoalMap;
