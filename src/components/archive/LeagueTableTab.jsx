import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Database, Save, CheckCircle } from 'lucide-react';

// Hooks
import { useHistory } from '../../hooks/useHistory';

// UI
import Card from '../ui/Card';
import SeasonSelector from './components/SeasonSelector';

import useStore from '../../store/useStore';

const LeagueTableTab = () => {
  const {
    selectedSeason,
    availableSeasons,
    setSelectedSeason,
    activeTeamId,
    squad,
    loading
  } = useHistory();

  // Global State
  const leagueTable = useStore(state => state.squad.leagueTable);
  const isArchived = useStore(state => state.squad.archivedTableStatus);
  const setLeagueTable = useStore(state => state.setLeagueTable);

  const [loadingTable, setLoadingTable] = useState(!leagueTable);
  const [isSavingTable, setIsSavingTable] = useState(false);

  // Fetch League Table (Live or Archived)
  React.useEffect(() => {
    if (!activeTeamId || !selectedSeason) return;

    const loadTable = async () => {
      // Only show loader if we don't have ANY data yet
      if (!leagueTable) setLoadingTable(true);
      
      try {
        const { default: sync } = await import('../../services/SyncService');
        const { fetchTeamTable } = await import('../../services/handballNetService');
        
        // 1. Check for archived table first
        const archived = await sync.fetchSeasonData(activeTeamId, selectedSeason);
        
        if (archived?.leagueTable) {
          setLeagueTable(archived.leagueTable, true);
          setLoadingTable(false);
          return;
        }

        // 2. Fallback to live table if it's the current season
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const currentSeason = month >= 6 ? `${String(year).slice(-2)}/${String(year+1).slice(-2)}` : `${String(year-1).slice(-2)}/${String(year).slice(-2)}`;
        
        const currentSettings = squad?.settings || {};
        let effectiveTeamId = currentSettings.teamId;
        
        if ((!effectiveTeamId || effectiveTeamId.length > 15) && currentSettings.hnetUrl) {
          const fullUrl = currentSettings.hnetUrl.trim().replace(/\/$/, '');
          const slugMatch = fullUrl.match(/mannschaften\/([^/?]+)/);
          effectiveTeamId = slugMatch ? slugMatch[1] : fullUrl.split('/').pop();
        }

        if (selectedSeason === currentSeason || !selectedSeason) {
          if (!effectiveTeamId) {
            setLeagueTable(null, false);
            setLoadingTable(false);
            return;
          }

          const res = await fetchTeamTable(effectiveTeamId);
          const rows = res?.table?.rows || res?.data?.table?.rows;
          if (rows) {
            const mapped = rows.map(row => {
              let goalDiff = row.goalDiff ?? row.goalDifference ?? row.diff ?? 0;
              if (goalDiff === 0 && row.goalsPlus !== undefined && row.goalsMinus !== undefined) {
                goalDiff = row.goalsPlus - row.goalsMinus;
              }

              return {
                rank: row.position,
                team: row.team?.name || '?',
                games: parseInt(row.games || 0),
                diff: goalDiff,
                points: row.points,
                isMyTeam: String(row.team?.id) === String(effectiveTeamId) || row.team?.name?.includes(currentSettings.homeName)
              };
            });
            setLeagueTable(mapped, false);

            // SMART AUTO-SAVE
            const gameCounts = mapped.map(r => r.games);
            const maxGamesPossible = (mapped.length - 1) * 2;
            const allPlayedAll = gameCounts.every(c => c === maxGamesPossible && c > 0);
            
            if (allPlayedAll && gameCounts.length > 0) {
              sync.saveSeasonData(activeTeamId, selectedSeason, { leagueTable: mapped, autoArchived: true });
              setLeagueTable(mapped, true);
            }
          } else {
            setLeagueTable(null, false);
          }
        } else {
          setLeagueTable(null, false);
        }
      } catch (err) {
        console.error("Error loading table:", err);
      } finally {
        setLoadingTable(false);
      }
    };

    loadTable();
  }, [activeTeamId, selectedSeason, squad?.settings]);

  const saveCurrentTable = async () => {
    if (!activeTeamId || !selectedSeason || !leagueTable) return;
    setIsSavingTable(true);
    try {
      const { default: sync } = await import('../../services/SyncService');
      await sync.saveSeasonData(activeTeamId, selectedSeason, { leagueTable });
      setLeagueTable(leagueTable, true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingTable(false);
    }
  };

  // Reset table when switching seasons to force a fresh fetch
  React.useEffect(() => {
    setLeagueTable(null, false);
    setLoadingTable(true);
  }, [selectedSeason]);

  const renderTableSkeleton = () => (
    <Card noPadding className="overflow-hidden shadow-2xl border-zinc-800/50">
      <div className="animate-pulse">
        <div className="h-12 bg-zinc-950/50 border-b border-zinc-800" />
        {[...Array(12)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-zinc-800/30">
            <div className="w-6 h-4 bg-zinc-800 rounded" />
            <div className="flex-1 h-4 bg-zinc-800 rounded" />
            <div className="w-12 h-4 bg-zinc-800 rounded" />
            <div className="w-12 h-4 bg-zinc-800 rounded" />
            <div className="w-12 h-4 bg-zinc-800 rounded" />
          </div>
        ))}
      </div>
    </Card>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header with Season Selector - MATCHING STATS TAB STRUCTURE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand/10 border border-brand/20 rounded-xl flex items-center justify-center text-brand">
            <Shield size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black text-white italic tracking-tight uppercase">Liga Tabelle</h2>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Endstand / Aktuell ({selectedSeason})</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <SeasonSelector 
            seasons={availableSeasons} 
            selectedSeason={selectedSeason} 
            onSelect={setSelectedSeason} 
          />
          
          {leagueTable && !loadingTable && (
            <div className="flex items-center gap-2 animate-in fade-in duration-300">
              {isArchived ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl text-[10px] font-black uppercase text-green-400 shadow-lg whitespace-nowrap">
                  <CheckCircle size={14} />
                  <span className="hidden sm:inline">Dauerhaft Archiviert</span>
                </div>
              ) : (
                <button 
                  onClick={saveCurrentTable}
                  disabled={isSavingTable}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all shadow-lg whitespace-nowrap ${
                    isSavingTable ? 'bg-zinc-800 text-zinc-500' : 'bg-brand text-black hover:scale-105 active:scale-95'
                  }`}
                >
                  <Save size={14} />
                  {isSavingTable ? 'Speichere...' : 'Für Archiv sichern'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {(loading || loadingTable) ? (
        renderTableSkeleton()
      ) : leagueTable ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <Card noPadding className="overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-950/50">
                    <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest w-16 text-center">Rang</th>
                    <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Mannschaft</th>
                    <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Spiele</th>
                    <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Diff.</th>
                    <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center text-brand">Punkte</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {leagueTable.map((row, idx) => (
                    <tr key={idx} className={`hover:bg-white/5 transition-colors ${row.isMyTeam ? 'bg-brand/5' : ''}`}>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-sm font-black ${row.rank <= 3 ? 'text-brand' : 'text-zinc-400'}`}>{row.rank}.</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-bold ${row.isMyTeam ? 'text-brand' : 'text-zinc-100'}`}>
                          {row.team}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-mono text-zinc-400">{row.games}</td>
                      <td className="px-6 py-4 text-center text-sm font-mono text-zinc-400">{row.diff > 0 ? `+${row.diff}` : row.diff}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-black text-zinc-100">{row.points}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-zinc-950/30 border-t border-zinc-800 flex items-center justify-center gap-4">
               <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                  <Database size={12} className="text-brand" />
                  <span>Datenquelle: handball.net</span>
               </div>
            </div>
          </Card>
        </motion.div>
      ) : (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-12 text-center">
           <Database size={32} className="text-zinc-800 mx-auto mb-4" />
           <p className="text-sm font-bold text-zinc-400">Keine Tabellendaten für {selectedSeason} gefunden.</p>
           <p className="text-[10px] text-zinc-600 uppercase mt-2">Du kannst die aktuelle Tabelle sichern, indem du in die aktive Saison wechselst.</p>
        </div>
      )}
    </div>
  );
};

export default LeagueTableTab;
