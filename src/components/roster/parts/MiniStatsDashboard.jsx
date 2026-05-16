import React from 'react';
import { Shield, Target, Zap } from 'lucide-react';

const MiniStatsDashboard = ({ stats, efficiency }) => (
  <div className="grid grid-cols-3 gap-3">
    <div className="bg-white/5 rounded-2xl p-2.5 flex flex-col items-center justify-center border border-white/5">
      <Shield size={12} className="text-zinc-600 mb-1.5" />
      <span className="text-[10px] font-black text-white">{stats.tore || 0}</span>
      <span className="text-[7px] font-bold text-zinc-500 uppercase tracking-widest">Tore</span>
    </div>
    <div className="bg-white/5 rounded-2xl p-2.5 flex flex-col items-center justify-center border border-white/5">
      <Target size={12} className="text-brand mb-1.5" />
      <span className="text-[10px] font-black text-white">{efficiency}%</span>
      <span className="text-[7px] font-bold text-zinc-500 uppercase tracking-widest">Quote</span>
    </div>
    <div className="bg-brand/10 rounded-2xl p-2.5 flex flex-col items-center justify-center border border-brand/20">
      <Zap size={12} className="text-brand mb-1.5" />
      <span className="text-[10px] font-black text-brand">{stats.games || 0}</span>
      <span className="text-[7px] font-bold text-brand/60 uppercase tracking-widest">Spiele</span>
    </div>
  </div>
);

export default MiniStatsDashboard;
