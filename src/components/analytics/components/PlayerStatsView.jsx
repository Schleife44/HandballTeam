import React from 'react';
import Card from '../../ui/Card';
import Badge from '../../ui/Badge';

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

export default PlayerStatsView;
