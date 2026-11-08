// Kalenderdatei zum Abonnieren oder Importieren
export const data = { permalink: "/termine.ics", eleventyExcludeFromCollections: true };

const text = (t) => t.replace(/\\/g, "\\\\").replace(/([,;])/g, "\\$1").replace(/\n/g, "\\n");
const stempel = (datum, uhrzeit) => `${datum.replace(/-/g, "")}T${uhrzeit.replace(":", "")}00`;

export function render({ daten }) {
  const zeilen = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Boardgames Bad Muenstereifel//Termine//DE", "CALSCALE:GREGORIAN", "X-WR-CALNAME:Boardgames Bad Münstereifel", "X-WR-TIMEZONE:Europe/Berlin"];
  for (const t of daten.termine) {
    let zeit;
    if (t.uhrzeit) {
      const [h, m] = t.uhrzeit.split(":");
      const ende = stempel(t.bis ?? t.datum, `${String(Math.min(Number(h) + 4, 23)).padStart(2, "0")}:${m}`);
      zeit = [`DTSTART:${stempel(t.datum, t.uhrzeit)}`, `DTEND:${ende}`];
    } else {
      // Uhrzeit steht noch nicht fest: ganztägig, Ende ist exklusiv der Folgetag
      const folgetag = new Date((t.bis ?? t.datum) + "T12:00:00Z");
      folgetag.setUTCDate(folgetag.getUTCDate() + 1);
      zeit = [`DTSTART;VALUE=DATE:${t.datum.replace(/-/g, "")}`, `DTEND;VALUE=DATE:${folgetag.toISOString().slice(0, 10).replace(/-/g, "")}`];
    }
    const beschreibung = [t.kostenText, t.hinweis].filter(Boolean).join("\n");
    const ort = t.ort ? (t.adresse ? `${t.ort}, ${t.adresse}` : t.ort) : "Ort folgt";
    zeilen.push(
      "BEGIN:VEVENT",
      `UID:${t.datum}-${t.uhrzeit ? t.uhrzeit.replace(":", "") : "ganztags"}@boardgames-muenstereifel.club`,
      `DTSTAMP:${t.datum.replace(/-/g, "")}T000000Z`,
      ...zeit,
      `SUMMARY:${text(t.art)}`,
      `LOCATION:${text(ort)}`,
      ...(beschreibung ? [`DESCRIPTION:${text(beschreibung)}`] : []),
      "END:VEVENT"
    );
  }
  zeilen.push("END:VCALENDAR");
  return zeilen.join("\r\n") + "\r\n";
}
