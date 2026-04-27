import { useState, useEffect, useCallback, useRef } from 'react';
import useStore from '../store/useStore';

const imageCache = new Map();

export const useResultImage = (gameData) => {
  const { 
    socialSettings: settings, 
    updateSocialSettings: setSettings,
    squad,
    history
  } = useStore();

  const [previewMode, setPreviewMode] = useState('actual');
  const canvasRef = useRef(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedElement, setSelectedElement] = useState(null);
  const [currentBoxes, setCurrentBoxes] = useState([]);
  const [renderTrigger, setRenderTrigger] = useState(0);

  useEffect(() => {
    const legacy = localStorage.getItem('sechsmeter_v2_social_settings_v6');
    if (legacy && !settings.migrated) {
      try {
        const parsed = JSON.parse(legacy);
        setSettings({ ...parsed, migrated: true });
        localStorage.removeItem('sechsmeter_v2_social_settings_v6');
      } catch (e) { console.error("Legacy social migration failed", e); }
    }
  }, [settings, setSettings]);

  useEffect(() => {
    const fonts = ['Oswald', 'Bebas Neue', 'Montserrat', 'Outfit', 'Inter', 'Teko', 'Racing Sans One'];
    
    // 1. Add Google Fonts Link
    const linkId = 'google-fonts-studio';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.href = `https://fonts.googleapis.com/css2?family=${fonts.map(f => f.replace(' ', '+')).join(':wght@400;700;900&family=')}:wght@400;700;900&display=swap`;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }

    // 2. Font Warming: Create hidden elements to force browser to load fonts
    const warmerId = 'font-warmer-studio';
    let warmer = document.getElementById(warmerId);
    if (!warmer) {
      warmer = document.createElement('div');
      warmer.id = warmerId;
      warmer.style.position = 'absolute';
      warmer.style.top = '-9999px';
      warmer.style.left = '-9999px';
      warmer.style.visibility = 'hidden';
      document.body.appendChild(warmer);
    }
    
    warmer.innerHTML = fonts.map(f => `<span style="font-family: '${f}'; font-weight: 900;">warm</span>`).join('');

    // 3. Wait for all fonts to be ready
    if (document.fonts) {
      document.fonts.ready.then(() => {
        setRenderTrigger(t => t + 1);
      });
    }
  }, []);

  const loadImage = useCallback(async (src) => {
    if (!src) return null;
    if (imageCache.has(src)) return imageCache.get(src);
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => { imageCache.set(src, img); setRenderTrigger(t => t + 1); resolve(img); };
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }, []);

  useEffect(() => {
    loadImage(settings.backgroundImage);
    loadImage(settings.teamLogo);
  }, [settings.backgroundImage, settings.teamLogo, loadImage]);

  const updatePosition = (key, updates) => {
    setSettings({ positions: { ...settings.positions, [key]: { ...settings.positions[key], ...updates } } });
  };

  const updateSettings = (updates) => setSettings(updates);

  // Safe position access helper
  const getP = useCallback((key) => {
    const defaults = {
      ergebnisLabel: { x: 230, y: 920, fontSize: 110, bold: true, scale: 1, rotation: 0 },
      seasonLabel: { x: 230, y: 550, fontSize: 24, bold: false, scale: 1, rotation: 0 },
      statusGroup: { x: 800, y: 160, fontSize: 82, bold: false, scale: 1, rotation: 0 },
      dateLabel: { x: 780, y: 310, fontSize: 24, bold: false, scale: 1, rotation: 0 },
      vsLabel: { x: 630, y: 570, fontSize: 22, bold: false, scale: 1, rotation: 0 },
      ourScore: { x: 650, y: 440, fontSize: 180, bold: false, scale: 1, rotation: 0 },
      theirScore: { x: 650, y: 620, fontSize: 180, bold: false, scale: 1, rotation: 0 },
      teamLabel: { x: 510, y: 830, fontSize: 22, bold: false, scale: 1, rotation: 0 },
      logo: { x: 470, y: 850, scale: 1, rotation: 0 },
      separatorLine: { x: 250, y: 225, width: 550, thickness: 3, scale: 1, rotation: 0 }
    };
    return { ...defaults[key], ...(settings?.positions?.[key] || {}) };
  }, [settings]);

  const getLastName = (name) => name ? name.trim().split(' ').pop() : '';

  const aggregateScorers = (game) => {
    if (!game) return [];
    const scorersMap = {};
    const log = game.gameLog || game.log || [];
    log.forEach(entry => {
      if (entry.action?.includes('Tor') && entry.playerName && !entry.action.includes('Gegner')) {
        const name = entry.playerName;
        scorersMap[name] = (scorersMap[name] || 0) + 1;
      }
    });
    if (Object.keys(scorersMap).length === 0 && game.roster) {
      game.roster.forEach(p => {
        const g = p.goals || p.goalsCount || 0;
        if (g > 0) scorersMap[p.name] = g;
      });
    }
    return Object.entries(scorersMap)
      .map(([name, goals]) => ({ name, goals }))
      .sort((a, b) => b.goals - a.goals);
  };

  const generateGameSummary = (game) => {
    const log = game.gameLog || [];
    const isA = game.settings?.isAuswaertsspiel;
    const sH = game.score?.heim || 0;
    const sG = game.score?.gegner || 0;
    
    const pS = (s) => {
      if (!s || typeof s !== 'string') return { h: 0, g: 0 };
      const parts = s.split(':');
      return { h: parseInt(parts[0]) || 0, g: parseInt(parts[1]) || 0 };
    };

    let htScore = { h: 0, g: 0 };
    let earlyScore = { h: 0, g: 0 };
    let midSecondScore = { h: 0, g: 0 };
    let crunchScore = { h: 0, g: 0 };
    
    if (log.length > 0) {
      const htEntry = log.find(e => e.action?.toLowerCase().includes('halbzeit')) || log[Math.floor(log.length / 2)] || log[0];
      if (htEntry) htScore = pS(htEntry.score || htEntry.spielstand || "0:0");
      
      const earlyEntry = log.find(e => {
        const mins = parseInt(e.time?.split(':')[0]);
        return mins >= 8 && mins <= 12;
      }) || log[Math.min(log.length - 1, 5)];
      earlyScore = pS(earlyEntry.score || earlyEntry.spielstand);

      const midSecondEntry = log.find(e => {
        const mins = parseInt(e.time?.split(':')[0]);
        return mins >= 42 && mins <= 48;
      }) || log[Math.min(log.length - 1, Math.floor(log.length * 0.75))];
      midSecondScore = pS(midSecondEntry.score || midSecondEntry.spielstand);

      const crunchEntry = log.find(e => {
        const mins = parseInt(e.time?.split(':')[0]);
        return mins >= 52 && mins <= 57;
      }) || log[Math.min(log.length - 1, Math.floor(log.length * 0.9))];
      crunchScore = pS(crunchEntry.score || crunchEntry.spielstand);
    } else {
      htScore = { h: Math.round(sH * 0.45), g: Math.round(sG * 0.45) };
      midSecondScore = { h: Math.round(sH * 0.7), g: Math.round(sG * 0.7) };
      crunchScore = { h: Math.round(sH * 0.85), g: Math.round(sG * 0.85) };
    }

    const getDiff = (sc) => isA ? sc.g - sc.h : sc.h - sc.g;
    const earlyDiff = getDiff(earlyScore);
    const htDiff = getDiff(htScore);
    const midSecondDiff = getDiff(midSecondScore);
    const crunchDiff = getDiff(crunchScore);
    const finalDiff = isA ? sG - sH : sH - sG;

    const seed = String(game.id || game.timestamp || "seed");
    const pick = (arr, salt) => {
      let hash = 0;
      const combined = seed + salt;
      for (let i = 0; i < combined.length; i++) {
        hash = ((hash << 5) - hash) + combined.charCodeAt(i);
        hash |= 0;
      }
      const idx = Math.abs(hash) % arr.length;
      return arr[idx];
    };

    let n = "";

    if (earlyDiff > 2) {
      n += pick(["Wir legten los wie die Feuerwehr und ließen dem Gegner in der Anfangsphase kaum Raum zur Entfaltung. Die Zuschauer sahen eine hochmotivierte Mannschaft, die jeden Fehler eiskalt bestrafte. ", "Ein Start nach Maß in eigener Halle! Von der ersten Sekunde an stimmte die Abstimmung in der Defensive, was uns einfache Ballgewinne und schnelle Umschaltmomente ermöglichte. ", "Wir fanden sofort den richtigen Rhythmus und konnten uns bereits nach wenigen Minuten ein kleines Polster erarbeiten, was uns für den weiteren Spielverlauf sichtlich Sicherheit gab. ", "Hochkonzentriert und mit der nötigen Aggressivität starteten wir in die Partie. Besonders die ersten Angriffe wurden konsequent zu Ende gespielt, sodass wir früh ein Ausrufezeichen setzen konnten. "], "start");
    } else if (earlyDiff < -2) {
      n += pick(["Der Start verlief leider alles andere als optimal. Wir wirkten in den ersten Minuten etwas schläfrig und fanden keinen richtigen Zugriff auf die schnellen Angreifer des Gegners. ", "In der Anfangsphase hatten wir sichtlich Sand im Getriebe. Technische Fehler und überhastete Abschlüsse führten dazu, dass wir früh einem Rückstand hinterherlaufen mussten. ", "Wir taten uns zu Beginn extrem schwer, die nötige Intensität in der Deckung aufzubauen. Der Gegner nutzte unsere Unkonzentriertheiten konsequent aus und zog direkt mit einigen Toren davon. ", "Die ersten zehn Minuten gehörten klar dem Gast. Wir brauchten eine gewisse Anlaufzeit, um die Nervosität abzulegen und uns auf das physische Spiel einzustellen. "], "start");
    } else {
      n += pick(["Von Beginn an entwickelte sich ein packender Schlagabtausch, bei dem sich beide Mannschaften auf absolutem Augenhöhe begegneten. Keine Seite konnte sich in der ersten Viertelstunde entscheidend absetzen. ", "Die Zuschauer sahen eine intensive Anfangsphase, die geprägt war von einem taktischen Abtasten und zwei stabil stehenden Abwehrreihen, die kaum Lücken für den Gegner ließen. ", "Es entwickelte sich sofort ein offener Schlagabtausch, bei dem die Führung ständig hin und her wechselte. Beide Teams schenkten sich in den Zweikämpfen keinen einzigen Zentimeter Boden. ", "In einer nervösen Anfangsphase unterliefen beiden Mannschaften zunächst einige Fehler, was zu einem zähen Ringen um jedes Tor führte, ohne dass ein Team dominieren konnte. "], "start");
    }

    if (htDiff > earlyDiff + 2) {
      n += pick([`Im weiteren Verlauf der ersten Hälfte konnten wir das Tempo jedoch nochmals verschärfen. Durch eine geschlossene Teamleistung und eine bärenstarke Torhüterleistung zogen wir bis zum Pausentee verdient auf ${htScore.h}:${htScore.g} davon. `, `Nach der ersten Viertelstunde übernahmen wir immer mehr das Kommando. Wir fanden nun bessere Lösungen gegen die gegnerische Deckung und belohnten uns mit einer ${htScore.h}:${htScore.g} Halbzeitführung. `, `Wir blieben konsequent am Drücker und ließen in der Abwehr fast nichts mehr anbrennen. Die Belohnung war ein deutlicher Vorsprung zur Pause, bei dem es mit ${htScore.h}:${htScore.g} in die Kabinen ging. `, `Unsere Mannschaft zeigte nun ihr wahres Gesicht. Mit viel Spielfreude und einer deutlich verbesserten Chancenverwertung schraubten wir das Ergebnis bis zur Halbzeit auf ${htScore.h}:${htScore.g} hoch. `], "mid");
    } else if (htDiff < earlyDiff - 2) {
      n += pick([`Diesen Schwung der ersten Minuten konnten wir leider nicht halten. In der Phase vor der Pause verloren wir etwas den Faden, was der Gegner eiskalt ausnutzte, um zum ${htScore.h}:${htScore.g} zu verkürzen. `, `Der Gegner kämpfte sich mit viel Leidenschaft zurück in die Partie. Wir leisteten uns in dieser Phase zu viele Fahrkarten im Abschluss, sodass wir mit einem ${htScore.h}:${htScore.g} Rückstand in die Pause gehen mussten. `, `Leider schlichen sich mit fortlaufender Spieldauer einige Unkonzentriertheiten in unser Spiel ein. Die Gäste nutzten diese Schwächephase gnadenlos aus, was sich im Pausenstand von ${htScore.h}:${htScore.g} widerspiegelte. `, `Zur Pause stand es ${htScore.h}:${htScore.g} – ein Ergebnis, das uns zur Analyse zwang, da wir nach dem guten Start den Zugriff auf das Spiel merklich verloren hatten. `], "mid");
    } else {
      n += pick([`Bis zur Halbzeit blieb es ein extrem enges Spiel, in dem Kleinigkeiten den Ausschlag gaben. Mit einem Stand von ${htScore.h}:${htScore.g} wurden schließlich die Seiten gewechselt. `, `Keiner der beiden Kontrahenten konnte sich einen entscheidenden Vorteil erspielen. Das ${htScore.h}:${htScore.g} zur Pause war die logische Konsequenz aus einer ersten Hälfte voller Kampf und Leidenschaft. `, `Die Mannschaften neutralisierten sich weitestgehend, sodass es mit einem knappen ${htScore.h}:${htScore.g} in die Kabinen ging. Es war klar, dass der zweite Durchgang ein echter Kraftakt werden würde. `, `Ein intensives Ringen um jeden Ball prägte das Geschehen bis zum Pausenpfiff. Beim Stand von ${htScore.h}:${htScore.g} war für beide Teams noch alles drin. `], "mid");
    }

    if (midSecondDiff > htDiff + 1) {
      n += pick([
        "Auch nach dem Seitenwechsel blieben wir voll konzentriert und ließen den Gegner nicht mehr zur Entfaltung kommen. Besonders in der phase um die 45. Minute zeigten wir unsere Klasse und bauten den Vorsprung kontinuierlich aus. ",
        "Wir kamen mit viel Feuer aus der Kabine und konnten direkt nachlegen. Durch eine aggressive Deckung zwangen wir den Gegner zu Fehlern, die wir im Umschaltspiel konsequent nutzten, um die Führung weiter auszubauen. ",
        "Im zweiten Durchgang konnten wir die Schlagzahl nochmals erhöhen. Die Mannschaft wirkte nun wie aus einem Guss und dominierte das Geschehen auf dem Feld nach Belieben. ",
        "Unsere Physis gab in dieser Phase den Ausschlag. Während der Gegner langsam abbaute, konnten wir das Tempo hochhalten und uns vorentscheidend absetzen. "
      ], "second");
    } else if (midSecondDiff < htDiff - 1) {
      n += pick([
        "Der zweite Durchgang begann leider mit einer Schwächephase unsererseits. Der Gegner warf alles in die Waagschale und konnte den Rückstand Tor um Tor verkürzen, was die Spannung in der Halle spürbar steigen ließ. ",
        "Nach der Pause fanden wir zunächst nicht die richtigen Mittel gegen die umgestellte Abwehr des Gegners. Es entwickelte sich eine Zitterpartie, in der wir uns jeden Treffer hart erarbeiten mussten. ",
        "Leider verloren wir nach dem Seitenwechsel kurzzeitig die Linie. Durch unnötige Ballverluste machten wir den Gegner wieder stark und das Spiel wurde noch einmal richtig eng. ",
        "Die Gäste zeigten eine starke Moral und kämpften sich im zweiten Durchgang beeindruckend zurück. Wir hatten alle Hände voll zu tun, um nicht vollends die Kontrolle über die Partie zu verlieren. "
      ], "second");
    } else {
      n += pick([
        "Auch im zweiten Durchgang blieb die Partie ein absolutes Geduldsspiel. Keine Mannschaft konnte sich einen nennenswerten Vorteil erarbeiten, sodass jedes Tor in dieser Phase Gold wert war. ",
        "Das Niveau blieb hoch und beide Teams kämpften verbissen um jeden Ballbesitz. Es war ein offener Schlagabtausch, bei dem die Führung weiterhin ständig wechselte. ",
        "Die Intensität auf dem Spielfeld nahm im zweiten Durchgang sogar noch zu. Beide Abwehrreihen agierten am Limit, was zu einem extrem torarmen, aber hochspannenden Spielverlauf führte. ",
        "Es blieb bis weit in die zweite Halbzeit hinein eine völlig offene Angelegenheit. Die Zuschauer kamen voll auf ihre Kosten, da sich beide Teams absolut nichts schenkten. "
      ], "second");
    }

    if (finalDiff > 0) {
      if (finalDiff > crunchDiff + 1) {
        n += pick([`In der Schlussphase zeigten wir dann unsere ganze Abgeklärtheit. Während der Gegner alles riskieren musste, blieben wir eiskalt und schraubten das Ergebnis bis zum Schlusspfiff auf ${sH}:${sG} hoch. `, `Die letzten zehn Minuten gehörten uns. Mit einer unglaublichen Energieleistung brachen wir den letzten Widerstand des Gegners und sorgten für klare Verhältnisse auf der Anzeigetafel. `, `Crunchtime nach Maß! Wir behielten in der hitzigen Endphase kühlen Kopf und nutzten jede Chance konsequent aus, um den Vorsprung bis zum Ende deutlich auszubauen. `, `Nerven aus Stahl: Als es darauf ankam, waren wir voll da. Mit einem furiosen Endspurt ließen wir keinen Zweifel mehr daran aufkommen, wer heute als Sieger vom Platz geht. `], "crunch");
      } else if (finalDiff < crunchDiff - 1) {
        n += pick([`Es wurde am Ende nochmal eine echte Zitterpartie. Der Gegner kam gefährlich nah ran, aber wir warfen uns in jeden Ball und retteten den knappen Sieg mit letzter Kraft über die Zeit. `, `Die Schlussminuten waren nichts für schwache Nerven! Obwohl der Vorsprung bedrohlich schmolz, bewiesen wir den nötigen Biss, um die zwei Punkte in heimischer Halle zu behalten. `, `Hektische Endphase: Der Gegner stellte auf eine offene Manndeckung um und zwang uns zu Fehlern. Doch am Ende reichte unser Polster aus, um den Erfolg über die Ziellinie zu bringen. `, `Purer Nervenkrieg in der Crunchtime! Wir mussten bis zur letzten Sekunde um diesen Sieg kämpfen, aber der Einsatz wurde am Ende belohnt. `], "crunch");
      } else if (crunchDiff <= 0) {
        n += pick([`Was für ein Finish! In den letzten Minuten drehten wir das Spiel mit einem unfassbaren Lauf noch komplett zu unseren Gunsten. Die Halle glich einem Tollhaus! `, `In der Crunchtime zeigten wir unser wahres Kämpferherz. Wir holten den Rückstand auf und markierten kurz vor Schluss den entscheidenden Treffer zum Sieg. `, `Ein dramatisches Ende mit dem besseren Ausgang für uns! Wir bewiesen in den letzten Angriffen die nötige Ruhe und drehten die Partie in einem wahren Krimi. `], "crunch");
      } else {
        n += pick(["In der Schlussphase ließen wir nichts mehr anbrennen. Wir kontrollierten das Tempo geschickt und ließen den Gegner nicht mehr gefährlich herankommen, sodass wir den Sieg routiniert nach Hause brachten. ", "Die Mannschaft bewahrte in den letzten Minuten die nötige Ruhe. Wir spielten unsere Angriffe lange aus und verteidigten den Vorsprung mit viel Leidenschaft bis zum Schlusspfiff. ", "Wir ließen in der Crunchtime keine Zweifel mehr aufkommen. Dank einer stabilen Deckung und konzentrierten Abschlüssen brachten wir den Vorsprung sicher über die Zeit. ", "Ein souveräner Abschluss einer starken Partie! Wir blieben auch in den letzten Minuten konsequent in unseren Aktionen und feierten einen hochverdienten Erfolg. "], "crunch");
      }
    } else if (finalDiff === 0) {
      n += pick(["Die letzten Minuten waren ein einziger Krimi. Beide Mannschaften kämpften bis zur Erschöpfung um den entscheidenden Vorteil, doch am Ende blieb es beim Unentschieden. ", "Spannung pur bis zur letzten Sekunde! In der hitzigen Endphase schenkten sich beide Teams nichts, was letztlich in einer gerechten Punkteteilung mündete. ", "Crunchtime wie sie im Buche steht: Hart, intensiv und bis zum Schluss völlig offen. Das Remis am Ende ist der verdiente Lohn für zwei kämpfende Teams. "], "crunch");
    } else {
      if (htDiff > 0) {
        n += pick(["Leider gelang es uns in den letzten Minuten nicht, die Führung über die Zeit zu retten. Der Gegner nutzte unsere Fehler in der Crunchtime gnadenlos aus, um das Spiel noch zu drehen. ", "Bitter! Trotz langer Führung mussten wir uns in der Schlussphase doch noch geschlagen geben. In den entscheidenden Momenten fehlte uns heute die nötige Abgeklärtheit. ", "Der Vorsprung schmolz in der Endphase dahin. Wir fanden kein Mittel mehr gegen den Schlussspurt der Gäste und mussten die Punkte leider abgeben. "], "crunch");
      } else {
        n += pick(["Trotz einer alles-oder-nichts Strategie in der Schlussphase konnten wir den Rückstand nicht mehr wettmachen. Die Gäste spielten die Zeit routiniert runter und ließen sich den Sieg nicht mehr nehmen. ", "In der Crunchtime fehlte uns heute das Quäntchen Glück im Abschluss. Mehrere Pfostentreffer und eine starke gegnerische Parade verhinderten ein spätes Comeback unsererseits. ", "Wir warfen am Ende nochmal alles nach vorne, aber der Gegner blieb eiskalt and nutzte seine Chancen konsequent aus, um den Sieg unter Dach und Fach zu bringen. "], "crunch");
      }
    }

    if (finalDiff > 0) {
      n += pick(["Ein toller Tag für den gesamten Verein! Wir bedanken uns bei den Fans für die lautstarke Unterstützung, die uns heute zum Sieg getragen hat. ", "Wir sind stolz auf die geschlossene Mannschaftsleistung und freuen uns über zwei hochverdiente Punkte, die wir nun gebührend feiern werden. ", "Souverän gelöst! Die Mannschaft hat die taktischen Vorgaben perfekt umgesetzt und sich diesen Erfolg redlich verdient. Weiter so! "], "end");
    } else if (finalDiff === 0) {
      n += pick(["Wir nehmen den Punkt mit und analysieren das Spiel sachlich. Am Ende können wir stolz auf unsere Moral sein, die uns dieses Unentschieden ermöglicht hat. ", "Ein Dankeschön an alle Zuschauer für die tolle Kulisse! Wir blicken optimistisch auf die nächsten Aufgaben und werden aus diesem Spiel lernen. ", "Es war ein Handball-Fest für die Zuschauer. Auch wenn es nicht for zwei Punkte gereicht hat, haben wir heute eine starke Leistung gezeigt. "], "end");
    } else {
      n += pick(["Kopf hoch! Wir lassen uns von diesem Ergebnis nicht unterkriegen und werden im nächsten Training wieder voll angreifen, um am Wochenende zurückzuschlagen. ", "Wir bedanken uns bei den Fans für den tollen Support trotz der Niederlage. Wir kommen stärker zurück und werden die Fehler analysieren. ", "Heute hat es leider nicht gereicht, aber die Einstellung hat gestimmt. Wir haken das Spiel ab und blicken motiviert auf die kommende Woche. "], "end");
    }

    if (sH + sG > 60) n += pick(["Die Zuschauer sahen heute ein wahres Torfestival mit Treffern fast im Minutentakt! ", "Ein Offensiv-Spektakel par excellence, das keine Wünsche offen ließ! ", "Tore am Fließband – beide Abwehrreihen hatten heute sichtlich Schwerstarbeit zu verrichten. "], "bonus");
    
    return n;
  };

  const generateCaption = () => {
    if (!gameData) return "";
    const isA = gameData.settings?.isAuswaertsspiel;
    const oppNameReal = isA ? (gameData.teams?.heim || gameData.settings?.teamNameHeim) : (gameData.teams?.gegner || gameData.settings?.teamNameGegner);
    const opp = (oppNameReal || 'GEGNER').toUpperCase();
    const sH = gameData.score?.heim || 0;
    const sG = gameData.score?.gegner || 0;
    const isWin = (sH > sG && !isA) || (sG > sH && isA);
    
    let text = isWin ? `SIEG GEGEN ${opp}! 🥳💪🏼\n\n` : (sH === sG ? `UNENTSCHIEDEN GEGEN ${opp}. 🤝\n\n` : `NIEDERLAGE GEGEN ${opp}. 😔\n\n`);
    text += `Endergebnis: ${sH}:${sG}\n\n`;

    text += generateGameSummary(gameData) + "\n\n";

    const scorers = aggregateScorers(gameData);
    if (scorers.length > 0) {
      text += "Unsere Torschützen: 🎯\n";
      text += scorers.map(p => `${getLastName(p.name)} (${p.goals})`).join(', ') + "\n\n";

      const mvp = scorers[0];
      if (mvp.goals >= 5) {
        text += `Herausragend heute: ${mvp.name} mit starken ${mvp.goals} Treffern! 🔥\n\n`;
      }
    }

    try {
      const events = squad.calendarEvents || [];
      const now = new Date(gameData.date || Date.now());
      const future = events
        .map(e => ({ ...e, date: new Date(e.date) }))
        .filter(e => e.date > now && (e.type === 'Spiel' || e.opponent))
        .sort((a, b) => a.date - b.date);

      if (future.length > 0) {
        const next = future[0];
        const d = next.date;
        const dayNames = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
        text += `Weiter geht es am ${dayNames[d.getDay()]} (${d.toLocaleDateString('de-DE')}) gegen ${next.opponent || next.title}! 🔥\n\n`;
      } else {
        text += `Am nächsten Spieltag geht es weiter! 🔥\n\n`;
      }
    } catch (e) {}

    text += `Danke für Eure Unterstützung! 👏🏼\n\n`;
    text += settings.hashtags || '#handball #sechsmeter #teampower #handballdeutschland #ergebnis #matchday';
    return text;
  };

  const formatGameDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const days = ['SO.', 'MO.', 'DI.', 'MI.', 'DO.', 'FR.', 'SA.'];
    return `${days[date.getDay()]}, ${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}. UM ${String(date.getHours()).padStart(2, '0')}.${String(date.getMinutes()).padStart(2, '0')} UHR`;
  };

  const render = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Fallback data if no gameData is present
    const data = gameData || {
      score: { heim: 0, gegner: 0 },
      settings: { teamNameHeim: 'Heim', teamNameGegner: 'Gast' },
      date: new Date().toISOString(),
      gameLog: []
    };

    const ctx = canvas.getContext('2d');
    const W = 1080; const H = 1080;
    canvas.width = W; canvas.height = H;

    ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, W, H);
    const bg = await loadImage(settings.backgroundImage);
    if (bg) {
      const scale = Math.max(W / bg.width, H / bg.height);
      const sw = bg.width * scale; const sh = bg.height * scale;
      ctx.drawImage(bg, (W - sw) / 2, (H - sh) / 2, sw, sh);
    }
    ctx.fillStyle = `rgba(0,0,0,${settings.overlayOpacity})`; ctx.fillRect(0, 0, W, H);

    let sH = gameData.score?.heim ?? 0;
    let sG = gameData.score?.gegner ?? 0;
    let isA = gameData.settings?.isAuswaertsspiel;
    let gameDate = gameData.date || gameData.timestamp;

    if (previewMode === 'win') { sH = 27; sG = 18; isA = false; }
    else if (previewMode === 'away_win') { sH = 24; sG = 32; isA = true; }
    else if (previewMode === 'loss') { sH = 23; sG = 35; isA = false; }
    else if (previewMode === 'draw') { sH = 25; sG = 25; isA = false; }
    else if (previewMode === 'actual') {
      sH = data.score?.heim ?? data.score?.home ?? 0;
      sG = data.score?.gegner ?? data.score?.away ?? 0;
      isA = data.settings?.isAuswaertsspiel;
    }

    const isWin = (sH > sG && !isA) || (sG > sH && isA);
    const statusText = sH === sG ? 'UNENTSCHIEDEN' : (isWin ? (isA ? 'AUSWÄRTSSIEG' : 'HEIMSIEG') : 'NIEDERLAGE');
    const topScore = sH; const bottomScore = sG;
    const topColor = isA ? settings.opponentColor : settings.ownTeamColor;
    const bottomColor = isA ? settings.ownTeamColor : settings.opponentColor;

    const boxes = [];
    const drawWithTransform = (key, x, y, w, h, drawFn) => {
      const p = settings.positions[key];
      if (!p) return;
      const cx = x + w / 2; const cy = y + h / 2;
      boxes.push({ key, x, y, w, h, cx, cy, scale: p.scale, rotation: p.rotation });
      ctx.save(); ctx.translate(cx, cy); ctx.rotate((p.rotation * Math.PI) / 180); ctx.scale(p.scale, p.scale); ctx.translate(-cx, -cy);
      drawFn(x, y, w, h);
      if (isEditMode) {
        const isS = selectedElement === key;
        ctx.strokeStyle = isS ? '#84cc16' : 'rgba(255,255,255,0.2)'; ctx.lineWidth = 2 / p.scale;
        if (isS) ctx.setLineDash([]); else ctx.setLineDash([5, 5]);
        ctx.strokeRect(x, y, w, h);
        if (isS) {
          ctx.fillStyle = '#fff'; ctx.strokeStyle = '#84cc16';
          ctx.beginPath(); ctx.arc(x + w, y + h, 8 / p.scale, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx, y); ctx.lineTo(cx, y - 30 / p.scale); ctx.stroke();
          ctx.beginPath(); ctx.arc(cx, y - 30 / p.scale, 8 / p.scale, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        }
      }
      ctx.restore();
    };

    const gF = settings.fontFamily || 'Oswald';
    const drawV = (t, x, y, f, c) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(-Math.PI / 2);
      ctx.font = f; ctx.fillStyle = c; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(t, 0, 0); ctx.restore();
    };

    const pE = getP('ergebnisLabel');
    const fE = `${pE.bold ? 'bold' : '400'} ${pE.fontSize}px "${pE.fontFamily || gF}"`;
    ctx.font = fE; const wE = ctx.measureText('ERGEBNIS').width;
    drawWithTransform('ergebnisLabel', pE.x - pE.fontSize/2, pE.y - wE, pE.fontSize, wE, () => drawV('ERGEBNIS', pE.x, pE.y, fE, '#fff'));

    const pS = getP('seasonLabel');
    const tS = `DER SAISON ${settings.seasonName || '25/26'}`;
    const fS = `${pS.bold ? 'bold' : '400'} ${pS.fontSize}px "${pS.fontFamily || gF}"`;
    ctx.font = fS; const wS = ctx.measureText(tS).width;
    drawWithTransform('seasonLabel', pS.x - pS.fontSize/2, pS.y - wS, pS.fontSize, wS, () => drawV(tS, pS.x, pS.y, fS, 'rgba(255,255,255,0.7)'));

    const pSt = getP('statusGroup');
    const fSt = `${pSt.bold ? 'bold' : '400'} ${pSt.fontSize}px "${pSt.fontFamily || gF}"`;
    ctx.font = fSt; const wSt = ctx.measureText(statusText).width;
    drawWithTransform('statusGroup', pSt.x - wSt, pSt.y, wSt, pSt.fontSize, () => {
      ctx.fillStyle = '#fff'; ctx.textAlign = 'right'; ctx.textBaseline = 'top'; ctx.fillText(statusText, pSt.x, pSt.y);
    });

    const pD = getP('dateLabel');
    const tD = formatGameDate(gameDate);
    const fD = `${pD.bold ? 'bold' : '400'} ${pD.fontSize}px "${pD.fontFamily || gF}"`;
    ctx.font = fD; const wD = ctx.measureText(tD).width;
    drawWithTransform('dateLabel', pD.x - wD, pD.y, wD, pD.fontSize, () => {
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.textAlign = 'right'; ctx.textBaseline = 'top'; ctx.fillText(tD, pD.x, pD.y);
    });

    const pL = getP('separatorLine');
    drawWithTransform('separatorLine', pL.x, pL.y, pL.width, pL.thickness, (rx, ry, rw, rh) => {
      ctx.fillStyle = '#fff'; ctx.fillRect(rx, ry, rw, rh);
    });

    const pO = getP('ourScore');
    const pT = getP('theirScore');
    const ourF = `${pO.bold ? 'bold' : '400'} ${pO.fontSize}px "${pO.fontFamily || gF}"`;
    const theF = `${pT.bold ? 'bold' : '400'} ${pT.fontSize}px "${pT.fontFamily || gF}"`;
    ctx.font = ourF; drawWithTransform('ourScore', pO.x, pO.y, ctx.measureText(String(topScore)).width, pO.fontSize, (rx, ry) => {
      ctx.fillStyle = topColor; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(String(topScore), rx, ry);
    });
    ctx.font = theF; drawWithTransform('theirScore', pT.x, pT.y, ctx.measureText(String(bottomScore)).width, pT.fontSize, (rx, ry) => {
      ctx.fillStyle = bottomColor; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(String(bottomScore), rx, ry);
    });

    const pV = getP('vsLabel');
    const realOppName = isA ? (data.teams?.heim || data.settings?.teamNameHeim) : (data.teams?.gegner || data.settings?.teamNameGegner);
    const tV = `VS. ${isEditMode ? 'GEGNER' : (realOppName || 'GEGNER').toUpperCase()}`;
    const fV = `${pV.bold ? 'bold' : '400'} ${pV.fontSize}px "${pV.fontFamily || gF}"`;
    ctx.font = fV; const wV = ctx.measureText(tV).width;
    drawWithTransform('vsLabel', pV.x - wV, pV.y, wV, pV.fontSize, (rx, ry, rw) => {
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(tV, rx + rw, ry + (pV.fontSize/2));
    });

    const pTl = settings.positions.teamLabel;
    const tTl = (settings.teamLabel || '1. Herren').toUpperCase();
    const fTl = `${pTl.bold ? 'bold' : '400'} ${pTl.fontSize}px "${pTl.fontFamily || gF}"`;
    ctx.font = fTl; const wTl = ctx.measureText(tTl).width;
    drawWithTransform('teamLabel', pTl.x - wTl/2, pTl.y - pTl.fontSize, wTl, pTl.fontSize, (rx, ry, rw, rh) => {
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText(tTl, rx + rw/2, ry + rh);
    });

    const logoImg = await loadImage(settings.teamLogo);
    if (logoImg) {
      const pLogo = getP('logo');
      drawWithTransform('logo', pLogo.x, pLogo.y, 80, 80, (rx, ry) => ctx.drawImage(logoImg, rx, ry, 80, 80));
    }
    setCurrentBoxes(boxes);
  }, [settings, gameData, isEditMode, selectedElement, renderTrigger, previewMode, loadImage]);

  useEffect(() => { render(); }, [render]);

  return { canvasRef, settings, updatePosition, updateSettings, setIsEditMode, isEditMode, setSelectedElement, selectedElement, currentBoxes, previewMode, setPreviewMode, generateCaption };
};
