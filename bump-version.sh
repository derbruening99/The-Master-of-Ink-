#!/usr/bin/env bash
# Zählt die Cache-Kennung in ALLEN Seiten hoch.
#
# Warum das nötig ist: index.html, impressum.html und datenschutz.html laden
# CSS und JS mit "?v=…". Bleibt die Kennung stehen, liefert der Browser die
# alte Datei zu neuem HTML. Genau so blieb der Vorhang einmal dauerhaft
# stehen — neues HTML mit Vorhang, alte main.js ohne die Logik dazu.
#
#   ./bump-version.sh              # Kennung aus dem heutigen Datum
#   ./bump-version.sh mein-name    # eigene Kennung
set -euo pipefail
cd "$(dirname "$0")"
VERSION="${1:-$(date +%Y%m%d-%H%M)}"
for datei in index.html impressum.html datenschutz.html; do
  [ -f "$datei" ] || continue
  perl -pi -e 's{(assets/(?:css|js)/[a-z-]+\.(?:css|js))\?v=[^"]*}{$1?v='"$VERSION"'}g' "$datei"
done
echo "Kennung gesetzt auf: $VERSION"
grep -ho 'assets/[a-z]*/[a-z-]*\.\(css\|js\)?v=[^"]*' index.html impressum.html datenschutz.html | sort -u
