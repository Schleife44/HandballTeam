import React from 'react';
import { Target, TrendingUp, Users, BarChart2 } from 'lucide-react';
import Card from '../../ui/Card';

const StatSummaryCard = ({ icon: Icon, label, value, color }) => (
  <Card className="p-6">
    <div className="flex items-center gap-5">
      <div className="w-14 h-14 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-100 shadow-xl">
        <Icon size={28} className={color} />
      </div>
      <div>
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{label}</p>
        <p className="text-3xl font-black text-zinc-100 italic tracking-tighter mt-1">{value}</p>
      </div>
    </div>
  </Card>
);

const GameStatsSummary = ({ currentGame, stats, selectedTeam, handleTeamChange, totalEfficiency }) => {
  if (!currentGame) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
          <StatSummaryCard 
            label="Endstand" 
            value={`${currentGame.score?.heim ?? currentGame.score?.home ?? 0} : ${currentGame.score?.gegner ?? currentGame.score?.away ?? 0}`} 
            icon={Target} 
            color="text-brand" 
          />
          <StatSummaryCard label="Team Effizienz" value={`${totalEfficiency}%`} icon={TrendingUp} color="text-brand" />
          <StatSummaryCard label="Torschützen" value={stats.filter(p => p.tore > 0).length} icon={Users} color="text-brand" />
        </div>
        
        <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 ml-6">
          <button 
            onClick={() => handleTeamChange('home')} 
            className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-tighter transition-all ${selectedTeam === 'home' ? 'bg-brand text-black shadow-[0_0_20px_rgba(132,204,22,0.3)]' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            Heim
          </button>
          <button 
            onClick={() => handleTeamChange('away')} 
            className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-tighter transition-all ${selectedTeam === 'away' ? 'bg-brand text-black shadow-[0_0_20px_rgba(132,204,22,0.3)]' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            Gegner
          </button>
        </div>
      </div>

      <Card noPadding title="Spielerstatistik" icon={BarChart2} className="shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950/50 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                <th className="px-6 py-4 text-left">Spieler</th>
                <th className="px-6 py-4 text-center text-brand">Tore</th>
                <th className="px-6 py-4 text-center text-orange-400">7m</th>
                <th className="px-6 py-4 text-center w-16">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-6 h-6 rounded-full border-2 border-zinc-500 flex items-center justify-center relative">
                      <span className="text-[10px] text-zinc-500">2</span>
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-zinc-500 rounded-full" />
                    </div>
                  </div>
                </th>
                <th className="px-6 py-4 text-center w-24">
                  <div className="flex items-center justify-center -space-x-2">
                    <div className="w-3 h-4 bg-yellow-500 rounded-sm border border-black/20 rotate-[-10deg]" />
                    <div className="w-3 h-4 bg-red-500 rounded-sm border border-black/20 rotate-[5deg] z-10" />
                    <div className="w-3 h-4 bg-blue-500 rounded-sm border border-black/20 rotate-[15deg]" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {stats.map((p, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400 overflow-hidden px-1">
                        <span className="truncate">#{p.number}</span>
                      </div>
                      <span className="text-sm font-bold text-zinc-100">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-sm font-black text-brand">{p.tore}</td>
                  <td className="px-6 py-4 text-center text-sm font-bold text-orange-400/80">{p.siebenMeterTore}/{p.siebenMeterVersuche}</td>
                  <td className="px-6 py-4 text-center">
                    {p.zweiMinuten > 0 && (
                      <span className="text-sm font-black text-zinc-100 italic">{p.zweiMinuten}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {p.gelb > 0 && <div className="w-3 h-4 bg-yellow-500 rounded-sm shadow-[0_0_10px_rgba(234,179,8,0.3)]" title="Gelbe Karte" />}
                      {p.rot > 0 && <div className="w-3 h-4 bg-red-500 rounded-sm shadow-[0_0_10px_rgba(239,68,68,0.3)]" title="Rote Karte" />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default GameStatsSummary;
