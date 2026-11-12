export default function (config) {
  config.addPassthroughCopy({ "src/assets": "assets" });
  for (const datei of ["fraunces-latin-700-normal", "fraunces-latin-ext-700-normal"]) {
    config.addPassthroughCopy({ [`node_modules/@fontsource/fraunces/files/${datei}.woff2`]: `assets/schriften/${datei}.woff2` });
  }
  for (const datei of ["atkinson-hyperlegible-latin-400-normal", "atkinson-hyperlegible-latin-700-normal", "atkinson-hyperlegible-latin-ext-400-normal", "atkinson-hyperlegible-latin-ext-700-normal"]) {
    config.addPassthroughCopy({ [`node_modules/@fontsource/atkinson-hyperlegible/files/${datei}.woff2`]: `assets/schriften/${datei}.woff2` });
  }
  config.addFilter("zahlDe", (n) => String(n).replace(".", ","));
  config.addFilter("spieler", (b) => {
    if (!b?.minSpieler) return "";
    return b.maxSpieler && b.maxSpieler !== b.minSpieler ? `${b.minSpieler}–${b.maxSpieler} Spieler` : `${b.minSpieler} Spieler`;
  });
  config.addFilter("dauer", (b) => {
    if (!b?.maxDauer && !b?.minDauer) return "";
    return b.minDauer && b.maxDauer && b.minDauer !== b.maxDauer ? `${b.minDauer}–${b.maxDauer} Min.` : `ca. ${b.maxDauer ?? b.minDauer} Min.`;
  });
  config.addFilter("spielzeit", (minuten) => {
    if (!minuten) return "";
    if (minuten < 60) return `${minuten} Min.`;
    return `${String(Math.round(minuten / 6) / 10).replace(".", ",")} Std.`;
  });
  config.addFilter("jsonSicher", (wert) => JSON.stringify(wert).replace(/</g, "\\u003c"));

  // Termine als Veranstaltungen, die Suchmaschinen lesen können (schema.org). Termine ohne Ort fehlen, Google verlangt einen.
  const isoBerlin = (datum, uhrzeit) => {
    const name = new Intl.DateTimeFormat("en", { timeZone: "Europe/Berlin", timeZoneName: "shortOffset" })
      .formatToParts(new Date(`${datum}T12:00:00Z`)).find((t) => t.type === "timeZoneName").value;
    const stunden = Number(name.replace("GMT", "")) || 0;
    return `${datum}T${uhrzeit}:00+${String(stunden).padStart(2, "0")}:00`;
  };
  config.addFilter("termineJsonLd", (termine, basis, verein) => {
    const veranstalter = { "@type": "Organization", name: verein.name, url: `${basis}/` };
    const liste = termine.filter((t) => t.ort).map((t) => ({
      "@context": "https://schema.org",
      "@type": "Event",
      name: `${t.art} – ${verein.name}`,
      startDate: t.uhrzeit ? isoBerlin(t.datum, t.uhrzeit) : t.datum,
      ...(t.bis ? { endDate: t.bis } : {}),
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      location: { "@type": "Place", name: t.ort, address: t.adresse || t.ort },
      description: [t.kostenText, t.hinweis].filter(Boolean).join(". "),
      isAccessibleForFree: t.kosten === "kostenlos",
      organizer: veranstalter,
      url: `${basis}/termine/`,
    }));
    return JSON.stringify(liste).replace(/</g, "\\u003c");
  });
  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    pathPrefix: process.env.PFAD_PREFIX || "/",
  };
}
