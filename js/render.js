/**
 * Frihetsplanen — render.js
 * Tegner HTML fra data. Ingen beregninger her.
 * All string concatenation — ingen nøstede template literals.
 */

const Render = {};

// ─── STEG 1: MÅL-VELGER ───────────────────────────────────────────────────

Render.tegnSteg1 = function() {
  const container = document.getElementById('fp-mål-grid');
  if (!container) return;

  container.innerHTML = FP.MÅL.map(m => {
    const valgt = Steg.harMål(m.id);
    return '<div class="fp-mål-kort' + (valgt ? ' valgt' : '') + '" onclick="Steg.toggleMål(\'' + m.id + '\')" data-id="' + m.id + '">'
      + '<div class="fp-mål-ikon">' + m.ikon + '</div>'
      + '<div class="fp-mål-tittel">' + m.tittel + '</div>'
      + '<div class="fp-mål-sub">' + m.undertittel + '</div>'
      + '<div class="fp-mål-check">' + (valgt ? '✓' : '') + '</div>'
      + '</div>';
  }).join('');
};

Render.oppdaterMålvalg = function() {
  document.querySelectorAll('.fp-mål-kort').forEach(el => {
    const valgt = Steg.harMål(el.dataset.id);
    el.classList.toggle('valgt', valgt);
    const check = el.querySelector('.fp-mål-check');
    if (check) check.textContent = valgt ? '✓' : '';
  });

  const ekstra = document.getElementById('fp-mål-ekstra');
  if (!ekstra) return;
  if (Steg.tilstand.valgteMål.length === 0) {
    ekstra.innerHTML = '';
    return;
  }
  ekstra.innerHTML = Steg.tilstand.valgteMål.map(mål => {
    const def = FP.MÅL.find(m => m.id === mål.id);
    if (!def) return '';
    let html = '<div class="fp-mål-ekstra-rad">'
      + '<span class="fp-mål-ekstra-ikon">' + def.ikon + '</span>'
      + '<span class="fp-mål-ekstra-label">' + def.spørsmål + '</span>'
      + Render.ekstraFeltInput(def, mål)
      + '</div>';

    // Boligbetinget oppfølgingsspørsmål for friår
    if (def.boligOppfølging) {
      const boligTilstand = Steg.hentKategoriTilstand('bolig');
      const oppfølgingTekst = boligTilstand === 'eier'
        ? 'Leier du ut boligen i friåret?'
        : 'Sier du opp leiekontrakten, eller betaler du videre mens du er borte?';
      const valg = boligTilstand === 'eier'
        ? [{ id: 'ja', label: 'Ja, leier ut' }, { id: 'nei', label: 'Nei, lar den stå' }]
        : [{ id: 'si_opp', label: 'Sier opp' }, { id: 'betaler', label: 'Betaler videre' }];
      const nåværende = mål.boligValg || valg[0].id;

      html += '<div class="fp-mål-ekstra-rad fp-mål-oppfølging">'
        + '<span class="fp-mål-ekstra-ikon">🏠</span>'
        + '<span class="fp-mål-ekstra-label">' + oppfølgingTekst + '</span>'
        + '<div class="fp-bryter-gruppe">'
        + valg.map(v => '<button class="fp-bryter' + (nåværende === v.id ? ' aktiv' : '') + '" '
            + 'onclick="Steg.oppdaterMålFelt(\'' + def.id + '\', \'boligValg\', \'' + v.id + '\'); Render.oppdaterMålvalg()">'
            + v.label + '</button>').join('')
        + '</div>'
        + '</div>';
    }

    return html;
  }).join('');
};

Render.ekstraFeltInput = function(def, mål) {
  if (def.fritekst) {
    return '<input type="text" class="fp-tekst-input" placeholder="Beskriv målet ditt" '
      + 'oninput="Steg.oppdaterMålFelt(\'' + def.id + '\', \'fritekst\', this.value)" '
      + 'value="' + (mål.fritekst || '') + '">';
  }
  if (def.enhet === 'år') {
    const v = mål.år || def.standard;
    return '<div class="fp-slider-rad">'
      + '<input type="range" min="' + def.min + '" max="' + def.max + '" step="1" value="' + v + '" '
      + 'oninput="Steg.oppdaterMålFelt(\'' + def.id + '\', \'år\', parseInt(this.value)); this.nextElementSibling.textContent = this.value + \' år\'">'
      + '<span class="fp-slider-val">' + v + ' år</span>'
      + '</div>';
  }
  const v = mål.kr || def.standard;
  const step = Math.max(1000, Math.round(def.max/100/1000)*1000);
  return '<div class="fp-slider-rad">'
    + '<input type="range" min="' + def.min + '" max="' + def.max + '" step="' + step + '" value="' + v + '" '
    + 'oninput="Steg.oppdaterMålFelt(\'' + def.id + '\', \'kr\', parseInt(this.value)); this.nextElementSibling.textContent = fp_fmtM(parseInt(this.value))">'
    + '<span class="fp-slider-val">' + fp_fmtM(v) + '</span>'
    + '</div>';
};

Render.oppdaterNesteKnapp1 = function() {
  const knapp = document.getElementById('fp-neste-1');
  if (!knapp) return;
  const antall = Steg.tilstand.valgteMål.length;
  knapp.disabled = antall === 0;
  knapp.textContent = antall > 0
    ? 'Gå videre med ' + antall + ' mål →'
    : 'Velg minst ett mål';
};

