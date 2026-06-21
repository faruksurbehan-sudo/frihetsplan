/**
 * Frihetsplanen — data.js
 * Alt innhold, konstanter og konfigurasjon samlet her.
 * Legg til nye mål, kategorier eller scenarioer i denne filen.
 *
 * ─── GENERISK KATEGORI-MØNSTER ──────────────────────────────────────────
 * En "kategori" er en livssituasjon med flere tilstander (FP.KATEGORIER).
 * Brukeren velger én tilstand per kategori (bryterknapper).
 * Hver tilstand kan vise egne felt, og kan ha underspørsmål som åpner
 * enda flere felt (f.eks. "har lån?" → vis lånefelt).
 * render.js tegner ALLE kategorier med samme generiske funksjon —
 * ingen spesialkode trengs per kategori.
 */

const FP = {};

// ─── KATEGORIER (Steg 2a — bryterknapper som styrer hva som vises) ────────

FP.KATEGORIER = [
  {
    id: 'bolig',
    ikon: '🏠',
    tittel: 'Bolig',
    tilstander: [
      { id: 'eier',  label: 'Eier' },
      { id: 'leier', label: 'Leier' },
    ],
    standardTilstand: 'eier',
    felt: {
      eier:  ['boligVerdi', 'boligLån', 'boligRente'],
      leier: ['husleieMnd'],
    },
    // Ingen kalkulatorLenke her — bolig-kalkulatoren er kun relevant for separat utleiebolig
    // og lenken vises i det underspørsmålet i stedet.
    underspørsmål: {
      eier: [
        {
          id: 'harUtleiedel',
          spørsmål: 'Har du en utleiedel i boligen?',
          info: 'For å leie ut skattefritt må du eie boligen, bo der selv, og den utleide delen må utgjøre mindre enn halvparten av boligens areal. Oppgi netto månedsinntekt etter at du selv har vurdert skattemessig behandling.',
          tilstander: [
            { id: 'ja',  label: 'Ja' },
            { id: 'nei', label: 'Nei' },
          ],
          standardTilstand: 'nei',
          felt: { ja: ['utleiedelsInntektMnd'], nei: [] },
        },
        {
          id: 'harUtleiebolig',
          spørsmål: 'Har du en separat utleiebolig?',
          tilstander: [
            { id: 'ja',  label: 'Ja' },
            { id: 'nei', label: 'Nei' },
          ],
          standardTilstand: 'nei',
          felt: { ja: ['utleieinntektMnd'], nei: [] },
          kalkulatorLenke: { url: '../kalkulatorer/utleiebolig.html', tekst: 'Åpne bolig-kalkulatoren for nøyaktige tall →' },
        },
      ],
      leier: [
        {
          id: 'harUtleiebolig',
          spørsmål: 'Har du en separat utleiebolig?',
          tilstander: [
            { id: 'ja',  label: 'Ja' },
            { id: 'nei', label: 'Nei' },
          ],
          standardTilstand: 'nei',
          felt: { ja: ['utleieinntektMnd'], nei: [] },
          kalkulatorLenke: { url: '../kalkulatorer/utleiebolig.html', tekst: 'Åpne bolig-kalkulatoren for nøyaktige tall →' },
        },
      ],
    },
  },
  {
    id: 'delerBolig',
    ikon: '🤝',
    tittel: 'Bor du sammen med noen?',
    tilstander: [
      { id: 'nei', label: 'Bor alene' },
      { id: 'ja',  label: 'Deler bolig med noen' },
    ],
    standardTilstand: 'nei',
    felt: {
      ja:  [],
      nei: [],
    },
  },
  {
    id: 'transport',
    ikon: '🚗',
    tittel: 'Transport',
    tilstander: [
      { id: 'bil',       label: 'Eier bil' },
      { id: 'kollektiv', label: 'Kollektiv' },
      { id: 'begge',     label: 'Begge' },
    ],
    standardTilstand: 'bil',
    felt: {
      bil:       ['bilUtleieInntektMnd'],
      kollektiv: ['kollektivMnd'],
      begge:     ['kollektivMnd', 'bilUtleieInntektMnd'],
    },
    kalkulatorLenke: {
      bil:   { url: '../kalkulatorer/bil.html', tekst: 'Åpne bil-kalkulatoren for nøyaktige tall →' },
      begge: { url: '../kalkulatorer/bil.html', tekst: 'Åpne bil-kalkulatoren for nøyaktige tall →' },
    },
    underspørsmål: {
      bil: {
        id: 'bilFinansiering',
        spørsmål: 'Lån, leasing, eller nedbetalt?',
        tilstander: [
          { id: 'lån',       label: 'Har lån' },
          { id: 'leasing',   label: 'Leaser' },
          { id: 'nedbetalt', label: 'Nedbetalt' },
        ],
        standardTilstand: 'lån',
        felt: {
          lån:       ['bilLån', 'bilRente', 'bilLopetid'],
          leasing:   ['leasingMnd'],
          nedbetalt: [],
        },
      },
      begge: {
        id: 'bilFinansieringBegge',
        spørsmål: 'Lån, leasing, eller nedbetalt?',
        tilstander: [
          { id: 'lån',       label: 'Har lån' },
          { id: 'leasing',   label: 'Leaser' },
          { id: 'nedbetalt', label: 'Nedbetalt' },
        ],
        standardTilstand: 'lån',
        felt: {
          lån:       ['bilLån', 'bilRente', 'bilLopetid'],
          leasing:   ['leasingMnd'],
          nedbetalt: [],
        },
      },
    },
  },
  {
    id: 'vaner',
    ikon: '🚬',
    tittel: 'Røyk / snus',
    tilstander: [
      { id: 'nei', label: 'Nei' },
      { id: 'ja',  label: 'Ja' },
    ],
    standardTilstand: 'nei',
    felt: {
      ja:  ['snusRøykMnd'],
      nei: [],
    },
  },
];

