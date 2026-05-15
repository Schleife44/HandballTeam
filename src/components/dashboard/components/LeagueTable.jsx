import React from 'react';
import { List } from 'lucide-react';

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

const LeagueTable = ({ leagueTable, loading }) => {
  return (
    <section className="space-y-5">
      <SectionHeader title="Ligatabelle" icon={List} badge="Live Pro-Sync" />
      <div className="bg-zinc-950/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
        <table className="w-full text-left relative z-10">
          <thead>
            <tr className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] bg-white/5">
              <th className="py-6 px-8 italic">Rank</th>
              <th className="py-6 px-2 italic">Squad</th>
              <th className="py-6 px-2 text-center italic hidden sm:table-cell">Games</th>
              <th className="py-6 px-8 text-right italic">Points</th>
            </tr>
          </thead>
          <tbody className="text-xs font-bold divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan="4" className="py-24 text-center">
                  <div className="w-10 h-10 border-4 border-brand/20 border-t-brand rounded-full animate-spin mx-auto" />
                </td>
              </tr>
            ) : Array.isArray(leagueTable) && leagueTable.length > 0 ? (
              leagueTable.map((t, i) => (
                <tr 
                  key={i} 
                  className={`group transition-all hover:bg-white/[0.03] ${t.isMyTeam ? 'bg-brand/10' : ''}`}
                >
                  <td className="py-5 px-8">
                    <span className={`text-base font-black italic tabular-nums ${t.isMyTeam ? 'text-brand' : 'text-zinc-600 group-hover:text-zinc-400'}`}>
                      {t.rank || i + 1}
                    </span>
                  </td>
                  <td className="py-5 px-2">
                    <div className="flex flex-col">
                      <span className={`text-sm font-black uppercase italic tracking-tight ${t.isMyTeam ? 'text-white' : 'text-zinc-300 group-hover:text-white transition-colors'}`}>
                        {t.team}
                      </span>
                    </div>
                  </td>
                  <td className="py-5 px-2 text-center tabular-nums opacity-40 font-black hidden sm:table-cell">
                    {t.games}
                  </td>
                  <td className="py-5 px-8 text-right">
                    <div className="flex flex-col items-end">
                      <span className={`text-lg font-black tabular-nums italic ${t.isMyTeam ? 'text-brand shadow-brand' : 'text-zinc-400 group-hover:text-white'}`}>
                        {t.points}
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="py-16 text-center uppercase tracking-widest text-[10px] font-black opacity-30 italic">
                  No Database Sync
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default LeagueTable;
