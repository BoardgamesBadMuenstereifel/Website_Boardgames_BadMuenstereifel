# Konzept – Boardgames Bad Münstereifel (Phase 2)

Stand: 30.10.2026. Es gibt noch keinen Code. Dieses Dokument ist die Grundlage für deine Freigabe.

## 0. Was ich in deinen Dateien gefunden habe

**Boardgames_Gepsielt_Liste.xlsx** (Spalten: Datum, Spielname)
- 870 Zeilen = 870 Partien an 54 Abenden, 09.03.2023 bis 22.10.2026
- 318 verschiedene Spiele, keine leeren Zeilen
- Am häufigsten: Bomb Busters (36), Mischwald (28), Flügelschlag (24), Got Five (21), Azul und Mycelia (je 17)
- Es gibt keine BGG-IDs. Die Namen sind teils deutsch („Fantastische Reiche“, „Flügelschlag“), teils englisch.

**Brettspielsammlung.xlsx** (Blatt „Sammlung“: Spiel, Kategorie, Neu, Im Verkauf)
- 65 Spiele in 6 Kategorien: Mini-Kinder (7), Kinder (15), Einsteiger/Gateway (14), Kenner (10), Familien (17), Experten (2)
- 15 Spiele sind „Neu“, 19 sind „Im Verkauf“. Auch hier gibt es keine BGG-IDs.

**Spielort Kupferkessel:** Eicherscheider Straße 9, 53902 Bad Münstereifel (Schönau), Telefon 02253 932454 (laut eifel.info). Bitte bestätigen.
Für DGH Lorbach und ERFTWERK4 brauche ich noch die Adressen.

## 1. Sitemap (5 Hauptpunkte)

| Punkt | Inhalt |
|---|---|
| **Start** | Nächster Termin (Datum, Uhrzeit, Ort), Button „WhatsApp-Gruppe“, die nächsten 3 Termine mit Ablauf-Hinweis am Termin, Top 3 der letzten 12 Monate mit Hotlist, direkt danach die neueste Spielvorstellung groß („Spiel im Fokus“), Teaser für die Empfehlungen, Kontakt und Über uns |
| **Neu hier?** | Abend- und Samstagstermine als Beispiele (18 Uhr Treffen/Essen, ca. 19 Uhr Spielbeginn, wer nicht isst: 18:30–18:45; samstags ab 16 Uhr ohne Essen), „Das gilt immer“, später FAQ |
| **Termine** | Alle kommenden Termine, jeweils mit Ort, Adresse und Route (der Ort wird pro Termin festgelegt, es gibt keinen eigenen Abschnitt „Wo wir spielen“), Kalender-Abo (.ics) |
| **Spiele** | „Meist gespielt“ (12 Monate, dazu kleine Hotlist der letzten 3 Monate und „Zuletzt gespielt“ vom letzten Abend), „Unsere Empfehlungen“ nach Kategorien (Kinder 3–6, Kinder 6–10, Jugendliche, Familien, Kenner & Experten), „Spiel im Fokus“ mit Kurzvorstellung, Eignung und Wertungen einzelner Spieler, „Unsere Sammlung“ (filterbar nach Spieleranzahl, Dauer, Komplexität, Kategorie). Spieldetailseite pro Spiel |
| **Über uns & Kontakt** | Kurzvorstellung, Martin als Ansprechpartner, Telefon, Mail, Facebook, Instagram, Presse-Absatz |

Footer: Impressum, Datenschutz, „Powered by BGG“.
Die Spieldetailseiten sind keine Hauptpunkte, sondern hängen unter „Spiele“.

## 2. Designrichtungen

Basis sind die alten Vereinsfarben: Aubergine `#514859`, Creme `#EFDEC6`, Gold `#E19F42`, Hellgrau `#E5E7E8`.
Kontraste (WCAG AA verlangt 4,5:1 für normalen Text, 3:1 für große Schrift):

