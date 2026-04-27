import React from 'react';
import { X, TrendingUp, Target, Activity, Calendar, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { usePlayerStats } from '../../../hooks/usePlayerStats';

const PlayerStatsModal = ({ player, onClose, teamColor }) => {
  const stats = usePlayerStats(player.name);

  if (!stats) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] flex items-center justify-center p-6" onClick={onClose}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-zinc-900 border border-zinc-800 p-12 rounded-[2.5rem] text-center max-w-md"
          onClick={e => e.stopPropagation()}
        >
          <div className="w-20 h-20 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Activity size={32} className="text-zinc-600" />
          </div>
          <h3 className="text-xl font-black text-white uppercase italic mb-2">Keine Daten verfügbar</h3>
          <p className="text-zinc-500 text-xs font-bold uppercase leading-relaxed">
            Für {player.name} wurden noch keine Spiele in der Historie aufgezeichnet.
          </p>
          <button 
            onClick={onClose}
            className="mt-8 px-8 py-4 bg-zinc-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-700 transition-all"
          >
            Schließen
          </button>
        </motion.div>
      </div>
    );
  }

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

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[110] flex items-center justify-center p-4 md:p-10" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-zinc-950 border border-white/5 w-full max-w-5xl h-full max-h-[850px] rounded-[3rem] overflow-hidden flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-zinc-900/30">
          <div className="flex items-center gap-6">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black italic shadow-lg"
              style={{ backgroundColor: `${teamColor}20`, color: teamColor, border: `1px solid ${teamColor}40` }}
            >
              {player.number}
            </div>
            <div>
              <h2 className="text-3xl font-black text-white uppercase italic leading-none">{player.name}</h2>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] mt-2">Spieler-Performance-Analyse</p>
            </div>
          </div>
          <button onClick={onClose} className="p-4 hover:bg-zinc-800 rounded-2xl transition-all text-zinc-400"><X size={24} /></button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
          
          {/* TOP STATS GRID */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Spiele', value: stats.summary.totalGames, icon: Calendar, color: 'text-blue-400' },
              { label: 'Tore Gesamt', value: stats.summary.totalGoals, icon: Trophy, color: 'text-brand' },
              { label: 'Ø Tore', value: stats.summary.avgGoals, icon: TrendingUp, color: 'text-emerald-400' },
              { label: 'Ø Quote', value: `${stats.summary.avgEfficiency}%`, icon: Target, color: 'text-orange-400' }
            ].map((s, i) => (
              <div key={i} className="bg-zinc-900/50 border border-white/5 p-6 rounded-3xl group hover:border-white/10 transition-all">
                <s.icon size={16} className={`${s.color} mb-3`} />
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{s.label}</p>
                <p className="text-2xl font-black text-white mt-1">{s.value}</p>
              </div>
            ))}
          </div>

          {/* CHARTS SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* GOALS TIMELINE */}
            <div className="bg-zinc-900/30 border border-white/5 rounded-[2.5rem] p-8">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-8 flex items-center gap-3">
                <TrendingUp size={14} className="text-brand" /> Tor-Historie (Letzte 10 Spiele)
              </h3>
              <div className="h-[250px] w-full">
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
            </div>

            {/* EFFICIENCY CHART */}
            <div className="bg-zinc-900/30 border border-white/5 rounded-[2.5rem] p-8">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-8 flex items-center gap-3">
                <Target size={14} className="text-orange-400" /> Wurf-Effizienz (%)
              </h3>
              <div className="h-[250px] w-full">
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
            </div>
          </div>
        </div>


        <div className="p-8 border-t border-white/5 bg-zinc-900/20">
          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest text-center">
            Die Daten basieren auf allen archivierten Spielen dieser Saison.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default PlayerStatsModal;
