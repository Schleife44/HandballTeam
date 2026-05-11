/**
 * Sechsmeter Caption Templates
 * Eine riesige Sammlung an Textbausteinen für Social Media Posts.
 */

export const CAPTION_TEMPLATES = {
  VICTORY_HOME: [
    "HEIMSIEG! 🔥 Unsere Festung bleibt uneingenommen. Danke an alle Fans für die unglaubliche Stimmung!",
    "Zuhause sind wir eine Macht! 💪 Zwei Punkte bleiben in eigener Halle. Was für ein Kampf!",
    "HEIMSPIEL-WAHNSINN! ✨ Gemeinsam mit euch im Rücken haben wir das Ding nach Hause geschaukelt.",
    "Der Heimvorteil hat gereicht! 🏠 Überragende Teamleistung und ein verdienter Sieg vor unseren Fans.",
    "Sieg in der eigenen Halle! 🤜🤛 Die Punkte bleiben hier. Danke für euren Support!"
  ],
  VICTORY_AWAY: [
    "AUSWÄRTSSIEG! 🔥 Die Punkte nehmen wir mit nach Hause. Danke an die mitgereisten Fans!",
    "Auswärtsmacht! 💪 Auch in der Fremde lassen wir nichts anbrennen. Starke Leistung, Männer!",
    "Zwei Punkte im Gepäck! 🚌 Die Heimreise wird nach diesem Sieg besonders süß.",
    "In fremder Halle bestanden! ✨ Wir haben kühlen Kopf bewahrt und den Sieg eingefahren.",
    "AUSWÄRTS-COUP! 🤜🤛 Wahnsinn, wie wir uns hier heute präsentiert haben."
  ],
  LOSS: [
    "KOPF HOCH! 🤾‍♂️ Heute hat es leider nicht gereicht, aber wir kommen stärker zurück.",
    "Kampf gezeigt, leider ohne Belohnung. ✨ Danke für euren Support, wir greifen nächste Woche wieder an!",
    "Mund abputzen, weitermachen. 💪 Heute war nicht unser Tag, aber die Saison ist noch lang.",
    "Knapp vorbei... 😔 Wir haben alles gegeben, am Ende haben Kleinigkeiten entschieden.",
    "Niederlage einstecken und daraus lernen. 🤜🤛 Danke an alle, die uns heute unterstützt haben."
  ],
  DRAW: [
    "PUNKTETEILUNG! 🤝 Ein intensives Spiel endet mit einem Unentschieden. Gerechtes Ergebnis!",
    "Krimi bis zur letzten Sekunde! ✨ Am Ende nehmen beide Teams einen Punkt mit.",
    "Unentschieden! 🤾‍♂️ Ein harter Kampf auf beiden Seiten. Wir nehmen den Punkt mit.",
    "Remis! 🤜🤛 Was für eine Achterbahnfahrt der Gefühle heute in der Halle.",
    "Punktgewinn oder Punktverlust? 🤝 Auf jeden Fall ein Spiel, das alles geboten hat!"
  ],
  KRIMI: [
    "WAS FÜR EIN KRIMI! 🔥 Nerven aus Stahl in der Crunchtime. Wir haben das Ding gedreht!",
    "Purer Wahnsinn! ✨ Nichts für schwache Nerven heute. Wir sind unglaublich stolz auf dieses Team.",
    "Herzschlag-Finale! 💓 Bis zur letzten Sekunde gezittert und am Ende belohnt worden.",
    "Handball-Drama pur! 🤾‍♂️ Solche Spiele schreibt nur unser Sport. Sieg in letzter Sekunde!",
    "WAHNSINN! 💪 Wir haben nie aufgehört zu glauben und uns diesen Sieg erkämpft."
  ],
  DEUTLICH: [
    "DOMINANTE LEISTUNG! 🔥 Von der ersten Minute an keinen Zweifel aufkommen lassen.",
    "Klarer Sieg! 💪 Heute hat einfach alles gepasst. Starke Performance über 60 Minuten.",
    "Schützenfest! ✨ Wir haben uns heute in einen Rausch gespielt. Danke für die Unterstützung!",
    "Souveräner Auftritt! 🤜🤛 Den Gegner heute zu jeder Zeit im Griff gehabt.",
    "KLASSEN-ERGEBNIS! 🔥 Ein deutlicher Sieg, der Selbstvertrauen für die nächsten Aufgaben gibt."
  ],
  DERBY: [
    "DERBYSIEG! 🔥 Die Nummer 1 in der Region sind wir. Was für ein wichtiger Erfolg!",
    "Derbysieger, Derbysieger, hey, hey! 🤜🤛 Emotionen pur und zwei ganz wichtige Punkte.",
    "Prestige-Erfolg! ✨ Wir haben das Derby für uns entschieden. Die Halle hat gebebt!",
    "Derby-Wahnsinn! 💪 Danke für diesen unfassbaren Support im wichtigsten Spiel der Saison.",
    "Lokalrivalen bezwungen! 🔥 Die Punkte bleiben bei uns. Stolz auf dieses Team!"
  ]
};

export const getRandomTemplate = (type) => {
  const templates = CAPTION_TEMPLATES[type] || CAPTION_TEMPLATES.VICTORY_HOME;
  return templates[Math.floor(Math.random() * templates.length)];
};
