import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { spawn } from "node:child_process";
import writeExcelFile from "write-excel-file/node";
import { ladeDaten, leseDatum, leseUhrzeit, monateZurueck, rangliste, slug } from "../skripte/lib/daten.mjs";
import { leseThings, leseSuche } from "../skripte/lib/bgg.mjs";

const tabelle = (sheet, zeilen) => ({ sheet, data: zeilen.map((z) => z.map((value) => (value === null ? null : { value }))) });

async function testOrdner({ spiele, partien, termine, orte = [["Ort", "Adresse"]], cache }) {
  const ordner = fs.mkdtempSync(path.join(os.tmpdir(), "bgg-test-"));
  await writeExcelFile([tabelle("Spiele", spiele)]).toFile(path.join(ordner, "spiele.xlsx"));
  await writeExcelFile([tabelle("Partien", partien)]).toFile(path.join(ordner, "partien.xlsx"));
  await writeExcelFile([tabelle("Termine", termine), tabelle("Orte", orte)]).toFile(path.join(ordner, "termine.xlsx"));
  if (cache) fs.writeFileSync(path.join(ordner, "bgg-cache.json"), JSON.stringify(cache));
  return ordner;
}
const KOPF_SPIELE = ["Spiel", "BGG-ID", "Sammlung", "Kategorie", "Neu", "Im Verkauf"];
const KOPF_TERMINE = ["Datum", "Bis", "Uhrzeit", "Ort", "Art", "Hinweis"];

test("Datum und Uhrzeit: übliche Schreibweisen, Unsinn ergibt null", () => {
  assert.equal(leseDatum("22.10.2026"), "2026-10-22");
  assert.equal(leseDatum("1.2.26"), "2026-02-01");
  assert.equal(leseDatum("2026-10-22"), "2026-10-22");
  assert.equal(leseDatum(new Date(Date.UTC(2026, 9, 22))), "2026-10-22");
  assert.equal(leseDatum(44994), "2023-03-09");
  assert.equal(leseDatum("31.02.2026"), null);
  assert.equal(leseDatum("morgen"), null);
  assert.equal(leseUhrzeit("18:00"), "18:00");
  assert.equal(leseUhrzeit("18 Uhr"), "18:00");
  assert.equal(leseUhrzeit(0.75), "18:00");
  assert.equal(leseUhrzeit("abends"), null);
});

test("Zeiträume: Monatsende wird sauber behandelt", () => {
  assert.equal(monateZurueck("2026-10-30", 3), "2026-07-30");
  assert.equal(monateZurueck("2026-05-31", 3), "2026-02-28");
  assert.equal(monateZurueck("2026-10-30", 12), "2025-10-30");
});

test("Rangliste: nach Partien, bei Gleichstand das zuletzt gespielte zuerst", () => {
  const p = [["a", "2026-01-01"], ["a", "2026-01-02"], ["b", "2026-03-01"], ["c", "2026-02-01"], ["c", "2026-04-01"], ["alt", "2020-01-01"]]
    .map(([schluessel, datum]) => ({ schluessel, datum }));
  assert.deepEqual(rangliste(p, "2025-01-01").map((r) => r.schluessel), ["c", "a", "b"]);
});

test("Slug: Umlaute und Sonderzeichen", () => {
  assert.equal(slug("Flügelschlag"), "fluegelschlag");
  assert.equal(slug("Mü & mehr"), "mue-mehr");
  assert.equal(slug("That's not a hat"), "that-s-not-a-hat");
});

