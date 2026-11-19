// Holt fehlende Cover für die Topliste über die BGG-API.
// Aufruf (PowerShell, im Projektordner):
//   $env:BGG_TOKEN = "<dein Token>"; .\.werkzeuge\node-v26.13.0-win-x64\node.exe topliste\cover-holen.mjs
// Ergebnis: Bilder in topliste/cover/<BGG-ID>.jpg und eine Trefferliste in topliste/cover-treffer.json.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { leseSuche, leseThings } from "../skripte/lib/bgg.mjs";

const ORDNER = path.dirname(fileURLToPath(import.meta.url));
const BASIS = "https://boardgamegeek.com/xmlapi2";
const token = process.env.BGG_TOKEN;
if (!token) { console.error("BGG_TOKEN fehlt. Bitte vorher setzen (siehe Kopf der Datei)."); process.exit(1); }

// Name auf der Topliste → Suchbegriff bei BGG
const SPIELE = {
  "Frosthaven": "Frosthaven",
  "Harmonies": "Harmonies",
  "Terra Mystica": "Terra Mystica",
  "Blood on the Clocktower": "Blood on the Clocktower",
  "Next Station: London": "Next Station: London",
  "Terra Nova": "Terra Nova",
  "Tea Garden": "Tea Garden",
  "Luthier": "Luthier",
  "Arctica": "Arctica",
  "Leaders": "Leaders",
  "Alchemisten": "Alchemisten",
  "Artengarten": "Artengarten",
};

const warte = (ms) => new Promise((r) => setTimeout(r, ms));
async function xml(pfad) {
  for (let v = 1; v <= 4; v++) {
    const a = await fetch(BASIS + pfad, { headers: { Authorization: `Bearer ${token}` } });
    if (a.status === 200) return a.text();
    if (a.status === 401 || a.status === 403) throw new Error(`BGG lehnt den Token ab (${a.status}).`);
    await warte(2000 * v);
  }
  throw new Error("BGG antwortet nicht.");
}

const treffer = {};
for (const [name, suche] of Object.entries(SPIELE)) {
  const liste = leseSuche(await xml(`/search?type=boardgame&query=${encodeURIComponent(suche)}`));
  const exakt = liste.filter((t) => t.name.toLowerCase() === suche.toLowerCase())
    .sort((a, b) => (b.jahr ?? 0) - (a.jahr ?? 0));
  const wahl = exakt[0] ?? liste[0];
  treffer[name] = { gewaehlt: wahl ?? null, weitere: liste.filter((t) => t !== wahl).slice(0, 8) };
  console.log(`${name}: ${wahl ? `${wahl.name} (${wahl.jahr ?? "?"}) #${wahl.id}` : "kein Treffer"}`);
  await warte(1500);
}

const ids = Object.values(treffer).map((t) => t.gewaehlt?.id).filter(Boolean);
const things = leseThings(await xml(`/thing?id=${ids.join(",")}`));
for (const t of things) {
  if (!t.bildQuelle) continue;
  const url = new URL(t.bildQuelle.startsWith("//") ? "https:" + t.bildQuelle : t.bildQuelle);
  if (url.protocol !== "https:" || !url.hostname.endsWith(".geekdo-images.com")) continue;
  const a = await fetch(url);
  if (!a.ok) { console.warn(`Cover für #${t.id} nicht ladbar (${a.status})`); continue; }
  fs.writeFileSync(path.join(ORDNER, "cover", `${t.id}.jpg`), Buffer.from(await a.arrayBuffer()));
  await warte(500);
}

fs.writeFileSync(path.join(ORDNER, "cover-treffer.json"), JSON.stringify(treffer, null, 1) + "\n");
console.log(`\nFertig: ${things.length} Cover geladen. Trefferliste: topliste/cover-treffer.json`);
