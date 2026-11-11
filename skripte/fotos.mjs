// Bereitet eigene Fotos für die Website auf: zuschneiden, verkleinern, versteckte Daten entfernen.
// Die Originale bleiben außerhalb des Repos (Standard: Desktop\Boardgames Bad Münstereifel\Fotos).
// Ins Repo kommen nur die fertigen Fassungen in src/assets/fotos und die Maße in daten/fotos-masse.json.
//
//   node skripte/fotos.mjs                  bereitet neue oder geänderte Fotos auf
//   node skripte/fotos.mjs --alle           bereitet alle Fotos neu auf
//   node skripte/fotos.mjs --quelle "C:\…"  nimmt die Originale aus einem anderen Ordner
//
// Welche Fotos es gibt, steht in daten/fotos.xlsx. Spalte „Datei“ = Dateiname ohne Endung, klein
// und mit Bindestrichen statt Leerzeichen („Spirit Island.jpg“ -> spirit-island).
import fs from "node:fs";
import path from "node:path";
import readExcelFile from "read-excel-file/node";
import sharp from "sharp";
import { slug } from "./lib/daten.mjs";

const BREITEN = [480, 800, 1200, 1600];
const JPG_BREITE = 1200; // Rückfallebene für sehr alte Browser
const ZIEL = "src/assets/fotos";
const MASSE = "daten/fotos-masse.json";
const ENDUNGEN = [".jpg", ".jpeg", ".png", ".webp", ".heic"];

const arg = (name) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : null; };
const quelle = arg("--quelle") ?? process.env.FOTOS_QUELLE ?? path.join("..", "..", "Boardgames Bad Münstereifel", "Fotos");
const alle = process.argv.includes("--alle");

// „Ausschnitt“: links, oben, Breite, Höhe in Prozent des Originals, z. B. „5, 27, 90, 73“
function ausschnitt(text, breite, hoehe) {
  if (!text) return null;
  const z = String(text).split(/[;,\s]+/).filter(Boolean).map((s) => Number(s.replace(",", ".")));
  if (z.length !== 4 || z.some((n) => !Number.isFinite(n) || n < 0 || n > 100)) return undefined;
  const [l, o, b, h] = z;
  const r = { left: Math.round((l / 100) * breite), top: Math.round((o / 100) * hoehe), width: Math.round((b / 100) * breite), height: Math.round((h / 100) * hoehe) };
  r.width = Math.min(r.width, breite - r.left);
  r.height = Math.min(r.height, hoehe - r.top);
  return r.width > 50 && r.height > 50 ? r : undefined;
}

const hex = ({ r, g, b }) => "#" + [r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("");

async function main() {
  const blaetter = await readExcelFile("daten/fotos.xlsx");
  const blatt = blaetter.find((b) => b.sheet === "Fotos") ?? blaetter[0];
  const [kopf, ...zeilen] = blatt.data;
  const spalte = (name) => kopf.findIndex((k) => String(k ?? "").trim() === name);
  const masse = fs.existsSync(MASSE) ? JSON.parse(fs.readFileSync(MASSE, "utf8")) : {};
  fs.mkdirSync(ZIEL, { recursive: true });
  const vorhanden = fs.existsSync(quelle) ? fs.readdirSync(quelle) : [];
  if (!vorhanden.length) console.warn(`Im Ordner „${quelle}“ liegen keine Fotos. Mit --quelle lässt sich ein anderer Ordner angeben.`);

  let neu = 0;
  for (const z of zeilen) {
    const datei = String(z[spalte("Datei")] ?? "").trim();
    if (!datei) continue;
    if (!/^[a-z0-9-]+$/.test(datei)) { console.warn(`„${datei}“: Bitte nur Kleinbuchstaben, Ziffern und Bindestriche im Dateinamen.`); continue; }
    // „Die verlorenen Ruinen von Arnak.jpg“ passt zu „die-verlorenen-ruinen-von-arnak“
    const original = vorhanden.find((f) => slug(path.parse(f).name) === datei && ENDUNGEN.includes(path.extname(f).toLowerCase()));
    if (!original) { if (!masse[datei]) console.warn(`„${datei}“: Kein Original in „${quelle}“ gefunden.`); continue; }
    const pfad = path.join(quelle, original);
    const schnitt = String(z[spalte("Ausschnitt")] ?? "").trim();
    const merkmal = `${fs.statSync(pfad).mtimeMs}|${schnitt}`;
    if (!alle && masse[datei]?.merkmal === merkmal && fs.existsSync(path.join(ZIEL, `${datei}-${masse[datei].jpg}.jpg`))) continue;

    // Drehen nach den Kameradaten, danach gehen alle versteckten Daten (Ort, Zeit, Gerät) verloren.
    const gedreht = await sharp(pfad).rotate().toBuffer({ resolveWithObject: true });
    const r = ausschnitt(schnitt, gedreht.info.width, gedreht.info.height);
    if (r === undefined) { console.warn(`„${datei}“: Der Ausschnitt „${schnitt}“ ist ungültig, das Foto bleibt ganz.`); }
    const basis = r ? await sharp(gedreht.data).extract(r).toBuffer({ resolveWithObject: true }) : gedreht;
    const { width: breite, height: hoehe } = basis.info;

    for (const alt of fs.readdirSync(ZIEL).filter((f) => f.startsWith(`${datei}-`))) fs.rmSync(path.join(ZIEL, alt));
    const groesste = Math.min(breite, BREITEN.at(-1));
    const breiten = [...BREITEN.filter((w) => w < groesste), groesste];
    for (const w of breiten) {
      await sharp(basis.data).resize({ width: w }).webp({ quality: 76, effort: 5 }).toFile(path.join(ZIEL, `${datei}-${w}.webp`));
    }
    const jpg = Math.min(JPG_BREITE, breite);
    await sharp(basis.data).resize({ width: jpg }).jpeg({ quality: 78, mozjpeg: true }).toFile(path.join(ZIEL, `${datei}-${jpg}.jpg`));
    const { dominant } = await sharp(basis.data).resize({ width: 64 }).stats();
    masse[datei] = { breite, hoehe, breiten, jpg, farbe: hex(dominant), merkmal };
    neu++;
    console.log(`✓ ${datei}: ${breite}×${hoehe}${r ? " (zugeschnitten)" : ""}, ${breiten.length} Größen`);
  }
  fs.writeFileSync(MASSE, JSON.stringify(masse, null, 1) + "\n");
  console.log(neu ? `${neu} Foto(s) aufbereitet.` : "Keine neuen Fotos.");
}

await main();
