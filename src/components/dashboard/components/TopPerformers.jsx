import React from 'react';
import { Sparkles } from 'lucide-react';

const SectionHeader = ({ title, icon: Icon, badge }) => (
  <div className="flex items-center justify-between mb-4 px-2">
    <div className="flex items-center gap-3">
      <div className="w-1 h-6 bg-brand rounded-full shadow-[0_0_10px_rgba(132,204,22,0.5)]" />
      <h3 className="text-xs font-black uppercase italic tracking-widest text-zinc-400 flex items-center gap-2">
        {Icon && <Icon size={14} className="text-brand/60" />}
        {title}
      </h3>
    </div>
    {badge && <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest italic">{badge}</span>}
  </div>
);

const TopPerformers = ({ performers }) => {
  return (
    <section className="space-y-4">
      <SectionHeader title="Top Torschützen" icon={Sparkles} />
      <div className="grid grid-cols-1 gap-3">
        {Array.isArray(performers) && performers.length > 0 ? (
          performers.slice(0, 5).map((p, idx) => (
            <div 
              key={p.id || idx} 
              className="flex items-center justify-between p-4 rounded-2xl bg-zinc-950/40 border border-white/5 hover:border-brand/30 transition-all group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-brand/0 to-brand/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-8 h-8 rounded-xl bg-zinc-900 flex items-center justify-center text-[10px] font-black text-zinc-600 group-hover:bg-brand group-hover:text-black transition-all">
                  {idx + 1}
                </div>
                <p className="text-xs font-black text-white uppercase italic truncate max-w-[120px]">
                  {p.name || 'Spieler'}
                </p>
              </div>
              <span className="text-xl font-black text-brand tabular-nums italic relative z-10">
                {p.goals || 0}
              </span>
            </div>
          ))
        ) : (
          <p className="p-8 text-[9px] font-black text-zinc-700 uppercase text-center border border-dashed border-zinc-900 rounded-2xl">
            Keine Daten
          </p>
        )}
      </div>
    </section>
  );
};

export default TopPerformers;
