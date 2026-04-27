import React from 'react';
import { ArrowUpRight } from 'lucide-react';

const StatCard = ({ label, value, trend, icon: Icon }) => (
  <div className="bg-zinc-900/30 backdrop-blur-md border border-zinc-800/40 rounded-2xl lg:rounded-[2rem] p-4 lg:p-6 hover:border-brand/30 transition-all group">
    <div className="flex items-center justify-between mb-4">
      <div className="w-8 h-8 lg:w-10 lg:h-10 bg-zinc-900 rounded-xl lg:rounded-2xl flex items-center justify-center text-zinc-500 group-hover:text-brand transition-colors">
        <Icon size={18} />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black ${trend > 0 ? 'bg-brand/10 text-brand' : 'bg-red-500/10 text-red-500'}`}>
          <ArrowUpRight size={10} className={trend < 0 ? 'rotate-90' : ''} />
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-1">{label}</p>
    <div className="text-2xl lg:text-3xl font-black tracking-tighter text-zinc-100 italic">{value}</div>
  </div>
);

export default StatCard;
