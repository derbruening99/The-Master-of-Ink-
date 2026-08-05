# The Master of Ink — Tattoostudio Rheine

Statische, produktionsfertige One-Page-Website. Kein Build-Schritt, keine
Abhängigkeiten, kein Framework: HTML, eine CSS-Datei, zwei JS-Dateien.
Einfach den Ordner auf einen beliebigen Webserver legen.

```
index.html
assets/
  css/main.css          Designsystem + Layout + Ink-Transitions
  js/gallery-data.js    ← hier werden Inhalte gepflegt
  js/main.js            Verhalten (Video, Reveals, Filter, Formular)
  fonts/                Archivo + Cormorant Garamond (selbst gehostet, woff2)
  img/                  Bildableitungen (webp + jpg, mehrere Breiten)
  video/                Web-Videos (webm + mp4) und Poster
```

Lokal ansehen — ein Server ist nötig, `file://` reicht für Videos nicht:

```bash
python3 -m http.server 8000     # dann http://localhost:8000
```

## Künstler und Portfolio pflegen

Alles Inhaltliche steht in **`assets/js/gallery-data.js`**. Das Array
`artists` erzeugt das Team-Verzeichnis; weitere Artists werden als zusätzliche
Objekte ergänzt. Die Zuordnung einer Arbeit erfolgt über `works[].artistId`.

```js
{
  id: "bryan",
  name: "Bryan",
  role: "Resident Artist",
  specialties: ["Sketch-Realismus", "Fine Line", "Blackwork"],
  portrait: {
    slot: "team-bryan",
    widths: [640, 1200],
    alt: "Bryan lächelt während einer konzentrierten Tattoo-Session im Studio"
  }
}
```

Bilder tragen
keinerlei eingebrannten Text; Titel, Kategorie und Beschreibung liegen
ausschließlich als Daten daneben und erscheinen im Layout *neben* oder
*unter* dem Bild, nie darüber.

Ein Eintrag:

```js
{
  id: "schlange",
  artistId: "bryan",          // Zuordnung zum Team-Eintrag
  featured: true,              // erscheint in der kuratierten Auswahl
  slot: "work-schlange",        // Dateiname ohne Breite und Endung
  widths: [640, 1024, 1600],    // vorhandene Breiten
  ratio: "4 / 5",               // Bildausschnitt im Layout
  position: "50% 50%",          // Bildfokus (object-position)
  alt: "…",                     // Bildbeschreibung (Barrierefreiheit)
  num: "01",
  title: "Schlange & Pfingstrose",
  category: "fine-line",        // eine id aus `categories`
  meta: "Fine Line · Hüfte",
  caption: "…"                  // leer lassen, wenn noch nichts feststeht
}
```

Leere Felder werden einfach nicht gerendert — lieber `""` stehen lassen als
etwas erfinden. `caption: ""` ist bei zwei Arbeiten bewusst als Platzhalter
gesetzt und mit `TODO` markiert.

**Neues Bild einsetzen** — Ableitungen erzeugen und den `slot` eintragen:

```bash
SRC=original.jpg; SLOT=work-rose
for w in 640 1024 1600; do
  ffmpeg -y -i "$SRC" -vf "scale=$w:-2:flags=lanczos" -q:v 3  assets/img/$SLOT-$w.jpg
  ffmpeg -y -i "$SRC" -vf "scale=$w:-2:flags=lanczos" -c:v libwebp -q:v 80 assets/img/$SLOT-$w.webp
done
```

Die öffentliche Seite zeigt bewusst nur eine kleine, asymmetrische Auswahl.
Das Portfolio bleibt datengetrieben, steht in der Dramaturgie aber erst nach
Studio, Haltung, Prozess und Team.

### Kategorien

`Cover-up`, `Fine Line`, `Realismus`, `Abstrakt` — definiert in
`categories`. Der sekundäre Filter „Auswahl“ wird automatisch vorangestellt. Eine
Kategorie ohne Arbeiten zeigt den Text aus `emptyNote` statt einer leeren
Seite. Kategorien lassen sich umbenennen oder ergänzen; entscheidend ist,
dass `work.category` zu einer `categories[].id` passt.