| Kombination | Kontrast | Nutzung |
|---|---|---|
| Aubergine auf Creme | 6,6:1 | Fließtext, ok |
| Creme auf Aubergine | 6,6:1 | Fließtext, ok |
| Gold auf Aubergine | 3,8:1 | nur große Schrift (ab ca. 24 px bzw. 19 px fett) |
| Gold auf Creme | 1,7:1 | **nie** für Text |
| Dunkle Tinte `#2B2530` auf Gold | 6,5:1 | Buttons: Gold-Fläche mit dunkler Schrift |
| Dunkle Tinte auf Creme | 11,3:1 | Überschriften |

Schriften werden lokal eingebunden (offene Lizenzen, keine Google-Fonts-Verbindung).

### A – „Stammtisch“ (ruhig, warm) – meine Empfehlung
- **Typografie:** Überschriften in einer warmen Serifen-Schrift (z. B. Fraunces), Fließtext in einer klaren Groteske (z. B. Atkinson Hyperlegible, besonders gut lesbar).
- **Farbe:** Creme als Grundfläche, Aubergine für Text und den Kopfbereich, Gold als Akzent (Buttons, Datumskachel, Linien).
- **Bildsprache:** Einfache, flache Illustrationen (Würfel, Spielfiguren, Tisch von oben), keine Personenfotos. Eigene Grafik statt Canva, wegen der Lizenz.
- **Vorteile:** Wirkt einladend und seriös, passt zu Stadt und Presse, hohe Kontraste, am wenigsten Gefahr von Lesbarkeitsproblemen.
- **Nachteile:** Weniger „wow“, wirkt eher gemütlich als verspielt.

### B – „Spielkarten“ (verspielt, kachelbasiert)
- **Typografie:** Runde, kräftige Überschriften (z. B. Nunito), große Zahlen für Datum und Spieleranzahl.
- **Farbe:** Aubergine als Hauptfläche, Inhalte als Karten in Creme und Gold, leichte Schatten und Drehung wie liegende Spielkarten.
- **Bildsprache:** Spielkarten-Motive, Würfelpunkte als Muster, Icons für Spieleranzahl/Dauer.
- **Vorteile:** Sieht nach Brettspielen aus, der Termin als große Karte fällt sofort auf, die „Meist gespielt“-Kacheln passen gut.
- **Nachteile:** Unruhiger, mehr Aufwand bei Barrierefreiheit (Drehungen und Schatten sparsam einsetzen), kann bei vielen Karten überladen wirken.

### C – „Schachtel“ (dunkel, stimmungsvoll)
- **Typografie:** Kräftige, leicht gerundete Überschrift (z. B. Bricolage Grotesque), Fließtext in Inter oder Source Sans.
- **Farbe:** Die ganze Seite in Aubergine mit cremefarbenem Text. Gold nur für große Überschriften und Linien.
- **Bildsprache:** Wie der Deckel einer Spieleschachtel, großes Titelmotiv, Spielfeld-Muster als Hintergrund.
- **Vorteile:** Wirkt hochwertig und abendlich, was zu „Spieleabend“ passt. Der alte Kopfbereich wird weitergeführt.
- **Nachteile:** Dunkle Flächen sind bei viel Text anstrengender, der Gold-Kontrast ist nur für große Schrift ok, Fotos und Spielecover wirken auf Dunkel oft schwerer.

## 3. Technische Architektur

**Empfehlung:** Statische Website, die bei jeder Änderung automatisch gebaut wird. Es gibt keinen Server und keine Datenbank.

```
 Dateien im Repository               Bau (GitHub Actions, kostenlos)           Auslieferung
 ┌────────────────────────┐          ┌───────────────────────────────┐          ┌─────────────────────┐
 │ termine.xlsx           │          │ 1. Excel-Dateien lesen         │          │ GitHub Pages        │
 │ partien.xlsx           │  ─────►  │ 2. BGG abrufen (Token nur im   │  ─────►  │ fertige HTML-Seiten │
 │ spiele.xlsx            │ Upload   │    GitHub-Secret), gedrosselt  │  Deploy  │ + Bilder + Schriften│
 │ bgg-cache/ (JSON)      │          │ 3. Cache aktualisieren         │          │ Domain: .club       │
 │ Texte (Markdown)       │          │ 4. HTML erzeugen, Warnungen    │          └─────────────────────┘
 └────────────────────────┘          └───────────────────────────────┘
```

