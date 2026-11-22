// Erzeugt die Daten für topliste/monat.html: je Monat alle gespielten Spiele nach Spielzeit,
// Premieren und die meistgespielten Themen, Mechaniken, Designer, Illustration und Verlage laut BoardGameGeek.
// Spielzeit = Partien × maximale Spieldauer laut BGG (wie auf der Website und in boardgames.html).
// Themen und Mechaniken kommen aus daten/bgg-cache.json (füllt der Website-Workflow mit skripte/bgg-abruf.mjs).
// Aufruf im Projektordner: .\.werkzeuge\node-v26.13.0-win-x64\node.exe topliste\monat-erzeugen.mjs
// Website: node topliste/monat-erzeugen.mjs --web _site/monatsrueckblick
//   legt dort index.html und monat-daten.js ab; die Cover kommen aus /assets/cover/ der Website.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ladeDaten, rangliste } from "../skripte/lib/daten.mjs";

const ORDNER = path.dirname(fileURLToPath(import.meta.url));
const webIndex = process.argv.indexOf("--web");
if (webIndex !== -1 && !process.argv[webIndex + 1]) throw new Error("Nach --web fehlt der Zielordner, z. B. _site/monatsrueckblick");
const webZiel = webIndex === -1 ? null : path.resolve(process.argv[webIndex + 1]);
process.chdir(path.join(ORDNER, ".."));

const ANZAHL_MERKMALE = 6;