## Videos

Zwei Aufnahmen, beide stumm, in Schleife, `preload="none"` und erst geladen,
wenn sie in den Viewport kommen:

| Datei | Einsatz |
| --- | --- |
| `studio-loop.{webm,mp4}` | Hero, vollflächiger Hintergrund |
| `needle-loop.{webm,mp4}` | Zwischenblatt, ein ruhiger Studiomoment |

WebM/VP9 wird zuerst angeboten (deutlich kleiner, Chrome/Firefox/Edge),
MP4/H.264 ist der Rückfall für Safari und iOS.

**Video wird durch das Poster ersetzt, wenn** der Viewport schmaler als
900 px ist, das System `prefers-reduced-motion: reduce` meldet, oder der
Browser Datensparen signalisiert (`navigator.connection.saveData`). Beim
Verlassen des Viewports pausiert das Video wieder.

Poster: `studio-poster.jpg` (1080 px), `studio-poster-720.jpg`,
`studio-poster-portrait.jpg` (Hochformat für Telefone) sowie
`needle-poster*.jpg`.

Neu kodieren — der Zuschnitt `crop=1080:915:0:0` schneidet das
Social-Media-Wasserzeichen der Originalaufnahmen weg:

```bash
SRC=original.MOV
ffmpeg -y -i "$SRC" -vf "crop=1080:915:0:0,hqdn3d=2:1.5:3:3" -an \
  -c:v libvpx-vp9 -crf 36 -b:v 0 -row-mt 1 -deadline good -cpu-used 3 \
  assets/video/studio-loop.webm
ffmpeg -y -i "$SRC" -vf "crop=1080:915:0:0,hqdn3d=2:1.5:3:3" -an \
  -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 24 -preset slow \
  -movflags +faststart assets/video/studio-loop.mp4
ffmpeg -y -ss 11 -i "$SRC" -frames:v 1 -vf "crop=1080:915:0:0" -q:v 3 \
  assets/video/studio-poster.jpg
```

Die Hero-Aufnahme wird per CSS abgedunkelt
(`filter: brightness(.76) contrast(1.08)`) und liegt unter einem doppelten
Verlauf. So trägt die Typografie in jedem Frame, auch wenn das Material
kurz hell ausbricht.

## Anfrageformular — StudioLink

Der Termin-Abschnitt zeigt **StudioLinks offizielle Anfrage-Maske** —
dieselbe Oberfläche wie in StudioLink selbst, mit Artist- und Standortwahl,
Bild-Upload und dem zweistufigen Ablauf. Aufgerufen wird:

```
https://studiolink-app.com/anfrage?studio=the-master-of-ink&embed=1&bg=080808&accent=c7c7c7
```

`embed=1` blendet Kopf, Fuß und eigenen Hintergrund der Maske aus, `bg` und
`accent` geben ihr das Farbklima dieser Seite. Sie trägt dabei den Hinweis
„Anfrageformular von StudioLink“.

### Das Ziel ist fest — und wird geprüft

Von außen ist nicht erkennbar, welche StudioLink-Fassung im Rahmen
antwortet. Eine ältere ignoriert `studio` stillschweigend und legt unter
ihrem eigenen Standard-Studio ab — Anfragen aus Rheine landeten dann in
München. Deshalb wird nicht vertraut, sondern nachgefragt:

1. Der Rahmen startet **verborgen** und lädt.
2. Die Maske meldet sich per `postMessage` mit dem Studio, für das sie
   tatsächlich arbeitet.
3. Nur wenn Herkunft und `studioId` exakt `the-master-of-ink` ergeben,
   wird auf sie umgeschaltet.
4. Bleibt die Meldung aus oder nennt ein anderes Studio, bleibt das
   Formular dieser Seite stehen — nach 6 Sekunden endgültig.

