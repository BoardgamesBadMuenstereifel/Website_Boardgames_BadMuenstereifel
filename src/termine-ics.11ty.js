// Kalenderdatei zum Abonnieren oder Importieren
export const data = { permalink: "/termine.ics", eleventyExcludeFromCollections: true };

const text = (t) => t.replace(/\\/g, "\\\\").replace(/([,;])/g, "\\$1").replace(/\n/g, "\\n");
const stempel = (datum, uhrzeit) => `${datum.replace(/-/g, "")}T${uhrzeit.replace(":", "")}00`;

export function render({ daten }) {
  const zeilen = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Boardgames Bad Muenstereifel//Termine//DE", "CALSCALE:GREGORIAN", "X-WR-CALNAME:Boardgames Bad Münstereifel", "X-WR-TIMEZONE:Europe/Berlin"];
  for (const t of daten.termine) {
    const [h, m] = t.uhrzeit.split(":");
    const ende = stempel(t.bis ?? t.datum, `${String(Math.min(Number(h) + 4, 23)).padStart(2, "0")}:${m}`);
    zeilen.push(
      "BEGIN:VEVENT",
      `UID:${t.datum}-${t.uhrzeit.replace(":", "")}@boardgames-muenstereifel.club`,
      `DTSTAMP:${t.datum.replace(/-/g, "")}T000000Z`,
      `DTSTART:${stempel(t.datum, t.uhrzeit)}`,
      `DTEND:${ende}`,
      `SUMMARY:${text(t.art)}`,
      `LOCATION:${text(t.adresse ? `${t.ort}, ${t.adresse}` : t.ort)}`,
      ...(t.hinweis ? [`DESCRIPTION:${text(t.hinweis)}`] : []),
      "END:VEVENT"
    );
  }
  zeilen.push("END:VCALENDAR");
  return zeilen.join("\r\n") + "\r\n";
}
