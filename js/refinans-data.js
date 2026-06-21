/* © 2026 Frihetsplanen (frihetsplan.no). Alle rettigheter forbeholdt. */
/**
 * Frihetsplanen — refinans-data.js
 * Konfigurasjon for refinansieringssiden: lånetyper, standardverdier,
 * besparelsesformel og tilbyder-liste (forberedt for fremtidige betalte plasseringer).
 */

const RF = {};

// ─── LÅNETYPER ────────────────────────────────────────────────────────────
// Strukturert som en liste, ikke faste felt — nye lånetyper kan legges til
// her uten å røre resten av koden. Hver type har egne skyver-grenser og
// en valgfri "import"-kobling mot data fra hovedflyten (Steg.tilstand).

RF.LÅNETYPER = [
  {
    id: 'bolig',
    navn: 'Boliglån',
    ikon: '🏠',
    beløp:   { min: 0, max: 10000000, step: 100000, standard: 3000000 },
    rente:   { min: 2, max: 8, step: 0.1, standard: 5.5 },
    løpetid: { min: 5, max: 30, step: 1, standard: 25 },
    importKilde: { beløp: 'boligLån', rente: 'boligRente' },
  },
  {
    id: 'bil',
    navn: 'Billån',
    ikon: '🚗',
    beløp:   { min: 0, max: 1000000, step: 10000, standard: 0 },
    rente:   { min: 0, max: 15, step: 0.1, standard: 7.5 },
    løpetid: { min: 1, max: 10, step: 1, standard: 5 },
    importKilde: { beløp: 'bilLån', rente: 'bilRente', løpetid: 'bilLopetid' },
  },
  {
    id: 'andre',
    navn: 'Andre lån / kreditt',
    ikon: '💳',
    beløp:   { min: 0, max: 500000, step: 5000, standard: 0 },
    rente:   { min: 0, max: 25, step: 0.5, standard: 12 },
    løpetid: { min: 1, max: 15, step: 1, standard: 5 },
    importKilde: { beløp: 'andreLån', rente: 'andreLånRente' },
  },
];

// ─── BESPARELSESFORMEL ────────────────────────────────────────────────────
// Isolert, navngitt funksjon — lett å justere antakelser senere uten å røre
// rendering-koden. Minimum forventet reduksjon er 0,5 prosentpoeng; med
// flere enn ett lån (og dermed flere tilbydere å konsolidere hos én bank)
// økes potensialet, opp mot 1,5 prosentpoeng.

RF.beregnBesparelse = function(lån) {
  const aktiveLån = lån.filter(l => l.beløp > 0);
  const totalGjeld = aktiveLån.reduce((sum, l) => sum + l.beløp, 0);
  if (totalGjeld === 0) {
    return { totalGjeld: 0, veidSnittrente: 0, minReduksjon: 0, maksReduksjon: 0, besparelseMndMin: 0, besparelseMndMaks: 0, besparelseÅrMin: 0, besparelseÅrMaks: 0 };
  }

  const veidSnittrente = aktiveLån.reduce((sum, l) => sum + l.beløp * l.rente, 0) / totalGjeld;

  // Minimum 0,5 prosentpoeng uansett. Med 2+ lån (flere tilbydere å samle)
  // økes potensialet — opptil 1,5 prosentpoeng ved 3 eller flere lån.
  const minReduksjon = 0.5;
  const maksReduksjon = aktiveLån.length >= 3 ? 1.5 : aktiveLån.length === 2 ? 1.0 : 0.5;

  const besparelseÅrMin = totalGjeld * (minReduksjon / 100);
  const besparelseÅrMaks = totalGjeld * (maksReduksjon / 100);

  return {
    totalGjeld,
    veidSnittrente,
    minReduksjon,
    maksReduksjon,
    besparelseMndMin: besparelseÅrMin / 12,
    besparelseMndMaks: besparelseÅrMaks / 12,
    besparelseÅrMin,
    besparelseÅrMaks,
  };
};

// ─── TILBYDERE ────────────────────────────────────────────────────────────
// Tom liste nå — forberedt for fremtidige betalte plasseringer. Når en
// avtale med en finansieringspartner er på plass, legg til et objekt her:
// { navn: 'Eksempel Bank', logo: 'url/til/logo.png', lenke: 'https://...', betalt: true }
// Render.js sjekker denne listen og viser en egen seksjon kun hvis den ikke er tom.

RF.TILBYDERE = [];

window.RF = RF;