Der Rahmen trägt deshalb **kein** `loading="lazy"`: verborgen und faul
geladen würde er nie starten, sich nie melden und die Einbettung nie
freischalten.

### Rückfallebene

Ist `appUrl` leer, greift ein schlankes Formular auf der Seite selbst. Es
schreibt über dieselbe Funktion in dieselbe Pipeline
(`inkcore.public_create_lead(p_payload jsonb)`, SECURITY DEFINER, anonym
aufrufbar), hat aber nur Name, E-Mail, Telefon, Idee und Einwilligung.

Der Aufruf geht als `POST` an `/rest/v1/rpc/public_create_lead` mit den
Headern `apikey`, `Authorization: Bearer …` sowie `Content-Profile` und
`Accept-Profile` auf `inkcore` — ohne die beiden Profile-Header sucht
PostgREST die Funktion im falschen Schema. Nur `studio_id` ist Pflicht und
muss in `inkcore.studios` existieren.

Gegen Automaten: ein verstecktes Feld („Firma“) und drei Sekunden
Mindestverweildauer, dieselbe Schwelle wie in StudioLink. Wichtig für
spätere Änderungen: Diese Prüfung läuft **nach** der Feldvalidierung.
Andersherum quittiert ein schnell abgeschicktes leeres Formular mit
„Angekommen“, ohne etwas zu senden.

### Studio-Zuordnung

Die Anfragen laufen auf `studio_id = "the-master-of-ink"`. In der Datenbank
liegen drei Studios:

| id | name |
| --- | --- |
| `golden-geometry` | Golden Geometry |
| `the-master-of-ink` | The Master of Ink |
| `template-tattoo` | Tattoo-Studio (Vorlage) |

Sebastian hat auf `the-master-of-ink` ein aktives Manager-Profil
(masterofinkger@gmail.com); StudioLink löst das Studio beim Login über
`lib/active-studio.tsx` auf. Anfragen dieser Website erscheinen also im
richtigen Posteingang, sobald man sich mit dieser Adresse anmeldet.

Nicht nutzbar ist derzeit StudioLinks **öffentliche** Maske `/anfrage`: dort
steckt die Studio-id noch als Konstante im Code (`lib/supabase.ts`,
`STUDIO_ID = "golden-geometry"`). Die angemeldeten Bereiche sind längst
mandantenfähig, die öffentlichen Seiten wurden nur nicht mitgezogen. Sobald
`/anfrage` das Studio aus der Adresse liest, kann `appUrl` gesetzt und die
offizielle Maske eingebettet werden — der Code dafür steht bereits.

## Ablauf-Abschnitt

Drei Schritte statt vier — Klären und Komponieren sind eine Etappe. Die
senkrechte Achse links wächst beim Scrollen mit (`--journey-progress`, aus
`main.js`), Ziffer, Titellinie und Punkt setzen beim Eintreten nacheinander
ein. Bei `prefers-reduced-motion` bleibt die Achse ungefüllt und alles steht
sofort.

## Was noch zu tun ist

- Telefonnummer im Impressum ergänzen (§ 5 DDG) und die Umsatzsteuer-Angabe
  klären — beide sind in `impressum.html` als TODO markiert
- Porträt von Sebastian: derzeit ein enger Ausschnitt aus dem vorhandenen
  Studiofoto. Ein eigenes Porträt wäre besser — Dateien als
  `assets/img/team-sebastian-{420,670}.{jpg,webp}` ersetzen
- Impressum und Datenschutzerklärung ergänzen — in Deutschland Pflicht

## Vorhang beim Laden

Schwarzer Bildschirm mit dem Signet, bis die Seite steht — dann hebt er sich.
Markup und CSS stehen **inline im Dokument**, nicht im Stylesheet: sonst
blitzt die Seite auf, bevor der Vorhang da ist.

Vier Regeln halten ihn harmlos:

- Er wartet auf `load`, **nicht** auf das Hero-Video — das lädt bewusst erst
  danach und würde ihn sonst sekundenlang stehen lassen.
