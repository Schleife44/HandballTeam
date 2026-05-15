import React from 'react';
import { Calendar, Trophy, Activity, TrendingUp, Target } from 'lucide-react';
import Card from '../../ui/Card';

const ProfileStatsGrid = ({ summary }) => {
  const statItems = [
    { label: 'Spiele', value: summary.totalGames, icon: Calendar, color: 'text-blue-400' },
    { label: 'Tore Gesamt', value: summary.totalGoals, icon: Trophy, color: 'text-brand' },
    { label: 'Training', value: `${summary.trainingAttended}/${summary.trainingTotal}`, icon: Activity, color: 'text-indigo-400' },
    { label: 'Ø Tore', value: summary.avgGoals, icon: TrendingUp, color: 'text-emerald-400' },
    { label: 'Ø Quote', value: `${summary.avgEfficiency}%`, icon: Target, color: 'text-orange-400' }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {statItems.map((s, i) => (
        <Card key={i} className="p-6 group hover:border-white/10 transition-all">
          <s.icon size={16} className={`${s.color} mb-3`} />
          <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{s.label}</p>
          <p className="text-2xl font-black text-white mt-1">{s.value}</p>
        </Card>
      ))}
    </div>
  );
};

export default ProfileStatsGrid;