// ─── STEG 2: LIVSSITUASJON ────────────────────────────────────────────────

Render.tegnSteg2 = function() {
  const container = document.getElementById('fp-steg2-innhold');
  if (!container) return;

  // 2a: Kategorier (bryterknapper)
  const kategoriHtml = '<div class="fp-kategori-blokk">'
    + FP.KATEGORIER.map(kat => Render.tegnKategori(kat)).join('')
    + '</div>';

  // 2b: Vanlige felt-seksjoner (jobb, fritid, lån, sparing)
  const seksjonHtml = FP.SEKSJONER.map(sek => {
    const felt = Object.entries(FP.FELT).filter(([_, f]) => f.seksjon === sek.id);
    if (felt.length === 0) return '';
    return '<div class="fp-seksjon">'
      + '<div class="fp-seksjon-header">'
      + '<span class="fp-seksjon-ikon">' + sek.ikon + '</span>'
      + '<span class="fp-seksjon-tittel">' + sek.tittel + '</span>'
      + '</div>'
      + felt.map(([id, f]) => Render.feltRad(id, f)).join('')
      + '</div>';
  }).join('');

  container.innerHTML = kategoriHtml + seksjonHtml;
};

// ─── GENERISK KATEGORI-TEGNING ─────────────────────────────────────────────
// Fungerer for ALLE kategorier (bolig, transport, vaner, fremtidige) uten endring.

Render.tegnKategori = function(kat) {
  const tilstand = Steg.hentKategoriTilstand(kat.id);

  const bryterHtml = '<div class="fp-bryter-gruppe">'
    + kat.tilstander.map(t => '<button class="fp-bryter' + (tilstand === t.id ? ' aktiv' : '') + '" '
        + 'onclick="Steg.settKategoriTilstand(\'' + kat.id + '\', \'' + t.id + '\')">'
        + t.label + '</button>').join('')
    + '</div>';

  // Eksplisitt lenke til relevant kalkulator for denne tilstanden (f.eks. bil-kalkulatoren)
  const lenke = kat.kalkulatorLenke && kat.kalkulatorLenke[tilstand];
  const kalkulatorLenkeHtml = lenke
    ? '<a class="fp-kategori-kalkulator-lenke" href="' + lenke.url + '" target="_blank" rel="noopener">' + lenke.tekst + '</a>'
    : '';

  // Felt for valgt tilstand
  const feltIder = (kat.felt && kat.felt[tilstand]) || [];
  const feltHtml = feltIder.map(id => Render.feltRad(id, FP.FELT[id])).join('');

  // Underspørsmål for valgt tilstand (rekursivt samme mønster)
  // Underspørsmål — støtter nå en liste (array) per tilstand,
  // slik at f.eks. bolig/eier kan ha både "utleiedel" og "separat utleiebolig"
  let underspørsmålHtml = '';
  const usRaw = kat.underspørsmål && kat.underspørsmål[tilstand];
  const usList = usRaw ? (Array.isArray(usRaw) ? usRaw : [usRaw]) : [];

  usList.forEach(us => {
    const usTilstand = Steg.hentUnderspørsmålTilstand(us.id, us.standardTilstand);
    const usBryterHtml = '<div class="fp-bryter-gruppe fp-bryter-liten">'
      + us.tilstander.map(t => '<button class="fp-bryter' + (usTilstand === t.id ? ' aktiv' : '') + '" '
          + 'onclick="Steg.settUnderspørsmålTilstand(\'' + us.id + '\', \'' + t.id + '\')">'
          + t.label + '</button>').join('')
      + '</div>';
    const usFeltIder = (us.felt && us.felt[usTilstand]) || [];
    const usFeltHtml = usFeltIder.map(id => Render.feltRad(id, FP.FELT[id])).join('');

    // Kalkulatorlenke per underspørsmål (kun for separat utleiebolig, ikke utleiedel)
    const usKalkLenke = (us.kalkulatorLenke && usTilstand === 'ja')
      ? '<a href="' + us.kalkulatorLenke.url + '" class="fp-kategori-kalkulator-lenke">'
        + us.kalkulatorLenke.tekst + '</a>'
      : '';

    // Valgfri infobox per underspørsmål
    const usInfoHtml = us.info
      ? '<div class="fp-felt-info" style="margin-bottom:10px;">' + us.info + '</div>'
      : '';

    underspørsmålHtml += '<div class="fp-underspørsmål">'
      + '<div class="fp-underspørsmål-tekst">' + us.spørsmål + '</div>'
      + usBryterHtml
      + usInfoHtml
      + usFeltHtml
      + usKalkLenke
      + '</div>';
  });

  return '<div class="fp-seksjon fp-kategori">'
    + '<div class="fp-seksjon-header">'
    + '<span class="fp-seksjon-ikon">' + kat.ikon + '</span>'
    + '<span class="fp-seksjon-tittel">' + kat.tittel + '</span>'
    + '</div>'
    + '<div class="fp-kategori-innhold">'
    + bryterHtml
    + kalkulatorLenkeHtml
    + feltHtml
    + underspørsmålHtml
    + '</div>'
    + '</div>';
};

