// Holt Spielinfos von BoardGameGeek und speichert sie in daten/bgg-cache.json.
// Die Website liest nur diesen Cache. Fällt BGG aus, bleiben die alten Daten stehen.
// Der Token kommt aus der Umgebungsvariable BGG_TOKEN und wird nie ausgegeben.
// BGG_FIXTURES=1 nutzt die Beispiel-XML aus fixtures/ statt des Netzes.
import fs from "node:fs";
import path from "node:path";
import { ladeDaten } from "./lib/daten.mjs";
import { leseThings, leseSuche } from "./lib/bgg.mjs";

const BASIS = process.env.BGG_BASIS ?? "https://boardgamegeek.com/xmlapi2"; // BGG_BASIS nur für Tests
const PRO_ANFRAGE = 20;
const PAUSE_MS = Number(process.env.BGG_PAUSE_MS ?? 5000);
const MAX_VERSUCHE = 4;
const MAX_SUCHEN = 100;
const EINEN_TAG_MS = 23 * 3600 * 1000;
const COVER_ORDNER = "src/assets/cover";
const ORDNER = process.env.DATEN_ORDNER ?? "daten";
const CACHE = path.join(ORDNER, "bgg-cache.json");
const VORSCHLAEGE = path.join(ORDNER, "id-vorschlaege.json");

const token = process.env.BGG_TOKEN;
const fixtures = process.env.BGG_FIXTURES === "1";
const warte = (ms) => new Promise((r) => setTimeout(r, ms));
const lese = (datei, leer) => (fs.existsSync(datei) ? JSON.parse(fs.readFileSync(datei, "utf8")) : leer);

function schreibe(datei, inhalt) {
  fs.writeFileSync(datei + ".neu", JSON.stringify(inhalt, null, 1) + "\n");
  fs.renameSync(datei + ".neu", datei);
}

async function holeXml(pfad) {
  if (fixtures) return fs.readFileSync(`fixtures/${pfad.startsWith("/search") ? "bgg-search.xml" : "bgg-thing.xml"}`, "utf8");
  for (let versuch = 1; versuch <= MAX_VERSUCHE; versuch++) {
    let antwort;
    try {
      antwort = await fetch(BASIS + pfad, { headers: { Authorization: `Bearer ${token}` } });
    } catch (e) {
      console.warn(`BGG nicht erreichbar (Versuch ${versuch}): ${e.message}`);
      await warte(PAUSE_MS * versuch);
      continue;
    }
    if (antwort.status === 200) return antwort.text();
    if (antwort.status === 401 || antwort.status === 403) throw new Error(`BGG lehnt den Token ab (${antwort.status}).`);
    console.warn(`BGG antwortet ${antwort.status} (Versuch ${versuch}), warte kurz.`);
    await warte(PAUSE_MS * versuch * 2);
  }
  throw new Error("BGG antwortet nicht.");
}

async function holeCover(id, quelle) {
  if (fixtures || !quelle) return null;
  const url = new URL(quelle.startsWith("//") ? "https:" + quelle : quelle);
  if (url.protocol !== "https:" || !url.hostname.endsWith(".geekdo-images.com")) return null;
  const ziel = path.join(COVER_ORDNER, `${id}.jpg`);
  if (fs.existsSync(ziel)) return `/assets/cover/${id}.jpg`;
  const antwort = await fetch(url);
  if (!antwort.ok) return null;
  fs.mkdirSync(COVER_ORDNER, { recursive: true });
  fs.writeFileSync(ziel, Buffer.from(await antwort.arrayBuffer()));
  await warte(500);
  return `/assets/cover/${id}.jpg`;
}

async function main() {
  if (!token && !fixtures) {
    console.log("Kein BGG_TOKEN gesetzt: Es bleibt beim vorhandenen Cache.");
    return;
  }
  const { alleSpiele } = await ladeDaten();
  const cache = lese(CACHE, { spiele: {} });
  const jetzt = Date.now();
  const ids = [...new Set(alleSpiele.map((s) => s.bggId).filter(Boolean))];
  const offen = ids.filter((id) => !cache.spiele[id] || jetzt - Date.parse(cache.spiele[id].abgerufen) > EINEN_TAG_MS);
  console.log(`${ids.length} Spiele mit BGG-ID, ${offen.length} werden abgerufen.`);

  try {
    for (let i = 0; i < offen.length; i += PRO_ANFRAGE) {
      const teil = offen.slice(i, i + PRO_ANFRAGE);
      const things = leseThings(await holeXml(`/thing?id=${teil.join(",")}&stats=1`));
      const abgerufen = new Date().toISOString();
      for (const t of things) {
        if (!teil.includes(t.id)) continue;
        const { bildQuelle, ...rest } = t;
        const cover = await holeCover(t.id, bildQuelle).catch(() => null);
        cache.spiele[t.id] = { ...rest, cover: cover ?? cache.spiele[t.id]?.cover ?? null, abgerufen };
      }
      for (const id of teil) if (!things.some((t) => t.id === id)) cache.spiele[id] = { fehlt: true, abgerufen };
      schreibe(CACHE, cache);
      if (i + PRO_ANFRAGE < offen.length && !fixtures) await warte(PAUSE_MS);
    }

    const vorschlaege = lese(VORSCHLAEGE, {});
    const ohneId = alleSpiele.filter((s) => !s.bggId && !(s.name in vorschlaege)).slice(0, MAX_SUCHEN);
    for (const s of ohneId) {
      const treffer = leseSuche(await holeXml(`/search?type=boardgame&query=${encodeURIComponent(s.name)}`));
      const exakt = treffer.filter((t) => t.name.toLowerCase() === s.name.toLowerCase());
      vorschlaege[s.name] = (exakt.length ? exakt : treffer).slice(0, 3);
      schreibe(VORSCHLAEGE, vorschlaege);
      if (!fixtures) await warte(PAUSE_MS);
    }
    if (ohneId.length) console.log(`${ohneId.length} ID-Vorschläge gesucht. Sie werden nie automatisch übernommen.`);
  } catch (e) {
    console.warn(`BGG-Abruf abgebrochen: ${e.message} Die Website nutzt die zuletzt gespeicherten Daten.`);
  }
}

await main();
