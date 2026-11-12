#!/usr/bin/env node
/* Prova automàtica de l'aplicatiu «Multiplicació de polinomis» (3r d'ESO · tema 2).
   Ús (des de la carpeta web/):   node proves/prova-multiplica-polinomis.js [vegades]
   Genera molts exercicis de cada nivell i comprova, avaluant els factors i el resultat en
   diversos valors de x, que el resultat és correcte; que el nivell Fàcil no té negatius;
   i que les comprovacions accepten la resposta bona i rebutgen els errors típics
   (exponents multiplicats, signe canviat, coeficients sumats, resultat amb el signe malament). */
'use strict';
const path = require('path');
const M = require(path.join(__dirname, '..', 'assets', 'multiplica-polinomis.js'));
const VEGADES = Number(process.argv[2]) || 3000;
let errors = 0;
const falla = (msg, ex) => { errors++; if (errors <= 20) console.log('✗ ' + msg + '\n  ' + JSON.stringify(ex)); };
const val = (terms, x) => terms.reduce((a, t) => a + t.c * x ** t.e, 0);

for (const nivell of ['facil', 'normal']) {
  const tipus = {};
  for (let k = 0; k < VEGADES; k++) {
    const ex = M.genera(nivell);
    tipus[ex.tipus] = (tipus[ex.tipus] || 0) + 1;
    const P = M.productes(ex), r = M.reduce(P);
    for (const x of [-3, -2, -1, 0, 1, 2, 5]) if (val(ex.A, x) * val(ex.B, x) !== val(r, x)) falla(`resultat incorrecte (x=${x})`, ex);
    if (P.length !== ex.A.length * ex.B.length) falla('nombre de productes', ex);
    if (nivell === 'facil' && ex.A.concat(ex.B).some(t => t.c < 0)) falla('negatiu al Fàcil', ex);
    if (ex.A.concat(ex.B).some(t => t.c === 0)) falla('coeficient 0 a l\'enunciat', ex);
    if (ex.tipus === 'pp' && r.length < 2) falla('resultat massa curt', ex);
    for (const p of P) {
      if (!M.comprovaProducte(p, { c: p.c, e: p.e }).ok) falla('rebutja un producte bo', p);
      if (p.e === 0 && !M.comprovaProducte(p, { c: p.c, e: null }).ok) falla('rebutja exponent buit per a un nombre', p);
      if (M.comprovaProducte(p, { c: -p.c, e: p.e }).ok) falla('accepta el signe canviat', p);
      if (p.a.e > 1 && p.b.e > 1 && p.a.e * p.b.e !== p.e) { const q = M.comprovaProducte(p, { c: p.c, e: p.a.e * p.b.e }); if (q.ok || !/se sumen/.test(q.msg)) falla('no detecta exponents multiplicats', p); }
    }
    const maxG = Math.max(...P.map(t => t.e)), graus = [...Array(maxG + 1).keys()].reverse();
    const vals = {}; graus.forEach(e => { const t = r.find(t => t.e === e); vals[e] = t ? t.c : null; });
    if (!M.comprovaResultat(P, graus, vals).ok) falla('rebutja el resultat bo', ex);
    const mal = Object.assign({}, vals, { [r[0].e]: -r[0].c });
    if (M.comprovaResultat(P, graus, mal).ok) falla('accepta un resultat amb el signe canviat', ex);
  }
  console.log(`${nivell}: ${VEGADES} exercicis · ${Object.entries(tipus).map(([k, v]) => k + ' ' + v).join(', ')}`);
}
console.log(errors ? `✗ ${errors} errors` : '✓ Tot correcte');
process.exit(errors ? 1 : 0);
