import { useMemo } from 'react';
import { normalizeAction } from '../services/handballNetService';

export function useGameStatsCalculations(currentGame, selectedTeam, selectedPlayer, filters) {
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

        let rawNumber = entry.playerNumber ?? entry.gegnerNummer ?? entry.number ?? entry.player ?? entry.playerId;
        let rawId = entry.playerId ?? entry.playerNumber ?? entry.gegnerNummer ?? entry.number ?? entry.player;
        if (rawId === undefined || rawId === null || rawId === "") return;
        
        const pId = String(rawId);
        const pNumber = String(rawNumber);
        
        if (!playerStats[pId]) {
          const pName = entry.playerName || (isOpponentAction ? `Gegner #${pNumber}` : `Spieler #${pNumber}`);
          playerStats[pId] = { id: pId, name: pName, tore: 0, fehlwurf: 0, siebenMeterTore: 0, siebenMeterVersuche: 0, gelb: 0, zweiMinuten: 0, rot: 0, number: pNumber };
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
      return hasCoords;
    });
  }, [currentGame, selectedTeam, selectedPlayer, filters]);

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

  return { progressionData, stats, filteredPoints, heatmapPlayers };
}
