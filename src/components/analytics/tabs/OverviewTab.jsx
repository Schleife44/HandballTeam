import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Target, 
  ShieldAlert, 
  TrendingUp,
  BarChart2,
  Shield
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
    const gameLog = match?.gameLog || match?.log || [];
    if (gameLog.length === 0) return null;
    
    const homeShots = gameLog.filter(e => e.team === 'home' && ['GOAL', 'MISS', 'BLOCKED', 'SAVE', '7M_GOAL', '7M_SAVE', '7M_MISS'].includes(e.type));
    const homeGoals = homeShots.filter(e => e.type === 'GOAL' || e.type === '7M_GOAL');
    const awayShots = gameLog.filter(e => e.team === 'away' && ['GOAL', 'MISS', 'BLOCKED', 'SAVE', '7M_GOAL', '7M_SAVE', '7M_MISS'].includes(e.type));
    const awayGoals = awayShots.filter(e => e.type === 'GOAL' || e.type === '7M_GOAL');

    const efficiency = homeShots.length > 0 ? Math.round((homeGoals.length / homeShots.length) * 100) : 0;
    
    // Top Scorers
    const playerGoals = {};
    gameLog.filter(e => (e.type === 'GOAL' || e.type === '7M_GOAL') && e.team === 'home').forEach(e => {
      playerGoals[e.playerNumber] = (playerGoals[e.playerNumber] || 0) + 1;
    });
    
    const topScorers = Object.entries(playerGoals)
      .map(([num, goals]) => ({ number: num, goals }))
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 3);

    // Goalkeepers
    const goalkeepers = [...(squad?.home?.filter(p => p.position === 'TW' || p.isGoalkeeper === true) || [])].sort((a,b) => parseInt(a.number || 0) - parseInt(b.number || 0));
    const isSingleGoalkeeper = goalkeepers.length === 1;
    const currentActiveGkId = match?.activeGoalkeeperId;

    let totalSaves = 0;
    let totalConceded = 0;

    const goalkeeperStats = goalkeepers.map(gk => {
      const gkSaves = gameLog.filter(e => {
        const isSave = e.type === 'SAVE' || e.type === '7M_SAVE';
        if (!isSave) return false;
        if (e.details?.goalkeeperId) return e.details.goalkeeperId === gk.id;
        return currentActiveGkId === gk.id || isSingleGoalkeeper;
      }).length;

      const gkConceded = gameLog.filter(e => {
        const isGoalAgainst = (e.type === 'GOAL' || e.type === '7M_GOAL') && (e.isOpponent === true || e.team === 'away');
        if (!isGoalAgainst) return false;
        if (e.details?.goalkeeperId) return e.details.goalkeeperId === gk.id;
        return currentActiveGkId === gk.id || isSingleGoalkeeper;
      }).length;

      const totalFaced = gkSaves + gkConceded;
      const savePercentage = totalFaced > 0 ? Math.round((gkSaves / totalFaced) * 100) : 0;

      totalSaves += gkSaves;
      totalConceded += gkConceded;

      return {
        ...gk,
        saves: gkSaves,
        conceded: gkConceded,
        totalFaced,
        savePercentage
      };
    });

    const overallFaced = totalSaves + totalConceded;
    const overallSavePercentage = overallFaced > 0 ? Math.round((totalSaves / overallFaced) * 100) : 0;

    return {
      home: { shots: homeShots.length, goals: homeGoals.length, efficiency },
      away: { shots: awayShots.length, goals: awayGoals.length },
      topScorers,
      goalkeeperStats,
      totalSaves,
      overallFaced,
      overallSavePercentage
    };
  }, [match, squad]);

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
          title="Torwart Parade-Quote" 
          value={`${stats.overallSavePercentage}%`} 
          subValue={`${stats.totalSaves} Paraden bei ${stats.overallFaced} Würfen aufs Tor`}
          icon={Shield}
          colorClass="text-brand"
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

      {/* Middle & Right: Goalkeeper detailed list & Charts */}
      <div className="lg:col-span-2 space-y-8">
        {/* Goalkeeper Stats Widget */}
        <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-[2.5rem] space-y-6">
          <div className="flex items-center gap-3">
            <Shield className="text-brand" size={20} />
            <h3 className="text-lg font-black uppercase italic text-zinc-100">Torhüter-Quoten</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.goalkeeperStats.length > 0 ? stats.goalkeeperStats.map((gk, idx) => (
              <div key={idx} className="bg-black/40 border border-zinc-800/50 p-6 rounded-3xl flex flex-col gap-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-brand/10 text-brand border border-brand/20 rounded-2xl flex items-center justify-center font-black italic shadow-inner text-sm">
                      #{gk.number}
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase italic text-zinc-100">{gk.name || 'Torwart'}</h4>
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{gk.saves} Paraden / {gk.conceded} Gegentore</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-brand italic">{gk.savePercentage}%</span>
                  </div>
                </div>
                {/* Save percentage progress bar */}
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-brand transition-all shadow-[0_0_12px_#84cc16]" 
                    style={{ width: `${gk.savePercentage}%` }}
                  />
                </div>
              </div>
            )) : (
              <p className="text-xs font-bold text-zinc-500 uppercase text-center py-4 col-span-full">Keine Torhüter im Kader hinterlegt</p>
            )}
          </div>
        </div>

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
