/**
 * Frihetsplanen — retning-data.js
 * Spørsmål, svaralternativer og poengvekting for "Finn din balanse"-quizen.
 * Ingen DOM-manipulasjon her — kun data.
 */

const RD = {};

// ─── YRKESPROFILER ───────────────────────────────────────────────────────
// 8 profiler quizen kan peke mot. Poengsummen for hver bygges opp gjennom
// svarene i RD.SPØRSMÅL nedenfor.

RD.PROFILER = {
  bygger: {
    navn: 'Bygger og skaper',
    ikon: '🔨',
    beskrivelse: 'Du trives med å se konkrete resultater av arbeidet ditt — noe du kan ta på, vise frem, være stolt av.',
    retning: 'Håndverksfag, snekring, elektriker, anleggsarbeid, eget verksted.',
  },
  problemløser: {
    navn: 'Problemløseren',
    ikon: '🧩',
    beskrivelse: 'Du blir energisk av en floke ingen andre har løst ennå.',
    retning: 'IT, ingeniørfag, teknisk support, dataanalyse.',
  },
  menneskemotor: {
    navn: 'Menneskemotoren',
    ikon: '🤝',
    beskrivelse: 'Du henter energi fra å gjøre andres hverdag bedre.',
    retning: 'Helse og omsorg, undervisning, sosialt arbeid.',
  },
  entreprenør: {
    navn: 'Den frie entreprenøren',
    ikon: '🚀',
    beskrivelse: 'Du vil styre din egen tid og bygge noe som er ditt.',
    retning: 'Eget firma, frilans, konsulentvirksomhet.',
  },
  strateg: {
    navn: 'Strategen',
    ikon: '📊',
    beskrivelse: 'Du trives med planlegging, tall og forutsigbarhet — og blir motivert av å se ting gå riktig vei over tid.',
    retning: 'Finans, økonomi, administrasjon.',
  },
  selger: {
    navn: 'Selgeren / kontaktskaperen',
    ikon: '🤳',
    beskrivelse: 'Du blir drevet av å overbevise, vinne og bygge relasjoner som gir resultater.',
    retning: 'Salg, kundeservice, markedsføring.',
  },
  kreativ: {
    navn: 'Den kreative',
    ikon: '🎨',
    beskrivelse: 'Du trenger rom til å uttrykke deg og tenke nytt — rutine kveler deg.',
    retning: 'Design, kreative yrker, media.',
  },
  stødig: {
    navn: 'Den stødige',
    ikon: '🧭',
    beskrivelse: 'Du trives best når rammene er klare og du vet hva som forventes.',
    retning: 'Kontor, administrasjon, offentlig sektor, logistikk.',
  },
};

// ─── SPØRSMÅL ─────────────────────────────────────────────────────────────
// Hvert svaralternativ har en "poeng"-liste: [{ profil: 'bygger', p: 2 }, ...]
// poengvekt per spørsmål: praktiske spørsmål (3,4,8) = 2p, selvrapporterte (5,6,7) = 1p

RD.BRANSJER = [
  { id: 'student',  label: 'Student' },
  { id: 'helse',     label: 'Helse og omsorg' },
  { id: 'handverk',  label: 'Håndverk og bygg' },
  { id: 'finans',    label: 'Finans og økonomi' },
  { id: 'tech',      label: 'Teknologi og IT' },
  { id: 'salg',      label: 'Salg og kundeservice' },
  { id: 'kontor',    label: 'Kontor og administrasjon' },
  { id: 'kreativ',   label: 'Kreative yrker' },
  { id: 'industri',  label: 'Industri og produksjon' },
  { id: 'transport', label: 'Transport og logistikk' },
  { id: 'annet',     label: 'Annet' },
];

// Lett finjustering basert på bransje — lavere vekt enn de poengsatte spørsmålene
RD.BRANSJE_VEKT = {
  helse:     [{ profil: 'menneskemotor', p: 1 }],
  handverk:  [{ profil: 'bygger', p: 1 }],
  finans:    [{ profil: 'strateg', p: 1 }],
  tech:      [{ profil: 'problemløser', p: 1 }],
  salg:      [{ profil: 'selger', p: 1 }],
  kontor:    [{ profil: 'stødig', p: 1 }],
  kreativ:   [{ profil: 'kreativ', p: 1 }],
  industri:  [{ profil: 'bygger', p: 1 }],
  transport: [{ profil: 'stødig', p: 1 }],
};

