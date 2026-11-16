// Baut das interaktive Dashboard als einzelne HTML-Datei.
//
// Lokal:   node skripte/dashboard.mjs (oder Doppelklick auf Dashboard.cmd)
//          -> dashboard.html im Projektordner, Cover eingebettet. Steht in .gitignore.
// Website: node skripte/dashboard.mjs --web _site/dashboard/index.html
//          -> Seite unter /dashboard/. Cover und Schriften kommen von der Website selbst.
//          Die Seite ist nirgends verlinkt, steht nicht in der Sitemap und ist für Suchmaschinen gesperrt.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ladeDaten } from "./lib/daten.mjs";

const wurzel = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(wurzel);

const webIndex = process.argv.indexOf("--web");
const web = webIndex !== -1;
const ziel = web ? process.argv[webIndex + 1] : "dashboard.html";
if (web && !ziel) throw new Error("Nach --web fehlt der Zielpfad, z. B. _site/dashboard/index.html");

const d = await ladeDaten();
const index = new Map(d.alleSpiele.map((s, i) => [s.schluessel, i]));

// Lokal werden die Cover eingebettet, damit sie überall erscheinen, auch wenn dashboard.html woanders geöffnet wird.
// Verkleinert (sharp), damit die Datei handlich bleibt; ohne sharp kommen die Originale hinein.
// Auf der Website liegen die Cover schon unter /assets/cover/, die Seite verweist nur darauf (relativ, passt zu jedem Pfad).
const covers = new Map();
if (!web) {
  let sharp = null;
  try { sharp = (await import("sharp")).default; } catch { /* dann eben die Originale */ }
  for (const s of d.alleSpiele) {
    const datei = s.bgg?.cover ? path.join("src", s.bgg.cover) : null;
    if (!datei || !fs.existsSync(datei)) continue;
    try {
      const klein = sharp ? await sharp(datei).resize(120, 120, { fit: "inside" }).webp({ quality: 70 }).toBuffer() : null;
      covers.set(s.schluessel, klein ? "data:image/webp;base64," + klein.toString("base64") : "data:image/jpeg;base64," + fs.readFileSync(datei).toString("base64"));
    } catch { /* Spiel erscheint ohne Cover */ }
  }
}
const cover = (s) => {
  if (!s.bgg?.cover) return null;
  return web ? ".." + s.bgg.cover : covers.get(s.schluessel) ?? null;
};

const daten = {
  heute: d.heute,
  spiele: d.alleSpiele.map((s) => ({
    name: s.name, sammlung: s.sammlung, kat: s.kategorie, neu: s.neu, verkauf: s.verkauf, id: s.bggId,
    bggName: s.bgg?.name ?? null, note: s.bgg?.bewertung ?? null, kompl: s.bgg?.komplexitaet ?? null,
    min: s.bgg?.minSpieler ?? null, max: s.bgg?.maxSpieler ?? null,
    dauerMin: s.bgg?.minDauer ?? null, dauer: s.bgg?.maxDauer ?? null,
    jahr: s.bgg?.jahr ?? null, alter: s.bgg?.alter ?? null, verlage: s.bgg?.verlage ?? [],
    cover: cover(s),
    unsereNote: s.bewertung?.schnitt ?? null,
  })),
  partien: d.partien.map((p) => [p.datum, index.get(p.schluessel)]),
};

let html = fs.readFileSync(path.join("skripte", "dashboard-vorlage.html"), "utf8");
if (web) {
  // Die Website kopiert die Schriften nach /assets/schriften/ (siehe eleventy.config.js)
  html = html.replaceAll("node_modules/@fontsource/fraunces/files/", "../assets/schriften/")
    .replaceAll("node_modules/@fontsource/atkinson-hyperlegible/files/", "../assets/schriften/");
}
const json = JSON.stringify(daten).replace(/</g, "\\u003c");
fs.mkdirSync(path.dirname(ziel), { recursive: true });
fs.writeFileSync(ziel, html.replace('"__DATEN__"', () => json));
console.log(`${ziel} geschrieben: ${daten.spiele.length} Spiele, ${daten.partien.length} Partien, Stand ${d.heute}.`);
