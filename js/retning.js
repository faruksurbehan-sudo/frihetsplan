/**
 * Frihetsplanen — retning.js
 * Logikk og rendering for "Finn din balanse"-quizen.
 */

const Retning = {
  nåværende: 0, // indeks i den filtrerte spørsmålslisten
  svar: {},     // spørsmålId -> { alternativId, ... } eller verdi (alder)
  alder: null,

  // ─── HENT GJELDENDE SPØRSMÅLSLISTE (filtrert på visHvis) ─────────────────

  hentSpørsmål: function() {
    return RD.SPØRSMÅL.filter(sp => !sp.visHvis || sp.visHvis({ alder: Retning.alder }));
  },

  // ─── BOOT ──────────────────────────────────────────────────────────────

  start: function() {
    Retning.nåværende = 0;
    Retning.svar = {};
    Retning.alder = null;
    Retning.tegnSpørsmål();
  },

  // ─── NAVIGASJON ────────────────────────────────────────────────────────

  neste: function() {
    const spørsmål = Retning.hentSpørsmål();
    if (Retning.nåværende >= spørsmål.length - 1) {
      Retning.visResultat();
      return;
    }
    Retning.nåværende++;
    Retning.tegnSpørsmål();
  },

  forrige: function() {
    if (Retning.nåværende <= 0) return;
    Retning.nåværende--;
    Retning.tegnSpørsmål();
  },

  velgBransje: function(id) {
    Retning.svar.bransje = id;
    Retning.neste();
  },

  settAlder: function(verdi) {
    const tall = parseInt(verdi, 10);
    if (!tall || tall < 13 || tall > 100) return;
    Retning.alder = tall;
    Retning.svar.alder = tall;
    Retning.neste();
  },

  velgAlternativ: function(spørsmålId, alternativId) {
    Retning.svar[spørsmålId] = alternativId;
    Retning.neste();
  },

  // ─── RENDERING — SPØRSMÅL ──────────────────────────────────────────────

  tegnSpørsmål: function() {
    const container = document.getElementById('rd-quiz-innhold');
    if (!container) return;

    const liste = Retning.hentSpørsmål();
    const sp = liste[Retning.nåværende];
    if (!sp) { Retning.visResultat(); return; }

    const totalt = liste.length;
    const fremdrift = Math.round(((Retning.nåværende) / totalt) * 100);

    let innholdHtml = '';

    if (sp.type === 'bransje') {
      innholdHtml = '<div class="rd-bransje-grid">'
        + RD.BRANSJER.map(b =>
            '<button class="rd-bransje-knapp" onclick="Retning.velgBransje(\'' + b.id + '\')">' + b.label + '</button>'
          ).join('')
        + '</div>';
    } else if (sp.type === 'alder') {
      innholdHtml = '<div class="rd-alder-wrap">'
        + '<input type="number" id="rd-alder-input" class="rd-alder-input" min="13" max="100" placeholder="f.eks. 32" autofocus>'
        + '<button class="rd-knapp-primær" onclick="Retning.settAlder(document.getElementById(\'rd-alder-input\').value)">Neste →</button>'
        + '</div>';
    } else if (sp.type === 'valg') {
      innholdHtml = '<div class="rd-valg-liste">'
        + sp.alternativer.map(alt =>
            '<button class="rd-valg-knapp" onclick="Retning.velgAlternativ(\'' + sp.id + '\', \'' + alt.id + '\')">' + alt.label + '</button>'
          ).join('')
        + '</div>';
    }

    container.innerHTML = '<div class="rd-fremdrift"><div class="rd-fremdrift-bar" style="width:' + fremdrift + '%"></div></div>'
      + '<div class="rd-spm-tittel">' + sp.tittel + '</div>'
      + innholdHtml
      + (Retning.nåværende > 0
          ? '<div class="rd-tilbake-rad"><button class="rd-knapp-tekst" onclick="Retning.forrige()">← Tilbake</button></div>'
          : '');

    // Enter-tast for aldersfelt
    if (sp.type === 'alder') {
      const inp = document.getElementById('rd-alder-input');
      if (inp) {
        inp.addEventListener('keydown', e => {
          if (e.key === 'Enter') Retning.settAlder(inp.value);
        });
      }
    }
  },

  // ─── POENGBEREGNING ────────────────────────────────────────────────────

  beregnPoeng: function() {
    const poeng = {};
    Object.keys(RD.PROFILER).forEach(id => { poeng[id] = 0; });

    // Bransje — lett finjustering
    const bransjeVekt = RD.BRANSJE_VEKT[Retning.svar.bransje];
    if (bransjeVekt) bransjeVekt.forEach(pv => { poeng[pv.profil] += pv.p; });

    // Alle 'valg'-spørsmål
    const liste = Retning.hentSpørsmål();
    liste.filter(sp => sp.type === 'valg').forEach(sp => {
      const svarId = Retning.svar[sp.id];
      const alt = sp.alternativer.find(a => a.id === svarId);
      if (alt && alt.poeng) {
        alt.poeng.forEach(pv => { poeng[pv.profil] += pv.p; });
      }
    });

    return poeng;
  },

  hentTopp3: function() {
    const poeng = Retning.beregnPoeng();
    const sortert = Object.entries(poeng)
      .map(([id, p]) => ({ id, p, ...RD.PROFILER[id] }))
      .sort((a, b) => b.p - a.p);
    const maks = sortert[0] ? sortert[0].p : 1;
    return sortert.slice(0, 3).map(s => ({ ...s, prosent: maks > 0 ? Math.round((s.p / maks) * 100) : 0 }));
  },

  hentAnbefaling: function() {
    const angreSvarId = Retning.svar.angre;
    const angreSpørsmål = RD.SPØRSMÅL.find(sp => sp.id === 'angre');
    const alt = angreSpørsmål.alternativer.find(a => a.id === angreSvarId);
    if (!alt || !alt.anbefaling) return RD.ANBEFALINGER.fullfør;
    return RD.ANBEFALINGER[alt.anbefaling];
  },

  // ─── RESULTAT — pensjonsvisning + profil-søyler + anbefaling ────────────

  visResultat: function() {
    document.getElementById('rd-quiz-skjerm').style.display = 'none';
    const resultatEl = document.getElementById('rd-resultat-skjerm');
    resultatEl.style.display = '';

    const v = { alder: Retning.alder || 35 };
    const ANTATT_SPAREBELØP_MND = 5000;
    const ANTATT_STARTKAPITAL   = 100000;

    const pensjon = Beregn.beregnPensjon(v, ANTATT_SPAREBELØP_MND);
    // Legg til startkapitalens fremtidsverdi (samme rente, samme horisont) — for å reflektere de 100k i startkapital
    const r = FP.RATER;
    const startkapital62 = ANTATT_STARTKAPITAL * Math.pow(1 + r.fondAvkastning, pensjon.årTil62);
    const startkapital67 = ANTATT_STARTKAPITAL * Math.pow(1 + r.fondAvkastning, pensjon.årTil67);
    const pensjon62Total = pensjon.pensjon62 + startkapital62;
    const pensjon67Total = pensjon.pensjon67 + startkapital67;

    const topp3 = Retning.hentTopp3();
    const anbefaling = Retning.hentAnbefaling();

    const pensjonHtml = '<div class="rd-pensjon-seksjon">'
      + '<div class="rd-seksjon-overskrift">Et lite <em>blikk</em> på pensjon</div>'
      + '<p class="rd-seksjon-intro">Basert på 100 000 kr i startkapital og 5 000 kr/mnd i sparing — bare som eksempel, ikke dine egne tall.</p>'
      + '<div class="rd-pensjon-kort-rad">'
      + '<div class="rd-pensjon-kort">'
      + '<div class="rd-pensjon-kort-tittel">Ved 62 år</div>'
      + '<div class="rd-pensjon-kort-verdi">' + fp_fmt(pensjon62Total) + '</div>'
      + '<div class="rd-pensjon-kort-sub">' + pensjon.årTil62 + ' år fra nå</div>'
      + '</div>'
      + '<div class="rd-pensjon-kort">'
      + '<div class="rd-pensjon-kort-tittel">Ved 67 år</div>'
      + '<div class="rd-pensjon-kort-verdi">' + fp_fmt(pensjon67Total) + '</div>'
      + '<div class="rd-pensjon-kort-sub">' + pensjon.årTil67 + ' år fra nå</div>'
      + '</div>'
      + '</div>'
      + '</div>';

    const profilHtml = '<div class="rd-profil-seksjon">'
      + '<div class="rd-seksjon-overskrift">Din <em>balanse</em></div>'
      + '<p class="rd-seksjon-intro">Basert på svarene dine — de tre retningene som passer deg best akkurat nå.</p>'
      + '<div class="rd-søyle-liste">'
      + topp3.map((profil, i) =>
          '<div class="rd-søyle-rad">'
          + '<div class="rd-søyle-ikon">' + profil.ikon + '</div>'
          + '<div class="rd-søyle-innhold">'
          + '<div class="rd-søyle-navn">' + profil.navn + '</div>'
          + '<div class="rd-søyle-bar-wrap"><div class="rd-søyle-bar" style="width:' + profil.prosent + '%"></div></div>'
          + '<div class="rd-søyle-beskrivelse">' + profil.beskrivelse + '</div>'
          + '<div class="rd-søyle-retning">' + profil.retning + '</div>'
          + '</div>'
          + '</div>'
        ).join('')
      + '</div>'
      + '</div>';

    const anbefalingHtml = '<div class="rd-anbefaling-seksjon">'
      + '<div class="rd-anbefaling-tittel">' + anbefaling.tittel + '</div>'
      + '<div class="rd-anbefaling-tekst">' + anbefaling.tekst + '</div>'
      + '<a class="rd-knapp-primær" href="' + anbefaling.lenke + '">' + anbefaling.knapptekst + '</a>'
      + '</div>';

    document.getElementById('rd-resultat-innhold').innerHTML = pensjonHtml + profilHtml + anbefalingHtml;
  },
};

// ─── Hjelpefunksjoner for formattering (samme stil som resten av Frihetsplanen) ──
function fp_fmt(n) {
  return new Intl.NumberFormat('no-NO', { maximumFractionDigits: 0 }).format(Math.round(n)) + ' kr';
}

window.Retning = Retning;

document.addEventListener('DOMContentLoaded', function() {
  Retning.start();
});
