import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const PerformanceChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[220px] flex items-center justify-center bg-zinc-900/20 rounded-3xl border border-zinc-800/40 border-dashed">
        <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest italic">Keine Spieldaten für Analyse verfügbar</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorGoals" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#84cc16" stopOpacity={0.2}/>
            <stop offset="95%" stopColor="#84cc16" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
        <XAxis dataKey="name" stroke="#3f3f46" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} dy={5} />
        <YAxis stroke="#3f3f46" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
        <Tooltip 
          contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '1.5rem', fontSize: '10px', fontWeight: 'bold', padding: '12px' }}
          itemStyle={{ color: '#84cc16' }}
        />
        <Area type="monotone" dataKey="goals" stroke="#84cc16" strokeWidth={5} fillOpacity={1} fill="url(#colorGoals)" />
        <Area type="monotone" dataKey="conceded" stroke="#ef4444" strokeWidth={2} fill="transparent" strokeDasharray="6 6" />
      </AreaChart>
    </ResponsiveContainer>
      </div>
    );
  };

export default PerformanceChart;
