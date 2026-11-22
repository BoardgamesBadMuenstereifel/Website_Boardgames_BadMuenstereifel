import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { regalFaecher, bildMasse, OHNE_KATEGORIE } from "../skripte/lib/regal.mjs";

const spiel = (name, kategorie, komplexitaet) => ({ name, kategorie, bgg: komplexitaet ? { komplexitaet } : null });

test("Regal: ein Fach je Kategorie, von Kinderspielen bis Experten, Unbekanntes dahinter", () => {
  const faecher = regalFaecher([
    spiel("Arche Nova", "Experten", 3.8),
    spiel("Azul", "Einsteiger / Gateway", 1.8),
    spiel("Cabo", "Familien-Spiele", 1.4),
    spiel("Dobble", "Mini-Kinder (3–6)", 1),
    spiel("Flügelschlag", "Kenner", 2.5),
    spiel("Lama", "Kinder (6–10)", 1.1),
    spiel("Ohne", "", null),
    spiel("Partyspiel", "Party", 1.2),
    spiel("Kriegsspiel", "Konflikt", 3.1),
    spiel("Viticulture", "Kenner", 2.9),
  ]);
  assert.deepEqual(faecher.map((f) => f.name), [
    "Mini-Kinder (3–6)", "Kinder (6–10)", "Familien-Spiele", "Einsteiger / Gateway", "Kenner", "Experten",
    "Party", "Konflikt", OHNE_KATEGORIE,
  ]);
  // Innerhalb eines Fachs bleibt die Reihenfolge der Sammlung (alphabetisch) erhalten
  assert.deepEqual(faecher[4].spiele.map((s) => s.name), ["Flügelschlag", "Viticulture"]);
  assert.deepEqual(regalFaecher([]), []);
});

test("Covermaße: JPEG und PNG (auch mit Endung .jpg), Unlesbares ergibt null", () => {
  const ordner = fs.mkdtempSync(path.join(os.tmpdir(), "regal-test-"));
  // kleinstes PNG-Gerüst: Signatur + IHDR mit 150 × 107
  const png = Buffer.alloc(33);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(png, 0);
  png.writeUInt32BE(13, 8); png.write("IHDR", 12); png.writeUInt32BE(150, 16); png.writeUInt32BE(107, 20);
  fs.writeFileSync(path.join(ordner, "a.jpg"), png);
  // JPEG: SOI, ein APP0-Abschnitt, dann SOF0 mit Höhe 150 und Breite 104
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0x00, 0x00, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x96, 0x00, 0x68, 0x01, 0x01, 0x11, 0x00, 0xff, 0xd9]);
  fs.writeFileSync(path.join(ordner, "b.jpg"), jpeg);
  fs.writeFileSync(path.join(ordner, "c.jpg"), "kein Bild");
  assert.deepEqual(bildMasse(path.join(ordner, "a.jpg")), { breite: 150, hoehe: 107 });
  assert.deepEqual(bildMasse(path.join(ordner, "b.jpg")), { breite: 104, hoehe: 150 });
  assert.equal(bildMasse(path.join(ordner, "c.jpg")), null);
  assert.equal(bildMasse(path.join(ordner, "fehlt.jpg")), null);
});
