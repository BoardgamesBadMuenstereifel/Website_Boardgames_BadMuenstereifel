// Macht Gesichter und Namensschilder auf Fotos unkenntlich, bevor sie weiterverarbeitet werden.
// Läuft nur auf dem eigenen Rechner. Die Originale mit Personen bleiben im Unterordner
// „Original mit Personen“, das verpixelte Ergebnis landet eine Ebene höher im Fotos-Ordner.
//
//   node skripte/verpixeln.mjs [Ordner]
//
// Die Bereiche stehen in „verpixeln.json“ im Fotos-Ordner:
//   { "raum-rot": [[x, y, breite, hoehe], …] }   (Pixel im Original, gemessen von links oben)
// Danach wie gewohnt: node skripte/fotos.mjs
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ordner = process.argv[2] ?? path.join("..", "..", "Boardgames Bad Münstereifel", "Fotos");
const quelle = path.join(ordner, "Original mit Personen");
const bereiche = JSON.parse(fs.readFileSync(path.join(ordner, "verpixeln.json"), "utf8"));

for (const [name, kaesten] of Object.entries(bereiche)) {
  const original = path.join(quelle, `${name}.jpg`);
  if (!fs.existsSync(original)) { console.warn(`„${name}.jpg“ fehlt in „${quelle}“.`); continue; }
  const basis = await sharp(original).rotate().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = basis.info;
  const flicken = [];
  for (const [x, y, b, h] of kaesten) {
    // etwas Rand, damit Haare und Ohren mit verschwinden
    const rand = Math.round(Math.min(b, h) * 0.12);
    const left = Math.max(0, x - rand), top = Math.max(0, y - rand);
    const width = Math.min(W - left, b + 2 * rand), height = Math.min(H - top, h + 2 * rand);
    // grobe Blöcke: höchstens etwa fünf über die Breite des Gesichts
    const block = Math.max(8, Math.round(Math.min(width, height) / 5));
    const klein = await sharp(basis.data).extract({ left, top, width, height })
      .resize(Math.max(1, Math.round(width / block)), Math.max(1, Math.round(height / block)), { fit: "fill" })
      .toBuffer();
    const grob = await sharp(klein).resize(width, height, { fit: "fill", kernel: "nearest" }).toBuffer();
    flicken.push({ input: grob, left, top });
  }
  const ziel = path.join(ordner, `${name}.jpg`);
  await sharp(basis.data).composite(flicken).jpeg({ quality: 92 }).toFile(ziel);
  console.log(`✓ ${name}: ${kaesten.length} Bereiche verpixelt -> ${ziel}`);
}