// BGG-Begriffe auf Deutsch. Was hier fehlt, erscheint englisch wie bei BGG.
const DEUTSCH = {
  // Themen (BGG: categories)
  "Abstract Strategy": "Abstrakt", "Adventure": "Abenteuer", "Age of Reason": "Aufklärung", "Ancient": "Antike",
  "Animals": "Tiere", "Arabian": "Orient", "Bluffing": "Bluffen", "Card Game": "Kartenspiel", "Children's Game": "Kinderspiel",
  "City Building": "Städtebau", "Civilization": "Zivilisation", "Collectible Components": "Sammelkomponenten",
  "Deduction": "Deduktion", "Dice": "Würfel", "Economic": "Wirtschaft", "Educational": "Lernspiel", "Environmental": "Umwelt",
  "Exploration": "Entdeckung", "Fantasy": "Fantasy", "Farming": "Landwirtschaft", "Fighting": "Kampf", "Horror": "Horror",
  "Humor": "Humor", "Industry / Manufacturing": "Industrie", "Mafia": "Mafia", "Math": "Mathematik", "Mature / Adult": "Für Erwachsene",
  "Maze": "Labyrinth", "Medical": "Medizin", "Medieval": "Mittelalter", "Memory": "Gedächtnis", "Miniatures": "Miniaturen",
  "Murder / Mystery": "Krimi", "Mythology": "Mythologie", "Nautical": "Seefahrt", "Negotiation": "Verhandeln", "Novel-based": "Romanvorlage",
  "Party Game": "Partyspiel", "Pirates": "Piraten", "Political": "Politik", "Prehistoric": "Urzeit", "Puzzle": "Puzzle",
  "Racing": "Rennen", "Real-time": "Echtzeit", "Renaissance": "Renaissance", "Science Fiction": "Science-Fiction", "Space Exploration": "Weltraum",
  "Spies / Secret Agents": "Spionage", "Sports": "Sport", "Territory Building": "Gebietsaufbau", "Trains": "Eisenbahn",
  "Transportation": "Transport", "Travel": "Reisen", "Trivia": "Quiz", "Video Game Theme": "Videospiel", "Wargame": "Kriegsspiel",
  "Word Game": "Wortspiel", "Zombies": "Zombies", "Modern Warfare": "Moderne Kriegsführung", "American West": "Wilder Westen",
  "Movies / TV / Radio theme": "Film und Fernsehen", "Music": "Musik", "Religious": "Religion", "Electronic": "Elektronik",
  "Action / Dexterity": "Geschicklichkeit", "Book": "Buch", "Comic Book / Strip": "Comic", "Napoleonic": "Napoleonisch",
  "Post-Napoleonic": "Nach Napoleon", "World War I": "Erster Weltkrieg", "World War II": "Zweiter Weltkrieg",
  "Expansion for Base-game": "Erweiterung", "Print & Play": "Print & Play", "Aviation / Flight": "Luftfahrt",
  // Mechaniken
  "Hand Management": "Kartenhand", "Set Collection": "Sets sammeln", "Worker Placement": "Arbeiter einsetzen",
  "Tile Placement": "Plättchen legen", "Dice Rolling": "Würfeln", "Drafting": "Drafting", "Open Drafting": "Offenes Drafting",
  "Closed Drafting": "Verdecktes Drafting", "Card Drafting": "Karten-Drafting", "Deck, Bag, and Pool Building": "Deckbau",
  "Engine Building": "Engine Building", "Area Majority / Influence": "Mehrheiten", "Cooperative Game": "Kooperativ",
  "Team-Based Game": "Teamspiel", "Variable Player Powers": "Unterschiedliche Fähigkeiten", "Variable Set-up": "Variabler Aufbau",
  "End Game Bonuses": "Schlusswertung", "Pattern Building": "Muster bauen", "Network and Route Building": "Netzwerkbau",
  "Push Your Luck": "Zocken", "Simultaneous Action Selection": "Gleichzeitige Aktionswahl", "Action Points": "Aktionspunkte",
  "Hidden Roles": "Geheime Rollen", "Deduction": "Deduktion", "Trick-taking": "Stichspiel", "Grid Movement": "Rasterbewegung",
  "Point to Point Movement": "Punkt-zu-Punkt-Bewegung", "Modular Board": "Modularer Spielplan", "Income": "Einkommen",
  "Contracts": "Aufträge", "Take That": "Ärgern", "Player Elimination": "Ausscheiden", "Solo / Solitaire Game": "Solo",
  "Communication Limits": "Eingeschränkte Kommunikation", "Memory": "Gedächtnis", "Paper-and-Pencil": "Papier und Stift",
  "Roll / Spin and Move": "Würfeln und ziehen", "Bidding": "Bieten", "Auction / Bidding": "Versteigern", "Auction: Dutch": "Holländische Auktion",
  "Trading": "Handeln", "Negotiation": "Verhandeln", "Voting": "Abstimmen", "Pattern Recognition": "Muster erkennen",
  "Real-Time": "Echtzeit", "Race": "Wettrennen", "Track Movement": "Leistenbewegung", "Turn Order: Progressive": "Wechselnde Startspieler",
  "Turn Order: Stat-Based": "Zugreihenfolge nach Wert", "Market": "Markt", "Grid Coverage": "Raster füllen", "Square Grid": "Quadratraster",
  "Hexagon Grid": "Sechseckraster", "Melding and Splaying": "Auslegen", "Enclosure": "Einschließen", "Scenario / Mission / Campaign Game": "Kampagne",
  "Narrative Choice / Paragraph": "Erzählentscheidungen", "Storytelling": "Geschichten erzählen", "Role Playing": "Rollenspiel",
  "Legacy Game": "Legacy", "Rondel": "Rondell", "Action Queue": "Aktionsreihe", "Action Drafting": "Aktionen wählen",
  "Follow": "Mitmachen", "Ladder Climbing": "Höher ausspielen", "Matching": "Paare finden", "Line Drawing": "Linien zeichnen",
  "Stacking and Balancing": "Stapeln", "Flicking": "Schnippen", "Dexterity": "Geschicklichkeit", "Acting": "Darstellen",
  "Singing": "Singen", "Speed Matching": "Schnell erkennen", "Bingo": "Bingo", "Betting and Bluffing": "Wetten und Bluffen",
  "Investment": "Investieren", "Loans": "Kredite", "Ownership": "Besitz", "Resource to Move": "Ressourcen für Bewegung",
  "Movement Points": "Bewegungspunkte", "Area Movement": "Gebietsbewegung", "Hidden Movement": "Verdeckte Bewegung",
  "Programmed Movement": "Programmierte Bewegung", "Secret Unit Deployment": "Verdeckte Aufstellung", "Critical Hits and Failures": "Kritische Würfe",
  "Die Icon Resolution": "Würfelsymbole", "Re-rolling and Locking": "Neu würfeln", "Random Production": "Zufallsertrag",
  "Mancala": "Mancala", "Chit-Pull System": "Marker ziehen", "Card Play Conflict Resolution": "Kartenkampf", "Lose a Turn": "Aussetzen",
  "Score-and-Reset Game": "Rundenwertung", "Victory Points as a Resource": "Siegpunkte als Ressource", "Increase Value of Unchosen Resources": "Aufwertung liegen gelassener Waren",
  "Multi-Use Cards": "Mehrzweckkarten", "Command Cards": "Befehlskarten", "Events": "Ereignisse", "Tech Trees / Tech Tracks": "Technologieleisten",
  "Track Building": "Strecken bauen", "Layering": "Übereinanderlegen", "Connections": "Verbindungen", "Advantage Token": "Vorteilsmarker",
  "Sudden Death Ending": "Plötzliches Spielende", "Interrupts": "Unterbrechungen", "Semi-Cooperative Game": "Halbkooperativ",
  "Traitor Game": "Verräter", "Induction": "Induktion", "Map Addition": "Spielplan erweitern", "Map Reduction": "Spielplan verkleinern",
  "Once-Per-Game Abilities": "Einmalige Fähigkeiten", "Order Counters": "Befehlsmarker", "Predictive Bid": "Ansagen", "Selection Order Bid": "Reihenfolge bieten",
  "Turn Order: Pass Order": "Reihenfolge nach Passen", "Turn Order: Claim Action": "Startspieler nehmen", "Slide/Push": "Schieben",
  "Pick-up and Deliver": "Aufnehmen und liefern", "Delayed Purchase": "Verzögerter Kauf", "Hot Potato": "Heiße Kartoffel",
  "Worker Placement, Different Worker Types": "Verschiedene Arbeiter", "Worker Placement with Dice Workers": "Würfel als Arbeiter",
  "I Cut, You Choose": "Teilen und wählen", "Kill Steal": "Beute stehlen", "Constrained Bidding": "Begrenztes Bieten",
  "Measurement Movement": "Bewegung mit Maßband", "Line of Sight": "Sichtlinie", "Zone of Control": "Kontrollzonen",
  "Minimap Resolution": "Minikarte", "Highest-Lowest Scoring": "Höchster-niedrigster Wert", "Neighbor Scope": "Nachbarschaft",
  "Bias": "Tendenz", "Moving Multiple Units": "Mehrere Einheiten bewegen", "Relative Movement": "Relative Bewegung",
  "Elapsed Real Time Ending": "Zeitlimit", "Stat Check Resolution": "Wertprobe", "Targeted Clues": "Gezielte Hinweise",
  "Sequential Resolution": "Nacheinander auswerten",
};
const deutsch = (s) => DEUTSCH[s] ?? s;