Render.feltRad = function(id, f) {
  if (!f) return '';

  // Sjekk om feltet er i konflikt med et annet valg (f.eks. leasing + bilutleie)
  if (f.feltKonflikt) {
    const konflikt = Render.sjekkFeltKonflikt(f.feltKonflikt);
    if (konflikt) {
      return '<div class="fp-felt fp-felt-konflikt">'
        + '<div class="fp-felt-header"><label class="fp-felt-label">' + f.label + '</label></div>'
        + '<div class="fp-konflikt-varsel">⚠ ' + f.feltKonflikt.varsel + '</div>'
        + '</div>';
    }
  }

  const verdi = Steg.hentVerdi(id);
  const visVerdi = Render.formaterVerdi(verdi, f.enhet);

  const importHtml = f.import ? Render.importKort(id, f.import) : '';

  // Etikett kan være en statisk streng eller en funksjon (v) => streng, for felt
  // der teksten skal endre seg basert på resten av brukerens situasjon (f.eks.
  // "Din andel av husleien" når det er flere voksne i husholdningen).
  const label = typeof f.label === 'function' ? f.label(Steg.byggVerdiObjekt()) : f.label;

  return '<div class="fp-felt">'
    + '<div class="fp-felt-header">'
    + '<label class="fp-felt-label">' + label + '</label>'
    + '<span class="fp-felt-val" id="val-' + id + '">' + visVerdi + '</span>'
    + '</div>'
    + (f.info ? '<div class="fp-felt-info">' + f.info + '</div>' : '')
    + importHtml
    + '<input type="range" class="fp-slider" id="felt-' + id + '" '
    + 'min="' + f.min + '" max="' + f.max + '" step="' + f.step + '" value="' + verdi + '" '
    + 'oninput="Render.oppdaterFelt(\'' + id + '\', this.value)">'
    + '</div>';
};

// Sjekker om noen av de oppgitte underspørsmålene har konfliktverdien aktiv
Render.sjekkFeltKonflikt = function(konfliktDef) {
  return konfliktDef.sjekkUnderspørsmål.some(usId => {
    const tilstand = Steg.tilstand.underspørsmål[usId];
    // Ingen lagret tilstand betyr brukeren ikke har endret default (lån) — ingen konflikt
    return tilstand === konfliktDef.konfliktTilstand;
  });
};

// ─── IMPORT-KORT — kobler felt til data fra andre KalkulatorHub-kalkulatorer ──
// Brukeren styrer alltid selv: tallet fylles ALDRI inn automatisk uten et klikk.
// Knappen sier "Oppdater fra kalkulatoren" hvis brukeren allerede har en verdi
// (kan ha justert selv, eller hentet et eldre tall), og "Bruk denne" første gang.

Render.importKort = function(feltId, imp) {
  const khData = (window.KH && KH.get(imp.kalkulator)) || null;
  const importertVerdi = khData ? khData[imp.kilde] : null;

  if (importertVerdi === null || importertVerdi === undefined) {
    return '<div class="fp-import-kort fp-import-mangler">'
      + '<a class="fp-import-lenke" href="' + imp.lenke + '" target="_blank" rel="noopener">' + imp.lenkeTekst + '</a>'
      + '</div>';
  }

  const visVerdi = Render.formaterVerdi(importertVerdi, FP.FELT[feltId].enhet);
  const nåværendeVerdi = Steg.hentVerdi(feltId);
  const allereyeBrukt = Math.abs(nåværendeVerdi - importertVerdi) < 0.01;
  const knappTekst = allereyeBrukt ? 'Oppdater fra kalkulatoren' : 'Bruk denne';

  return '<div class="fp-import-kort fp-import-funnet">'
    + '<span class="fp-import-merke">✓ ' + imp.importTekst + '</span>'
    + '<span class="fp-import-verdi">' + visVerdi + '</span>'
    + '<button class="fp-import-bruk" id="import-knapp-' + feltId + '" onclick="Render.brukImportertVerdi(\'' + feltId + '\', ' + (Math.round(importertVerdi * 100) / 100) + ')">' + knappTekst + '</button>'
    + '</div>';
};

Render.brukImportertVerdi = function(feltId, verdi) {
  Steg.settVerdi(feltId, verdi);
  const slider = document.getElementById('felt-' + feltId);
  if (slider) slider.value = verdi;
  const valEl = document.getElementById('val-' + feltId);
  if (valEl) valEl.textContent = Render.formaterVerdi(verdi, FP.FELT[feltId].enhet);
  // Knappen sier nå "Oppdater fra kalkulatoren" siden verdien er i bruk
  const knappEl = document.getElementById('import-knapp-' + feltId);
  if (knappEl) knappEl.textContent = 'Oppdater fra kalkulatoren';
};

Render.oppdaterFelt = function(id, verdi) {
  const v = parseFloat(verdi);
  Steg.settVerdi(id, v);
  const f = FP.FELT[id];
  const el = document.getElementById('val-' + id);
  if (el) el.textContent = Render.formaterVerdi(v, f.enhet);
};

Render.formaterVerdi = function(v, enhet) {
  if (enhet === 'kr') return fp_fmtM(v);
  if (enhet === 'kr/år') return fp_fmtM(v) + '/år';
  if (enhet === 'kr/mnd') return fp_fmtMnd(v);
  if (enhet === '%') return v.toFixed(1) + ' %';
  if (enhet === 'år') return v + ' år';
  return v;
};

