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

## Stand (6. August 2026)

Die Seite ist fertig und veröffentlicht. Was drinsteckt:

| | |
| --- | --- |
| Arbeiten | 13 Einträge, davon **12 sichtbar** (`japan` wartet auf ein besseres Foto) |
| Künstler | Sebastian (`bruen.ink`) und Bryan (`tattoobryaan`) — alle gezeigten Arbeiten sind Sebastians |
| Kategorien | Cover-up, Fine Line, Realismus, Blackwork, Abstrakt |
| Anfragen | vierstufiger Wizard → Supabase → Posteingang von **The Master of Ink** in StudioLink |
| Videos | zwei, stumm, in Schleife, erst beim Sichtbarwerden geladen |
| Rechtliches | Impressum und Datenschutz stehen; im Impressum fehlen noch Telefonnummer und Umsatzsteuer-Angabe |

Offene Punkte stehen unten unter „Was noch zu tun ist". Das Gegenstück —
StudioLink, wo die Anfragen landen — liegt in einem eigenen Repo; dessen Stand
steht dort in `docs/STAND_2026-08-06.md`.

## Veröffentlichung

Die Seite liegt auf **Vercel** unter `https://themasterofink.vercel.app/` und wird
bei jedem Push automatisch neu ausgeliefert. Es gibt keinen Build-Schritt — was
im Repo liegt, ist die Seite.

| | |
| --- | --- |
| Zweig | `claude/master-of-ink-production-bg11la` — der **einzige** Zweig, also zugleich der Produktionszweig |
| Adresse | `https://themasterofink.vercel.app/` (steht als canonical und `og:url` in allen drei Seiten) |
| Kopfzeilen | `vercel.json` — Schriften/Bilder/Videos ein Jahr unveränderlich, CSS/JS eine Stunde |
| Adresse ändern | `./set-domain.sh https://neue-adresse` stempelt canonical, `og:url`, JSON-LD, `sitemap.xml` und `robots.txt` in einem Zug um |

Für dieses Repo ist zusätzlich **GitHub Pages** aktiv. Das ist ein Überbleibsel
und nicht die ausgelieferte Seite: Der Pages-Bau hinkt gelegentlich einen
Commit hinterher (zuletzt bei `c5ea427`). Solange die Adresse oben auf Vercel
zeigt, ist das folgenlos — wer Pages nicht braucht, kann es in den
Repo-Einstellungen abschalten.

