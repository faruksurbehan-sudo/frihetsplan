/* © 2026 Frihetsplanen (frihetsplan.no). Alle rettigheter forbeholdt. */
/**
 * Frihetsplanen — refinans.js
 * Logikk og rendering for refinansieringssiden.
 */

const Refinans = {
  LAGRE_NØKKEL: 'fp_refinans_v1',

  tilstand: {
    lån: [], // [{ id, beløp, rente, løpetid }] — én rad per RF.LÅNETYPER
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
      beløp: type.beløp.standard,
      rente: type.rente.standard,
      løpetid: type.løpetid.standard,
    }));
  },

  // ─── IMPORT FRA FRIHETSPLANEN (localStorage, samme mønster som Steg) ────

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
    } catch (e) { /* localStorage kan være blokkert */ }
  },

  lastTilstand: function() {
    try {
      const raw = localStorage.getItem(Refinans.LAGRE_NØKKEL);
      if (!raw) return false;
      const snapshot = JSON.parse(raw);
      if (snapshot.lån && snapshot.lån.length === RF.LÅNETYPER.length) {
        Refinans.tilstand.lån = snapshot.lån;
        return true;
      }
      return false;
    } catch (e) { return false; }
  },

  // ─── SKYVER-HÅNDTERING ───────────────────────────────────────────────

  settVerdi: function(typeId, felt, verdi) {
    const rad = Refinans.tilstand.lån.find(l => l.id === typeId);
    if (!rad) return;
    rad[felt] = parseFloat(verdi);
    Refinans.lagreTilstand();
    Refinans.oppdaterResultat();
    Refinans.oppdaterVisteVerdier(typeId);
  },

  oppdaterVisteVerdier: function(typeId) {
    const rad = Refinans.tilstand.lån.find(l => l.id === typeId);
    if (!rad) return;
    const elBeløp = document.getElementById('rf-val-' + typeId + '-beløp');
    const elRente = document.getElementById('rf-val-' + typeId + '-rente');
    const elLøpetid = document.getElementById('rf-val-' + typeId + '-løpetid');
    if (elBeløp) elBeløp.textContent = fp_fmt(rad.beløp);
    if (elRente) elRente.textContent = rad.rente.toFixed(1) + ' %';
    if (elLøpetid) elLøpetid.textContent = rad.løpetid + ' år';
  },

  // ─── RENDERING — SKYVERE ───────────────────────────────────────────────

  tegnSkyvere: function() {
    const container = document.getElementById('rf-skyvere');
    if (!container) return;

    const harFrihetsplanData = !!Refinans.hentFraFrihetsplanen();

    const importBannerHtml = harFrihetsplanData
      ? '<div class="rf-import-banner">'
        + '<span>Vi fant tall fra Frihetsplanen din.</span>'
        + '<button class="rf-knapp-liten" onclick="Refinans.importerFraFrihetsplanen()">Hent dem inn</button>'
        + '</div>'
      : '';

    const radHtml = RF.LÅNETYPER.map(type => {
      const rad = Refinans.tilstand.lån.find(l => l.id === type.id);
      const infoHtml = type.id === 'bil'
        ? '<div class="rf-infoboks">ℹ Bilutleieinntekt regnes normalt ikke med i bankens offisielle lånekapasitet, siden den ikke er en fast, kontraktsfestet inntekt. Men den viser initiativ og økonomisk handlekraft — noe en saksbehandler kan velge å vektlegge positivt i en helhetsvurdering.</div>'
        : '';

      return '<div class="rf-lån-kort">'
        + '<div class="rf-lån-header"><span class="rf-lån-ikon">' + type.ikon + '</span><span class="rf-lån-navn">' + type.navn + '</span></div>'
        + '<div class="rf-felt">'
        + '<label>Lånebeløp</label>'
        + '<div class="rf-felt-rad"><input type="range" min="' + type.beløp.min + '" max="' + type.beløp.max + '" step="' + type.beløp.step + '" value="' + rad.beløp + '" oninput="Refinans.settVerdi(\'' + type.id + '\',\'beløp\',this.value)"><span class="rf-val" id="rf-val-' + type.id + '-beløp">' + fp_fmt(rad.beløp) + '</span></div>'
        + '</div>'
        + '<div class="rf-felt">'
        + '<label>Rente</label>'
        + '<div class="rf-felt-rad"><input type="range" min="' + type.rente.min + '" max="' + type.rente.max + '" step="' + type.rente.step + '" value="' + rad.rente + '" oninput="Refinans.settVerdi(\'' + type.id + '\',\'rente\',this.value)"><span class="rf-val" id="rf-val-' + type.id + '-rente">' + rad.rente.toFixed(1) + ' %</span></div>'
        + '</div>'
        + '<div class="rf-felt">'
        + '<label>Løpetid</label>'
        + '<div class="rf-felt-rad"><input type="range" min="' + type.løpetid.min + '" max="' + type.løpetid.max + '" step="' + type.løpetid.step + '" value="' + rad.løpetid + '" oninput="Refinans.settVerdi(\'' + type.id + '\',\'løpetid\',this.value)"><span class="rf-val" id="rf-val-' + type.id + '-løpetid">' + rad.løpetid + ' år</span></div>'
        + '</div>'
        + infoHtml
        + '</div>';
    }).join('');

    container.innerHTML = importBannerHtml + radHtml;
  },

  // ─── RENDERING — RESULTAT ──────────────────────────────────────────────

  oppdaterResultat: function() {
    const container = document.getElementById('rf-resultat');
    if (!container) return;

    const res = RF.beregnBesparelse(Refinans.tilstand.lån);

    if (res.totalGjeld === 0) {
      container.innerHTML = '<div class="rf-tom-melding">Legg inn lånene dine over for å se hva refinansiering kan spare deg.</div>';
      return;
    }

    container.innerHTML = '<div class="rf-resultat-kort">'
      + '<div class="rf-resultat-rad"><span>Samlet gjeld</span><strong>' + fp_fmt(res.totalGjeld) + '</strong></div>'
      + '<div class="rf-resultat-rad"><span>Veid snittrente i dag</span><strong>' + res.veidSnittrente.toFixed(2) + ' %</strong></div>'
      + '<div class="rf-resultat-rad rf-resultat-hovedrad">'
      + '<span>Estimert besparelse</span>'
      + '<strong>' + fp_fmt(res.besparelseMndMin) + ' – ' + fp_fmt(res.besparelseMndMaks) + '/mnd</strong>'
      + '</div>'
      + '<div class="rf-resultat-sub">Tilsvarer ' + fp_fmt(res.besparelseÅrMin) + ' – ' + fp_fmt(res.besparelseÅrMaks) + ' i året, ved ' + res.minReduksjon.toFixed(1) + '–' + res.maksReduksjon.toFixed(1) + ' prosentpoeng lavere rente på samlet gjeld.</div>'
      + '</div>';
  },

  // ─── TILBYDERE (tom liste nå, forberedt for fremtidige betalte plasseringer) ──

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
    RF.LÅNETYPER.forEach(type => {
      const rad = Refinans.tilstand.lån.find(l => l.id === type.id);
      if (rad.beløp > 0) {
        linjer.push(type.navn + ': ' + fp_fmt(rad.beløp) + ' · ' + rad.rente.toFixed(1) + ' % · ' + rad.løpetid + ' år');
      }
    });
    linjer.push('');
    linjer.push('Samlet gjeld: ' + fp_fmt(res.totalGjeld));
    linjer.push('Veid snittrente: ' + res.veidSnittrente.toFixed(2) + ' %');
    linjer.push('Estimert besparelse: ' + fp_fmt(res.besparelseMndMin) + ' – ' + fp_fmt(res.besparelseMndMaks) + '/mnd');
    return linjer.join('\n');
  },

  sendHenvendelse: function() {
    const navn = document.getElementById('rf-lead-navn').value.trim();
    const epost = document.getElementById('rf-lead-epost').value.trim();
    if (!navn || !epost) {
      alert('Fyll inn navn og e-post først.');
      return;
    }
    const kropp = 'Navn: ' + navn + '\nE-post: ' + epost + '\n\n' + Refinans.byggLeadTekst();
    const emne = 'Refinansieringshenvendelse fra ' + navn;
    const lenke = 'mailto:admin@frihetsplan.no?subject=' + encodeURIComponent(emne) + '&body=' + encodeURIComponent(kropp);
    window.location.href = lenke;
  },
};

window.Refinans = Refinans;

document.addEventListener('DOMContentLoaded', function() {
  Refinans.start();
});