// ─── STEG 3: SKJULTE KOSTNADER ───────────────────────────────────────────

Render.tegnSteg3 = function(res, v) {
  const container = document.getElementById('fp-steg3-innhold');
  if (!container) return;

  const oppsummering = '<div class="fp-økonomi-oversikt">'
    + '<div class="fp-øk-rad">'
    + '<span class="fp-øk-label">Netto månedsinntekt</span>'
    + '<span class="fp-øk-val pos">' + fp_fmtMnd(res.nettoMndInntekt) + '</span>'
    + '</div>'
    + '<div class="fp-øk-rad">'
    + '<span class="fp-øk-label">Din andel av mat og drikke' + (res.antallVoksne > 1 || res.antallBarn > 0 ? ' (' + res.antallVoksne + ' voksne' + (res.antallBarn > 0 ? ', ' + res.antallBarn + ' barn' : '') + ')' : '') + '</span>'
    + '<span class="fp-øk-val neg">− ' + fp_fmtMnd(res.matKostMnd) + '</span>'
    + '</div>'
    + '<div class="fp-øk-rad">'
    + '<span class="fp-øk-label">Andre faste kostnader</span>'
    + '<span class="fp-øk-val neg">− ' + fp_fmtMnd(res.fasterKostMnd - res.matKostMnd) + '</span>'
    + '</div>'
    + '<div class="fp-øk-rad">'
    + '<span class="fp-øk-label">Månedlig sparing</span>'
    + '<span class="fp-øk-val">− ' + fp_fmtMnd(v.sparingMnd) + '</span>'
    + '</div>'
    + '<div class="fp-øk-rad total">'
    + '<span class="fp-øk-label">Ledig kapital</span>'
    + '<span class="fp-øk-val ' + (res.ledigMnd > 0 ? 'pos' : 'neg') + '">' + fp_fmtMnd(res.ledigMnd) + '</span>'
    + '</div>'
    + '</div>';

  const skjulte = res.skjulteKostnader.map(s => {
    return '<div class="fp-innsikt-kort">'
      + '<div class="fp-innsikt-ikon">' + s.ikon + '</div>'
      + '<div class="fp-innsikt-innhold">'
      + '<div class="fp-innsikt-tittel">' + s.tittel + '</div>'
      + '<div class="fp-innsikt-beskriv">' + s.beskriv(res) + '</div>'
      + '<div class="fp-innsikt-innsikt">' + s.innsikt(res) + '</div>'
      + '</div>'
      + '<div class="fp-innsikt-handling">' + s.handling + ' →</div>'
      + '</div>';
  }).join('');

  const tomMelding = res.skjulteKostnader.length === 0
    ? '<div class="fp-tom">Ingen spesielle innsikter funnet basert på din situasjon — du gjør allerede mange smarte valg!</div>'
    : '';

  const visstDuAtHtml = res.skjulteKostnader.length > 0
    ? '<div class="fp-visste-du-at">Visste du at:</div>'
    : '';

  container.innerHTML = oppsummering + visstDuAtHtml + '<div class="fp-innsikt-liste">' + skjulte + '</div>' + tomMelding;

  Render.tegnSammenligningsgraf(v, res);
};

// ─── STEG 3: TRE-GRAF-SAMMENLIGNING ───────────────────────────────────────
// Viser tre kurver over 5 år: alt aktivert i fond / kun oppgitt sparing i fond
// / kun oppgitt sparing i bank (ingen endring). Bruker Chart.js (samme mønster
// som bil- og bolig-kalkulatoren).

Render._sammenligningsgrafInstans = null;