// ─── FRIHETSMÅL (Steg 1) ───────────────────────────────────────────────────

FP.MÅL = [
  {
    id: 'jobbe_mindre',
    ikon: '📍',
    tittel: 'Jobbe mindre',
    undertittel: 'Reduser stillingen, ta tilbake tiden din',
    valg: [
      { id: '80pst',    label: '80 % stilling',    kostMndFaktor: 0.20 },
      { id: '4dager',   label: '4-dagers uke',      kostMndFaktor: 0.20 },
      { id: 'fleksi',   label: 'Full fleksibilitet', kostMndFaktor: 0.10 },
    ],
    spørsmål: 'Når vil du ha dette på plass?',
    enhet: 'år',
    min: 1, max: 15, standard: 5,
  },
  {
    id: 'reise',
    ikon: '✈️',
    tittel: 'Reise mer',
    undertittel: 'Drømmeferier, ikke bare to uker om sommeren',
    valg: [
      { id: '3uker',    label: '3 uker/år',   kostÅr: 40000 },
      { id: '6uker',    label: '6 uker/år',   kostÅr: 80000 },
      { id: 'drøm',     label: 'Drømmereise', kostÅr: null  },
    ],
    spørsmål: 'Hva er drømmereisen verdt per år?',
    enhet: 'kr/år',
    min: 20000, max: 300000, standard: 80000,
  },
  {
    id: 'friår',
    ikon: '🏖️',
    tittel: 'Friår',
    undertittel: 'Et helt år for deg selv — planlagt og finansiert',
    spørsmål: 'Når vil du ta friåret?',
    enhet: 'år',
    min: 2, max: 20, standard: 7,
    kostÅr: null,
    boligOppfølging: true,
  },
  {
    id: 'bolig',
    ikon: '🏠',
    tittel: 'Boligoppgradering',
    undertittel: 'Drømmebolig, oppussing eller hytte',
    spørsmål: 'Hva vil det koste?',
    enhet: 'kr',
    min: 100000, max: 5000000, standard: 500000,
  },
  {
    id: 'luksus',
    ikon: '💎',
    tittel: 'Luksuskjøp',
    undertittel: 'Klokke, smykker, opplevelse, fest — noe du virkelig vil ha',
    spørsmål: 'Hva koster det?',
    enhet: 'kr',
    min: 10000, max: 500000, standard: 50000,
  },
  {
    id: 'drømmebil',
    ikon: '🚗',
    tittel: 'Drømmebil',
    undertittel: 'Eid kontant, ikke leaset',
    spørsmål: 'Hva koster bilen?',
    enhet: 'kr',
    min: 100000, max: 2000000, standard: 400000,
  },
  {
    id: 'eget',
    ikon: '🎯',
    tittel: 'Eget mål',
    undertittel: 'Noe som betyr noe for akkurat deg',
    spørsmål: 'Hva koster det og når vil du ha det?',
    enhet: 'kr',
    min: 10000, max: 2000000, standard: 100000,
    fritekst: true,
  },
  {
    id: 'refinansier',
    ikon: '📑',
    tittel: 'Refinansier',
    undertittel: 'Samle lånene dine — bedre rente, mer frihet',
    type: 'navigasjon',
    lenke: 'refinansiering.html',
  },
];

