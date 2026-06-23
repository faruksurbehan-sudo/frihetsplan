/**
 * Frihetsplanen — beregn.js
 * All beregningslogikk. Ingen HTML her.
 * Input: v = byggVerdiObjekt() fra steg.js (feltverdier + kategori-tilstander).
 */

const Beregn = {};

// ─── HJELPEFUNKSJONER ──────────────────────────────────────────────────────

Beregn.annuitetÅr = function(lån, rente, lopetidÅr) {
  if (lån <= 0 || lopetidÅr <= 0) return 0;
  const r = rente / 100 / 12;
  const n = lopetidÅr * 12;
  if (r === 0) return lån / lopetidÅr;
  return (lån * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)) * 12;
};

Beregn.FV = function(PV, rente, år) {
  return PV * Math.pow(1 + rente, år);
};

Beregn.FVmnd = function(mndBelop, rente, år) {
  if (rente === 0) return mndBelop * 12 * år;
  return mndBelop * 12 * ((Math.pow(1 + rente, år) - 1) / rente);
};

Beregn.NV = function(FV, rente, år) {
  return FV / Math.pow(1 + rente, år);
};

Beregn.månederTilMål = function(mål, mndSparing, startKapital, rente) {
  // Selv om startkapital alene dekker målet, viser vi alltid en tidslinje.
  // Frihetsplanen anbefaler aldri å tømme beholdningen — man skal spare seg frem.
  // Return 0 fjernet bevisst: "0 måneder" gir "allerede der", som er feil signal.
  if (mndSparing <= 0 && startKapital < mål) return Infinity;
  if (mndSparing <= 0 && startKapital >= mål) {
    // Har kapital nok, men ingen løpende sparing — returner et symbolsk tall
    // som signaliserer "du kan nå dette uten mer sparing, men bruk ikke opp beholdningen"
    return 1; // vises som "Om 1 måned" — overskrives av nåddViaKapital-flagget i render
  }
  const r = rente / 12;
  let kapital = startKapital;
  for (let m = 1; m <= 600; m++) {
    kapital = kapital * (1 + r) + mndSparing;
    if (kapital >= mål) return m;
  }
  return Infinity;
};

// ─── HOVEDBEREGNING ────────────────────────────────────────────────────────

