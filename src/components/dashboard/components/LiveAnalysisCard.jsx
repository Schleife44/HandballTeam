import React from 'react';
import { Play } from 'lucide-react';

const LiveAnalysisCard = ({ onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="p-[1px] bg-gradient-to-br from-brand/30 to-transparent rounded-[2.5rem] shadow-2xl overflow-hidden group cursor-pointer transition-all hover:border-brand/40"
    >
      <div className="bg-zinc-950 p-8 rounded-[2.45rem] relative overflow-hidden">
        
        {/* Premium Glow Effect */}
        <div className="absolute -left-20 -top-20 w-64 h-64 bg-brand/10 blur-[60px] pointer-events-none group-hover:bg-brand/20 transition-all duration-700" />
        
        {/* Background Play Icon */}
        <div className="absolute -right-6 -bottom-6 text-brand/5 pointer-events-none rotate-12 scale-110 group-hover:rotate-6 group-hover:scale-105 transition-all duration-700">
          <Play size={240} strokeWidth={1.5} fill="currentColor" />
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-brand shadow-[0_0_12px_rgba(132,204,22,1)]" />
            <span className="text-[10px] font-black uppercase text-brand tracking-[0.2em] italic">System Ready</span>
          </div>

          <div className="space-y-0.5">
            <h3 className="text-4xl font-black text-white uppercase italic leading-none tracking-tighter">Live</h3>
            <h3 className="text-4xl font-black text-brand uppercase italic leading-none tracking-tighter">Analyse</h3>
          </div>

          <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest leading-relaxed max-w-[200px]">
            Datenaufzeichnung in Echtzeit starten.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LiveAnalysisCard;
