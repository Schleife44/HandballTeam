import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart2, Target, TrendingUp, Users, Calendar, 
  ChevronRight, ArrowLeft, Filter, Download
} from 'lucide-react';

// Store
import useStore from '../../store/useStore';

// UI
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Card from '../ui/Card';

const AnalyticsDashboard = () => {
  const { history, squad } = useStore();
  const [selectedMatch, setSelectedMatch] = useState(null);

  const calculateStats = (log) => {
    const shots = (log || []).filter(l => ['GOAL', 'MISS', 'SAVE', 'BLOCKED'].includes(l.type));
    const goals = shots.filter(s => s.type === 'GOAL');
    
    const zoneStats = {};
    const goalZoneStats = {};
    const playerStats = {};

    shots.forEach(shot => {
      const fieldZone = shot.details?.fieldPos;
      const goalZone = shot.details?.goalPos;
      const isGoal = shot.type === 'GOAL';

      if (fieldZone) {
        if (!zoneStats[fieldZone]) zoneStats[fieldZone] = { total: 0, goals: 0 };
        zoneStats[fieldZone].total++;
        if (isGoal) zoneStats[fieldZone].goals++;
      }

      if (goalZone) {
        if (!goalZoneStats[goalZone]) goalZoneStats[goalZone] = { total: 0, goals: 0 };
        goalZoneStats[goalZone].total++;
        if (isGoal) goalZoneStats[goalZone].goals++;
      }

      const pKey = shot.playerNumber;
      if (!playerStats[pKey]) playerStats[pKey] = { name: shot.playerName, total: 0, goals: 0 };
      playerStats[pKey].total++;
      if (isGoal) playerStats[pKey].goals++;
    });

    return { totalShots: shots.length, totalGoals: goals.length, zoneStats, goalZoneStats, playerStats };
  };

  const processedMatches = (history || []).map(match => ({
    ...match,
    id: match.id || Date.now() + Math.random(),
    dateStr: match.timestamp ? new Date(match.timestamp).toLocaleDateString() : 'Unbekannt',
    opponent: match.opponent || (match.settings?.awayName || 'Gegner'),
    stats: calculateStats(match.log)
  }));

  if (selectedMatch) {
    return <MatchAnalysis match={selectedMatch} onBack={() => setSelectedMatch(null)} />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black uppercase italic tracking-tighter text-zinc-100">Spiel-Analyse</h2>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">Auswertung deiner taktischen Daten</p>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" size="icon" icon={Filter} />
          <Button variant="ghost" size="icon" icon={Download} />
        </div>
      </header>

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
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">{processedMatches.length} Spiele gefunden</span>
        </div>

        <div className="space-y-3">
          {processedMatches.map(match => (
            <button 
              key={match.id}
              onClick={() => setSelectedMatch(match)}
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
          
          {processedMatches.length === 0 && (
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

const MatchAnalysis = ({ match, onBack }) => {
  const [tab, setTab] = useState('heatmap');
  
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
      <header className="flex items-center gap-6">
        <Button variant="ghost" size="icon" icon={ArrowLeft} onClick={onBack} />
        <div>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-zinc-100">vs. {match.opponent}</h2>
          <p className="text-[10px] font-black text-brand uppercase tracking-widest mt-1">Spiel-Analyse vom {match.dateStr}</p>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="flex p-1 bg-zinc-900/50 border border-zinc-800 rounded-2xl w-fit">
        {['heatmap', 'players', 'timeline'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
              ${tab === t ? 'bg-brand text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            {t === 'heatmap' ? 'Heatmap' : t === 'players' ? 'Spieler' : 'Verlauf'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'heatmap' && <HeatmapView key="heatmap" stats={match.stats} />}
        {tab === 'players' && <PlayerStatsView key="players" stats={match.stats.playerStats} />}
      </AnimatePresence>
    </div>
  );
};

const HeatmapView = ({ stats }) => {
  const fieldZones = [
    { id: 'KM', label: 'KM', d: "M 80 70 L 120 70 L 125 100 L 75 100 Z" },
    { id: 'RL', label: 'RL', d: "M 40 48 A 60 60 0 0 0 80 70 L 75 100 A 90 90 0 0 1 16 68 Z" },
    { id: 'AL', label: 'AL', d: "M 25 10 A 60 60 0 0 0 40 48 L 16 68 A 90 90 0 0 1 10 60 L 10 10 Z" },
    { id: 'RR', label: 'RR', d: "M 120 70 A 60 60 0 0 0 160 48 L 184 68 A 90 90 0 0 1 125 100 Z" },
    { id: 'AR', label: 'AR', d: "M 160 48 A 60 60 0 0 0 175 10 L 190 10 L 190 60 A 90 90 0 0 1 184 68 Z" },
    { id: 'RM_B', label: 'RM', d: "M 75 100 L 125 100 L 138 175 L 62 175 Z" },
    { id: 'RL_B', label: 'RL', d: "M 10 60 A 90 90 0 0 0 75 100 L 62 175 L 10 175 Z" },
    { id: 'RR_B', label: 'RR', d: "M 125 100 A 90 90 0 0 0 190 60 L 190 175 L 138 175 Z" },
    { id: 'Fern', label: 'FERN', d: "M 10 175 L 190 175 L 190 280 L 10 280 Z" }
  ];

  const goalZones = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {/* Field Heatmap */}
      <Card className="p-8">
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-6">Wurffrequenz Feld</h4>
        <div className="relative aspect-[3/4] bg-zinc-950 rounded-3xl overflow-hidden p-4 border border-zinc-800">
          <svg className="w-full h-full" viewBox="0 0 200 245">
            {fieldZones.map(zone => {
              const zoneData = stats.zoneStats[zone.id] || { total: 0, goals: 0 };
              const intensity = Math.min(zoneData.total * 0.2, 0.8);
              return (
                <g key={zone.id}>
                  <path 
                    d={zone.d} 
                    className="stroke-zinc-100/10 transition-all duration-500"
                    fill={zoneData.total > 0 ? `rgba(132, 204, 22, ${intensity})` : 'transparent'}
                  />
                  {zoneData.total > 0 && (
                    <text 
                      x="50%" y="50%" 
                      textAnchor="middle" 
                      className="text-[8px] font-black fill-white pointer-events-none"
                      style={{ transform: `translate(${getX(zone.id)}px, ${getY(zone.id)}px)` }}
                    >
                      {zoneData.goals}/{zoneData.total}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </Card>

      {/* Goal Heatmap */}
      <Card className="p-8">
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-6">Abschluss-Präzision Tor</h4>
        <div className="aspect-[3/2] grid grid-cols-3 grid-rows-3 gap-2 p-4 bg-zinc-950 rounded-3xl border border-zinc-800">
          {goalZones.map(zone => {
            const zoneData = stats.goalZoneStats[zone] || { total: 0, goals: 0 };
            const intensity = Math.min(zoneData.total * 0.2, 0.8);
            return (
              <div 
                key={zone}
                className="rounded-xl flex flex-col items-center justify-center transition-all duration-500 border border-zinc-800/30"
                style={{ backgroundColor: zoneData.total > 0 ? `rgba(132, 204, 22, ${intensity})` : 'transparent' }}
              >
                {zoneData.total > 0 && (
                  <>
                    <span className="text-xs font-black text-white">{zoneData.goals}/{zoneData.total}</span>
                    <span className="text-[8px] font-black text-white/50">{Math.round((zoneData.goals/zoneData.total)*100)}%</span>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

const PlayerStatsView = ({ stats }) => {
  return (
    <Card noPadding className="p-8 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="text-[10px] font-black uppercase tracking-widest text-zinc-500 border-b border-zinc-800">
            <th className="text-left pb-6 px-4">Spieler</th>
            <th className="text-center pb-6 px-4">Würfe</th>
            <th className="text-center pb-6 px-4">Tore</th>
            <th className="text-center pb-6 px-4">Effizienz</th>
            <th className="text-right pb-6 px-4">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/50">
          {Object.entries(stats).map(([number, data]) => (
            <tr key={number} className="group hover:bg-white/5 transition-colors">
              <td className="py-6 px-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center font-black text-brand border border-zinc-800">#{number}</div>
                  <span className="text-sm font-black text-zinc-100 uppercase italic">{data.name}</span>
                </div>
              </td>
              <td className="py-6 px-4 text-center font-black text-zinc-400">{data.total}</td>
              <td className="py-6 px-4 text-center font-black text-zinc-100">{data.goals}</td>
              <td className="py-6 px-4 text-center">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-sm font-black text-brand italic">{Math.round((data.goals/data.total)*100)}%</span>
                  <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-brand" style={{ width: `${(data.goals/data.total)*100}%` }} />
                  </div>
                </div>
              </td>
              <td className="py-6 px-4 text-right">
                <Badge variant={(data.goals/data.total) > 0.6 ? 'brand' : 'orange'} className="px-3 py-1 text-[8px]">
                  {(data.goals/data.total) > 0.6 ? 'Top-Form' : 'Normal'}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
};

const StatCard = ({ icon: Icon, label, value, color }) => (
  <Card className="p-6">
    <div className="flex items-center gap-4">
      <div className={`p-3 bg-zinc-950 rounded-2xl border border-zinc-800 ${color}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{label}</p>
        <p className={`text-xl font-black italic uppercase tracking-tighter mt-1 ${color}`}>{value}</p>
      </div>
    </div>
  </Card>
);

// Helper for labels in SVG
const getX = (id) => {
  const mapping = { KM: 100, RL: 55, AL: 25, RR: 145, AR: 175, RM_B: 100, RL_B: 35, RR_B: 165, Fern: 100 };
  return mapping[id] || 0;
};
const getY = (id) => {
  const mapping = { KM: 85, RL: 75, AL: 45, RR: 75, AR: 45, RM_B: 150, RL_B: 140, RR_B: 140, Fern: 220 };
  return mapping[id] || 0;
};

export default AnalyticsDashboard;
