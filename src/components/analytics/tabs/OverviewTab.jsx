import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Target, 
  ShieldAlert, 
  TrendingUp,
  BarChart2
} from 'lucide-react';

const StatCard = ({ title, value, subValue, icon: Icon, colorClass = "text-zinc-100" }) => (
  <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-[2rem] space-y-4">
    <div className="flex items-center justify-between">
      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{title}</p>
      <div className={`p-2 bg-zinc-800 rounded-xl ${colorClass}`}>
        <Icon size={16} />
      </div>
    </div>
    <div className="space-y-1">
      <h3 className={`text-3xl font-black italic uppercase ${colorClass}`}>{value}</h3>
      {subValue && <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{subValue}</p>}
    </div>
  </div>
);

const OverviewTab = ({ match, squad }) => {
  const stats = useMemo(() => {
    if (!match?.log) return null;
    
    const homeShots = match.log.filter(e => e.team === 'home' && ['GOAL', 'MISS', 'BLOCKED', 'SAVE'].includes(e.type));
    const homeGoals = homeShots.filter(e => e.type === 'GOAL');
    const awayShots = match.log.filter(e => e.team === 'away' && ['GOAL', 'MISS', 'BLOCKED', 'SAVE'].includes(e.type));
    const awayGoals = awayShots.filter(e => e.type === 'GOAL');

    const efficiency = homeShots.length > 0 ? Math.round((homeGoals.length / homeShots.length) * 100) : 0;
    
    // Top Scorers
    const playerGoals = {};
    match.log.filter(e => e.type === 'GOAL' && e.team === 'home').forEach(e => {
      playerGoals[e.playerNumber] = (playerGoals[e.playerNumber] || 0) + 1;
    });
    
    const topScorers = Object.entries(playerGoals)
      .map(([num, goals]) => ({ number: num, goals }))
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 3);

    return {
      home: { shots: homeShots.length, goals: homeGoals.length, efficiency },
      away: { shots: awayShots.length, goals: awayGoals.length },
      topScorers
    };
  }, [match]);

  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* Left Column: Key Stats */}
      <div className="lg:col-span-1 space-y-8">
        <StatCard 
          title="Wurf-Effizienz" 
          value={`${stats.home.efficiency}%`} 
          subValue={`${stats.home.goals} Tore aus ${stats.home.shots} Versuchen`}
          icon={TrendingUp}
          colorClass="text-brand"
        />
        <StatCard 
          title="Gegner Quote" 
          value={`${stats.away.shots > 0 ? Math.round((stats.away.goals / stats.away.shots) * 100) : 0}%`} 
          subValue={`${stats.away.goals} Gegentore`}
          icon={ShieldAlert}
          colorClass="text-zinc-500"
        />
        
        {/* Top Scorer Widget */}
        <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-[2.5rem]">
          <div className="flex items-center gap-3 mb-8">
            <Zap className="text-brand" size={18} />
            <h3 className="text-sm font-black uppercase italic text-zinc-100">Top Scorer</h3>
          </div>
          <div className="space-y-4">
            {stats.topScorers.length > 0 ? stats.topScorers.map((ps, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-zinc-800/50">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-black text-zinc-600">#{idx + 1}</span>
                  <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center text-[10px] font-black text-zinc-100">
                    {ps.number}
                  </div>
                  <span className="text-xs font-bold text-zinc-300">
                    {squad?.home?.find(p => String(p.number) === String(ps.number))?.name || 'Spieler'}
                  </span>
                </div>
                <span className="text-sm font-black text-brand italic">{ps.goals}</span>
              </div>
            )) : (
              <p className="text-[10px] font-bold text-zinc-600 uppercase text-center py-4">Noch keine Tore</p>
            )}
          </div>
        </div>
      </div>

      {/* Middle & Right: Charts or more detailed blocks */}
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-zinc-900/40 border border-zinc-800 p-10 rounded-[2.5rem] min-h-[400px] flex flex-col items-center justify-center text-center">
          <BarChart2 className="text-zinc-800 mb-6" size={64} />
          <h3 className="text-xl font-black uppercase italic text-zinc-500">Torverlauf & Quoten</h3>
          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-2 max-w-xs">Grafische Auswertung der Trefferquote über die gesamte Spieldauer.</p>
          
          {/* Simple distribution bar */}
          <div className="w-full max-w-md mt-12 space-y-4">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
              <span className="text-brand">{match.score.home} Tore</span>
              <span className="text-zinc-500">{match.score.away} Tore</span>
            </div>
            <div className="h-4 bg-zinc-800 rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-brand shadow-[0_0_15px_rgba(132,204,22,0.4)]" 
                style={{ width: `${(match.score.home / (match.score.home + match.score.away || 1)) * 100}%` }}
              />
              <div 
                className="h-full bg-zinc-700" 
                style={{ width: `${(match.score.away / (match.score.home + match.score.away || 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default OverviewTab;
