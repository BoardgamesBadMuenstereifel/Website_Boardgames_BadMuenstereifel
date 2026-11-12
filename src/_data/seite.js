// Vollständige Adresse der Seite, z. B. für Vorschaubilder beim Teilen, die Sitemap und das Kalender-Abo.
// Mit eigener Domain (Variable EIGENE_DOMAIN=ja, dann ist PFAD_PREFIX "/") gilt die Vereinsdomain.
const prefix = process.env.PFAD_PREFIX || "/";

export default {
  url: prefix === "/"
    ? "https://www.boardgames-muenstereifel.club"
    : `https://boardgamesbadmuenstereifel.github.io${prefix.replace(/\/$/, "")}`,
};
