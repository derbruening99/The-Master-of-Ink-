#!/usr/bin/env bash
# Nimmt Originalfotos aus assets/img/neu/ und macht daraus die Web-Größen.
#
#   1. Foto nach assets/img/neu/ legen — der Dateiname ist der Slot:
#        work-hundertfuesser.jpg  ->  wird zu work-hundertfuesser-{640,1024,1600}.{jpg,webp}
#      (Über github.com geht das per Drag-and-drop: "Add file" -> "Upload files".)
#   2. ./bilder-einlesen.sh
#   3. Das Skript trägt den Slot auch gleich in assets/js/gallery-data.js ein,
#      sofern dort ein Eintrag mit dem passenden Platzhalter-Kommentar steht.
#
# Die Originale bleiben liegen. Wenn alles passt, können sie weg:
#   git rm -r assets/img/neu && git commit -m "Originale entfernt"
set -euo pipefail
cd "$(dirname "$0")"

QUELLE="assets/img/neu"
ZIEL="assets/img"
BREITEN=(640 1024 1600)

[ -d "$QUELLE" ] || { echo "Ordner $QUELLE gibt es nicht — lege ihn an und leg die Fotos hinein."; exit 1; }

gefunden=0
for datei in "$QUELLE"/*; do
  [ -f "$datei" ] || continue
  name="$(basename "$datei")"
  slot="${name%.*}"
  case "$slot" in
    README|readme|.*) continue ;;
  esac
  gefunden=$((gefunden + 1))

  echo "── $name  →  $slot"
  # Breite des Originals, damit wir nie hochskalieren
  quellbreite="$(ffprobe -v error -select_streams v:0 -show_entries stream=width \
                 -of csv=p=0 "$datei" 2>/dev/null || echo 0)"
  if [ "$quellbreite" -eq 0 ]; then
    echo "   ! ffmpeg kann die Datei nicht lesen (HEIC?). Als JPEG oder PNG neu hochladen."
    continue
  fi

  for w in "${BREITEN[@]}"; do
    if [ "$w" -gt "$quellbreite" ]; then
      echo "   · ${w}px übersprungen (Original ist nur ${quellbreite}px breit)"
      continue
    fi
    ffmpeg -y -loglevel error -i "$datei" -vf "scale=$w:-2:flags=lanczos" \
           -q:v 3 "$ZIEL/$slot-$w.jpg"
    ffmpeg -y -loglevel error -i "$datei" -vf "scale=$w:-2:flags=lanczos" \
           -c:v libwebp -q:v 80 "$ZIEL/$slot-$w.webp"
    printf '   · %-5s %s / %s\n' "${w}px" \
      "$(du -h "$ZIEL/$slot-$w.jpg" | cut -f1)" "$(du -h "$ZIEL/$slot-$w.webp" | cut -f1)"
  done

  # Slot in die Galerie-Daten eintragen — nur dort, wo der Platzhalter
  # slot: "",  /* -> <slot> */  schon vorbereitet ist.
  python3 - "$slot" <<'PY'
import re, sys
slot = sys.argv[1]
pfad = "assets/js/gallery-data.js"
s = open(pfad, encoding="utf-8").read()

# slot: "",   /* -> work-xyz */   ->   slot: "work-xyz",
muster = re.compile(r'slot:\s*"",[ \t]*/\* -> %s \*/' % re.escape(slot))
neu, treffer = muster.subn('slot: "%s",' % slot, s)

if treffer:
    open(pfad, "w", encoding="utf-8").write(neu)
    print("   · in gallery-data.js eingetragen")
elif '"%s"' % slot in s:
    print("   · steht schon in gallery-data.js")
else:
    print("   ! kein Platzhalter für %s in gallery-data.js — dort von Hand ergänzen" % slot)
PY
done

if [ "$gefunden" -eq 0 ]; then
  echo "Nichts zu tun — $QUELLE ist leer."
  exit 0
fi

echo
echo "Fertig. Danach noch:"
echo "  ./bump-version.sh    (sonst zeigen Browser die alte Fassung)"
echo "  git add -A && git commit && git push"
