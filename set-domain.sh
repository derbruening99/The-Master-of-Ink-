#!/usr/bin/env bash
# Stempelt die endgültige Adresse in die ganze Seite:
#   ./set-domain.sh https://masterofink.vercel.app
#
# Setzt auf allen drei Seiten canonical + og:url, macht og:image absolut
# (Pflicht für Instagram/WhatsApp-Vorschauen), trägt die url ins JSON-LD
# ein, schreibt sitemap.xml und verweist in robots.txt darauf.
# Läuft mehrfach sauber — alte Werte werden ersetzt, nicht verdoppelt.
set -euo pipefail
cd "$(dirname "$0")"

DOMAIN="${1:?Aufruf: ./set-domain.sh https://deine-adresse}"
DOMAIN="${DOMAIN%/}"

python3 - "$DOMAIN" <<'PY'
import re, sys
domain = sys.argv[1]

SEITEN = {
    "index.html": "",
    "impressum.html": "impressum.html",
    "datenschutz.html": "datenschutz.html",
}

for datei, pfad in SEITEN.items():
    s = open(datei, encoding="utf-8").read()
    url = domain + "/" + pfad if pfad else domain + "/"

    # Alte Exemplare entfernen, dann frisch direkt vor og:type einsetzen
    s = re.sub(r'\s*<link rel="canonical"[^>]*>', "", s)
    s = re.sub(r'\s*<meta property="og:url"[^>]*>', "", s)
    anker = '<meta property="og:type" content="website">'
    s = s.replace(anker,
        '<link rel="canonical" href="%s">\n  %s\n  <meta property="og:url" content="%s">' % (url, anker, url))

    # Vorschaubild absolut — relative og:image-Pfade ignorieren die Crawler
    s = s.replace('content="assets/img/og-image.jpg"', 'content="%s/assets/img/og-image.jpg"' % domain)

    # JSON-LD (nur index): url ergänzen, image/logo absolut
    if datei == "index.html":
        s = re.sub(r'"@type": "TattooParlor",\s*\n(\s*)"url": "[^"]*",', r'"@type": "TattooParlor",\n\1', s)
        s = s.replace('"@type": "TattooParlor",',
                      '"@type": "TattooParlor",\n    "url": "%s/",' % domain)
        s = s.replace('"image": "assets/img/og-image.jpg"', '"image": "%s/assets/img/og-image.jpg"' % domain)
        s = s.replace('"logo": "assets/img/logo-320.png"', '"logo": "%s/assets/img/logo-160.png"' % domain)
    open(datei, "w", encoding="utf-8").write(s)
    print("gestempelt:", datei, "→", url)

# Sitemap
import datetime, subprocess
heute = subprocess.run(["date", "+%Y-%m-%d"], capture_output=True, text=True).stdout.strip()
eintraege = "".join(
    "  <url><loc>%s</loc><lastmod>%s</lastmod></url>\n" % (domain + "/" + p if p else domain + "/", heute)
    for p in SEITEN.values())
open("sitemap.xml", "w", encoding="utf-8").write(
    '<?xml version="1.0" encoding="UTF-8"?>\n'
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n%s</urlset>\n' % eintraege)
print("sitemap.xml geschrieben.")

# robots.txt: Sitemap-Zeile setzen bzw. ersetzen
r = open("robots.txt", encoding="utf-8").read()
r = re.sub(r"\n?# Sitemap wird ergänzt.*\n?", "\n", r)
r = re.sub(r"\n?Sitemap: .*\n?", "\n", r)
open("robots.txt", "w", encoding="utf-8").write(r.rstrip() + "\n\nSitemap: %s/sitemap.xml\n" % domain)
print("robots.txt verweist auf die Sitemap.")
PY
echo
echo "Fertig. Jetzt committen und pushen — Vercel deployt von selbst."
