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
| 13.01.2027 | | 18:00 | Kupferkessel, Schönau | Spieleabend | Erst Essen, Spielbeginn ca. 19 Uhr |
| 23.01.2027 | | 16:00 | Dorfgemeinschaftshaus Lorbach | Samstagstermin | Ohne Essen, wir spielen gleich los |
| 05.03.2027 | 07.03.2027 | | Kloster Steinfeld | Brettspielkloster | Sonderveranstaltung |

- **Bis** nutzt du nur bei mehrtägigen Terminen.
- **Uhrzeit** und **Ort** darfst du leer lassen, solange sie noch nicht feststehen. Auf der Seite steht dann „Uhrzeit folgt“ bzw. „Ort folgt“.
- Der **Ort** muss genauso geschrieben sein wie auf dem Blatt **Orte**. Dort steht die Adresse.
- Die **Art** muss genauso geschrieben sein wie auf dem Blatt **Arten** (Groß- und Kleinschreibung ist egal).
- Vergangene Termine musst du nicht löschen, die Seite blendet sie aus.

So zeigt die Terminseite die Termine:

- Die nächsten drei Monate sind offen, alle späteren Termine liegen unter „Weitere Termine“ zum Aufklappen.
- Oben auf der Startseite steht der nächste Termin **ohne Anmeldung**, darunter die drei Termine danach.
- Die Termine lassen sich als Kalender abonnieren (`termine.ics`). Für Google stehen sie zusätzlich maschinenlesbar auf der Terminseite, Termine ohne Ort fehlen dort.

Blatt **Arten**, eine Zeile pro Terminart. Kosten und Anmeldung stehen nur hier, die Seite zeigt sie bei jedem Termin dieser Art an:

| Art | Kosten | Anmeldung | Farbe |
|---|---|---|---|
| Spieleabend | kostenlos | | Grün |
| Samstagstermin | 5 € pro Abend | | Blau |
| Social Deduction | 10 € pro Abend | | Rot |
| Brettspielkloster | kostenpflichtig | Ja | Lila |

- **Anmeldung:** „Ja“, dann steht beim Termin „nur mit Anmeldung“.
- **Farbe:** Grün, Blau, Rot oder Lila. Die Farbe erscheint als Streifen am Datum und als Etikett mit dem Namen der Art. Bedeutung: Grün = Spieleabende unter der Woche, Blau = Samstagstermine, Rot = Social Deduction, Lila = Sondertermine. Eine neue Sonderveranstaltung bekommt also „Lila“. Andere Farben gibt es nicht, ein Tippfehler erscheint in den Warnungen.
- Ändern sich die Preise, änderst du sie nur hier. Die Texte auf der Startseite und auf „Neu hier?“ (z. B. „Samstags kostet es 5 €“ und die Tabelle „Unsere Termine auf einen Blick“) musst du dann allerdings im Code anpassen lassen.
- Für Social-Deduction-Abende wie Blood on the Clocktower trägst du einen Termin mit der Art „Social Deduction“ ein, sobald er in der WhatsApp-Gruppe abgestimmt ist.

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

Die Empfehlungen stehen auf der Seite „Neu im Hobby?“ (`/neu-im-hobby/`), sortiert nach Einordnung, z. B. „Familien mit Kindern“. Jedes bewertete Spiel aus `fokus.xlsx` erscheint dort automatisch mit unserer Note, in jeder seiner Einordnungen. Dazu kommen kurze Tipps ohne ausführliche Bewertung aus dieser Datei.

- **Blatt Empfehlungen:** Einordnung, Spiel, Kurzbegründung, Freigegeben. Es erscheinen **nur Zeilen mit „Ja“ bei Freigegeben**.
- **Blatt Einordnungen:** Einordnung, Text. Hier stehen alle erlaubten Einordnungen in der Reihenfolge, in der sie auf der Seite erscheinen. Der Text ist der Satz über der Gruppe, z. B. „Du willst mit deinem Kind ins Spielen einsteigen? Damit klappt der Anfang.“ Eine neue Einordnung legst du hier an. Eine Einordnung ohne Spiele erscheint nicht.
- Eine Einordnung muss in beiden Dateien genauso geschrieben sein wie auf dem Blatt Einordnungen. Groß- und Kleinschreibung ist egal, ein Tippfehler erscheint in den Warnungen.

## Spiel im Fokus: `fokus.xlsx`

Unsere Bewertungen nach der Skala von BoardGameGeek (1 bis 10). Die ganze Bewertung steht auf der Seite des Spiels, z. B. `/spiele/mycelia/`, mit der Erklärung der Noten. Die neueste erscheint als kleiner Kasten „Spiel im Fokus“ (Cover, Name, unsere Note) auf der Startseite und oben auf der Seite „Spiele“. Frühere Bewertungen stehen unten auf der Seite „Spiele“. Darauf verweisen außerdem die Empfehlungen und die Ranglisten („Unsere Bewertung“). Die alte Adresse `/im-fokus/` leitet automatisch weiter.

