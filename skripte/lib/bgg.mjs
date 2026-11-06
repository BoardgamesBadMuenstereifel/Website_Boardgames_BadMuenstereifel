// Liest die XML-Antworten der BGG XML API2. Rein lesend, kein Netzzugriff.
import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@",
  processEntities: false,
  htmlEntities: false,
  isArray: (name) => ["item", "name", "link"].includes(name),
});

export function entitaeten(text) {
  // BGG kodiert Beschreibungen doppelt (&amp;#10;), deshalb &amp; zuerst
  return String(text ?? "")
    .replace(/&(amp;)+/g, "&")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&ndash;/g, "–").replace(/&mdash;/g, "—").replace(/&hellip;/g, "…").replace(/&nbsp;/g, " ");
}

const zahl = (knoten) => {
  const n = Number(knoten?.["@value"]);
  return Number.isFinite(n) && n > 0 ? n : null;
};

export function kurzText(text, max = 600) {
  const sauber = entitaeten(text).replace(/\s+/g, " ").trim();
  if (sauber.length <= max) return sauber;
  const schnitt = sauber.slice(0, max);
  const ende = Math.max(schnitt.lastIndexOf(". "), schnitt.lastIndexOf("! "), schnitt.lastIndexOf("? "));
  return ende > max * 0.5 ? schnitt.slice(0, ende + 1) : schnitt.slice(0, schnitt.lastIndexOf(" ")) + " …";
}

export function leseThings(xml) {
  const doc = parser.parse(xml);
  const items = doc.items?.item ?? [];
  return items.map((i) => {
    const namen = i.name ?? [];
    const haupt = namen.find((n) => n["@type"] === "primary") ?? namen[0];
    const r = i.statistics?.ratings ?? {};
    const sterne = zahl(r.average), gewicht = zahl(r.averageweight);
    return {
      id: String(i["@id"]),
      name: entitaeten(haupt?.["@value"] ?? ""),
      jahr: zahl(i.yearpublished),
      minSpieler: zahl(i.minplayers), maxSpieler: zahl(i.maxplayers),
      minDauer: zahl(i.minplaytime), maxDauer: zahl(i.maxplaytime),
      alter: zahl(i.minage),
      bewertung: sterne === null ? null : Math.round(sterne * 10) / 10,
      komplexitaet: gewicht === null ? null : Math.round(gewicht * 10) / 10,
      beschreibung: kurzText(i.description),
      bildQuelle: typeof i.thumbnail === "string" ? i.thumbnail.trim() : null,
    };
  });
}

export function leseSuche(xml) {
  const doc = parser.parse(xml);
  return (doc.items?.item ?? []).map((i) => ({
    id: String(i["@id"]),
    name: entitaeten((i.name ?? [])[0]?.["@value"] ?? ""),
    jahr: zahl(i.yearpublished),
  }));
}
