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
     Schwarz mit Signet, bis die Seite steht. Zwei Regeln halten ihn
     harmlos: er wartet nie auf das Hero-Video (das lädt bewusst erst
     nach `load`), und er geht spätestens nach 4 Sekunden auf — eine
     hängende Datei darf niemanden aussperren. */
  (function () {
    var curtain = document.getElementById('curtain');
    if (!curtain) return;
    var MINDESTDAUER = 620;   /* kurzes Aufblitzen wirkt wie ein Fehler */
    var NOTAUS = 3000;        /* vor der CSS-Rückfallebene bei 3,6 s */
    var start = Date.now();
    var gehoben = false;

    function hebe() {
      if (gehoben) return;
      gehoben = true;
      var wartend = Math.max(0, MINDESTDAUER - (Date.now() - start));
      window.setTimeout(function () {
        curtain.classList.add('is-lifting');
        var weg = function () { curtain.classList.add('is-gone'); };
        curtain.addEventListener('transitionend', weg, { once: true });
        window.setTimeout(weg, 1200);      /* falls transitionend ausbleibt */
      }, wartend);
    }

    if (document.readyState === 'complete') hebe();
    else window.addEventListener('load', hebe, { once: true });
    window.setTimeout(hebe, NOTAUS);
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
      top.appendChild(el('p', '', artist.location + ' / ' + artist.number));
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
        var instagram = el('a', '', 'Instagram ' + artist.instagramLabel + ' ↗');
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
    stageIO = new IntersectionObserver(function (entries) {
      /* Den obersten sichtbaren Block gewinnen lassen — bei schnellem
         Scrollen sind kurzzeitig mehrere im Blick. */
      var sichtbar = entries.filter(function (e) { return e.isIntersecting; });
      if (!sichtbar.length) return;
      sichtbar.sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top; });
      var ziel = sichtbar[0].target;
      zeigeBuehne(ziel.getAttribute('data-stage'), ziel.getAttribute('data-stage-caption'));
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
        if (slot.getAttribute('data-stage-slot') !== 'video') stage.removeChild(slot);
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


  /* ---------- Anfrage → StudioLink ----------
     Ruft dieselbe Funktion wie StudioLinks eigene /anfrage-Seite:
     inkcore.public_create_lead(p_payload jsonb) returns text.
     Rückgabe ist ein Ergänzungs-Token (14 Tage gültig). */
  var form = document.getElementById('anfrage');
  var done = document.querySelector('.termin__done');
  var MIN_FILL_SECONDS = 3;      /* wie in StudioLinks LeadIntakeForm */
  if (form && done) {
    var openedAt = Date.now();
    var errorBox = form.querySelector('.form__error');
    var supplement = done.querySelector('.termin__done-supplement');
    var supplementLink = done.querySelector('.termin__done-link');

    function showError(message) {
      errorBox.textContent = message;
      errorBox.hidden = !message;
      form.querySelectorAll('[aria-describedby="form-error"]').forEach(function (input) {
        if (message) input.setAttribute('aria-invalid', 'true');
        else input.removeAttribute('aria-invalid');
      });
    }

    function finish(token) {
      form.hidden = true;
      done.hidden = false;
      var base = (CONFIG.studiolink || {}).leadLinkBase;
      if (token && base && supplement && supplementLink) {
        supplementLink.href = base.replace(/\/$/, '') + '/lead/' + token;
        supplement.hidden = false;
      }
      done.setAttribute('tabindex', '-1');
      done.focus();
    }

    /* Vor- und Nachname trennen, wie StudioLink es erwartet. */
    function splitName(full) {
      var parts = full.split(/\s+/).filter(Boolean);
      return { first: parts.shift() || '', last: parts.join(' ') };
    }

    function sendToStudioLink(payload) {
      var cfg = CONFIG.studiolink || {};
      return fetch(cfg.url.replace(/\/$/, '') + '/rest/v1/rpc/public_create_lead', {
        method: 'POST',
        headers: {
          'apikey': cfg.key,
          'Authorization': 'Bearer ' + cfg.key,
          'Content-Type': 'application/json',
          'Content-Profile': cfg.schema,
          'Accept-Profile': cfg.schema
        },
        body: JSON.stringify({ p_payload: payload })
      }).then(function (response) {
        if (!response.ok) {
          return response.text().then(function (body) {
            throw new Error('StudioLink ' + response.status + ': ' + body.slice(0, 200));
          });
        }
        return response.json();
      });
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      showError('');
      var data = new FormData(form);
      var name = String(data.get('name') || '').trim();
      var email = String(data.get('email') || '').trim();
      var phone = String(data.get('phone') || '').trim();
      var idea = String(data.get('idea') || '').trim();

      /* Erst prüfen, dann auf Automaten testen — sonst quittiert ein
         schnell abgeschicktes leeres Formular mit „Angekommen“. */
      if (!name || !email) { showError('Bitte gib Name und E-Mail-Adresse an.'); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showError('Bitte prüfe die E-Mail-Adresse.'); return; }
      if (!data.get('consent')) { showError('Bitte bestätige, dass wir dich zu deiner Anfrage kontaktieren dürfen.'); return; }

      /* Automat: still abbrechen, statt zu verraten, woran es lag. */
      var tooFast = (Date.now() - openedAt) / 1000 < MIN_FILL_SECONDS;
      if (String(data.get('company') || '').trim() !== '' || tooFast) { finish(null); return; }

      var cfg = CONFIG.studiolink || {};
      var submit = form.querySelector('.form__submit');
      if (!cfg.url || !cfg.key || !cfg.studioId) {
        showError('Das Anfrageformular ist noch nicht verbunden. Schreib uns direkt: ' + (CONFIG.contactEmail || ''));
        return;
      }

      var parts = splitName(name);
      submit.disabled = true;
      submit.setAttribute('aria-busy', 'true');
      sendToStudioLink({
        studio_id: cfg.studioId,
        source: 'web',
        source_detail: 'website_termin',
        source_page: 'website',
        source_section: 'termin',
        first_name: parts.first,
        last_name: parts.last || null,
        contact_email: email,
        contact_phone: phone || null,
        preferred_contact_channel: 'email',
        motif: idea || null,
        message: idea || null,
        consent_to_contact: true,
        consent_timestamp: new Date().toISOString(),
        privacy_policy_version: cfg.privacyPolicyVersion || null,
        form_type: 'quick'
      }).then(function (token) {
        finish(typeof token === 'string' ? token : null);
      }).catch(function (error) {
        if (window.console && console.error) console.error('[anfrage] StudioLink', error);
        submit.disabled = false;
        submit.removeAttribute('aria-busy');
        showError('Die Anfrage kam nicht durch. Bitte versuch es gleich noch einmal — oder schreib uns direkt: ' + (CONFIG.contactEmail || ''));
      });
    });
  }
}());
