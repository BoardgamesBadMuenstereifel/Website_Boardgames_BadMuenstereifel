// Macht aus daten/id-vorschlaege.json eine Excel-Liste zum Prüfen: daten/id-pruefen.xlsx.
// In der Spalte „Übernehmen“ trägt man „Ja“, eine andere BGG-ID oder „Nein“ ein.
// Mit „node skripte/id-pruefliste.mjs --uebernehmen“ landen die bestätigten IDs in daten/spiele.xlsx.
import fs from "node:fs";
import readExcelFile from "read-excel-file/node";
import writeExcelFile from "write-excel-file/node";

const VORSCHLAEGE = "daten/id-vorschlaege.json";
const PRUEFEN = "daten/id-pruefen.xlsx";
const SPIELE = "daten/spiele.xlsx";
const KOPF = ["Spiel", "Übernehmen", "BGG-ID", "Name bei BGG", "Jahr", "Link", "Alternative 2", "Alternative 3"];

const fett = (texte) => texte.map((t) => ({ value: t, fontWeight: "bold" }));
const zelle = (wert) => (wert === null || wert === undefined || wert === "" ? null : { value: wert });
const alternative = (t) => (t ? `${t.name} (${t.jahr ?? "?"}), ID ${t.id}` : null);

async function liste() {
  const vorschlaege = JSON.parse(fs.readFileSync(VORSCHLAEGE, "utf8"));
  const spiele = (await readExcelFile(SPIELE))[0].data;
  const ohneId = new Set(spiele.slice(1).filter((z) => z[0] && !z[1]).map((z) => String(z[0])));
  const zeilen = Object.entries(vorschlaege)
    .filter(([name]) => ohneId.has(name))
    .map(([name, treffer]) => {
      const [t, t2, t3] = treffer;
      if (!t) return [name, null, null, "kein Treffer bei BGG", null, null, null, null];
      return [name, null, t.id, t.name, t.jahr, `https://boardgamegeek.com/boardgame/${t.id}`, alternative(t2), alternative(t3)];
    });
  await writeExcelFile([{
    sheet: "Prüfen", data: [fett(KOPF), ...zeilen.map((z) => z.map(zelle))],
    columns: [34, 13, 10, 40, 7, 44, 44, 44].map((width) => ({ width })), stickyRowsCount: 1,
  }]).toFile(PRUEFEN);
  console.log(`${zeilen.length} Vorschläge in ${PRUEFEN}.`);
}

async function uebernehmen() {
  const pruefen = (await readExcelFile(PRUEFEN))[0].data.slice(1);
  const ids = new Map();
  for (const [name, antwort, id] of pruefen) {
    const a = String(antwort ?? "").trim();
    if (/^ja$/i.test(a) && id) ids.set(String(name), String(id));
    else if (/^\d+$/.test(a)) ids.set(String(name), a);
  }
  const blaetter = await readExcelFile(SPIELE);
  const [kopf, ...zeilen] = blaetter[0].data;
  let neu = 0;
  for (const z of zeilen) if (z[0] && !z[1] && ids.has(String(z[0]))) { z[1] = ids.get(String(z[0])); neu++; }
  await writeExcelFile([{
    sheet: blaetter[0].sheet, data: [fett(kopf), ...zeilen.map((z) => z.map(zelle))],
    columns: [44, 11, 11, 24, 7, 11].map((width) => ({ width })), stickyRowsCount: 1,
  }]).toFile(SPIELE);
  console.log(`${neu} BGG-IDs in ${SPIELE} eingetragen.`);
}

await (process.argv.includes("--uebernehmen") ? uebernehmen() : liste());
