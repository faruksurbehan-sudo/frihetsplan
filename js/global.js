/**
 * KalkulatorHub — global.js
 * Delt databro mellom alle kalkulatorer via localStorage
 * 
 * Bruk:
 *   KH.save('bolig', { månedligNetto: 4200, formueOm15år: 8500000 })
 *   KH.get('bolig')   → { månedligNetto: 4200, ... }
 *   KH.all()          → { bolig: {...}, bil: {...}, ... }
 *   KH.on('change', fn)  → kalles når data endres fra en annen kalkulator
 */

const KH = (() => {
  const PREFIX = 'kh_';
  const listeners = {};

  // --- Lagre nøkkeltall fra én kalkulator ---
  function save(kalkulator, data) {
    const payload = {
      ...data,
      _oppdatert: Date.now(),
      _kalkulator: kalkulator,
    };
    localStorage.setItem(PREFIX + kalkulator, JSON.stringify(payload));
    _emit('change', { kalkulator, data: payload });
    _emit('change:' + kalkulator, payload);
  }

  // --- Hent nøkkeltall fra én kalkulator ---
  function get(kalkulator) {
    try {
      const raw = localStorage.getItem(PREFIX + kalkulator);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  // --- Hent alt ---
  function all() {
    const result = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(PREFIX)) {
        const name = key.slice(PREFIX.length);
        result[name] = get(name);
      }
    }
    return result;
  }

  // --- Slett én kalkulator ---
  function clear(kalkulator) {
    localStorage.removeItem(PREFIX + kalkulator);
  }

  // --- Slett alt ---
  function clearAll() {
    Object.keys(localStorage)
      .filter(k => k.startsWith(PREFIX))
      .forEach(k => localStorage.removeItem(k));
  }

  // --- Abonner på endringer ---
  function on(event, fn) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(fn);
    return () => { listeners[event] = listeners[event].filter(f => f !== fn); };
  }

  function _emit(event, data) {
    (listeners[event] || []).forEach(fn => fn(data));
  }

  // Lytt på storage-events fra andre faner
  window.addEventListener('storage', e => {
    if (e.key && e.key.startsWith(PREFIX)) {
      const kalkulator = e.key.slice(PREFIX.length);
      const data = e.newValue ? JSON.parse(e.newValue) : null;
      _emit('change', { kalkulator, data });
      _emit('change:' + kalkulator, data);
    }
  });

  // --- Hjelpefunksjoner for formattering (delt) ---
  const fmt    = n => new Intl.NumberFormat('no-NO', { maximumFractionDigits: 0 }).format(Math.round(n)) + ' kr';
  const fmtM   = n => Math.abs(n) >= 1e6 ? (n / 1e6).toFixed(2) + ' mill' : fmt(n);
  const fmtPct = n => n.toFixed(1) + ' %';
  const fmtMnd = n => new Intl.NumberFormat('no-NO', { maximumFractionDigits: 0 }).format(Math.round(n)) + ' kr/mnd';

  // --- Lag en "passive income"-sammendrag for FIRE ---
  function passivInntektSammendrag() {
    const bolig = get('bolig');
    const bil   = get('bil');
    const sources = [];

    if (bolig?.månedligNettoKontantflyt) {
      sources.push({
        navn: 'Utleiebolig',
        beløpPerMnd: bolig.månedligNettoKontantflyt,
        ikon: '🏠',
        href: '../kalkulatorer/utleiebolig.html',
      });
    }
    if (bil?.månedligNettoUtleie && bil.månedligNettoUtleie > 0) {
      sources.push({
        navn: 'Bilutleie',
        beløpPerMnd: bil.månedligNettoUtleie,
        ikon: '🚗',
        href: '../kalkulatorer/bil.html',
      });
    }

    const totalPerMnd = sources.reduce((s, x) => s + x.beløpPerMnd, 0);
    return { sources, totalPerMnd };
  }

  return { save, get, all, clear, clearAll, on, fmt, fmtM, fmtPct, fmtMnd, passivInntektSammendrag };
})();

window.KH = KH;