Beregn.kjør = function(v, valgteMål) {
  const r = FP.RATER;

  // ── Inntekt ──
  const nettoMndInntekt = v.inntekt * 0.67 / 12;

  // ── Bolig: forgrenet på boligTilstand ──
  let boligTermÅr = 0, boligRenteÅr = 0, boligAvdragÅr = 0;
  let refinansSparingMnd = 0, refinansOver10år = 0, refinansIFond = 0;
  let rammelånBesparelseÅr = 0;
  let boligKostMnd = 0; // total boligkostnad uansett eier/leier

  if (v.boligTilstand === 'eier') {
    boligTermÅr   = Beregn.annuitetÅr(v.boligLån, v.boligRente, 25);
    boligRenteÅr  = v.boligLån * v.boligRente / 100;
    boligAvdragÅr = boligTermÅr - boligRenteÅr;
    boligKostMnd  = boligTermÅr / 12;

    const refinansRente      = Math.max(0, v.boligRente - 0.5);
    const refinansTermÅr     = Beregn.annuitetÅr(v.boligLån, refinansRente, 25);
    refinansSparingMnd        = (boligTermÅr - refinansTermÅr) / 12;
    refinansOver10år          = refinansSparingMnd * 12 * 10;
    refinansIFond              = Beregn.FVmnd(refinansSparingMnd, r.fondAvkastning, 10);

    // Rammelån-allokering: forskjell mellom boliglånsrente og hva pengene faktisk
    // tjener i banken (bankRente). Det er denne differansen som er den reelle
    // besparelsen — ikke differansen mot boligrenten selv (som alltid gir 0).
    if (v.fondNå > 100000) {
      const allokerbartBeløp = Math.min(v.fondNå * 0.5, v.boligLån * 0.3);
      rammelånBesparelseÅr = allokerbartBeløp * (v.boligRente/100 - r.bankRente);
    }
  } else {
    boligKostMnd = v.husleieMnd || 0;
  }

  // Utleiedel i primærboligen (kun eiere, kobles fra bolig-kalkulatoren)
  const utleiedelsInntektMnd = (v.boligTilstand === 'eier' && v.harUtleiedel === 'ja')
    ? (v.utleiedelsInntektMnd || 0) : 0;

  // Separat utleiebolig (både eiere og leiere kan ha dette)
  const utleieinntektMnd = v.harUtleiebolig === 'ja'
    ? (v.utleieinntektMnd || 0) : 0;

  // ── Transport: forgrenet på transportTilstand + finansiering ──
  let bilTermÅr = 0, bilRenteÅr = 0, totalRenteBil = 0, bilRenteIFond = 0;
  let leasingÅr = 0, leasingOver5år = 0;
  let transportKostMnd = 0;

  const finansiering = v.transportTilstand === 'begge' ? v.bilFinansieringBegge : v.bilFinansiering;

  if (v.transportTilstand === 'bil' || v.transportTilstand === 'begge') {
    if (finansiering === 'lån') {
      bilTermÅr     = Beregn.annuitetÅr(v.bilLån, v.bilRente, v.bilLopetid);
      bilRenteÅr    = v.bilLån * v.bilRente / 100;
      totalRenteBil = bilRenteÅr * v.bilLopetid * 0.6;
      bilRenteIFond = Beregn.FV(totalRenteBil, r.fondAvkastning, v.bilLopetid);
      transportKostMnd += bilTermÅr / 12;
    } else if (finansiering === 'leasing') {
      leasingÅr      = (v.leasingMnd || 0) * 12;
      leasingOver5år = leasingÅr * 5;
      transportKostMnd += v.leasingMnd || 0;
    }
    // nedbetalt: ingen månedlig kostnad utover forsikring (ikke modellert her)
  }
  if (v.transportTilstand === 'kollektiv' || v.transportTilstand === 'begge') {
    transportKostMnd += v.kollektivMnd || 0;
  }

  // ── Vaner: røyk/snus ──
  let snusRøykÅr = 0, snusRøykDeckerMål = 'en del av nærmeste mål';
  if (v.vanerTilstand === 'ja') {
    snusRøykÅr = (v.snusRøykMnd || 0) * 12;
  }

  // ── Abonnementer ──
  const abonnementSpart  = v.fritidMnd * 0.5;
  const abonnementIFond  = Beregn.FVmnd(abonnementSpart, r.fondAvkastning, 10);

  // ── Flytte sammen: halverte boutgifter (bolig + felleskostnader) ──
  // boligKostMnd er allerede beregnet (boliglånstermin hvis eier, husleie hvis leier)
  const flytteSammenBesparelseMnd = boligKostMnd * 0.5;
  const flytteSammenIFond = Beregn.FVmnd(flytteSammenBesparelseMnd, r.fondAvkastning, 5);

  // ── Lønnsøkning: 10% høyere brutto, etter samme effektive skattesats som ellers ──
  const lønnsøkningMnd = (v.inntekt * 0.10) * 0.67 / 12;
  const lønnsøkningIFond = Beregn.FVmnd(lønnsøkningMnd, r.fondAvkastning, 5);

  // ── Fond vs bank ──
  const fondVsBank10 = v.fondNå
    ? Beregn.FV(v.fondNå, r.fondAvkastning, 10) - Beregn.FV(v.fondNå, r.bankRente * (1 - r.skattRenter), 10)
    : 0;

  // ── Andre lån ──
  const andreLånRenteÅr = v.andreLån * v.andreLånRente / 100;
  const andreLånIFond   = Beregn.FVmnd(andreLånRenteÅr / 12, r.fondAvkastning, 5);

  // ── Bilutleie (kun relevant hvis man faktisk har bil) ──
  // Bruker faktisk innfylt/importert verdi fra bilUtleieInntektMnd-feltet
  // (kan komme fra bil-kalkulatoren via KH-import) i stedet for en fast antagelse.
  // En leaset bil kan normalt ikke leies ut videre — samme regel som i UI-konflikten.
  const harBil = v.transportTilstand === 'bil' || v.transportTilstand === 'begge';
  const harLeaset = finansiering === 'leasing';
  const biluteieMnd = (harBil && !harLeaset) ? (v.bilUtleieInntektMnd || 0) : 0;
  const biluteieÅr = biluteieMnd * 12;

  // ── Mat og drikke (estimert ut fra husholdningsstørrelse) ──
  // Grovt, konservativt anslag: 5000 kr/mnd for egen mat, 3000 kr/mnd per barn.
  // VIKTIG: denne kalkulatoren regner ut ÉN persons vei til frihet (brukerens
  // egen inntekt, egen sparing osv.) — derfor skal brukeren kun belastes sin
  // EGEN andel av matkostnaden, ikke hele husholdningens. Egen mat telles alltid
  // fullt ut, mens barnas mat deles likt på antall voksne i husholdningen (siden
  // det er flere som bidrar til den utgiften når det er mer enn én voksen).
  const antallVoksne = v.antallVoksne || 1;
  const antallBarn = v.antallBarn || 0;
  const egenMatMnd = 5000;
  const barnasMatMnd = antallBarn * 3000;
  const matKostMnd = egenMatMnd + (barnasMatMnd / antallVoksne);

  // ── Ledig kapital (månedlig) ──
  const fasterKostMnd = boligKostMnd
    - utleieinntektMnd
    - utleiedelsInntektMnd
    + transportKostMnd
    + v.fritidMnd
    + v.restaurantMnd
    + v.reisMnd
    + snusRøykÅr / 12
    + (v.forsikringMnd || 0)
    + (v.andreLån * v.andreLånRente / 100 / 12)
    + matKostMnd;

  const ledigMnd = nettoMndInntekt - fasterKostMnd - v.sparingMnd;

  const totalSparingMnd = v.sparingMnd + (biluteieÅr / 12);

  // ── Snus/røyk dekker hvor mye av nærmeste mål ──
  if (v.vanerTilstand === 'ja' && valgteMål.length > 0) {
    const førsteMål = valgteMål[0];
    const def = FP.MÅL.find(m => m.id === førsteMål.id);
    const kostnad = førsteMål.kr || førsteMål.kostÅr || (def ? def.standard : 100000);
    const snusIFond10 = Beregn.FVmnd(v.snusRøykMnd, r.fondAvkastning, 10);
    const pst = Math.min(100, Math.round(snusIFond10 / kostnad * 100));
    snusRøykDeckerMål = pst + '% av ' + (def ? def.tittel.toLowerCase() : 'målet ditt') + ' (om 10 år)';
  }

  // ── MILEPÆLER ──
  const milepæler = Beregn.beregnMilepæler(valgteMål, v, {
    nettoMndInntekt, fasterKostMnd, totalSparingMnd, ledigMnd, biluteieÅr,
    refinansSparingMnd, r,
  });

  return {
    nettoMndInntekt, fasterKostMnd, ledigMnd, totalSparingMnd,
    matKostMnd, antallVoksne, antallBarn,
    utleieinntektMnd, utleiedelsInntektMnd,

    boligTermÅr, boligRenteÅr, boligAvdragÅr,
    refinansSparingMnd, refinansOver10år, refinansIFond,
    rammelånBesparelseÅr,
    boligRenteDesimal: v.boligRente / 100,
    utleieinntektMnd,

    bilTermÅr, bilRenteÅr, totalRenteBil, bilRenteIFond, bilLopetid: v.bilLopetid,
    leasingÅr, leasingOver5år,

    snusRøykMnd: v.snusRøykMnd, snusRøykÅr, snusRøykDeckerMål,

    abonnementSpart, abonnementIFond, fritidMnd: v.fritidMnd,

    flytteSammenBesparelseMnd, flytteSammenIFond,
    lønnsøkningMnd, lønnsøkningIFond,

    fondVsBank10, fondNå: v.fondNå,

    andreLånRenteÅr, andreLånIFond, andreLånRenteDesimal: v.andreLånRente / 100,

    biluteieÅr, biluteieMnd,
    biluteieDeckerMål: Beregn.biluteieDeckerHva(biluteieÅr, valgteMål, v),

    milepæler,
    skjulteKostnader: FP.SCENARIOER.filter(s => s.relevant(v)),
  };
};

