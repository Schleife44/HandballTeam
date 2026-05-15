import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { TrendingUp, Target, Activity } from 'lucide-react';
import Card from '../../ui/Card';

const CustomTooltip = ({ active, payload, label, teamColor }) => {
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

const ProfileCharts = ({ timeline, teamColor, selectedSeason }) => {
  const isEmptySeason = timeline.length === 0;

  const chartData = timeline.map(g => ({
    name: new Date(g.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
    goals: g.goals,
    shots: g.shots,
    efficiency: g.efficiency
  }));

  if (isEmptySeason) {
    return (
      <div className="lg:col-span-2 py-32 bg-zinc-900/20 border border-zinc-800/50 rounded-[2.5rem] flex flex-col items-center justify-center text-zinc-600 gap-4">
        <Activity size={48} className="opacity-20" />
        <p className="text-xs font-bold uppercase tracking-widest">Keine Spiele in Saison {selectedSeason} gefunden</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* GOALS TIMELINE */}
      <Card className="p-8">
        <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-8 flex items-center gap-3">
          <TrendingUp size={14} className="text-brand" /> Tor-Historie (Letzte 10 Spiele)
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
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
              <Tooltip content={<CustomTooltip teamColor={teamColor} />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
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
            <BarChart data={chartData}>
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
              <Tooltip content={<CustomTooltip teamColor={teamColor} />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
              <Bar dataKey="efficiency" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, index) => (
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
    </div>
  );
};

export default ProfileCharts;