- **Generator:** Eleventy (Node.js). Der Build holt und cacht BGG-Daten als JSON im Repository. Fällt BGG aus, wird der Cache weiterverwendet und der Build bricht nicht ab.
- **Excel lesen:** Eine kleine Bibliothek im Build. Du pflegst weiter Excel-Dateien, es gibt keine Umwandlung in CSV.
- **Filter und Suche in „Spiele“:** Wenig JavaScript im Browser, die Seite funktioniert auch ohne (alle Spiele sichtbar). Die Daten stehen als JSON in der Seite.
- **Karte:** Keine eingebettete Karte. Jeder Termin hat einen Link „Route“ zu OpenStreetMap, damit gibt es beim Seitenaufruf keine Verbindung zu Dritten und keinen Cookie-Banner.
- **Coverbilder:** Der Build lädt sie einmalig von BGG und liefert sie selbst aus, die Besucher verbinden sich also nicht mit BGG.
- **BGG-Token:** Nur als GitHub-Secret, nie im Repository, nie im Browser, nie im Log. Aktualisierung automatisch einmal täglich und bei jeder Änderung der Listen.
- **Pflege:** Du öffnest das Repository im Browser, lädst die geänderte Excel-Datei hoch („Commit“), und nach etwa 2 Minuten ist die Seite aktualisiert. Dafür brauchst du einen GitHub-Account (kostenlos). Das README erklärt es Schritt für Schritt mit Screenshots.

**Alternativen**
| Alternative | Vorteil | Nachteil |
|---|---|---|
| **Cloudflare Pages** statt GitHub Pages | Schnell, kostenlos, schöne Vorschau pro Änderung | Ein weiterer Account, sonst gleich |
| **Eigener Webspace per FTP** | Du kennst das Prinzip evtl. schon | Der Build muss auf deinem Rechner laufen (dort ist weder Node noch Python installiert), BGG-Token läge lokal |
| **Fertiger Baukasten (Canva, Wix)** | Kein Programmieren | Keine BGG-Anbindung mit Token-Schutz, keine Excel-Pflege, Kosten, die Gründe für den Umzug |
| **Astro statt Eleventy** | Moderner, mehr Komponenten | Mehr Abhängigkeiten, für diese Seite nicht nötig |

## 4. Domain

Die Domain `boardgames-muenstereifel.club` liegt bei Canva. Ich konnte nicht bestätigen, wie Canva eine Domain herausgibt. Bitte schau in Canva unter Domains nach „Transfer“/„Autorisierungscode“ oder frag den Canva-Support. Es gibt zwei Wege:
1. **Domain wirklich umziehen** zu einem günstigen Registrar. Das kostet ca. 15–25 € pro Jahr und ist die saubere Lösung, auch weil ein Transfer meist ein Jahr Laufzeit anhängt. Das ist damit der einzige laufende Posten, und nur die Domain selbst, nicht der Betrieb.
2. **Domain bei Canva lassen** und nur die DNS-Einträge auf GitHub zeigen lassen, falls Canva das erlaubt. Kostenlos, aber du bleibst abhängig.

Solange die Frage offen ist, entwickle ich ohne Domain-Bezug. Das beeinflusst nichts am Entwurf.

## 5. Datenformat (einfach, wie gewünscht)

Du willst eine Liste „Datum / Spiel / BGG-ID“ pflegen, und Anzahl der Partien, Komplexität und Bewertung sollen sich von selbst ergeben. Das geht, mit einer kleinen Verbesserung: Die BGG-ID steht **nicht in jeder der 870 Zeilen**, sondern **einmal pro Spiel** in einer Spieleliste. So tippst du bei einem Abend nur Datum und Spielname.

### `partien.xlsx` – dein Spielprotokoll (wie bisher)
| Datum | Spiel |
|---|---|
| 22.10.2026 | Bomb Busters |
| 22.10.2026 | Mischwald |

