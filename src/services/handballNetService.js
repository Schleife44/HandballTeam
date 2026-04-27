/**
 * Handballnet Service - Modular implementation for V2
 * Handles API fetching via proxies, parsing, and synchronization.
 */

const PROXIES = [
  { name: 'CORSProxy.io', getUrl: (u) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`, parse: async (res) => await res.text() },
  { name: 'Codetabs', getUrl: (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`, parse: async (res) => await res.text() },
  { name: 'AllOrigins', getUrl: (u) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`, parse: async (res) => { const data = await res.json(); return data.contents; } }
];

export const fetchWithProxy = async (url, options = { json: true }) => {
  const cleanUrl = url.replace('webcal://', 'https://').trim();
  let content = null;
  let lastError = null;

  for (const proxy of PROXIES) {
    try {
      console.log(`[Hnet] Trying proxy: ${proxy.name} for ${cleanUrl}`);
      const res = await fetch(proxy.getUrl(cleanUrl));
      
      if (res.status === 403 || res.status === 429) {
        console.warn(`[Hnet] Proxy ${proxy.name} returned ${res.status}. Trying next...`);
        continue;
      }

      if (res.ok) {
        const raw = await proxy.parse(res);
        if (raw && raw.length > 5) {
          content = raw;
          break;
        }
      }
    } catch (err) {
      console.warn(`[Hnet] Proxy ${proxy.name} failed: ${err.message}`);
      lastError = err;
    }
  }

  if (!content) throw new Error(lastError ? `Proxy Error: ${lastError.message}` : "Content could not be loaded.");
  
  if (options.json) {
    try {
      return JSON.parse(content);
    } catch (e) {
      throw new Error("Invalid JSON response from proxy.");
    }
  }
  return content;
};

// =============================================================================
// PARSING
// =============================================================================

export const parseGameId = (url) => {
  try {
    const parts = url.split('/');
    for (let i = 0; i < parts.length; i++) {
      if (parts[i] === 'spiele' && parts[i + 1]) {
        return parts[i + 1].split('?')[0];
      }
    }
    return null;
  } catch (e) {
    return null;
  }
};

const toSecs = (str) => {
  if (!str) return 0;
  const pts = str.split(':');
  return parseInt(pts[0]) * 60 + (parseInt(pts[1]) || 0);
};

export const normalizeAction = (action) => {
  if (!action) return "";
  let a = action.toLowerCase();
  
  // Disciplinary / Special
  if (a.includes("2 min") || a.includes("2min") || a.includes("zeitstrafe") || a.includes("hinausstellung") || a.includes("penalty") || a === 'two_min') return "penalty";
  if (a.includes("gelb") || a === 'yellow') return "yellow";
  if (a.includes("rot") || a.includes("disqualifikation") || a === 'red') return "red";
  if (a.includes("blau") || a === 'blue') return "blue";
  
  // Seven Meter (Check this BEFORE general goal/miss)
  if (a.includes("7m") || a.includes("siebenmeter")) return "seven_meter";
  
  // Shots
  if (/\btor\b/.test(a) || a.includes("goal")) return "goal";
  if (a.includes("parade") || a.includes("vorbei") || a.includes("fehlwurf") || a.includes("pfosten") || a.includes("latte") || a.includes("miss") || a.includes("save") || a.includes("blocked")) return "miss";
  
  if (a.includes("timeout")) return "timeout";
  if (a.includes("halbzeit")) return "halftime";
  if (a.includes("ende")) return "end";
  return a;
};

// =============================================================================
// FETCHING
// =============================================================================

export const fetchGameData = async (gameId) => {
  const url = `https://www.handball.net/a/sportdata/1/games/${gameId}/combined`;
  return await fetchWithProxy(url, { json: true });
};

// =============================================================================
// MAPPING & SYNC
// =============================================================================

export const mapToInternal = (rawJson, myTeamName = "") => {
  const data = rawJson.data || rawJson;
  if (!data || !data.summary) throw new Error("Invalid data format.");

  const summary = data.summary;
  const homeTeam = summary.homeTeam || { name: "Heim" };
  const awayTeam = summary.awayTeam || { name: "Gast" };

  const homeName = (homeTeam.name || "").toLowerCase();
  const awayName = (awayTeam.name || "").toLowerCase();
  const searchName = (myTeamName || "").toLowerCase();

  let isAuswaerts = false;
  if (searchName) {
    const s = searchName.toLowerCase().trim();
    const h = homeName.toLowerCase().trim();
    const a = awayName.toLowerCase().trim();
    
    const homeMatch = h.includes(s) || s.includes(h);
    const awayMatch = a.includes(s) || s.includes(a);

    if (awayMatch && !homeMatch) isAuswaerts = true;
    else if (homeMatch && awayMatch) {
      // If both match, pick the one that is closer in length (better match)
      isAuswaerts = Math.abs(a.length - s.length) < Math.abs(h.length - s.length);
    }
  }

  const lineup = data.lineup || {};
  const ourHnetPlayers = isAuswaerts ? (lineup.away || []) : (lineup.home || []);
  const theirHnetPlayers = isAuswaerts ? (lineup.home || []) : (lineup.away || []);

  const mapPlayers = (list) => list.map(p => ({
    name: (p.player?.firstname || p.firstname || "") + " " + (p.player?.lastname || p.lastname || ""),
    number: String(p.player?.jerseyNumber || p.jerseyNumber || p.number || ""),
    isGoalkeeper: !!(p.position?.toLowerCase().includes('torwart'))
  })).map(p => {
    if (p.name.trim() === "N.N. N.N." || !p.name.trim()) p.name = `Spieler #${p.number || '?'}`;
    return p;
  });

  const roster = mapPlayers(ourHnetPlayers);
  const knownOpponents = mapPlayers(theirHnetPlayers);

  const events = (data.events || []).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  const gameLog = [];
  let splitIndex = -1;
  let maxTimeSeen = -1;

  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    if (!e.time) continue;
    const s = toSecs(e.time);
    if (e.type === 'StopPeriod' && s > 1500 && s < 3300) { splitIndex = i; break; }
    if (maxTimeSeen > 1600 && s < maxTimeSeen - 600 && s < 600) { splitIndex = i; break; }
    maxTimeSeen = Math.max(maxTimeSeen, s);
  }

  events.forEach((e, idx) => {
    if (!e.time && e.type !== 'StopPeriod') return;
    const isOurAction = (isAuswaerts && e.team === 'Away') || (!isAuswaerts && e.team === 'Home');
    const getSecs = (str) => {
        if (!str) return 0;
        const pts = str.split(':');
        return (parseInt(pts[0]) || 0) * 60 + (parseInt(pts[1]) || 0);
    };
    const s = getSecs(e.time);
    let currentHalf = (splitIndex !== -1 && idx > splitIndex) ? 2 : 1;
    // Safety fallback: If time is > 30:00, it's definitely 2nd half (cumulative)
    if (s > 1800) currentHalf = 2;

    if (e.type === 'StopPeriod' || (e.message && e.message.toLowerCase().includes('halbzeit'))) {
      const isH1 = toSecs(e.time) < 2400;
      gameLog.push({
        time: e.time || (isH1 ? '30:00' : '60:00'),
        action: isH1 ? 'Halbzeit' : 'Spielende',
        half: isH1 ? 1 : 2,
        timestamp: e.timestamp || null,
        spielstand: e.score || "",
        importMeta: { hnetId: `period_${idx}` }
      });
      return;
    }

    let action = null;
    const t = (e.type || "").toLowerCase();
    if (t.includes('goal')) {
      action = isOurAction ? 'Tor' : 'Gegner Tor';
      if (t.includes('seven')) action = isOurAction ? '7m Tor' : 'Gegner 7m Tor';
    } 
    else if (t.includes('penalty')) action = isOurAction ? '2 Minuten' : 'Gegner 2 Minuten';
    else if (t.includes('yellow')) action = isOurAction ? 'Gelbe Karte' : 'Gegner Gelbe Karte';
    else if (t.includes('red') || t.includes('disqualification')) action = isOurAction ? 'Rote Karte' : 'Gegner Rote Karte';
    else if (t.includes('timeout')) action = isOurAction ? 'Timeout' : 'Gegner Timeout';

    if (!action) return;

    let num = e.player?.jerseyNumber || "";
    if (!num && e.message) {
      const m = e.message.match(/\((\d+)\.?\)/) || e.message.match(/durch (\d+)\. \(/i);
      if (m) num = m[1];
    }

    gameLog.push({
      time: e.time || '00:00',
      action: action,
      half: currentHalf,
      timestamp: e.timestamp || null,
      playerName: isOurAction ? (roster.find(p => p.number === String(num))?.name || `Spieler #${num}`) : (knownOpponents.find(p => p.number === String(num))?.name || `Gegner #${num}`),
      playerId: isOurAction ? String(num) : null,
      gegnerNummer: !isOurAction ? String(num) : null,
      spielstand: e.score || "",
      fieldPos: e.metadata?.fieldPos || null,
      goalPos: e.metadata?.goalPos || null,
      importMeta: { hnetId: e.id || `event_${idx}` }
    });
  });

  return {
    id: summary.id,
    date: new Date(summary.startsAt).toISOString(),
    score: { heim: summary.homeGoals || 0, gegner: summary.awayGoals || 0 },
    teams: { heim: homeTeam.name, gegner: awayTeam.name },
    gameLog,
    roster,
    knownOpponents,
    isSynced: false,
    hnetGameId: summary.id,
    homeTeamId: homeTeam.id,
    awayTeamId: awayTeam.id,
    timestamp: new Date(summary.startsAt).getTime(),
    settings: { teamNameHeim: homeTeam.name, teamNameGegner: awayTeam.name, isAuswaertsspiel: isAuswaerts }
  };
};

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
  
  const report = {
    matched: 0,
    unmatched: 0,
    added: 0,
    totalLocal: localLog.length,
    totalOfficial: hnet.gameLog.length
  };

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
      const hParts = hNameFull.split(/\s+/);
      const lParts = lNameFull.split(/\s+/);
      const hLastName = hParts[hParts.length - 1] || "";
      const lLastName = lParts[lParts.length - 1] || "";

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
      // Only count as 'unmatched' if it's an action that Handball.net actually tracks
      const officialTypes = ["goal", "penalty", "yellow", "red", "timeout", "halftime", "end"];
      if (officialTypes.includes(localAction)) {
        report.unmatched++;
      }
    }
  });

  const unmatchedOfficial = [];
  hnet.gameLog.forEach(h => {
    if (matchedHnetIds.has(h.importMeta.hnetId)) return;
    const officialTypes = ["goal", "penalty", "yellow", "red", "timeout", "halftime", "end"];
    if (officialTypes.includes(normalizeAction(h.action))) {
      unmatchedOfficial.push(h);
    }

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
      teamNameHeim: hnet.teams.heim,
      teamNameGegner: hnet.teams.gegner
    }
  };
};

