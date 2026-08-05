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
  function videoAllowed() {
    return mqVideo.matches && !mqReduced.matches && !conn.saveData;
  }
  function loadSource(video) {
    if (video.dataset.loaded) return;
    video.dataset.loaded = '1';
    [
      { src: video.dataset.videoWebm, type: 'video/webm' },
      { src: video.dataset.videoMp4, type: 'video/mp4' }
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
  setupVideos();
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

      var content = el('div', 'artist-card__content');
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
      var portfolio = el('a', '', 'Portfolio ansehen ↓');
      portfolio.href = '#arbeiten';
      portfolio.setAttribute('data-artist-portfolio', artist.id);
      links.appendChild(portfolio);
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
  function buildWork(work) {
    var figure = el('figure', 'spread');
    var media = el('div', 'spread__media reveal reveal--wipe');
    media.setAttribute('data-wipe', 'up');
    media.appendChild(buildPicture(work, '(min-width: 900px) 34vw, (min-width: 461px) 50vw, 100vw'));
    var caption = el('figcaption', 'spread__caption');
    caption.appendChild(el('p', 'spread__num', work.num));
    caption.appendChild(el('h3', 'spread__title', work.title));
    if (work.meta) caption.appendChild(el('p', 'spread__meta', work.meta));
    if (work.caption) caption.appendChild(el('p', 'spread__body', work.caption));
    figure.appendChild(media);
    figure.appendChild(caption);
    return figure;
  }
  function renderGallery() {
    if (!gallery) return;
    Array.prototype.slice.call(gallery.children).forEach(function (child) {
      if (child.tagName !== 'NOSCRIPT') gallery.removeChild(child);
    });
    var works = (DATA.works || []).filter(function (work) {
      var artistMatch = activeArtist === 'all' || work.artistId === activeArtist;
      var categories = work.categories || [work.category];
      return work.featured !== false && artistMatch && (activeFilter === 'all' || categories.indexOf(activeFilter) !== -1);
    });
    if (portfolioArtistLabel) {
      var artist = (DATA.artists || []).find(function (item) { return item.id === activeArtist; });
      portfolioArtistLabel.textContent = artist ? artist.name : 'Studio';
    }
    if (!works.length) gallery.appendChild(el('p', 'gallery__empty', DATA.emptyNote || 'Keine Arbeiten in dieser Auswahl.'));
    else works.forEach(function (work) { gallery.appendChild(buildWork(work)); });
    observeReveals(gallery);
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

  /* Existing StudioLink-ready enquiry handoff. */
  var form = document.getElementById('anfrage');
  var done = document.querySelector('.termin__done');
  if (form && done) {
    var errorBox = form.querySelector('.form__error');
    function showError(message) {
      errorBox.textContent = message;
      errorBox.hidden = !message;
      form.querySelectorAll('[aria-describedby="form-error"]').forEach(function (input) {
        if (message) input.setAttribute('aria-invalid', 'true');
        else input.removeAttribute('aria-invalid');
      });
    }
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      showError('');
      var data = new FormData(form);
      if (data.get('company')) { form.hidden = true; done.hidden = false; return; }
      var name = String(data.get('name') || '').trim();
      var email = String(data.get('email') || '').trim();
      var idea = String(data.get('idea') || '').trim();
      if (!name || !email) { showError('Bitte gib Name und E-Mail-Adresse an.'); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showError('Bitte prüfe die E-Mail-Adresse.'); return; }
      function finish() { form.hidden = true; done.hidden = false; }
      if (CONFIG.formEndpoint) {
        var submit = form.querySelector('.form__submit');
        submit.disabled = true;
        fetch(CONFIG.formEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name, email: email, idea: idea })
        }).then(function (response) {
          if (!response.ok) throw new Error('send failed');
          finish();
        }).catch(function () {
          submit.disabled = false;
          showError('Das hat leider nicht geklappt. Schreib uns direkt: ' + (CONFIG.contactEmail || ''));
        });
      } else {
        var subject = encodeURIComponent('Tattoo-Anfrage — ' + name);
        var body = encodeURIComponent('Name: ' + name + '\nE-Mail: ' + email + '\n\nIdee:\n' + idea + '\n');
        window.location.href = 'mailto:' + (CONFIG.contactEmail || '') + '?subject=' + subject + '&body=' + body;
        finish();
      }
    });
  }
}());
