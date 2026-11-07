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
  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    pathPrefix: process.env.PFAD_PREFIX || "/",
  };
}
