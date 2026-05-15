import React from 'react';
import Card from '../../ui/Card';

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

// Helper for labels in SVG
const getX = (id) => {
  const mapping = { KM: 100, RL: 55, AL: 25, RR: 145, AR: 175, RM_B: 100, RL_B: 35, RR_B: 165, Fern: 100 };
  return mapping[id] || 0;
};
const getY = (id) => {
  const mapping = { KM: 85, RL: 75, AL: 45, RR: 75, AR: 45, RM_B: 150, RL_B: 140, RR_B: 140, Fern: 220 };
  return mapping[id] || 0;
};

const HeatmapView = ({ stats }) => {
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

export default HeatmapView;