const d = await ladeDaten();
const spiele = new Map(d.alleSpiele.map((s) => [s.schluessel, s]));
const dauer = (k) => spiele.get(k)?.bgg?.maxDauer ?? null;

// Premiere: die erste Partie des Spiels im Club fällt in diesen Monat
const erstePartie = new Map();
for (const p of d.partien) if (!erstePartie.has(p.schluessel) || p.datum < erstePartie.get(p.schluessel)) erstePartie.set(p.schluessel, p.datum);
const ersterMonat = [...erstePartie.values()].sort()[0]?.slice(0, 7);

// Anteil an der Spielzeit je Thema oder Mechanik; nur Spiele, für die BGG die Merkmale kennt
// wert: Spiel -> Liste von Namen (Themen, Mechaniken, Designer …)
// zusammen: Namen, die im Monat nur bei genau denselben Spielen stehen (z. B. ein Autorenduo), werden ein Eintrag „A & B“
function merkmale(liste, wert, uebersetzen = (s) => s, zusammen = false) {
  const summe = new Map();
  let gesamt = 0;
  for (const z of liste) {
    const werte = wert(spiele.get(z.schluessel)?.bgg);
    if (!z.spielzeit || !Array.isArray(werte) || !werte.length) continue;
    gesamt += z.spielzeit;
    for (const w of new Set(werte.map(uebersetzen))) {
      const e = summe.get(w) ?? { minuten: 0, spiele: [] };
      e.minuten += z.spielzeit;
      e.spiele.push(z.schluessel);
      summe.set(w, e);
    }
  }
  const gruppen = new Map();
  for (const [name, e] of summe) {
    const key = zusammen ? e.spiele.slice().sort().join("|") : name;
    const g = gruppen.get(key) ?? { teile: [], minuten: e.minuten };
    g.teile.push(name);
    gruppen.set(key, g);
  }
  const verbinde = (t) => (t.length < 2 ? t[0] : t.slice(0, -1).join(", ") + " & " + t.at(-1));
  // Zusammengeführte Namen kurz wie auf Spieleschachteln: nur Nachnamen, große Teams „A, B & 4 weitere“.
  // Alle vollen Namen stehen in voll (Tooltip).
  const nachname = (n) => n.split(" ").at(-1);
  const kurz = (t) => (t.length < 2 ? t[0] : t.length <= 3 ? verbinde(t.map(nachname)) : `${nachname(t[0])}, ${nachname(t[1])} & ${t.length - 2} weitere`);
  return [...gruppen.values()]
    .map((g) => ({ name: kurz(g.teile), voll: g.teile.length > 1 ? verbinde(g.teile) : undefined, teile: g.teile.length > 1 ? g.teile : undefined, minuten: g.minuten }))
    .sort((a, b) => b.minuten - a.minuten || a.name.localeCompare(b.name, "de"))
    .slice(0, ANZAHL_MERKMALE).map((m) => ({ ...m, anteil: Math.round((m.minuten / gesamt) * 100) }));
}