// ─── LIVSSITUASJON — FELT (Steg 2b) ────────────────────────────────────────

FP.FELT = {
  alder: {
    seksjon: 'jobb',
    label: 'Din alder',
    min: 18, max: 70, step: 1, standard: 35,
    enhet: 'år',
  },
  antallVoksne: {
    seksjon: 'jobb',
    label: 'Antall voksne i husholdningen',
    min: 1, max: 4, step: 1, standard: 1,
    enhet: 'stk',
    info: 'Brukes til å anslå matbudsjett, og avgjør om "flytte sammen"-forslag er aktuelt',
  },
  antallBarn: {
    seksjon: 'jobb',
    label: 'Antall barn i husholdningen',
    min: 0, max: 6, step: 1, standard: 0,
    enhet: 'stk',
    info: 'Brukes til å anslå matbudsjett',
  },
  inntekt: {
    seksjon: 'jobb',
    label: 'Brutto årsinntekt',
    min: 300000, max: 2000000, step: 25000, standard: 650000,
    enhet: 'kr/år',
  },
  boligVerdi: {
    label: 'Boligens markedsverdi',
    min: 1000000, max: 15000000, step: 100000, standard: 4000000,
    enhet: 'kr',
  },
  boligLån: {
    label: 'Boliglån (din andel)',
    min: 0, max: 10000000, step: 100000, standard: 3000000,
    enhet: 'kr',
  },
  boligRente: {
    label: 'Boligrente',
    min: 2, max: 8, step: 0.1, standard: 5.5,
    enhet: '%',
  },
  husleieMnd: {
    label: 'Husleie (din andel)',
    min: 5000, max: 30000, step: 500, standard: 12000,
    enhet: 'kr/mnd',
  },
  utleiedelsInntektMnd: {
    label: 'Netto leieinntekt fra utleiedel (din andel)',
    min: 0, max: 20000, step: 500, standard: 5000,
    enhet: 'kr/mnd',
    info: 'Oppgi beløpet du faktisk sitter igjen med etter eventuelle kostnader. Frihetsplanen antar dette er netto.',
  },
  utleieinntektMnd: {
    label: 'Netto leieinntekt fra utleiebolig',
    min: 0, max: 40000, step: 500, standard: 8000,
    enhet: 'kr/mnd',
    import: {
      kalkulator: 'bolig',
      kilde: 'månedligNettoKontantflyt',
      lenke: '../kalkulatorer/utleiebolig.html',
      lenkeTekst: 'Beregn nøyaktig i bolig-kalkulatoren →',
      importTekst: 'Importert fra bolig-kalkulatoren',
    },
  },
  kollektivMnd: {
    label: 'Kollektivkort',
    min: 500, max: 2000, step: 50, standard: 850,
    enhet: 'kr/mnd',
  },
  bilLån: {
    label: 'Billån',
    min: 0, max: 1000000, step: 10000, standard: 300000,
    enhet: 'kr',
    import: {
      kalkulator: 'bil',
      kilde: 'bilLån',
      lenke: '../kalkulatorer/bil.html',
      lenkeTekst: 'Beregn nøyaktig i bil-kalkulatoren →',
      importTekst: 'Tall hentet fra bil-kalkulatoren',
    },
  },
  bilRente: {
    label: 'Billånsrente',
    min: 0, max: 15, step: 0.1, standard: 7.5,
    enhet: '%',
    import: {
      kalkulator: 'bil',
      kilde: 'bilRente',
      lenke: '../kalkulatorer/bil.html',
      lenkeTekst: 'Beregn nøyaktig i bil-kalkulatoren →',
      importTekst: 'Tall hentet fra bil-kalkulatoren',
    },
  },
  bilLopetid: {
    label: 'Løpetid billån',
    min: 1, max: 8, step: 1, standard: 5,
    enhet: 'år',
    import: {
      kalkulator: 'bil',
      kilde: 'bilLopetid',
      lenke: '../kalkulatorer/bil.html',
      lenkeTekst: 'Beregn nøyaktig i bil-kalkulatoren →',
      importTekst: 'Tall hentet fra bil-kalkulatoren',
    },
  },
  leasingMnd: {
    label: 'Leasingkostnad',
    min: 1000, max: 15000, step: 250, standard: 4500,
    enhet: 'kr/mnd',
  },
  bilUtleieInntektMnd: {
    label: 'Leieinntekt fra bilutleie (Nabobil/Hyre)',
    min: 0, max: 15000, step: 250, standard: 0,
    enhet: 'kr/mnd',
    info: 'Sett til 0 hvis du ikke leier ut bilen',
    feltKonflikt: {
      sjekkUnderspørsmål: ['bilFinansiering', 'bilFinansieringBegge'],
      konfliktTilstand: 'leasing',
      varsel: 'En leaset bil kan vanligvis ikke leies ut videre — sjekk leasingavtalen din. Feltet er derfor skjult mens "Leaser" er valgt.',
    },
    import: {
      kalkulator: 'bil',
      kilde: 'leieinntektMnd',
      lenke: '../kalkulatorer/bil.html',
      lenkeTekst: 'Beregn nøyaktig i bil-kalkulatoren →',
      importTekst: 'Importert fra bil-kalkulatoren',
    },
  },
  snusRøykMnd: {
    label: 'Forbruk røyk/snus',
    min: 200, max: 6000, step: 100, standard: 1800,
    enhet: 'kr/mnd',
  },
  fritidMnd: {
    seksjon: 'fritid',
    label: 'Faste abonnementer og hobbyer',
    min: 0, max: 10000, step: 100, standard: 2000,
    enhet: 'kr/mnd',
    info: 'Strømming, treningssenter, tidsskrifter, hobbyer',
  },
  restaurantMnd: {
    seksjon: 'fritid',
    label: 'Restaurant og kafe',
    min: 0, max: 10000, step: 200, standard: 2000,
    enhet: 'kr/mnd',
  },
  reisMnd: {
    seksjon: 'fritid',
    label: 'Reiser du allerede tar (fordelt per mnd)',
    min: 0, max: 10000, step: 200, standard: 1500,
    enhet: 'kr/mnd',
  },
  andreLån: {
    seksjon: 'lån',
    label: 'Andre lån / kreditt (total gjeld)',
    min: 0, max: 500000, step: 5000, standard: 0,
    enhet: 'kr',
  },
  andreLånRente: {
    seksjon: 'lån',
    label: 'Rente på andre lån',
    min: 0, max: 25, step: 0.5, standard: 12,
    enhet: '%',
  },
  forsikringMnd: {
    seksjon: 'forsikring',
    label: 'Andre forsikringer (innbo, reise, liv osv.)',
    min: 0, max: 5000, step: 100, standard: 700,
    enhet: 'kr/mnd',
    info: 'Bilforsikring telles allerede under Transport — ikke ta den med her',
  },
  fondNå: {
    seksjon: 'sparing',
    label: 'Aksjer / fond (nåverdi)',
    min: 0, max: 3000000, step: 10000, standard: 50000,
    enhet: 'kr',
  },
  kontantbeholdning: {
    seksjon: 'sparing',
    label: 'Kontantbeholdning / bankinnskudd',
    min: 0, max: 2000000, step: 10000, standard: 100000,
    enhet: 'kr',
    info: 'Penger som står i banken, utenom buffer du vil ha lett tilgjengelig',
  },
  sparingMnd: {
    seksjon: 'sparing',
    label: 'Månedlig sparing',
    min: 0, max: 20000, step: 500, standard: 2000,
    enhet: 'kr/mnd',
  },
};

