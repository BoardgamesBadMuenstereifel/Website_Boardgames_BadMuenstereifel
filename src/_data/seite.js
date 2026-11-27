// Vollständige Adresse der Seite, z. B. für Vorschaubilder beim Teilen, die Sitemap und das Kalender-Abo.
// Mit eigener Domain (Variable EIGENE_DOMAIN=ja, dann ist PFAD_PREFIX "/") gilt die Vereinsdomain.
const prefix = process.env.PFAD_PREFIX || "/";

export default {
  // Stand des Baus: hängt an style.css und script.js, damit Browser nach dem Veröffentlichen die neue Fassung laden
  stand: Date.now().toString(36),
  url: prefix === "/"
    ? "https://www.boardgames-muenstereifel.de"
    : `https://boardgamesbadmuenstereifel.github.io${prefix.replace(/\/$/, "")}`,
};
