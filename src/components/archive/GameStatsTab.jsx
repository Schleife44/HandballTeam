import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, TrendingUp, Users, ArrowLeft, Video, BarChart2, Activity, Layout, 
  Layers, Maximize2, ChevronDown, Clock, Globe, RefreshCw, CheckCircle2,
  Filter
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, ReferenceLine 
} from 'recharts';

// Store
import useStore from '../../store/useStore';

// UI
import Button from '../ui/Button';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Modal from '../ui/Modal';

// Services
import { normalizeAction } from '../../services/handballNetService';

const GameStatsTab = ({ game, onBack, onGoToVideo }) => {
  const { squad, updateHistoryGame } = useStore();
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
  
  const getSecs = (str) => {
    if (!str) return 0;
    const pts = str.split(':');
    return (parseInt(pts[0]) || 0) * 60 + (parseInt(pts[1]) || 0);
  };

  const progressionData = useMemo(() => {
    if (!currentGame) return [];
    if (!currentGame.gameLog && !currentGame.log) return [];
    const logToUse = currentGame.gameLog || currentGame.log || [];
    
    const sortedLog = [...logToUse].sort((a, b) => {
      const getAbsSecs = (str) => {
        if (!str) return 0;
        const pts = str.split(':');
        const m = parseInt(pts[0]) || 0;
        const s = parseInt(pts[1]) || 0;
        return m * 60 + s;
      };
      const absA = ((a.half || 1) - 1) * 1800 + getAbsSecs(a.time);
      const absB = ((b.half || 1) - 1) * 1800 + getAbsSecs(b.time);
      return absA - absB;
    });

    const data = [{ time: '00:00', heim: 0, gegner: 0, rawTime: 0 }];
    let hScore = 0;
    let gScore = 0;

    sortedLog.forEach(entry => {
      if (entry.action?.toLowerCase().includes('tor')) {
        const isGegnerAction = entry.action?.startsWith('Gegner') || entry.isOpponent === true;
        if (isGegnerAction) gScore++; else hScore++;
        
        data.push({
          time: entry.time || '00:00',
          heim: hScore,
          gegner: gScore,
          player: entry.playerName,
          action: entry.action,
          isGegner: isGegnerAction,
          rawTime: ((entry.half || 1) - 1) * 1800 + getSecs(entry.time)
        });
      }
    });

    const lastPoint = data[data.length - 1];
    if (lastPoint && lastPoint.time !== '60:00') {
        data.push({ ...lastPoint, time: '60:00', rawTime: 3600 });
    }

    return data;
  }, [currentGame]);

  const stats = useMemo(() => {
    if (!currentGame) return [];
    const playerStats = {};
    const isAuswaerts = currentGame.settings?.isAuswaertsspiel || false;
    
    // 1. Initialize with Roster
    const currentRoster = selectedTeam === 'home' 
      ? (currentGame.roster || []) 
      : (currentGame.knownOpponents || []);

    currentRoster.forEach(p => {
      const pId = String(p.number || p.id || "");
      if (!pId) return;
      playerStats[pId] = { 
        id: pId, 
        name: p.name || `Spieler #${pId}`, 
        tore: 0, 
        fehlwurf: 0, 
        siebenMeterTore: 0, 
        siebenMeterVersuche: 0, 
        gelb: 0, 
        zweiMinuten: 0, 
        rot: 0, 
        number: pId 
      };
    });

    // 2. Process Game Log
    const logToUse = currentGame.gameLog || currentGame.log || [];
    if (logToUse.length > 0) {
      logToUse.forEach(entry => {
        const teamField = (entry.team || "").toLowerCase();
        const isOpponentAction = 
          entry.isOpponent === true || 
          entry.action?.toLowerCase().includes('gegner') ||
          (isAuswaerts ? teamField === 'home' || teamField === 'heim' : teamField === 'away' || teamField === 'gegner');

        const isTargetTeam = selectedTeam === 'home' ? !isOpponentAction : isOpponentAction;
        if (!isTargetTeam) return;

        let rawId = entry.playerId ?? entry.playerNumber ?? entry.gegnerNummer ?? entry.number ?? entry.player;
        if (rawId === undefined || rawId === null || rawId === "") return;
        
        const pId = String(rawId);
        
        if (!playerStats[pId]) {
          const pName = entry.playerName || (isOpponentAction ? `Gegner #${pId}` : `Spieler #${pId}`);
          playerStats[pId] = { id: pId, name: pName, tore: 0, fehlwurf: 0, siebenMeterTore: 0, siebenMeterVersuche: 0, gelb: 0, zweiMinuten: 0, rot: 0, number: pId };
        }
        
        const p = playerStats[pId];
        const normAction = normalizeAction(entry.action);
        
        if (normAction === 'goal') p.tore++;
        if (normAction === 'miss') p.fehlwurf++;
        if (normAction === 'seven_meter') {
          p.siebenMeterVersuche++;
          if (entry.action?.toLowerCase().includes('tor')) {
            p.tore++;
            p.siebenMeterTore++;
          }
        }
        if (normAction === 'yellow') p.gelb++;
        if (normAction === 'penalty') p.zweiMinuten++;
        if (normAction === 'red') p.rot++;
      });
    }

    return Object.values(playerStats).map(p => ({
      ...p,
      efficiency: (p.tore + p.fehlwurf) > 0 ? Math.round((p.tore / (p.tore + p.fehlwurf)) * 100) : 0
    })).sort((a, b) => {
      // Sort by goals, then by number
      if (b.tore !== a.tore) return b.tore - a.tore;
      return parseInt(a.number) - parseInt(b.number);
    });
  }, [currentGame, selectedTeam]);

  const filteredPoints = useMemo(() => {
    if (!currentGame) return [];
    const logToUse = currentGame.gameLog || currentGame.log || [];
    if (logToUse.length === 0) return [];
    
    return logToUse.filter(e => {
      const actionLower = e.action?.toLowerCase() || "";
      const is7m = actionLower.includes('7m') || actionLower.includes('siebenmeter');
      
      const isOpponentAction = e.isOpponent === true || actionLower.includes('gegner');
      const targetTeam = selectedTeam === 'home' ? true : false;
      const teamMatch = !isOpponentAction === targetTeam;

      if (!teamMatch) return false;
      
      if (selectedPlayer !== 'all') {
        const pId = String(e.playerId ?? e.playerNumber ?? e.gegnerNummer ?? e.number ?? e.player ?? "");
        if (pId !== String(selectedPlayer)) return false;
      }
      
      const isGoal = actionLower.includes('tor');
      const isMiss = !isGoal && (actionLower.includes('fehlwurf') || actionLower.includes('verworfen') || actionLower.includes('gehalten') || actionLower.includes('pfosten') || actionLower.includes('miss') || actionLower.includes('save'));
      
      if (is7m && !filters.sevenM) return false;
      if (!is7m && !filters.field) return false;
      if (isMiss && !filters.missed) return false;
      
      const hasCoords = !!(e.details?.fieldPos || e.details?.goalPos || e.goalPos || e.fieldPos || e.wurfbild || e.wurfposition);
      
      if (is7m) {
         console.log(`7m-Check [${e.time}]: Team=${teamMatch ? 'OK' : 'FAIL'}, Coords=${hasCoords ? 'OK' : 'MISSING'}`);
      }

      return hasCoords;
    });
  }, [currentGame, selectedTeam, selectedPlayer, filters]);

  const uniqueActions = useMemo(() => {
    if (!currentGame) return [];
    const logToUse = currentGame.gameLog || currentGame.log || [];
    return Array.from(new Set(logToUse.map(e => e.action))).sort();
  }, [currentGame]);

  const heatmapPlayers = useMemo(() => {
    if (!currentGame) return [];
    const logToUse = currentGame.gameLog || currentGame.log || [];
    const playerMap = {};
    logToUse.forEach(entry => {
      const isOpponentAction = 
        entry.isOpponent === true || 
        entry.isOpponent === "true" ||
        entry.action?.toLowerCase().includes('gegner') ||
        entry.team?.toLowerCase() === 'away' ||
        entry.team?.toLowerCase() === 'gegner';

      const isTargetTeam = selectedTeam === 'home' ? !isOpponentAction : isOpponentAction;
      
      if (!isTargetTeam) return;
      
      let rawId = entry.playerId ?? entry.playerNumber ?? entry.gegnerNummer ?? entry.number ?? entry.player;
      if (rawId === undefined || rawId === null || rawId === "") return;
      
      const pId = String(rawId);
      
      if (!playerMap[pId]) {
        let name = entry.playerName;
        if (!name || name === "SPIEL" || name === "Spieler") {
            name = isOpponentAction ? `Gegner #${pId}` : `Spieler #${pId}`;
        }
        playerMap[pId] = { id: pId, name };
      }
    });
    
    return Object.values(playerMap).sort((a, b) => {
      const numA = parseInt(a.id);
      const numB = parseInt(b.id);
      if (isNaN(numA) || isNaN(numB)) return a.id.localeCompare(b.id);
      return numA - numB;
    });
  }, [currentGame, selectedTeam]);

  const handleTeamChange = (team) => {
    setSelectedTeam(team);
    setSelectedPlayer('all');
  };

  const handleSync = async () => {
    if (!syncUrl) return;
    setSyncStatus({ type: 'loading', message: 'Synchronisiere mit Handball.net...' });
    
    try {
      const { syncGame } = await import('../../services/handballNetService');
      
      let myTeamName = currentGame.settings?.myTeamName || squad.settings?.homeName || "";

      const result = await syncGame(currentGame, syncUrl, myTeamName);
      
      setCurrentGame(result);
      updateHistoryGame(result);

      setSyncStatus({ 
        type: 'success', 
        message: `Abgleich beendet: ${result.syncReport.matched} Treffer, ${result.syncReport.added} neue Events.` 
      });
      setTimeout(() => {
        setIsSyncModalOpen(false);
        setSyncStatus({ type: '', message: '' });
      }, 3000);
    } catch (e) {
      console.error(e);
      setSyncStatus({ type: 'error', message: 'Fehler beim Abgleich: ' + e.message });
    }
  };

  const handleManualFix = (localEntry) => {
    const isOfficialSource = localEntry.isOfficialOnly;
    const lAction = normalizeAction(localEntry.action);

    const available = (isOfficialSource ? (currentGame.gameLog || []) : [
        ...(currentGame.syncReport?.unmatchedOfficial || []),
        ...(currentGame.gameLog || []).filter(l => l.isOfficialOnly || l.isSynced)
    ]).filter(h => {
        if (isOfficialSource && (h.isOfficialOnly || (h.isSynced && !h.importMeta))) return false;
        if (!isOfficialSource && !h.isOfficialOnly && !h.importMeta && !h.hnetId) return false;

        const hAction = normalizeAction(h.action);
        const sourceAction = normalizeAction(localEntry.action);
        const isDisciplinary = (a) => ['penalty', 'seven_meter', 'yellow', 'red'].includes(a);

        if (hAction === sourceAction) return true;
        if (isDisciplinary(sourceAction) && isDisciplinary(hAction)) return true;

        const lLow = localEntry.action?.toLowerCase() || "";
        if (lLow.includes('+')) {
            if (lLow.includes('7m') && hAction === 'seven_meter') return true;
            if ((lLow.includes('2min') || lLow.includes('2 min')) && hAction === 'penalty') return true;
        }

        return false;
    }).sort((a, b) => {
        const getSecsForSort = (t) => {
            if (!t) return 0;
            const [m, s] = t.split(':').map(Number);
            return (m || 0) * 60 + (s || 0);
        };
        const aAction = normalizeAction(a.action);
        const sourceAction = normalizeAction(localEntry.action);
        
        if (aAction === sourceAction && normalizeAction(b.action) !== sourceAction) return -1;
        if (aAction !== sourceAction && normalizeAction(b.action) === sourceAction) return 1;

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
    let color = '#84cc16'; // Tor (Lime)
    let gradId = 'g-lime-h-archive';
    let hasGlow = true;

    const act = (action || "").toLowerCase();
    if (act.includes('gehalten') || act.includes('parade')) {
      color = '#eab308'; // Gelb
      gradId = 'g-yellow-h-archive';
      hasGlow = true;
    } else if (act.includes('tor')) {
      color = '#84cc16';
      gradId = 'g-lime-h-archive';
      hasGlow = true;
    } else {
      color = '#71717a'; // Grau (Zinc-500)
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
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="flex items-center justify-between">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
              <StatSummaryCard 
                label="Endstand" 
                value={`${currentGame.score?.heim ?? currentGame.score?.home ?? 0} : ${currentGame.score?.gegner ?? currentGame.score?.away ?? 0}`} 
                icon={Target} 
                color="text-brand" 
              />
              <StatSummaryCard label="Team Effizienz" value={`${totalEfficiency}%`} icon={TrendingUp} color="text-brand" />
              <StatSummaryCard label="Torschützen" value={stats.filter(p => p.tore > 0).length} icon={Users} color="text-brand" />
            </div>
            
            <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 ml-6">
              <button 
                onClick={() => handleTeamChange('home')} 
                className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-tighter transition-all ${selectedTeam === 'home' ? 'bg-brand text-black shadow-[0_0_20px_rgba(132,204,22,0.3)]' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                Heim
              </button>
              <button 
                onClick={() => handleTeamChange('away')} 
                className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-tighter transition-all ${selectedTeam === 'away' ? 'bg-brand text-black shadow-[0_0_20px_rgba(132,204,22,0.3)]' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                Gegner
              </button>
            </div>
          </div>

          <Card noPadding title="Spielerstatistik" icon={BarChart2} className="shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-950/50 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    <th className="px-6 py-4 text-left">Spieler</th>
                    <th className="px-6 py-4 text-center text-brand">Tore</th>
                    <th className="px-6 py-4 text-center text-orange-400">7m</th>
                    <th className="px-6 py-4 text-center w-16">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-6 h-6 rounded-full border-2 border-zinc-500 flex items-center justify-center relative">
                          <span className="text-[10px] text-zinc-500">2</span>
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-zinc-500 rounded-full" />
                        </div>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center w-24">
                      <div className="flex items-center justify-center -space-x-2">
                        <div className="w-3 h-4 bg-yellow-500 rounded-sm border border-black/20 rotate-[-10deg]" />
                        <div className="w-3 h-4 bg-red-500 rounded-sm border border-black/20 rotate-[5deg] z-10" />
                        <div className="w-3 h-4 bg-blue-500 rounded-sm border border-black/20 rotate-[15deg]" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {stats.map((p, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400">#{p.id}</div>
                          <span className="text-sm font-bold text-zinc-100">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-black text-brand">{p.tore}</td>
                      <td className="px-6 py-4 text-center text-sm font-bold text-orange-400/80">{p.siebenMeterTore}/{p.siebenMeterVersuche}</td>
                      <td className="px-6 py-4 text-center">
                        {p.zweiMinuten > 0 && (
                          <span className="text-sm font-black text-zinc-100 italic">{p.zweiMinuten}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {p.gelb > 0 && <div className="w-3 h-4 bg-yellow-500 rounded-sm shadow-[0_0_10px_rgba(234,179,8,0.3)]" title="Gelbe Karte" />}
                          {p.rot > 0 && <div className="w-3 h-4 bg-red-500 rounded-sm shadow-[0_0_10px_rgba(239,68,68,0.3)]" title="Rote Karte" />}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeSubTab === 'stats' && (
        <Card noPadding title="Spielprotokoll (Aktionen)" icon={Clock} className="shadow-2xl overflow-hidden animate-in fade-in duration-500">
          <div className="max-h-[600px] overflow-y-auto">
            <div className="flex flex-col">
              {[...(currentGame.gameLog || currentGame.log || [])]
                .sort((a, b) => {
                  const sA = getSecs(a.time);
                  const hA = a.half || (sA > 1800 ? 2 : 1);
                  const sB = getSecs(b.time);
                  const hB = b.half || (sB > 1800 ? 2 : 1);
                  const normA = sA > 1800 ? sA - 1800 : sA;
                  const normB = sB > 1800 ? sB - 1800 : sB;
                  const absA = (hA - 1) * 1800 + normA;
                  const absB = (hB - 1) * 1800 + normB;
                  return absA - absB;
                })
                .map((entry, idx) => {
                const isGegner = entry.action?.startsWith('Gegner');
                return (
                  <div key={idx} className={`flex items-center gap-6 px-8 py-4 border-b border-zinc-800/50 hover:bg-white/5 transition-all ${isGegner ? 'opacity-60 bg-red-500/5' : ''} ${entry.isOfficialOnly ? 'bg-blue-500/5 border-l-2 border-l-blue-500' : ''}`}>
                    <div className="w-16 text-[10px] font-mono text-brand font-bold">{entry.time || '--:--'}</div>
                    <div className="flex items-center gap-3 w-14">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black ${isGegner ? 'bg-zinc-800 text-zinc-500' : 'bg-brand/10 text-brand'}`}>
                        {entry.playerId ?? entry.playerNumber ?? entry.gegnerNummer ?? '--'}
                      </div>
                      {entry.isSynced ? (
                        <div className="flex flex-col gap-0.5">
                          <CheckCircle2 size={10} className="text-green-500" />
                          {entry.isOfficialOnly && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleManualFix(entry); }}
                              className="px-1.5 py-0.5 bg-blue-500 text-white text-[6px] font-black rounded hover:scale-110 transition-all mt-1"
                            >
                              LINK
                            </button>
                          )}
                        </div>
                      ) : (
                        ["Tor", "2 Minuten", "Gelbe Karte", "Rote Karte"].some(a => entry.action.includes(a)) && (
                          <div className="flex flex-col items-center gap-1 group/fix">
                            <Activity size={10} className="text-red-500 animate-pulse" />
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleManualFix(entry); }}
                              className="px-1.5 py-0.5 bg-red-500 text-white text-[6px] font-black rounded border border-red-500/20 opacity-0 group-hover/fix:opacity-100 transition-all cursor-pointer hover:scale-110"
                            >
                              FIX
                            </button>
                          </div>
                        )
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-black text-zinc-100 uppercase tracking-widest flex items-center gap-2">
                        {entry.action}
                        {entry.isOfficialOnly && <Badge variant="outline" className="text-[7px] py-0.5 text-blue-400 border-blue-400/20">Official</Badge>}
                        {!entry.isSynced && ["Tor", "2 Minuten", "Gelbe Karte", "Rote Karte"].some(a => entry.action.includes(a)) && (
                          <span className="text-[7px] text-red-500/50 font-black italic ml-auto uppercase tracking-widest">Nicht abgeglichen</span>
                        )}
                      </p>
                      <p className="text-[10px] font-bold text-zinc-500">{entry.playerName || (isGegner ? 'Gegner' : 'Unbekannter Spieler')}</p>
                    </div>
                    <div className="text-[10px] font-black text-zinc-600 italic">
                      {entry.score || entry.spielstand || ''}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {activeSubTab === 'heatmap' && (
        <div className="w-full flex flex-col items-center gap-8 py-4 overflow-hidden animate-in fade-in duration-500">
          <Card noPadding className="w-full bg-zinc-900/40 backdrop-blur-2xl border border-white/5 p-2 rounded-[2rem] shadow-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5">
                <button onClick={() => handleTeamChange('home')} className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-tighter transition-all ${selectedTeam === 'home' ? 'bg-brand text-black shadow-[0_0_20px_rgba(132,204,22,0.3)]' : 'text-zinc-400 hover:text-zinc-200'}`}>Heimteam</button>
                <button onClick={() => handleTeamChange('away')} className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-tighter transition-all ${selectedTeam === 'away' ? 'bg-brand text-black shadow-[0_0_20px_rgba(132,204,22,0.3)]' : 'text-zinc-400 hover:text-zinc-200'}`}>Gegner</button>
              </div>
              <div className="h-8 w-[1px] bg-white/10 mx-2" />
              <Select 
                className="w-48"
                value={selectedPlayer} 
                onChange={(e) => setSelectedPlayer(e.target.value)}
                options={[
                  { value: 'all', label: selectedTeam === 'home' ? 'Kader Gesamt' : 'Gegner Gesamt' },
                  ...heatmapPlayers.map(p => ({ value: p.id, label: `#${p.id} - ${p.name}` }))
                ]}
              />
            </div>
            <div className="flex bg-black/20 p-1.5 rounded-2xl border border-white/5 mx-4">
              {[
                {id:'tor',l:'Tor',i:Target},
                {id:'feld',l:'Feld',i:Maximize2},
                {id:'kombi',l:'Kombi',i:Layers}
              ].map(btn => (
                <button key={`btn-${btn.id}`} onClick={() => setViewMode(btn.id)} className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === btn.id ? 'bg-white/10 text-white border border-white/10' : 'text-zinc-500 hover:text-zinc-300'}`}>
                  <btn.i size={14} className={viewMode === btn.id ? 'text-brand' : ''} /> {btn.l}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-6 pr-6">
              {[
                {id:'field',l:'Feld'},
                {id:'sevenM',l:'7m'},
                {id:'missed',l:'Fehl'}
              ].map(f => (
                <label key={`f-${f.id}`} className="flex items-center gap-2.5 cursor-pointer group">
                  <input type="checkbox" checked={filters[f.id]} onChange={(e) => setFilters(p => ({...p,[f.id]:e.target.checked}))} className="hidden" />
                  <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${filters[f.id] ? 'bg-brand border-brand shadow-[0_0_15px_rgba(132,204,22,0.2)]' : 'border-white/10 bg-white/5'}`}>
                    {filters[f.id] && <div className="w-2 h-2 bg-black rounded-sm" />}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${filters[f.id] ? 'text-zinc-200' : 'text-zinc-500'}`}>{f.l}</span>
                </label>
              ))}
            </div>
          </Card>

          <motion.div layout transition={{ type: "spring", stiffness: 180, damping: 25 }} className="w-full max-w-5xl bg-gradient-to-br from-[#121214] to-black border border-white/5 rounded-[3.5rem] p-10 relative shadow-3xl overflow-hidden flex flex-col items-center justify-start min-h-[500px]">
            <svg style={{ position: 'absolute', width: 0, height: 0 }}>
              <defs>
                <radialGradient id="g-lime-h-archive" x="50%" y="50%" r="50%"><stop offset="0%" stopColor="#84cc16" stopOpacity="0.4" /><stop offset="100%" stopColor="#84cc16" stopOpacity="0" /></radialGradient>
                <radialGradient id="g-red-h-archive" x="50%" y="50%" r="50%"><stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" /><stop offset="100%" stopColor="#ef4444" stopOpacity="0" /></radialGradient>
                <radialGradient id="g-yellow-h-archive" x="50%" y="50%" r="50%"><stop offset="0%" stopColor="#eab308" stopOpacity="0.4" /><stop offset="100%" stopColor="#eab308" stopOpacity="0" /></radialGradient>
              </defs>
            </svg>

            <motion.div layout className={`w-full bg-black/40 rounded-[2rem] border border-white/10 shadow-inner z-10 overflow-hidden flex flex-col items-center justify-center transition-colors duration-500 ${getCardStyles()}`} transition={{ type: "spring", stiffness: 150, damping: 25 }}>
              <AnimatePresence mode="wait" onExitComplete={() => setActiveLayoutMode(viewMode)}>
                <motion.div key={viewMode} initial={{ opacity: 0 }} animate={{ opacity: activeLayoutMode === viewMode ? 1 : 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="w-full h-full flex items-center justify-center">
                  {activeLayoutMode === viewMode && (
                    <>
                      {viewMode === 'tor' && (
                        <svg viewBox="0 0 350 230" className="w-full h-full overflow-visible">
                          <g transform="translate(50, 40)"><g opacity="0.15">{[...Array(9)].map((_, i) => <rect key={i} x={((i % 3) * 250) / 3} y={(Math.floor(i / 3) * 180) / 3} width={250 / 3} height={180 / 3} fill="none" stroke="white" strokeWidth="1" />)}</g><rect x="0" y="0" width="250" height="180" rx="2" fill="none" stroke="#3f3f46" strokeWidth="2" /></g>
                          {filteredPoints.map((p, idx) => {
                            const rawGoalPos = p.goalPos || p.details?.goalPos || p.metadata?.goalPos || p.wurfbild;
                            const pos = getCoordFromZone(rawGoalPos, 'goal');
                            if (!pos || pos.x === undefined) return null;
                            return renderShotMarker(50 + (pos.x / 100) * 250, 40 + (pos.y / 100) * 180, p.action, `sh-goal-${p.id || idx}`);
                          })}
                        </svg>
                      )}
                      {viewMode === 'feld' && (
                        <svg viewBox="0 0 200 245" className="w-full h-auto overflow-visible">
                          <g pointerEvents="none">
                            <line x1="10" y1="10" x2="190" y2="10" stroke="#3f3f46" strokeWidth="1" /><line x1="10" y1="10" x2="10" y2="245" stroke="#3f3f46" strokeWidth="1" /><line x1="190" y1="10" x2="190" y2="245" stroke="#3f3f46" strokeWidth="1" /><line x1="10" y1="240" x2="190" y2="240" stroke="#3f3f46" strokeWidth="1.5" />
                            <path d="M 25 10 A 60 60 0 0 0 85 70 L 115 70 A 60 60 0 0 0 175 10" fill="none" stroke="#84cc16" strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
                            <path d="M 10 60 A 90 90 0 0 0 85 100 L 115 100 A 90 90 0 0 0 190 60" fill="none" stroke="#84cc16" strokeWidth="1.5" strokeDasharray="8 6" opacity="0.25" />
                          </g>
                          {filteredPoints.map((p, idx) => {
                            const rawFieldPos = p.fieldPos || p.details?.fieldPos || p.metadata?.fieldPos || p.wurfposition;
                            const pos = getCoordFromZone(rawFieldPos, 'field');
                            if (!pos || pos.x === undefined) return null;
                            
                            let xPerc = parseFloat(pos.x);
                            let yPerc = parseFloat(pos.y);
                            // If it's a legacy wurfposition, it's relative to the half. We keep it as is.
                            return renderShotMarker((xPerc / 100) * 200, 10 + (yPerc / 100) * 230, p.action, `sh-field-${p.id || idx}`);
                          })}
                        </svg>
                      )}
                      {viewMode === 'kombi' && (
                        <svg viewBox="0 0 200 230" className="w-full h-auto overflow-hidden">
                          <g transform="translate(68, 18) scale(0.25)"><rect x="0" y="0" width="250" height="180" rx="2" fill="black" fillOpacity="0.2" stroke="#3f3f46" strokeWidth="3" /><g opacity="0.2">{[...Array(9)].map((_, i) => <rect key={i} x={((i % 3) * 250) / 3} y={(Math.floor(i / 3) * 180) / 3} width={250 / 3} height={180 / 3} fill="none" stroke="white" strokeWidth="2" />)}</g></g>
                          <g transform="translate(35, 56.5) scale(0.65)">
                            <path d="M 10 10 L 190 10 L 190 240 L 10 240 Z" fill="none" stroke="#3f3f46" strokeWidth="1.5" />
                            <path d="M 25 10 A 60 60 0 0 0 85 70 L 115 70 A 60 60 0 0 0 175 10" fill="none" stroke="#84cc16" strokeWidth="2.5" strokeLinecap="round" opacity="0.3" />
                            <path d="M 10 60 A 90 90 0 0 0 85 100 L 115 100 A 90 90 0 0 0 190 60" fill="none" stroke="#84cc16" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.2" />
                            <circle cx="100" cy="80" r="2" fill="#84cc16" opacity="0.3" />
                          </g>
                          {filteredPoints.map((p, idx) => {
                            const rawFPos = p.fieldPos || p.details?.fieldPos || p.metadata?.fieldPos || p.wurfposition;
                            const rawGPos = p.goalPos || p.details?.goalPos || p.metadata?.goalPos || p.wurfbild;
                            
                            const fPos = getCoordFromZone(rawFPos, 'field');
                            const gPos = getCoordFromZone(rawGPos, 'goal');
                            
                            if (!fPos || !gPos || fPos.x === undefined || gPos.x === undefined) return null;
                            
                            const fx = 35 + (fPos.x / 100) * 200 * 0.65;
                            const fy = 56.5 + (fPos.y / 100) * 245 * 0.65;
                            const gx = 68 + (gPos.x / 100) * 250 * 0.25;
                            const gy = 18 + (gPos.y / 100) * 180 * 0.25;
                            return (
                              <g key={idx}>
                                <line x1={fx} y1={fy} x2={gx} y2={gy} stroke={p.action.toLowerCase().includes('tor') ? '#84cc16' : (p.action.toLowerCase().includes('gehalten') || p.action.toLowerCase().includes('save')) ? '#eab308' : '#71717a'} strokeOpacity="0.5" strokeWidth="0.8" />
                                {renderShotMarker(fx, fy, p.action, `f-kombi-${idx}`, true)}
                                {renderShotMarker(gx, gy, p.action, `g-kombi-${idx}`, true)}
                              </g>
                            );
                          })}
                        </svg>
                      )}
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>
            <div className="absolute bottom-8 left-12 flex items-center gap-4 bg-black/40 backdrop-blur-md px-6 py-2.5 rounded-2xl border border-white/5 shadow-2xl">
              <div className="relative flex items-center justify-center"><div className="absolute w-2.5 h-2.5 bg-brand rounded-full animate-ping opacity-30" /><div className="w-1.5 h-1.5 bg-brand rounded-full shadow-[0_0_10px_#84cc16]" /></div>
              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest italic">{filteredPoints.length} Tactical Archive Points</span>
            </div>
          </motion.div>
        </div>
      )}
      
      {activeSubTab === 'torfolge' && (
        <Card noPadding className="p-10 shadow-2xl animate-in fade-in duration-700 h-[600px] flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-brand/10 rounded-2xl text-brand">
                <TrendingUp size={24} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-100">Torverlauf</h3>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Spielverlauf & Momentum Analyse</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                 <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Heim</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                 <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Gast</span>
               </div>
            </div>
          </div>

          <div className="flex-1 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={progressionData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHeim" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorGegner" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }}
                  interval={Math.floor(progressionData.length / 8)}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }}
                  allowDecimals={false}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <Card className="p-4 bg-zinc-950/90 backdrop-blur-xl border border-zinc-800 shadow-2xl space-y-2">
                          <p className="text-[10px] font-black text-brand uppercase tracking-widest">{d.time} Min.</p>
                          <div className="flex items-center gap-3">
                            <span className="text-xl font-black text-white italic">{d.heim} : {d.gegner}</span>
                          </div>
                          {d.player && (
                            <div className="pt-2 border-t border-zinc-900">
                               <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{d.isGegner ? 'Gast' : 'Heim'}</p>
                               <p className="text-xs font-bold text-zinc-100">{d.player}</p>
                            </div>
                          )}
                        </Card>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="heim" 
                  stroke="#3b82f6" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorHeim)" 
                  animationDuration={1500}
                />
                <Area 
                  type="monotone" 
                  dataKey="gegner" 
                  stroke="#ef4444" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorGegner)" 
                  animationDuration={1500}
                />
                <ReferenceLine x="30:00" stroke="#52525b" strokeDasharray="3 3" label={{ position: 'top', value: 'HZ', fill: '#52525b', fontSize: 10, fontWeight: 800 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-8 flex items-center justify-center gap-8">
            <div className="flex flex-col items-center">
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Max. Führung Heim</p>
              <p className="text-lg font-black text-blue-400 italic">+{Math.max(0, ...progressionData.map(d => d.heim - d.gegner))}</p>
            </div>
            <div className="w-[1px] h-8 bg-zinc-800" />
            <div className="flex flex-col items-center">
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Max. Führung Gast</p>
              <p className="text-lg font-black text-red-400 italic">+{Math.max(0, ...progressionData.map(d => d.gegner - d.heim))}</p>
            </div>
          </div>
        </Card>
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
                        <Activity size={32} className="text-zinc-800 mx-auto opacity-20" />
                        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Keine passenden offiziellen Events gefunden</p>
                        <p className="text-[9px] text-zinc-500 italic">Prüfe, ob die Aktion im offiziellen Ticker existiert.</p>
                    </div>
                ) : (
                    availableOfficial.map((off, idx) => (
                        <Card 
                            key={idx}
                            onClick={() => completeManualFix(off)}
                            className="p-4 bg-zinc-900 hover:bg-brand/10 border border-zinc-800 hover:border-brand/30 cursor-pointer transition-all group/item"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-zinc-950 flex items-center justify-center text-[10px] font-black text-brand">
                                        {off.time}
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-zinc-100 uppercase tracking-widest group-hover/item:text-brand transition-colors">{off.action}</p>
                                        <p className="text-[9px] font-bold text-zinc-500">{off.playerName}</p>
                                    </div>
                                </div>
                                <div className="text-xs font-black text-zinc-700 italic">{off.score || off.spielstand}</div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl">
                <p className="text-[10px] text-red-400 leading-relaxed">Wähle im offiziellen Protokoll den entsprechenden Eintrag aus, um ihn dauerhaft mit deiner taktischen Aufzeichnung zu verknüpfen.</p>
            </div>

            <Button variant="ghost" className="w-full py-4" onClick={() => setFixingEntry(null)}>Abbrechen</Button>
          </div>
        </div>
      </Modal>

      {/* Sync Modal */}
      <Modal 
        isOpen={isSyncModalOpen} 
        onClose={() => setIsSyncModalOpen(false)} 
        title="Handball.net Abgleich"
      >
        <div className="flex flex-col gap-6">
          <div className="p-4 bg-brand/5 border border-brand/10 rounded-2xl flex items-start gap-4">
            <div className="p-2 bg-brand/10 rounded-xl mt-1">
              <RefreshCw size={20} className="text-brand" />
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

const StatSummaryCard = ({ icon: Icon, label, value, color }) => (
  <Card className="p-6">
    <div className="flex items-center gap-5">
      <div className="w-14 h-14 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-100 shadow-xl">
        <Icon size={28} className={color} />
      </div>
      <div>
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{label}</p>
        <p className="text-3xl font-black text-zinc-100 italic tracking-tighter mt-1">{value}</p>
      </div>
    </div>
  </Card>
);

export default GameStatsTab;
