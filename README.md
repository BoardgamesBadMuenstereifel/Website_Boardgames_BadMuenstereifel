# Website Boardgames Bad Münstereifel

Diese Anleitung ist für die Pflege der Seite. Du brauchst dafür keine Programmierkenntnisse, nur Excel und einen Browser.

## So funktioniert die Seite

Alle Inhalte, die sich ändern, stehen in Excel-Dateien im Ordner `daten/`. Sobald du eine Datei auf GitHub hochlädst, baut sich die Website in etwa 2 Minuten selbst neu. Zusätzlich baut sie sich jede Nacht neu. So verschwinden vergangene Termine, und „letzte 3 Monate“ und „letzte 12 Monate“ wandern mit.

## Eine Datei ändern (gilt für alle Listen)

1. Öffne dein Repository auf github.com und gehe in den Ordner `daten`.
2. Lade die Excel-Datei herunter: Klick auf die Datei, dann auf das Download-Symbol oben rechts.
3. Ändere sie in Excel und speichere sie unter dem **gleichen Namen**.
4. Gehe zurück in den Ordner `daten`, klicke auf **Add file** und dann auf **Upload files**.
5. Ziehe die Datei hinein und klicke auf **Commit changes**.
6. Nach etwa 2 Minuten ist die Seite aktuell. Den Fortschritt siehst du unter dem Reiter **Actions**: Ein grüner Haken heißt fertig.

Lass die Spaltenüberschriften (erste Zeile) immer unverändert.

## Termine ändern: `termine.xlsx`

Blatt **Termine**, eine Zeile pro Termin:

| Datum | Bis | Uhrzeit | Ort | Art | Hinweis |
|---|---|---|---|---|---|
| 04.11.2026 | | 18:00 | Kupferkessel, Schönau | Spieleabend | Erst Essen, Spielbeginn ca. 19 Uhr |
| 14.11.2026 | | 16:00 | DGH, Lorbach | Spieleabend | Ohne Essen, wir spielen gleich los |
| 19.09.2027 | 20.09.2027 | 11:00 | ERFTWERK4, Bad Münstereifel | WE mit Erklärbären | |

- **Bis** nutzt du nur bei mehrtägigen Terminen.
- Der **Ort** muss genauso geschrieben sein wie auf dem Blatt **Orte**. Dort steht die Adresse.
- Vergangene Termine musst du nicht löschen, die Seite blendet sie aus.

## Spiele eines Abends eintragen: `partien.xlsx`

Pro Partie eine Zeile mit Datum und Spiel. Mehr nicht.

| Datum | Spiel |
|---|---|
| 22.10.2026 | Bomb Busters |

Die Rangliste, die Hotlist und „Zuletzt gespielt“ berechnet die Seite daraus selbst. Rangliste und Hotlist sind nach Spielzeit sortiert: Anzahl der Partien × maximale Spieldauer laut BGG. Spiele ohne BGG-ID stehen deshalb hinten. Der Spielname sollte genauso geschrieben sein wie in `spiele.xlsx`, Groß- und Kleinschreibung ist egal.

## Neues Spiel ergänzen: `spiele.xlsx`

Eine Zeile pro Spiel. Das machst du nur einmal je Spiel.

| Spiel | BGG-ID | Sammlung | Kategorie | Neu | Im Verkauf |
|---|---|---|---|---|---|
| Mischwald | 123456 | Ja | Kenner | | |

- **BGG-ID:** Das ist die Zahl in der Adresse des Spiels auf boardgamegeek.com, also bei `boardgamegeek.com/boardgame/123456/...` die 123456. Ohne ID erscheint das Spiel ohne Bild und Infos.
- **Sammlung:** „Ja“, wenn das Spiel in „Unsere Sammlung“ erscheinen soll.
- Bei der Tabelle oben ist 123456 nur ein Beispiel.

