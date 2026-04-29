import React, { useState, useMemo } from 'react';
import { Users, Trophy, TrendingUp, Search, ArrowUpDown, Filter } from 'lucide-react';

// Store
import useStore from '../../store/useStore';

// UI
import Card from '../ui/Card';
import Input from '../ui/Input';
import { fuzzyMatch, normalizeSearchString } from '../../utils/searchUtils';

const SeasonStatsTab = () => {
  const { history: games } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'tore', direction: 'desc' });

  const aggregatedStats = useMemo(() => {
    const stats = {}; // Key: playerName
    
    (games || []).forEach(game => {
      // SaaS OPTIMIZATION: Use pre-calculated summary if available
      if (game.statsSummary && game.statsSummary.playerStats) {
        const { playerStats, playerNames } = game.statsSummary;
        Object.entries(playerStats).forEach(([pId, s]) => {
          const pName = playerNames[pId] || `Spieler #${pId}`;
          const key = normalizeSearchString(pName);

          if (!stats[key]) {
            stats[key] = { id: pId, name: pName, tore: 0, fehlwurf: 0, siebenMeterTore: 0, siebenMeterVersuche: 0, gelb: 0, zweiMinuten: 0, rot: 0, games: new Set() };
          }
          
          stats[key].games.add(game.id);
          stats[key].tore += s.goals || 0;
          stats[key].fehlwurf += s.missed || 0;
          stats[key].gelb += s.yellow || 0;
          stats[key].zweiMinuten += s.suspensions || 0;
          stats[key].rot += s.red || 0;
        });
        return;
      }

      // Legacy Fallback: Process raw log
      const log = game?.gameLog || game?.log;
      if (!game || !log) return;
      
      log.forEach(entry => {
        if (entry.action?.startsWith('Gegner') || entry.gegnerNummer) return;
        if (!entry.playerId && !entry.playerName) return;
        
        const pId = entry.playerId || entry.playerNumber || entry.number || 'N/A';
        const pName = entry.playerName || `Spieler #${pId}`;
        const key = normalizeSearchString(pName);

        if (!stats[key]) {
          stats[key] = { id: pId, name: pName, tore: 0, fehlwurf: 0, siebenMeterTore: 0, siebenMeterVersuche: 0, gelb: 0, zweiMinuten: 0, rot: 0, games: new Set() };
        }

        stats[key].games.add(game.id);
        
        const action = (entry.action || "").toLowerCase();
        if (action === 'tor' || action === 'goal') stats[key].tore++;
        if (action === 'fehlwurf' || action === 'miss') stats[key].fehlwurf++;
        if (action === '7mtor') {
          stats[key].tore++;
          stats[key].siebenMeterTore++;
          stats[key].siebenMeterVersuche++;
        }
        if (action === '7mverworfen') stats[key].siebenMeterVersuche++;
        if (action === 'gelbe karte' || action === 'yellow') stats[key].gelb++;
        if (action === '2 minuten' || action === 'penalty') stats[key].zweiMinuten++;
        if (action === 'rote karte' || action === 'red') stats[key].rot++;
      });
    });

    return Object.values(stats).map(p => ({
      ...p,
      totalGames: p.games.size,
      totalAttempts: p.tore + p.fehlwurf,
      efficiency: (p.tore + p.fehlwurf) > 0 ? Math.round((p.tore / (p.tore + p.fehlwurf)) * 100) : 0
    }));
  }, [games]);

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

  const totals = useMemo(() => {
    return {
      tore: aggregatedStats.reduce((sum, p) => sum + p.tore, 0),
      games: games.length,
      players: aggregatedStats.length
    };
  }, [aggregatedStats, games]);

  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {/* Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Saison Tore" value={totals.tore} icon={Trophy} color="text-brand" />
        <StatCard label="Gespielte Spiele" value={totals.games} icon={TrendingUp} color="text-brand" />
        <StatCard label="Kader Größe" value={totals.players} icon={Users} color="text-brand" />
      </div>

      {/* Stats Table */}
      <Card noPadding className="shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Input 
              placeholder="Spieler suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
              noPadding
              className="border-none bg-zinc-950"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-zinc-600" />
            <span className="text-xs font-bold text-zinc-500 uppercase">Saison 25/26</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950/50">
                <th onClick={() => requestSort('name')} className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest cursor-pointer hover:text-zinc-300 transition-colors">Spieler <ArrowUpDown size={10} className="inline ml-1" /></th>
                <th onClick={() => requestSort('totalGames')} className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest cursor-pointer hover:text-zinc-300 transition-colors text-center">Einsätze</th>
                <th onClick={() => requestSort('tore')} className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest cursor-pointer hover:text-zinc-300 transition-colors text-center text-brand">Tore</th>
                <th onClick={() => requestSort('siebenMeterTore')} className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest cursor-pointer hover:text-zinc-300 transition-colors text-center text-orange-400">7m</th>
                <th onClick={() => requestSort('totalAttempts')} className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest cursor-pointer hover:text-zinc-300 transition-colors text-center">Würfe</th>
                <th onClick={() => requestSort('efficiency')} className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest cursor-pointer hover:text-zinc-300 transition-colors text-center text-green-400">Quote</th>
                <th onClick={() => requestSort('zweiMinuten')} className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest cursor-pointer hover:text-zinc-300 transition-colors text-center text-yellow-500">2min</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {sortedStats.map((p, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400 group-hover:bg-brand group-hover:text-black transition-all">
                        {p.id}
                      </div>
                      <span className="text-sm font-bold text-zinc-100">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-sm font-mono text-zinc-400">{p.totalGames}</td>
                  <td className="px-6 py-4 text-center text-sm font-black text-brand">{p.tore}</td>
                  <td className="px-6 py-4 text-center text-sm font-bold text-orange-400/80">{p.siebenMeterTore}/{p.siebenMeterVersuche}</td>
                  <td className="px-6 py-4 text-center text-sm font-mono text-zinc-400">{p.totalAttempts}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-12 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500" style={{ width: `${p.efficiency}%` }} />
                      </div>
                      <span className="text-xs font-black text-green-400 w-8">{p.efficiency}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-sm font-bold text-yellow-500/80">{p.zweiMinuten}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }) => (
  <Card className="p-6">
    <div className="flex items-center gap-5">
      <div className="w-14 h-14 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-100 shadow-lg">
        <Icon size={28} className={color} />
      </div>
      <div>
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{label}</p>
        <p className="text-3xl font-black text-zinc-100 italic tracking-tighter mt-1">{value}</p>
      </div>
    </div>
  </Card>
);

export default SeasonStatsTab;
