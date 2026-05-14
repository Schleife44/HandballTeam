/**
 * Hnet Mapping & Normalization Utilities
 */

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

export const toSecs = (str) => {
  if (!str) return 0;
  const pts = str.split(':');
  return (parseInt(pts[0]) || 0) * 60 + (parseInt(pts[1]) || 0);
};

export const normalizeAction = (action) => {
  if (!action) return "";
  let a = action.toLowerCase();
  
  if (a.includes("2 min") || a.includes("2min") || a.includes("zeitstrafe") || a.includes("hinausstellung") || a.includes("penalty") || a === 'two_min') return "penalty";
  if (a.includes("gelb") || a === 'yellow') return "yellow";
  if (a.includes("rot") || a.includes("disqualifikation") || a === 'red') return "red";
  if (a.includes("blau") || a === 'blue') return "blue";
  
  if (a.includes("7m") || a.includes("siebenmeter")) return "seven_meter";
  
  if (/\btor\b/.test(a) || a.includes("goal")) return "goal";
  if (a.includes("parade") || a.includes("vorbei") || a.includes("fehlwurf") || a.includes("pfosten") || a.includes("latte") || a.includes("miss") || a.includes("save") || a.includes("blocked")) return "miss";
  
  if (a.includes("timeout")) return "timeout";
  if (a.includes("halbzeit")) return "halftime";
  if (a.includes("ende")) return "end";
  return a;
};

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
    const s = searchName.trim();
    const h = homeName.trim();
    const a = awayName.trim();
    
    const homeMatch = h.includes(s) || s.includes(h);
    const awayMatch = a.includes(s) || s.includes(a);

    if (awayMatch && !homeMatch) isAuswaerts = true;
    else if (homeMatch && awayMatch) {
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
    const s = toSecs(e.time);
    let currentHalf = (splitIndex !== -1 && idx > splitIndex) ? 2 : 1;
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
    else if (t.includes('miss') || t.includes('save') || t.includes('parade') || t.includes('vorbei') || t.includes('post') || t.includes('woodwork')) {
      action = isOurAction ? 'Fehlwurf' : 'Gegner Fehlwurf';
      if (t.includes('seven')) action = isOurAction ? '7m verworfen' : 'Gegner 7m verworfen';
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

    let type = "";
    if (action.includes('Tor')) type = action.includes('7m') ? '7M_GOAL' : 'GOAL';
    else if (action.includes('Fehlwurf') || action.includes('verworfen')) type = action.includes('7m') ? '7M_MISS' : 'MISS';
    else if (action.includes('Gelbe')) type = 'YELLOW';
    else if (action.includes('2 Minuten')) type = 'SUSPENSION';
    else if (action.includes('Rote')) type = 'RED';
    else if (action.includes('Timeout')) type = 'TIMEOUT';

    gameLog.push({
      time: e.time || '00:00',
      action: action,
      type: type,
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
    teamHome: homeTeam.name,
    teamAway: awayTeam.name,
    scoreHome: summary.homeGoals || 0,
    scoreAway: summary.awayGoals || 0,
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
    season: (() => {
      const date = new Date(summary.startsAt);
      const year = date.getFullYear();
      const month = date.getMonth();
      return month >= 6 ? `${String(year).slice(-2)}/${String(year + 1).slice(-2)}` : `${String(year - 1).slice(-2)}/${String(year).slice(-2)}`;
    })(),
    settings: { 
      teamHome: homeTeam.name, 
      teamAway: awayTeam.name, 
      teamNameHeim: homeTeam.name, 
      teamNameGegner: awayTeam.name, 
      isAuswaertsspiel: isAuswaerts 
    }
  };
};