Render.tegnSammenligningsgraf = function(v, res) {
  const container = document.getElementById('fp-steg3-graf');
  if (!container) return;

  const graf = Beregn.beregnSammenligningsgraf(v, res);

  const kurve1Tittel = 'Ingen endring, i banken';
  const kurve2Tittel = 'Bare flytt det du har til fond';
  const kurve3Tittel = 'Med grepene fra listen over, i fond';

  const posterHtml = '<div class="fp-graf-spesifikasjon">'
    + '<div class="fp-graf-spesifikasjon-tittel">Slik er ' + fp_fmtMnd(graf.kurve3Mnd) + ' i den grønne kurven satt sammen:</div>'
    + '<div class="fp-graf-spes-rad"><span>Ledig kapital (inntekt minus faste kostnader og sparing), 10% buffer holdt utenfor</span><strong>' + fp_fmtMnd(graf.ledigKapitalMnd) + '</strong></div>'
    + graf.poster.map(p => '<div class="fp-graf-spes-rad"><span>' + p.label + '</span><strong>+ ' + fp_fmtMnd(p.beløpMnd) + '</strong></div>').join('')
    + (graf.poster.length === 0 ? '<div class="fp-graf-spes-rad fp-graf-spes-tom"><span>Ingen ekstra grep fra steg 3 var aktuelle for din situasjon</span></div>' : '')
    + (graf.startKapital > 0 ? '<div class="fp-graf-spes-rad"><span>Kontantbeholdning flyttet til fond (engangsbeløp ved start, 10% buffer holdt utenfor)</span><strong>' + fp_fmt(graf.startKapital) + '</strong></div>' : '')
    + '</div>';

  container.innerHTML = '<div class="fp-graf-wrap">'
    + '<div class="fp-graf-tittel">Hva pengene dine kan bli om 5 år</div>'
    + '<div class="fp-graf-intro">Tre måter å se det an på, gitt 5 års sparing fremover. Alle tre holder 10% av ledig kapital og kontantbeholdning utenfor, som en realistisk buffer.</div>'
    + '<div class="fp-graf-legende">'
    + '<span class="fp-graf-legende-rad"><span class="fp-graf-prikk kurve1"></span>' + kurve1Tittel + ' — ' + fp_fmtMnd(graf.kurve1Mnd) + '</span>'
    + '<span class="fp-graf-legende-rad"><span class="fp-graf-prikk kurve2"></span>' + kurve2Tittel + ' — ' + fp_fmtMnd(graf.kurve2Mnd) + '</span>'
    + '<span class="fp-graf-legende-rad"><span class="fp-graf-prikk kurve3"></span>' + kurve3Tittel + ' — ' + fp_fmtMnd(graf.kurve3Mnd) + '</span>'
    + '</div>'
    + posterHtml
    + '<canvas id="fp-graf-canvas" height="280"></canvas>'
    + '<div class="fp-graf-sluttverdier">'
    + '<div class="fp-graf-sluttverdi kurve1"><span>Om 5 år, ingen endring i banken</span><strong>' + fp_fmt(graf.sluttverdi1) + '</strong></div>'
    + '<div class="fp-graf-sluttverdi kurve2"><span>Om 5 år, bare flyttet til fond</span><strong>' + fp_fmt(graf.sluttverdi2) + '</strong></div>'
    + '<div class="fp-graf-sluttverdi kurve3"><span>Om 5 år, med grepene i fond</span><strong>' + fp_fmt(graf.sluttverdi3) + '</strong></div>'
    + '</div>'
    + '</div>';

  if (typeof Chart === 'undefined') return; // graceful hvis Chart.js ikke lastet (f.eks. offline)

  const canvas = document.getElementById('fp-graf-canvas');
  if (!canvas) return;

  if (Render._sammenligningsgrafInstans) {
    Render._sammenligningsgrafInstans.destroy();
  }

  const labels = graf.data.kurve1.map((_, i) => i % 12 === 0 ? (i / 12) + ' år' : '');

  Render._sammenligningsgrafInstans = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: kurve3Tittel, data: graf.data.kurve3, borderColor: '#3a7a5a', backgroundColor: 'transparent', borderWidth: 3, pointRadius: 0, tension: 0.2 },
        { label: kurve2Tittel, data: graf.data.kurve2, borderColor: '#c17a3a', backgroundColor: 'transparent', borderWidth: 2, pointRadius: 0, tension: 0.2 },
        { label: kurve1Tittel, data: graf.data.kurve1, borderColor: '#8a8078', backgroundColor: 'transparent', borderWidth: 2, borderDash: [4, 4], pointRadius: 0, tension: 0.2 },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#8a8078', font: { family: 'IBM Plex Mono', size: 10 } }, grid: { color: '#e8e2d6' } },
        y: { ticks: { color: '#8a8078', font: { family: 'IBM Plex Mono', size: 10 }, callback: v => Math.round(v / 1000) + 'k' }, grid: { color: '#e8e2d6' } },
      },
    },
  });
};

// ─── STEG 4: FRIHETSPLANEN ───────────────────────────────────────────────

Render.tegnSteg4 = function(res, v) {
  const container = document.getElementById('fp-steg4-innhold');
  if (!container) return;

  if (res.milepæler.length === 0) {
    container.innerHTML = '<div class="fp-tom">Velg mål i steg 1 for å se frihetsplanen din.</div>';
    return;
  }

  const milepæler = res.milepæler.map((m, i) => {
    const tidTekst = m.nådd
      ? 'Du er allerede der!'
      : m.måneder === Infinity
        ? 'Krever høyere sparing'
        : m.år === 0
          ? 'Om ' + m.mndRest + ' måneder'
          : 'Om ' + m.år + ' år' + (m.mndRest > 0 ? ' og ' + m.mndRest + ' mnd' : '');

    const grepHtml = m.grep.length > 0
      ? '<div class="fp-grep-liste">' + m.grep.map(g => '<div class="fp-grep">→ ' + g + '</div>').join('') + '</div>'
      : '';

    return '<div class="fp-milepæl' + (i === 0 ? ' nærmest' : '') + '">'
      + '<div class="fp-milepæl-tid">' + tidTekst + '</div>'
      + '<div class="fp-milepæl-ikon">' + m.ikon + '</div>'
      + '<div class="fp-milepæl-innhold">'
      + '<div class="fp-milepæl-tittel">' + m.beskrivelse + '</div>'
      + '<div class="fp-milepæl-kostnad">' + fp_fmtM(m.kostnad) + '</div>'
      + grepHtml
      + '</div>'
      + '</div>';
  }).join('');

  const nåddAntall = res.milepæler.filter(m => m.nådd).length;
  const totalt = res.milepæler.length;

  const oppsummering = '<div class="fp-score">'
    + '<div class="fp-score-label">Din frihetsplan — uten ekstra tiltak</div>'
    + '<div class="fp-score-tall">' + nåddAntall + ' / ' + totalt + '</div>'
    + '<div class="fp-score-sub">mål allerede innenfor rekkevidde, basert på tallene du har oppgitt</div>'
    + '</div>'
    + '<div class="fp-uten-tiltak-varsel">Dette er planen din slik den er <strong>i dag</strong> — uten å gjøre noen av grepene fra forrige steg. Trykk på knappen under for å se hvor mye raskere du kan nå målene.</div>';

  container.innerHTML = oppsummering + '<div class="fp-tidslinje">' + milepæler + '</div>';

  Render.tegnOptimaliserKnapp(v, res);
  Render.tegnDelKort(res);

  Steg.lagreKH();
};