**Nach jeder Änderung an CSS oder JS** muss `./bump-version.sh` laufen, sonst
liefern Browser die alten Dateien aus dem Zwischenspeicher aus. Siehe
„Beim Ändern von CSS oder JS: Version hochzählen".

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
  artistId: "sebastian",      // Zuordnung zum Team-Eintrag
  featured: true,              // erscheint in der kuratierten Auswahl
  slot: "work-schlange",        // Dateiname ohne Breite und Endung
  widths: [640, 1024, 1600],    // vorhandene Breiten
  ratio: "4 / 5",               // Bildausschnitt im Layout
  position: "50% 50%",          // Bildfokus (object-position)
  alt: "…",                     // Bildbeschreibung (Barrierefreiheit)
  num: "01",
  title: "Schlange & Pfingstrose",
  categories: ["fine-line"],    // ids aus `categories` — eine Arbeit darf
  category: "fine-line",        //   in mehreren Filtern auftauchen
  meta: "Fine Line · Hüfte",
  caption: "…"                  // leer lassen, wenn noch nichts feststeht
}
```

Zu den zwei Kategorie-Feldern: Maßgeblich ist die **Liste** `categories` —
`main.js` liest `work.categories || [work.category]`. Das Einzelfeld ist die
ältere Schreibweise und bleibt als Rückfall stehen. Beim Anlegen einer Arbeit
beide setzen; beim Umkategorisieren nicht vergessen, beide zu ändern.

Leere Felder werden einfach nicht gerendert — lieber `""` stehen lassen als
etwas erfinden. Derzeit tragen nur `schlange` und `ruecken` einen Text;
bei den übrigen elf steht `caption: ""`, weil dazu nichts feststand. Das ist
Absicht, kein Versehen: Ein erfundener Satz unter einer echten Arbeit fällt
sofort auf. Sebastian kann sie jederzeit nachreichen.

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

`Cover-up`, `Fine Line`, `Realismus`, `Blackwork`, `Abstrakt` — definiert in
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

**Auf dem Telefon laufen die Videos ebenfalls** — dort aber in einer
eigenen, kleineren Fassung (`*-loop-mobil.{webm,mp4}`, 720 px breit). Welche
Datei geladen wird, entscheidet die Bildschirmbreite; das Markup führt beide
über `data-video-*` bzw. `data-video-*-mobil`.

**Durch das Poster ersetzt wird das Video nur**, wenn das System
`prefers-reduced-motion: reduce` meldet oder der Browser Datensparen
signalisiert (`navigator.connection.saveData`). Beim Verlassen des Viewports
pausiert es.

Datenmenge nach vollem Durchscrollen: Desktop 4,6 MB, Telefon 1,8 MB.

Poster: `studio-poster.jpg` (1080 px), `studio-poster-720.jpg`,
`studio-poster-portrait.jpg` (Hochformat für Telefone) sowie
`needle-poster*.jpg`.

Neu kodieren.

**Hero** — die Aufnahme trägt auf halber Höhe ein
`@bruen.ink`-Wasserzeichen; `crop=1080:915:0:0` nimmt alles darüber.
(delogo verschmiert die feinen Linien und ist keine Option.)

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

**Nadel** — aus `brune_260711_backtattoojule.mov` (2160x3840, 3,25 s,
ohne Wasserzeichen). Die Aufnahme besteht aus vier Einstellungen; genommen
ist die dritte und vierte (1,80 s–3,25 s), in denen die Nadel über die Haut
läuft. Der Ausschnitt liegt auf der Nadelspitze:

```bash
SRC=brune_260711_backtattoojule.mov
VF="crop=1500:1875:416:930,hqdn3d=1:0.8:2:2"
ffmpeg -y -ss 1.80 -t 1.45 -i "$SRC" -map 0:v:0 -an \
  -vf "$VF,scale=1080:1350:out_range=tv" \
  -c:v libvpx-vp9 -crf 34 -b:v 0 -row-mt 1 -deadline good -cpu-used 3 \
  assets/video/needle-loop.webm
ffmpeg -y -ss 1.80 -t 1.45 -i "$SRC" -map 0:v:0 -an \
  -vf "$VF,scale=1080:1350:out_range=tv" \
  -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 23 -preset slow \
  -movflags +faststart assets/video/needle-loop.mp4
ffmpeg -y -ss 2.25 -i "$SRC" -map 0:v:0 -frames:v 1 \
  -vf "crop=1500:1875:416:930,scale=1080:1350" -q:v 3 \
  assets/video/needle-poster.jpg
