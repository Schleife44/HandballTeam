/**
 * Hnet Sync & Logic Utilities
 */
import { fetchGameData, fetchTeamSchedule } from './hnetFetcher';
import { parseGameId, mapToInternal, normalizeAction, toSecs } from './hnetMapper';

export const interpolateTimestamps = (log) => {
  const sorted = [...log].sort((a, b) => {
    const getAbs = (e) => (e.half - 1) * 1800 + toSecs(e.time);
    return getAbs(a) - getAbs(b);
  });

  for (let i = 0; i < sorted.length; i++) {
    if (!sorted[i].timestamp) {
      const h = sorted[i].half;
      let prev = null, next = null;
      for (let j = i - 1; j >= 0; j--) if (sorted[j].timestamp && sorted[j].half === h) { prev = sorted[j]; break; }
      for (let j = i + 1; j < sorted.length; j++) if (sorted[j].timestamp && sorted[j].half === h) { next = sorted[j]; break; }

      if (prev && next) {
        const t1 = toSecs(prev.time), t2 = toSecs(next.time), tc = toSecs(sorted[i].time);
        if (t2 > t1) sorted[i].timestamp = prev.timestamp + (next.timestamp - prev.timestamp) * ((tc - t1) / (t2 - t1));
      } else if (prev) {
        sorted[i].timestamp = prev.timestamp + (toSecs(sorted[i].time) - toSecs(prev.time)) * 1000;
      } else if (next) {
        sorted[i].timestamp = next.timestamp - (toSecs(next.time) - toSecs(sorted[i].time)) * 1000;
      }
      if (sorted[i].timestamp) sorted[i].isInterpolated = true;
    }
  }
  return sorted;
};

export const syncGame = async (game, url, searchName) => {
  const gameId = parseGameId(url);
  if (!gameId) throw new Error("Invalid URL");
  
  const raw = await fetchGameData(gameId);
  const hnet = mapToInternal(raw, searchName || game.settings?.myTeamName);
  
  const localLog = game.gameLog || [];
  const syncedLog = [...localLog];
  const matchedHnetIds = new Set();
  
  const report = { matched: 0, unmatched: 0, added: 0, totalLocal: localLog.length, totalOfficial: hnet.gameLog.length };

  syncedLog.forEach(local => {
    const localSecs = toSecs(local.time);
    const localAction = normalizeAction(local.action);
    const localNum = local.playerId ?? local.playerNumber ?? local.gegnerNummer ?? local.number ?? local.player;
    const localScore = local.score || local.spielstand;

    const bestMatch = hnet.gameLog.find(h => {
      if (matchedHnetIds.has(h.importMeta.hnetId)) return false;
      if (localAction !== normalizeAction(h.action)) return false;
      const hSecs = toSecs(h.time);
      if (Math.abs(hSecs - localSecs) > 120) return false;
      
      const hNum = h.playerId ?? h.playerNumber ?? h.gegnerNummer ?? h.number ?? h.player;
      const hNameFull = (h.playerName || "").toLowerCase().trim();
      const lNameFull = (local.playerName || "").toLowerCase().trim();
      const hLastName = hNameFull.split(/\s+/).pop() || "";
      const lLastName = lNameFull.split(/\s+/).pop() || "";

      const numberMatch = localNum && hNum && String(localNum) === String(hNum);
      const nameMatch = lLastName && hLastName && lLastName === hLastName;

      if (localNum && hNum && !numberMatch && !nameMatch) return false;
      if (!numberMatch && !nameMatch && lLastName && hLastName && lLastName !== hLastName) return false;
      
      const hScore = h.score || h.spielstand;
      if (localScore && hScore && localScore !== hScore) {
        if (Math.abs(hSecs - localSecs) > 10) return false;
      }
      return true;
    });

    if (bestMatch) {
      local.timestamp = bestMatch.timestamp;
      local.officialTime = bestMatch.time;
      local.hnetId = bestMatch.importMeta.hnetId;
      local.isSynced = true;
      matchedHnetIds.add(local.hnetId);
      report.matched++;
    } else {
      local.isSynced = false;
      const officialTypes = ["goal", "penalty", "yellow", "red", "timeout", "halftime", "end"];
      if (officialTypes.includes(localAction)) report.unmatched++;
    }
  });

  const unmatchedOfficial = [];
  hnet.gameLog.forEach(h => {
    if (matchedHnetIds.has(h.importMeta.hnetId)) return;
    const officialTypes = ["goal", "penalty", "yellow", "red", "timeout", "halftime", "end"];
    if (officialTypes.includes(normalizeAction(h.action))) unmatchedOfficial.push(h);

    const important = ["Timeout", "Gelbe Karte", "Rote Karte", "Halbzeit", "Spielende", "2 Minuten"];
    if (important.some(t => h.action.includes(t)) || (h.action.includes("Tor") && !syncedLog.some(l => l.hnetId === h.importMeta.hnetId))) {
      syncedLog.push({ ...h, isOfficialOnly: true, isSynced: true });
      matchedHnetIds.add(h.importMeta.hnetId);
      report.added++;
    }
  });

  report.unmatchedOfficial = unmatchedOfficial;

  const interpolated = interpolateTimestamps(syncedLog);
  return { 
    ...game, 
    gameLog: interpolated, 
    isSynced: true, 
    hnetGameId: gameId,
    syncReport: report,
    settings: {
      ...game.settings,
      teamHome: hnet.teams.heim,
      teamAway: hnet.teams.gegner,
      teamNameHeim: hnet.teams.heim,
      teamNameGegner: hnet.teams.gegner
    }
  };
};

export const syncToCalendar = async (inputTeamId, teamName = "Wir") => {
  let fullId = (inputTeamId || "").trim();
  const numericId = (fullId.match(/(\d+)$/) || [])[1] || fullId;
  
  const myGames = await fetchTeamSchedule(fullId);
  if (!myGames || myGames.length === 0) {
    throw new Error(`Konnte keine Spielplandaten für ID "${fullId}" finden.`);
  }
  
  const results = [];
  const now = new Date();

  for (const game of myGames) {
    const isHome = String(game.homeTeam?.id) === String(numericId);
    const opponent = isHome ? game.awayTeam?.name : game.homeTeam?.name;
    const startDate = new Date(game.startsAt);
    const isPast = startDate < now;
    
    results.push({
      id: `hnet_${game.id}`,
      hnetGameId: game.id,
      title: isHome ? `${teamName} vs. ${opponent}` : `${opponent} vs. ${teamName} (A)`,
      date: startDate.toISOString().slice(0, 10),
      time: startDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
      type: 'SPIEL',
      location: game.field?.name || '',
      isAuswaerts: !isHome,
      opponent: opponent,
      status: isPast ? 'archived' : 'upcoming'
    });
  }

  return results;
};
