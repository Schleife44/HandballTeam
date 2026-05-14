import React from 'react';
import { TrendingUp } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import Card from '../../ui/Card';

const GameStatsTorverlauf = ({ progressionData }) => {
  return (
    <Card noPadding className="p-10 shadow-2xl animate-in fade-in duration-700 h-[600px] flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand/10 rounded-2xl text-brand">
            <TrendingUp size={24} />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-100">Torverlauf</h3>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Spielverlauf & Momentum Analyse</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
           <div className="flex items-center gap-2">
             <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
             <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Heim</span>
           </div>
           <div className="flex items-center gap-2">
             <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
             <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Gast</span>
           </div>
        </div>
      </div>

      <div className="flex-1 w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={progressionData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorHeim" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorGegner" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis 
              dataKey="time" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }}
              interval={Math.floor(progressionData.length / 8)}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }}
              allowDecimals={false}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <Card className="p-4 bg-zinc-950/90 backdrop-blur-xl border border-zinc-800 shadow-2xl space-y-2">
                      <p className="text-[10px] font-black text-brand uppercase tracking-widest">{d.time} Min.</p>
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-black text-white italic">{d.heim} : {d.gegner}</span>
                      </div>
                      {d.player && (
                        <div className="pt-2 border-t border-zinc-900">
                           <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{d.isGegner ? 'Gast' : 'Heim'}</p>
                           <p className="text-xs font-bold text-zinc-100">{d.player}</p>
                        </div>
                      )}
                    </Card>
                  );
                }
                return null;
              }}
            />
            <Area 
              type="monotone" 
              dataKey="heim" 
              stroke="#3b82f6" 
              strokeWidth={4}
              fillOpacity={1} 
              fill="url(#colorHeim)" 
              animationDuration={1500}
            />
            <Area 
              type="monotone" 
              dataKey="gegner" 
              stroke="#ef4444" 
              strokeWidth={4}
              fillOpacity={1} 
              fill="url(#colorGegner)" 
              animationDuration={1500}
            />
            <ReferenceLine x="30:00" stroke="#52525b" strokeDasharray="3 3" label={{ position: 'top', value: 'HZ', fill: '#52525b', fontSize: 10, fontWeight: 800 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-8 flex items-center justify-center gap-8">
        <div className="flex flex-col items-center">
          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Max. Führung Heim</p>
          <p className="text-lg font-black text-blue-400 italic">+{Math.max(0, ...progressionData.map(d => d.heim - d.gegner))}</p>
        </div>
        <div className="w-[1px] h-8 bg-zinc-800" />
        <div className="flex flex-col items-center">
          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Max. Führung Gast</p>
          <p className="text-lg font-black text-red-400 italic">+{Math.max(0, ...progressionData.map(d => d.gegner - d.heim))}</p>
        </div>
      </div>
    </Card>
  );
};

export default GameStatsTorverlauf;