```

`-map 0:v:0` ist nötig: die Datei führt neben Bild und Ton noch eine
Timecode-Spur. `out_range=tv` wandelt den vollen Wertebereich der Quelle
(`yuvj420p`) sauber um, sonst kippen Schwarz und Weiß.

Das Ergebnis ist Hochformat (4:5) mit der Nadelspitze in der Bildmitte. Am
Telefon ist die Bühne Querformat, dort bleiben rund 64 % der Höhe sichtbar;
`object-position:50% 68%` setzt die Spitze auf etwa 40 % — Nadel oben, Haut
darunter.

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

Nach Dringlichkeit, oben das Rechtliche:

- **Telefonnummer im Impressum** ergänzen (§ 5 DDG) und die Umsatzsteuer-Angabe
  klären — beide stehen in `impressum.html` als TODO im Markup. Das ist der
  einzige Punkt der Liste mit einer rechtlichen Frist; alles andere ist Kür.
  (Die Seiten `impressum.html` und `datenschutz.html` selbst stehen und sind
  verlinkt — nur diese zwei Angaben fehlen.)
- **Japanisches Sleeve**: Der Eintrag `japan` in `gallery-data.js` ist
  vollständig vorbereitet, aber `slot: ""` — also unsichtbar. Grund steht in
  `c5ea427`: Das vorhandene Foto zeigt den Arm schräg im Raum, mit Spiegel und
  Sockelleiste dahinter; im 4:5-Rahmen bleibt der Hintergrund in jedem
  Zuschnitt sichtbar. Sobald ein Foto da ist, auf dem das Motiv den Rahmen
  füllt: durch `bilder-einlesen.sh` schicken, Dateinamen in `slot` eintragen,
  fertig.
- **Porträt von Sebastian**: derzeit ein enger Ausschnitt aus dem vorhandenen
  Studiofoto. Ein eigenes Porträt wäre besser — Dateien als
  `assets/img/team-sebastian-{420,670}.{jpg,webp}` ersetzen.

## Vorhang beim Laden

Dunkler Bildschirm mit dem animierten Signet, der **„Krönung“**: Ein Goldfunke
entsteht an der Nadelspitze, das Licht steigt die Nadel hinauf, fließt durch
das M und setzt die Krone zuletzt auf. Quelle und Videos dazu:
`~/Kommandozentrale/03_Tattoostudio/master-of-ink-animation/` — die Datei
`assets/js/master-of-ink-reveal.js` ist eine Kopie von deren `web/`-Ordner
(ohne Abhängigkeiten, rund 100 KB komprimiert, lädt `async`).

Markup und CSS stehen **inline im Dokument**, nicht im Stylesheet: sonst
blitzt die Seite auf, bevor der Vorhang da ist.

Ablauf:

- **Beim Öffnen und bei jedem Neuladen** läuft die Animation in voller Länge
  (5,1 s) — Funke, Lichtfluss, Krone, Schrift, Goldpuls. Erst wenn sie steht
  (`settled`) und `load` durch ist, hebt sich der Vorhang in 1,2 s.
- **Innerhalb der Seite zurück** (vom Impressum, Zurück-Taste): das fertige
  Signet steht sofort, der Vorhang hebt sich wie früher nach `load`
  (mindestens 620 ms).
- **Überspringen:** Tippen, Klicken, Scrollen oder eine Taste heben ihn sofort.
- In einem **Hintergrund-Tab** geöffnet, startet die Animation (und der Notaus)
  erst, wenn der Tab sichtbar wird.
- Ruckelt ein Gerät, überspringt die Animation Bilder statt länger zu werden;
  das Licht rechnet auf halber Kartenauflösung (die Kanten kommen aus den
  Vektoren und bleiben scharf).

Regeln, die ihn harmlos halten:

- Er wartet auf `load`, **nicht** auf das Hero-Video — das lädt bewusst erst
  danach und würde ihn sonst sekundenlang stehen lassen.
- **Er öffnet sich per CSS-Animation nach 9,6 s von selbst**, ganz ohne
  JavaScript. Das ist die eigentliche Sicherung: eine veraltete oder
  fehlerhafte `main.js` reicht sonst, und die Seite bleibt für immer
  schwarz — genau das ist einmal passiert.
- JavaScript-Notaus bei 9 s. Fehlt das Animationsskript bei `load` noch, gilt
  der alte Ablauf (heben nach `load`).
- **Keine Scrollsperre.** Sie hing an JavaScript und wäre ein zweiter Riegel
  gewesen, den niemand mehr öffnen kann. Der Vorhang deckt den Bildschirm
  ohnehin ab.

Bei `prefers-reduced-motion` gibt es keine Animation: das fertige Signet
steht, Ein- und Ausblendung entfallen.

**Signet aktualisieren:** in `master-of-ink-animation` bauen
(`python3 build/build.py`), `web/master-of-ink-reveal.js` hierher kopieren,
`./bump-version.sh`.

### Beim Ändern von CSS oder JS: Version hochzählen

`index.html` lädt Stylesheet und Skripte mit `?v=…`. **Diese Kennung muss
bei jeder Änderung an `main.css`, `main.js` oder `gallery-data.js` erhöht
werden.** Sonst liefert der Browser die alte Datei zu neuem HTML — und genau
das hat den Vorhang einmal dauerhaft stehen lassen: neues HTML mit Vorhang,
alte `main.js` ohne die Logik zum Aufziehen.

## Schwebender Anfrage-Knopf

Unten rechts (auf Telefonen unten mittig) steht „Projekt anfragen ↗“ und
springt zu `#termin`. Er erscheint erst, wenn der Hero aus dem Bild ist — dort
gibt es eigene Knöpfe — und tritt zurück, solange die Anfrage selbst oder der
Fuß im Bild ist. Er passt sich dem Untergrund an: über hellen Flächen dunkel mit
heller Haarlinie, über dunklen hell (`.is-on-dark`). Ohne JavaScript entfällt er (die Kopfzeile hat
denselben Link). CSS und Logik: letzter Block in `main.css`, Block nach dem
Vorhang in `main.js`.