// BGG unterscheidet Namensgleiche mit Zusätzen wie „Petr Štich (III)“ oder „Starling Games (II)“
const ohneZusatz = (s) => s.replace(/\s+\([IVX]+\)$/, "");

const IGNORIERTE_MECHANIKEN = new Set(["Solo / Solitaire Game"]);

// Feld -> [Werte aus dem BGG-Eintrag, Übersetzung, Duos zusammenführen]
const FELDER = {
  themen: [(b) => b?.kategorien, deutsch],
  // Ohne Solo: wir spielen die Spiele in der Gruppe, nicht allein
  mechaniken: [(b) => b?.mechaniken?.filter((m) => !IGNORIERTE_MECHANIKEN.has(m)), deutsch],
  designer: [(b) => b?.designer, ohneZusatz, true],
  illustration: [(b) => b?.illustration, ohneZusatz, true],
  // BGG nennt den Originalverlag zuerst, danach alle Lizenzausgaben
  verlage: [(b) => b?.verlage?.slice(0, 1), ohneZusatz],
};

const monate = {};
for (const schluessel of [...new Set(d.partien.map((p) => p.datum.slice(0, 7)))].sort()) {
  const partien = d.partien.filter((p) => p.datum.startsWith(schluessel));
  const liste = rangliste(partien, null, dauer);
  const listen = Object.fromEntries(Object.entries(FELDER).map(([feld, [wert, uebersetzen, zusammen]]) => [feld, merkmale(liste, wert, uebersetzen, zusammen)]));
  monate[schluessel] = {
    partien: partien.length,
    abende: new Set(partien.map((p) => p.datum)).size,
    spiele: liste.map((z) => {
      const s = spiele.get(z.schluessel);
      // Für die klickbaren Listen rechts: welche der gezeigten Merkmale hat dieses Spiel?
      const merkmaleSpiel = {};
      for (const [feld, [wert, uebersetzen = (x) => x]] of Object.entries(FELDER)) {
        const eigene = new Set((wert(s?.bgg) ?? []).map(uebersetzen));
        const treffer = listen[feld].filter((m) => (m.teile ?? [m.name]).some((n) => eigene.has(n))).map((m) => m.name);
        if (treffer.length) merkmaleSpiel[feld] = treffer;
      }
      return {
        name: s?.name ?? z.schluessel, partien: z.partien, minuten: z.spielzeit,
        cover: s?.bgg?.cover ? path.basename(s.bgg.cover) : null,
        premiere: erstePartie.get(z.schluessel).startsWith(schluessel),
        merkmale: merkmaleSpiel,
      };
    }),
    ...listen,
  };
}

const daten = { stand: d.heute, ersterMonat, monate };
const ausgabe = webZiel ?? ORDNER;
fs.mkdirSync(ausgabe, { recursive: true });
fs.writeFileSync(path.join(ausgabe, "monat-daten.js"),
  "// Erzeugt von topliste/monat-erzeugen.mjs, nicht von Hand ändern.\nwindow.MONATE = " + JSON.stringify(daten, null, 1) + ";\n");
if (webZiel) {
  // Gleiche Seite wie lokal, nur die Cover liegen auf der Website unter /assets/cover/
  const seite = fs.readFileSync(path.join(ORDNER, "monat.html"), "utf8");
  if (!seite.includes("../src/assets/cover/")) throw new Error("monat.html: Coverpfad ../src/assets/cover/ nicht gefunden.");
  fs.writeFileSync(path.join(webZiel, "index.html"), seite.replaceAll("../src/assets/cover/", "../assets/cover/"));
}
const mitMerkmalen = Object.values(monate).filter((m) => m.themen.length).length;
console.log(`${webZiel ? "index.html und " : ""}monat-daten.js in ${path.relative(process.cwd(), ausgabe)} geschrieben, Stand ${d.heute}: ${Object.keys(monate).length} Monate, ${mitMerkmalen} davon mit Themen und Mechaniken.`);
