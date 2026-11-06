// Einmalig: Legt daten/*.xlsx aus den beiden Ausgangslisten an.
// Bricht ab, wenn es die Dateien schon gibt, damit nichts überschrieben wird.
import fs from "node:fs";
import readExcelFile from "read-excel-file/node";
import writeExcelFile from "write-excel-file/node";
import { leseDatum, namensSchluessel } from "./lib/daten.mjs";

const ziele = ["partien", "spiele", "termine", "empfehlungen", "vorstellungen"].map((n) => `daten/${n}.xlsx`);
if (ziele.some((z) => fs.existsSync(z))) {
  console.error("daten/ enthält schon Listen. Abbruch, damit nichts überschrieben wird.");
  process.exit(1);
}
fs.mkdirSync("daten", { recursive: true });

const zelle = (wert) => (wert === null || wert === undefined || wert === "" ? null : { value: wert });
const fett = (texte) => texte.map((t) => ({ value: t, fontWeight: "bold" }));
const blatt = (sheet, kopf, zeilen, breiten) => ({
  sheet, data: [fett(kopf), ...zeilen.map((z) => z.map(zelle))], columns: breiten.map((width) => ({ width })),
  stickyRowsCount: 1,
});
const deutsch = (iso) => iso.split("-").reverse().join(".");

const [gespielt] = await readExcelFile("Boardgames_Gepsielt_Liste.xlsx");
const partien = gespielt.data.slice(1).filter((z) => z[0] && z[1]).map((z) => [deutsch(leseDatum(z[0])), String(z[1]).trim()]);
await writeExcelFile([blatt("Partien", ["Datum", "Spiel"], partien, [13, 48])]).toFile("daten/partien.xlsx");

const sammlung = (await readExcelFile("Brettspielsammlung.xlsx")).find((b) => b.sheet === "Sammlung").data.slice(1).filter((z) => z[0]);
const spiele = new Map();
for (const z of sammlung) {
  spiele.set(namensSchluessel(z[0]), [String(z[0]).trim(), null, "Ja", z[1] ?? null, z[2] ?? null, z[3] ?? null]);
}
for (const [, name] of partien) {
  const k = namensSchluessel(name);
  if (!spiele.has(k)) spiele.set(k, [name, null, null, null, null, null]);
}
const zeilen = [...spiele.values()].sort((a, b) => a[0].localeCompare(b[0], "de"));
await writeExcelFile([blatt("Spiele", ["Spiel", "BGG-ID", "Sammlung", "Kategorie", "Neu", "Im Verkauf"], zeilen, [44, 11, 11, 24, 7, 11])]).toFile("daten/spiele.xlsx");

const KESSEL = "Kupferkessel, Schönau", DGH = "DGH, Lorbach";
const ABEND = "Erst Essen, Spielbeginn ca. 19 Uhr", SAMSTAG = "Ohne Essen, wir spielen gleich los";
await writeExcelFile([
  blatt("Termine", ["Datum", "Bis", "Uhrzeit", "Ort", "Art", "Hinweis"], [
    ["04.11.2026", null, "18:00", KESSEL, "Spieleabend", ABEND],
    ["14.11.2026", null, "16:00", DGH, "Spieleabend", SAMSTAG],
    ["19.11.2026", null, "18:00", KESSEL, "Spieleabend", ABEND],
    ["02.12.2026", null, "18:00", KESSEL, "Spieleabend", ABEND],
    ["17.12.2026", null, "18:00", KESSEL, "Spieleabend", ABEND],
  ], [13, 13, 9, 26, 22, 42]),
  blatt("Orte", ["Ort", "Adresse"], [
    [KESSEL, "Eicherscheider Straße 9, 53902 Bad Münstereifel"],
    [DGH, null],
    ["ERFTWERK4, Bad Münstereifel", null],
  ], [30, 52]),
]).toFile("daten/termine.xlsx");

const empfehlungen = [
  ["Kinder 3–6", "Obstgarten"], ["Kinder 3–6", "Ice Cool"], ["Kinder 3–6", "Dobble"],
  ["Kinder 6–10", "Quacks und Co"], ["Kinder 6–10", "Karak"], ["Kinder 6–10", "Lama"],
  ["Jugendliche", "Just One"], ["Jugendliche", "Dixit"], ["Jugendliche", "Azul"],
  ["Familien", "Zug um Zug"], ["Familien", "Cascadia"], ["Familien", "Sky Team"],
  ["Kenner & Experten", "Arche Nova"], ["Kenner & Experten", "Seti"], ["Kenner & Experten", "Terraforming Mars"],
].map(([k, s]) => [k, s, null, null]);
await writeExcelFile([blatt("Empfehlungen", ["Kategorie", "Spiel", "Kurzbegründung", "Freigegeben"], empfehlungen, [22, 34, 50, 12])]).toFile("daten/empfehlungen.xlsx");

await writeExcelFile([
  blatt("Vorstellungen", ["Spiel", "Datum", "Beschreibung", "Für wen", "Freigegeben"], [
    ["Bomb Busters", "30.10.2026",
      "Ihr entschärft gemeinsam eine Bombe. Dazu schneidet ihr der Reihe nach Drähte durch, die ihr nur aus den Hinweisen der anderen erschließen könnt. Wer eine falsche Verbindung rät, riskiert die Explosion für alle.",
      "Für Gruppen, die gerne gemeinsam knobeln und miteinander reden. Schnell erklärt, aber mit Spannung. Eher nichts für Spieler, die lieber im Alleingang planen.", null],
  ], [26, 13, 70, 60, 12]),
  blatt("Wertungen", ["Spiel", "Spieler", "Note", "Zitat"], [
    ["Bomb Busters", "Martin", 6, "Spannend, aber ich tue mich mit dem Zufall schwer."],
    ["Bomb Busters", "Stephan", 8, "Perfekt für zwischendurch, wir spielen es ständig."],
  ], [26, 16, 7, 70]),
]).toFile("daten/vorstellungen.xlsx");

console.log(`${partien.length} Partien, ${zeilen.length} Spiele angelegt.`);
