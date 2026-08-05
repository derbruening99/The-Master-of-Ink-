/* ============================================================
   The Master of Ink — Verhalten
   Kein Framework, keine Abhängigkeiten.
   ============================================================ */
(function () {
  'use strict';

  var doc = document.documentElement;
  doc.classList.add('js');

  var DATA = window.MOI_DATA || { categories: [], works: [], emptyNote: '' };
  var CONFIG = window.MOI_CONFIG || {};

  var mqVideo = window.matchMedia('(min-width: 900px)');
  var mqReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var conn = navigator.connection || {};

  function videoAllowed() {
    return mqVideo.matches && !mqReduced.matches && !conn.saveData;
  }

  /* ---------- Masthead-Höhe für die Hero-Berechnung ---------- */
  var masthead = document.querySelector('.masthead');
  function setMastheadVar() {
    if (masthead) doc.style.setProperty('--masthead-h', masthead.offsetHeight + 'px');
  }
  setMastheadVar();
  window.addEventListener('resize', setMastheadVar);

  /* ---------- Scroll-Reveals (Tinte zieht ein) ---------- */
  var revealIO = null;
  function observeReveals(scope) {
    var nodes = (scope || document).querySelectorAll('.reveal:not(.is-in)');
    if (mqReduced.matches || !('IntersectionObserver' in window)) {
      nodes.forEach(function (n) { n.classList.add('is-in'); });
      return;
    }
    if (!revealIO) {
      revealIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            revealIO.unobserve(e.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    }
    nodes.forEach(function (n) { revealIO.observe(n); });
  }

  /* ---------- Videos: lazy, stumm, Poster-Fallback ---------- */
  function bindVideo(video, playIO) {
    video.addEventListener('playing', function () { video.classList.add('is-playing'); });
    /* Fallback für Server/Browser, bei denen 'playing' spät kommt */
    video.addEventListener('timeupdate', function onTime() {
      if (video.currentTime > 0.05 && !video.paused) {
        video.classList.add('is-playing');
        video.removeEventListener('timeupdate', onTime);
      }
    });
    video.addEventListener('pause', function () { video.classList.remove('is-playing'); });
    if (playIO) playIO.observe(video);
  }

  /* WebM/VP9 zuerst (kleiner, Chrome/Firefox/Edge),
     MP4/H.264 als Rückfall für Safari und iOS. */
  function loadSource(video) {
    if (video.dataset.loaded) return;
    video.dataset.loaded = '1';
    [
      { src: video.dataset.videoWebm, type: 'video/webm' },
      { src: video.dataset.videoMp4, type: 'video/mp4' }
    ].forEach(function (cand) {
      if (!cand.src) return;
      var s = document.createElement('source');
      s.src = cand.src;
      s.type = cand.type;
      video.appendChild(s);
    });
    video.load();
  }

  function tryPlay(video) {
    var p = video.play();
    if (p && p.catch) {
      p.catch(function () {
        var retry = function () {
          video.play().catch(function () {});
          window.removeEventListener('pointerdown', retry);
          window.removeEventListener('keydown', retry);
        };
        window.addEventListener('pointerdown', retry, { once: true });
        window.addEventListener('keydown', retry, { once: true });
      });
    }
  }

  var videos = Array.prototype.slice.call(document.querySelectorAll('video[data-video-webm], video[data-video-mp4]'));
  var playIO = null;

  function setupVideos() {
    if (!videoAllowed()) {
      videos.forEach(function (v) { v.pause(); v.classList.remove('is-playing'); });
      return;
    }
    if (!('IntersectionObserver' in window)) {
      videos.forEach(function (v) { loadSource(v); tryPlay(v); });
      return;
    }
    if (!playIO) {
      playIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          var v = e.target;
          if (!videoAllowed()) return;
          if (e.isIntersecting) {
            loadSource(v);
            tryPlay(v);
          } else {
            v.pause();
          }
        });
      }, { threshold: 0.25, rootMargin: '120px 0px' });
      videos.forEach(function (v) { bindVideo(v, playIO); });
    }
  }
  setupVideos();
  mqVideo.addEventListener ? mqVideo.addEventListener('change', setupVideos) : mqVideo.addListener(setupVideos);
  mqReduced.addEventListener ? mqReduced.addEventListener('change', setupVideos) : mqReduced.addListener(setupVideos);

  /* ---------- Hero: leichte Parallaxe ---------- */
  var heroMedia = document.querySelector('.hero__media');
  var hero = document.querySelector('.hero');
  if (heroMedia && hero && !mqReduced.matches) {
    heroMedia.style.top = '-6%';
    heroMedia.style.bottom = '-6%';
    var raf = null;
    var onScroll = function () {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = null;
        var p = Math.min(1, Math.max(0, window.scrollY / (hero.offsetHeight || 1)));
        heroMedia.style.transform = 'translateY(' + (p * 5.5) + '%)';
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Galerie: datengetrieben + Filter ---------- */
  var gallery = document.getElementById('gallery');
  var filterWrap = document.querySelector('.gallery__filters');
  var activeFilter = 'all';

  var SIZES = {
    a: '(min-width: 900px) 52vw, 92vw',
    b: '(min-width: 900px) min(46vw, 720px), 100vw',
    c: '(min-width: 900px) 36vw, 92vw'
  };

  function srcset(slot, widths, ext) {
    return widths.map(function (w) {
      return 'assets/img/' + slot + '-' + w + '.' + ext + ' ' + w + 'w';
    }).join(', ');
  }

  function buildPicture(work, variant) {
    var pic = document.createElement('picture');
    var source = document.createElement('source');
    source.type = 'image/webp';
    source.srcset = srcset(work.slot, work.widths, 'webp');
    source.sizes = SIZES[variant];
    var img = document.createElement('img');
    img.src = 'assets/img/' + work.slot + '-' + work.widths[Math.min(1, work.widths.length - 1)] + '.jpg';
    img.srcset = srcset(work.slot, work.widths, 'jpg');
    img.sizes = SIZES[variant];
    img.alt = work.alt || '';
    img.loading = 'lazy';
    img.decoding = 'async';
    if (work.position) img.style.objectPosition = work.position;
    pic.appendChild(source);
    pic.appendChild(img);
    return pic;
  }

  function el(tag, className, text) {
    var n = document.createElement(tag);
    if (className) n.className = className;
    if (text) n.textContent = text;
    return n;
  }

  function buildSpread(work, index) {
    var variant = ['a', 'b', 'c'][index % 3];
    var fig = el('figure', 'spread spread--' + variant);

    var media = el('div', 'spread__media reveal reveal--wipe');
    media.setAttribute('data-wipe', variant === 'b' ? 'up' : 'left');
    media.style.aspectRatio = work.ratio || '4 / 5';
    media.appendChild(buildPicture(work, variant));

    if (variant === 'b') {
      var frame = el('div', 'spread__frame');
      frame.appendChild(media);
      fig.appendChild(frame);
      var cap = el('figcaption', 'spread__caption');
      var h = el('h3', 'spread__title');
      var num = el('span', 'spread__num', work.num);
      num.setAttribute('aria-hidden', 'true');   /* Tafelnummer ist dekorativ */
      h.appendChild(num);
      h.appendChild(document.createTextNode(work.title));
      cap.appendChild(h);
      if (work.meta) cap.appendChild(el('p', 'spread__meta', work.meta));
      if (work.caption) cap.appendChild(el('p', 'spread__body', work.caption));
      fig.appendChild(cap);
    } else {
      fig.appendChild(media);
      var cap2 = el('figcaption', 'spread__caption');
      if (work.num) cap2.appendChild(el('p', 'spread__num', work.num));
      cap2.appendChild(el('h3', 'spread__title', work.title));
      if (work.meta) cap2.appendChild(el('p', 'spread__meta', work.meta));
      if (work.caption) cap2.appendChild(el('p', 'spread__body', work.caption));
      fig.appendChild(cap2);
    }
    return fig;
  }

  function renderGallery() {
    if (!gallery) return;
    Array.prototype.slice.call(gallery.children).forEach(function (child) {
      if (child.tagName !== 'NOSCRIPT') gallery.removeChild(child);
    });
    var works = DATA.works.filter(function (w) {
      return activeFilter === 'all' || w.category === activeFilter;
    });
    if (!works.length) {
      gallery.appendChild(el('p', 'gallery__empty', DATA.emptyNote || ''));
      return;
    }
    works.forEach(function (w, i) { gallery.appendChild(buildSpread(w, i)); });
    observeReveals(gallery);
  }

  function renderFilters() {
    if (!filterWrap) return;
    if (!DATA.works.length) { filterWrap.hidden = true; return; }
    var all = [{ id: 'all', label: 'Alle' }].concat(DATA.categories);
    all.forEach(function (cat) {
      var btn = el('button', 'filter-btn', cat.label);
      btn.type = 'button';
      btn.setAttribute('data-filter', cat.id);
      btn.setAttribute('aria-pressed', cat.id === activeFilter ? 'true' : 'false');
      btn.addEventListener('click', function () {
        if (activeFilter === cat.id) return;
        activeFilter = cat.id;
        filterWrap.querySelectorAll('.filter-btn').forEach(function (b) {
          b.setAttribute('aria-pressed', b.getAttribute('data-filter') === activeFilter ? 'true' : 'false');
        });
        gallery.classList.add('is-switching');
        window.setTimeout(function () {
          renderGallery();
          gallery.classList.remove('is-switching');
        }, 280);
      });
      filterWrap.appendChild(btn);
    });
  }

  renderFilters();
  renderGallery();
  observeReveals(document);

  /* ---------- Anfrage-Formular ---------- */
  var form = document.getElementById('anfrage');
  var done = document.querySelector('.termin__done');
  if (form && done) {
    var errorBox = form.querySelector('.form__error');
    var showError = function (msg) {
      errorBox.textContent = msg;
      errorBox.hidden = !msg;
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      showError('');
      var fd = new FormData(form);
      if (fd.get('company')) { form.hidden = true; done.hidden = false; return; }
      var name = String(fd.get('name') || '').trim();
      var email = String(fd.get('email') || '').trim();
      var idea = String(fd.get('idea') || '').trim();
      if (!name || !email) { showError('Bitte gib Name und E-Mail-Adresse an.'); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showError('Bitte prüfe die E-Mail-Adresse.'); return; }

      var finish = function () { form.hidden = true; done.hidden = false; };

      if (CONFIG.formEndpoint) {
        var btn = form.querySelector('.form__submit');
        btn.disabled = true;
        fetch(CONFIG.formEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name, email: email, idea: idea })
        }).then(function (res) {
          if (!res.ok) throw new Error('send failed');
          finish();
        }).catch(function () {
          btn.disabled = false;
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
})();
