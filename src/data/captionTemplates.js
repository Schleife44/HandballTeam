/**
 * Sechsmeter Caption Templates & Logic
 * Start-Logic Update: Differenziert zwischen knappen und deutlichen Starts und nutzt professionelleres Wording.
 */

const getStableRand = (arr, seed) => {
  if (!arr || arr.length === 0) return "";
  let hash = 0;
  const seedStr = String(seed);
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % arr.length;
  return arr[index];
};

export const CAPTION_BLOCKS = {
  INTRO: {
    VICTORY: [
      "Was für ein Abend in der Halle! 🔥",
      "Heimsieg! Wir behalten die Punkte zu Hause und belohnen uns für einen harten Kampf! 💪",
      "Ein ganz wichtiger Erfolg für unser Team-Konto! ✨",
      "Sieg im Gepäck! Die harte Arbeit der letzten Wochen hat sich heute ausgezahlt. 💪",
      "So schmeckt ein Derbysieg! Eine fantastische geschlossene Mannschaftsleistung heute! 🚀",
      "Zwei Punkte, die verdammt gut tun! Eine fokussierte Leistung von der ersten bis zur letzten Minute. 🤾‍♂️🔥"
    ],
    LOSS: [
      "Kopf hoch! Heute hat es leider knapp nicht gereicht. 🤾‍♂️",
      "Wir haben alles auf der Platte gelassen, aber der Gegner war heute einen Tick abgezockter. ✨",
      "Mund abputzen, Krone richten – aus dieser Niederlage werden wir lernen! 💪",
      "Nicht unser Tag heute, aber der Fokus liegt bereits auf der nächsten Aufgabe. 😔"
    ],
    DRAW: [
      "Was für ein Krimi bis zur letzten Sekunde! Wir teilen uns am Ende die Punkte. 🤝",
      "Punkteteilung nach 60 Minuten purem Handball-Wahnsinn! ✨"
    ]
  },

  PHASES: {
    START: {
      GOOD_CLEAR: [
        "In der Anfangsphase erwischten wir einen Start nach Maß und konnten uns dank einer konzentrierten Leistung früh absetzen{{score10}}.",
        "Wir fanden hervorragend in die Partie, standen sicher in der Abwehr und erspielten uns in den ersten Minuten eine verdiente Führung{{score10}}.",
        "Sehr fokussiert in der Deckung und konsequent im Abschluss – der Start in die Begegnung verlief absolut nach Plan{{score10}}.",
        "Ein Auftakt wie aus dem Lehrbuch: Mit viel Tempo und Spielfreude konnten wir uns frühzeitig ein Polster erarbeiten{{score10}}.",
        "Wir waren von der ersten Sekunde an hellwach und drückten dem Spiel sofort unseren Stempel auf{{score10}}."
      ],
      GOOD_NARROW: [
        "Wir kamen gut in die Partie und konnten uns in einer umkämpften Anfangsphase einen leichten Vorteil erarbeiten{{score10}}.",
        "Beide Teams starteten engagiert, wobei wir in den ersten Minuten den etwas besseren Rhythmus fanden und knapp in Führung gingen{{score10}}.",
        "Ein intensiver Beginn, bei dem wir uns durch kleine Nadelstiche einen hauchdünnen Vorsprung sichern konnten{{score10}}.",
        "In den ersten Minuten agierten wir einen Tick abgeklärter als der Gegner und belohnten uns mit einer knappen Führung{{score10}}.",
        "Der Start verlief vielversprechend: Wir standen kompakt und konnten uns frühzeitig leicht absetzen{{score10}}."
      ],
      BAD_NARROW: [
        "Der Beginn der Partie verlief ausgeglichen, wobei wir in der Anfangsphase leichte Nachteile hinnehmen mussten und knapp in Rückstand gerieten{{score10}}.",
        "Ein umkämpfter Start in die Begegnung: Beide Seiten schenkten sich nichts, doch der Gegner erwischte den etwas besseren Start{{score10}}.",
        "In der Anfangsphase suchten wir noch nach unserem Rhythmus, was der Gegner für eine knappe Führung nutzte{{score10}}.",
        "Wir starteten etwas nervös und liefen in den ersten Minuten einem knappen Rückstand hinterher{{score10}}.",
        "Kein einfacher Beginn für uns – wir brauchten ein paar Minuten, um in der Partie anzukommen{{score10}}."
      ],
      BAD_CLEAR: [
        "Wir verschliefen die Anfangsphase leider, fanden keinen Zugriff in der Deckung und sahen uns früh mit einem deutlichen Rückstand konfrontiert{{score10}}.",
        "Ein Start zum Vergessen: Der Gegner nutzte unsere Fehler in den ersten Minuten konsequent aus und zog früh davon{{score10}}.",
        "Wir fanden in den ersten zehn Minuten überhaupt keine Mittel gegen die gegnerische Offensive{{score10}}.",
        "Die Anfangsphase verlief alles andere als optimal, da wir uns frühzeitig einem deutlichen Rückstand gegenübersahen{{score10}}.",
        "Leider fehlte uns zu Beginn die nötige Aggressivität, was zu einem schnellen Rückstand führte{{score10}}."
      ],
      EQUAL: [
        "In der Anfangsphase lieferten sich beide Teams einen offenen Schlagabtausch auf Augenhöhe{{score10}}.",
        "Ein klassisches Abtasten in den ersten Minuten: Beide Mannschaften agierten auf Augenhöhe, sodass sich kein Team absetzen konnte{{score10}}.",
        "Die ersten zehn Minuten waren geprägt von einem intensiven Kampf um jeden Zentimeter Boden{{score10}}.",
        "Keine der beiden Mannschaften konnte sich zu Beginn einen entscheidenden Vorteil verschaffen{{score10}}.",
        "Ein nervöser Beginn auf beiden Seiten, bei dem sich noch kein Team absetzen konnte{{score10}}."
      ]
    },
    HALF_TIME: {
      LEAD: [
        " Auch im weiteren Verlauf der ersten Hälfte blieben wir am Drücker und gingen mit einer verdienten Führung in die Kabine{{score30}}.",
        " Wir ließen uns nicht beirren, zogen unser Spiel konzentriert durch und sicherten uns ein schönes Polster zur Halbzeit{{score30}}.",
        " Ein souveräner Auftritt in Durchgang eins: Die Abwehr stand kompakt, weshalb wir mit einem verdienten Vorsprung in die Pause gehen konnten{{score30}}.",
        "Mit viel Disziplin und einer geschlossenen Mannschaftsleistung erarbeiteten wir uns die Pausenführung{{score30}}.",
        "Die erste Halbzeit verlief ganz nach unserem Geschmack, was sich auch im Spielstand widerspiegelte{{score30}}."
      ],
      TRAIL: [
        " Der Pausenstand{{score30}} spiegelte die harte Arbeit wider, die noch vor uns lag, da der Gegner uns in der ersten Hälfte phasenweise den Schneid abkaufte.",
        "Trotz großer Bemühungen gelang es uns vor der Pause nicht, den Lauf des Gegners zu stoppen{{score30}}.",
        "Wir bissen uns an der gegnerischen Deckung fest und liefen zur Halbzeit einem Rückstand hinterher{{score30}}.",
        "In der Kabine gab es einiges zu besprechen, um den Rückstand nach dem Seitenwechsel noch zu drehen{{score30}}.",
        "Leider fehlte uns in der ersten Hälfte die nötige Durchschlagskraft, was zum Pausenrückstand führte{{score30}}."
      ],
      DRAW: [
        " Bis zur Halbzeitpause konnte sich kein Team absetzen, sodass beim Stand von {{score30}} für Durchgang zwei noch alles offen war.",
        "Ein intensives Spiel auf Augenhöhe, bei dem es völlig leistungsgerecht mit einem Remis in die Kabinen ging{{score30}}.",
        "Beide Mannschaften schenkten sich nichts, was der Pausenstand von {{score30}} deutlich unterstrich.",
        "Spannung pur in der Halle: Zur Pause war beim Stand von {{score30}} noch keine Entscheidung gefallen.",
        "Wir lieferten uns einen packenden Schlagabtausch, der zur Halbzeit noch keinen Sieger kannte{{score30}}."
      ]
    },
    RESTART: {
      IMPROVED: [
        " Nach dem Seitenwechsel zeigten wir eine starke Reaktion und kämpften uns Tor um Tor wieder heran{{score40}}.",
        "Die Halbzeitansprache zeigte Wirkung: Wir agierten wesentlich konzentrierter und verkürzten den Rückstand{{score40}}.",
        "Mit neuem Elan kamen wir aus der Kabine und setzten den Gegner sofort unter Druck{{score40}}.",
        "Wir bewiesen Moral und fanden nach der Pause deutlich besser in die Begegnung{{score40}}.",
        "Punkt für Punkt kämpften wir uns zurück und machten das Spiel wieder spannend{{score40}}."
      ],
      STILL_STRUGGLING: [
        " Doch auch nach der Pause blieb der Umschwung zunächst aus, da wir uns an der gegnerischen Deckung festbissen und weiter einem Rückstand hinterherliefen{{score40}}.",
        "Wir fanden auch im zweiten Durchgang nur schwer die Lücken in der gegnerischen Abwehr{{score40}}.",
        "Leider konnten wir die Fehler aus der ersten Hälfte nicht abstellen und liefen weiter hinterher{{score40}}.",
        "Trotz aller Bemühungen gelang es uns nicht, den Vorsprung des Gegners entscheidend zu verkürzen{{score40}}.",
        "Der erhoffte Ruck nach dem Seitenwechsel blieb leider aus, sodass wir weiter unter Zugzwang standen{{score40}}."
      ],
      FELL_BEHIND: [
        " Der Wiederbeginn verlief leider nicht nach unseren Vorstellungen. Wir ließen in der Konzentration nach und gerieten prompt in Rückstand{{score40}}.",
        "Nach dem Seitenwechsel kamen wir nicht richtig in Schwung und ließen den Gegner davonziehen{{score40}}.",
        "Wir verloren kurzzeitig den Faden, was der Gegner eiskalt ausnutzte, um in Führung zu gehen{{score40}}.",
        "Die ersten Minuten nach der Pause gehörten dem Gegner, der das Spiel zu seinen Gunsten drehte{{score40}}.",
        "Leider konnten wir das Niveau aus der ersten Hälfte nicht halten und gerieten ins Hintertreffen{{score40}}."
      ],
      TOOK_LEAD: [
        " Nach dem Seitenwechsel erwischten wir den besseren Start, spielten unsere Angriffe konsequent zu Ende und warfen uns in Führung{{score40}}.",
        "Wir kamen hellwach aus der Kabine und drückten dem Spiel sofort unseren Stempel auf{{score40}}.",
        "Dank einer starken Phase direkt nach Wiederanpfiff konnten wir die Führung übernehmen{{score40}}.",
        "Wir nutzten die Schwächen des Gegners nach der Pause konsequent aus und drehten die Partie{{score40}}.",
        "Mit viel Tempo und Entschlossenheit erspielten wir uns nach dem Seitenwechsel einen Vorteil{{score40}}."
      ],
      EXTENDED_LEAD: [
        " Auch nach der Pause ließen wir nicht locker, blieben hochkonzentriert und bauten unsere Dominanz auf dem Feld sogar noch weiter aus{{score40}}.",
        " Wir kamen hellwach aus der Kabine und setzten uns dank einer tollen Mannschaftsleistung noch weiter vom Gegner ab{{score40}}.",
        "Wir knüpften nahtlos an die starke erste Hälfte an und ließen keine Zweifel aufkommen{{score40}}.",
        "Der Vorsprung wuchs nach dem Seitenwechsel kontinuierlich an, da wir kaum Fehler machten{{score40}}.",
        "Souverän agierten wir auch im zweiten Durchgang und bauten unsere Führung konsequent aus{{score40}}."
      ],
      MAINTAINED_LEAD: [
        " Nach dem Seitenwechsel konnten wir unseren Vorsprung weitestgehend behaupten, auch wenn der Gegner nun etwas besser ins Spiel fand{{score40}}.",
        " Wir kamen solide aus der Kabine und hielten den Gegner weiter erfolgreich auf Abstand, wodurch wir die Kontrolle behielten{{score40}}.",
        "Mit viel Routine verwalteten wir unsere Führung und ließen den Gegner nicht gefährlich herankommen{{score40}}.",
        "Wir agierten im zweiten Durchgang sehr abgeklärt und ließen keine Hektik aufkommen{{score40}}.",
        "Der Vorsprung blieb stabil, da wir auf jede Aktion des Gegners die passende Antwort parat hatten{{score40}}."
      ],
      LEAD_SHRINKING: [
        " Nach der Pause schlich sich bei uns leider kurz der Schlendrian ein. Wir ließen einige Chancen ungenutzt, sodass unser Vorsprung merklich schmolz{{score40}}.",
        " Der Start in die zweite Hälfte verlief nicht optimal. Wir waren in der Abwehr nicht mehr ganz so griffig und ließen den Gegner gefährlich nah herankommen{{score40}}.",
        "Wir verloren etwas den Rhythmus, was der Gegner sofort nutzte, um den Rückstand zu verkürzen{{score40}}.",
        "Plötzlich wurde es wieder spannend, da wir in der Offensive zu viele Fehler produzierten{{score40}}.",
        "Die Souveränität der ersten Hälfte war kurzzeitig weg, sodass der Gegner wieder Boden gutmachen konnte{{score40}}."
      ],
      LOST_LEAD: [
        " Leider riss nach dem Seitenwechsel bei uns kurzzeitig der Faden. Der Gegner bestrafte unsere Fehler und drehte den Spielstand{{score40}}.",
        " Eine unerklärliche Schwächephase nach der Pause: Wir brachten uns selbst aus dem Rhythmus und mussten zusehen, wie der Gegner unsere Führung zunichtemachte{{score40}}.",
        "Plötzlich lief bei uns nicht mehr viel zusammen, was der Gegner gnadenlos für sich nutzte{{score40}}.",
        "Innerhalb weniger Minuten gaben wir die Kontrolle über das Spiel aus der Hand{{score40}}.",
        "Der Faden war komplett weg – wir fanden nach dem Seitenwechsel überhaupt nicht mehr in die Spur{{score40}}."
      ]
    },
    CRUNCHTIME: {
      WIN_STABLE: [
        " In der Schlussphase ließen wir dann überhaupt nichts mehr anbrennen und spielten den Sieg über das {{score50}} nach 50 Minuten völlig souverän und abgeklärt nach Hause.",
        " Der Vorsprung war komfortabel genug, sodass wir ab der 50. Minute ({{score50}}) das Geschehen clever kontrollierten und den Sieg ungefährdet über die Ziellinie brachten.",
        " Spätestens ab der 50. Minute ({{score50}}) war der Widerstand des Gegners gebrochen. Wir haben das Spiel mit viel Routine zu Ende gebracht.",
        "Ganz abgeklärt spulten wir unser Programm ab und ließen keine Zweifel am Heimsieg aufkommen. Auch nach 50 Minuten ({{score50}}) blieb unsere Konzentration hoch.",
        "Wir kontrollierten Tempo und Gegner nach Belieben und sicherten uns beim Stand von {{score50}} in der 50. Minute hochverdient die zwei Punkte."
      ],
      WIN_THRILLER: [
        " Was für ein Drama! Nach einem hochspannenden {{score55}} in der 55. Minute behielten wir in der Crunchtime am Ende kühlen Kopf und rissen den knappen Sieg an uns.",
        " Nichts für schwache Nerven! Beim Stand von {{score55}} fünf Minuten vor dem Ende war noch alles offen, doch in der wilden Schlussphase hatten wir das bessere Ende für uns.",
        "Ein Handball-Krimi par excellence: Nach dem {{score55}} in der 55. Minute konnten wir den Sack erst in den letzten Sekunden endgültig zumachen.",
        "Wir bewiesen in der hitzigen Schlussphase die nötige Ruhe. Trotz des knappen {{score55}} kurz vor dem Ende belohnten wir uns für einen aufopferungsvollen Kampf.",
        "Die Halle bebte, als wir beim Stand von {{score55}} (55. Min) in den entscheidenden Momenten die Nerven behielten und den Sieg sicherten."
      ],
      LOSS_FIGHT_CLOSE: [
        " Es war bis zum Schluss ein packender Kampf ({{score55}} in der 55. Minute). In den letzten Sekunden fehlte uns dann aber leider das letzte Quäntchen Glück für einen Punktgewinn zum {{finalScore}}.",
        " Tolle Moral! Fünf Minuten vor dem Ende war beim Stand von {{score55}} noch alles drin, nachdem wir uns zuvor leidenschaftlich herangekämpft hatten. Am Ende reichte es jedoch beim {{finalScore}} hauchdünn nicht.",
        "Wir kämpften bis zum Umfallen und kamen in der {{peakMinute}}. Minute ({{peakScore}}) sogar noch einmal bedrohlich nah heran, doch am Ende mussten wir uns dem Gegner mit {{finalScore}} geschlagen geben.",
        "Ein Unentschieden wäre nach unserer Aufholjagd in der Schlussphase ({{peakScore}} in der {{peakMinute}}. Min) mehr als verdient gewesen, doch beim Endstand von {{finalScore}} standen wir leider mit leeren Händen da.",
        "In einem Spiel auf Messers Schneide kamen wir in der {{peakMinute}}. Minute bis auf {{peakScore}} heran. Am Ende fehlten uns beim {{finalScore}} leider die entscheidenden Zentimeter zum Punktgewinn."
      ],
      LOSS_FIGHT_COLLAPSE: [
        " Wir bewiesen Charakter und kamen in der {{peakMinute}}. Minute beim Stand von {{peakScore}} noch einmal bedrohlich nah heran. In den letzten Minuten verließen uns dann aber die Kräfte, woraufhin der Gegner spielentscheidend zum {{finalScore}}-Endstand davonzog.",
        "Großartiger Kampf in der zweiten Hälfte! Bis zur {{peakMinute}}. Minute ({{peakScore}}) schnupperten wir an der Sensation, ehe uns am Ende leider die Luft ausging und der Gegner wieder zum {{finalScore}} wegzog.",
        "Wir warfen noch einmal alles nach vorne und kamen in der {{peakMinute}}. Minute bis auf {{peakScore}} heran, doch der Gegner agierte in der Schlussphase einfach abgeklärter und stellte den {{finalScore}}-Endstand her.",
        "Nach einer starken Aufholjagd bis zum {{peakScore}} in der {{peakMinute}}. Minute fehlten uns am Ende leider die Körner, um das Spiel komplett zu drehen. Der Gegner nutzte dies eiskalt und siegte schließlich mit {{finalScore}}.",
        "Wir kamen in der Schlussphase noch einmal gefährlich nah heran ({{peakScore}} nach {{peakMinute}} Minuten), konnten den Sack aber leider nicht zumachen, woraufhin der Gegner den Sieg zum {{finalScore}} souverän verwaltete."
      ],
      LOSS_STABLE: [
        " Auch in der Schlussphase fanden wir leider keine Mittel mehr, um das Spiel noch einmal zu drehen. Beim Stand von {{score50}} nach 50 Minuten verwaltete der Gegner den Vorsprung bereits abgeklärt.",
        "Der Widerstand war am Ende leider gebrochen, da der Gegner seinen Vorsprung ({{score50}} in der 50. Min) souverän über die Zeit brachte.",
        "Wir liefen bis zum Schluss einem Rückstand hinterher, den wir auch nach 50 Minuten ({{score50}}) nicht mehr entscheidend verkürzen konnten.",
        "Der Gegner ließ in den letzten Minuten nichts mehr anbrennen und sicherte sich nach dem {{score50}} (50. Min) verdient die Punkte.",
        "Trotz allen Kampfgeistes war heute gegen diesen starken Gegner nach dem {{score50}} in der 50. Minute leider kein Kraut mehr gewachsen."
      ],
      DRAW_THRILLER: [
        " In einer extrem spannenden Schlussphase ({{score55}} in der 55. Minute) lieferten sich beide Teams einen offenen Schlagabtausch, sodass die Punkteteilung zum {{finalScore}} am Ende völlig in Ordnung geht.",
        " Was für eine packende Schlussphase! Selbst fünf Minuten vor dem Ende ({{score55}}) konnte sich keines der Teams entscheidend absetzen, weshalb das {{finalScore}} ein gerechtes Ergebnis für diesen harten Kampf ist.",
        "Ein Spiel, das keinen Verlierer verdient hatte: Beim Stand von {{score55}} in der 55. Minute kämpften beide Mannschaften bis zum Umfallen für diesen Punkt.",
        "Bis zur letzten Sekunde war die Spannung in der Halle greifbar – nach dem {{score55}} (55. Min) teilten wir uns am Ende die Punkte leistungsgerecht.",
        "Ein Krimi, der alles hielt, was er versprach: Beide Seiten agierten beim Stand von {{score55}} kurz vor dem Ende auf absolutem Augenhöhe."
      ],
      DRAW_COMEBACK: [
        " In der Schlussphase bewiesen wir unglaubliche Moral! Wir kämpften uns aus dem Rückstand zurück, kamen in der {{peakMinute}}. Minute auf {{peakScore}} heran und hielten die Spannung über das {{score55}} (55. Min) bis zum verdienten {{finalScore}} hoch.",
        "Was für eine Aufholjagd! Wir lagen bereits zurück, bewiesen aber Charakter und saugten uns bis zur {{peakMinute}}. Minute ({{peakScore}}) wieder heran. Über ein dramatisches {{score55}} in der 55. Minute sicherten wir uns schließlich diesen Punkt.",
        "Mit viel Leidenschaft bogen wir den Rückstand noch in ein Remis um. Nach dem {{peakScore}} in der {{peakMinute}}. Minute blieb es bis zum {{score55}} kurz vor dem Ende hochspannend, ehe das {{finalScore}} feststand.",
        "Wir glaubten an uns und belohnten uns schließlich mit dem Ausgleich, nachdem wir uns in der {{peakMinute}}. Minute ({{peakScore}}) herangekämpft und auch in der 55. Minute ({{score55}}) die Nerven behalten hatten.",
        "Niemand in der Halle hätte wohl noch mit diesem Punkt gerechnet. Doch nach dem {{peakScore}} in der {{peakMinute}}. Minute und einem nervenaufreibenden {{score55}} in der Crunchtime haben wir uns das {{finalScore}} redlich verdient."
      ],
      LATE_RALLY: [
        " Was für ein Wahnsinn in den Schlussminuten! Noch in der 58. Minute lagen wir mit mehreren Toren zurück, doch mit einer unglaublichen Energieleistung und mehreren Treffern in Folge erkämpften wir uns in allerletzter Sekunde noch das {{finalScore}}.",
        "Purer Handball-Wahnsinn in der Crunchtime! Wir lagen kurz vor dem Ende scheinbar aussichtslos mit {{score58}} (58. Min) hinten, starteten dann aber eine furiose Aufholjagd und retteten noch das Unentschieden.",
        "Diese Mannschaft gibt niemals auf! In den letzten zwei Minuten bogen wir einen deutlichen Rückstand ({{score58}}) mit einer unfassbaren Moral noch in ein hochverdientes {{finalScore}} um.",
        "Ein Comeback für die Geschichtsbücher: In den letzten Augenblicken der Partie warfen wir beim Stand von {{score58}} noch einmal alles nach vorne und belohnten uns in der Schlusssekunde mit dem Punktgewinn.",
        "Unglaubliche Szenen in den letzten Minuten! Trotz des Rückstands von {{score58}} kurz vor dem Ende mobilisierten wir die letzten Reserven und erzielten in der allerletzten Minute den Ausgleich zum {{finalScore}}."
      ],
      DRAW_LOST_LEAD: [
        " Leider konnten wir in der Schlussphase unseren knappen Vorsprung ({{peakScore}} in der {{peakMinute}}. Minute) nicht über die Zeit retten und mussten uns am Ende mit einem Punkt zufriedengeben.",
        "Ein sicher geglaubter Sieg glitt uns in den letzten Minuten leider noch aus den Händen, obwohl wir in der {{peakMinute}}. Minute noch mit {{peakScore}} führten.",
        "Wir konnten die Konzentration nicht bis zum Schluss hochhalten. Unser Vorsprung ({{peakScore}} in der {{peakMinute}}. Min) schmolz dahin, was der Gegner eiskalt zum Ausgleich nutzte.",
        "Am Ende fehlte uns die nötige Abgeklärtheit, um die Führung von {{peakScore}} aus der {{peakMinute}}. Minute über die Ziellinie zu bringen.",
        "Es ist ein Punktgewinn, der sich nach der Führung ({{peakScore}} in der {{peakMinute}}. Min) kurz nach dem Abpfiff eher wie ein Punktverlust anfühlt."
      ]
    }
  },

  HIGHLIGHTS: {
    OFFENSE: [
      " Offensiv war das heute eine starke Vorstellung mit viel Spielwitz und Dynamik.",
      " Im Angriff haben wir heute wirklich oft genau die richtigen Lösungen gefunden.",
      "Mit viel Tempo und präzisen Abschlüssen stellten wir den Gegner immer wieder vor Probleme.",
      "Das Zusammenspiel im Angriff funktionierte heute phasenweise fast wie von selbst.",
      "Wir zeigten uns heute extrem abschlussstark und nutzten unsere Chancen eiskalt aus."
    ],
    DEFENSE: [
      " Die starke Abwehr war heute ohne Zweifel der absolute Grundstein für diesen Auftritt.",
      " Hinten standen wir phasenweise wie eine Mauer – eine großartige Defensivarbeit des gesamten Teams.",
      "Die aggressive Deckung kaufte dem Gegner heute immer wieder den Schneid ab.",
      "Dank einer kompakten Defensive konnten wir viele Ballgewinne in schnelle Tore ummünzen.",
      "Die Kommunikation in der Abwehr stimmte heute fast über die gesamte Spielzeit."
    ],
    GENERAL: [""]
  },

  CLOSING: [
    "Vielen Dank an alle Fans für den fantastischen Support! ❤️",
    "Fokus auf das nächste Spiel! 🔥",
    "Danke für die Unterstützung in der Halle! 🙌",
    "Blick nach vorne! 🚀",
    "Einfach ein toller Handballtag! 🤾‍♂️🎉",
    "Wir sehen uns beim nächsten Heimspiel! 🏠🤾‍♂️"
  ]
};

