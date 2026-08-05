/* ============================================================
   Galerie-Daten — The Master of Ink
   ------------------------------------------------------------
   Einzige Quelle für die "Ausgewählte Arbeiten"-Galerie.
   Bilder werden hier NIE beschriftet oder überlagert — alle
   Texte (Titel, Kategorie, Bildunterschrift) leben als Daten
   neben dem Bild und lassen sich frei ändern.

   Neues Werk hinzufügen / Bild ersetzen:
   1. Bilddateien nach dem Namensschema ablegen:
        assets/img/<slot>-<breite>.jpg  und  .webp
      z. B.  work-rose-640.jpg, work-rose-1024.jpg, work-rose-1600.jpg
      (Empfohlene Breiten: 640, 1024, 1600 — siehe README für den
       ffmpeg-Einzeiler.)
   2. Unten einen Eintrag ergänzen bzw. anpassen.
   3. category muss eine id aus `categories` sein.
   Felder, die noch nicht feststehen, leer lassen ("") —
   sie werden dann einfach nicht angezeigt. Nichts erfinden.
   ============================================================ */

window.MOI_DATA = {
  /* Künstlerverzeichnis. Weitere Artists werden als zusätzliche Objekte
     ergänzt; die Team-Sektion wird automatisch daraus erzeugt. */
  artists: [
    {
      id: "bryan",
      name: "Bryan",
      role: "Resident Artist",
      number: "01",
      location: "Rheine",
      specialties: ["Sketch-Realismus", "Fine Line", "Blackwork"],
      bio: "Bryan entwickelt jedes Stück aus dem Gespräch heraus und zeichnet es für genau einen Menschen. Sein Fokus liegt auf klarer Komposition, ruhiger Ausführung und Motiven, die auch nach Jahren noch selbstverständlich zum Körper gehören.",
      quote: "Haut ist die ehrlichste Leinwand, die es gibt. Sie verdient Geduld.",
      instagram: "https://www.instagram.com/bruen.ink/",
      instagramLabel: "@bruen.ink",
      portrait: {
        slot: "team-bryan",
        widths: [640, 1200],
        alt: "Bryan lächelt während einer konzentrierten Tattoo-Session im Studio",
        position: "50% 42%"
      }
    }
  ],

  /* Filterkategorien der Galerie (Reihenfolge = Anzeige) */
  categories: [
    { id: "cover-up",  label: "Cover-up" },
    { id: "fine-line", label: "Fine Line" },
    { id: "realismus", label: "Realismus" },
    { id: "abstrakt",  label: "Abstrakt" }
  ],

  /* Text, wenn eine Kategorie (noch) keine Arbeiten enthält */
  emptyNote: "Aktuell zeigen wir hier keine Arbeiten — neue Stücke folgen. Frag gern direkt an.",

  works: [
    {
      id: "schlange",
      artistId: "bryan",
      featured: true,
      slot: "work-schlange",            /* -> assets/img/work-schlange-{640,1024,1600}.{jpg,webp} */
      widths: [640, 1024, 1600],
      ratio: "4 / 5",
      position: "50% 50%",
      alt: "Fine-Line-Tätowierung: Schlange mit Pfingstrosen entlang der Hüfte",
      num: "01",
      title: "Schlange & Pfingstrose",
      category: "fine-line",
      meta: "Fine Line · Hüfte",
      caption: "Gezeichnet entlang der Hüftlinie, damit die Bewegung des Körpers Teil der Komposition wird. Punktschattierung, keine harten Flächen."
    },
    {
      id: "leopard",
      artistId: "bryan",
      featured: true,
      slot: "work-leopard",
      widths: [640, 1024, 1440],
      ratio: "10 / 16",
      position: "50% 38%",
      alt: "Tätowierung eines halb verborgenen Leoparden am Oberarm",
      num: "02",
      title: "Leopard, halb verborgen",
      category: "realismus",            /* aus der Werkangabe "Blackwork-Realismus" */
      meta: "Blackwork-Realismus · Oberarm",
      caption: ""                        /* TODO: Beschreibung ergänzen */
    },
    {
      id: "dobermann",
      artistId: "bryan",
      featured: true,
      slot: "work-dobermann",
      widths: [640, 1024, 1600],
      ratio: "4 / 5",
      position: "50% 42%",
      alt: "Cover-up-Tätowierung: Dobermann-Porträt auf dem Unterarm",
      num: "03",
      title: "Wächter",
      category: "cover-up",
      meta: "Cover-up · Unterarm",
      caption: ""                        /* TODO: Beschreibung ergänzen */
    }
  ]
};

/* Optionale Konfiguration der Anfrage-Verarbeitung.
   endpoint gesetzt  -> Formular sendet JSON per POST dorthin
   endpoint leer     -> Fallback: öffnet das E-Mail-Programm (mailto) */
window.MOI_CONFIG = {
  formEndpoint: "",
  contactEmail: "studio@masterofink.example"
};