// ─── SEKSJONER for ikke-kategori-felt ──────────────────────────────────────

FP.SEKSJONER = [
  { id: 'jobb',       ikon: '💰', tittel: 'Jobb og inntekt' },
  { id: 'fritid',     ikon: '🎿', tittel: 'Fritid og forbruk' },
  { id: 'lån',        ikon: '💳', tittel: 'Andre lån' },
  { id: 'forsikring', ikon: '🛡️', tittel: 'Forsikring' },
  { id: 'sparing',    ikon: '📈', tittel: 'Sparing og fond' },
];

// ─── AVKASTNINGSFORUTSETNINGER ─────────────────────────────────────────────

FP.RATER = {
  fondAvkastning:    0.07,
  inflasjon:         0.025,
  bankRente:         0.04,
  rammelånRente:     0.055,
  skattFond:         0.22,
  skattRenter:       0.22,
  boligPrisvekst:    0.03,
};

// ─── SKJULTE KOSTNADER — scenarioer for steg 3 ───────────────────────────

FP.SCENARIOER = [
  {
    id: 'bil_rente',
    tittel: 'Hva billånsrenten egentlig koster deg',
    beskriv: (d) => 'Du betaler ' + fp_fmt(d.totalRenteBil) + ' i renter på billånet over hele løpetiden.',
    innsikt: (d) => 'Investert i fond hadde det blitt ' + fp_fmt(d.bilRenteIFond) + ' på ' + d.bilLopetid + ' år.',
    handling: 'Se etter rentefritt billån',
    ikon: '🚗',
    relevant: (v) => v.transportTilstand !== 'kollektiv' && (v.bilFinansiering === 'lån' || v.bilFinansieringBegge === 'lån') && v.bilLån > 0,
  },
  {
    id: 'leasing_vs_eie',
    tittel: 'Hva leasing koster mot å eie',
    beskriv: (d) => 'Du betaler ' + fp_fmt(d.leasingÅr) + '/år i leasing — penger du ikke får tilbake.',
    innsikt: (d) => 'Over 5 år er det ' + fp_fmt(d.leasingOver5år) + ' uten noe restverdi.',
    handling: 'Sammenlign med å eie',
    ikon: '🚗',
    relevant: (v) => v.bilFinansiering === 'leasing' || v.bilFinansieringBegge === 'leasing',
  },
  {
    id: 'bolig_refinansiering',
    tittel: 'Hva 0,5% lavere boligrente betyr',
    beskriv: (d) => 'Med 0,5% lavere rente sparer du ' + fp_fmt(d.refinansSparingMnd) + '/mnd.',
    innsikt: (d) => 'Over 10 år er det ' + fp_fmt(d.refinansOver10år) + ' — investert i fond: ' + fp_fmt(d.refinansIFond) + '.',
    handling: 'Sjekk refinansiering',
    lenke: 'refinansiering.html',
    ikon: '🏠',
    relevant: (v) => v.boligTilstand === 'eier' && v.boligLån > 0,
  },
  {
    id: 'rammelån_allokering',
    tittel: 'Pengene dine kan jobbe smartere',
    beskriv: (d) => 'Du har ' + fp_fmt(d.fondNå) + ' i bank/fond til lav rente, men betaler ' + fp_fmtPct(d.boligRenteDesimal) + ' på boliglånet.',
    innsikt: (d) => 'Med rammelån kan du redusere lånekostnaden med ' + fp_fmt(d.rammelånBesparelseÅr) + '/år — uten å miste tilgang til pengene.',
    handling: 'Les om rammelån',
    ikon: '🔄',
    relevant: (v) => v.boligTilstand === 'eier' && v.boligLån > 0 && v.fondNå > 100000 && v.sparingMnd > 3000,
  },
  {
    id: 'abonnement',
    tittel: 'Abonnementene du kanskje ikke bruker',
    beskriv: (d) => 'Du bruker ' + fp_fmt(d.fritidMnd) + '/mnd på faste abonnementer og hobbyer.',
    innsikt: (d) => 'Halvparten spart og investert = ' + fp_fmt(d.abonnementIFond) + ' om 10 år.',
    handling: 'Gjennomgå abonnementene',
    ikon: '📱',
    relevant: (v) => v.fritidMnd > 500,
  },
  {
    id: 'fond_vs_bank',
    tittel: 'Sparepengene dine taper kjøpekraft i banken',
    beskriv: (d) => 'Pengene dine i banken vokser med ' + fp_fmtPct(FP.RATER.bankRente) + ' — inflasjon spiser ' + fp_fmtPct(FP.RATER.inflasjon) + '.',
    innsikt: (d) => fp_fmt(d.fondNå) + ' i fond fremfor bank gir ' + fp_fmt(d.fondVsBank10) + ' ekstra om 10 år.',
    handling: 'Flytt til indeksfond',
    ikon: '📈',
    relevant: (v) => v.fondNå < 50000 && v.sparingMnd > 0,
  },
  {
    id: 'bil_utleie',
    tittel: 'Bilen din kan finansiere ferien din',
    beskriv: (d) => 'Leier du ut bilen 60 dager/år på Nabobil (snitt 700 kr/dag) tjener du ca ' + fp_fmt(60*700*0.8) + ' netto.',
    innsikt: (d) => 'Det dekker ' + d.biluteieDeckerMål + '.',
    handling: 'Se bilkalkulatoren',
    lenke: 'kalkulatorer/bil.html',
    ikon: '🚗',
    relevant: (v) => (v.transportTilstand === 'bil' || v.transportTilstand === 'begge') && !(v.bilUtleieInntektMnd > 0)
      && (v.bilFinansiering !== 'nedbetalt' && v.bilFinansieringBegge !== 'nedbetalt'),
  },
  {
    id: 'bil_utleie_nedbetalt',
    tittel: 'Bilen din kan finansiere ferien din',
    beskriv: (d) => 'Bilen er nedbetalt og står ubrukt — utleie bør sterkt vurderes. Konservativt anslag: 500 kr/dag × 60 dager/år = ' + fp_fmt(500*60*0.8) + ' netto i året.',
    innsikt: (d) => 'Uten lån å betjene går nesten alt rett i lommen. Dette er et forsiktig anslag — se bilkalkulatoren for ditt eksakte potensial.',
    handling: 'Se bilkalkulatoren',
    lenke: 'kalkulatorer/bil.html',
    ikon: '🚗',
    relevant: (v) => (v.transportTilstand === 'bil' || v.transportTilstand === 'begge') && !(v.bilUtleieInntektMnd > 0)
      && (v.bilFinansiering === 'nedbetalt' || v.bilFinansieringBegge === 'nedbetalt'),
  },
  {
    id: 'bil_utleie_aktiv',
    tittel: 'Bilutleien din jobber allerede for deg',
    beskriv: (d) => 'Du leier ut bilen for ' + fp_fmtMnd(d.biluteieMnd) + ' — det er ' + fp_fmt(d.biluteieÅr) + ' i året.',
    innsikt: (d) => 'Investert i fond i stedet for å stå urørt, dekker det ' + d.biluteieDeckerMål + '.',
    handling: 'Juster i bilkalkulatoren',
    lenke: 'kalkulatorer/bil.html',
    ikon: '🚗',
    relevant: (v) => (v.transportTilstand === 'bil' || v.transportTilstand === 'begge') && v.bilUtleieInntektMnd > 0,
  },
  {
    id: 'andre_lån',
    tittel: 'Dyre lån koster deg frihet',
    beskriv: (d) => 'Andre lån til ' + fp_fmtPct(d.andreLånRenteDesimal) + ' koster deg ' + fp_fmt(d.andreLånRenteÅr) + '/år i renter.',
    innsikt: (d) => 'Nedbetalt og investert hadde det gitt ' + fp_fmt(d.andreLånIFond) + ' om 5 år.',
    handling: 'Prioriter nedbetaling',
    ikon: '💳',
    relevant: (v) => v.andreLån > 10000,
  },
  {
    id: 'snus_røyk',
    tittel: 'Hva røyk/snus er verdt investert',
    beskriv: (d) => 'Du bruker ' + fp_fmt(d.snusRøykMnd) + '/mnd — det er ' + fp_fmt(d.snusRøykÅr) + ' i året.',
    innsikt: (d) => 'Investert i fond i stedet, dekker det ' + d.snusRøykDeckerMål + ' av nærmeste mål.',
    handling: 'Se hva det er verdt for deg',
    ikon: '🚬',
    relevant: (v) => v.vanerTilstand === 'ja' && v.snusRøykMnd > 0,
  },
  {
    id: 'flytte_sammen',
    tittel: 'Kanskje du skal flytte inn med noen?',
    beskriv: (d) => 'Halverte boutgifter ville frigjort ' + fp_fmtMnd(d.flytteSammenBesparelseMnd) + ' — bolig, felleskostnader og faste utgifter delt på to.',
    innsikt: (d) => 'Investert i fond er det ' + fp_fmt(d.flytteSammenIFond) + ' om 5 år.',
    handling: 'Bare en tanke',
    ikon: '🏡',
    // Kun relevant hvis man IKKE allerede deler bolig (eksplisitt toggle) OG
    // ikke allerede er 2 eller flere voksne i husholdningen (da bor man jo
    // allerede sammen med noen, og forslaget gir ingen mening).
    relevant: (v) => v.delerBoligTilstand !== 'ja' && (v.antallVoksne || 1) < 2,
  },
  {
    id: 'lønnsøkning',
    tittel: 'Hva en 10% lønnsøkning betyr',
    beskriv: (d) => 'Med 10% høyere lønn ville du hatt ' + fp_fmtMnd(d.lønnsøkningMnd) + ' mer å disponere etter skatt hver måned.',
    innsikt: (d) => 'Investert i fond i stedet for å bruke det opp, er det ' + fp_fmt(d.lønnsøkningIFond) + ' om 5 år.',
    handling: 'Verdt å spørre om?',
    ikon: '📊',
    relevant: (v) => v.inntekt > 0,
  },
];

// ─── FORMATERINGSHJELPERE ───────────────────────────────────────────────────

function fp_fmt(n) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return new Intl.NumberFormat('no-NO', { maximumFractionDigits: 0 }).format(Math.round(n)) + ' kr';
}
function fp_fmtM(n) {
  if (isNaN(n)) return '—';
  return Math.abs(n) >= 1e6
    ? (n / 1e6).toFixed(2) + ' mill'
    : fp_fmt(n);
}
function fp_fmtPct(n) {
  return (n * 100).toFixed(1) + ' %';
}
function fp_fmtMnd(n) {
  return new Intl.NumberFormat('no-NO', { maximumFractionDigits: 0 }).format(Math.round(n)) + ' kr/mnd';
}

window.FP = FP;
window.fp_fmt = fp_fmt;
window.fp_fmtM = fp_fmtM;
window.fp_fmtPct = fp_fmtPct;
window.fp_fmtMnd = fp_fmtMnd;
