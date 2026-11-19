// Erzeugt die Daten für topliste/boardgames.html aus den Partien des Spieleclubs.
// Spielzeit = Partien × maximale Spieldauer laut BGG (wie auf der Website und im Dashboard).
// Aufruf im Projektordner: .\.werkzeuge\node-v26.13.0-win-x64\node.exe topliste\boardgames-erzeugen.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ladeDaten, rangliste } from "../skripte/lib/daten.mjs";

const ORDNER = path.dirname(fileURLToPath(import.meta.url));
process.chdir(path.join(ORDNER, ".."));

const JAHRE = ["2025", "2026"];
const d = await ladeDaten();
const spiele = new Map(d.alleSpiele.map((s) => [s.schluessel, s]));
const dauer = (k) => spiele.get(k)?.bgg?.maxDauer ?? null;

const benutzt = new Set();
function eintrag(z) {
  const s = spiele.get(z.schluessel);
  benutzt.add(z.schluessel);
  return { name: s?.name ?? z.schluessel, partien: z.partien, minuten: z.spielzeit, cover: s?.bgg?.cover ? path.basename(s.bgg.cover) : null };
}
const top = (praefix, n) => rangliste(d.partien.filter((p) => p.datum.startsWith(praefix)), null, dauer).slice(0, n).map(eintrag);

const daten = { stand: d.heute, jahre: {}, monate: {} };
for (const j of JAHRE) {
  const partien = d.partien.filter((p) => p.datum.startsWith(j));
  daten.jahre[j] = { top: top(j, 5), partien: partien.length, spiele: new Set(partien.map((p) => p.schluessel)).size };
  for (let m = 1; m <= 12; m++) {
    const schluessel = `${j}-${String(m).padStart(2, "0")}`;
    const [erster] = top(schluessel, 1);
    if (erster) daten.monate[schluessel] = erster;
  }
}

// Cover aus dem Website-Bestand neben die Seite legen
fs.mkdirSync(path.join(ORDNER, "cover"), { recursive: true });
for (const k of benutzt) {
  const quelle = spiele.get(k)?.bgg?.cover;
  if (!quelle) continue;
  const von = path.join("src", quelle), nach = path.join(ORDNER, "cover", path.basename(quelle));
  if (fs.existsSync(von) && !fs.existsSync(nach)) fs.copyFileSync(von, nach);
}

fs.writeFileSync(path.join(ORDNER, "boardgames-daten.js"),
  "// Erzeugt von topliste/boardgames-erzeugen.mjs, nicht von Hand ändern.\nwindow.DATEN = " + JSON.stringify(daten, null, 1) + ";\n");
console.log(`boardgames-daten.js geschrieben, Stand ${d.heute}: ${Object.keys(daten.monate).length} Monate.`);
