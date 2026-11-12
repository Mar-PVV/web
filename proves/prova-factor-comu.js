#!/usr/bin/env node
/* Prova automàtica de l'aplicatiu «Factor comú» (3r d'ESO · tema 2).
   Ús (des de la carpeta web/):   node proves/prova-factor-comu.js [vegades]
   Comprova que g·x^m·Q torna a donar el polinomi de l'enunciat (avaluant-lo), que el
   factor comú és el màxim (m.c.d. dels coeficients i exponent mínim), que el Fàcil no té
   negatius ni lletra al factor comú, i que les comprovacions accepten la resposta bona i
   rebutgen els errors típics (un divisor que no és el més gran, l'exponent gran, l'1 oblidat). */
'use strict';
const path = require('path');
const M = require(path.join(__dirname, '..', 'assets', 'factor-comu.js'));
const VEGADES = Number(process.argv[2]) || 3000;
let errors = 0;
const falla = (msg, ex) => { errors++; if (errors <= 20) console.log('✗ ' + msg + '\n  ' + JSON.stringify(ex)); };
const val = (terms, x) => terms.reduce((a, t) => a + t.c * x ** t.e, 0);
let un = 0;
for (const nivell of ['facil', 'normal']) {
  for (let k = 0; k < VEGADES; k++) {
    const ex = M.genera(nivell);
    for (const x of [-2, -1, 1, 2, 3]) if (ex.g * x ** ex.m * val(ex.Q, x) !== val(ex.terms, x)) falla('g·x^m·Q no torna a donar el polinomi', ex);
    if (M.gcdL(ex.terms.map(t => t.c)) !== ex.g) falla('g no és el m.c.d.', ex);
    if (Math.min(...ex.terms.map(t => t.e)) !== ex.m) falla('m no és l\'exponent mínim', ex);
    if (new Set(ex.terms.map(t => t.e)).size !== ex.terms.length) falla('termes semblants a l\'enunciat', ex);
    if (ex.terms.some(t => Math.abs(t.c) > 60)) falla('coeficient massa gran', ex);
    if (ex.terms[0].c < 0) falla('primer terme negatiu', ex);
    if (nivell === 'facil' && (ex.m !== 0 || ex.terms.some(t => t.c < 0) || ex.g < 2)) falla('Fàcil fora de lloc', ex);
    if (nivell === 'normal' && ex.m < 1) falla('Normal sense lletra comuna', ex);
    if (!M.comprovaNombre(ex, ex.g).ok) falla('rebutja el nombre bo', ex);
    if (ex.g > 1) { const d = [...Array(ex.g).keys()].slice(1).reverse().find(d => ex.g % d === 0); if (d && M.comprovaNombre(ex, d).ok) falla('accepta un divisor no màxim', ex); }
    if (!M.comprovaLletra(ex, ex.m).ok) falla('rebutja l\'exponent bo', ex);
    const emax = Math.max(...ex.terms.map(t => t.e)); if (emax > ex.m && M.comprovaLletra(ex, emax).ok) falla('accepta l\'exponent més gran', ex);
    const bo = ex.Q.map(q => ({ c: q.c, e: q.e }));
    if (!M.comprovaDins(ex, bo).ok) falla('rebutja el parèntesi bo', ex);
    const buit0 = ex.Q.map(q => ({ c: q.c, e: q.e === 0 ? null : q.e }));
    if (!M.comprovaDins(ex, buit0).ok) falla('rebutja l\'exponent buit quan és 0', ex);
    const i1 = ex.Q.findIndex(q => Math.abs(q.c) === 1 && q.e === 0);
    if (i1 >= 0) { un++; const r = M.comprovaDins(ex, ex.Q.map((q, i) => ({ c: i === i1 ? null : q.c, e: q.e }))); if (r.ok || !/un 1/.test(r.msg)) falla('no detecta l\'1 oblidat', ex); }
  }
}
console.log(`${VEGADES} exercicis per nivell · ${un} amb el cas de l'1`);
console.log(errors ? `✗ ${errors} errors` : '✓ Tot correcte');
process.exit(errors ? 1 : 0);