// ─── MILEPÆLBEREGNING ──────────────────────────────────────────────────────

// Beregner hvor stort fond som kreves for å betale ut "uttakÅr" kr/år
// i "antallÅr" år, mens fondet fortsatt vokser med "rente" per år.
// Simulerer år for år: fond × (1 + rente) - uttakÅr, sjekker at det ikke går tomt.
// Returnerer nødvendig fondsstørrelse (ved oppstartstidspunktet for deltid).
Beregn.fondKrevesForUttak = function(uttakÅr, antallÅr, rente) {
  if (antallÅr <= 0 || uttakÅr <= 0) return 0;
  // Binærsøk: finn minste startfond der fondet ikke går tomt
  let lo = 0, hi = uttakÅr * antallÅr * 5;
  for (let i = 0; i < 64; i++) {
    const mid = (lo + hi) / 2;
    let fond = mid;
    let gårTomt = false;
    for (let år = 0; år < antallÅr; år++) {
      fond = fond * (1 + rente) - uttakÅr;
      if (fond < 0) { gårTomt = true; break; }
    }
    if (gårTomt) lo = mid;
    else hi = mid;
  }
  return Math.ceil((lo + hi) / 2);
};

Beregn.beregnMilepæler = function(valgteMål, v, ctx) {
  const { nettoMndInntekt, fasterKostMnd, totalSparingMnd, ledigMnd, biluteieÅr, refinansSparingMnd, r } = ctx;
  const milepæler = [];

  // ÉN kilde til sannhet for "hvor mye har jeg å spare med" — samme to tall
  // brukes av ALLE mål, uten unntak. Dette er bevisst det enkleste mulige:
  // full ledig kapital + all oppgitt sparing + refinansieringsgevinst per måned,
  // og all kapital som allerede står i fond i dag. Ingen mål bruker brøkdeler
  // (×0.1, ×0.2, ×0.3) eller hardkodet 0 av disse tallene lenger — det var
  // nettopp denne spredningen som gjorde at ulike mål kunne gi inkonsistente,
  // til og med selvmotsigende resultater når de ble sammenlignet eller optimalisert.
  //
  // VIKTIG: dette bygges DIREKTE fra nettoMndInntekt og fasterKostMnd, IKKE fra
  // ledigMnd + totalSparingMnd. fasterKostMnd inkluderer IKKE v.sparingMnd, så
  // "nettoMndInntekt - fasterKostMnd" ER allerede hele det disponible beløpet —
  // det som brukeren kaller "sparing" er bare en delmengde av dette samme
  // beløpet, ikke noe ekstra på toppen. Den forrige formelen (ledigMnd +
  // totalSparingMnd) trakk v.sparingMnd fra i det ene leddet og la den til i
  // det andre, slik at den kansellerte seg selv fullstendig ut — og en formel
  // som i stedet utelot v.sparingMnd helt, ville gjort tallet uavhengig av
  // sparing på en annen, like feil måte. Riktig er ganske enkelt: hele det
  // disponible beløpet (inntekt minus faste kostnader, der "faste kostnader"
  // ikke inkluderer sparing), pluss bilutleie og refinansieringsgevinst.
  const tilgjengeligMndAlle = Math.max(0, nettoMndInntekt - fasterKostMnd) + (biluteieÅr / 12) + refinansSparingMnd;
  // Inkluder kontantbeholdning som tilgjengelig startkapital mot mål —
  // men kun 90% (10% beholdes som buffer, konsistent med optimaliser-regelen).
  const fondNåAlle = (v.fondNå || 0) + (v.kontantbeholdning || 0) * 0.9;

  valgteMål.forEach(mål => {
    const def = FP.MÅL.find(m => m.id === mål.id);
    if (!def) return;

    let kostnad = null, måneder = null, beskrivelse = '', grep = [];

    switch (mål.id) {
      case 'reise': {
        kostnad = mål.kostÅr || def.standard;
        måneder = Beregn.månederTilMål(kostnad, tilgjengeligMndAlle, fondNåAlle, r.fondAvkastning);
        const biluteieDeckerPst = biluteieÅr > 0 ? Math.min(100, Math.round(biluteieÅr / kostnad * 100)) : 0;
        beskrivelse = 'Drømmereise for ' + fp_fmt(kostnad);
        grep = [];
        if (biluteieDeckerPst > 0) grep.push('Lei ut bilen → dekker ' + biluteieDeckerPst + '% av reisen');
        if (refinansSparingMnd > 0) grep.push('Refinansier boliglånet → ' + fp_fmtMnd(refinansSparingMnd) + ' ekstra/mnd mot reisemålet');
        break;
      }
      case 'friår': {
        const friÅr = mål.år || def.standard;
        kostnad = nettoMndInntekt * 12 * 0.7;
        // Juster for bolig-oppfølging
        if (mål.boligValg === 'ja') {
          kostnad -= (v.utleieinntektMnd || v.husleieMnd || 8000) * 12 * 0.7; // utleie dekker del av kostnaden
        } else if (mål.boligValg === 'betaler') {
          kostnad += (v.husleieMnd || 0) * 12;
        }
        kostnad = Math.max(0, kostnad);
        måneder = Beregn.månederTilMål(kostnad, tilgjengeligMndAlle, fondNåAlle, r.fondAvkastning);
        beskrivelse = 'Friår om ' + friÅr + ' år';
        grep = ['Start med refinansiering → bygg friårsfond'];
        if (biluteieÅr > 0) grep.push('Bilutleie gir ' + fp_fmt(biluteieÅr) + '/år til fondet');
        break;
      }
      case 'jobbe_mindre': {
        // FI-logikk: fondet må tåle å betale ut inntektstapet hvert år frem til 62,
        // mens det fortsatt vokser med avkastning på gjenværende beløp.
        const stillingFaktor = mål.kostMndFaktor || 0.20; // 0.20 = 80% stilling
        const inntektsTapÅr  = nettoMndInntekt * 12 * stillingFaktor;
        const alder          = v.alder || 40;
        const årTil62        = Math.max(1, 62 - alder);
        // Fond som kreves VED tidspunktet for nedtrapping
        const fondKreves = Beregn.fondKrevesForUttak(inntektsTapÅr, årTil62, r.fondAvkastning);
        // Tid for å bygge dette fondet med dagens sparerate
        måneder  = Beregn.månederTilMål(fondKreves, tilgjengeligMndAlle, fondNåAlle, r.fondAvkastning);
        kostnad  = fondKreves; // brukes til visning
        const stillingPst = Math.round((1 - stillingFaktor) * 100);
        beskrivelse = stillingPst + '% stilling — fondet dekker ' + fp_fmtMnd(inntektsTapÅr / 12) + '/mnd frem til du er 62';
        grep = [
          'Fondet betaler ut ' + fp_fmtMnd(inntektsTapÅr / 12) + '/mnd i ' + årTil62 + ' år (til du er 62)',
          'Fondet fortsetter å vokse på gjenværende kapital mens du tar ut',
          refinansSparingMnd > 0 ? 'Refinansier boliglånet → ' + fp_fmtMnd(refinansSparingMnd) + ' ekstra/mnd mot dette målet' : null,
        ].filter(Boolean);
        break;
      }
      case 'bolig': {
        kostnad = mål.kr || def.standard;
        måneder = Beregn.månederTilMål(kostnad, tilgjengeligMndAlle, fondNåAlle, r.fondAvkastning);
        beskrivelse = 'Boligoppgradering for ' + fp_fmt(kostnad);
        grep = ['Spar refinanseringsgevinsten direkte til dette målet'];
        break;
      }
      case 'luksus': {
        kostnad = mål.kr || def.standard;
        måneder = Beregn.månederTilMål(kostnad, tilgjengeligMndAlle, fondNåAlle, r.fondAvkastning);
        beskrivelse = (mål.fritekst || 'Luksuskjøp') + ' — ' + fp_fmt(kostnad);
        grep = biluteieÅr > 0 ? ['Bilutleie 60 dager dekker ' + Math.round(biluteieÅr / kostnad * 100) + '% av kostnaden'] : [];
        if (refinansSparingMnd > 0) grep.push('Refinansier boliglånet → ' + fp_fmtMnd(refinansSparingMnd) + ' ekstra/mnd mot dette målet');
        break;
      }
      case 'drømmebil': {
        kostnad = mål.kr || def.standard;
        måneder = Beregn.månederTilMål(kostnad, tilgjengeligMndAlle, fondNåAlle, r.fondAvkastning);
        beskrivelse = 'Drømmebil kontant — ' + fp_fmt(kostnad);
        grep = ['Du sparer bilen kontant, og slipper renter du ellers ville betalt på et billån. Det utgjør omtrent ' + fp_fmt(kostnad * 0.075 * 5 * 0.6) + ' du ikke gir bort til banken.'];
        break;
      }
      case 'eget': {
        kostnad = mål.kr || def.standard;
        måneder = Beregn.månederTilMål(kostnad, tilgjengeligMndAlle, fondNåAlle, r.fondAvkastning);
        beskrivelse = (mål.fritekst || 'Eget mål') + ' — ' + fp_fmt(kostnad);
        grep = refinansSparingMnd > 0 ? ['Refinansier boliglånet → ' + fp_fmtMnd(refinansSparingMnd) + ' ekstra/mnd mot dette målet'] : [];
        break;
      }
    }

    if (kostnad !== null) {
      const år = måneder === Infinity ? null : Math.floor(måneder / 12);
      const mndRest = måneder === Infinity ? null : måneder % 12;
      const totalKapital = (v.fondNå || 0) + (v.kontantbeholdning || 0) * 0.9;
      // harKapital: brukeren har kapital nok i dag, men Frihetsplanen
      // anbefaler alltid å spare seg frem — aldri å tømme beholdningen.
      const harKapital = totalKapital >= kostnad;
      milepæler.push({
        id: mål.id, ikon: def.ikon, beskrivelse, kostnad, måneder, år, mndRest, grep,
        harKapital,
      });
    }
  });

  milepæler.sort((a, b) => (a.måneder || 9999) - (b.måneder || 9999));
  return milepæler;
};

