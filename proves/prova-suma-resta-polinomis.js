#!/usr/bin/env node
/* Prova automàtica de l'aplicatiu «Suma i resta de polinomis» (3r d'ESO · tema 2).
   Ús (des de la carpeta web/):   node proves/prova-suma-resta-polinomis.js [vegades]
   Genera molts exercicis de cada nivell i comprova, de manera independent (avaluant
   l'expressió original i el resultat en diversos valors de x), que el resultat és
   correcte; que el nivell Fàcil no té cap nombre negatiu; que hi ha termes per agrupar;
   i que les comprovacions de cada pas accepten la resposta bona i rebutgen els errors
   típics (signe del parèntesi sense canviar, només el primer canviat, terme fora del
   seu grup, signe del resultat). */
'use strict';
const path = require('path');
const M = require(path.join(__dirname, '..', 'assets', 'suma-resta-polinomis.js'));
const VEGADES = Number(process.argv[2]) || 3000;
let errors = 0;
const falla = (msg, ex) => { errors++; if (errors <= 20) console.log('✗ ' + msg + '\n  ' + JSON.stringify(ex)); };

const valPol = (terms, x) => terms.reduce((a, t) => a + t.c * x ** t.e, 0);
const valExpr = (ex, x) => ex.parts.reduce((a, p) => a + p.op * valPol(p.terms, x), 0);

for (const nivell of ['facil', 'normal']) {
  const tipus = {};
  for (let k = 0; k < VEGADES; k++) {
    const ex = M.genera(nivell);
    tipus[ex.tipus] = (tipus[ex.tipus] || 0) + 1;
    const f = M.flat(ex), r = M.reduce(f);
    for (const x of [-3, -2, -1, 0, 1, 2, 5, 7])
      if (valExpr(ex, x) !== valPol(r, x)) falla(`resultat incorrecte (x=${x})`, ex);
    if (r.some(t => t.c === 0)) falla('coeficient 0 al resultat', ex);
    if (r.some((t, i) => i > 0 && t.e >= r[i - 1].e)) falla('resultat no ordenat', ex);
    if (nivell === 'facil') {
      if (ex.parts.some(p => p.op < 0 || p.terms.some(t => t.c < 0))) falla('negatiu al nivell Fàcil', ex);
      if (ex.tipus === 'resta') falla('resta al nivell Fàcil', ex);
    }
    if (M.grups(f).filter(g => g.cs.length > 1).length < 2) falla('menys de dos grups per reduir', ex);
    if (ex.tipus !== 'redueix' && ex.parts.some(p => p.terms.some((t, i) => i > 0 && t.e >= p.terms[i - 1].e))) falla('polinomi de l\'enunciat no ordenat', ex);
    if (Math.max(...f.map(t => Math.abs(t.c))) > 9) falla('coeficient massa gran', ex);

    /* pas 1: treure parèntesis */
    if (ex.parts.some(p => p.op < 0)) {
      const bo = [], igual = [];
      ex.parts.forEach(p => { if (p.op < 0) p.terms.forEach(t => { bo.push(-t.c); igual.push(t.c); }); });
      if (!M.comprovaParentesis(ex, bo).ok) falla('pas 1: rebutja la resposta bona', ex);
      if (M.comprovaParentesis(ex, igual).ok) falla('pas 1: accepta el parèntesi sense canviar', ex);
      const primer = []; ex.parts.forEach(p => { if (p.op < 0) p.terms.forEach((t, j) => primer.push(j === 0 ? -t.c : t.c)); });
      const r1 = M.comprovaParentesis(ex, primer);
      if (r1.ok) falla('pas 1: accepta només el primer canviat', ex);
      else if (!/només el signe del primer/.test(r1.msg) && ex.parts.some(p => p.op < 0 && p.terms.length > 1)) falla('pas 1: no detecta «només el primer»', ex);
    }
    /* pas 2: agrupar (l'ordre dins de cada grup no importa) */
    const gs = M.grups(f);
    if (!M.comprovaAgrupa(f, gs.map(g => [...g.cs].reverse())).ok) falla('pas 2: rebutja la resposta bona', ex);
    const gsigne = gs.map((g, i) => i === 0 ? g.cs.map((c, j) => j === 0 ? -c : c) : g.cs);
    const rs = M.comprovaAgrupa(f, gsigne);
    if (rs.ok || !/signes/.test(rs.msg)) falla('pas 2: no detecta un signe canviat', ex);
    /* pas 3: resultat */
    const maxG = Math.max(...f.map(t => t.e)), graus = [...Array(maxG + 1).keys()].reverse();
    const vals = {}; graus.forEach(e => { const t = r.find(t => t.e === e); vals[e] = t ? t.c : null; });
    if (!M.comprovaResultat(f, graus, vals).ok) falla('pas 3: rebutja la resposta bona', ex);
    const vals0 = {}; graus.forEach(e => { const t = r.find(t => t.e === e); vals0[e] = t ? t.c : 0; });
    if (!M.comprovaResultat(f, graus, vals0).ok) falla('pas 3: rebutja els zeros escrits', ex);
    const t0 = r[0], valsMal = Object.assign({}, vals, { [t0.e]: -t0.c });
    if (M.comprovaResultat(f, graus, valsMal).ok) falla('pas 3: accepta un signe canviat', ex);
  }
  console.log(`${nivell}: ${VEGADES} exercicis · ${Object.entries(tipus).map(([k, v]) => k + ' ' + v).join(', ')}`);
}
/* lectura de caselles */
const L = [['5', 5], ['+5', 5], ['-5', -5], ['−5', -5], [' − 12 ', -12], ['−', -1], ['+', 1], ['', null], ['2x', NaN], ['1,5', NaN]];
for (const [s, v] of L) { const g = M.llegeix(s); if (!(Object.is(g, v) || (Number.isNaN(v) && Number.isNaN(g)))) falla(`llegeix(${JSON.stringify(s)}) = ${g}, esperat ${v}`, {}); }

console.log(errors ? `✗ ${errors} errors` : '✓ Tot correcte');
process.exit(errors ? 1 : 0);
