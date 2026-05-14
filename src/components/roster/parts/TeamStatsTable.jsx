import React, { useMemo, useState } from 'react';
import { Search, ArrowUpDown, Filter, Trophy, TrendingUp, Users, Target, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../../store/useStore';
import { useHistory } from '../../../hooks/useHistory';
import { fuzzyMatch, normalizeSearchString } from '../../../utils/searchUtils';
import Card from '../../ui/Card';
import Input from '../../ui/Input';

const TeamStatsTable = () => {
  const navigate = useNavigate();
  const { squad } = useStore();
  const { filteredGames, selectedSeason } = useHistory();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'tore', direction: 'desc' });

  const aggregatedStats = useMemo(() => {
    const stats = {};
    
    // Initialize with all roster players
    (squad?.home || []).forEach(p => {
      const key = normalizeSearchString(p.name);
      stats[key] = { 
        id: p.number || '?', 
        name: p.name, 
        tore: 0, 
        fehlwurf: 0, 
        siebenMeterTore: 0, 
        siebenMeterVersuche: 0, 
        gelb: 0, 
        zweiMinuten: 0, 
        rot: 0, 
        games: new Set(),
        trainingAttended: 0,
        totalTrainingInSeason: 0
      };
    });

    const trainingsInSeason = (squad?.calendarEvents || []).filter(e => {
      if (!e.date || (e.type?.toUpperCase() !== 'TRAINING' && e.type !== 'training')) return false;
      if (e.isCancelled) return false;
      const d = new Date(e.date);
      const year = d.getFullYear();
      const month = d.getMonth();
      const season = month >= 6 ? `${String(year).slice(-2)}/${String(year+1).slice(-2)}` : `${String(year-1).slice(-2)}/${String(year).slice(-2)}`;
      return season === selectedSeason;
    });

    const totalTrainings = trainingsInSeason.length;

    trainingsInSeason.forEach(event => {
      Object.entries(event.responses || {}).forEach(([name, res]) => {
        const key = normalizeSearchString(name);
        if (stats[key]) {
          stats[key].totalTrainingInSeason = totalTrainings;
          if (res.status === 'going') stats[key].trainingAttended++;
        }
      });
    });

    (filteredGames || []).forEach(game => {
      if (game.statsSummary && game.statsSummary.playerStats) {
        const { playerStats, playerNames } = game.statsSummary;
        Object.entries(playerStats).forEach(([pId, s]) => {
          const pName = playerNames[pId] || `Spieler #${pId}`;
          const key = normalizeSearchString(pName);
          if (!stats[key]) {
            stats[key] = { id: pId, name: pName, tore: 0, fehlwurf: 0, siebenMeterTore: 0, siebenMeterVersuche: 0, gelb: 0, zweiMinuten: 0, rot: 0, games: new Set(), trainingAttended: 0, totalTrainingInSeason: totalTrainings };
          }
          stats[key].games.add(game.id);
          stats[key].tore += s.goals || 0;
          stats[key].fehlwurf += s.missed || 0;
          stats[key].siebenMeterTore += s.sevenMeterGoals || 0;
          stats[key].siebenMeterVersuche += s.sevenMeterTotal || 0;
          stats[key].gelb += s.yellow || 0;
          stats[key].zweiMinuten += s.suspensions || 0;
          stats[key].rot += s.red || 0;
        });
      }
    });

    return Object.values(stats).map(p => ({
      ...p,
      totalGames: p.games.size,
      totalAttempts: p.tore + p.fehlwurf,
      efficiency: (p.tore + p.fehlwurf) > 0 ? Math.round((p.tore / (p.tore + p.fehlwurf)) * 100) : 0
    }));
  }, [filteredGames, squad, selectedSeason]);

  const sortedStats = useMemo(() => {
    const sorted = [...aggregatedStats].filter(p => fuzzyMatch(p.name, searchTerm));
    if (sortConfig.key) {
      sorted.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sorted;
  }, [aggregatedStats, searchTerm, sortConfig]);

  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') direction = 'asc';
    setSortConfig({ key, direction });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900/40 p-5 rounded-3xl border border-zinc-800">
          <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Gespielte Spiele</p>
          <p className="text-2xl font-black text-white italic">{(filteredGames || []).length}</p>
        </div>
        <div className="bg-zinc-900/40 p-5 rounded-3xl border border-zinc-800">
          <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Saison Tore</p>
          <p className="text-2xl font-black text-brand italic">{aggregatedStats.reduce((sum, p) => sum + p.tore, 0)}</p>
        </div>
        <div className="bg-zinc-900/40 p-5 rounded-3xl border border-zinc-800">
          <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Ø Trainingsbeteiligung</p>
          <p className="text-2xl font-black text-blue-400 italic">
            {aggregatedStats.length > 0 
              ? Math.round(aggregatedStats.reduce((sum, p) => sum + (p.totalTrainingInSeason > 0 ? (p.trainingAttended / p.totalTrainingInSeason) : 0), 0) / aggregatedStats.length * 100) 
              : 0}%
          </p>
        </div>
      </div>

      <Card noPadding className="overflow-hidden border-zinc-800">
        <div className="p-4 border-b border-zinc-800 bg-zinc-950/20">
          <Input 
            placeholder="Spieler suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={Search}
            noPadding
            className="border-none bg-transparent"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950/50">
                <th onClick={() => requestSort('name')} className="px-6 py-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest cursor-pointer hover:text-zinc-300 transition-colors">Spieler <ArrowUpDown size={8} className="inline ml-1" /></th>
                <th onClick={() => requestSort('trainingAttended')} className="px-6 py-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest cursor-pointer hover:text-zinc-300 transition-colors text-center text-blue-400">Training</th>
                <th onClick={() => requestSort('totalGames')} className="px-6 py-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest cursor-pointer hover:text-zinc-300 transition-colors text-center">Spiele</th>
                <th onClick={() => requestSort('tore')} className="px-6 py-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest cursor-pointer hover:text-zinc-300 transition-colors text-center text-brand">Tore</th>
                <th onClick={() => requestSort('efficiency')} className="px-6 py-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest cursor-pointer hover:text-zinc-300 transition-colors text-center text-green-400">Quote</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {sortedStats.map((p, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <span 
                      className="text-sm font-bold text-zinc-100 cursor-pointer hover:text-brand transition-colors"
                      onClick={() => navigate(`/roster/${p.name}`)}
                    >
                      {p.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-black text-blue-400">{p.trainingAttended}/{p.totalTrainingInSeason}</span>
                      {p.totalTrainingInSeason > 0 && (
                        <span className="text-[8px] font-bold text-zinc-500 uppercase">
                          {Math.round((p.trainingAttended / p.totalTrainingInSeason) * 100)}%
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-sm font-mono text-zinc-400">{p.totalGames}</td>
                  <td className="px-6 py-4 text-center text-sm font-black text-brand">{p.tore}</td>
                  <td className="px-6 py-4 text-center text-xs font-black text-green-400">{p.efficiency}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default TeamStatsTable;