RD.SPØRSMÅL = [

  // ─── 1. Bransje ─────────────────────────────────────────────────────────
  {
    id: 'bransje',
    type: 'bransje', // egen rendering — grid av knapper fra RD.BRANSJER
    tittel: 'Jeg er i dag:',
  },

  // ─── 2. Alder ───────────────────────────────────────────────────────────
  {
    id: 'alder',
    type: 'alder', // egen rendering — tall-input
    tittel: 'Hvor gammel er du?',
  },

  // ─── 3. Aldersavhengig refleksjon — 2 poeng ─────────────────────────────
  {
    id: 'alder_refleksjon_ung',
    type: 'valg',
    vekt: 2,
    visHvis: v => (v.alder || 30) < 35,
    tittel: 'Når jeg er 50 år, håper jeg at jeg kan se tilbake og si at jeg...',
    alternativer: [
      { id: 'trygghet', label: 'Tjente godt og bygget meg økonomisk trygghet', poeng: [{ profil: 'strateg', p: 2 }, { profil: 'stødig', p: 2 }] },
      { id: 'satset',   label: 'Turte å satse på noe jeg selv brydde meg om', poeng: [{ profil: 'entreprenør', p: 2 }, { profil: 'kreativ', p: 2 }] },
      { id: 'familie',  label: 'Hadde tid til familie og folk jeg er glad i', poeng: [{ profil: 'menneskemotor', p: 2 }, { profil: 'stødig', p: 2 }] },
      { id: 'reist',    label: 'Reiste og opplevde mye', poeng: [{ profil: 'kreativ', p: 2 }, { profil: 'entreprenør', p: 2 }] },
      { id: 'bygget',   label: 'Bygget eller skapte noe som varer', poeng: [{ profil: 'bygger', p: 2 }, { profil: 'problemløser', p: 2 }] },
    ],
  },
  {
    id: 'alder_refleksjon_eldre',
    type: 'valg',
    vekt: 2,
    visHvis: v => (v.alder || 30) >= 35,
    tittel: 'Hvis jeg var 18 år igjen, ville jeg...',
    alternativer: [
      { id: 'tryggere', label: 'Valgt en tryggere vei enn sist', poeng: [{ profil: 'stødig', p: 2 }, { profil: 'strateg', p: 2 }] },
      { id: 'satset',   label: 'Turt å satse mer enn jeg gjorde', poeng: [{ profil: 'entreprenør', p: 2 }] },
      { id: 'folk',     label: 'Brukt mindre tid på jobb, mer på folk rundt meg', poeng: [{ profil: 'menneskemotor', p: 2 }] },
      { id: 'reist',    label: 'Reist og opplevd mer før jeg "satte meg til ro"', poeng: [{ profil: 'kreativ', p: 2 }] },
      { id: 'startet',  label: 'Startet noe for meg selv tidligere', poeng: [{ profil: 'entreprenør', p: 2 }, { profil: 'bygger', p: 2 }] },
    ],
  },

  // ─── 4. Flax-lodd — 2 poeng ─────────────────────────────────────────────
  {
    id: 'flax',
    type: 'valg',
    vekt: 2,
    tittel: 'Du vant nettopp 50 000 kr på Flax-lodd. Det du bruker pengene på er:',
    alternativer: [
      { id: 'spart',    label: 'Betaler ned gjeld / sparer dem', type_navn: 'Trygghetsorientert', poeng: [{ profil: 'strateg', p: 2 }, { profil: 'stødig', p: 2 }] },
      { id: 'reise',     label: 'En reise, opplevelse eller noe jeg har drømt om', type_navn: 'Opplevelsesdrevet', poeng: [{ profil: 'kreativ', p: 2 }] },
      { id: 'invest',    label: 'Investerer i noe som kan gi mer penger senere', type_navn: 'Vekstorientert', poeng: [{ profil: 'strateg', p: 2 }, { profil: 'entreprenør', p: 1 }] },
      { id: 'deler',     label: 'Deler med familie eller venner', type_navn: 'Relasjonsdrevet', poeng: [{ profil: 'menneskemotor', p: 2 }] },
      { id: 'undertrykt',label: 'Noe jeg alltid har ønsket meg, men aldri "rettferdiggjort" å kjøpe', type_navn: 'Undertrykt behov', poeng: [{ profil: 'kreativ', p: 1 }, { profil: 'menneskemotor', p: 1 }] },
      { id: 'satser',    label: 'Starter eller satser på noe eget', type_navn: 'Entreprenørdrevet', poeng: [{ profil: 'entreprenør', p: 2 }, { profil: 'bygger', p: 1 }] },
    ],
  },

  // ─── 5. Verdier — 1 poeng ───────────────────────────────────────────────
  {
    id: 'verdier',
    type: 'valg',
    vekt: 1,
    tittel: 'Hva verdsetter du mest i en jobb?',
    alternativer: [
      { id: 'penger',   label: 'Penger og økonomisk trygghet', poeng: [{ profil: 'strateg', p: 1 }, { profil: 'selger', p: 1 }] },
      { id: 'frihet',   label: 'Frihet og fleksibilitet', poeng: [{ profil: 'entreprenør', p: 1 }, { profil: 'kreativ', p: 1 }] },
      { id: 'mening',   label: 'Mening og å hjelpe andre', poeng: [{ profil: 'menneskemotor', p: 1 }] },
      { id: 'status',   label: 'Status og anerkjennelse', poeng: [{ profil: 'selger', p: 1 }, { profil: 'strateg', p: 1 }] },
      { id: 'trygghet', label: 'Trygghet og stabilitet', poeng: [{ profil: 'stødig', p: 1 }, { profil: 'strateg', p: 1 }] },
    ],
  },

  // ─── 6. Arbeidsform — 1 poeng ───────────────────────────────────────────
  {
    id: 'arbeidsform',
    type: 'valg',
    vekt: 1,
    tittel: 'Hvordan liker du å jobbe?',
    alternativer: [
      { id: 'alene',     label: 'Alene', poeng: [{ profil: 'problemløser', p: 1 }, { profil: 'kreativ', p: 1 }] },
      { id: 'team',      label: 'I team', poeng: [{ profil: 'menneskemotor', p: 1 }, { profil: 'selger', p: 1 }] },
      { id: 'fysisk',    label: 'Fysisk og i bevegelse', poeng: [{ profil: 'bygger', p: 1 }] },
      { id: 'rolig',     label: 'Stillesittende og rolig', poeng: [{ profil: 'strateg', p: 1 }, { profil: 'stødig', p: 1 }] },
      { id: 'struktur',  label: 'Med fast struktur', poeng: [{ profil: 'stødig', p: 1 }, { profil: 'strateg', p: 1 }] },
      { id: 'fleksibelt',label: 'Fleksibelt og selvstyrt', poeng: [{ profil: 'entreprenør', p: 1 }, { profil: 'kreativ', p: 1 }] },
    ],
  },

  // ─── 7. Pensjonsangre — 1 poeng (+ kobling til Frihetsplanen-anbefaling) ─
  {
    id: 'angre',
    type: 'valg',
    vekt: 1,
    tittel: 'Ved pensjonsalder ville jeg angret mest på:',
    alternativer: [
      { id: 'ikke_spart',  label: 'Ikke spart nok', poeng: [{ profil: 'strateg', p: 1 }, { profil: 'stødig', p: 1 }], anbefaling: 'fullfør' },
      { id: 'ikke_reist',  label: 'Ikke reist nok i ung alder', poeng: [{ profil: 'kreativ', p: 1 }, { profil: 'entreprenør', p: 1 }], anbefaling: 'reise' },
      { id: 'bildrommen',  label: 'Å ha utsatt bildrømmen', poeng: [{ profil: 'selger', p: 1 }, { profil: 'strateg', p: 1 }], anbefaling: 'bil' },
      { id: 'ikke_familie',label: 'Ikke brukt nok tid med familie og venner', poeng: [{ profil: 'menneskemotor', p: 1 }, { profil: 'stødig', p: 1 }], anbefaling: 'jobbe_mindre' },
    ],
  },

  // ─── 8. Spare vs. bruke — 2 poeng ────────────────────────────────────────
  {
    id: 'spare_bruke',
    type: 'valg',
    vekt: 2,
    tittel: 'Hadde jeg måttet velge mellom å spare halvparten av pengene mine til pensjonstiden, eller bruke dem på noe mens jeg er ung, så ville jeg:',
    alternativer: [
      { id: 'spart_halv',  label: 'Spart dem — trygghet senere er viktigere for meg', poeng: [{ profil: 'strateg', p: 2 }, { profil: 'stødig', p: 2 }] },
      { id: 'brukt_halv',  label: 'Brukt dem — jeg vil leve nå, ikke vente på "en dag"', poeng: [{ profil: 'kreativ', p: 2 }, { profil: 'entreprenør', p: 1 }] },
      { id: 'delt_halv',   label: 'Delt det 50/50 uansett hva spørsmålet sier', poeng: [{ profil: 'stødig', p: 1 }, { profil: 'menneskemotor', p: 1 }] },
      { id: 'avkastning',  label: 'Brukt dem på noe som faktisk gir avkastning (utdanning, eget prosjekt, investering)', poeng: [{ profil: 'entreprenør', p: 2 }, { profil: 'problemløser', p: 1 }] },
    ],
  },
];

// ─── ANBEFALINGER — knyttet til spørsmål 7 sitt svar ─────────────────────

RD.ANBEFALINGER = {
  fullfør: {
    tittel: 'Fullfør Frihetsplanen',
    tekst: 'Se hele det økonomiske bildet ditt — og pensjonsmulighetene dine på slutten.',
    lenke: '../index.html',
    knapptekst: 'Gå til Frihetsplanen →',
  },
  reise: {
    tittel: 'Drømmereisen',
    tekst: 'Se når du faktisk har råd til reisen du har drømt om.',
    lenke: '../index.html',
    knapptekst: 'Regn ut reisen din →',
  },
  bil: {
    tittel: 'Bildrømmen',
    tekst: 'Regn ut når du faktisk har råd til den bilen.',
    lenke: '../kalkulatorer/bil.html',
    knapptekst: 'Åpne bil-kalkulatoren →',
  },
  jobbe_mindre: {
    tittel: 'Jobbe mindre',
    tekst: 'Se hvor langt unna du er fra å kunne jobbe mindre og ha mer tid til folk du er glad i.',
    lenke: '../index.html',
    knapptekst: 'Se når du kan jobbe mindre →',
  },
};

window.RD = RD;
