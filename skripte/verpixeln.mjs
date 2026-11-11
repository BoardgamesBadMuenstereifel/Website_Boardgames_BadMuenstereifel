// Macht Gesichter und Namensschilder auf Fotos unkenntlich, bevor sie weiterverarbeitet werden.
// Läuft nur auf dem eigenen Rechner. Die Originale mit Personen bleiben im Unterordner
// „Original mit Personen“, das Ergebnis landet eine Ebene höher im Fotos-Ordner.
//
//   node skripte/verpixeln.mjs [Ordner]          wie in verpixeln.json eingestellt
//   node skripte/verpixeln.mjs --logo --muster   zum Vergleich alle Fotos mit Logo, als „…-mit-logo.jpg“
//
// Die Bereiche stehen in „verpixeln.json“ im Fotos-Ordner, als Pixel im Original von links oben:
//   "raum-rot": [[x, y, breite, hoehe], …]                       grob verpixelt
//   "raum-rot": { "art": "logo", "bereiche": [[x, y, b, h], …] }  verpixelt und mit unserem Logo abgedeckt
// Danach wie gewohnt: node skripte/fotos.mjs
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const argumente = process.argv.slice(2);
const ordner = argumente.find((a) => !a.startsWith("--")) ?? path.join("..", "..", "Boardgames Bad Münstereifel", "Fotos");
const alleMitLogo = argumente.includes("--logo");
const muster = argumente.includes("--muster");
const quelle = path.join(ordner, "Original mit Personen");
const bereiche = JSON.parse(fs.readFileSync(path.join(ordner, "verpixeln.json"), "utf8"));
const LOGO = "src/assets/logo/logo-256.webp";

for (const [name, eintrag] of Object.entries(bereiche)) {
  const kaesten = Array.isArray(eintrag) ? eintrag : eintrag.bereiche;
  const mitLogo = alleMitLogo || eintrag.art === "logo";
  const original = path.join(quelle, `${name}.jpg`);
  if (!fs.existsSync(original)) { console.warn(`„${name}.jpg“ fehlt in „${quelle}“.`); continue; }
  const basis = await sharp(original).rotate().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = basis.info;
  const flicken = [];
  const logos = [];
  for (const [n, [x, y, b, h]] of kaesten.entries()) {
    // etwas Rand, damit Haare und Ohren mit verschwinden
    const rand = Math.round(Math.min(b, h) * 0.12);
    const left = Math.max(0, x - rand), top = Math.max(0, y - rand);
    const width = Math.min(W - left, b + 2 * rand), height = Math.min(H - top, h + 2 * rand);
    // Immer zuerst grob verpixeln: Schaut beim Logo eine Ecke vorbei, ist dort trotzdem nichts zu erkennen.
    const block = Math.max(8, Math.round(Math.min(width, height) / 5));
    const klein = await sharp(basis.data).extract({ left, top, width, height })
      .resize(Math.max(1, Math.round(width / block)), Math.max(1, Math.round(height / block)), { fit: "fill" })
      .toBuffer();
    const grob = await sharp(klein).resize(width, height, { fit: "fill", kernel: "nearest" }).toBuffer();
    flicken.push({ input: grob, left, top });
    if (mitLogo) {
      // Logo etwas größer als das Gesicht, leicht schräg wie ein aufgeklebter Sticker
      const groesse = Math.round(Math.max(width, height) * 1.25);
      const winkel = [-9, 7, -4, 10, -7, 4][n % 6];
      const logo = await sharp(LOGO).resize({ width: groesse }).rotate(winkel, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer({ resolveWithObject: true });
      const lx = Math.round(left + width / 2 - logo.info.width / 2), ly = Math.round(top + height / 2 - logo.info.height / 2);
      // Am Bildrand abschneiden, damit sharp nicht über den Rand hinaus zeichnet
      const cl = Math.max(0, -lx), ct = Math.max(0, -ly);
      const cw = Math.min(logo.info.width - cl, W - Math.max(0, lx)), ch = Math.min(logo.info.height - ct, H - Math.max(0, ly));
      if (cw > 0 && ch > 0) {
        const stueck = await sharp(logo.data).extract({ left: cl, top: ct, width: cw, height: ch }).toBuffer();
        logos.push({ input: stueck, left: Math.max(0, lx), top: Math.max(0, ly) });
      }
    }
  }
  const ziel = path.join(ordner, `${name}${muster ? "-mit-logo" : ""}.jpg`);
  const zwischen = await sharp(basis.data).composite(flicken).toBuffer();
  await sharp(zwischen).composite(logos).jpeg({ quality: 92 }).toFile(ziel);
  console.log(`✓ ${name}: ${kaesten.length} Bereiche ${mitLogo ? "mit Logo abgedeckt" : "verpixelt"} -> ${ziel}`);
}