// ─── "HJELP MEG Å NÅ MÅLET MITT" — fire faste regler, ingen brukerjustering ─

Render.tegnOptimaliserKnapp = function(v, res) {
  const container = document.getElementById('fp-optimaliser-knapp');
  if (!container) return;

  if (res.milepæler.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = '<div class="fp-knapp-rad" style="justify-content:center;margin:32px 0;">'
    + '<button class="fp-knapp fp-knapp-primær" onclick="Render.visOptimalisering()">Hjelp meg å nå målet mitt →</button>'
    + '</div>';
};

Render.visOptimalisering = function() {
  const v = Steg.byggVerdiObjekt();
  const res = Steg.tilstand.resultat;
  if (!res) return;

  const opt = Beregn.optimaliser(v, res);
  const resJustert = Beregn.kjør(opt.vJustert, Steg.tilstand.valgteMål);

  Steg.tilstand.sisteOptimalisering = { opt, resJustert, vJustert: opt.vJustert };

  const container = document.getElementById('fp-optimaliser-resultat');
  if (!container) return;

  const tiltakHtml = opt.tiltak.map(t => {
    const beløpTekst = t.type === 'engangsbeløp'
      ? fp_fmt(t.beløpEngang) + ' (engangsbeløp)'
      : fp_fmtMnd(t.beløpMnd) + ' ekstra';
    return '<div class="fp-tiltak-rad">'
      + '<span class="fp-tiltak-tekst">' + t.tekst + '</span>'
      + '<span class="fp-tiltak-beløp">' + beløpTekst + '</span>'
      + '</div>';
  }).join('');

  // Hvis ingen av de fire fastregelene fant noe å hente (ingen kontantbeholdning,
  // ingen eksisterende sparing, ikke boliglån som kan refinansieres, og ingen
  // styrbare kostnader på fritid/restaurant/reise), gir vi en ærlig forklaring
  // i stedet for en tom liste og en sammenligning som ser ut som en feil
  // (samme tid før og etter, uten at brukeren forstår hvorfor).
  if (opt.tiltak.length === 0) {
    container.innerHTML = '<div class="fp-optimalisering-kort">'
      + '<div class="fp-optimalisering-tittel">Ingen umiddelbare grep å hente akkurat nå</div>'
      + '<div class="fp-optimalisering-intro">Basert på tallene du har oppgitt, finner vi ikke kontantbeholdning, eksisterende sparing, boliglån å refinansiere, eller styrbare kostnader (fritid/restaurant/reise) å hente noe fra. Det betyr ikke at planen din står stille — det betyr at det neste store steget sannsynligvis er å begynne å sette av noe til sparing hver måned, om du har mulighet til det.</div>'
      + '</div>';
    return;
  }

  const nærmesteForr = res.milepæler[0];
  const nærmesteEtter = resJustert.milepæler[0]; // det FAKTISK nærmeste målet etter optimalisering — kan være et annet mål enn før

  let sammenligningHtml = '';
  if (nærmesteForr && nærmesteEtter && nærmesteForr.måneder !== Infinity) {
    const forrTekst = nærmesteForr.år + ' år' + (nærmesteForr.mndRest > 0 ? ' og ' + nærmesteForr.mndRest + ' mnd' : '');
    const etterTekst = nærmesteEtter.måneder === Infinity ? 'fortsatt usikkert' : (nærmesteEtter.år + ' år' + (nærmesteEtter.mndRest > 0 ? ' og ' + nærmesteEtter.mndRest + ' mnd' : ''));
    const byttetMål = nærmesteForr.id !== nærmesteEtter.id;

    sammenligningHtml = '<div class="fp-optimalisering-sammenligning">'
      + '<div class="fp-sammenligning-rad"><span>Før — ' + nærmesteForr.beskrivelse + '</span><strong>' + forrTekst + '</strong></div>'
      + '<div class="fp-sammenligning-pil">→</div>'
      + '<div class="fp-sammenligning-rad ny"><span>Med disse grepene' + (byttetMål ? ' — nå er ' + nærmesteEtter.beskrivelse.toLowerCase() + ' nærmest' : '') + '</span><strong>' + etterTekst + '</strong></div>'
      + '</div>';

    if (byttetMål) {
      sammenligningHtml += '<div class="fp-optimalisering-note">Disse grepene gjør alle målene dine raskere — men i forskjellig grad, så hvilket mål som er nærmest kan endre seg.</div>';
    }
  }

  container.innerHTML = '<div class="fp-optimalisering-kort">'
    + '<div class="fp-optimalisering-tittel">Konkret handlingsplan</div>'
    + '<div class="fp-optimalisering-intro">Disse grepene er trygge og realistiske — gjør så mange du vil:</div>'
    + '<div class="fp-tiltak-liste">' + tiltakHtml + '</div>'
    + sammenligningHtml
    + '</div>';
};

// ─── DELBART STORY-BILDE — for Instagram/Snap/TikTok ──────────────────────
// Tegner et portrettformat-kort direkte på canvas og eksporterer som PNG.

Render.tegnDelKort = function(res) {
  const container = document.getElementById('fp-del-kort');
  if (!container || res.milepæler.length === 0) {
    if (container) container.innerHTML = '';
    return;
  }

  container.innerHTML = '<div class="fp-knapp-rad" style="justify-content:center;margin:24px 0;">'
    + '<button class="fp-knapp fp-knapp-sekundær" onclick="Render.lastNedDelKort()">Last ned som bilde 📲</button>'
    + '</div>';
};

Render.lastNedDelKort = function() {
  const res = Steg.tilstand.resultat;
  if (!res || res.milepæler.length === 0) return;

  const nærmeste = res.milepæler.slice(0, 3);

  const w = 1080, h = 1920; // story-format
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return; // canvas 2d ikke tilgjengelig i dette miljøet

  // Bakgrunn
  ctx.fillStyle = '#f7f4ef';
  ctx.fillRect(0, 0, w, h);

  // Header
  ctx.fillStyle = '#c17a3a';
  ctx.font = '600 56px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('Frihetsplanen', w / 2, 180);

  ctx.fillStyle = '#1a1714';
  ctx.font = '400 36px Georgia, serif';
  ctx.fillText('Min vei mot frihet', w / 2, 250);

  // Milepæl-kort
  let y = 400;
  nærmeste.forEach((m, i) => {
    const kortH = 320;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(80, y, w - 160, kortH);
    ctx.strokeStyle = '#e0d9ce';
    ctx.lineWidth = 2;
    ctx.strokeRect(80, y, w - 160, kortH);

    ctx.fillStyle = '#c17a3a';
    ctx.font = '700 64px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(m.ikon, 120, y + 100);

    ctx.fillStyle = '#1a1714';
    ctx.font = '600 38px Arial';
    ctx.fillText(m.beskrivelse, 220, y + 90);

    ctx.fillStyle = '#8a8078';
    ctx.font = '400 30px Arial';
    const tidTekst = m.nådd ? 'Allerede innenfor rekkevidde!' : (m.måneder === Infinity ? 'Krever høyere sparing' : 'Om ' + m.år + ' år' + (m.mndRest > 0 ? ' og ' + m.mndRest + ' mnd' : ''));
    ctx.fillText(tidTekst, 220, y + 140);

    ctx.fillStyle = '#3a7a5a';
    ctx.font = '700 44px Arial';
    ctx.fillText(fp_fmt(m.kostnad), 220, y + 210);

    y += kortH + 40;
  });

  ctx.fillStyle = '#8a8078';
  ctx.font = '400 28px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('frihetsplan.no', w / 2, h - 80);

  const lenke = document.createElement('a');
  lenke.download = 'frihetsplanen-min-plan.png';
  lenke.href = canvas.toDataURL('image/png');
  lenke.click();
};

// ─── PENSJONSSKJERM — separat, utenfor hovedflyten ────────────────────────

Render.visPensjonsskjerm = function() {
  // Sørg for at vi har en optimalisering å vise frem til (kjør den hvis ikke gjort enda)
  if (!Steg.tilstand.sisteOptimalisering) {
    Render.visOptimalisering();
  }

  document.querySelectorAll('.fp-steg').forEach(el => el.classList.remove('aktiv'));
  const pensjonEl = document.getElementById('fp-pensjon-skjerm');
  if (pensjonEl) pensjonEl.style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });

  Render.tegnPensjonsskjerm();
};

