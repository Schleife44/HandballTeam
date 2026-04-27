import React from 'react';
import { Target, Layers, Check } from 'lucide-react';

const AnalysisModeSection = ({ isZoneMode, onUpdate }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <button 
      onClick={() => onUpdate('isZoneMode', false)}
      className={`p-6 rounded-[2rem] border transition-all text-left group
        ${!isZoneMode ? 'bg-brand/10 border-brand' : 'bg-black/20 border-zinc-800 hover:border-zinc-700'}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl ${!isZoneMode ? 'bg-brand text-black' : 'bg-zinc-800 text-zinc-500'}`}>
          <Target size={24} />
        </div>
        {!isZoneMode && <Check size={20} className="text-brand" />}
      </div>
      <h4 className={`text-sm font-black uppercase italic mb-1 ${!isZoneMode ? 'text-zinc-100' : 'text-zinc-500'}`}>Präzisions-Modus</h4>
      <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest leading-relaxed">Erfasse exakte Koordinaten für Feld und Tor. Maximale Analysetiefe.</p>
    </button>

    <button 
      onClick={() => onUpdate('isZoneMode', true)}
      className={`p-6 rounded-[2rem] border transition-all text-left group
        ${isZoneMode ? 'bg-blue-500/10 border-blue-500' : 'bg-black/20 border-zinc-800 hover:border-zinc-700'}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl ${isZoneMode ? 'bg-blue-500 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
          <Layers size={24} />
        </div>
        {isZoneMode && <Check size={20} className="text-blue-500" />}
      </div>
      <h4 className={`text-sm font-black uppercase italic mb-1 ${isZoneMode ? 'text-zinc-100' : 'text-zinc-500'}`}>Zonen-Modus</h4>
      <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest leading-relaxed">Schnelle Erfassung über 9 Tor-Zonen und taktische Feld-Areale.</p>
    </button>
  </div>
);

export default AnalysisModeSection;
