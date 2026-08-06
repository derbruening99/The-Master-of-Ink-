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
      specialties: ["Fine Line", "Abstrakt", "Realismus"],
      bio: "Sebastian hat The Master of Ink gegründet und das Tätowieren erst danach gelernt. Er arbeitet mit dem Flow des Körpers: Ein Motiv wird nicht auf eine Stelle gelegt, sondern an ihr entlang entwickelt und auf den Menschen angepasst, der es trägt — in feinen Linien, abstrakten Formen oder realistischen Elementen, je nachdem, was die Stelle verlangt.",
      quote: "",
      instagram: "https://www.instagram.com/bruen.ink/",
      instagramLabel: "@bruen.ink",
      /* StudioLink-Profil-ID. Nur mit ihr kann eine Anfrage direkt einem
         Artist zugeordnet werden. Fehlt sie, wird der Wunsch trotzdem im
         Anfragetext festgehalten — er geht also nie verloren. */
      studiolinkId: "223df2f8-780d-452f-8417-27b20f84950c",
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
      bio: "Bryan zeichnet jedes Motiv für genau einen Menschen — entwickelt aus dem Gespräch und aus der Geschichte, die dahinter steht. Sein Fokus liegt auf klarer Komposition und ruhiger Ausführung: Arbeiten, die auch nach Jahren noch selbstverständlich wirken.",
      quote: "Haut ist die ehrlichste Leinwand, die es gibt. Sie verdient Geduld.",
      instagram: "https://www.instagram.com/tattoobryaan/",
      instagramLabel: "@tattoobryaan",
      /* Bryan hat noch kein StudioLink-Profil. Solange es fehlt, landet
         sein Name im Anfragetext statt in der Artist-Zuordnung. Sobald es
         angelegt ist, hier die Profil-ID eintragen — mehr ist nicht nötig. */
      studiolinkId: "",
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
    { id: "blackwork", label: "Blackwork" },
    { id: "abstrakt",  label: "Abstrakt" }
  ],

  /* Text, wenn eine Kategorie (noch) keine Arbeiten enthält */
  emptyNote: "Aktuell zeigen wir hier keine Arbeiten — neue Stücke folgen. Frag gern direkt an.",

  works: [
    {
      id: "schlange",
      artistId: "sebastian",
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
      artistId: "sebastian",
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
      artistId: "sebastian",
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
      caption: ""    },

    /* ---------------------------------------------------------------
       ARBEITEN VON BRYAN.
       Die Vorlagen lagen nur in 1200-1486 px vor und sind zusätzlich
       eng auf das Motiv beschnitten, damit die kleinen Arbeiten das
       Bild füllen. Deshalb gibt es hier nur die 640er-Breite —
       widths listet nur, was wirklich existiert.
       Liegen bessere Originale vor: nach assets/img/neu/ legen und
       ./bilder-einlesen.sh laufen lassen, dann 1600 hier ergänzen.
       --------------------------------------------------------------- */
    {
      id: "herzen",
      artistId: "bryan",
      featured: true,
      slot: "work-herzen",
      widths: [640],
      ratio: "4 / 5",
      position: "50% 50%",
      alt: "Fine-Line-Tätowierung: zwei Herzfiguren Hand in Hand am Unterarm, rote und schwarze Linien",
      num: "05",
      title: "Fineline-Arbeiten",
      category: "fine-line",
      categories: ["fine-line"],
      meta: "Zwei Herzen · Unterarm",
      caption: ""
    },
    {
      id: "amor-fati",
      artistId: "bryan",
      featured: true,
      slot: "work-amor-fati",
      widths: [640],
      ratio: "4 / 5",
      position: "50% 50%",
      alt: "Feine Schrift-Tätowierung „amor fati“ am Oberschenkel",
      num: "06",
      title: "Fineline-Arbeiten",
      category: "fine-line",
      categories: ["fine-line"],
      meta: "amor fati · Oberschenkel",
      caption: ""
    },
    {
      id: "hundertfuesser",
      artistId: "bryan",
      featured: true,
      slot: "work-hundertfuesser",
      widths: [640],
      ratio: "4 / 5",
      position: "50% 50%",
      alt: "Blackwork-Tätowierung eines Hundertfüßers, der sich über den Unterschenkel windet",
      num: "07",
      title: "Blackwork-Arbeiten",
      category: "blackwork",
      categories: ["blackwork"],
      meta: "Hundertfüßer · Unterschenkel",
      caption: ""
    },
    {
      id: "schleife",
      artistId: "bryan",
      featured: true,
      slot: "work-schleife",
      widths: [640],
      ratio: "4 / 5",
      position: "50% 50%",
      alt: "Fine-Line-Tätowierung einer Schleife mit den Jahreszahlen 1971, 1976 und 2004 am Unterarm",
      num: "08",
      title: "Fineline-Arbeiten",
      category: "fine-line",
      categories: ["fine-line"],
      meta: "Schleife mit Jahreszahlen · Unterarm",
      caption: ""
    },
    {
      id: "everything-happens",
      artistId: "bryan",
      featured: true,
      slot: "work-everything-happens",
      widths: [640],
      ratio: "4 / 5",
      position: "50% 50%",
      alt: "Feine Schrift-Tätowierung „everything happens for a reason“ am Oberarm",
      num: "09",
      title: "Fineline-Arbeiten",
      category: "fine-line",
      categories: ["fine-line"],
      meta: "everything happens for a reason · Oberarm",
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

  /* -----------------------------------------------------------------
     Anfrage-Wizard.

     Die `wert`-Angaben sind NICHT frei wählbar — StudioLink prüft sie
     serverseitig und weist unbekannte Werte ab. Erlaubt sind:
       art      : tattoo · coverup · nachstechen · beratung · unsicher
                  (auch piercing, hier nicht angeboten)
       farbe    : black_grey · color · both · unsure
       budget   : under_200 · 200_500 · 500_1000 · 1000_2500 · over_2500
                  · unsure · not_provided
       kanal    : email · whatsapp · phone · instagram · sms
     Die Beschriftungen (`label`, `hinweis`) sind frei änderbar.
     Reihenfolge = Anzeigereihenfolge. Einträge dürfen weg.
     ----------------------------------------------------------------- */
  wizard: {
    art: [
      { wert: "tattoo",      label: "Neues Tattoo",   hinweis: "Ein eigener Entwurf, von Grund auf" },
      { wert: "coverup",     label: "Cover-up",       hinweis: "Bestehendes überdecken oder einbinden" },
      { wert: "nachstechen", label: "Nachstechen",    hinweis: "Eine ältere Arbeit auffrischen" },
      { wert: "beratung",    label: "Erst beraten",   hinweis: "Ich möchte in Ruhe darüber sprechen" },
      { wert: "unsicher",    label: "Noch unsicher",  hinweis: "Die Idee ist noch nicht fertig" }
    ],
    stile: ["Fine Line", "Realismus", "Blackwork", "Abstrakt", "Lettering", "Noch offen"],
    farbe: [
      { wert: "black_grey", label: "Schwarz & Grau" },
      { wert: "color",      label: "Farbe" },
      { wert: "both",       label: "Beides" },
      { wert: "unsure",     label: "Weiß ich noch nicht" }
    ],
    budget: [
      { wert: "not_provided", label: "Sag ich lieber im Gespräch" },
      { wert: "under_200",    label: "bis 200 €" },
      { wert: "200_500",      label: "200 – 500 €" },
      { wert: "500_1000",     label: "500 – 1.000 €" },
      { wert: "1000_2500",    label: "1.000 – 2.500 €" },
      { wert: "over_2500",    label: "über 2.500 €" },
      { wert: "unsure",       label: "Keine Vorstellung" }
    ],
    kanal: [
      { wert: "email",     label: "E-Mail" },
      { wert: "whatsapp",  label: "WhatsApp" },
      { wert: "phone",     label: "Telefon" },
      { wert: "instagram", label: "Instagram" }
    ]
  },

  /* Rückfallebene, falls StudioLink nicht erreichbar ist */
  contactEmail: "masterofinkger@gmail.com"
};
