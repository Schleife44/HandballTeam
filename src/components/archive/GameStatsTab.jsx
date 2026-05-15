import React, { useState, useMemo } from 'react';
import { Layout, Activity, BarChart2, TrendingUp, Globe, AlertTriangle } from 'lucide-react';

// Hooks
import { useGameStatsCalculations } from '../../hooks/useGameStatsCalculations';
import { useGameSync } from '../../hooks/useGameSync';

// UI
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Modal from '../ui/Modal';

// Components
import GameStatsSummary from './game_stats/GameStatsSummary';
import GameStatsProtocol from './game_stats/GameStatsProtocol';
import GameStatsHeatmap from './game_stats/GameStatsHeatmap';
import GameStatsTorverlauf from './game_stats/GameStatsTorverlauf';
import GameStatsHeader from './game_stats/GameStatsHeader';

const GameStatsTab = ({ game, onBack, onGoToVideo }) => {
  const [currentGame, setCurrentGame] = useState(game);
  const [activeSubTab, setActiveSubTab] = useState('summary'); 
  const [viewMode, setViewMode] = useState('kombi');
  const [activeLayoutMode, setActiveLayoutMode] = useState('kombi');
  const [selectedTeam, setSelectedTeam] = useState('home');
  const [selectedPlayer, setSelectedPlayer] = useState('all');
  const [filters, setFilters] = useState({ field: true, sevenM: true, missed: true });
  
  // Sync & Fix Logic
  const {
    isSyncModalOpen,
    setIsSyncModalOpen,
    syncUrl,
    setSyncUrl,
    syncStatus,
    handleSync,
    fixingEntry,
    setFixingEntry,
    availableOfficial,
    handleManualFix,
    completeManualFix
  } = useGameSync(currentGame, setCurrentGame);

  // Stats Logic
  const { progressionData, stats, filteredPoints, heatmapPlayers } = useGameStatsCalculations(
    currentGame, selectedTeam, selectedPlayer, filters
  );

  const getSecs = (str) => {
    if (!str) return 0;
    const pts = str.split(':');
    return (parseInt(pts[0]) || 0) * 60 + (parseInt(pts[1]) || 0);
  };

  const handleTeamChange = (team) => {
    setSelectedTeam(team);
    setSelectedPlayer('all');
  };

  const getCoordFromZone = (zone, type = 'goal') => {
    if (typeof zone === 'object' && zone !== null) return zone;
    if (type === 'goal') {
      const z = parseInt(zone);
      if (isNaN(z) || z < 1 || z > 9) return null;
      const row = Math.floor((z - 1) / 3);
      const col = (z - 1) % 3;
      return { x: 16.6 + col * 33.3, y: 16.6 + row * 33.3 };
    }
    if (type === 'field') {
      const mapping = {
        'AL': { x: 15, y: 40 }, 'RL': { x: 35, y: 65 }, 'KM': { x: 50, y: 85 },
        'RR': { x: 65, y: 65 }, 'AR': { x: 85, y: 40 }, 'RM_B': { x: 50, y: 140 },
        'RL_B': { x: 25, y: 120 }, 'RR_B': { x: 75, y: 120 }, 'Fern': { x: 50, y: 220 }
      };
      return mapping[zone] || null;
    }
    return null;
  };

  const renderShotMarker = (x, y, action, id, isSmall = false) => {
    let color = '#84cc16'; 
    let gradId = 'g-lime-h-archive';
    let hasGlow = true;

    const act = (action || "").toLowerCase();
    if (act.includes('gehalten') || act.includes('parade')) {
      color = '#eab308';
      gradId = 'g-yellow-h-archive';
    } else if (act.includes('tor')) {
      color = '#84cc16';
      gradId = 'g-lime-h-archive';
    } else {
      color = '#71717a';
      hasGlow = false;
    }

    const radius = isSmall ? 1.8 : 2.8;
    const glowRadius = isSmall ? 6 : 10;
    return (
      <g key={id}>
        {hasGlow && <circle cx={x} cy={y} r={glowRadius} fill={`url(#${gradId})`} opacity="0.3" />}
        <circle cx={x} cy={y} r={radius} fill={color} />
        <circle cx={x} cy={y} r={radius} fill="none" stroke="white" strokeWidth="0.5" />
      </g>
    );
  };

  const getCardStyles = () => {
    switch (activeLayoutMode) {
      case 'tor': return "max-w-[550px] aspect-[1.4/1] p-4";
      case 'feld': return "max-w-[340px] p-10";
      case 'kombi': return "max-w-[480px] p-6";
      default: return "";
    }
  };

  const hasCoordinates = useMemo(() => {
    if (!currentGame) return false;
    const logToUse = currentGame.gameLog || currentGame.log || [];
    return logToUse.some(e => {
        const pos = e.goalPos || e.details?.goalPos || e.metadata?.goalPos || e.wurfbild || e.fieldPos || e.details?.fieldPos || e.metadata?.fieldPos || e.wurfposition;
        return pos && pos.x !== undefined;
    });
  }, [currentGame]);

  const subTabs = [
    { id: 'summary', label: 'Übersicht', icon: Layout },
    ...(hasCoordinates ? [{ id: 'heatmap', label: 'Heatmap', icon: Activity }] : []),
    { id: 'stats', label: 'Protokoll', icon: BarChart2 },
    { id: 'torfolge', label: 'Torfolge', icon: TrendingUp },
  ];

  if (!currentGame) return null;
  const totalEfficiency = stats.length > 0 ? Math.round(stats.reduce((sum, p) => sum + p.efficiency, 0) / stats.length) : 0;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <GameStatsHeader 
        currentGame={currentGame}
        onBack={onBack}
        onGoToVideo={onGoToVideo}
        activeSubTab={activeSubTab}
        setActiveSubTab={setActiveSubTab}
        subTabs={subTabs}
        setIsSyncModalOpen={setIsSyncModalOpen}
      />

      {activeSubTab === 'summary' && (
        <GameStatsSummary 
          currentGame={currentGame} 
          stats={stats} 
          selectedTeam={selectedTeam} 
          handleTeamChange={handleTeamChange} 
          totalEfficiency={totalEfficiency} 
        />
      )}

      {activeSubTab === 'stats' && (
        <GameStatsProtocol 
          currentGame={currentGame} 
          getSecs={getSecs} 
          handleManualFix={handleManualFix} 
        />
      )}

      {activeSubTab === 'heatmap' && (
        <GameStatsHeatmap 
          selectedTeam={selectedTeam}
          handleTeamChange={handleTeamChange}
          selectedPlayer={selectedPlayer}
          setSelectedPlayer={setSelectedPlayer}
          heatmapPlayers={heatmapPlayers}
          viewMode={viewMode}
          setViewMode={setViewMode}
          filters={filters}
          setFilters={setFilters}
          getCardStyles={getCardStyles}
          activeLayoutMode={activeLayoutMode}
          setActiveLayoutMode={setActiveLayoutMode}
          filteredPoints={filteredPoints}
          getCoordFromZone={getCoordFromZone}
          renderShotMarker={renderShotMarker}
        />
      )}
      
      {activeSubTab === 'torfolge' && (
        <GameStatsTorverlauf progressionData={progressionData} />
      )}

      {/* Manual Fix Modal */}
      <Modal isOpen={!!fixingEntry} onClose={() => setFixingEntry(null)} title="Manueller Abgleich">
        <div className="flex flex-col gap-6">
          <Card className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col gap-2">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Dein Eintrag</p>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-bold text-white">{fixingEntry?.action}</p>
                    <p className="text-xs text-zinc-400">{fixingEntry?.playerName || 'Unbekannter Spieler'} ({fixingEntry?.time})</p>
                </div>
                <div className="text-lg font-black text-brand italic">{fixingEntry?.score || fixingEntry?.spielstand}</div>
            </div>
          </Card>

          <div className="space-y-4">
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-1">Offizielle Events (Nicht zugeordnet)</p>
            <div className="max-h-[300px] overflow-y-auto pr-2 flex flex-col gap-2">
                {availableOfficial.length === 0 ? (
                    <div className="py-10 text-center space-y-2">
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Keine passenden Events gefunden</p>
                    </div>
                ) : (
                    availableOfficial.map((off, idx) => (
                        <button key={idx} onClick={() => completeManualFix(off)} className="w-full p-4 bg-black/40 border border-zinc-800 rounded-xl hover:border-brand/40 transition-all text-left flex items-center justify-between group">
                            <div>
                                <p className="text-xs font-black text-zinc-100 uppercase tracking-widest group-hover:text-brand transition-colors">{off.action}</p>
                                <p className="text-[10px] text-zinc-500 font-bold">{off.playerName} ({off.time})</p>
                            </div>
                            <div className="text-sm font-black text-zinc-600 italic group-hover:text-brand transition-colors">{off.spielstand}</div>
                        </button>
                    ))
                )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Sync Modal */}
      <Modal isOpen={isSyncModalOpen} onClose={() => setIsSyncModalOpen(false)} title="Spieldaten abgleichen">
        <div className="flex flex-col gap-8 py-2">
          <div className="flex items-center gap-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-[2rem]">
            <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400"><Globe size={24} /></div>
            <div>
              <p className="text-xs font-bold text-zinc-100 uppercase tracking-tight">Datenabgleich (Sync)</p>
              <p className="text-[10px] text-zinc-500 font-medium leading-relaxed mt-1">Verknüpfe dein selbst getracktes Spiel mit dem offiziellen Bericht, um offizielle Kaderdaten und Zeitstempel zu erhalten.</p>
            </div>
          </div>

          <div className="space-y-4">
            <Input label="Spielbericht URL" placeholder="https://www.handball.net/spiele/..." value={syncUrl} onChange={(e) => setSyncUrl(e.target.value)} />
            {syncStatus.message && (
              <Card className={`p-6 rounded-3xl space-y-3 ${syncStatus.type === 'error' ? 'bg-red-500/10 border border-red-500/20' : syncStatus.type === 'success' ? 'bg-brand/10 border border-brand/20' : 'bg-blue-500/10 border border-blue-500/20'}`}>
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] text-center ${syncStatus.type === 'error' ? 'text-red-500' : syncStatus.type === 'success' ? 'text-brand' : 'text-blue-500'}`}>{syncStatus.message}</p>
                {currentGame.syncReport && syncStatus.type === 'success' && (
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="text-center p-2 bg-black/20 rounded-xl"><p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Gematched</p><p className="text-sm font-black text-brand">{currentGame.syncReport.matched}</p></div>
                    <div className="text-center p-2 bg-black/20 rounded-xl"><p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Offen</p><p className="text-sm font-black text-orange-400">{currentGame.syncReport.unmatched}</p></div>
                    <div className="text-center p-2 bg-black/20 rounded-xl"><p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Neu</p><p className="text-sm font-black text-blue-400">{currentGame.syncReport.added}</p></div>
                  </div>
                )}
              </Card>
            )}
            <Button variant="primary" className="w-full py-4" onClick={handleSync} disabled={!syncUrl || syncStatus.type === 'loading'}>Abgleich starten</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default GameStatsTab;
