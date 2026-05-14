import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Video, BarChart2, Activity, Layout, 
  TrendingUp, Globe, RefreshCw, Clock, Target, Maximize2, Layers
} from 'lucide-react';

// Store
import useStore from '../../store/useStore';

// UI
import Button from '../ui/Button';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Input from '../ui/Input';
import Modal from '../ui/Modal';

// Hooks
import { useGameStatsCalculations } from '../../hooks/useGameStatsCalculations';

// Components
import GameStatsSummary from './game_stats/GameStatsSummary';
import GameStatsProtocol from './game_stats/GameStatsProtocol';
import GameStatsHeatmap from './game_stats/GameStatsHeatmap';
import GameStatsTorverlauf from './game_stats/GameStatsTorverlauf';

const GameStatsTab = ({ game, onBack, onGoToVideo }) => {
  const { updateHistoryGame } = useStore();
  const [activeSubTab, setActiveSubTab] = useState('summary'); 
  const [viewMode, setViewMode] = useState('kombi');
  const [activeLayoutMode, setActiveLayoutMode] = useState('kombi');
  const [selectedTeam, setSelectedTeam] = useState('home');
  const [selectedPlayer, setSelectedPlayer] = useState('all');
  const [filters, setFilters] = useState({ field: true, sevenM: true, missed: true });
  
  // Sync States
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncUrl, setSyncUrl] = useState('');
  const [syncStatus, setSyncStatus] = useState({ type: '', message: '' });
  const [currentGame, setCurrentGame] = useState(game);

  // Manual Fix States
  const [fixingEntry, setFixingEntry] = useState(null);
  const [availableOfficial, setAvailableOfficial] = useState([]);
  
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

  const handleManualFix = (localEntry) => {
    const getSecsForSort = (str) => {
        if(!str) return 0;
        const pts = str.split(':');
        return (parseInt(pts[0])||0)*60 + (parseInt(pts[1])||0);
    };
    
    const unmatched = currentGame.syncReport?.unmatchedOfficial || [];
    const available = unmatched.sort((a, b) => {
        const targetSecs = getSecsForSort(localEntry.time);
        return Math.abs(getSecsForSort(a.time) - targetSecs) - Math.abs(getSecsForSort(b.time) - targetSecs);
    }).filter((v, i, a) => {
        const id = v.hnetId || v.importMeta?.hnetId || v.id;
        return a.findIndex(t => (t.hnetId || t.importMeta?.hnetId || t.id) === id) === i;
    });

    setAvailableOfficial(available);
    setFixingEntry(localEntry);
  };

  const completeManualFix = (targetEvent) => {
    if (!fixingEntry || !targetEvent) return;

    const isFixingOfficial = fixingEntry.isOfficialOnly;
    const localToUpdate = isFixingOfficial ? targetEvent : fixingEntry;
    const officialDataSource = isFixingOfficial ? fixingEntry : targetEvent;

    const targetHnetId = officialDataSource.importMeta?.hnetId || officialDataSource.hnetId;

    let updatedLog = (currentGame?.gameLog || []).map(entry => {
        if (entry === localToUpdate) {
            return {
                ...entry,
                isSynced: true,
                hnetId: targetHnetId,
                officialTime: officialDataSource.time,
                timestamp: officialDataSource.timestamp || entry.timestamp,
                syncMeta: { officialAction: officialDataSource.action, officialPlayer: officialDataSource.playerName }
            };
        }
        return entry;
    });

    const hnetIdToRemove = officialDataSource.importMeta?.hnetId || officialDataSource.hnetId;
    updatedLog = updatedLog.filter(l => !(l.isOfficialOnly && (l.hnetId || l.importMeta?.hnetId) === hnetIdToRemove));

    const updatedUnmatchedOfficial = (currentGame.syncReport?.unmatchedOfficial || []).filter(h => 
        (h.importMeta?.hnetId || h.hnetId) !== hnetIdToRemove
    );

    const updatedGame = { 
        ...currentGame, 
        gameLog: updatedLog,
        syncReport: {
            ...currentGame.syncReport,
            matched: (currentGame.syncReport?.matched || 0) + 1,
            unmatched: Math.max(0, (currentGame.syncReport?.unmatched || 0) - 1),
            unmatchedOfficial: updatedUnmatchedOfficial
        }
    };

    setCurrentGame(updatedGame);
    updateHistoryGame(updatedGame);

    setFixingEntry(null);
    setAvailableOfficial([]);
  };

  const handleSync = async () => {
    if (!syncUrl) return;
    setSyncStatus({ type: 'loading', message: 'Hole Spieldaten...' });
    
    try {
      const { fetchGameData, syncGameLogs } = await import('../../services/handballNetService');
      const officialData = await fetchGameData(syncUrl);
      
      if (!officialData) throw new Error("Konnte Spieldaten nicht laden");
      
      setSyncStatus({ type: 'loading', message: 'Synchronisiere Spielverlauf...' });
      const { updatedGame, report } = syncGameLogs(currentGame, officialData);
      
      setCurrentGame(updatedGame);
      updateHistoryGame(updatedGame);
      
      setSyncStatus({ 
        type: 'success', 
        message: `Synchronisation abgeschlossen! ${report.matched} Aktionen zugeordnet.` 
      });
      
    } catch (e) {
      setSyncStatus({ type: 'error', message: e.message });
    }
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

  if (!currentGame) return null;

  const totalEfficiency = stats.length > 0 ? Math.round(stats.reduce((sum, p) => sum + p.efficiency, 0) / stats.length) : 0;
  const isHandballNet = currentGame.isSynced || currentGame.hnetGameId;

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

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Sub Header / Breadcrumb */}
      <Card noPadding className="flex items-center justify-between p-4 bg-zinc-900/40 border border-zinc-800">
        <div className="flex items-center gap-6">
          <Button variant="ghost" onClick={onBack} icon={ArrowLeft} className="text-zinc-500 hover:text-zinc-100 pr-6 mr-2 border-r border-zinc-800 rounded-none h-10">
            Zurück
          </Button>
          <div className="flex bg-black/40 p-1 rounded-xl border border-zinc-800/50">
            {subTabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveSubTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === tab.id ? 'bg-zinc-100 text-black shadow-xl' : 'text-zinc-500 hover:text-zinc-300'}`}>
                <tab.icon size={12} /> {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end mr-4">
            <div className="flex items-center gap-2">
              {currentGame.isSynced && !currentGame.hnetGameId?.startsWith('hnet_') ? (
                <Badge variant="brand" className="text-[9px] py-1">
                  <Activity size={10} className="mr-1" /> Manuell (Abgeglichen)
                </Badge>
              ) : isHandballNet ? (
                <Badge variant="outline" className="text-[9px] py-1 text-blue-400 border-blue-400/20">
                  <Globe size={10} className="mr-1" /> Handball.net
                </Badge>
              ) : (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[9px] py-1 text-orange-400 border-orange-400/20">
                    <Activity size={10} className="mr-1" /> Manuell
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    icon={RefreshCw} 
                    onClick={() => setIsSyncModalOpen(true)}
                    className="text-[9px] h-auto py-1 px-2 border border-zinc-800"
                  >
                    Abgleich
                  </Button>
                </div>
              )}
            </div>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">
              {new Date(currentGame.timestamp || currentGame.id).toLocaleDateString('de-DE')}
            </p>
          </div>
          <Button variant="primary" icon={Video} onClick={onGoToVideo}>
            Video Analyse
          </Button>
        </div>
      </Card>

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
      <Modal 
        isOpen={!!fixingEntry} 
        onClose={() => setFixingEntry(null)} 
        title="Manueller Abgleich"
      >
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
      <Modal 
        isOpen={isSyncModalOpen} 
        onClose={() => setIsSyncModalOpen(false)} 
        title="Spieldaten abgleichen"
      >
        <div className="flex flex-col gap-8 py-2">
          <div className="flex items-center gap-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-[2rem]">
            <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400">
              <Globe size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-100 uppercase tracking-tight">Datenabgleich (Sync)</p>
              <p className="text-[10px] text-zinc-500 font-medium leading-relaxed mt-1">Verknüpfe dein selbst getracktes Spiel mit dem offiziellen Bericht, um offizielle Kaderdaten und Zeitstempel zu erhalten.</p>
            </div>
          </div>

          <div className="space-y-4">
            <Input 
              label="Spielbericht URL"
              placeholder="https://www.handball.net/spiele/..."
              value={syncUrl}
              onChange={(e) => setSyncUrl(e.target.value)}
            />

            {syncStatus.message && (
              <Card className={`p-6 rounded-3xl space-y-3 ${
                syncStatus.type === 'error' ? 'bg-red-500/10 border border-red-500/20' : 
                syncStatus.type === 'success' ? 'bg-brand/10 border border-brand/20' : 'bg-blue-500/10 border border-blue-500/20'
              }`}>
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] text-center ${
                  syncStatus.type === 'error' ? 'text-red-500' : 
                  syncStatus.type === 'success' ? 'text-brand' : 'text-blue-500'
                }`}>{syncStatus.message}</p>
                
                {currentGame.syncReport && syncStatus.type === 'success' && (
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="text-center p-2 bg-black/20 rounded-xl">
                      <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Gematched</p>
                      <p className="text-sm font-black text-brand">{currentGame.syncReport.matched}</p>
                    </div>
                    <div className="text-center p-2 bg-black/20 rounded-xl">
                      <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Offen</p>
                      <p className="text-sm font-black text-orange-400">{currentGame.syncReport.unmatched}</p>
                    </div>
                    <div className="text-center p-2 bg-black/20 rounded-xl">
                      <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Neu</p>
                      <p className="text-sm font-black text-blue-400">{currentGame.syncReport.added}</p>
                    </div>
                  </div>
                )}
              </Card>
            )}

            <Button 
              variant="primary"
              className="w-full py-4"
              onClick={handleSync}
              disabled={!syncUrl || syncStatus.type === 'loading'}
            >
              Abgleich starten
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default GameStatsTab;