const parseGameTimeMs = (entry, firstTimestamp) => {
  if (entry.elapsedMs !== undefined && entry.elapsedMs !== null) return entry.elapsedMs;
  const timeStr = entry.time || entry.gameTime;
  if (timeStr && typeof timeStr === 'string' && timeStr.includes(':')) {
    const parts = timeStr.split(':').map(Number);
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return (parts[0] * 60 + parts[1]) * 1000;
    }
  }
  return new Date(entry.timestamp).getTime() - firstTimestamp;
};

const analyzeGameFlow = (gameData) => {
  const log = gameData?.gameLog || [];
  const isAway = gameData.isAway;
  
  const logGoals = log.filter(e => {
    const a = (e.action || "").toLowerCase();
    const t = (e.type || "").toUpperCase();
    return t.includes('GOAL') || a.includes('tor') || a.includes('goal');
  }).length;
  
  const totalGoals = (gameData.scoreHeim || 0) + (gameData.scoreGegner || 0);
  const isLogComplete = totalGoals > 0 && (logGoals / totalGoals) > 0.6; 

  if (!log || log.length === 0 || !isLogComplete) return { incomplete: true };

  const firstTimestamp = log[0]?.timestamp ? new Date(log[0].timestamp).getTime() : 0;
  const sortedLog = [...log].sort((a, b) => parseGameTimeMs(a, firstTimestamp) - parseGameTimeMs(b, firstTimestamp));

  let s10Str = "0:0", s30Str = "0:0", s40Str = "0:0", s50Str = "0:0", s55Str = "0:0", s58Str = "0:0";
  let curH = 0, curA = 0;
  
  let bestCrunchDiff = -99;
  let peakScore = "";
  let peakMinute = 40;

  for (const entry of sortedLog) {
    const t = parseGameTimeMs(entry, firstTimestamp);
    
    if (entry.score) { 
      curH = entry.score.home; 
      curA = entry.score.away; 
    } else {
      const action = (entry.action || "").toLowerCase();
      if (entry.type?.includes('GOAL') || action.includes('tor') || action.includes('goal')) {
        const match = action.match(/(\d+)\s*:\s*(\d+)/);
        if (match) {
          curH = parseInt(match[1], 10);
          curA = parseInt(match[2], 10);
        } else {
          if (isAway) { if (entry.isOpponent || action.includes('gegner')) curH++; else curA++; }
          else { if (entry.isOpponent || action.includes('gegner')) curA++; else curH++; }
        }
      }
    }

    if (t <= 600000) s10Str = `${curH}:${curA}`;
    if (t <= 1800000) s30Str = `${curH}:${curA}`;
    if (t <= 2400000) s40Str = `${curH}:${curA}`;
    if (t <= 3000000) s50Str = `${curH}:${curA}`;
    if (t <= 3300000) s55Str = `${curH}:${curA}`;
    if (t <= 3480000) s58Str = `${curH}:${curA}`;

    if (t >= 2400000) {
      const d = isAway ? curA - curH : curH - curA;
      if (d > bestCrunchDiff) {
        bestCrunchDiff = d;
        peakScore = `${curH}:${curA}`;
        peakMinute = Math.floor(t / 60000) + 1;
      }
    }
  }

  const getDiff = (s) => isAway ? parseInt(s.split(':')[1]) - parseInt(s.split(':')[0]) : parseInt(s.split(':')[0]) - parseInt(s.split(':')[1]);

  const startDiff = getDiff(s10Str);
  const htDiff = getDiff(s30Str);
  const rDiff = getDiff(s40Str);
  const f58Diff = getDiff(s58Str);
  const fDiff = isAway ? (gameData.scoreGegner - gameData.scoreHeim) : (gameData.scoreHeim - gameData.scoreGegner);

  const lateRally = fDiff === 0 && f58Diff <= -2; 

  let sKey = 'EQUAL';
  if (startDiff >= 3) sKey = 'GOOD_CLEAR';
  else if (startDiff > 0) sKey = 'GOOD_NARROW';
  else if (startDiff <= -3) sKey = 'BAD_CLEAR';
  else if (startDiff < 0) sKey = 'BAD_NARROW';

  let rKey = 'EXTENDED_LEAD';
  if (htDiff < 0) {
    rKey = rDiff > htDiff ? 'IMPROVED' : 'STILL_STRUGGLING';
  } else if (htDiff === 0) {
    rKey = rDiff < 0 ? 'FELL_BEHIND' : 'TOOK_LEAD';
  } else {
    if (rDiff <= 0) {
      rKey = 'LOST_LEAD'; 
    } else if (rDiff < htDiff) {
      if (htDiff - rDiff >= 3) {
        rKey = 'LEAD_SHRINKING'; 
      } else {
        rKey = 'MAINTAINED_LEAD'; 
      }
    } else {
      rKey = 'EXTENDED_LEAD'; 
    }
  }
  
  let cKey = 'LOSS_STABLE';
  if (fDiff > 0) {
    cKey = Math.abs(fDiff) <= 2 ? 'WIN_THRILLER' : 'WIN_STABLE';
  } else if (fDiff === 0) {
    if (lateRally) cKey = 'LATE_RALLY';
    else if (bestCrunchDiff > 0) cKey = 'DRAW_LOST_LEAD'; 
    else if (rDiff <= -2) cKey = 'DRAW_COMEBACK'; 
    else cKey = 'DRAW_THRILLER'; 
  } else {
    if (bestCrunchDiff >= -3 && bestCrunchDiff > htDiff) {
      if (Math.abs(fDiff) > 3) cKey = 'LOSS_FIGHT_COLLAPSE';
      else cKey = 'LOSS_FIGHT_CLOSE';
    } else {
      cKey = 'LOSS_STABLE';
    }
  }

  return {
    score10: s10Str, score30: s30Str, score40: s40Str, score50: s50Str, score55: s55Str, score58: s58Str, peakScore, peakMinute,
    start: sKey,
    halfTime: htDiff > 0 ? 'LEAD' : (htDiff < 0 ? 'TRAIL' : 'DRAW'),
    restart: rKey,
    crunch: cKey,
    lateRally,
    incomplete: false
  };
};