- **Blatt Spiele im Fokus:** Spiel, Datum, Einleitung, Einordnung, Thema, Spielablauf, Material, Für wen, Positiv, Negativ, Fazit, Freigegeben.
  - **Einleitung** ist der erste Absatz, er steht auch auf der Startseite. Pflicht.
  - **Thema**, **Spielablauf** (erscheint als „So wird gespielt“), **Material** und **Fazit** sind die Teilbereiche der Bewertung. Leere Spalten erscheinen einfach nicht.
  - **Für wen** wird zurzeit nirgends angezeigt. In der Bewertung zeigen die Einordnung, Plus/Minus und das Fazit, für wen das Spiel passt.
  - **Einordnung** ist die kurze Einordnung, für wen das Spiel passt, z. B. „Familien mit Kindern“. Erlaubt sind die Einordnungen vom Blatt Einordnungen in `empfehlungen.xlsx`. Mehrere Einordnungen schreibst du untereinander in die Zelle.
  - Bei **Einordnung**, **Positiv** und **Negativ** steht jeder Eintrag in einer eigenen Zeile der Zelle. Bei den Textfeldern wird jede Zeile ein eigener Absatz. Eine neue Zeile in der Zelle bekommst du mit **Alt+Enter**.
  - Es erscheinen **nur Zeilen mit „Ja“ bei Freigegeben**.
- **Blatt Stimmen:** Eine Zeile pro Stimme: Spiel, Mitglied, Note (ganze Zahl von 1 bis 10). Die Seite zeigt nur die Verteilung und den Schnitt, nie das Kürzel.
  - **Mitglied** ist ein neutrales Kürzel wie M01, M02. Wer dahinter steckt, steht nur in deiner Datei `Mitglieder-Kuerzel.xlsx` auf deinem Rechner. **Diese Datei nie auf GitHub hochladen**, das Repository ist öffentlich.
  - Gibt ein Kürzel bei einem Spiel mehrere Stimmen ab, zählt die letzte. So kann jemand seine Note ändern.
  - Das Kürzel darf leer bleiben, wenn du nicht weißt, von wem die Stimme ist.
- **Blatt O-Töne:** Spiel, Name, Zitat, Freigegeben. Auf der Seite steht dann z. B. „Spieler MF sagt: …“. Den Namen bzw. die Initialen wählt die Person selbst, und es erscheinen **nur Zeilen mit „Ja“ bei Freigegeben**. Frag vorher, ob das Zitat mit diesem Namen veröffentlicht werden darf.

## Eigene Fotos: `fotos.xlsx`

Eigene Fotos erscheinen als Sofortbilder: auf der Startseite unter „Vom Spieltisch“, auf der Seite des jeweiligen Spiels unter „Bei uns auf dem Tisch“, auf „Neu hier?“ und auf der Terminseite bei Sonderterminen als „So war es beim letzten Mal“.

**Wichtig vor dem Hochladen:** Das Repository ist öffentlich, und Git vergisst nichts. Deshalb kommen **nie die Originalfotos ins Repository**, sondern nur die aufbereiteten Fassungen. Auf den Fotos dürfen keine Gesichter, Namensschilder, Tattoos oder privaten Wohnungen zu erkennen sein. Hände am Spieltisch sind in Ordnung.

**Fotos mit Personen** legst du in den Unterordner `Fotos\Original mit Personen`. Die Stellen zum Verpixeln stehen in `Fotos\verpixeln.json` (Pixel im Original: links, oben, Breite, Höhe). `node skripte/verpixeln.mjs` legt die verpixelte Fassung in den Ordner `Fotos`. Statt nur zu verpixeln, kann auch unser Logo wie ein Sticker auf jedem Gesicht sitzen: Dafür schreibst du beim Foto `{ "art": "logo", "bereiche": [...] }`. Darunter wird trotzdem verpixelt, falls eine Ecke vorbeischaut. `node skripte/verpixeln.mjs --logo --muster` legt zum Vergleich von jedem Foto eine Fassung `…-mit-logo.jpg` an. Erst diese Fassung trägst du wie unten in `fotos.xlsx` ein. Am einfachsten bittest du Claude darum und schaust dir das Ergebnis an, bevor es online geht.

So kommt ein neues Foto auf die Seite:

