/* The Master of Ink — lightweight behaviour, no dependencies */
(function () {
  'use strict';

  var doc = document.documentElement;
  var DATA = window.MOI_DATA || { artists: [], categories: [], works: [], emptyNote: '' };
  var CONFIG = window.MOI_CONFIG || {};
  var mqVideo = window.matchMedia('(min-width: 900px)');
  var mqReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var conn = navigator.connection || {};
  doc.classList.add('js');

  /* ---------- Vorhang ----------
     Schwarz mit der „Krönung“ (animiertes Signet). Wer die Seite öffnet oder
     neu lädt, sieht sie in voller Länge – erst wenn Signet, Schrift und
     Goldpuls stehen, hebt sich der Vorhang langsam. Kommt man innerhalb der
     Seite zurück (Impressum, Zurück-Taste), steht das fertige Signet sofort.
     Regeln, die ihn harmlos halten: er wartet nie auf das Hero-Video (das lädt
     bewusst erst nach `load`), Tippen, Klicken, Scrollen oder eine Taste heben
     ihn sofort, ohne Animationsskript verhält er sich wie früher, und er geht
     spätestens nach 9 Sekunden auf — eine hängende Datei darf niemanden
     aussperren. */
  (function () {
    var curtain = document.getElementById('curtain');
    if (!curtain) return;
    var reveal = curtain.querySelector('moi-logo-reveal');
    var MINDESTDAUER = 620;   /* kurzes Aufblitzen wirkt wie ein Fehler */
    var NOTAUS = 9000;        /* vor der CSS-Rückfallebene bei 9,6 s */
    var SKIP = ['click', 'keydown', 'wheel', 'touchstart'];
    var start = Date.now();
    var gehoben = false, geladen = false, fertig = false, intro = true;
    var ce = window.customElements;

    /* innerhalb der Seite zurück: kein zweites Intro — neu laden zeigt es wieder */
    var nav = (performance.getEntriesByType && performance.getEntriesByType('navigation')[0]) || {};
    var intern = false;
    try {
      intern = nav.type !== 'reload' && !!document.referrer &&
        new URL(document.referrer).origin === window.location.origin;
    } catch (e) { intern = false; }
    if (nav.type === 'back_forward' || intern) intro = false;
    if (mqReduced.matches || !reveal || !ce) intro = false;

    function hebe() {
      if (gehoben) return;
      gehoben = true;
      SKIP.forEach(function (name) { window.removeEventListener(name, hebe, true); });
      var wartend = intro ? 0 : Math.max(0, MINDESTDAUER - (Date.now() - start));
      window.setTimeout(function () {
        curtain.classList.add('is-lifting');
        var weg = function () {
          curtain.classList.add('is-gone');
          if (reveal && reveal.pause) reveal.pause();
        };
        curtain.addEventListener('transitionend', weg, { once: true });
        window.setTimeout(weg, 1600);      /* falls transitionend ausbleibt */
      }, wartend);
    }

    function pruefe() {
      if (!geladen) return;
      /* async-Skripte laufen vor `load` — fehlt das Signet dann noch, kommt es nicht mehr */
      if (intro && ce && !ce.get('moi-logo-reveal')) intro = false;
      if (!intro || fertig) hebe();
    }

    /* in einem Hintergrund-Tab geöffnet: erst loslegen, wenn man hinsieht */
    function sichtbar(fn) {
      if (!document.hidden) { fn(); return; }
      document.addEventListener('visibilitychange', function warte() {
        if (document.hidden) return;
        document.removeEventListener('visibilitychange', warte);
        fn();
      });
    }

    if (intro) {
      ce.whenDefined('moi-logo-reveal').then(function () {
        reveal.addEventListener('settled', function () { fertig = true; pruefe(); }, { once: true });
        sichtbar(function () { reveal.play(); });
      });
      SKIP.forEach(function (name) { window.addEventListener(name, hebe, { capture: true, passive: true }); });
    } else if (reveal && ce) {
      ce.whenDefined('moi-logo-reveal').then(function () { reveal.seek(5.1); });   /* fertiges Signet */
    }

    if (document.readyState === 'complete') { geladen = true; pruefe(); }
    else window.addEventListener('load', function () { geladen = true; pruefe(); }, { once: true });
    sichtbar(function () { window.setTimeout(hebe, NOTAUS); });
  }());

  /* ---------- Schwebender Anfrage-Knopf ----------
     Erscheint, sobald der Hero aus dem Bild ist (dort gibt es eigene Knöpfe),
     und tritt zurück, solange die Anfrage selbst (#termin) oder der Fuß im
     Bild ist. Ohne IntersectionObserver steht er einfach da. */
  (function () {
    var cta = document.querySelector('.float-cta');
    if (!cta) return;
    var ziele = {
      hero: document.getElementById('start'),
      termin: document.getElementById('termin'),
      fuss: document.querySelector('.colophon')
    };
    var imBild = { hero: true, termin: false, fuss: false };
    /* Kontrast: über dunklen Flächen hell, über hellen dunkel — die Farbe
       darunter wird beim Scrollen gelesen, höchstens einmal pro Bild. */
    var raf = 0;
    function ton() {
      raf = 0;
      if (!cta.classList.contains('is-visible') || !document.elementsFromPoint) return;
      var r = cta.getBoundingClientRect();
      var stapel = document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      for (var i = 0; i < stapel.length; i++) {
        if (stapel[i] === cta || cta.contains(stapel[i])) continue;
        for (var el = stapel[i]; el && el !== document.documentElement; el = el.parentElement) {
          var m = getComputedStyle(el).backgroundColor.match(/[\d.]+/g);
          if (m && (m.length < 4 || +m[3] > 0.5)) {
            var hell = (0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2]) / 255 > 0.5;
            cta.classList.toggle('is-on-dark', !hell);
            return;
          }
        }
        return;
      }
    }
    function planeTon() { if (!raf) raf = requestAnimationFrame(ton); }
    window.addEventListener('scroll', planeTon, { passive: true });
    window.addEventListener('resize', planeTon);

    function zeige(an) {
      cta.classList.toggle('is-visible', an);
      cta.setAttribute('aria-hidden', String(!an));
      cta.tabIndex = an ? 0 : -1;
      if (an) planeTon();
    }
    if (!('IntersectionObserver' in window)) { zeige(true); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        Object.keys(ziele).forEach(function (k) { if (ziele[k] === entry.target) imBild[k] = entry.isIntersecting; });
      });
      zeige(!imBild.hero && !imBild.termin && !imBild.fuss);
    });
    Object.keys(ziele).forEach(function (k) {
      if (ziele[k]) io.observe(ziele[k]); else imBild[k] = false;
    });
    zeige(false);
  }());

  /* ---------- Studio-Bild: langsamer Zoom beim Scrollen ----------
     Skaliert das Foto von 1,00 auf 1,10, während der Abschnitt durch das
     Bild wandert — nur solange er sichtbar ist. Bei reduzierter Bewegung
     steht das Foto still. */
  (function () {
    var frame = document.querySelector('.still__frame');
    if (!frame || mqReduced.matches) return;
    var raf = 0, aktiv = true;
    function setze() {
      raf = 0;
      var r = frame.getBoundingClientRect(), h = window.innerHeight;
      var p = Math.min(1, Math.max(0, (h - r.top) / (h + r.height)));
      frame.style.setProperty('--still-zoom', (1 + 0.1 * p).toFixed(4));
    }
    function plane() { if (aktiv && !raf) raf = requestAnimationFrame(setze); }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { aktiv = e[e.length - 1].isIntersecting; plane(); }).observe(frame);
    }
    window.addEventListener('scroll', plane, { passive: true });
    window.addEventListener('resize', plane);
    setze();
  }());

  /* Mobile navigation */
  var menuButton = document.querySelector('.masthead__toggle');
  var menu = document.getElementById('main-menu');
  if (menuButton && menu) {
    menuButton.addEventListener('click', function () {
      var open = menuButton.getAttribute('aria-expanded') === 'true';
      menuButton.setAttribute('aria-expanded', String(!open));
      menuButton.textContent = open ? 'Menü' : 'Schließen';
      menu.classList.toggle('is-open', !open);
    });
    menu.addEventListener('click', function (event) {
      if (!event.target.closest('a')) return;
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.textContent = 'Menü';
      menu.classList.remove('is-open');
    });
  }

  /* Editorial reveals */
  var revealIO = null;
  function observeReveals(scope) {
    var nodes = (scope || document).querySelectorAll('.reveal:not(.is-in)');
    if (mqReduced.matches || !('IntersectionObserver' in window)) {
      nodes.forEach(function (node) { node.classList.add('is-in'); });
      return;
    }
    if (!revealIO) {
      revealIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          revealIO.unobserve(entry.target);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    }
    nodes.forEach(function (node) { revealIO.observe(node); });
  }

  /* Video: WebM first, MP4 fallback; never load for mobile, reduced motion or Save-Data. */
  /* Video läuft auf ALLEN Geräten — am Telefon nur mit der kleinen
     Fassung (rund ein Drittel der Datenmenge). Hart abgeschaltet wird es
     weiterhin bei „Bewegung reduzieren" und bei aktivem Datensparen; dann
     bleibt das Poster stehen. */
  function videoAllowed() {
    return !mqReduced.matches && !conn.saveData;
  }
  function loadSource(video) {
    if (video.dataset.loaded) return;
    video.dataset.loaded = '1';
    var klein = !mqVideo.matches;
    [
      { src: (klein && video.dataset.videoWebmMobil) || video.dataset.videoWebm, type: 'video/webm' },
      { src: (klein && video.dataset.videoMp4Mobil) || video.dataset.videoMp4, type: 'video/mp4' }
    ].forEach(function (candidate) {
      if (!candidate.src) return;
      var source = document.createElement('source');
      source.src = candidate.src;
      source.type = candidate.type;
      video.appendChild(source);
    });
    video.load();
  }
  function tryPlay(video) {
    var promise = video.play();
    if (promise && promise.catch) promise.catch(function () {});
  }
  var videos = Array.prototype.slice.call(document.querySelectorAll('video[data-video-webm], video[data-video-mp4]'));
  videos.forEach(function (video) {
    video.addEventListener('playing', function () { video.classList.add('is-playing'); });
    video.addEventListener('pause', function () { video.classList.remove('is-playing'); });
  });
  var playIO = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var video = entry.target;
      if (!videoAllowed()) { video.pause(); return; }
      if (entry.isIntersecting) { loadSource(video); tryPlay(video); }
      else video.pause();
    });
  }, { threshold: 0.2, rootMargin: '120px 0px' }) : null;
  function setupVideos() {
    videos.forEach(function (video) {
      if (!videoAllowed()) { video.pause(); video.classList.remove('is-playing'); return; }
      if (playIO) playIO.observe(video);
      else { loadSource(video); tryPlay(video); }
    });
  }
  /* Das Hero-Video liegt im sichtbaren Bereich und würde sofort mitladen —
     mehrere Megabyte, die mit Schrift, CSS und Poster um die Leitung
     konkurrieren. Das Poster steht ohnehin schon; der Film darf warten,
     bis der Rest der Seite geladen ist. */
  if (document.readyState === 'complete') setupVideos();
  else window.addEventListener('load', setupVideos, { once: true });
  (mqVideo.addEventListener ? mqVideo.addEventListener('change', setupVideos) : mqVideo.addListener(setupVideos));
  (mqReduced.addEventListener ? mqReduced.addEventListener('change', setupVideos) : mqReduced.addListener(setupVideos));

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }
  function imageSrcset(slot, widths, extension) {
    return widths.map(function (width) {
      return 'assets/img/' + slot + '-' + width + '.' + extension + ' ' + width + 'w';
    }).join(', ');
  }
  function buildPicture(image, sizes) {
    var picture = document.createElement('picture');
    var source = document.createElement('source');
    var img = document.createElement('img');
    source.type = 'image/webp';
    source.srcset = imageSrcset(image.slot, image.widths, 'webp');
    source.sizes = sizes;
    img.src = 'assets/img/' + image.slot + '-' + image.widths[Math.min(1, image.widths.length - 1)] + '.jpg';
    img.srcset = imageSrcset(image.slot, image.widths, 'jpg');
    img.sizes = sizes;
    img.alt = image.alt || '';
    img.loading = 'lazy';
    img.decoding = 'async';
    if (image.position) img.style.objectPosition = image.position;
    picture.appendChild(source);
    picture.appendChild(img);
    return picture;
  }

  /* Data-driven artist directory: adding another artist requires data only. */
  var directory = document.getElementById('artist-directory');

  /* Hat dieser Künstler überhaupt etwas zu zeigen? Ein Eintrag ohne Bild
     (slot leer) zählt nicht — sonst führte "Portfolio ansehen" in eine
     leere Galerie. Der Link erscheint von selbst, sobald Bilder da sind. */
  function hatArbeiten(artistId) {
    return (DATA.works || []).some(function (work) {
      return work.slot && work.featured !== false && work.artistId === artistId;
    });
  }

  function renderArtists() {
    if (!directory || !DATA.artists) return;
    Array.prototype.slice.call(directory.children).forEach(function (child) {
      if (child.tagName !== 'NOSCRIPT') directory.removeChild(child);
    });
    DATA.artists.forEach(function (artist) {
      var card = el('article', 'artist-card');
      card.id = 'artist-' + artist.id;
      card.setAttribute('aria-labelledby', 'artist-name-' + artist.id);

      var portrait = el('figure', 'artist-card__portrait reveal reveal--wipe');
      portrait.setAttribute('data-wipe', 'up');
      portrait.appendChild(buildPicture(artist.portrait, '(min-width: 781px) 58vw, 100vw'));

      var content = el('div', 'artist-card__content reveal reveal--soak');
      var top = el('div', 'artist-card__top');
      top.appendChild(el('p', '', artist.role));
      content.appendChild(top);
      var name = el('h3', 'artist-card__name', artist.name);
      name.id = 'artist-name-' + artist.id;
      content.appendChild(name);
      content.appendChild(el('p', 'artist-card__styles', artist.specialties.join(' · ')));

      var bio = el('div', 'artist-card__bio');
      bio.appendChild(el('p', '', artist.bio));
      if (artist.quote) bio.appendChild(el('blockquote', 'artist-card__quote', '„' + artist.quote + '“'));
      var links = el('div', 'artist-card__links');
      if (hatArbeiten(artist.id)) {
        var portfolio = el('a', '', 'Portfolio ansehen ↓');
        portfolio.href = '#arbeiten';
        portfolio.setAttribute('data-artist-portfolio', artist.id);
        links.appendChild(portfolio);
      }
      if (artist.instagram) {
        var instagram = el('a', '', artist.instagramLabel + ' ↗');
        instagram.setAttribute('aria-label', 'Instagram ' + artist.instagramLabel);
        instagram.href = artist.instagram;
        instagram.rel = 'noopener';
        links.appendChild(instagram);
      }
      bio.appendChild(links);
      content.appendChild(bio);
      card.appendChild(portrait);
      card.appendChild(content);
      directory.appendChild(card);
    });
    observeReveals(directory);
    fitNames();
  }

  /* Der Name füllt seine Spalte aus, statt sie zu sprengen: die
     Display-Größe kann nicht für alle Namenslängen gleich sein
     ("Bryan" passt, "Sebastian" ist fast doppelt so breit). */
  function fitNames() {
    var names = directory ? directory.querySelectorAll('.artist-card__name') : [];
    if (!names.length) return;
    var target = Infinity;
    Array.prototype.forEach.call(names, function (node) {
      node.style.fontSize = '';
      node.style.whiteSpace = '';
      var cap = parseFloat(window.getComputedStyle(node).fontSize);
      var avail = node.clientWidth;
      if (!cap || !avail) return;
      /* scrollWidth taugt hier nicht — bei Blockelementen ist es nie
         kleiner als die Box. Die echte Textbreite liefert nur ein Range. */
      node.style.whiteSpace = 'nowrap';
      node.style.fontSize = '100px';
      var range = document.createRange();
      range.selectNodeContents(node);
      var needed = range.getBoundingClientRect().width;
      node.style.fontSize = '';
      node.style.whiteSpace = '';
      if (!needed) return;
      target = Math.min(target, Math.floor(avail / needed * 100), cap);
    });
    if (!isFinite(target)) return;
    /* Ein gemeinsamer Grad für alle Namen — zwei verschiedene Größen
       nebeneinander lesen sich wie ein Fehler, nicht wie ein System. */
    Array.prototype.forEach.call(names, function (node) {
      node.style.fontSize = target + 'px';
    });
  }
  window.addEventListener('resize', fitNames);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitNames);

  /* Restrained, data-driven portfolio */
  var gallery = document.getElementById('gallery');
  var filterWrap = document.querySelector('.gallery__filters');
  var activeFilter = 'all';
  var activeArtist = 'all';
  var portfolioArtistLabel = document.getElementById('portfolio-artist-label');
  /* ---------- Geteilte Bühne ----------
     Eine klebende Fläche trägt das ganze Kapitel: erst das Video zum
     Prozess, dann die Arbeiten. Was daneben vorbeiscrollt, bestimmt was
     sie zeigt. Das füllt die Spalte, die neben Schritt II und III leer
     stand, und spart den kompletten zweiten Abschnitt. */
  var stage = document.getElementById('stage');
  var stageCaption = document.getElementById('stage-caption');
  var stageIO = null;

  function buildStageSlot(work) {
    var slot = el('div', 'stage__slot');
    slot.setAttribute('data-stage-slot', work.id);
    slot.appendChild(buildPicture(work, '(min-width: 900px) 46vw, 100vw'));
    var img = slot.querySelector('img');
    if (img) img.loading = 'lazy';
    return slot;
  }

  function zeigeBuehne(name, caption) {
    if (!stage) return;
    var slots = stage.querySelectorAll('.stage__slot');
    var getroffen = false;
    Array.prototype.forEach.call(slots, function (slot) {
      var aktiv = slot.getAttribute('data-stage-slot') === name;
      slot.classList.toggle('is-active', aktiv);
      if (aktiv) getroffen = true;
    });
    /* Kein passender Ausschnitt (etwa nach einem Filter) — beim Video
       bleiben, statt eine leere Fläche zu zeigen. */
    if (!getroffen && slots.length) slots[0].classList.add('is-active');
    if (stageCaption && caption != null) stageCaption.textContent = caption;
  }

  function beobachteBuehne() {
    if (!stage) return;
    var bloecke = document.querySelectorAll('[data-stage]');
    if (!bloecke.length) return;
    if (mqReduced.matches || !('IntersectionObserver' in window)) return;
    if (stageIO) stageIO.disconnect();

    /* Der Beobachter meldet nur ÄNDERUNGEN. Wer gerade im Band steht,
       muss deshalb mitgeführt werden — sonst entschiede eine Meldung
       über einen Block, der längst nicht mehr der richtige ist. */
    var imBand = [];
    function waehle() {
      if (!imBand.length) return;
      /* Der Block gewinnt, dessen Mitte der Bildschirmmitte am nächsten
         liegt. „Der oberste sichtbare" wäre falsch: die Schritte sind
         hoch, ein fast durchgelaufener ragt noch ins Band und würde den
         gerade gelesenen verdrängen — die Bühne hinkte hinterher. */
      var mitte = window.innerHeight / 2;
      var beste = null, bester = Infinity;
      imBand.forEach(function (node) {
        var r = node.getBoundingClientRect();
        var d = Math.abs(r.top + r.height / 2 - mitte);
        if (d < bester) { bester = d; beste = node; }
      });
      if (beste) zeigeBuehne(beste.getAttribute('data-stage'), beste.getAttribute('data-stage-caption'));
    }

    stageIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var i = imBand.indexOf(e.target);
        if (e.isIntersecting) { if (i === -1) imBand.push(e.target); }
        else if (i !== -1) imBand.splice(i, 1);
      });
      waehle();
    }, { rootMargin: '-40% 0px -40% 0px', threshold: 0 });
    Array.prototype.forEach.call(bloecke, function (b) { stageIO.observe(b); });
  }

  function buildWorkBlock(work, index, total) {
    var block = el('article', 'worklane__item reveal reveal--soak');
    block.setAttribute('data-stage', work.id);
    block.setAttribute('data-stage-caption', [work.title, work.meta].filter(Boolean).join(' — '));
    block.appendChild(el('p', 'worklane__index',
      ('0' + (index + 1)).slice(-2) + ' / ' + ('0' + total).slice(-2)));
    block.appendChild(el('h3', 'worklane__title', work.title || ''));
    if (work.meta) block.appendChild(el('p', 'worklane__motif', work.meta));
    if (work.caption) block.appendChild(el('p', 'worklane__text', work.caption));
    return block;
  }

  function renderGallery() {
    if (!gallery) return;
    Array.prototype.slice.call(gallery.children).forEach(function (child) {
      if (child.tagName !== 'NOSCRIPT') gallery.removeChild(child);
    });
    if (stage) {
      Array.prototype.slice.call(stage.querySelectorAll('.stage__slot')).forEach(function (slot) {
        /* Feste Ausschnitte (Video, Schablone) gehören zum Ablauf und
           bleiben stehen — nur die Werke werden neu aufgebaut. */
        if (!slot.hasAttribute('data-stage-fest')) stage.removeChild(slot);
      });
    }
    var works = (DATA.works || []).filter(function (work) {
      var artistMatch = activeArtist === 'all' || work.artistId === activeArtist;
      var categories = work.categories || [work.category];
      return work.slot && work.featured !== false && artistMatch &&
        (activeFilter === 'all' || categories.indexOf(activeFilter) !== -1);
    });
    if (portfolioArtistLabel) {
      var artist = (DATA.artists || []).find(function (item) { return item.id === activeArtist; });
      portfolioArtistLabel.textContent = artist ? artist.name : 'Studio';
    }
    if (!works.length) {
      gallery.appendChild(el('p', 'gallery__empty', DATA.emptyNote || 'Keine Arbeiten in dieser Auswahl.'));
      /* Ohne Werke gibt es nichts zu beobachten — sonst bliebe die Bühne
         schwarz, weil kein Ausschnitt mehr aktiv ist. */
      zeigeBuehne('video', 'Präzision ist kein Stilmittel. Sie ist die Grundlage.');
    } else {
      works.forEach(function (work, i) {
        if (stage) stage.appendChild(buildStageSlot(work));
        gallery.appendChild(buildWorkBlock(work, i, works.length));
      });
    }
    observeReveals(gallery);
    beobachteBuehne();
    /* Nach einem Filterwechsel steht die Bühne wieder am Anfang. */
    if (works.length) zeigeBuehne('video', 'Präzision ist kein Stilmittel. Sie ist die Grundlage.');
  }

  function renderFilters() {
    if (!filterWrap) return;
    var categories = [{ id: 'all', label: 'Auswahl' }].concat(DATA.categories || []);
    categories.forEach(function (category) {
      var button = el('button', 'filter-btn', category.label);
      button.type = 'button';
      button.setAttribute('data-filter', category.id);
      button.setAttribute('aria-pressed', String(category.id === activeFilter));
      button.addEventListener('click', function () {
        if (activeFilter === category.id) return;
        activeFilter = category.id;
        filterWrap.querySelectorAll('.filter-btn').forEach(function (item) {
          item.setAttribute('aria-pressed', String(item.getAttribute('data-filter') === activeFilter));
        });
        gallery.classList.add('is-switching');
        window.setTimeout(function () {
          renderGallery();
          gallery.classList.remove('is-switching');
        }, mqReduced.matches ? 0 : 180);
      });
      filterWrap.appendChild(button);
    });
  }

  renderArtists();
  if (directory) {
    directory.addEventListener('click', function (event) {
      var link = event.target.closest('[data-artist-portfolio]');
      if (!link) return;
      activeArtist = link.getAttribute('data-artist-portfolio');
      activeFilter = 'all';
      if (filterWrap) filterWrap.querySelectorAll('.filter-btn').forEach(function (button) {
        button.setAttribute('aria-pressed', String(button.getAttribute('data-filter') === 'all'));
      });
      renderGallery();
    });
  }
  renderFilters();
  renderGallery();
  observeReveals(document);

  /* ---------- Ablauf: Achse wächst beim Scrollen mit ----------
     Die Linie zeichnet den Fortschritt zwischen erstem und letztem
     Schritt nach — die Bewegung kommt aus dem Scrollen, nicht aus
     einer Schleife, die ohnehin läuft. */
  var journey = document.querySelector('.process-journey__steps');
  if (journey && !mqReduced.matches) {
    var journeyRaf = null;
    var updateJourney = function () {
      if (journeyRaf) return;
      journeyRaf = requestAnimationFrame(function () {
        journeyRaf = null;
        var box = journey.getBoundingClientRect();
        var anchor = window.innerHeight * 0.62;
        var progress = (anchor - box.top) / (box.height || 1);
        progress = Math.max(0, Math.min(1, progress));
        journey.style.setProperty('--journey-progress', (progress * 100).toFixed(2) + '%');
      });
    };
    window.addEventListener('scroll', updateJourney, { passive: true });
    window.addEventListener('resize', updateJourney);
    updateJourney();
  }

  /* ---------- Offizielles StudioLink-Formular ----------
     Ist `appUrl` gesetzt, zeigt der Termin-Abschnitt StudioLinks eigene
     /anfrage-Maske. Das ist dieselbe Oberfläche wie in StudioLink selbst
     — Artist- und Standortwahl, Bild-Upload, zweistufiger Ablauf — und
     sie bleibt automatisch aktuell, ohne dass hier etwas nachgezogen
     werden muss. Das schlanke Formular darunter ist nur die Rückfallebene. */
  var embed = document.querySelector('.booking__embed');
  var studiolinkApp = (CONFIG.studiolink || {}).appUrl;
  if (embed && studiolinkApp) {
    var wantedStudio = (CONFIG.studiolink || {}).studioId || '';
    /* Studio, Einbettungsmodus und Farbklima mitgeben — sonst zeigt die
       Maske ihren eigenen Kopf und legt unter dem Standard-Studio ab. */
    var formUrl = studiolinkApp.replace(/\/$/, '') + '/anfrage'
      + '?studio=' + encodeURIComponent(wantedStudio)
      + '&embed=1&bg=080808&accent=c7c7c7';
    var frame = embed.querySelector('.booking__frame');
    var openLink = embed.querySelector('.booking__embed-link');
    var fallbackForm = document.getElementById('anfrage');
    var origin = (function () {
      var a = document.createElement('a');
      a.href = studiolinkApp;
      return a.protocol + '//' + a.host;
    })();

    /* Ob die eingebettete Maske den `studio`-Parameter überhaupt
       auswertet, ist von hier aus nicht erkennbar — eine ältere Fassung
       ignoriert ihn und legt unter ihrem Standard-Studio ab. Deshalb
       zählt nur ihre eigene Rückmeldung: bleibt sie aus oder nennt sie
       ein anderes Studio, bleibt das Formular dieser Seite stehen. */
    var confirmed = false;
    var onMessage = function (event) {
      if (event.origin !== origin) return;
      var msg = event.data || {};
      if (msg.source !== 'studiolink' || msg.type !== 'embed-ready') return;
      if (msg.studioId !== wantedStudio) return;
      confirmed = true;
      window.removeEventListener('message', onMessage);
      embed.hidden = false;
      if (fallbackForm) fallbackForm.hidden = true;
      var bookingGrid = embed.closest('.booking__grid');
      if (bookingGrid) bookingGrid.classList.add('booking__grid--embedded');
    };
    window.addEventListener('message', onMessage);

    if (openLink) openLink.href = formUrl;

    /* Die Maske ist eine eigene Anwendung — sie beim Seitenaufruf zu laden
       kostet alle Besucher Bandbreite, auch die, die nie bis zum Formular
       scrollen. Sie wird geholt, sobald der Abschnitt in Reichweite kommt;
       der Handschlag läuft dann immer noch, bevor jemand ankommt. */
    var starteEinbettung = function () {
      if (!frame || frame.src) return;
      frame.src = formUrl;
      window.setTimeout(pruefeHandschlag, 6000);
    };
    var abschnitt = embed.closest('section') || embed;
    if ('IntersectionObserver' in window) {
      var ladeIO = new IntersectionObserver(function (entries) {
        if (!entries.some(function (e) { return e.isIntersecting; })) return;
        ladeIO.disconnect();
        starteEinbettung();
      }, { rootMargin: '700px 0px' });
      ladeIO.observe(abschnitt);
    } else {
      starteEinbettung();
    }

    function pruefeHandschlag() {
      if (confirmed) return;
      window.removeEventListener('message', onMessage);
      if (frame) frame.removeAttribute('src');
      if (window.console && console.warn) {
        console.warn('[anfrage] StudioLink hat sich nicht als "' + wantedStudio +
          '" gemeldet — es bleibt beim Formular dieser Seite.');
      }
    }
  }

  /* ---------- Ablauf: Achse wächst beim Scrollen mit ----------
     Die Linie zeichnet den Fortschritt zwischen erstem und letztem
     Schritt nach — die Bewegung kommt aus dem Scrollen, nicht aus
     einer Schleife, die ohnehin läuft. */
  var journey = document.querySelector('.process-journey__steps');
  if (journey && !mqReduced.matches) {
    var journeyRaf = null;
    var updateJourney = function () {
      if (journeyRaf) return;
      journeyRaf = requestAnimationFrame(function () {
        journeyRaf = null;
        var box = journey.getBoundingClientRect();
        var anchor = window.innerHeight * 0.62;
        var progress = (anchor - box.top) / (box.height || 1);
        progress = Math.max(0, Math.min(1, progress));
        journey.style.setProperty('--journey-progress', (progress * 100).toFixed(2) + '%');
      });
    };
    window.addEventListener('scroll', updateJourney, { passive: true });
    window.addEventListener('resize', updateJourney);
    updateJourney();
  }


  /* ---------- Anfrage-Wizard → StudioLink ----------
     Ruft dieselbe Funktion wie StudioLinks eigene /anfrage-Seite:
     inkcore.public_create_lead(p_payload jsonb) returns text.
     Rückgabe ist ein Ergänzungs-Token (14 Tage gültig).

     Der Wizard führt in vier ruhigen Schritten durch die Anfrage. Alle
     Auswahlmöglichkeiten stehen als Daten in MOI_CONFIG.wizard; hier
     steht nur, wie sie zusammengesetzt und geprüft werden. */
  var wizardRoot = document.getElementById('wizard');
  if (wizardRoot) {
    var SL       = CONFIG.studiolink || {};
    var W        = CONFIG.wizard || {};
    var MIN_FILL_SECONDS = 3;          /* wie in StudioLinks LeadIntakeForm */
    var geoeffnetUm = Date.now();

    /* Gesammelte Antworten. Nichts wird verschickt, bevor der letzte
       Schritt bestätigt ist. */
    var antwort = {
      art: '', motiv: '', stelle: '', groesse: '',
      stile: [], farbe: '', budget: '',
      artist: '', kanal: 'email',
      vorname: '', nachname: '', email: '', telefon: '', instagram: '',
      einwilligung: false, falle: ''
    };

    var artists = (DATA.artists || []).map(function (a) {
      return { id: a.id, name: a.name, role: a.role, slId: a.studiolinkId || '' };
    });

    function feld(tag, klasse, text) { return el(tag, klasse, text); }

    /* --- Bausteine ------------------------------------------------- */

    function chipGruppe(optionen, mehrfach, gewaehlt, beiWahl) {
      var box = el('div', 'wizard__chips');
      box.setAttribute('role', mehrfach ? 'group' : 'radiogroup');
      optionen.forEach(function (opt) {
        var wert  = opt.wert !== undefined ? opt.wert : opt;
        var label = opt.label !== undefined ? opt.label : opt;
        var chip = el('button', 'wizard__chip');
        chip.type = 'button';
        chip.setAttribute('role', mehrfach ? 'checkbox' : 'radio');
        var an = mehrfach ? gewaehlt.indexOf(wert) !== -1 : gewaehlt === wert;
        chip.setAttribute(mehrfach ? 'aria-checked' : 'aria-checked', String(an));
        chip.classList.toggle('is-on', an);
        chip.appendChild(el('span', 'wizard__chip-label', label));
        if (opt.hinweis) chip.appendChild(el('span', 'wizard__chip-hint', opt.hinweis));
        chip.addEventListener('click', function () { beiWahl(wert); });
        box.appendChild(chip);
      });
      return box;
    }

    function textFeld(label, wert, beiEingabe, opt) {
      opt = opt || {};
      var wrap = el('label', 'field');
      var kopf = el('span', 'field__label', label);
      if (opt.optional) kopf.appendChild(el('span', 'field__hint', ' optional'));
      wrap.appendChild(kopf);
      var input = el(opt.mehrzeilig ? 'textarea' : 'input', 'field__input');
      if (opt.mehrzeilig) { input.rows = opt.rows || 3; }
      else { input.type = opt.type || 'text'; }
      if (opt.autocomplete) input.autocomplete = opt.autocomplete;
      if (opt.platzhalter) input.placeholder = opt.platzhalter;
      if (opt.inputmode) input.inputMode = opt.inputmode;
      input.value = wert || '';
      input.addEventListener('input', function () { beiEingabe(input.value); });
      wrap.appendChild(input);
      return wrap;
    }

    /* --- Die Schritte ---------------------------------------------- */

    var schritte = [
      {
        titel: 'Was hast du vor?',
        unter: 'Eine Richtung genügt — der Rest klärt sich im Gespräch.',
        bauen: function (ziel, neuZeichnen) {
          ziel.appendChild(chipGruppe(W.art || [], false, antwort.art, function (v) {
            antwort.art = v; neuZeichnen();
          }));
        },
        pruefen: function () {
          return antwort.art ? '' : 'Wähl bitte aus, worum es geht.';
        }
      },
      {
        titel: 'Dein Motiv.',
        unter: 'So viel oder so wenig, wie du schon weißt.',
        bauen: function (ziel) {
          ziel.appendChild(textFeld('Motiv / Idee', antwort.motiv, function (v) { antwort.motiv = v; },
            { mehrzeilig: true, rows: 3, platzhalter: 'Was soll es zeigen — und warum?' }));
          var reihe = el('div', 'wizard__row');
          reihe.appendChild(textFeld('Körperstelle', antwort.stelle, function (v) { antwort.stelle = v; },
            { optional: true, platzhalter: 'z. B. Unterarm' }));
          reihe.appendChild(textFeld('Größe', antwort.groesse, function (v) { antwort.groesse = v; },
            { optional: true, platzhalter: 'z. B. 15 cm' }));
          ziel.appendChild(reihe);
        },
        pruefen: function () {
          if (antwort.art === 'beratung' || antwort.art === 'unsicher') return '';
          return antwort.motiv.trim() ? '' : 'Beschreib kurz, worum es geht — ein Satz reicht.';
        }
      },
      {
        titel: 'Stil, Farbe, Artist.',
        unter: 'Noch offen? Dann lass es offen.',
        bauen: function (ziel, neuZeichnen) {
          ziel.appendChild(el('p', 'wizard__legend', 'Stilrichtung'));
          ziel.appendChild(chipGruppe(W.stile || [], true, antwort.stile, function (v) {
            var i = antwort.stile.indexOf(v);
            if (i === -1) antwort.stile.push(v); else antwort.stile.splice(i, 1);
            neuZeichnen();
          }));
          ziel.appendChild(el('p', 'wizard__legend', 'Farbe'));
          ziel.appendChild(chipGruppe(W.farbe || [], false, antwort.farbe, function (v) {
            antwort.farbe = v; neuZeichnen();
          }));
          if (artists.length) {
            ziel.appendChild(el('p', 'wizard__legend', 'Artist'));
            var wahl = artists.map(function (a) {
              return { wert: a.id, label: a.name, hinweis: a.role };
            });
            wahl.push({ wert: 'egal', label: 'Empfehlt mir jemanden', hinweis: 'Ihr kennt eure Handschriften' });
            ziel.appendChild(chipGruppe(wahl, false, antwort.artist, function (v) {
              antwort.artist = v; neuZeichnen();
            }));
          }
          ziel.appendChild(el('p', 'wizard__legend', 'Budgetrahmen'));
          ziel.appendChild(chipGruppe(W.budget || [], false, antwort.budget, function (v) {
            antwort.budget = v; neuZeichnen();
          }));
        },
        pruefen: function () { return ''; }
      },
      {
        titel: 'Wie erreichen wir dich?',
        unter: 'Wir melden uns persönlich — innerhalb von drei Werktagen.',
        bauen: function (ziel, neuZeichnen) {
          var reihe = el('div', 'wizard__row');
          reihe.appendChild(textFeld('Vorname', antwort.vorname, function (v) { antwort.vorname = v; },
            { autocomplete: 'given-name' }));
          reihe.appendChild(textFeld('Nachname', antwort.nachname, function (v) { antwort.nachname = v; },
            { optional: true, autocomplete: 'family-name' }));
          ziel.appendChild(reihe);
          ziel.appendChild(textFeld('E-Mail', antwort.email, function (v) { antwort.email = v; },
            { type: 'email', autocomplete: 'email' }));

          ziel.appendChild(el('p', 'wizard__legend', 'Am liebsten erreichbar über'));
          ziel.appendChild(chipGruppe(W.kanal || [], false, antwort.kanal, function (v) {
            antwort.kanal = v; neuZeichnen();
          }));

          var brauchtTelefon   = antwort.kanal === 'whatsapp' || antwort.kanal === 'phone' || antwort.kanal === 'sms';
          var brauchtInstagram = antwort.kanal === 'instagram';
          ziel.appendChild(textFeld('Telefon', antwort.telefon, function (v) { antwort.telefon = v; },
            { optional: !brauchtTelefon, type: 'tel', autocomplete: 'tel', inputmode: 'tel' }));
          if (brauchtInstagram) {
            ziel.appendChild(textFeld('Instagram', antwort.instagram, function (v) { antwort.instagram = v; },
              { platzhalter: '@deinname' }));
          }

          var check = el('label', 'field field--check');
          var box = el('input', 'field__check');
          box.type = 'checkbox';
          box.checked = antwort.einwilligung;
          box.addEventListener('change', function () { antwort.einwilligung = box.checked; });
          check.appendChild(box);
          check.appendChild(el('span', '', 'Ich bin damit einverstanden, zu meiner Anfrage kontaktiert zu werden. Die Angaben werden ausschließlich dafür verwendet.'));
          ziel.appendChild(check);

          /* Honigtopf — für Menschen unsichtbar, für Automaten verlockend. */
          var falle = el('label', 'field field--hp');
          falle.setAttribute('aria-hidden', 'true');
          falle.appendChild(el('span', 'field__label', 'Firma'));
          var fInput = el('input', 'field__input');
          fInput.type = 'text'; fInput.tabIndex = -1; fInput.autocomplete = 'off';
          fInput.addEventListener('input', function () { antwort.falle = fInput.value; });
          falle.appendChild(fInput);
          ziel.appendChild(falle);
        },
        pruefen: function () {
          if (!antwort.vorname.trim()) return 'Bitte sag uns, wie du heißt.';
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(antwort.email.trim()))
            return 'Bitte prüf die E-Mail-Adresse.';
          var ziffern = antwort.telefon.replace(/[^0-9]/g, '');
          if (antwort.telefon.trim() && (ziffern.length < 6 || ziffern.length > 15))
            return 'Die Telefonnummer sieht nicht vollständig aus.';
          if ((antwort.kanal === 'whatsapp' || antwort.kanal === 'phone') && !antwort.telefon.trim())
            return 'Für diesen Weg brauchen wir deine Telefonnummer.';
          if (antwort.kanal === 'instagram' && !antwort.instagram.trim())
            return 'Für diesen Weg brauchen wir deinen Instagram-Namen.';
          if (!antwort.einwilligung)
            return 'Bitte bestätige, dass wir dich zu deiner Anfrage kontaktieren dürfen.';
          return '';
        }
      }
    ];

    var aktuell = 0;
    var laeuft = false;

    /* --- Zeichnen --------------------------------------------------- */

    function zeichne() {
      wizardRoot.textContent = '';

      var kopf = el('div', 'wizard__head');
      var marke = el('p', 'wizard__mark');
      marke.appendChild(el('span', 'wizard__mark-dot'));
      marke.appendChild(document.createTextNode('StudioLink Anfrage'));
      kopf.appendChild(marke);
      kopf.appendChild(el('p', 'wizard__count',
        ('0' + (aktuell + 1)).slice(-2) + ' / ' + ('0' + schritte.length).slice(-2)));
      wizardRoot.appendChild(kopf);

      var bahn = el('div', 'wizard__progress');
      bahn.setAttribute('role', 'progressbar');
      bahn.setAttribute('aria-valuemin', '1');
      bahn.setAttribute('aria-valuemax', String(schritte.length));
      bahn.setAttribute('aria-valuenow', String(aktuell + 1));
      var balken = el('span', 'wizard__progress-bar');
      balken.style.width = ((aktuell + 1) / schritte.length * 100) + '%';
      bahn.appendChild(balken);
      wizardRoot.appendChild(bahn);

      var s = schritte[aktuell];
      var buehne = el('div', 'wizard__step');
      buehne.appendChild(el('h3', 'wizard__title', s.titel));
      if (s.unter) buehne.appendChild(el('p', 'wizard__sub', s.unter));
      var koerper = el('div', 'wizard__body');
      s.bauen(koerper, zeichne);
      buehne.appendChild(koerper);
      wizardRoot.appendChild(buehne);

      var fehler = el('p', 'wizard__error');
      fehler.setAttribute('role', 'alert');
      fehler.hidden = true;
      wizardRoot.appendChild(fehler);

      var fuss = el('div', 'wizard__foot');
      if (aktuell > 0) {
        var zurueck = el('button', 'btn btn--text wizard__back', '↑ Zurück');
        zurueck.type = 'button';
        zurueck.addEventListener('click', function () { aktuell--; zeichne(); });
        fuss.appendChild(zurueck);
      }
      var letzter = aktuell === schritte.length - 1;
      var weiter = el('button', 'btn btn--primary wizard__next');
      weiter.type = 'button';
      weiter.appendChild(document.createTextNode(letzter ? 'Anfrage senden ' : 'Weiter '));
      var pfeil = el('span', '', letzter ? '↗' : '→');
      pfeil.setAttribute('aria-hidden', 'true');
      weiter.appendChild(pfeil);
      weiter.addEventListener('click', function () {
        if (laeuft) return;
        var meldung = s.pruefen();
        if (meldung) {
          fehler.textContent = meldung;
          fehler.hidden = false;
          var erstes = koerper.querySelector('input, textarea, .wizard__chip');
          if (erstes) erstes.focus();
          return;
        }
        fehler.hidden = true;
        if (!letzter) { aktuell++; zeichne(); return; }
        senden(weiter, fehler);
      });
      fuss.appendChild(weiter);
      wizardRoot.appendChild(fuss);

      /* Beim Schrittwechsel den neuen Titel ansagen, ohne zu springen. */
      buehne.setAttribute('tabindex', '-1');
      if (aktuell > 0 || laeuft) buehne.focus({ preventScroll: true });
    }

    /* --- Absenden --------------------------------------------------- */

    function gewaehlterArtist() {
      if (!antwort.artist || antwort.artist === 'egal') return null;
      return artists.filter(function (a) { return a.id === antwort.artist; })[0] || null;
    }

    function nachricht() {
      /* Alles, wofür StudioLink kein eigenes Feld hat, landet lesbar im
         Anfragetext — damit im Posteingang nichts fehlt. */
      var zeilen = [];
      if (antwort.motiv.trim()) zeilen.push(antwort.motiv.trim());
      var a = gewaehlterArtist();
      if (a && !a.slId) zeilen.push('Wunsch-Artist: ' + a.name);
      if (antwort.artist === 'egal') zeilen.push('Artist: Empfehlung erwünscht');
      if (antwort.instagram.trim()) zeilen.push('Instagram: ' + antwort.instagram.trim());
      return zeilen.join('\n\n') || null;
    }

    function vollstaendigkeit() {
      var felder = [antwort.art, antwort.motiv, antwort.stelle, antwort.groesse,
                    antwort.farbe, antwort.budget, antwort.artist, antwort.telefon];
      var gefuellt = felder.filter(function (f) { return String(f || '').trim(); }).length;
      return Math.round(gefuellt / felder.length * 100);
    }

    function fehlendes() {
      var fehlt = [];
      if (!antwort.stelle.trim())  fehlt.push('body_part');
      if (!antwort.groesse.trim()) fehlt.push('size_estimate');
      if (!antwort.farbe)          fehlt.push('color_preference');
      if (!antwort.budget)         fehlt.push('budget_range');
      return fehlt.length ? fehlt : null;
    }

    function anStudioLink(payload) {
      return fetch(SL.url.replace(/\/$/, '') + '/rest/v1/rpc/public_create_lead', {
        method: 'POST',
        headers: {
          'apikey': SL.key,
          'Authorization': 'Bearer ' + SL.key,
          'Content-Type': 'application/json',
          'Content-Profile': SL.schema,
          'Accept-Profile': SL.schema
        },
        body: JSON.stringify({ p_payload: payload })
      }).then(function (antw) {
        if (!antw.ok) {
          return antw.text().then(function (text) {
            throw new Error('StudioLink ' + antw.status + ': ' + text.slice(0, 200));
          });
        }
        return antw.json();
      });
    }

    function senden(knopf, fehler) {
      /* Automat: still quittieren, statt zu verraten, woran es lag. */
      var zuSchnell = (Date.now() - geoeffnetUm) / 1000 < MIN_FILL_SECONDS;
      if (antwort.falle.trim() !== '' || zuSchnell) { fertig(null); return; }

      if (!SL.url || !SL.key || !SL.studioId) {
        fehler.textContent = 'Das Anfrageformular ist noch nicht verbunden. Schreib uns direkt: ' + (CONFIG.contactEmail || '');
        fehler.hidden = false;
        return;
      }

      laeuft = true;
      knopf.disabled = true;
      knopf.setAttribute('aria-busy', 'true');

      var a = gewaehlterArtist();
      anStudioLink({
        studio_id: SL.studioId,
        source: 'web',
        source_detail: 'website_wizard',
        source_page: 'website',
        source_section: 'termin',
        form_type: 'detailed',

        first_name: antwort.vorname.trim(),
        last_name: antwort.nachname.trim() || null,
        contact_email: antwort.email.trim(),
        contact_phone: antwort.telefon.trim() || null,
        instagram_handle: antwort.instagram.trim() || null,
        preferred_contact_channel: antwort.kanal || 'email',

        inquiry_type: antwort.art || null,
        motif: antwort.motiv.trim() || null,
        body_part: antwort.stelle.trim() || null,
        size_estimate: antwort.groesse.trim() || null,
        style_tags: antwort.stile,
        color_preference: antwort.farbe || null,
        budget_range: antwort.budget || null,
        message: nachricht(),

        /* Nur eine echte Profil-ID zählt; ohne sie steht der Wunsch im Text. */
        preferred_artist_id: a && a.slId ? a.slId : null,
        artist_preference_type: !antwort.artist ? null
          : antwort.artist === 'egal' ? 'recommend' : 'specific',

        completeness_score: vollstaendigkeit(),
        missing_information: fehlendes(),

        consent_to_contact: true,
        consent_timestamp: new Date().toISOString(),
        privacy_policy_version: SL.privacyPolicyVersion || null
      }).then(function (token) {
        fertig(typeof token === 'string' ? token : null);
      }).catch(function (fehlerObj) {
        if (window.console && console.error) console.error('[anfrage] StudioLink', fehlerObj);
        laeuft = false;
        knopf.disabled = false;
        knopf.removeAttribute('aria-busy');
        fehler.textContent = 'Die Anfrage kam nicht durch. Bitte versuch es gleich noch einmal — oder schreib uns direkt: ' + (CONFIG.contactEmail || '');
        fehler.hidden = false;
      });
    }

    function fertig(token) {
      wizardRoot.textContent = '';
      var box = el('div', 'wizard__done');
      var marke = el('p', 'wizard__mark');
      marke.appendChild(el('span', 'wizard__mark-dot'));
      marke.appendChild(document.createTextNode('StudioLink Anfrage'));
      box.appendChild(marke);
      box.appendChild(el('p', 'wizard__done-title', 'Angekommen.'));
      box.appendChild(el('p', '', 'Danke dir. Deine Anfrage liegt jetzt im Posteingang von The Master of Ink — du hörst innerhalb von drei Werktagen persönlich von uns.'));
      var basis = SL.leadLinkBase;
      if (token && basis) {
        var nach = el('p', 'wizard__done-more');
        nach.appendChild(document.createTextNode('Du kannst in Ruhe ergänzen — Referenzen, Größe, Wunschtermin: '));
        var link = el('a', '', 'Angaben ergänzen ↗');
        link.href = basis.replace(/\/$/, '') + '/lead/' + token;
        link.rel = 'noopener';
        nach.appendChild(link);
        box.appendChild(nach);
      }
      wizardRoot.appendChild(box);
      box.setAttribute('tabindex', '-1');
      box.focus({ preventScroll: true });
    }

    zeichne();
  }
}());
