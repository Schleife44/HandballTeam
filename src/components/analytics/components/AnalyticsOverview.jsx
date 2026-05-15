import React from 'react';
import { BarChart2, Target, TrendingUp, Users, Calendar, ChevronRight } from 'lucide-react';
import Card from '../../ui/Card';
import Badge from '../../ui/Badge';

export const StatCard = ({ icon: Icon, label, value, color }) => (
  <Card className="p-6">
    <div className="flex items-center gap-4">
      <div className={`p-3 bg-zinc-950 rounded-2xl border border-zinc-800 ${color}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{label} </p>
        <p className={`text-xl font-black italic uppercase tracking-tighter mt-1 ${color}`}>{value}</p>
      </div>
    </div>
  </Card>
);

const AnalyticsOverview = ({ matches, onSelectMatch }) => {
  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard icon={Target} label="Wurfeffizienz" value="54%" color="text-brand" />
        <StatCard icon={TrendingUp} label="Gegentore / Spiel" value="26.4" color="text-blue-400" />
        <StatCard icon={Users} label="Top Torschütze" value="#24 Meier" color="text-purple-400" />
        <StatCard icon={BarChart2} label="Ø Angriffe" value="48" color="text-orange-400" />
      </div>

      {/* Match History */}
      <Card noPadding className="p-8">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-sm font-black uppercase italic text-zinc-100 tracking-widest">Letzte Spiele</h3>
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">{matches.length} Spiele gefunden</span>
        </div>

        <div className="space-y-3">
          {matches.map(match => (
            <button 
              key={match.id}
              onClick={() => onSelectMatch(match)}
              className="w-full group bg-black/20 border border-zinc-800/50 hover:border-brand/40 rounded-3xl p-6 flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex flex-col items-center justify-center border border-zinc-800 group-hover:border-brand/20">
                  <span className="text-[10px] font-black text-zinc-500 uppercase">{match.dateStr.split('.')[1]}</span>
                  <span className="text-lg font-black text-zinc-100">{match.dateStr.split('.')[0]}</span>
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-black text-zinc-100 uppercase italic tracking-tighter">vs. {match.opponent}</span>
                    <Badge variant="brand" className="text-[8px] py-0.5">Sieg</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    <span className="flex items-center gap-1"><Calendar size={10} /> Saison 25/26</span>
                    <span className="flex items-center gap-1"><Target size={10} /> {match.stats.totalShots} Würfe</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-right">
                  <span className="block text-2xl font-black text-zinc-100 tracking-tighter italic">{match.score.home}:{match.score.away}</span>
                  <span className="text-[10px] font-black text-brand uppercase tracking-[0.2em]">Endstand</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 group-hover:bg-brand group-hover:text-black group-hover:border-brand transition-all">
                  <ChevronRight size={20} />
                </div>
              </div>
            </button>
          ))}
          
          {matches.length === 0 && (
            <div className="py-20 text-center space-y-4">
              <div className="w-20 h-20 bg-zinc-900 rounded-[2rem] flex items-center justify-center mx-auto border border-zinc-800 opacity-50">
                <BarChart2 size={32} className="text-zinc-600" />
              </div>
              <div>
                <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">Noch keine Spiele erfasst</p>
                <p className="text-[10px] text-zinc-700 font-bold uppercase tracking-widest mt-1">Starte ein Live-Spiel um Daten zu sammeln</p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AnalyticsOverview;
