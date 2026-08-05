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

Der Termin-Abschnitt zeigt **StudioLinks offizielle Anfrage-Maske**
(`/anfrage`), eingebettet von der laufenden Installation. Das ist dieselbe
Oberfläche wie in StudioLink selbst — Artist- und Standortwahl, Bild-Upload,
zweistufiger Ablauf „Lead sichern, dann qualifizieren“. Sie bleibt
automatisch aktuell: Änderungen in StudioLink erscheinen hier, ohne dass an
dieser Website etwas nachgezogen werden muss.

Gesteuert wird das über einen einzigen Wert in `assets/js/gallery-data.js`:

```js
window.MOI_CONFIG = {
  studiolink: {
    appUrl: "https://studiolink-app.com",   // ← Installation
    …
  }
};
```

Ist `appUrl` gesetzt, wird die Maske eingebettet und das schlanke Formular
darunter ausgeblendet. Unter der Einbettung steht ein Link, der die Maske in
einem neuen Tab öffnet — falls ein Browser das Einbetten blockiert.

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
- StudioLinks `/anfrage` mandantenfähig machen, dann `appUrl` setzen
- Porträt von Sebastian: derzeit ein enger Ausschnitt aus dem vorhandenen
  Studiofoto. Ein eigenes Porträt wäre besser — Dateien als
  `assets/img/team-sebastian-{420,670}.{jpg,webp}` ersetzen
- Impressum und Datenschutzerklärung ergänzen — in Deutschland Pflicht