export const assembleCaption = (data, settings = {}) => {
  const { scoreHeim, scoreGegner, isAway, teamHeim, teamGegner, statsSummary, timestamp } = data;
  const seed = timestamp || (scoreHeim + scoreGegner + teamHeim.length);
  const isWin = (scoreHeim > scoreGegner && !isAway) || (scoreGegner > scoreHeim && isAway);
  const isDraw = scoreHeim === scoreGegner;
  const flow = analyzeGameFlow(data);
  
  const replace = (text, f) => {
    if (!f || f.incomplete) return text.replace(/{{score\d+}}/g, "").replace(/{{peakScore}}/g, "").replace(/{{peakMinute}}/g, "").replace(/{{finalScore}}/g, `${scoreHeim}:${scoreGegner}`);
    return text
      .replace(/{{score10}}/g, ` (${f.score10})`)
      .replace(/{{score30}}/g, ` (${f.score30})`)
      .replace(/{{score40}}/g, ` (${f.score40})`)
      .replace(/{{score50}}/g, ` (${f.score50})`)
      .replace(/{{score55}}/g, ` (${f.score55})`)
      .replace(/{{score58}}/g, ` (${f.score58})`)
      .replace(/{{peakScore}}/g, `${f.peakScore}`)
      .replace(/{{peakMinute}}/g, `${f.peakMinute}`)
      .replace(/{{finalScore}}/g, `${scoreHeim}:${scoreGegner}`);
  };

  let intro = isDraw ? getStableRand(CAPTION_BLOCKS.INTRO.DRAW, seed) : (isWin ? getStableRand(CAPTION_BLOCKS.INTRO.VICTORY, seed) : getStableRand(CAPTION_BLOCKS.INTRO.LOSS, seed));
  let narrative = "";
  if (flow && !flow.incomplete) {
    const s = replace(getStableRand(CAPTION_BLOCKS.PHASES.START[flow.start], seed), flow);
    const h = replace(getStableRand(CAPTION_BLOCKS.PHASES.HALF_TIME[flow.halfTime], seed), flow);
    const r = replace(getStableRand(CAPTION_BLOCKS.PHASES.RESTART[flow.restart], seed), flow);
    const crunchKey = flow.lateRally ? 'LATE_RALLY' : flow.crunch;
    const c = replace(getStableRand(CAPTION_BLOCKS.PHASES.CRUNCHTIME[crunchKey], seed), flow);
    narrative = `${s} ${h} ${r} ${c}`;
  } else {
    narrative = isWin 
      ? "Ein hochverdienter Sieg nach einer rundum engagierten Leistung. Das Team hat heute genau die richtige Mentalität auf die Platte gebracht!" 
      : (isDraw ? "Ein hart umkämpftes Spiel auf Augenhöhe, bei dem wir uns am Ende die Punkte gerecht teilen." : "Heute hat es leider nicht für Punkte gereicht. Es war ein hart umkämpftes Spiel, in dem wir bis zum Ende alles gegeben haben.");
  }

  let highlights = "";
  if (scoreHeim + scoreGegner > 55) highlights = " " + getStableRand(CAPTION_BLOCKS.HIGHLIGHTS.OFFENSE, seed);
  else if (scoreHeim + scoreGegner < 45) highlights = " " + getStableRand(CAPTION_BLOCKS.HIGHLIGHTS.DEFENSE, seed);

  let scorers = "";
  const fmt = settings.scorerFormat || 'last_name';
  if (fmt !== 'none' && statsSummary?.playerStats) {
    const list = [];
    Object.entries(statsSummary.playerStats).forEach(([id, st]) => {
      const n = statsSummary.playerNames[id] || `Spieler ${id}`;
      const d = fmt === 'last_name' ? n.split(' ').pop() : n;
      if ((st.goals || 0) > 0) list.push(`${d} (${st.goals})`); else list.push(`${d}`);
    });
    if (list.length > 0) {
      list.sort((a, b) => {
        const getG = (s) => { const m = s.match(/\((\d+)\)/); return m ? parseInt(m[1], 10) : 0; };
        return getG(b) - getG(a) || a.localeCompare(b);
      });
      scorers = `\n\n🎯 Torschützen: ${list.join(', ')}`;
    }
  }

  const gameInfo = `🏁 Endergebnis: ${teamHeim} ${scoreHeim}:${scoreGegner} ${teamGegner}`;
  const hashtags = settings.hashtags ? `\n\n${settings.hashtags}` : "";
  return `${intro}\n\n${gameInfo}\n\n${narrative}${highlights}\n\n${getStableRand(CAPTION_BLOCKS.CLOSING, seed)}${scorers}${hashtags}`;
};