Beregn.biluteieDeckerHva = function(biluteieÅr, valgteMål, v) {
  const harBil = v.transportTilstand === 'bil' || v.transportTilstand === 'begge';
  if (!harBil) return 'ingenting (du har ikke bil)';
  // Hvis brukeren ikke leier ut ennå (biluteieÅr er da 0), bruk et potensielt
  // estimat i stedet for det faktiske (0) tallet, slik at "dekker X%" faktisk
  // sier noe nyttig om hva utleie KAN gi — ikke hva den gir akkurat nå.
  const erNedbetalt = v.bilFinansiering === 'nedbetalt' || v.bilFinansieringBegge === 'nedbetalt';
  const beløpÅVise = biluteieÅr > 0 ? biluteieÅr : (erNedbetalt ? 500*60*0.8 : 700*60*0.8);
  const reiseMål = valgteMål.find(m => m.id === 'reise');
  if (reiseMål) {
    const kostnad = reiseMål.kostÅr || 80000;
    const pst = Math.min(100, Math.round(beløpÅVise / kostnad * 100));
    return pst + '% av drømmereisen din';
  }
  return 'en uke ekstra ferie i året';
};

// ─── TRE-GRAF-SAMMENLIGNING (steg 3) — fast 5 års horisont ────────────────
// Alle tre kurver bruker 90% av ledig kapital (10% realistisk buffer) og
// 90% av kontantbeholdning som startkapital (samme buffer-logikk som
// optimaliseringsregel 1 i steg 4) — kun plassering og tiltak skiller dem:
// Kurve 1: ingen tiltak, i BANK — "gjør ingenting annerledes"
// Kurve 2: ingen tiltak, i FOND — "bare flytt det du har til fond"
// Kurve 3: alle relevante steg-3-tiltak, i FOND — "gjør de konkrete grepene"

