/* © 2026 Frihetsplanen (frihetsplan.no). Alle rettigheter forbeholdt. */
/**
 * Frihetsplanen — refinans.js
 * Logikk og rendering for refinansieringssiden.
 */

const Refinans = {
  LAGRE_NØKKEL: 'fp_refinans_v1',
  _ekstraLånTeller: 0,

  tilstand: {
    lån: [],       // [{ id, navn, ikon, beløp, rente, løpetid, ekstra? }]
    finnVerdi: 0,  // estimert verdi av ting man kan selge på Finn.no
  },

  // ─── BOOT ──────────────────────────────────────────────────────────────

  start: function() {
    Refinans.initLån();
    Refinans.lastTilstand();
    Refinans.tegnSkyvere();
    Refinans.oppdaterResultat();
    Refinans.tegnTilbydere();
  },

  initLån: function() {
    Refinans.tilstand.lån = RF.LÅNETYPER.map(type => ({
      id: type.id,
      navn: type.navn,
      ikon: type.ikon,
      beløp: type.beløp.standard,
      rente: type.rente.standard,
      løpetid: type.løpetid.standard,
      ekstra: false,
    }));
  },

  // ─── EKSTRA LÅN — legg til / fjern ─────────────────────────────────────

  leggTilLån: function() {
    Refinans._ekstraLånTeller++;
    const id = 'ekstra_' + Refinans._ekstraLånTeller;
    Refinans.tilstand.lån.push({
      id,
      navn: 'Lån ' + (Refinans.tilstand.lån.length + 1),
      ikon: '💳',
      beløp: 50000,
      rente: 10,
      løpetid: 5,
      ekstra: true,
    });
    Refinans.lagreTilstand();
    Refinans.tegnSkyvere();
    Refinans.oppdaterResultat();
  },

  fjernLån: function(id) {
    Refinans.tilstand.lån = Refinans.tilstand.lån.filter(l => l.id !== id);
    Refinans.lagreTilstand();
    Refinans.tegnSkyvere();
    Refinans.oppdaterResultat();
  },

  // ─── IMPORT FRA FRIHETSPLANEN ──────────────────────────────────────────

  hentFraFrihetsplanen: function() {
    try {
      const raw = localStorage.getItem('fp_svar_v1');
      if (!raw) return null;
      const snapshot = JSON.parse(raw);
      return snapshot.verdier || null;
    } catch (e) { return null; }
  },

  importerFraFrihetsplanen: function() {
    const v = Refinans.hentFraFrihetsplanen();
    if (!v) return false;
    let importert = false;
    RF.LÅNETYPER.forEach(type => {
      const rad = Refinans.tilstand.lån.find(l => l.id === type.id);
      if (!rad || !type.importKilde) return;
      Object.entries(type.importKilde).forEach(([felt, kilde]) => {
        if (v[kilde] !== undefined && v[kilde] !== null && v[kilde] !== 0) {
          rad[felt] = v[kilde];
          importert = true;
        }
      });
    });
    Refinans.lagreTilstand();
    Refinans.tegnSkyvere();
    Refinans.oppdaterResultat();
    return importert;
  },

  // ─── LAGRING ───────────────────────────────────────────────────────────

  lagreTilstand: function() {
    try {
      localStorage.setItem(Refinans.LAGRE_NØKKEL, JSON.stringify(Refinans.tilstand));
    } catch (e) {}
  },

  lastTilstand: function() {
    try {
      const raw = localStorage.getItem(Refinans.LAGRE_NØKKEL);
      if (!raw) return false;
      const snapshot = JSON.parse(raw);
      if (snapshot.lån && snapshot.lån.length >= RF.LÅNETYPER.length) {
        Refinans.tilstand.lån = snapshot.lån;
        Refinans.tilstand.finnVerdi = snapshot.finnVerdi || 0;
        // Synkroniser ekstraLånTeller
        snapshot.lån.filter(l => l.ekstra).forEach(l => {
          const n = parseInt(l.id.replace('ekstra_', '')) || 0;
          if (n > Refinans._ekstraLånTeller) Refinans._ekstraLånTeller = n;
        });
        return true;
      }
      return false;
    } catch (e) { return false; }
  },

  // ─── SKYVER-HÅNDTERING ─────────────────────────────────────────────────

  settVerdi: function(id, felt, verdi) {
    const rad = Refinans.tilstand.lån.find(l => l.id === id);
    if (!rad) return;
    rad[felt] = parseFloat(verdi);
    Refinans.lagreTilstand();
    Refinans.oppdaterResultat();
    Refinans.oppdaterVisteVerdier(id);
  },

  settFinnVerdi: function(verdi) {
    Refinans.tilstand.finnVerdi = parseFloat(verdi) || 0;
    Refinans.lagreTilstand();
    Refinans.oppdaterResultat();
    const el = document.getElementById('rf-finn-val');
    if (el) el.textContent = fp_fmt(Refinans.tilstand.finnVerdi);
  },

  oppdaterVisteVerdier: function(id) {
    const rad = Refinans.tilstand.lån.find(l => l.id === id);
    if (!rad) return;
    const elBeløp   = document.getElementById('rf-val-' + id + '-beløp');
    const elRente   = document.getElementById('rf-val-' + id + '-rente');
    const elLøpetid = document.getElementById('rf-val-' + id + '-løpetid');
    if (elBeløp)   elBeløp.textContent   = fp_fmt(rad.beløp);
    if (elRente)   elRente.textContent   = rad.rente.toFixed(1) + ' %';
    if (elLøpetid) elLøpetid.textContent = rad.løpetid + ' år';
  },

  // ─── RENDERING — SKYVERE ───────────────────────────────────────────────

  _lånKort: function(rad) {
    const type  = RF.LÅNETYPER.find(t => t.id === rad.id) || {
      beløp:   { min: 0, max: 1000000, step: 5000 },
      rente:   { min: 0, max: 30, step: 0.5 },
      løpetid: { min: 1, max: 30, step: 1 },
    };
    const fjernKnapp = rad.ekstra
      ? '<button class="rf-fjern-knapp" onclick="Refinans.fjernLån(\'' + rad.id + '\')">✕ Fjern</button>'
      : '';
    const infoHtml = rad.id === 'bil'
      ? '<div class="rf-infoboks">ℹ Bilutleieinntekt regnes normalt ikke med i bankens offisielle lånekapasitet, siden den ikke er en fast, kontraktsfestet inntekt. Men den viser initiativ og økonomisk handlekraft — noe en saksbehandler kan velge å vektlegge positivt i en helhetsvurdering.</div>'
      : '';

    const bMin = type.beløp.min, bMax = type.beløp.max, bStep = type.beløp.step;
    const rMin = type.rente.min, rMax = type.rente.max, rStep = type.rente.step;
    const lMin = type.løpetid.min, lMax = type.løpetid.max, lStep = type.løpetid.step;
    const id = rad.id;

    return '<div class="rf-lån-kort">'
      + '<div class="rf-lån-header">'
      + '<span class="rf-lån-ikon">' + rad.ikon + '</span>'
      + '<span class="rf-lån-navn">' + rad.navn + '</span>'
      + fjernKnapp
      + '</div>'
      + '<div class="rf-felt"><label>Lånebeløp</label>'
      + '<div class="rf-felt-rad"><input type="range" min="' + bMin + '" max="' + bMax + '" step="' + bStep + '" value="' + rad.beløp + '" oninput="Refinans.settVerdi(\'' + id + '\',\'beløp\',this.value)">'
      + '<span class="rf-val" id="rf-val-' + id + '-beløp">' + fp_fmt(rad.beløp) + '</span></div></div>'
      + '<div class="rf-felt"><label>Rente</label>'
      + '<div class="rf-felt-rad"><input type="range" min="' + rMin + '" max="' + rMax + '" step="' + rStep + '" value="' + rad.rente + '" oninput="Refinans.settVerdi(\'' + id + '\',\'rente\',this.value)">'
      + '<span class="rf-val" id="rf-val-' + id + '-rente">' + rad.rente.toFixed(1) + ' %</span></div></div>'
      + '<div class="rf-felt"><label>Løpetid</label>'
      + '<div class="rf-felt-rad"><input type="range" min="' + lMin + '" max="' + lMax + '" step="' + lStep + '" value="' + rad.løpetid + '" oninput="Refinans.settVerdi(\'' + id + '\',\'løpetid\',this.value)">'
      + '<span class="rf-val" id="rf-val-' + id + '-løpetid">' + rad.løpetid + ' år</span></div></div>'
      + infoHtml
      + '</div>';
  },

  tegnSkyvere: function() {
    const container = document.getElementById('rf-skyvere');
    if (!container) return;

    const harFrihetsplanData = !!Refinans.hentFraFrihetsplanen();
    const importBannerHtml = harFrihetsplanData
      ? '<div class="rf-import-banner"><span>Vi fant tall fra Frihetsplanen din.</span>'
        + '<button class="rf-knapp-liten" onclick="Refinans.importerFraFrihetsplanen()">Hent dem inn</button></div>'
      : '';

    const lånHtml = Refinans.tilstand.lån.map(rad => Refinans._lånKort(rad)).join('');

    const leggTilHtml = '<button class="rf-legg-til-knapp" onclick="Refinans.leggTilLån()">+ Legg til flere lån</button>';

    // Finn.no-felt
    const finnHtml = '<div class="rf-finn-seksjon">'
      + '<div class="rf-finn-header"><span>🛒</span><span class="rf-lån-navn">Ting jeg kan selge på Finn.no</span></div>'
      + '<div class="rf-finn-intro">Ting som støver ned hjemme kan frigjøre kapital. Skriv inn et forsiktig estimat på hva du tror du kan få.</div>'
      + '<div class="rf-felt"><label>Estimert salgsverdi</label>'
      + '<div class="rf-felt-rad"><input type="range" min="0" max="200000" step="1000" value="' + (Refinans.tilstand.finnVerdi || 0) + '" oninput="Refinans.settFinnVerdi(this.value)">'
      + '<span class="rf-val" id="rf-finn-val">' + fp_fmt(Refinans.tilstand.finnVerdi || 0) + '</span></div></div>'
      + '</div>';

    container.innerHTML = importBannerHtml + lånHtml + leggTilHtml + finnHtml;
  },

  // ─── RENDERING — RESULTAT ──────────────────────────────────────────────

  oppdaterResultat: function() {
    const container = document.getElementById('rf-resultat');
    if (!container) return;

    const res = RF.beregnBesparelse(Refinans.tilstand.lån);
    const finnVerdi = Refinans.tilstand.finnVerdi || 0;
    const totalFrigjort = res.totalGjeld > 0 ? (res.besparelseÅrMin / 12 + finnVerdi) : finnVerdi;

    if (res.totalGjeld === 0 && finnVerdi === 0) {
      container.innerHTML = '<div class="rf-tom-melding">Legg inn lånene dine over for å se hva refinansiering kan spare deg.</div>';
      return;
    }

    const finnRadHtml = finnVerdi > 0
      ? '<div class="rf-resultat-rad"><span>Finn.no-salg (engangsbeløp)</span><strong class="rf-grønn">+ ' + fp_fmt(finnVerdi) + '</strong></div>'
      : '';

    container.innerHTML = '<div class="rf-resultat-kort">'
      + (res.totalGjeld > 0
        ? '<div class="rf-resultat-rad"><span>Samlet gjeld</span><strong>' + fp_fmt(res.totalGjeld) + '</strong></div>'
          + '<div class="rf-resultat-rad"><span>Veid snittrente i dag</span><strong>' + res.veidSnittrente.toFixed(2) + ' %</strong></div>'
          + '<div class="rf-resultat-rad rf-resultat-hovedrad"><span>Estimert besparelse</span>'
          + '<strong>' + fp_fmt(res.besparelseMndMin) + ' – ' + fp_fmt(res.besparelseMndMaks) + '/mnd</strong></div>'
          + '<div class="rf-resultat-sub">Ved ' + res.minReduksjon.toFixed(1) + '–' + res.maksReduksjon.toFixed(1) + ' prosentpoeng lavere rente på samlet gjeld.</div>'
        : '')
      + finnRadHtml
      + '</div>';
  },

  // ─── TILBYDERE ─────────────────────────────────────────────────────────

  tegnTilbydere: function() {
    const container = document.getElementById('rf-tilbydere');
    if (!container) return;
    if (!RF.TILBYDERE || RF.TILBYDERE.length === 0) { container.innerHTML = ''; return; }
    container.innerHTML = '<div class="rf-tilbydere-seksjon">'
      + '<div class="rf-seksjon-overskrift">Sammenlign tilbud</div>'
      + RF.TILBYDERE.map(t =>
          '<a class="rf-tilbyder-kort" href="' + t.lenke + '" target="_blank" rel="noopener">'
          + (t.logo ? '<img src="' + t.logo + '" alt="' + t.navn + '">' : '<span>' + t.navn + '</span>')
          + '</a>'
        ).join('')
      + '</div>';
  },

  // ─── LEAD-SKJEMA → MAILTO ──────────────────────────────────────────────

  byggLeadTekst: function() {
    const res = RF.beregnBesparelse(Refinans.tilstand.lån);
    const linjer = ['Henvendelse om refinansiering via Frihetsplanen', ''];
    Refinans.tilstand.lån.forEach(rad => {
      if (rad.beløp > 0) {
        linjer.push(rad.navn + ': ' + fp_fmt(rad.beløp) + ' · ' + rad.rente.toFixed(1) + ' % · ' + rad.løpetid + ' år');
      }
    });
    if (Refinans.tilstand.finnVerdi > 0) {
      linjer.push('Finn.no-salg (estimat): ' + fp_fmt(Refinans.tilstand.finnVerdi));
    }
    linjer.push('');
    linjer.push('Samlet gjeld: ' + fp_fmt(res.totalGjeld));
    linjer.push('Veid snittrente: ' + res.veidSnittrente.toFixed(2) + ' %');
    linjer.push('Estimert besparelse: ' + fp_fmt(res.besparelseMndMin) + ' – ' + fp_fmt(res.besparelseMndMaks) + '/mnd');
    return linjer.join('\n');
  },

  sendHenvendelse: async function() {
    const navn  = document.getElementById('rf-lead-navn').value.trim();
    const epost = document.getElementById('rf-lead-epost').value.trim();
    if (!navn || !epost) { alert('Fyll inn navn og e-post først.'); return; }

    const knapp = document.querySelector('.rf-lead-seksjon .rf-knapp-primær');
    if (knapp) { knapp.textContent = 'Sender...'; knapp.disabled = true; }

    try {
      const res = await fetch('https://formspree.io/f/xgojarqp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          navn,
          epost,
          melding: Refinans.byggLeadTekst(),
        }),
      });

      if (res.ok) {
        if (knapp) knapp.textContent = '✓ Sendt!';
        document.getElementById('rf-lead-navn').value = '';
        document.getElementById('rf-lead-epost').value = '';
      } else {
        if (knapp) { knapp.textContent = 'Send henvendelse'; knapp.disabled = false; }
        alert('Noe gikk galt. Prøv igjen eller send e-post direkte til admin@frihetsplan.no');
      }
    } catch (e) {
      if (knapp) { knapp.textContent = 'Send henvendelse'; knapp.disabled = false; }
      alert('Noe gikk galt. Prøv igjen eller send e-post direkte til admin@frihetsplan.no');
    }
  },
};

window.Refinans = Refinans;

document.addEventListener('DOMContentLoaded', function() {
  Refinans.start();
});
