import React from 'react';
import { motion } from 'framer-motion';
import { FIELD_ZONES, getZoneFromCoords } from './shotLogic';

const FieldMap = ({ value, isZoneMode, isSevenMeter, onSelect, className = "" }) => {
  const handleFieldClick = (e) => {
    if (isZoneMode || isSevenMeter) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const zoneId = getZoneFromCoords(x, y, 'field');
    onSelect({ x, y, zoneId });
  };

  const handleZoneClick = (e, zoneId) => {
    if (!isZoneMode) return;
    e.stopPropagation(); 
    onSelect({ zoneId });
  };

  return (
    <div 
      className={`relative aspect-[3/4] bg-zinc-950 border border-zinc-800 rounded-xl lg:rounded-3xl overflow-hidden shadow-inner ${className}`}
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
          <path d="M 10 60 A 90 90 0 0 0 85 100 L 115 100 A 90 90 0 0 0 190 60" fill="none" stroke="#84cc16" strokeWidth="1" strokeDasharray="4,4" opacity="0.6" strokeLinecap="round" />
          <line x1="96" y1="50" x2="104" y2="50" stroke="#84cc16" strokeWidth="1" opacity="0.6" />
          <line x1="94" y1="82" x2="106" y2="82" stroke="#84cc16" strokeWidth="2" />
        </g>
        <g pointerEvents={isZoneMode ? 'auto' : 'none'}>
          {FIELD_ZONES.map(zone => (
            <path 
              key={zone.id} 
              d={zone.d} 
              onClick={(e) => handleZoneClick(e, zone.id)}
              className={`transition-all duration-300 ${isZoneMode ? 'cursor-pointer' : ''}
                ${isZoneMode && value === zone.id ? 'fill-brand/40 stroke-brand stroke-2' : 
                  isZoneMode ? 'fill-zinc-100/5 stroke-zinc-100/10 hover:fill-zinc-100/20' : 
                  'fill-transparent stroke-zinc-100/5 stroke-[0.5]'}`}
            />
          ))}
        </g>
      </svg>
      
      {!isZoneMode && value && typeof value === 'object' && (
        <motion.div className="absolute w-5 h-5 lg:w-8 lg:h-8 -ml-2.5 -mt-2.5 lg:-ml-4 lg:-mt-4 border-2 border-brand rounded-full shadow-[0_0_15px_rgba(132,204,22,0.8)] flex items-center justify-center bg-brand/20 pointer-events-none"
          animate={{ left: `${value.x}%`, top: `${value.y}%` }}
        >
          <div className="w-1 h-1 bg-brand rounded-full" />
        </motion.div>
      )}
    </div>
  );
};

export default FieldMap;