### `spiele.xlsx` – eine Zeile pro Spiel (einmal pflegen)
| Spiel | BGG-ID | Sammlung | Kategorie | Neu | Im Verkauf |
|---|---|---|---|---|---|
| Bomb Busters | *(ID folgt)* | Ja | Familien-Spiele | | |
| Mischwald | *(ID folgt)* | Ja | Kenner | | |

(Die IDs trage ich erst ein, wenn sie über die BGG-Suche geprüft und von dir bestätigt sind.)

### Zusätzliche Dateien (ab Änderungsrunde 1)
- **`empfehlungen.xlsx`:** Kategorie (Kinder 3–6 / Kinder 6–10 / Jugendliche / Familien / Kenner & Experten), Spiel, optional Kurzbegründung.
- **`vorstellungen.xlsx`:** pro Spiel eine Zeile Text (Kurzbeschreibung, „Für wen?“), dazu eine Tabelle Spiel, Spieler (z. B. Martin), Note (1–10), optional Zitat. Der Schnitt wird berechnet.
- **Zeiträume „Meist gespielt“:** 12 Monate und 3 Monate werden beim Bauen vom Tagesdatum zurückgerechnet. „Zuletzt gespielt“ ist der jüngste Abend im Protokoll. Die Seite baut sich dafür täglich neu, damit die Zeiträume auch ohne Änderung mitwandern.

### Was die Seite daraus macht
- **Meist gespielt:** Anzahl der Partien pro Spiel aus `partien.xlsx`, sortiert nach Häufigkeit, Zeitraum einstellbar (Standard: letzte 12 Monate, plus „Gesamt“). Gleichstand: das zuletzt gespielte Spiel zuerst.
- **Angereichert aus BGG** (Cache): Bild, Spieleranzahl, Dauer, Alter, Komplexität (Weight), BGG-Bewertung, Beschreibung, Link zu BGG.
- **Sammlung:** alle Spiele mit „Sammlung = Ja“, Kategorien wie in deiner Liste.
- **Warnungen statt Fehler:** Steht in `partien.xlsx` ein Spiel, das in `spiele.xlsx` fehlt, oder hat ein Spiel keine ID, listet der Build das als Warnung auf („‚Fantastische Reiche‘ hat keine BGG-ID. Vorschlag aus der BGG-Suche: …“). Die Seite baut trotzdem, das Spiel erscheint ohne BGG-Daten.
- **Erste Befüllung:** Die 318 + 65 Namen müssen einmal einer ID zugeordnet werden (viele überlappen). Sobald der BGG-Token freigegeben ist, erzeuge ich per `/search` Vorschläge, du bestätigst sie in einer Tabelle. Bis dahin lege ich eine `spiele.xlsx` mit den Namen und leeren ID-Feldern an. Das ist die einzige größere Handarbeit, danach nur noch neue Spiele.

Beispieldateien liegen im Ordner `beispieldaten/` (CSV zum Ansehen, die echten Dateien bleiben Excel).

## 6. Offene Punkte für deine Freigabe

1. **Designrichtung** A, B oder C (oder Mischung)?
2. **Hosting:** GitHub Pages (Empfehlung) oder Cloudflare Pages?
3. **Domain:** Welchen Weg gehst du (siehe 4), oder erst später?
4. **Rang „Meist gespielt“:** Du hattest im Auftrag „in meiner Reihenfolge“ geschrieben, jetzt willst du nur das Protokoll pflegen. Soll die Reihenfolge **automatisch nach Partien** entstehen (Empfehlung), mit Standardzeitraum 12 Monate?
5. **„Im Verkauf“:** Soll die Seite zeigen, dass Spiele des Vereins zum Verkauf stehen (Kennzeichnung in der Sammlung), oder ist das intern?
6. **„Neu“-Kennzeichnung** in der Sammlung anzeigen („Neu im Regal“)?
7. **Adressen:** Stimmt Eicherscheider Straße 9 für den Kupferkessel? Adressen von DGH Lorbach und ERFTWERK4?
8. **Platzhalter-Logo:** Ich nehme ein einfaches Wortlogo aus dem Namen mit Würfelsymbol, bis dein Logo kommt.