- **Er öffnet sich per CSS-Animation nach 3,6 s von selbst**, ganz ohne
  JavaScript. Das ist die eigentliche Sicherung: eine veraltete oder
  fehlerhafte `main.js` reicht sonst, und die Seite bleibt für immer
  schwarz — genau das ist einmal passiert.
- JavaScript hebt ihn im Normalfall früher (rund 1,3 s), Notaus bei 3 s.
- **Keine Scrollsperre.** Sie hing an JavaScript und wäre ein zweiter Riegel
  gewesen, den niemand mehr öffnen kann. Der Vorhang deckt den Bildschirm
  ohnehin ab.

Sichtbar ist er damit höchstens 4,4 s — geprüft gegen veraltete, fehlende
und syntaktisch kaputte `main.js`.

Eine Mindestdauer von 620 ms verhindert, dass er bei schnellem Cache nur
kurz aufblitzt; das wirkt wie ein Fehler. Bei `prefers-reduced-motion`
entfallen Ein- und Ausblendung.

### Beim Ändern von CSS oder JS: Version hochzählen

`index.html` lädt Stylesheet und Skripte mit `?v=…`. **Diese Kennung muss
bei jeder Änderung an `main.css`, `main.js` oder `gallery-data.js` erhöht
werden.** Sonst liefert der Browser die alte Datei zu neuem HTML — und genau
das hat den Vorhang einmal dauerhaft stehen lassen: neues HTML mit Vorhang,
alte `main.js` ohne die Logik zum Aufziehen.

## Arbeiten — der Betrachter

Statt vier Tafeln untereinander liegt eine Tafel da, durch die der Zeiger
waagerecht fährt: links die erste Arbeit, rechts die letzte. Wer nicht mag,
scrollt weiter. Das kürzt den Abschnitt von 2458 px auf rund 1700 px.

Bedienung auf allen Wegen: Zeiger (gedrosselt über `requestAnimationFrame`),
Ziehen auf Touch-Geräten, Pfeiltasten bei Tastaturfokus. Die Beschriftung
steht in einem `aria-live`-Bereich, wechselt also auch für Screenreader mit.

Die Bühne ist **hochformatig** (4:5) und in der Höhe gedeckelt: die
Aufnahmen sind Hochformat, ein Querformat-Ausschnitt zeigt vor allem
Hintergrund. `.gallery` ist ein 12-Spalten-Raster aus dem vorherigen Layout —
der Betrachter braucht deshalb `grid-column:1/-1`, sonst kollabiert die
Bühne auf 0 px Breite.

## Performance

Gemessen mit Chromium, Zahlen bis zum `load`-Ereignis:

| | bis „load“ | nach Durchscrollen |
| --- | --- | --- |
| Desktop 1440 | 8 Anfragen · 237 KB | 24 Anfragen · 4,6 MB |
| Mobil 390 | 10 Anfragen · 303 KB | 23 Anfragen · 0,6 MB |

Zwei Dinge halten den Start klein:

**Das Hero-Video wartet.** Es liegt im sichtbaren Bereich und würde sonst
sofort mitladen — knapp 3 MB, die mit Schrift, CSS und Poster um die Leitung
konkurrieren. Es startet erst nach dem `load`-Ereignis; sichtbar ist
währenddessen das Poster, das ohnehin gebraucht wird. Vorher waren es
3331 KB bis „load“, jetzt 237 KB.

**Die eingebettete StudioLink-Maske wartet auch.** Sie ist eine eigene
Anwendung; beim Seitenaufruf geladen kostet sie jeden Besucher Bandbreite,
auch die, die nie bis zum Formular scrollen. Sie wird geholt, sobald der
Termin-Abschnitt auf 700 px herankommt — früh genug, dass der Handschlag
durch ist, bevor jemand ankommt.

Auf Mobilgeräten, bei `prefers-reduced-motion` und bei aktivem Datensparen
werden beide Videos gar nicht geladen; es bleibt beim Poster.