## Manifest: Zitat neben dem Bild

„Ein Tattoo wird nicht auf den Körper gesetzt …“ steht in der Bildtafel
(`figure.manifesto__image`) und nutzt dasselbe Spaltenraster wie
`.manifesto__grid`: auf breiten Schirmen vertikal mittig neben dem Foto, auf
Telefonen darunter nach der Bildunterschrift.

## Arbeiten — geteilte Bühne (aktuell)

Prozess und Arbeiten teilen sich ein Kapitel und **eine** klebende
Bildfläche. Links steht sie fest, rechts scrollt der Inhalt vorbei: neben
den drei Prozessschritten zeigt sie das Nadel-Video, danach blendet sie auf
die jeweils vorbeiziehende Arbeit um. Das füllt die Spalte, die vorher neben
Schritt II und III leer stand, und ersetzt den kompletten eigenen
Arbeiten-Abschnitt.

Wie es zusammenspielt:

- Jeder Text rechts trägt `data-stage="<id>"`; ein IntersectionObserver mit
  mittigem Band (`rootMargin -40 %/-40 %`) schaltet die Bühne auf den
  obersten sichtbaren Block.
- **Jede Arbeit braucht Scrollstrecke** (`min-height: 44svh`), sonst kommt
  sie nie an die Reihe.
- Der Abschnitt nutzt `overflow: clip`, nicht `hidden` — `hidden` erzeugt
  einen Scrollcontainer und macht jedes `position: sticky` darin wirkungslos.
- Die alte `.gallery` war ein 12-Spalten-Raster; bleibt es stehen, liegen
  alle Werkblöcke nebeneinander auf gleicher Höhe und nur der erste
  bekommt je die Bühne.
- Nach einem Filterwechsel baut `renderGallery()` Bühnen-Ausschnitte und
  Blöcke gemeinsam neu auf; ohne Treffer bleibt das Video stehen.
- Bei `prefers-reduced-motion` klebt nichts und die Ausschnitte wechseln
  ohne Übergang; ohne JavaScript zeigt `<noscript>` die vier Bilder direkt.

## Scroll-Gefühl

`scroll-snap-type: y proximity` auf `html`, Rastpunkte an den
Kapitelanfängen — **proximity, nicht mandatory**: es rastet nur ein, wer
nahe einer Kante landet. `mandatory` würde die lange Werk-Spur unbenutzbar
machen, weil man zwischen zwei Rastpunkten nie zum Stehen käme. Nur ab
900 px Breite und ohne `prefers-reduced-motion`. Die Eintritte der
Abschnitte laufen als weiches Aufsteigen mit Unschärfe über die
`reveal--soak`-Klasse.

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