**ID-Vorschläge:** Für Spiele ohne ID sucht die Seite bei BGG und schreibt Vorschläge in `daten/id-vorschlaege.json`. Sie werden nie automatisch übernommen. Prüfe sie und trage die richtige ID selbst ein. Das funktioniert erst, wenn der BGG-Token hinterlegt ist. Pro Lauf werden höchstens 100 Namen gesucht, die erste Runde verteilt sich also auf mehrere Nächte.

## Empfehlungen: `empfehlungen.xlsx`

Spalten: Kategorie, Spiel, Kurzbegründung, Freigegeben. Erlaubte Kategorien sind Kinder 3–6, Kinder 6–10, Jugendliche, Familien sowie Kenner & Experten. Es erscheinen **nur Zeilen mit „Ja“ bei Freigegeben**.

## Spielvorstellungen: `vorstellungen.xlsx`

- **Blatt Vorstellungen:** Spiel, Datum, Beschreibung, Für wen, Freigegeben. Die Vorstellung mit dem neuesten Datum erscheint groß auf der Startseite. Es erscheinen **nur Zeilen mit „Ja“ bei Freigegeben**.
- **Blatt Wertungen:** Spiel, Spieler, Note (1 bis 10), Zitat. Der Schnitt wird berechnet. Hole vorher das Einverständnis der genannten Personen ein.

Die mitgelieferte Vorstellung zu Bomb Busters ist ein Beispiel. Text, Noten und Zitate sind erfunden. Ersetze sie, bevor du „Ja“ einträgst.

## Etwas stimmt nicht: Warnungen ansehen

Fehler in den Listen stoppen die Website nicht. Die Seite wird trotzdem gebaut, und die Datei `daten/WARNUNGEN.md` listet auf, was aufgefallen ist, zum Beispiel ein ungültiges Datum oder eine unbekannte ID. Öffne sie nach einer Änderung kurz auf GitHub.

## Fällt BGG aus?

Das ist kein Problem. Die Seite nutzt die zuletzt gespeicherten Daten aus `daten/bgg-cache.json` und holt beim nächsten Lauf nach, was fehlt.

## Einmalige Einrichtung

Das muss nur einmal gemacht werden.

1. **GitHub-Konto anlegen** und ein neues Repository erstellen. Lade den Projektordner hoch, ohne `.werkzeuge` und `node_modules`. Für die kostenlose Veröffentlichung muss das Repository **öffentlich** sein. Alle Dateien darin sind dann für jeden lesbar, auch die Excel-Listen mit noch nicht freigegebenen Einträgen.
2. **Veröffentlichung einschalten:** unter **Settings → Pages** bei **Source** die Option **GitHub Actions** wählen.
3. **BGG-Token beantragen:** unter boardgamegeek.com/applications registrieren. Die Freigabe kann über eine Woche dauern.
4. **Token hinterlegen:** unter **Settings → Secrets and variables → Actions → New repository secret**, Name `BGG_TOKEN`, Wert ist dein Token. Schreibe den Token nie in eine Datei.
5. **Eigene Domain:** Trage die Domain unter **Settings → Pages → Custom domain** ein und richte die DNS-Einträge beim Domain-Anbieter ein, wie GitHub es dort anzeigt. Lege dann unter **Settings → Secrets and variables → Actions → Variables** die Variable `EIGENE_DOMAIN` mit dem Wert `ja` an.

## Für Technik-Interessierte

Zum lokalen Arbeiten brauchst du Node.js.

```bash
npm ci --ignore-scripts
```

```bash
npm test
```

```bash
npm run vorschau
```

- `BGG_FIXTURES=1 npm run daten` nutzt erfundene Beispiel-XML aus `fixtures/` statt BGG.
- `ENTWURF=1 npm run vorschau` zeigt auch nicht freigegebene Empfehlungen und Vorstellungen.
- `skripte/einmalig-daten-anlegen.mjs` hat die Listen einmalig aus den Ausgangsdateien erzeugt und überschreibt nichts.
