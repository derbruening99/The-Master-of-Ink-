/* The Master of Ink — Gutschein-Bestellung
   ------------------------------------------------------------------
   1. Kunde wählt eine Stufe aus MOI_CONFIG.gutscheine und füllt das
      Formular aus. Der Bestellknopf bleibt grau, bis alles stimmt.
   2. Die Bestellung geht als Anfrage in den StudioLink-Posteingang
      (inkcore.public_create_lead, source_detail = website_gutschein).
   3. Danach: grüner Haken und genau ein nächster Schritt —
      der Revolut-Zahlungslink der Stufe (nur bei Anzahl 1 und wenn
      ein Link hinterlegt ist), sonst der Hinweis, dass der
      Zahlungslink per E-Mail kommt.
   ------------------------------------------------------------------ */
(function () {
  'use strict';

  var CONFIG = window.MOI_CONFIG || {};
  var SL = CONFIG.studiolink || {};
  var GS = CONFIG.gutscheine || {};
  var STUFEN = (GS.stufen || []).filter(function (s) { return s && s.wert > 0 && s.preis > 0; });
  var MAX_ANZAHL = Math.max(1, Math.min(10, GS.maxAnzahl || 5));
  var MIN_FILL_SECONDS = 2;
  var KONTAKT = CONFIG.contactEmail || 'masterofinkger@gmail.com';

  var form = document.getElementById('gutschein-form');
  var fertigEl = document.getElementById('gutschein-fertig');
  var stufenEl = document.getElementById('gutschein-stufen');
  if (!form || !fertigEl || !stufenEl || !STUFEN.length) return;

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var el = {
    vorname: $('#g-vorname'),
    nachname: $('#g-nachname'),
    email: $('#g-email'),
    fuer: $('#g-fuer'),
    anzahl: $('#g-anzahl'),
    karte: $('#g-karte'),
    zustimmung: $('#g-zustimmung'),
    falle: $('#g-website'),
    knopf: $('[data-submit]', form),
    fehler: $('[data-fehler]', form),
    sumWas: $('[data-sum-was]', form),
    sumTotal: $('[data-sum-total]', form),
    vcardWert: $('[data-vcard-wert]'),
    vcardFuer: $('[data-vcard-fuer]')
  };

  var geoeffnetUm = Date.now();
  var laeuft = false;
  var beruehrt = {};
  var versucht = false;
  var gewaehlt = null;

  function euro(n) {
    return Number(n).toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' €';
  }

  function tippen(muster) {
    /* Spürbare Rückmeldung, wo das Gerät es kann (Android). iOS ignoriert es still. */
    try { if (navigator.vibrate) navigator.vibrate(muster || 8); } catch (e) { /* egal */ }
  }

  /* ---------- Stufen ---------- */
  var HAKEN = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6.4l2.3 2.3 4.7-5" fill="none" stroke="#080808" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  STUFEN.forEach(function (s, i) {
    var label = document.createElement('label');
    label.className = 'tier';
    var bonus = s.wert - s.preis;
    label.innerHTML =
      '<input type="radio" name="stufe" value="' + s.wert + '">' +
      '<span class="tier__tick">' + HAKEN + '</span>' +
      '<span class="tier__value">' + euro(s.wert) + '</span>' +
      '<span class="tier__price">für ' + euro(s.preis) + '</span>' +
      (bonus > 0 ? '<span class="tier__bonus">+' + euro(bonus) + ' Bonus</span>' : '');
    var input = label.querySelector('input');
    input.setAttribute('aria-label', 'Gutschein über ' + euro(s.wert) + ' für ' + euro(s.preis));
    input.addEventListener('change', function () { waehle(s, true); });
    input.addEventListener('focus', function () { label.classList.add('has-focus'); });
    input.addEventListener('blur', function () { label.classList.remove('has-focus'); });
    stufenEl.appendChild(label);
    s._label = label;
    s._input = input;
  });

  function waehle(stufe, vomNutzer) {
    gewaehlt = stufe;
    STUFEN.forEach(function (s) {
      var an = s === stufe;
      s._label.classList.toggle('is-selected', an);
      s._input.checked = an;
    });
    if (vomNutzer) tippen(8);
    aktualisieren();
  }

  /* ---------- Anzahl ---------- */
  for (var n = 1; n <= MAX_ANZAHL; n++) {
    var opt = document.createElement('option');
    opt.value = String(n);
    opt.textContent = String(n);
    el.anzahl.appendChild(opt);
  }

  function anzahl() {
    var a = parseInt(el.anzahl.value, 10);
    return a >= 1 && a <= MAX_ANZAHL ? a : 1;
  }

  /* ---------- Prüfen ---------- */
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var regeln = {
    vorname: function () { return el.vorname.value.trim() ? '' : 'Bitte gib deinen Vornamen ein.'; },
    nachname: function () { return el.nachname.value.trim() ? '' : 'Bitte gib deinen Nachnamen ein.'; },
    email: function () {
      var v = el.email.value.trim();
      if (!v) return 'Bitte gib deine E-Mail-Adresse ein – dorthin schicken wir den Gutschein.';
      return EMAIL.test(v) ? '' : 'Diese E-Mail-Adresse sieht nicht vollständig aus. Bitte prüf sie noch einmal.';
    },
    zustimmung: function () { return el.zustimmung.checked ? '' : 'Bitte bestätige die Gutscheinbedingungen und die Widerrufsbelehrung.'; }
  };

  function zeigeFehler(name, text) {
    var feld = form.querySelector('[data-field="' + name + '"]');
    if (!feld) return;
    var err = feld.querySelector('.vfield__error');
    feld.classList.toggle('is-invalid', !!text);
    if (err) err.textContent = text || '';
    var input = feld.querySelector('input');
    if (input) input.setAttribute('aria-invalid', text ? 'true' : 'false');
  }

  function alleOk() {
    if (!gewaehlt) return false;
    for (var k in regeln) { if (regeln.hasOwnProperty(k) && regeln[k]()) return false; }
    return true;
  }

  function aktualisieren() {
    var a = anzahl();
    var s = gewaehlt;
    if (s) {
      el.sumWas.textContent = a + ' × Gutschein über ' + euro(s.wert);
      el.sumTotal.textContent = euro(s.preis * a);
      el.vcardWert.textContent = euro(s.wert);
    }
    var fuer = el.fuer.value.trim();
    el.vcardFuer.textContent = fuer ? 'für ' + fuer : 'für dich';

    for (var k in regeln) {
      if (regeln.hasOwnProperty(k) && (beruehrt[k] || versucht)) zeigeFehler(k, regeln[k]());
    }
    /* Grau statt gesperrt: ein Tipp auf den grauen Knopf zeigt, was noch fehlt. */
    var ok = alleOk() && !laeuft;
    el.knopf.setAttribute('aria-disabled', ok ? 'false' : 'true');
    if (!laeuft) {
      el.knopf.textContent = s ? 'Zahlungspflichtig bestellen · ' + euro(s.preis * a) : 'Zahlungspflichtig bestellen';
    }
  }

  ['vorname', 'nachname', 'email'].forEach(function (k) {
    el[k].addEventListener('input', aktualisieren);
    el[k].addEventListener('blur', function () {
      beruehrt[k] = true;
      aktualisieren();
    });
  });
  el.fuer.addEventListener('input', aktualisieren);
  el.anzahl.addEventListener('change', function () { tippen(6); aktualisieren(); });
  el.karte.addEventListener('change', function () { tippen(6); });
  el.zustimmung.addEventListener('change', function () { beruehrt.zustimmung = true; tippen(6); aktualisieren(); });

  /* ---------- Bestellnummer ---------- */
  function bestellnummer() {
    var zeichen = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var nr = '';
    var zufall = new Uint8Array(4);
    if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(zufall);
    else for (var i = 0; i < 4; i++) zufall[i] = Math.floor(Math.random() * 256);
    for (var j = 0; j < 4; j++) nr += zeichen[zufall[j] % zeichen.length];
    return 'G-' + nr;
  }

  /* ---------- An StudioLink ---------- */
  function anStudioLink(payload) {
    return fetch(SL.url.replace(/\/$/, '') + '/rest/v1/rpc/public_create_lead', {
      method: 'POST',
      headers: {
        'apikey': SL.key,
        'Authorization': 'Bearer ' + SL.key,
        'Content-Type': 'application/json',
        'Content-Profile': SL.schema || 'inkcore',
        'Accept-Profile': SL.schema || 'inkcore'
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

  function nachricht(d) {
    var zeilen = [
      'GUTSCHEIN-BESTELLUNG ' + d.nr + ' (Website)',
      '',
      'Gutschein: ' + d.anzahl + ' × ' + euro(d.stufe.wert) + ' (Kaufpreis je ' + euro(d.stufe.preis) + ')',
      'Zu zahlen: ' + euro(d.summe),
      'Für: ' + (d.fuer || '– (keine Angabe)'),
      'Gedruckte Karte im Studio: ' + (d.karte ? 'ja' : 'nein'),
      'Bezahlung: ' + (d.link ? 'Revolut-Zahlungslink auf der Website angezeigt' : 'ZAHLUNGSLINK PER E-MAIL SCHICKEN (' + euro(d.summe) + ')'),
      'Gilt für: ' + (GS.gilt || 'Tattoos von Sebastian'),
      'Bestellt: ' + new Date().toLocaleString('de-DE'),
      '',
      'Nächste Schritte: Zahlungseingang in Revolut Pro prüfen → Gutschein in StudioLink anlegen (Code ' + d.nr + ') → PDF an ' + d.email + ' schicken.'
    ];
    return zeilen.join('\n');
  }

  function fertig(d) {
    form.hidden = true;
    fertigEl.hidden = false;
    $('[data-fertig-nr]', fertigEl).textContent = d.nr;
    var linkBlock = $('[data-fertig-link]', fertigEl);
    var mailBlock = $('[data-fertig-mail-block]', fertigEl);
    if (d.link) {
      linkBlock.hidden = false;
      $('[data-fertig-betrag]', fertigEl).textContent = euro(d.summe);
      $('[data-fertig-mail]', fertigEl).textContent = d.email;
      var pay = $('[data-fertig-pay]', fertigEl);
      pay.href = d.link;
      pay.textContent = euro(d.summe) + ' jetzt bezahlen ↗';
      pay.addEventListener('click', function () { tippen(10); });
    } else {
      mailBlock.hidden = false;
      $('[data-fertig-betrag2]', fertigEl).textContent = euro(d.summe);
      $('[data-fertig-mail2]', fertigEl).textContent = d.email;
    }
    $('[data-fertig-karte]', fertigEl).hidden = !d.karte;
    tippen([10, 60, 14]);
    try { fertigEl.focus({ preventScroll: true }); } catch (e) { fertigEl.focus(); }
    var oben = fertigEl.getBoundingClientRect().top + window.pageYOffset - 24;
    window.scrollTo({ top: oben, behavior: 'smooth' });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    versucht = true;
    el.fehler.hidden = true;
    aktualisieren();
    if (laeuft || !alleOk()) {
      var erstes = form.querySelector('.is-invalid input');
      if (erstes) erstes.focus();
      return;
    }

    var s = gewaehlt;
    var a = anzahl();
    var d = {
      nr: bestellnummer(),
      stufe: s,
      anzahl: a,
      summe: s.preis * a,
      fuer: el.fuer.value.trim(),
      karte: el.karte.checked,
      email: el.email.value.trim(),
      link: a === 1 && s.link ? s.link : ''
    };

    /* Automat: still quittieren, statt zu verraten, woran es lag. */
    var zuSchnell = (Date.now() - geoeffnetUm) / 1000 < MIN_FILL_SECONDS;
    if (el.falle.value.trim() !== '' || zuSchnell) { d.link = ''; fertig(d); return; }

    if (!SL.url || !SL.key || !SL.studioId) {
      el.fehler.textContent = 'Die Bestellung ist gerade nicht verbunden. Schreib uns bitte direkt: ' + KONTAKT;
      el.fehler.hidden = false;
      return;
    }

    laeuft = true;
    el.knopf.setAttribute('aria-disabled', 'true');
    el.knopf.setAttribute('aria-busy', 'true');
    el.knopf.textContent = 'Wird gesendet …';

    anStudioLink({
      studio_id: SL.studioId,
      source: 'web',
      source_detail: 'website_gutschein',
      source_page: 'gutscheine',
      source_section: 'gutschein',
      form_type: 'quick',
      first_name: el.vorname.value.trim(),
      last_name: el.nachname.value.trim(),
      contact_email: d.email,
      preferred_contact_channel: 'email',
      motif: 'Gutschein-Bestellung ' + d.nr + ' · ' + a + ' × ' + euro(s.wert),
      message: nachricht(d),
      consent_to_contact: true,
      consent_timestamp: new Date().toISOString(),
      privacy_policy_version: SL.privacyPolicyVersion || null
    }).then(function () {
      laeuft = false;
      el.knopf.removeAttribute('aria-busy');
      fertig(d);
    }).catch(function (fehlerObj) {
      if (window.console && console.error) console.error('[gutschein] StudioLink', fehlerObj);
      laeuft = false;
      el.knopf.removeAttribute('aria-busy');
      el.fehler.textContent = 'Das hat gerade nicht geklappt. Bitte versuch es gleich noch einmal – oder schreib uns an ' + KONTAKT + '.';
      el.fehler.hidden = false;
      aktualisieren();
    });
  });

  /* ---------- Start ---------- */
  var start = STUFEN.filter(function (s) { return s.wert === GS.vorauswahl; })[0] || STUFEN[Math.floor(STUFEN.length / 2)];
  waehle(start, false);
})();
