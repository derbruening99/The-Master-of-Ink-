# Neue Fotos hier ablegen

Dieser Ordner ist der Briefkasten für neue Bilder. Nichts hier wird auf der
Website angezeigt — er dient nur als Zwischenstation.

## So geht's

1. Foto hier hochladen (auf github.com: **Add file → Upload files**).
2. Der **Dateiname ist der Slot**. Das entscheidet, zu welchem Eintrag in
   `assets/js/gallery-data.js` das Bild gehört:

   | Datei hochladen als             | gehört zu                          |
   |---------------------------------|------------------------------------|
   | `studio-session.jpg`            | das große Foto im Studio-Abschnitt |
   | `work-herzen.jpg`               | Zwei Herzen · Unterarm             |
   | `work-amor-fati.jpg`            | amor fati · Oberschenkel           |
   | `work-hundertfuesser.jpg`       | Hundertfüßer · Wade (Blackwork)    |
   | `work-schleife.jpg`             | Schleife mit Jahreszahlen          |
   | `work-everything-happens.jpg`   | everything happens for a reason    |

3. Danach im Projekt einmal:

   ```
   ./bilder-einlesen.sh     # macht 640/1024/1600 in jpg + webp
   ./bump-version.sh        # sonst zeigen Browser die alte Fassung
   git add -A && git commit -m "Neue Arbeiten" && git push
   ```

## Gut zu wissen

- **JPEG oder PNG**, kein HEIC — ffmpeg kann HEIC hier nicht lesen. iPhone:
  in den Einstellungen unter *Kamera → Formate* auf „Maximale Kompatibilität"
  stellen, oder das Bild einmal teilen/exportieren, dann kommt ein JPEG raus.
- **So groß wie möglich** hochladen. Kleiner rechnet das Skript selbst,
  größer kann es nicht.
- Hochformat ist richtig — die Galerie zeigt Arbeiten im Verhältnis 4:5.
- Sind alle Ableitungen da, kann dieser Ordner weg:
  `git rm -r assets/img/neu`
