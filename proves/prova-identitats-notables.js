#!/usr/bin/env node
/* Prova automàtica de l'aplicatiu «Identitats notables» (3r d'ESO · tema 2).
   Ús (des de la carpeta web/):   node proves/prova-identitats-notables.js [vegades]
   Comprova, avaluant en diversos valors, que el desenvolupament és igual al producte; que
   les expressions «no és identitat» no ho són de cap manera; i que les comprovacions
   accepten la resposta bona i rebutgen els errors típics (oblidar 2ab, no elevar el
   coeficient, b² negatiu, signe del doble producte, signe de b en reconèixer). */
'use strict';
const path = require('path');
const M = require(path.join(__dirname, '..', 'assets', 'identitats-notables.js'));
const VEGADES = Number(process.argv[2]) || 3000;
let errors = 0;
const falla = (msg, ex) => { errors++; if (errors <= 20) console.log('✗ ' + msg + '\n  ' + JSON.stringify(ex)); };
const val = (terms, x) => terms.reduce((a, t) => a + t.c * x ** t.e, 0);
const compta = {};
for (const nivell of ['facil', 'normal']) for (const mode of ['des', 'rec']) {
  for (let k = 0; k < VEGADES; k++) {
    const ex = M.genera(nivell, mode);
    compta[nivell + '-' + mode + '-' + ex.tipus] = (compta[nivell + '-' + mode + '-' + ex.tipus] || 0) + 1;
    const d = M.desenvolupa(ex);
    for (const x of [-3, -1, 0, 2, 5]) {
      const a = ex.k * x ** ex.p;
      const prod = ex.tipus === 'suma' ? (a + ex.b) ** 2 : ex.tipus === 'dif' ? (a - ex.b) ** 2 : ex.tipus === 'sxd' ? (a + ex.b) * (a - ex.b) : null;
      if (prod !== null && prod !== val(d, x)) falla('desenvolupament incorrecte', ex);
    }
    if (nivell === 'facil' && (ex.k !== 1 || ex.p !== 1 || ex.tipus === 'no')) falla('Fàcil fora de lloc', ex);
    if (ex.tipus === 'no') {
      if (mode !== 'rec') falla('«no» fora del mode reconeix', ex);
      /* no pot ser cap quadrat (A ± B)² ni A² − B² amb A = k x^p, B = b */
      const t = d; if (t.length === 3 && Math.abs(t[1].c) === 2 * ex.k * ex.b) falla('el fals és una identitat', ex);
      if (t.length === 2 && t[1].c < 0) falla('el fals és una diferència de quadrats', ex);
      if (!M.comprovaTipus(ex, 'no').ok) falla('rebutja «no»', ex);
      if (M.comprovaTipus(ex, 'suma').ok) falla('accepta suma en un fals', ex);
      continue;
    }
    if (!M.comprovaTipus(ex, ex.tipus).ok) falla('rebutja el tipus bo', ex);
    for (const t of ['suma', 'dif', 'sxd', 'no']) if (t !== ex.tipus && M.comprovaTipus(ex, t).ok) falla('accepta un tipus dolent', ex);
    if (mode === 'des') {
      if (!M.comprovaAB(ex, { c: ex.k, e: ex.p }, ex.b).ok) falla('rebutja a i b', ex);
      const bo = d.map(t => ({ c: t.c, e: t.e }));
      if (!M.comprovaDes(ex, bo).ok) falla('rebutja el desenvolupament bo', ex);
      if (ex.tipus !== 'sxd') {
        const r = M.comprovaDes(ex, bo.map((t, i) => i === 1 ? { c: null, e: null } : t)); if (r.ok || !/doble producte/.test(r.msg)) falla('no detecta 2ab oblidat', ex);
        const r2 = M.comprovaDes(ex, bo.map((t, i) => i === 2 ? { c: -t.c, e: 0 } : t)); if (r2.ok) falla('accepta b² negatiu', ex);
        const r3 = M.comprovaDes(ex, bo.map((t, i) => i === 1 ? { c: -t.c, e: t.e } : t)); if (r3.ok) falla('accepta el signe del mig canviat', ex);
      }
      if (ex.k > 1) { const r = M.comprovaDes(ex, bo.map((t, i) => i === 0 ? { c: ex.k, e: t.e } : t)); if (r.ok || !/coeficient inclòs/.test(r.msg)) falla('no detecta (2a)² = 2a²', ex); }
    } else {
      const bB = ex.tipus === 'dif' ? -ex.b : ex.b;
      if (!M.comprovaRec(ex, { c: ex.k, e: ex.p }, bB).ok) falla('rebutja el producte bo', ex);
      if (M.comprovaRec(ex, { c: ex.k, e: ex.p }, -bB).ok) falla('accepta b amb el signe canviat', ex);
      if (M.comprovaRec(ex, { c: ex.k, e: ex.p }, ex.b * ex.b === ex.b ? 99 : ex.b * ex.b).ok) falla('accepta b² en lloc de b', ex);
    }
  }
}
console.log(Object.entries(compta).map(([k, v]) => k + ' ' + v).join(', '));
console.log(errors ? `✗ ${errors} errors` : '✓ Tot correcte');
process.exit(errors ? 1 : 0);