test("Fehler in den Listen brechen nichts ab, sondern werden zu Warnungen", async () => {
  const ordner = await testOrdner({
    spiele: [KOPF_SPIELE, ["Gut", "1001", "Ja", null, null, null], ["Falsche ID", "abc", null, null, null, null], ["Unbekannt", "9999", null, null, null, null], ["Gut", "1001", null, null, null, null]],
    partien: [["Datum", "Spiel"], ["01.10.2026", "Gut"], ["kein Datum", "Gut"], ["02.10.2026", "Nicht in der Liste"], ["03.10.2026", null]],
    termine: [KOPF_TERMINE, ["04.11.2026", null, "18:00", "Irgendwo", "Spieleabend", null], ["kaputt", null, "18:00", "Irgendwo", "Spieleabend", null]],
    cache: { spiele: { 1001: { name: "Gut", maxSpieler: 4 }, 9999: { fehlt: true } } },
  });
  const d = await ladeDaten({ ordner, heute: "2026-10-30" });
  const text = d.warnungen.join("\n");
  assert.match(text, /„abc“ ist keine gültige BGG-ID/);
  assert.match(text, /BGG kennt die ID 9999 nicht/);
  assert.match(text, /steht doppelt/);
  assert.match(text, /Das Datum „kein Datum“ ist ungültig/);
  assert.match(text, /Nicht in der Liste/);
  assert.match(text, /Für „Irgendwo“ fehlt die Adresse/);
  assert.equal(d.meist12.length, 2);
  assert.equal(d.termine.length, 1);
  assert.equal(d.alleSpiele.find((s) => s.name === "Gut").bgg.maxSpieler, 4);
});

test("Fehlende Dateien und vergangene Termine: Die Seite bleibt baubar", async () => {
  const d = await ladeDaten({ ordner: fs.mkdtempSync(path.join(os.tmpdir(), "bgg-leer-")), heute: "2026-10-30" });
  assert.equal(d.termine.length, 0);
  assert.equal(d.letzterAbend, null);
  assert.match(d.warnungen.join("\n"), /Datei fehlt: spiele\.xlsx/);
  const o2 = await testOrdner({ spiele: [KOPF_SPIELE], partien: [["Datum", "Spiel"]], termine: [KOPF_TERMINE, ["01.01.2026", null, "18:00", "A", null, null], ["01.10.2026", "01.11.2026", "11:00", "B", null, null]] });
  const d2 = await ladeDaten({ ordner: o2, heute: "2026-10-30" });
  assert.deepEqual(d2.termine.map((t) => t.ort), ["B"]);
});

test("BGG-XML: Felder, Entitäten, leere Werte", () => {
  const [a, b] = leseThings(fs.readFileSync("fixtures/bgg-thing.xml", "utf8"));
  assert.equal(a.id, "1001");
  assert.equal(a.name, "Beispielspiel & Co");
  assert.equal(a.minSpieler, 2);
  assert.equal(a.maxDauer, 45);
  assert.equal(a.bewertung, 7.8);
  assert.equal(a.komplexitaet, 2.3);
  assert.equal(a.beschreibung, 'Erste Zeile. Zweite Zeile mit "Zitat" & mehr.');
  assert.equal(b.bewertung, null);
  assert.equal(b.bildQuelle, null);
  assert.equal(leseSuche(fs.readFileSync("fixtures/bgg-search.xml", "utf8"))[0].id, "2001");
});

const lauf = (befehl, args, env) => new Promise((fertig) => {
  const p = spawn(befehl, args, { env: { ...process.env, ...env } });
  let text = "";
  p.stdout.on("data", (d) => (text += d));
  p.stderr.on("data", (d) => (text += d));
  p.on("close", (code) => fertig({ code, text }));
});