Render.lukkPensjonsskjerm = function() {
  const pensjonEl = document.getElementById('fp-pensjon-skjerm');
  if (pensjonEl) pensjonEl.style.display = 'none';
  document.querySelectorAll('.fp-steg').forEach(el => {
    el.classList.toggle('aktiv', parseInt(el.dataset.steg) === 4);
  });
};

Render.tegnPensjonsskjerm = function() {
  const container = document.getElementById('fp-pensjon-innhold');
  if (!container) return;

  const v = Steg.byggVerdiObjekt();

  // Beregn alltid milepæler ferskt her (ikke avhengig av at Steg.tilstand.resultat
  // ble oppdatert sist gang steg 3/4 ble besøkt) — sikrer korrekt mål-kostnad
  // selv om brukeren har lagt til eller endret mål mens pensjonsskjermen er åpen.
  const ferskResultat = Beregn.kjør(v, Steg.tilstand.valgteMål);

  // Pensjonsberegningen skal bruke SAMME fulle månedlige sparepotensial som
  // steg 3-grafens kurve 3 (ledig kapital + alle relevante tiltak) — ikke bare
  // den smalere "ekstraMndTilFond" fra optimaliser() (som kun er refinansiering
  // + kostnadskutt). Vi trekker fra en ekstra 10% buffer fordi 27-32 år er en
  // lang horisont, og livet byr på uforutsette ting man vil bruke penger på —
  // det er ikke realistisk å forvente å spare hele potensialet hvert år i flere tiår.
  const grafFersk = Beregn.beregnSammenligningsgraf(v, ferskResultat);
  const LANGSIKTIG_BUFFER = 0.9;
  const totalSparepotensialMnd = grafFersk.kurve3Mnd * LANGSIKTIG_BUFFER;

  const pensjon = Beregn.beregnPensjon(v, totalSparepotensialMnd);

  const fordelingHtml = '<div class="fp-pensjon-fordeling">'
    + 'Av sparepotensialet ditt setter vi av <strong>' + fp_fmtMnd(pensjon.halvpart) + '</strong> til pensjon her — '
    + 'de resterende <strong>' + fp_fmtMnd(pensjon.restTilLivetMnd) + '</strong> er fortsatt fritt tilgjengelig til livet nå (mål, friår, alt det andre i planen din).'
    + '</div>';

  const kortHtml = fordelingHtml
    + '<div class="fp-pensjon-kort-rad">'
    + '<div class="fp-pensjon-kort">'
    + '<div class="fp-pensjon-kort-tittel">Pensjonist ved 62</div>'
    + '<div class="fp-pensjon-kort-verdi">' + fp_fmt(pensjon.pensjon62) + '</div>'
    + '<div class="fp-pensjon-kort-sub">' + pensjon.årTil62 + ' år fra nå, av ' + fp_fmtMnd(pensjon.halvpart) + ' investert i fond</div>'
    + '</div>'
    + '<div class="fp-pensjon-kort">'
    + '<div class="fp-pensjon-kort-tittel">Pensjonist ved 67</div>'
    + '<div class="fp-pensjon-kort-verdi">' + fp_fmt(pensjon.pensjon67) + '</div>'
    + '<div class="fp-pensjon-kort-sub">' + pensjon.årTil67 + ' år fra nå, av ' + fp_fmtMnd(pensjon.halvpart) + ' investert i fond</div>'
    + '</div>'
    + '</div>'
    + '<div class="fp-uten-tiltak-varsel">Dette er bare <strong>halvparten</strong> av sparepotensialet ditt, ikke alt — og vi har i tillegg regnet med <strong>10% mindre</strong> sparing enn det fulle potensialet du ser i "Skjulte penger", fordi dette er et langsiktig anslag og livet byr på muligheter (og uforutsette utgifter) som gjør at man sjelden sparer akkurat maks hvert år i 27-32 år.</div>';

  const valgteMål = Steg.tilstand.valgteMål;
  const målValgHtml = valgteMål.length > 0
    ? '<div class="fp-bryter-gruppe">' + valgteMål.map(m => {
        const def = FP.MÅL.find(d => d.id === m.id);
        const valgtId = Steg.tilstand.pensjonMålValg || valgteMål[0].id;
        return '<button class="fp-bryter' + (valgtId === m.id ? ' aktiv' : '') + '" '
          + 'onclick="Steg.tilstand.pensjonMålValg=\'' + m.id + '\'; Render.tegnPensjonsskjerm()">'
          + (def ? def.tittel : m.id) + '</button>';
      }).join('') + '</div>'
    : '';

  const valgtMålId = Steg.tilstand.pensjonMålValg || (valgteMål[0] && valgteMål[0].id);
  const valgtMålDef = FP.MÅL.find(d => d.id === valgtMålId);

  // Finn faktisk kr-kostnad for det valgte målet via den allerede beregnede milepælen
  // (samme tall som vises i steg 4 — unngår å duplisere kostnadslogikk per måltype).
  const milepælForMål = ferskResultat.milepæler.find(m => m.id === valgtMålId);
  const målKostnad = milepælForMål ? milepælForMål.kostnad : null;

  const lagAntallGangerTekst = (sum) => {
    if (!målKostnad || målKostnad <= 0) return null;
    const antall = sum / målKostnad;
    if (antall < 1) return 'omtrent ' + Math.round(antall * 100) + '% av ' + valgtMålDef.tittel.toLowerCase();
    if (antall < 1.5) return 'nok til ' + valgtMålDef.tittel.toLowerCase();
    return 'nok til ' + antall.toFixed(1).replace('.0', '') + ' ganger ' + valgtMålDef.tittel.toLowerCase();
  };

  const restHtml = valgtMålDef && målKostnad
    ? '<div class="fp-pensjon-rest">'
      + '<div class="fp-pensjon-rest-emoji">😊</div>'
      + '<div class="fp-pensjon-rest-tittel">Og de andre 50%?</div>'
      + '<div class="fp-pensjon-rest-tekst">Samme sparing — bare til deg selv, nå. Ved 62 år er det ' + lagAntallGangerTekst(pensjon.pensjon62) + '. Ved 67 år er det ' + lagAntallGangerTekst(pensjon.pensjon67) + '. Du trenger ikke velge.</div>'
      + målValgHtml
      + '</div>'
    : '<div class="fp-pensjon-rest">'
      + '<div class="fp-pensjon-rest-emoji">😊</div>'
      + '<div class="fp-pensjon-rest-tittel">Og de andre 50%?</div>'
      + '<div class="fp-pensjon-rest-tekst">Det er fortsatt ' + fp_fmt(pensjon.pensjon67) + ' (ved 67 år) til livet du faktisk vil leve nå — du trenger ikke velge.</div>'
      + '</div>';

  container.innerHTML = kortHtml + restHtml;
};

window.Render = Render;
