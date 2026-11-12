#!/usr/bin/env node
/* Prova automàtica de l'aplicatiu «Monomis i polinomis» (3r d'ESO · tema 2).
   Ús (des de la carpeta web/):   node proves/prova-monomis-polinomis.js [vegades]
   Comprova que els enunciats són vàlids (sense termes semblants als polinomis, terme de grau
   més alt únic, Fàcil sense negatius ni més d'una lletra), que entre les opcions de part
   literal hi ha la bona i cap de repetida, que als exercicis de semblants n'hi ha almenys un
   de bo i un de fals, i que les comprovacions accepten la resposta bona i rebutgen errors. */
'use strict';
const path = require('path');
const M = require(path.join(__dirname, '..', 'assets', 'monomis-polinomis.js'));
const VEGADES = Number(process.argv[2]) || 3000;
let errors = 0;
const falla = (msg, ex) => { errors++; if (errors <= 20) console.log('✗ ' + msg + '\n  ' + JSON.stringify(ex)); };
const lletres = m => Object.keys(m.v);
for (const nivell of ['facil', 'normal']) for (const tipus of ['monomi', 'polinomi', 'semblants']) {
  for (let k = 0; k < VEGADES; k++) {
    const ex = M.genera(nivell, tipus);
    const mons = tipus === 'monomi' ? [ex.m] : tipus === 'polinomi' ? ex.ts : [ex.obj, ...ex.llista];
    for (const m of mons) {
      if (m.n === 0 || m.d < 1) falla('coeficient no vàlid', ex);
      if (nivell === 'facil' && (m.n < 0 || m.d !== 1 || lletres(m).length > 1)) falla('Fàcil fora de lloc', ex);
      if (Object.values(m.v).some(e => e < 1)) falla('exponent < 1', ex);
    }
    if (tipus === 'monomi') {
      const m = ex.m, ops = M.opcionsLit(m);
      if (!ops.includes(M.clauLit(m)) || new Set(ops).size !== ops.length || ops.length < 3) falla('opcions de part literal', ops);
      const bo = { coef: { n: m.n, d: m.d }, lit: M.clauLit(m), grau: M.grau(m) };
      if (!M.comprovaMonomi(ex, bo).ok) falla('rebutja el monomi bo', ex);
      if (M.comprovaMonomi(ex, { ...bo, grau: bo.grau + 1 }).ok) falla('accepta un grau dolent', ex);
      if (M.comprovaMonomi(ex, { ...bo, coef: { n: -m.n, d: m.d } }).ok) falla('accepta el signe canviat', ex);
    } else if (tipus === 'polinomi') {
      const ts = ex.ts, claus = ts.map(M.clauLit), gs = ts.map(M.grau), mx = Math.max(...gs);
      if (new Set(claus).size !== ts.length) falla('termes semblants al polinomi', ex);
      if (gs.filter(g => g === mx).length !== 1) falla('terme de grau més alt no únic', ex);
      const ti = ts.find(t => !lletres(t).length);
      const bo = { nt: ts.length, alt: gs.indexOf(mx), grau: mx, ti: ti ? { n: ti.n, d: ti.d } : { n: 0, d: 1 } };
      if (!M.comprovaPolinomi(ex, bo).ok) falla('rebutja el polinomi bo', ex);
      if (!ti && !M.comprovaPolinomi(ex, { ...bo, ti: null }).ok) falla('rebutja ti buit quan no en té', ex);
      if (M.comprovaPolinomi(ex, { ...bo, alt: (bo.alt + 1) % ts.length }).ok) falla('accepta un terme de grau més alt dolent', ex);
    } else {
      const bons = new Set(ex.llista.map((m, i) => M.mateixaLit(m, ex.obj) ? i : -1).filter(i => i >= 0));
      if (!bons.size || bons.size === ex.llista.length) falla('semblants sense bons o sense falsos', ex);
      if (!M.comprovaSemblants(ex, bons).ok) falla('rebutja la selecció bona', ex);
      const mes = new Set([...bons, ex.llista.findIndex((m, i) => !bons.has(i))]);
      if (M.comprovaSemblants(ex, mes).ok) falla('accepta un fals', ex);
    }
  }
}
const L = [['3', { n: 3, d: 1 }], ['-3', { n: -3, d: 1 }], ['−1/2', { n: -1, d: 2 }], ['2/4', { n: 1, d: 2 }], ['−', { n: -1, d: 1 }]];
for (const [s, v] of L) { const g = M.llegeixQ(s); if (!g || g.n !== v.n || g.d !== v.d) falla('llegeixQ ' + s, g); }
if (!Number.isNaN(M.llegeixQ('x'))) falla('llegeixQ accepta lletres', {});
console.log(errors ? `✗ ${errors} errors` : `✓ Tot correcte (${VEGADES} per nivell i tipus)`);
process.exit(errors ? 1 : 0);