test("Von der Liste zur Seite: Reihenfolge, BGG-Daten, Vorschlag statt Raten", async () => {
  const ordner = await testOrdner({
    spiele: [KOPF_SPIELE, ["Beispiel Eins", "1001", "Ja", "Kenner", null, null], ["Beispiel Zwei", "1002", null, null, null, null], ["Ohne ID", null, null, null, null, null]],
    partien: [["Datum", "Spiel"], ["01.10.2026", "Beispiel Zwei"], ["02.10.2026", "Beispiel Eins"], ["03.10.2026", "Beispiel Eins"], ["03.10.2026", "Ohne ID"]],
    termine: [KOPF_TERMINE, ["04.11.2026", null, "18:00", "A", "Spieleabend", "Hinweis X"]],
    orte: [["Ort", "Adresse"], ["A", "Teststraße 1, 53902 Bad Münstereifel"]],
  });
  const env = { DATEN_ORDNER: ordner, BGG_FIXTURES: "1", BUILD_HEUTE: "2026-10-30" };
  const abruf = await lauf(process.execPath, ["skripte/bgg-abruf.mjs"], env);
  assert.equal(abruf.code, 0, abruf.text);
  const vorschlaege = JSON.parse(fs.readFileSync(path.join(ordner, "id-vorschlaege.json"), "utf8"));
  assert.equal(vorschlaege["Ohne ID"][0].id, "2001");

  const ausgabe = path.join(ordner, "_site");
  const bau = await lauf(process.execPath, ["node_modules/@11ty/eleventy/cmd.cjs", "--quiet", `--output=${ausgabe}`], env);
  assert.equal(bau.code, 0, bau.text);
  const start = fs.readFileSync(path.join(ausgabe, "index.html"), "utf8");
  assert.ok(start.indexOf("Beispiel Eins") < start.indexOf("Beispiel Zwei"), "Reihenfolge nach Partien");
  assert.match(start, /2–5 Spieler/);
  assert.match(start, /Komplexität 2,3\/5/);
  assert.match(start, /Hinweis X/);
  const detail = fs.readFileSync(path.join(ausgabe, "spiele/beispiel-eins/index.html"), "utf8");
  assert.match(detail, /ab 10 Jahren/);
  assert.match(detail, /boardgamegeek\.com\/boardgame\/1001/);
  assert.match(fs.readFileSync(path.join(ausgabe, "termine.ics"), "utf8"), /DTSTART:20261104T180000/);
  assert.ok(!fs.readFileSync(path.join(ordner, "spiele.xlsx")).includes("2001"), "Vorschlag wird nicht automatisch übernommen");
});

test("BGG fällt aus: Cache bleibt erhalten, Skript endet ohne Fehler, Token erscheint nicht", async () => {
  const server = http.createServer((_, res) => { res.statusCode = 500; res.end("kaputt"); });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const ordner = fs.mkdtempSync(path.join(os.tmpdir(), "bgg-ausfall-"));
  fs.mkdirSync(path.join(ordner, "daten"));
  await writeExcelFile([tabelle("Spiele", [KOPF_SPIELE, ["Alt", "1001", null, null, null, null]])]).toFile(path.join(ordner, "daten/spiele.xlsx"));
  await writeExcelFile([tabelle("Partien", [["Datum", "Spiel"]])]).toFile(path.join(ordner, "daten/partien.xlsx"));
  await writeExcelFile([tabelle("Termine", [KOPF_TERMINE]), tabelle("Orte", [["Ort", "Adresse"]])]).toFile(path.join(ordner, "daten/termine.xlsx"));
  const alt = { spiele: { 1001: { name: "Alt", abgerufen: "2020-01-01T00:00:00Z" } } };
  fs.writeFileSync(path.join(ordner, "daten/bgg-cache.json"), JSON.stringify(alt));
  const skript = path.resolve("skripte/bgg-abruf.mjs");
  const geheim = "GEHEIMER-TESTTOKEN";
  const ausgabe = await new Promise((fertig) => {
    const p = spawn(process.execPath, [skript], { cwd: ordner, env: { ...process.env, BGG_TOKEN: geheim, BGG_BASIS: `http://127.0.0.1:${server.address().port}`, BGG_PAUSE_MS: "1" } });
    let text = "";
    p.stdout.on("data", (d) => (text += d));
    p.stderr.on("data", (d) => (text += d));
    p.on("close", (code) => fertig({ code, text }));
  });
  server.close();
  assert.equal(ausgabe.code, 0);
  assert.ok(!ausgabe.text.includes(geheim));
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(ordner, "daten/bgg-cache.json"), "utf8")), alt);
});
