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
   3. categories enthält eine oder mehrere ids aus `categories`.
   Felder, die noch nicht feststehen, leer lassen ("") —
   sie werden dann einfach nicht angezeigt. Nichts erfinden.
   ============================================================ */

window.MOI_DATA = {
  /* Künstlerverzeichnis. Weitere Artists werden als zusätzliche Objekte
     ergänzt; die Team-Sektion wird automatisch daraus erzeugt. */
  artists: [
    {
      id: "sebastian",
      name: "Sebastian",
      role: "Inhaber & Tätowierer",
      number: "01",
      location: "Rheine",
      specialties: ["Realismus", "Fine Line", "Symbolische Kompositionen"],
      bio: "Sebastian hat The Master of Ink gegründet und das Tätowieren erst nach der Gründung gelernt. Seine Arbeiten verbinden Realismus, feine Linien und symbolische Kompositionen — entwickelt aus der Geschichte hinter dem Motiv.",
      quote: "",
      instagram: "",
      instagramLabel: "",
      portrait: {
        slot: "team-sebastian",
        widths: [420, 670],
        alt: "Sebastian konzentriert an seinem Arbeitsplatz im Tattoostudio",
        position: "50% 30%"
      }
    },
    {
      id: "bryan",
      name: "Bryan",
      role: "Resident Artist",
      number: "02",
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
      alt: "Realistische Tätowierung einer Schlange mit Pfingstrosen entlang der Hüfte",
      num: "01",
      title: "Realismusarbeiten",
      category: "realismus",
      categories: ["realismus"],
      meta: "Schlange & Pfingstrose",
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
      title: "Abstrakte Arbeiten",
      category: "abstrakt",
      categories: ["abstrakt"],
      meta: "Leopard · Oberarm",
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
      title: "Realismus, Blackwork & Cover-Ups",
      category: "cover-up",
      categories: ["realismus", "cover-up"],
      meta: "Dobermann · Unterarm",
      caption: ""                        /* TODO: Beschreibung ergänzen */
    },
    {
      id: "gehirn-faden",
      artistId: "sebastian",
      featured: true,
      slot: "work-fineline",
      widths: [640, 1024, 1600],
      ratio: "4 / 5",
      position: "50% 50%",
      alt: "Fine-Line-Tätowierung eines Gehirns mit umlaufendem Faden",
      num: "04",
      title: "Fineline-Arbeiten",
      category: "fine-line",
      categories: ["fine-line"],
      meta: "Gehirn & Faden",
      caption: ""
    }
  ]
};

/* Optionale Konfiguration der Anfrage-Verarbeitung.
   endpoint gesetzt  -> Formular sendet JSON per POST dorthin
   endpoint leer     -> Fallback: öffnet das E-Mail-Programm (mailto) */
window.MOI_CONFIG = {
  /* ---------------------------------------------------------
     StudioLink — offizielle Anfrage-Schnittstelle.
     Das Formular ruft dieselbe Funktion auf wie StudioLinks
     eigene /anfrage-Seite: inkcore.public_create_lead(p_payload).
     Die Anfrage landet damit direkt im Studio-Posteingang, nicht
     in einem Postfach nebenan.

     `key` ist der veröffentlichbare Supabase-Schlüssel — er steckt
     per Design in jedem Browser-Bundle und ist kein Geheimnis.
     Der Zugriff ist serverseitig auf diese eine Funktion begrenzt.

     leadLinkBase: Adresse der StudioLink-Installation. Ist sie
     gesetzt, bekommen Anfragende nach dem Absenden einen Link, um
     Details nachzureichen (StudioLink gibt dafür ein Token zurück).
     --------------------------------------------------------- */
  studiolink: {
    url: "https://vdhscdhyniqmaynsayrz.supabase.co",
    key: "sb_publishable_LZ9KBBL1pwtonk9VHam5Pw_8GVQ5K0r",
    schema: "inkcore",
    studioId: "the-master-of-ink",
    privacyPolicyVersion: "2026-07",
    leadLinkBase: "",

    /* Offizielle StudioLink-Maske einbetten.

       Die Website ruft auf:
         /anfrage?studio=<studioId>&embed=1&bg=080808&accent=c7c7c7
       — die echte Maske mit Artist-Wahl, Bild-Upload und zweitem Schritt,
       im Farbklima dieser Seite und mit Herkunftshinweis.

       Umgeschaltet wird erst, wenn die Maske sich per postMessage als
       genau dieses Studio meldet. Eine ältere StudioLink-Fassung kennt
       den `studio`-Parameter nicht und meldet sich deshalb nicht — dann
       bleibt das Formular unten stehen, statt Anfragen ins falsche
       Studio zu schreiben. Leer lassen schaltet die Einbettung ganz ab. */
    appUrl: "https://studiolink-app.com"
  },

  /* Rückfallebene, falls StudioLink nicht erreichbar ist */
  contactEmail: "masterofinkger@gmail.com"
};
