// „Unsere Sammlung“ als Spieleregal: ein Fach je Kategorie, von Kinderspielen bis zu Expertenspielen.
import fs from "node:fs";

// Reihenfolge der Fächer nach einem Stichwort im Kategorienamen. So passt sie auch, wenn eine Kategorie
// in spiele.xlsx etwas anders heißt. Andere Kategorien stehen dahinter, die leichtesten zuerst.
const REIHENFOLGE = [/mini/i, /kind/i, /famil/i, /einsteig|gateway/i, /kenner/i, /expert/i];
export const OHNE_KATEGORIE = "Ohne Kategorie";

export function regalFaecher(sammlung) {
  const faecher = new Map();
  for (const s of sammlung ?? []) {
    const name = s.kategorie || OHNE_KATEGORIE;
    if (!faecher.has(name)) faecher.set(name, []);
    faecher.get(name).push(s);
  }
  const rang = (name) => {
    if (name === OHNE_KATEGORIE) return REIHENFOLGE.length + 1;
    const i = REIHENFOLGE.findIndex((r) => r.test(name));
    return i === -1 ? REIHENFOLGE.length : i;
  };
  const schnitt = (spiele) => {
    const werte = spiele.map((s) => s.bgg?.komplexitaet).filter(Boolean);
    return werte.length ? werte.reduce((a, b) => a + b, 0) / werte.length : Infinity;
  };
  return [...faecher]
    .map(([name, spiele]) => ({ name, spiele, rang: rang(name), schnitt: schnitt(spiele) }))
    .sort((a, b) => a.rang - b.rang || a.schnitt - b.schnitt || a.name.localeCompare(b.name, "de"))
    .map(({ name, spiele }) => ({ name, spiele }));
}

// Breite und Höhe eines Covers in Pixeln, damit die Schachteln beim Laden nicht springen.
// Die Cover von BGG sind JPEG oder PNG (auch wenn die Datei auf .jpg endet). Unlesbar: null.
const masse = new Map();
export function bildMasse(datei) {
  if (!masse.has(datei)) masse.set(datei, leseMasse(datei));
  return masse.get(datei);
}

function leseMasse(datei) {
  let b;
  try { b = fs.readFileSync(datei); } catch { return null; }
  if (b.length > 24 && b.readUInt32BE(0) === 0x89504e47) return { breite: b.readUInt32BE(16), hoehe: b.readUInt32BE(20) };
  if (b[0] !== 0xff || b[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) { i++; continue; }
    const marker = b[i + 1];
    if (marker === 0xff) { i++; continue; }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) { i += 2; continue; }
    // SOF-Abschnitte (C0–CF ohne C4, C8, CC) enthalten Höhe und Breite
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { breite: b.readUInt16BE(i + 7), hoehe: b.readUInt16BE(i + 5) };
    }
    i += 2 + b.readUInt16BE(i + 2);
  }
  return null;
}