Beregn.beregnSammenligningsgraf = function(v, res) {
  const r = FP.RATER;
  const MÅNEDER = 60;
  const BUFFER = 0.9; // 10% realistisk buffer holdes alltid utenfor

  // Summer alle skjulte-penger-potensialer som er relevante for denne brukeren,
  // og hold rede på AKKURAT hvilke poster som bidro (for å forklare kurve 3 i UI).
  let potensialMnd = 0;
  const poster = [];

  const leggTil = (id, label, beløp) => {
    if (beløp > 0) {
      potensialMnd += beløp;
      poster.push({ id, label, beløpMnd: beløp });
    }
  };

  FP.SCENARIOER.forEach(s => {
    if (!s.relevant(v)) return;
    if (s.id === 'bolig_refinansiering') leggTil(s.id, 'Refinansiering av boliglånet', res.refinansSparingMnd || 0);
    if (s.id === 'abonnement') leggTil(s.id, 'Halverte abonnement/hobbyer', res.abonnementSpart || 0);
    if (s.id === 'flytte_sammen') leggTil(s.id, 'Halverte boutgifter (flytte sammen)', res.flytteSammenBesparelseMnd || 0);
    if (s.id === 'bil_utleie_aktiv') leggTil(s.id, 'Inntekt fra bilutleie', res.biluteieMnd || 0);
    if (s.id === 'andre_lån') leggTil(s.id, 'Sparte renter på andre lån', (res.andreLånRenteÅr || 0) / 12);
    if (s.id === 'snus_røyk') leggTil(s.id, 'Penger brukt på røyk/snus', v.snusRøykMnd || 0);
  });

  const ledigKapitalMnd = Math.max(0, res.ledigMnd) * BUFFER;
  const startKapital = (v.kontantbeholdning || 0) * BUFFER;

  const kurve1Mnd = ledigKapitalMnd;                  // ingen tiltak, i bank
  const kurve2Mnd = ledigKapitalMnd;                  // ingen tiltak, i fond
  const kurve3Mnd = ledigKapitalMnd + potensialMnd;    // alle relevante tiltak, i fond

  const fondRenteMnd = r.fondAvkastning / 12;
  const bankRenteMnd = (r.bankRente * (1 - r.skattRenter)) / 12;

  const data = { kurve1: [], kurve2: [], kurve3: [] };
  let k1 = startKapital, k2 = startKapital, k3 = startKapital;

  for (let m = 0; m <= MÅNEDER; m++) {
    data.kurve1.push(Math.round(k1));
    data.kurve2.push(Math.round(k2));
    data.kurve3.push(Math.round(k3));
    k1 = k1 * (1 + bankRenteMnd) + kurve1Mnd;
    k2 = k2 * (1 + fondRenteMnd) + kurve2Mnd;
    k3 = k3 * (1 + fondRenteMnd) + kurve3Mnd;
  }

  return {
    måneder: MÅNEDER,
    kurve1Mnd, kurve2Mnd, kurve3Mnd,
    ledigKapitalMnd, startKapital, poster,
    data,
    sluttverdi1: data.kurve1[MÅNEDER],
    sluttverdi2: data.kurve2[MÅNEDER],
    sluttverdi3: data.kurve3[MÅNEDER],
  };
};

