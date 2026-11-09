// Liest die Excel-Dateien aus daten/ und rechnet alles aus, was die Seite braucht.
// Fehler in den Listen brechen nichts ab: Sie landen als Warnung in `warnungen`.
import fs from "node:fs";
import path from "node:path";
import readExcelFile from "read-excel-file/node";

const MONATE = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
const TAGE = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const MONATE_LANG = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

// Bewertungsskala von BoardGameGeek, eigene deutsche Übersetzung
const BGG_SKALA = [
  [10, "Herausragend", "Spiele ich immer gern, und das wird sich nicht ändern."],
  [9, "Ausgezeichnet", "Spiele ich sehr gern."],
  [8, "Sehr gut", "Spiele ich gern und würde es empfehlen."],
  [7, "Gut", "Spiele ich meistens gern mit."],
  [6, "Okay", "Spiele ich, wenn ich gerade Lust darauf habe."],
  [5, "Mittelmäßig", "Kann ich spielen, muss ich aber nicht."],
  [4, "Nicht so gut", "Würde ich aber noch einmal spielen."],
  [3, "Schlecht", "Spiele ich wahrscheinlich nicht mehr."],
  [2, "Sehr schlecht", "Spiele ich nie wieder."],
  [1, "Kein Spiel", "Nicht spielbar, für mich kein Spiel."],
].map(([note, kurz, lang]) => ({ note, kurz, lang }));

export function heuteBerlin() {
  if (process.env.BUILD_HEUTE) return process.env.BUILD_HEUTE;
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Berlin" });
}