export const fetchTeamTable = async (teamId) => {
  const url = `https://www.handball.net/a/sportdata/1/widgets/team/${teamId}/table`;
  return await fetchWithProxy(url, { json: true });
};

export const fetchTournamentSchedule = async (tournamentId, dateFrom, dateTo, teamId = null) => {
  let url = `https://www.handball.net/a/sportdata/1/widgets/tournament/${tournamentId}/schedule?dateFrom=${dateFrom}&dateTo=${dateTo}`;
  if (teamId) url += `&teamId=${teamId}`;
  
  console.log(`[Hnet] Fetching schedule: ${dateFrom} to ${dateTo} (Team: ${teamId})`);
  const data = await fetchWithProxy(url, { json: true });
  
  if (data && data.schedule && Array.isArray(data.schedule.data)) {
    console.log(`[Hnet] Found ${data.schedule.data.length} total games in this period.`);
    return data.schedule.data;
  }
  console.warn(`[Hnet] No schedule data found for period ${dateFrom} - ${dateTo}`);
  return [];
};
export const syncToCalendar = async (inputTeamId, teamName = "Wir") => {
  const fullId = inputTeamId.trim();
  const numericId = (fullId.match(/(\d+)$/) || [])[1] || fullId;
  const teamId = fullId; // For compatibility with existing logic below
  
  console.log(`[Hnet] Starting Deep Sync for team: ${fullId} (Numeric: ${numericId})`);
  
  let rawResponse = null;
  let response = null;

  // STAGE 1: Modern Slug-based Endpoint (Full ID)
  const url1 = `https://www.handball.net/a/sportdata/1/widgets/team/${fullId}/team-schedule?dateFrom=2025-07-01&dateTo=2026-06-30`;
  rawResponse = await fetchWithProxy(url1);
  response = rawResponse?.data || rawResponse;

  // STAGE 2: Legacy Widget Endpoint (Numeric ID)
  if (!response?.schedule?.data || rawResponse?.code === 404) {
    console.log(`[Hnet] Stage 1 failed, trying Stage 2 (Numeric ID)...`);
    const url2 = `https://www.handball.net/a/sportdata/1/widgets/schedule?teamId=${numericId}&dateFrom=2025-07-01&dateTo=2026-06-30`;
    rawResponse = await fetchWithProxy(url2);
    response = rawResponse?.data || rawResponse;
  }

  // STAGE 3: Direct Schedule Endpoint (Numeric ID)
  if (!response?.schedule?.data || rawResponse?.code === 404) {
    console.log(`[Hnet] Stage 2 failed, trying Stage 3 (Direct API)...`);
    const url3 = `https://www.handball.net/a/sportdata/1/widgets/schedule?teamId=${numericId}`;
    rawResponse = await fetchWithProxy(url3);
    response = rawResponse?.data || rawResponse;
  }
  
  if (!response?.schedule?.data) {
    console.error("[Hnet] All Sync Stages Failed. Last Response:", rawResponse);
    throw new Error(`Konnte keine Spielplandaten für ID "${fullId}" finden. Bitte stelle sicher, dass die ID exakt so im Link deines Teams steht.`);
  }

  const myGames = response.schedule.data;
  console.log(`[Hnet] Found ${myGames.length} games for your team.`);
  const results = [];
  const now = new Date();
  console.log(`[Hnet] Current Time for Status Check: ${now.toISOString()}`);

  for (const game of myGames) {
    const isHome = String(game.homeTeam?.id) === String(numericId);
    const opponent = isHome ? game.awayTeam?.name : game.homeTeam?.name;
    const startDate = new Date(game.startsAt);
    const isPast = startDate < now;
    
    console.log(`[Hnet] Processing Game ${game.id}: ${startDate.toISOString()} - Past: ${isPast} - Opponent: ${opponent} - isHome: ${isHome}`);

    let eventData = {
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
    };


    results.push(eventData);
  }

  console.log(`[Hnet] Sync complete. Created ${results.length} events.`);
  return results;
};