// ─── OPTIMALISERING — "Hjelp meg å nå målet mitt" (steg 4) ────────────────
// Fire faste regler, ingen brukerjustering. Returnerer ekstra kr/mnd til fond
// pluss en liste med tiltak (for presentasjon i handlingsplanen).

Beregn.optimaliser = function(v, res) {
  const r = FP.RATER;
  const tiltak = [];
  let ekstraMndTilFond = 0;

  // Regel 1: 90% av kontantbeholdning til fond (10% blir buffer)
  const kontant = v.kontantbeholdning || 0;
  if (kontant > 0) {
    const flyttetBeløp = kontant * 0.9;
    // Engangsbeløp regnes om til en tilsvarende månedlig effekt over 5 år for sammenligning,
    // men selve beløpet legges også til som et engangsinnskudd i milepæl-beregningen.
    tiltak.push({
      type: 'engangsbeløp',
      tekst: 'Flytt 90% av kontantbeholdningen til fond',
      beløpEngang: flyttetBeløp,
    });
  }

  // Regel 2: 90% av eksisterende månedlig sparing omdirigert til fond.
  // Vises som avkastningsvinning over 10 år, ikke som "ekstra kr/mnd" —
  // siden det ikke er mer penger inn, bare bedre plassering av det som allerede spares.
  const eksisterendeSparing = v.sparingMnd || 0;
  if (eksisterendeSparing > 0) {
    const omdirigert = eksisterendeSparing * 0.9;
    const bankVekst = Beregn.FVmnd(omdirigert, r.bankRente, 10);
    const fondVekst = Beregn.FVmnd(omdirigert, r.fondAvkastning, 10);
    const vinning10år = Math.round(fondVekst - bankVekst);
    tiltak.push({
      type: 'vinning',
      tekst: 'Flytt 90% av sparingen din til fond i stedet for bank',
      beløpMnd: omdirigert,
      vinning10år,
    });
  }

  // Regel 3: refinansiering (kun hvis aktuelt — eier bolig med lån)
  // Simuleres ved å faktisk redusere v.boligRente med 0,5 prosentpoeng i vJustert,
  // slik at Beregn.kjør() regner ut en reelt lavere fasterKostMnd (lavere rentekostnad)
  // når den kjøres på nytt — ikke ved å late som det er "ekstra sparing" i et felt
  // milepæl-formelen ikke leser.
  let nyBoligRente = v.boligRente;
  if (v.boligTilstand === 'eier' && v.boligLån > 0) {
    const refinansBesparelse = res.refinansSparingMnd || 0;
    if (refinansBesparelse > 0) {
      nyBoligRente = Math.max(0, v.boligRente - 0.5);
      // Av besparelsen settes 90% av til side (10% blir litt mer i lommen nå,
      // som er den realistiske, ikke-totalitære varianten av "spar alt").
      const tilFond = refinansBesparelse * 0.9;
      ekstraMndTilFond += tilFond;
      tiltak.push({
        type: 'mnd',
        tekst: 'Refinansier boliglånet (0,5% lavere rente er ofte oppnåelig) og spar 90% av besparelsen',
        beløpMnd: tilFond,
      });
    }
  }

  // Regel 4: 10% kutt på styrbare kostnader (fritid + restaurant + reise samlet).
  // Simuleres ved å faktisk redusere de tre feltene i vJustert med 10% hver,
  // slik at fasterKostMnd blir reelt lavere når Beregn.kjør() kjøres på nytt.
  const styrbarSum = (v.fritidMnd || 0) + (v.restaurantMnd || 0) + (v.reisMnd || 0);
  let nyFritidMnd = v.fritidMnd || 0, nyRestaurantMnd = v.restaurantMnd || 0, nyReisMnd = v.reisMnd || 0;
  if (styrbarSum > 0) {
    const kuttet = styrbarSum * 0.10;
    nyFritidMnd = (v.fritidMnd || 0) * 0.9;
    nyRestaurantMnd = (v.restaurantMnd || 0) * 0.9;
    nyReisMnd = (v.reisMnd || 0) * 0.9;
    tiltak.push({
      type: 'mnd',
      tekst: 'Kutt 10% av fritid/restaurant/reise-budsjettet',
      beløpMnd: kuttet,
    });
    ekstraMndTilFond += kuttet; // brukes kun til visning i pensjonsskjermen, ikke i milepæl-formelen selv
  }

  // Bygg en justert kopi av v for å re-kjøre Beregn.kjør(). De faktiske feltene
  // som driver fasterKostMnd justeres direkte, slik at den nye, lavere
  // fasterKostMnd oppstår naturlig når Beregn.kjør(vJustert) regnes ut —
  // ikke via et sparingMnd-felt som milepæl-formelen ikke bruker.
  const vJustert = Object.assign({}, v);
  vJustert.boligRente = nyBoligRente;
  vJustert.fritidMnd = nyFritidMnd;
  vJustert.restaurantMnd = nyRestaurantMnd;
  vJustert.reisMnd = nyReisMnd;
  // Kontantbeholdningen er "brukt" (flyttet), men fondNå økes ikke direkte her —
  // selve engangsbeløpet håndteres i milepæl-sammenligningen under, ikke i v selv,
  // for å unngå å blande engangs- og månedlige effekter i samme felt.

  const ekstraFondNå = (v.kontantbeholdning || 0) * 0.9;
  vJustert.fondNå = (v.fondNå || 0) + ekstraFondNå;
  vJustert.kontantbeholdning = (v.kontantbeholdning || 0) * 0.1; // 10% buffer igjen

  return {
    ekstraMndTilFond,
    ekstraFondNå,
    tiltak,
    vJustert,
  };
};

// ─── PENSJON — separat sluttskjerm, utenfor hovedflyten ───────────────────
// Bygger på den OPTIMALISERTE månedlige kapitalen (fra Beregn.optimaliser).
// 50% går til pensjon (investert i fond til 62/67), 50% er fortsatt tilgjengelig for livet nå.

Beregn.beregnPensjon = function(v, totalSparepotensialMnd) {
  const r = FP.RATER;
  const alder = v.alder || 35;
  const halvpart = totalSparepotensialMnd * 0.5;

  const årTil62 = Math.max(0, 62 - alder);
  const årTil67 = Math.max(0, 67 - alder);

  const pensjon62 = Beregn.FVmnd(halvpart, r.fondAvkastning, årTil62);
  const pensjon67 = Beregn.FVmnd(halvpart, r.fondAvkastning, årTil67);

  return {
    alder, halvpart, årTil62, årTil67,
    pensjon62, pensjon67,
    restTilLivetMnd: totalSparepotensialMnd - halvpart, // de andre 50%, fortsatt tilgjengelig
  };
};

window.Beregn = Beregn;
