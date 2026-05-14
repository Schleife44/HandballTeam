import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, TrendingUp, Target, Activity, Calendar, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { usePlayerStats } from '../../hooks/usePlayerStats';
import useStore from '../../store/useStore';
import Card from '../ui/Card';
import Button from '../ui/Button';

const PlayerProfilePage = () => {
  const { playerName } = useParams();
  const navigate = useNavigate();
  const { squad } = useStore();
  const [selectedSeason, setSelectedSeason] = React.useState('all');
  
  const teamColor = squad?.settings?.homeColor || '#84cc16';
  const player = (squad?.home || []).find(p => p.name === playerName) || { name: playerName, number: '?' };
  const stats = usePlayerStats(playerName, selectedSeason);

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-20 h-20 bg-zinc-800/50 rounded-full flex items-center justify-center mb-6">
          <Activity size={32} className="text-zinc-600" />
        </div>
        <h3 className="text-xl font-black text-white uppercase italic mb-2">Keine Daten verfügbar</h3>
        <p className="text-zinc-500 text-xs font-bold uppercase leading-relaxed max-w-sm">
          Für {playerName} wurden noch keine Spiele in der Historie aufgezeichnet.
        </p>
        <Button 
          onClick={() => navigate('/roster')}
          className="mt-8 px-8 py-4"
        >
          Zurück zum Kader
        </Button>
      </div>
    );
  }

  const isEmptySeason = stats.summary.totalGames === 0;

  const data = stats.timeline.map(g => ({
    name: new Date(g.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
    goals: g.goals,
    shots: g.shots,
    efficiency: g.efficiency
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-zinc-900 border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-md">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 border-b border-white/5 pb-2">
            Spiel am {label}
          </p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-8">
              <span className="text-[10px] font-bold text-zinc-400 uppercase">Tore</span>
              <span className="text-sm font-black text-white">{data.goals}</span>
            </div>
            <div className="flex items-center justify-between gap-8">
              <span className="text-[10px] font-bold text-zinc-400 uppercase">Versuche</span>
              <span className="text-sm font-black text-white">{data.shots}</span>
            </div>
            <div className="flex items-center justify-between gap-8 pt-1.5 border-t border-white/5">
              <span className="text-[10px] font-bold text-zinc-400 uppercase">Quote</span>
              <span className="text-sm font-black text-brand" style={{ color: teamColor }}>{data.efficiency}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const linkedMember = (squad?.allMembers || []).find(m => m.playerName === playerName);
  const photoURL = linkedMember?.photoURL;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/roster')}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors group"
        >
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-black uppercase tracking-widest">Zurück</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div 
            className="w-20 h-20 rounded-[2rem] flex items-center justify-center text-3xl font-black italic shadow-2xl overflow-hidden"
            style={{ backgroundColor: `${teamColor}20`, color: teamColor, border: `1px solid ${teamColor}40` }}
          >
            {photoURL ? (
              <img src={photoURL} alt={playerName} className="w-full h-full object-cover" />
            ) : (
              player.number
            )}
          </div>
          <div>
            <h1 className="text-4xl font-black text-white uppercase italic leading-none">{player.name}</h1>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] mt-3">Spieler-Performance-Analyse</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-zinc-900/50 p-1.5 rounded-[1.25rem] border border-zinc-800/50 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedSeason('all')}
            className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap
              ${selectedSeason === 'all' 
                ? 'bg-zinc-800 text-white shadow-lg shadow-black/20' 
                : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Alle Saisons
          </button>
          {stats?.availableSeasons?.map(season => (
            <button
              key={season}
              onClick={() => setSelectedSeason(season)}
              className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap
                ${selectedSeason === season 
                  ? 'bg-zinc-800 text-white shadow-lg shadow-black/20' 
                  : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Saison {season}
            </button>
          ))}
        </div>
      </div>

      {/* TOP STATS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Spiele', value: stats.summary.totalGames, icon: Calendar, color: 'text-blue-400' },
          { label: 'Tore Gesamt', value: stats.summary.totalGoals, icon: Trophy, color: 'text-brand' },
          { label: 'Training', value: `${stats.summary.trainingAttended}/${stats.summary.trainingTotal}`, icon: Activity, color: 'text-indigo-400' },
          { label: 'Ø Tore', value: stats.summary.avgGoals, icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Ø Quote', value: `${stats.summary.avgEfficiency}%`, icon: Target, color: 'text-orange-400' }
        ].map((s, i) => (
          <Card key={i} className="p-6 group hover:border-white/10 transition-all">
            <s.icon size={16} className={`${s.color} mb-3`} />
            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{s.label}</p>
            <p className="text-2xl font-black text-white mt-1">{s.value}</p>
          </Card>
        ))}
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isEmptySeason ? (
          <div className="lg:col-span-2 py-32 bg-zinc-900/20 border border-zinc-800/50 rounded-[2.5rem] flex flex-col items-center justify-center text-zinc-600 gap-4">
            <Activity size={48} className="opacity-20" />
            <p className="text-xs font-bold uppercase tracking-widest">Keine Spiele in Saison {selectedSeason} gefunden</p>
          </div>
        ) : (
          <>
            {/* GOALS TIMELINE */}
            <Card className="p-8">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-8 flex items-center gap-3">
                <TrendingUp size={14} className="text-brand" /> Tor-Historie (Letzte 10 Spiele)
              </h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id="colorGoals" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={teamColor} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={teamColor} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="rgba(255,255,255,0.2)" 
                      fontSize={10} 
                      fontWeight="bold"
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.2)" 
                      fontSize={10} 
                      fontWeight="bold"
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
                    <Area 
                      type="monotone" 
                      dataKey="goals" 
                      stroke={teamColor} 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#colorGoals)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* EFFICIENCY CHART */}
            <Card className="p-8">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-8 flex items-center gap-3">
                <Target size={14} className="text-orange-400" /> Wurf-Effizienz (%)
              </h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="rgba(255,255,255,0.2)" 
                      fontSize={10} 
                      fontWeight="bold"
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.2)" 
                      fontSize={10} 
                      fontWeight="bold"
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 100]}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                    <Bar dataKey="efficiency" radius={[6, 6, 0, 0]}>
                      {data.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.efficiency > 70 ? '#34d399' : entry.efficiency > 40 ? '#fbbf24' : '#f87171'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </>
        )}
      </div>

      <div className="p-12 border-t border-zinc-800/50 mt-8">
        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest text-center">
          Die Daten basieren auf allen archivierten Spielen dieser Saison.
        </p>
      </div>
    </div>
  );
};

export default PlayerProfilePage;