export function namensSchluessel(name) {
  return String(name ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function slug(name) {
  return String(name)
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "spiel";
}

// Akzeptiert Excel-Daten, 22.10.2026, 22.10.26 und 2026-10-22. Gibt YYYY-MM-DD oder null zurück.
export function leseDatum(wert) {
  if (wert instanceof Date && !isNaN(wert)) return wert.toISOString().slice(0, 10);
  if (typeof wert === "number") {
    return new Date(Date.UTC(1899, 11, 30) + Math.round(wert) * 86400000).toISOString().slice(0, 10);
  }
  const text = String(wert ?? "").trim();
  let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
  if (m) return gueltig(m[1], m[2], m[3]);
  m = /^(\d{1,2})\.(\d{1,2})\.(\d{2}|\d{4})$/.exec(text);
  if (m) return gueltig(m[3].length === 2 ? "20" + m[3] : m[3], m[2], m[1]);
  return null;
}

function gueltig(j, m, t) {
  const iso = `${j}-${String(m).padStart(2, "0")}-${String(t).padStart(2, "0")}`;
  const d = new Date(iso + "T12:00:00Z");
  return !isNaN(d) && d.toISOString().slice(0, 10) === iso ? iso : null;
}

// Akzeptiert 18:00, 18 Uhr, 18 und Excel-Uhrzeiten. Gibt "18:00" oder null zurück.
export function leseUhrzeit(wert) {
  if (wert instanceof Date && !isNaN(wert)) return wert.toISOString().slice(11, 16);
  if (typeof wert === "number" && wert < 1) {
    const min = Math.round(wert * 1440);
    return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
  }
  const m = /^(\d{1,2})(?:[:.](\d{2}))?(?:\s*Uhr)?$/i.exec(String(wert ?? "").trim());
  if (!m || +m[1] > 23) return null;
  return `${m[1].padStart(2, "0")}:${m[2] ?? "00"}`;
}

export function monateZurueck(iso, monate) {
  const [j, m, t] = iso.split("-").map(Number);
  const ziel = new Date(Date.UTC(j, m - 1 - monate, 1));
  const letzter = new Date(Date.UTC(ziel.getUTCFullYear(), ziel.getUTCMonth() + 1, 0)).getUTCDate();
  ziel.setUTCDate(Math.min(t, letzter));
  return ziel.toISOString().slice(0, 10);
}

export function datumTeile(iso) {
  const d = new Date(iso + "T12:00:00Z");
  const zahl = String(d.getUTCDate()).padStart(2, "0");
  const monat = String(d.getUTCMonth() + 1).padStart(2, "0");
  const tag = TAGE[d.getUTCDay()];
  return { tag, zahl, monat: MONATE[d.getUTCMonth()], lang: `${tag}, ${zahl}.${monat}.${d.getUTCFullYear()}` };
}

export function zeitText(uhrzeit) {
  const [h, m] = uhrzeit.split(":");
  return m === "00" ? `${Number(h)} Uhr` : `${Number(h)}:${m} Uhr`;
}

// Rang nach Partien, bei Gleichstand zuerst das zuletzt gespielte Spiel.
// Mit maxDauer (Schlüssel -> Minuten) zählt die Spielzeit: Partien × maximale Dauer laut BGG.
// Spiele ohne bekannte Dauer stehen dann hinter allen anderen.
export function rangliste(partien, abDatum, maxDauer) {
  const zaehler = new Map();
  for (const p of partien) {
    if (abDatum && p.datum < abDatum) continue;
    const z = zaehler.get(p.schluessel) ?? { schluessel: p.schluessel, partien: 0, zuletzt: "" };
    z.partien += 1;
    if (p.datum > z.zuletzt) z.zuletzt = p.datum;
    zaehler.set(p.schluessel, z);
  }
  const liste = [...zaehler.values()];
  if (maxDauer) for (const z of liste) z.spielzeit = maxDauer(z.schluessel) ? z.partien * maxDauer(z.schluessel) : null;
  return liste.sort(
    (a, b) => (b.spielzeit ?? -1) - (a.spielzeit ?? -1) || b.partien - a.partien || b.zuletzt.localeCompare(a.zuletzt) || a.schluessel.localeCompare(b.schluessel)
  );
}

async function leseBlatt(pfad, blatt, warnungen, pflicht = true) {
  if (!fs.existsSync(pfad)) {
    if (pflicht) warnungen.push(`Datei fehlt: ${path.basename(pfad)}`);
    return [];
  }
  let blaetter;
  try {
    blaetter = await readExcelFile(pfad);
  } catch (e) {
    warnungen.push(`${path.basename(pfad)} konnte nicht gelesen werden (${e.message}). Ist die Datei beschädigt?`);
    return [];
  }
  const gefunden = blatt ? blaetter.find((b) => b.sheet === blatt) : blaetter[0];
  if (!gefunden) {
    if (pflicht) warnungen.push(`${path.basename(pfad)}: Blatt „${blatt}“ fehlt.`);
    return [];
  }
  const [kopf, ...zeilen] = gefunden.data;
  if (!kopf) return [];
  return zeilen
    .map((z, i) => {
      const obj = { _zeile: i + 2 };
      kopf.forEach((k, s) => { if (k != null) obj[String(k).trim()] = z[s] ?? null; });
      return obj;
    })
    .filter((o) => Object.entries(o).some(([k, v]) => k !== "_zeile" && v !== null && v !== ""));
}

const ja = (wert) => /^(ja|x|1|true)$/i.test(String(wert ?? "").trim());

// Farbcode der Terminarten: Eintrag im Blatt Arten -> CSS-Klasse farbe-…
const FARBEN = { "grün": "gruen", "gruen": "gruen", "blau": "blau", "rot": "rot", "lila": "lila", "violett": "lila" };

export async function ladeDaten({ ordner = process.env.DATEN_ORDNER ?? "daten", heute = heuteBerlin(), entwurf = process.env.ENTWURF === "1" } = {}) {
  const warnungen = [];
  const pfad = (name) => path.join(ordner, name);

  let cache = { spiele: {} };
  try {
    if (fs.existsSync(pfad("bgg-cache.json"))) cache = JSON.parse(fs.readFileSync(pfad("bgg-cache.json"), "utf8"));
  } catch {
    warnungen.push("bgg-cache.json ist beschädigt. Die Seite zeigt vorerst keine BGG-Daten.");
  }
  let vorschlaege = {};
  try {
    if (fs.existsSync(pfad("id-vorschlaege.json"))) vorschlaege = JSON.parse(fs.readFileSync(pfad("id-vorschlaege.json"), "utf8"));
  } catch { /* Vorschläge sind nur eine Hilfe */ }

  // Spieleliste
  const spiele = new Map();
  for (const z of await leseBlatt(pfad("spiele.xlsx"), null, warnungen)) {
    const name = String(z["Spiel"] ?? "").trim();
    if (!name) { warnungen.push(`spiele.xlsx, Zeile ${z._zeile}: Spielname fehlt.`); continue; }
    const schluessel = namensSchluessel(name);
    if (spiele.has(schluessel)) { warnungen.push(`spiele.xlsx, Zeile ${z._zeile}: „${name}“ steht doppelt in der Liste.`); continue; }
    const rohId = z["BGG-ID"];
    let bggId = null;
    if (rohId !== null && rohId !== "") {
      if (/^\d+$/.test(String(rohId).trim())) bggId = String(rohId).trim();
      else warnungen.push(`spiele.xlsx, Zeile ${z._zeile}: „${rohId}“ ist keine gültige BGG-ID (nur Ziffern).`);
    }
    spiele.set(schluessel, {
      name, schluessel, bggId,
      sammlung: ja(z["Sammlung"]), kategorie: z["Kategorie"] ? String(z["Kategorie"]).trim() : "",
      neu: ja(z["Neu"]), verkauf: ja(z["Im Verkauf"]),
    });
  }
  const neuesSpiel = (name) => {
    const schluessel = namensSchluessel(name);
    if (!spiele.has(schluessel)) {
      spiele.set(schluessel, { name: String(name).trim(), schluessel, bggId: null, sammlung: false, kategorie: "", neu: false, verkauf: false, nichtInListe: true });
    }
    return spiele.get(schluessel);
  };

  // Partien
  const partien = [];
  for (const z of await leseBlatt(pfad("partien.xlsx"), null, warnungen)) {
    const datum = leseDatum(z["Datum"]);
    const name = String(z["Spiel"] ?? "").trim();
    if (!datum) { warnungen.push(`partien.xlsx, Zeile ${z._zeile}: Das Datum „${z["Datum"] ?? ""}“ ist ungültig. Die Zeile wurde übersprungen.`); continue; }
    if (!name) { warnungen.push(`partien.xlsx, Zeile ${z._zeile}: Der Spielname fehlt. Die Zeile wurde übersprungen.`); continue; }
    partien.push({ datum, schluessel: neuesSpiel(name).schluessel });
  }

  // BGG-Daten zuordnen
  for (const s of spiele.values()) {
    const eintrag = s.bggId ? cache.spiele?.[s.bggId] : null;
    s.bgg = eintrag && !eintrag.fehlt ? eintrag : null;
    if (s.bggId && eintrag?.fehlt) warnungen.push(`„${s.name}“: BGG kennt die ID ${s.bggId} nicht. Bitte in spiele.xlsx prüfen.`);
    s.slug = slug(s.name);
  }
  const vergeben = new Set();
  for (const s of spiele.values()) {
    let kandidat = s.slug, n = 2;
    while (vergeben.has(kandidat)) kandidat = `${s.slug}-${n++}`;
    s.slug = kandidat; vergeben.add(kandidat);
  }

  // Sammelwarnungen, damit 300 fehlende IDs nicht 300 Zeilen werden
  const ohneListe = [...spiele.values()].filter((s) => s.nichtInListe).map((s) => s.name);
  if (ohneListe.length) warnungen.push(`Diese Spiele stehen in partien.xlsx, aber nicht in spiele.xlsx: ${ohneListe.join(", ")}`);
  const ohneId = [...spiele.values()].filter((s) => !s.bggId);
  if (ohneId.length) {
    const mitVorschlag = ohneId.filter((s) => vorschlaege[s.name]?.length).length;
    warnungen.push(`${ohneId.length} Spiele haben noch keine BGG-ID und erscheinen ohne Bild und Infos. Für ${mitVorschlag} davon gibt es einen Vorschlag in daten/id-vorschlaege.json.`);
  }

  const mitSpiel = (r) => ({ ...r, spiel: spiele.get(r.schluessel) });
  const maxDauer = (schluessel) => spiele.get(schluessel)?.bgg?.maxDauer || null;
  const meist12 = rangliste(partien, monateZurueck(heute, 12), maxDauer).map(mitSpiel);
  const meist3 = rangliste(partien, monateZurueck(heute, 3), maxDauer).map(mitSpiel);
  const abende = [...new Set(partien.map((p) => p.datum))].sort();
  const letzterAbend = abende.at(-1);
  const zaehle = (ab) => {
    const auswahl = partien.filter((p) => p.datum >= ab);
    return { partien: auswahl.length, abende: new Set(auswahl.map((p) => p.datum)).size };
  };

  for (const r of rangliste(partien)) spiele.get(r.schluessel).partienGesamt = r.partien;

  // Orte und Termine
  const orte = new Map();
  for (const z of await leseBlatt(pfad("termine.xlsx"), "Orte", warnungen)) {
    if (z["Ort"]) orte.set(String(z["Ort"]).trim(), z["Adresse"] ? String(z["Adresse"]).trim() : "");
  }
  // Kosten und Anmeldung stehen einmal je Terminart (Blatt Arten), nicht bei jedem Termin
  const arten = new Map();
  for (const z of await leseBlatt(pfad("termine.xlsx"), "Arten", warnungen, false)) {
    if (!z["Art"]) continue;
    const farbText = String(z["Farbe"] ?? "").trim();
    const farbe = FARBEN[farbText.toLowerCase()] ?? "";
    if (farbText && !farbe) warnungen.push(`termine.xlsx, Blatt Arten, Zeile ${z._zeile}: Die Farbe „${farbText}“ kennt die Seite nicht. Erlaubt sind Grün, Blau, Rot und Lila.`);
    arten.set(String(z["Art"]).trim().toLowerCase(), { kosten: String(z["Kosten"] ?? "").trim(), anmeldung: ja(z["Anmeldung"]), farbe });
  }
  const termine = [];
  const ohneAdresse = new Set();
  const ohneArt = new Set();
  for (const z of await leseBlatt(pfad("termine.xlsx"), "Termine", warnungen)) {
    const datum = leseDatum(z["Datum"]);
    const bis = z["Bis"] ? leseDatum(z["Bis"]) : null;
    // Uhrzeit und Ort dürfen leer sein, dann steht „folgt“ auf der Seite
    const leer = (wert) => wert === null || wert === undefined || String(wert).trim() === "";
    const uhrzeit = leer(z["Uhrzeit"]) ? null : leseUhrzeit(z["Uhrzeit"]);
    const ort = String(z["Ort"] ?? "").trim();
    if (!datum || (!leer(z["Uhrzeit"]) && !uhrzeit) || (z["Bis"] && !bis)) {
      warnungen.push(`termine.xlsx, Zeile ${z._zeile}: Datum, Bis oder Uhrzeit ist ungültig. Der Termin wurde übersprungen.`);
      continue;
    }
    if ((bis ?? datum) < heute) continue;
    const adresse = orte.get(ort) ?? "";
    if (ort && !adresse) ohneAdresse.add(ort);
    const art = String(z["Art"] ?? "Spieleabend").trim();
    const artInfo = arten.get(art.toLowerCase());
    if (arten.size && !artInfo) ohneArt.add(art);
    const teile = datumTeile(datum);
    termine.push({
      datum, bis, uhrzeit, ort, adresse, teile, art,
      zeit: uhrzeit ? zeitText(uhrzeit) : "",
      kosten: artInfo?.kosten ?? "",
      anmeldung: artInfo?.anmeldung ?? false,
      farbe: artInfo?.farbe ?? "",
      kostenText: [artInfo?.kosten, artInfo?.anmeldung && "nur mit Anmeldung"].filter(Boolean).join(" · "),
      hinweis: z["Hinweis"] ? String(z["Hinweis"]).trim() : "",
      langText: bis ? `${teile.lang} bis ${datumTeile(bis).lang}` : teile.lang,
      bisText: bis ? `bis ${datumTeile(bis).lang}` : "",
    });
  }
  termine.sort((a, b) => a.datum.localeCompare(b.datum) || (a.uhrzeit ?? "").localeCompare(b.uhrzeit ?? ""));
  // Für die Terminseite: nach Monat gruppiert, mit Überschrift wie „Januar 2027“
  const termineNachMonat = [];
  for (const t of termine) {
    const schluessel = t.datum.slice(0, 7);
    if (termineNachMonat.at(-1)?.schluessel !== schluessel) {
      const [j, m] = schluessel.split("-").map(Number);
      termineNachMonat.push({ schluessel, name: `${MONATE_LANG[m - 1]} ${j}`, termine: [] });
    }
    termineNachMonat.at(-1).termine.push(t);
  }
  for (const ort of ohneAdresse) warnungen.push(`Für „${ort}“ fehlt die Adresse in termine.xlsx (Blatt Orte).`);
  for (const art of ohneArt) warnungen.push(`Die Terminart „${art}“ steht nicht auf dem Blatt Arten in termine.xlsx. Kosten und Anmeldung fehlen deshalb beim Termin.`);
  if (!termine.length) warnungen.push("Es gibt keine kommenden Termine. Die Seite zeigt „Neue Termine folgen“.");

  // Einordnungen wie „Familien mit Kindern“: Blatt Einordnungen in empfehlungen.xlsx legt Namen, Reihenfolge und den
  // Empfehlungssatz fest. Fehlt das Blatt, ist jede Einordnung erlaubt und erscheint in der Reihenfolge ihres Auftretens.
  const einordnungen = new Map();
  const neueEinordnung = (name, text = "") => {
    const schluessel = namensSchluessel(name);
    if (!einordnungen.has(schluessel)) einordnungen.set(schluessel, { name, anker: `empf-${slug(name)}`, text, spiele: [] });
    return einordnungen.get(schluessel);
  };
  for (const z of await leseBlatt(pfad("empfehlungen.xlsx"), "Einordnungen", warnungen, false)) {
    if (z["Einordnung"]) neueEinordnung(String(z["Einordnung"]).trim(), String(z["Text"] ?? "").trim());
  }
  const festgelegt = einordnungen.size > 0;
  const findeEinordnung = (name, wo) => {
    const e = einordnungen.get(namensSchluessel(name));
    if (e || !festgelegt) return e ?? neueEinordnung(String(name).trim());
    warnungen.push(`${wo}: Die Einordnung „${name}“ steht nicht auf dem Blatt Einordnungen in empfehlungen.xlsx. Erlaubt sind: ${[...einordnungen.values()].map((x) => x.name).join(", ")}.`);
    return null;
  };

  // Spiel im Fokus: Bewertungen nach der BGG-Skala, die neueste zuerst.
  // Stimmen stehen einzeln in der Liste, optional mit neutralem Kürzel (M01 …). Die Seite zeigt nur die Verteilung.
  const stimmenZeilen = await leseBlatt(pfad("fokus.xlsx"), "Stimmen", warnungen, false);
  const otonZeilen = await leseBlatt(pfad("fokus.xlsx"), "O-Töne", warnungen, false);
  const punkte = (wert) => String(wert ?? "").split(/\r?\n/).map((s) => s.replace(/^\s*[-–•*]\s*/, "").trim()).filter(Boolean);
  const fokus = [];
  for (const z of await leseBlatt(pfad("fokus.xlsx"), "Spiele im Fokus", warnungen, false)) {
    if (!entwurf && !ja(z["Freigegeben"])) continue;
    if (!z["Spiel"] || !z["Zusammenfassung"]) { warnungen.push(`fokus.xlsx, Zeile ${z._zeile}: Spiel oder Zusammenfassung fehlt.`); continue; }
    const name = String(z["Spiel"]).trim();
    const schluessel = namensSchluessel(name);
    const ohneKuerzel = [];
    const proMitglied = new Map();
    for (const s of stimmenZeilen.filter((s) => namensSchluessel(s["Spiel"]) === schluessel)) {
      const note = Number(s["Note"]);
      if (!Number.isInteger(note) || note < 1 || note > 10) { warnungen.push(`fokus.xlsx (Stimmen), Zeile ${s._zeile}: Die Note muss eine ganze Zahl von 1 bis 10 sein.`); continue; }
      const mitglied = String(s["Mitglied"] ?? "").trim().toUpperCase();
      if (!mitglied) { ohneKuerzel.push(note); continue; }
      if (proMitglied.has(mitglied)) warnungen.push(`fokus.xlsx (Stimmen): ${mitglied} hat bei „${name}“ mehrfach abgestimmt. Gezählt wird nur die letzte Stimme.`);
      proMitglied.set(mitglied, note);
    }
    const noten = [...ohneKuerzel, ...proMitglied.values()];
    const meiste = Math.max(1, ...BGG_SKALA.map((b) => noten.filter((n) => n === b.note).length));
    const verteilung = BGG_SKALA.map((b) => {
      const anzahl = noten.filter((n) => n === b.note).length;
      return { ...b, anzahl, anteil: Math.round((anzahl / meiste) * 100) };
    });
    const schnitt = noten.length ? noten.reduce((a, n) => a + n, 0) / noten.length : null;
    const datum = leseDatum(z["Datum"]) ?? "";
    const otoene = otonZeilen
      .filter((o) => namensSchluessel(o["Spiel"]) === schluessel && o["Zitat"] && (entwurf || ja(o["Freigegeben"])))
      .map((o) => ({ name: String(o["Name"] ?? "").trim(), zitat: String(o["Zitat"]).trim() }));
    const passtFuer = punkte(z["Einordnung"]).map((e) => findeEinordnung(e, `fokus.xlsx, Zeile ${z._zeile}`)).filter(Boolean);
    fokus.push({
      spiel: neuesSpiel(name), datum,
      monatText: datum ? `${MONATE_LANG[Number(datum.slice(5, 7)) - 1]} ${datum.slice(0, 4)}` : "",
      zusammenfassung: String(z["Zusammenfassung"]).trim(),
      einordnungen: [...new Set(passtFuer)].map((e) => ({ name: e.name, anker: e.anker })),
      fuerWen: z["Für wen"] ? String(z["Für wen"]).trim() : "",
      positiv: punkte(z["Positiv"]), negativ: punkte(z["Negativ"]),
      stimmen: noten.length, verteilung, otoene,
      schnitt: schnitt === null ? null : schnitt.toFixed(1).replace(".", ","),
      schnittZahl: schnitt,
    });
  }
  fokus.sort((a, b) => b.datum.localeCompare(a.datum));

  // Empfehlungen: bewertete Spiele erscheinen in jeder ihrer Einordnungen, dazu kurze Tipps ohne Bewertung
  for (const f of [...fokus].sort((a, b) => (b.schnittZahl ?? 0) - (a.schnittZahl ?? 0))) {
    for (const e of f.einordnungen) {
      const gruppe = einordnungen.get(namensSchluessel(e.name));
      if (!gruppe.spiele.some((x) => x.spiel === f.spiel)) gruppe.spiele.push({ spiel: f.spiel, note: f.schnitt, grund: "" });
    }
  }
  for (const z of await leseBlatt(pfad("empfehlungen.xlsx"), "Empfehlungen", warnungen, false)) {
    if (!entwurf && !ja(z["Freigegeben"])) continue;
    if (!z["Spiel"] || !z["Einordnung"]) { warnungen.push(`empfehlungen.xlsx, Zeile ${z._zeile}: Einordnung oder Spiel fehlt.`); continue; }
    const gruppe = findeEinordnung(String(z["Einordnung"]).trim(), `empfehlungen.xlsx, Zeile ${z._zeile}`);
    if (!gruppe) continue;
    const spiel = neuesSpiel(z["Spiel"]);
    const grund = z["Kurzbegründung"] ? String(z["Kurzbegründung"]).trim() : "";
    const vorhanden = gruppe.spiele.find((x) => x.spiel === spiel);
    if (vorhanden) { vorhanden.grund ||= grund; continue; }
    gruppe.spiele.push({ spiel, note: null, grund });
  }
  const empfehlungen = [...einordnungen.values()].filter((g) => g.spiele.length);

  // Spiele, die erst durch Empfehlungen oder Spiel im Fokus dazukamen, brauchen noch eine Adresse
  for (const s of spiele.values()) {
    if (s.slug) continue;
    s.bgg = null;
    s.slug = slug(s.name);
    while (vergeben.has(s.slug)) s.slug += "-2";
    vergeben.add(s.slug);
  }

  // Jedes Spiel kennt seine neueste Bewertung, damit Ranglisten und Spielseite darauf verweisen können.
  // Nur eine kleine Zusammenfassung am Spiel, sonst entstünde ein Kreisverweis Spiel -> Bewertung -> Spiel.
  const fokusNachSlug = {};
  for (const f of fokus) {
    if (fokusNachSlug[f.spiel.slug]) continue;
    fokusNachSlug[f.spiel.slug] = f;
    f.spiel.bewertung = { schnitt: f.schnitt, monatText: f.monatText };
  }

  const sammlung = [...spiele.values()].filter((s) => s.sammlung).sort((a, b) => a.name.localeCompare(b.name, "de"));
  const kategorienSammlung = [...new Set(sammlung.map((s) => s.kategorie).filter(Boolean))];

  return {
    heute, termine, termineNachMonat,
    meist12, meist3,
    zahlen12: zaehle(monateZurueck(heute, 12)), zahlen3: zaehle(monateZurueck(heute, 3)),
    letzterAbend: letzterAbend ? {
      datum: datumTeile(letzterAbend).lang,
      spiele: [...new Set(partien.filter((p) => p.datum === letzterAbend).map((p) => p.schluessel))].map((k) => spiele.get(k)),
    } : null,
    empfehlungen,
    fokus, fokusNachSlug, bggSkala: BGG_SKALA, sammlung, kategorienSammlung,
    alleSpiele: [...spiele.values()].sort((a, b) => a.name.localeCompare(b.name, "de")),
    warnungen,
  };
}

export function warnungenText(warnungen, stand) {
  const kopf = `# Warnungen beim letzten Website-Bau\n\nStand: ${stand}\n\n`;
  if (!warnungen.length) return `${kopf}Alles in Ordnung, es gibt keine Warnungen.\n`;
  return `${kopf}Die Website wurde trotzdem gebaut. Das hier solltest du dir ansehen:\n\n${warnungen.map((w) => `- ${w}`).join("\n")}\n`;
}
