import React from 'react';
import { Target, Trophy, Shield, TrendingUp } from 'lucide-react';
import StatCard from '../parts/StatCard';

const StatsGrid = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      <StatCard 
        label="Tore Gesamt" 
        value={stats.totalGoals} 
        icon={Target} 
        trend={stats.goalsTrend} 
      />
      <StatCard 
        label="Win Rate" 
        value={`${stats.winRate}%`} 
        icon={Trophy} 
        trend={stats.winRateTrend} 
      />
      <StatCard 
        label="Gegentore" 
        value={stats.totalConceded} 
        icon={Shield} 
        trend={stats.concededTrend} 
        invertTrendColor 
      />
      <StatCard 
        label="Ø Tore" 
        value={stats.avgGoals} 
        icon={TrendingUp} 
        trend={stats.goalsTrend} 
      />
    </div>
  );
};

export default StatsGrid;
