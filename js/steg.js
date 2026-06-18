/**
 * Frihetsplanen — steg.js
 * Steg-navigasjon og tilstandshåndtering.
 * Ingen beregninger, ingen HTML-generering her.
 */

const Steg = {
  nåværende: 1,
  totalt: 4,

  tilstand: {
    valgteMål: [],       // [{ id, ...ekstraFelter }]
    verdier: {},         // feltId -> verdi
    kategorier: {},       // kategoriId -> tilstandId (f.eks. bolig -> 'eier')
    underspørsmål: {},   // underspørsmålId -> tilstandId (f.eks. harUtleiedel -> 'ja')
    resultat: null,
    sisteOptimalisering: null, // settes av Render.visOptimalisering(), brukes av pensjonsskjermen
    pensjonMålValg: null,      // målId brukeren har valgt for "resten går til..."-visningen
  },

  // ─── NAVIGASJON ──────────────────────────────────────────────────────────

  gåTil: function(nr) {
    if (nr < 1 || nr > Steg.totalt) return;
    document.querySelectorAll('.fp-steg').forEach(el => {
      el.classList.toggle('aktiv', parseInt(el.dataset.steg) === nr);
    });
    document.querySelectorAll('.fp-nav-steg').forEach(el => {
      const n = parseInt(el.dataset.nr);
      el.classList.toggle('aktiv', n === nr);
      el.classList.toggle('fullfort', n < nr);
    });
    Steg.nåværende = nr;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (nr >= 3) Steg.oppdaterBeregning();
  },

  neste: function() { Steg.gåTil(Steg.nåværende + 1); },
  forrige: function() { Steg.gåTil(Steg.nåværende - 1); },

  // ─── MÅL-HÅNDTERING ──────────────────────────────────────────────────────

  toggleMål: function(id) {
    const idx = Steg.tilstand.valgteMål.findIndex(m => m.id === id);
    if (idx >= 0) {
      Steg.tilstand.valgteMål.splice(idx, 1);
    } else {
      Steg.tilstand.valgteMål.push({ id });
    }
    Steg.lagreTilstand();
    Render.oppdaterMålvalg();
    Render.oppdaterNesteKnapp1();
  },

  harMål: function(id) {
    return Steg.tilstand.valgteMål.some(m => m.id === id);
  },

  oppdaterMålFelt: function(id, felt, verdi) {
    const mål = Steg.tilstand.valgteMål.find(m => m.id === id);
    if (mål) mål[felt] = verdi;
    Steg.lagreTilstand();
  },

  // ─── KATEGORI-HÅNDTERING (generisk for bolig, transport, vaner osv.) ─────

  settKategoriTilstand: function(katId, tilstandId) {
    Steg.tilstand.kategorier[katId] = tilstandId;
    Steg.lagreTilstand();
    Render.tegnSteg2(); // re-render hele steg 2 siden synlige felt endres
  },

  hentKategoriTilstand: function(katId) {
    const def = FP.KATEGORIER.find(k => k.id === katId);
    return Steg.tilstand.kategorier[katId] || (def ? def.standardTilstand : null);
  },

  settUnderspørsmålTilstand: function(usId, tilstandId) {
    Steg.tilstand.underspørsmål[usId] = tilstandId;
    Steg.lagreTilstand();
    Render.tegnSteg2();
  },

  hentUnderspørsmålTilstand: function(usId, standardTilstand) {
    return Steg.tilstand.underspørsmål[usId] || standardTilstand;
  },

  // ─── FELTVERDI-HÅNDTERING ────────────────────────────────────────────────

  settVerdi: function(id, verdi) {
    Steg.tilstand.verdier[id] = verdi;
    Steg.lagreTilstand();
  },

  hentVerdi: function(id) {
    const felt = FP.FELT[id];
    return Steg.tilstand.verdier[id] ?? (felt ? felt.standard : 0);
  },

  // ─── BYGG FULLT VERDI-OBJEKT FOR BEREGNING ──────────────────────────────
  // Inkluderer feltverdier OG kategori-/underspørsmål-tilstander,
  // slik at både beregn.js og FP.SCENARIOER.relevant() kan lese alt fra ett objekt.

  byggVerdiObjekt: function() {
    const v = {};
    Object.keys(FP.FELT).forEach(id => { v[id] = Steg.hentVerdi(id); });

    // Kategori-tilstander flates ut som vTilstand-felt, f.eks. v.boligTilstand
    FP.KATEGORIER.forEach(kat => {
      const tilstand = Steg.hentKategoriTilstand(kat.id);
      v[kat.id + 'Tilstand'] = tilstand;

      // Underspørsmål — støtter nå både enkelt objekt og liste
      const usRaw = kat.underspørsmål && kat.underspørsmål[tilstand];
      const usList = usRaw ? (Array.isArray(usRaw) ? usRaw : [usRaw]) : [];
      usList.forEach(us => {
        const usTilstand = Steg.hentUnderspørsmålTilstand(us.id, us.standardTilstand);
        v[us.id] = usTilstand;
      });
    });

    return v;
  },

  // ─── BEREGNING ───────────────────────────────────────────────────────────

  oppdaterBeregning: function() {
    const v = Steg.byggVerdiObjekt();
    Steg.tilstand.resultat = Beregn.kjør(v, Steg.tilstand.valgteMål);
    if (Steg.nåværende === 3) Render.tegnSteg3(Steg.tilstand.resultat, v);
    if (Steg.nåværende === 4) Render.tegnSteg4(Steg.tilstand.resultat, v);
  },

  // ─── LAGRING AV BRUKERENS EGNE SVAR (localStorage) ──────────────────────
  // Frihetsplanens egne svar lagres kontinuerlig slik at ingenting nullstilles
  // ved frem/tilbake-navigering i nettleseren eller en utilsiktet sideoppdatering.

  LAGRE_NØKKEL: 'fp_svar_v1',

  lagreTilstand: function() {
    try {
      const snapshot = {
        valgteMål: Steg.tilstand.valgteMål,
        verdier:   Steg.tilstand.verdier,
        kategorier: Steg.tilstand.kategorier,
        underspørsmål: Steg.tilstand.underspørsmål,
        nåværende: Steg.nåværende,
      };
      localStorage.setItem(Steg.LAGRE_NØKKEL, JSON.stringify(snapshot));
    } catch(e) { /* localStorage kan være blokkert i private vinduer */ }
  },

  lastTilstand: function() {
    try {
      const raw = localStorage.getItem(Steg.LAGRE_NØKKEL);
      if (!raw) return false;
      const snapshot = JSON.parse(raw);
      if (snapshot.valgteMål)    Steg.tilstand.valgteMål    = snapshot.valgteMål;
      if (snapshot.verdier)      Steg.tilstand.verdier      = snapshot.verdier;
      if (snapshot.kategorier)   Steg.tilstand.kategorier   = snapshot.kategorier;
      if (snapshot.underspørsmål) Steg.tilstand.underspørsmål = snapshot.underspørsmål;
      return snapshot.nåværende || 1;
    } catch(e) { return false; }
  },

  nullstill: function() {
    const bekreft = window.confirm('Er du sikker? Dette fjerner alle svarene dine og starter helt på nytt.');
    if (!bekreft) return;
    // Fjern Frihetsplanens egne svar
    try { localStorage.removeItem(Steg.LAGRE_NØKKEL); } catch(e) {}
    // Fjern all importert bolig-/bil-data via KH-broen
    if (window.KH) KH.clear();
    // Nullstill tilstand i minnet
    Steg.tilstand.valgteMål = [];
    Steg.tilstand.verdier = {};
    Steg.tilstand.kategorier = {};
    Steg.tilstand.underspørsmål = {};
    Steg.tilstand.resultat = null;
    Steg.tilstand.sisteOptimalisering = null;
    Steg.tilstand.pensjonMålValg = null;
    // Re-render og gå til steg 1
    Render.tegnSteg1();
    Render.tegnSteg2();
    Steg.gåTil(1);
  },

  // ─── LAGRING VIA KH ──────────────────────────────────────────────────────

  lagreKH: function() {
    if (!window.KH || !Steg.tilstand.resultat) return;
    const r = Steg.tilstand.resultat;
    KH.save('frihetsplan', {
      nettoMndInntekt: Math.round(r.nettoMndInntekt),
      ledigMnd: Math.round(r.ledigMnd),
      totalSparingMnd: Math.round(r.totalSparingMnd),
      antallMål: Steg.tilstand.valgteMål.length,
      nærmesteMilepælMåneder: r.milepæler[0]?.måneder || null,
    });
  },
};

window.Steg = Steg;