1. Leg das Original in den Ordner `Desktop\Boardgames Bad Münstereifel\Fotos` (außerhalb des Repositorys), z. B. `Spirit Island.jpg`.
2. Trag es in `daten/fotos.xlsx` ein:
   - **Datei:** der Dateiname ohne Endung, klein und mit Bindestrichen statt Leerzeichen, z. B. `spirit-island`.
   - **Spiel:** so geschrieben wie in `spiele.xlsx`. Dann führt das Foto zur Spielseite. Leer lassen bei Fotos ohne bestimmtes Spiel.
   - **Titel:** nur nötig, wenn über dem Foto etwas anderes stehen soll als der Spielname, z. B. „Aus unserem Regal“.
   - **Beschreibung:** ein bis zwei Sätze, was auf dem Foto zu sehen ist. Das lesen Menschen vor, die das Foto nicht sehen können. Pflicht.
   - **Bildunterschrift:** kurz und gern mit Augenzwinkern, z. B. „Wer findet zuerst Leben im All?“
   - **Ausschnitt:** nur, wenn etwas weggeschnitten werden soll: links, oben, Breite, Höhe in Prozent, z. B. `5, 27, 90, 73`.
   - **Startseite:** „Ja“, wenn das Foto auf der Startseite erscheinen soll. Drei pro Reihe, also 6 oder 9, wirken am besten.
   - **Neu hier:** „Ja“, wenn das Foto auf der Seite „Neu hier?“ erscheinen soll.
   - **Termin-Art:** eine Art vom Blatt Arten in `termine.xlsx`, z. B. „Brettspielkloster“. Dann erscheint das Foto auf der Terminseite bei jedem kommenden Termin dieser Art.
   - **Freigegeben:** Es erscheinen **nur Zeilen mit „Ja“**.
3. Starte `node skripte/fotos.mjs` (oder bitte Claude darum). Das Skript schneidet zu, verkleinert, entfernt versteckte Daten wie GPS-Ort und Uhrzeit und legt die fertigen Fassungen in `src/assets/fotos` ab.
4. Lade `daten/fotos.xlsx`, `daten/fotos-masse.json` und den Ordner `src/assets/fotos` hoch.

## Kontaktdaten und Vorschaubild

- WhatsApp-Gruppe, Martins WhatsApp-Nummer, Telefon, E-Mail, Instagram und Facebook stehen in `src/_data/verein.js`. Sie erscheinen in der Fußzeile jeder Seite und auf „Kontakt“. Die E-Mail-Adresse gilt auch für Impressum und Datenschutzerklärung.
- Die Antworten unter „Häufige Fragen“ auf „Neu hier?“ stehen direkt in `src/neu-hier.njk`.
- Teilt jemand einen Link, zeigen WhatsApp, Facebook & Co. das Bild `src/assets/vorschau.png` (Logo mit Namen, 1200 × 630 Pixel).

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
5. **Eigene Domain:** Die Domain `boardgames-muenstereifel.club` ist über Canva gekauft und bleibt dort. Du findest sie in Canva unter **Einstellungen → Web domains**. Sie verlängert sich jedes Jahr automatisch, das nächste Mal am 11.08.2027. So zeigt sie auf diese Seite:
   1. **Domain bei GitHub bestätigen:** Auf GitHub oben rechts aufs Profilbild, dann **Settings → Pages → Add a domain**, `boardgames-muenstereifel.club` eintragen. Den angezeigten TXT-Eintrag legst du in Canva an: Domain auswählen, **Advanced settings → Manage**, DNS-Einträge. Ins Feld für den Namen gehört nur der Teil vor `.boardgames-muenstereifel.club`. Dann bei GitHub auf **Verify** klicken.
   2. **In Canva umstellen:** Unter **Advanced settings** den Schalter **Connected to Canva** ausschalten. Ab dann ist die alte Canva-Seite offline. Lösche die A-Einträge `@` und `www` mit dem Wert `103.169.142.0` und lege diese an:

      | Typ | Name | Wert |
      |---|---|---|
      | A | @ | 185.199.108.153 |
      | A | @ | 185.199.109.153 |
      | A | @ | 185.199.110.153 |
      | A | @ | 185.199.111.153 |
      | CNAME | www | boardgamesbadmuenstereifel.github.io |

   3. **GitHub die Domain mitteilen:** Im Repository unter **Settings → Pages → Custom domain** `www.boardgames-muenstereifel.club` eintragen und speichern. Sobald die DNS-Prüfung grün ist, **Enforce HTTPS** anhaken.
   4. **Seite umstellen:** Unter **Settings → Secrets and variables → Actions → Variables** die Variable `EIGENE_DOMAIN` mit dem Wert `ja` anlegen. Dann unter **Actions → Website bauen → Run workflow** neu bauen. Ohne diese Variable führen die Links auf der eigenen Domain ins Leere.

   Schalte **Connected to Canva** danach nicht wieder ein, sonst zeigt die Domain womöglich wieder auf die alte Canva-Seite.

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
- `ENTWURF=1 npm run vorschau` zeigt auch nicht freigegebene Empfehlungen, Spiele im Fokus und O-Töne.
- `skripte/einmalig-daten-anlegen.mjs` hat die Listen einmalig aus den Ausgangsdateien erzeugt und überschreibt nichts.
