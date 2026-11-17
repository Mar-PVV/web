#!/usr/bin/env node
/* Prova automàtica de l'aplicatiu «Funcions a trossos» (1r BTX · tema 2).
   Ús (des de la carpeta web/):   node proves/prova-funcions-trossos.js
   Comprova que les expressions es llegeixen i s'avaluen bé (multiplicació implícita,
   prioritats, −x² = −(x²), arrels, valor absolut, decimals amb coma), que el TeX és el
   que toca, i que la revisió dels intervals detecta trossos que es trepitgen i forats. */
'use strict';
const path = require('path');
const M = require(path.join(__dirname, '..', 'assets', 'funcions-trossos.js'));
let errors = 0, fets = 0;
const falla = msg => { errors++; console.log('✗ ' + msg); };
const igual = (a, b) => (isNaN(a) && isNaN(b)) || Math.abs(a - b) < 1e-9;

// ── Avaluació ────────────────────────────────────────────────────────────
const CASOS = [
  ['x+4', -2, 2], ['2x-10', -2, -14], ['3-x', 1, 2], ['-x^2', 3, -9], ['-2^2', 0, -4],
  ['2x^2', 3, 18], ['(2x)^2', 3, 36], ['x^2-3x+2', 1, 0], ['3(x+1)', 2, 9], ['x(x-1)', 4, 12],
  ['(x+1)(x-1)', 3, 8], ['1/x', 0, NaN], ['1/x', 4, 0.25], ['(x+1)/(x-2)', 3, 4], ['x/2+1', 4, 3],
  ['sqrt(x)', 9, 3], ['sqrt(x)', -1, NaN], ['√(x+7)', 2, 3], ['arrel(2x+1)', 4, 3], ['cbrt(x)', -8, -2],
  ['|x-3|', 1, 2], ['abs(x)', -5, 5], ['2|x|+1', -3, 7], ['2,5x', 2, 5], ['0.5x', 4, 2],
  ['x²', 3, 9], ['x³', -2, -8], ['2·x', 3, 6], ['x−1', 3, 2], ['x^-1', 2, 0.5], ['2^x', 3, 8],
  ['x^(1/3)', -8, -2], ['ln(x)', 1, 0], ['log(100)', 0, 2], ['exp(0)', 5, 1], ['e^x', 0, 1],
  ['pi', 0, Math.PI], ['sin(0)', 0, 0], ['5', 7, 5], ['-x+1', 2, -1], ['x/(x-1)', 1, NaN],
  ['2(x-1)^2+3', 3, 11], ['-(x+1)', 2, -3], ['x^2/4', 2, 1], ['(x^2-1)/(x-1)', 2, 3],
];
for (const [e, x, esperat] of CASOS) {
  fets++;
  try {
    const v = M.avalua(M.llegeix(e), x);
    if (!igual(v, esperat)) falla(`${e} amb x = ${x} dona ${v} i hauria de donar ${esperat}`);
  } catch (err) { falla(`${e} no es llegeix: ${err.message}`); }
}

// ── Expressions mal escrites: han de donar error amb missatge ───────────
for (const e of ['', '2x+', '(x+1', 'x+1)', 'y+1', 'sqrt', '2**x', '|x+1', 'x$2']) {
  fets++;
  try { M.llegeix(e); falla(`«${e}» s'hauria de rebutjar`); }
  catch (err) { if (!err.message) falla(`«${e}» falla sense missatge`); }
}

// ── TeX ──────────────────────────────────────────────────────────────────
const TEX = [
  ['2x-10', '2x-10'], ['x+4', 'x+4'], ['(x+1)/(x-2)', '\\dfrac{x+1}{x-2}'], ['sqrt(x+4)', '\\sqrt{x+4}'],
  ['-x^2', '-x^{2}'], ['2,5x', '2{,}5x'], ['|x-3|', '\\left|x-3\\right|'], ['3(x+1)', '3\\left(x+1\\right)'],
  ['2*3', '2\\cdot 3'], ['x^(1/2)', 'x^{\\dfrac{1}{2}}'], ['x-(x+1)', 'x-\\left(x+1\\right)'],
];
for (const [e, t] of TEX) {
  fets++;
  const r = M.tex(M.llegeix(e));
  if (r !== t) falla(`TeX de ${e}: «${r}» (s'esperava «${t}»)`);
}
// substitució: f(−2) = 2·(−2) − 10
const SUB = [
  ['2x-10', -2, '2\\cdot (-2)-10'], ['x^2', -3, '(-3)^{2}'], ['3-x', 1, '3-1'], ['x+4', 2.5, '2{,}5+4'],
  ['sqrt(x+7)', 2, '\\sqrt{2+7}'],
];
for (const [e, x, t] of SUB) {
  fets++;
  const r = M.tex(M.llegeix(e), { sub: x });
  if (r !== t) falla(`substitució de ${e} amb x = ${x}: «${r}» (s'esperava «${t}»)`);
}

// ── Intervals ────────────────────────────────────────────────────────────
const T = (expr, a, ai, b, bi) => ({ expr, a, ai, b, bi });
function prova(nom, trossos, errors_, infos_) {
  fets++;
  const r = M.revisa(trossos);
  const e = r.avisos.filter(a => a.tipus === 'error').length, i = r.avisos.filter(a => a.tipus === 'info').length;
  if (e !== errors_ || i !== infos_) falla(`${nom}: ${e} errors i ${i} avisos (s'esperaven ${errors_} i ${infos_}) · ${r.avisos.map(a => a.text).join(' | ')}`);
  return r;
}
prova('tres rectes', [T('x+4', '', 0, '-3', 0), T('2x-10', '-3', 1, '0', 0), T('3-x', '0', 1, '', 0)], 0, 0);
prova('el 0 a dos trossos', [T('x', '', 0, '0', 1), T('-x', '0', 1, '', 0)], 1, 0);
prova('el 0 a cap tros', [T('x', '', 0, '0', 0), T('-x', '0', 0, '', 0)], 0, 1);
prova('es trepitgen', [T('x', '', 0, '2', 0), T('-x', '0', 1, '', 0)], 1, 0);
prova('forat entre 1 i 2', [T('x', '', 0, '1', 1), T('-x', '2', 0, '', 0)], 0, 1);
prova('punt a part', [T('x^2-1', '', 0, '1', 0), T('3', '1', 1, '1', 1), T('x^2-1', '1', 0, '', 0)], 0, 0);
prova('interval tancat', [T('2', '0', 1, '1', 0), T('3,5', '1', 1, '3', 0), T('5', '3', 1, '6', 1)], 0, 1);
prova('tot R', [T('x^2', '', 0, '', 0)], 0, 0);
prova('desordenats', [T('3-x', '0', 1, '', 0), T('x+4', '', 0, '-3', 0), T('2x-10', '-3', 1, '0', 0)], 0, 0);
prova('límits amb fraccions', [T('x', '', 0, '1/2', 0), T('1', '0,5', 1, '', 0)], 0, 0);
{
  fets++;
  const r = M.revisa([T('x', '3', 1, '1', 0)]);
  if (!r.trossos[0].errInt) falla('un interval buit (3 ≤ x < 1) hauria de donar error');
  const r2 = M.revisa([T('x', 'x', 1, '1', 0)]);
  if (!r2.trossos[0].errInt) falla('un límit amb x hauria de donar error');
  const r3 = M.revisa([T('x', '2', 0, '2', 1)]);
  if (!r3.trossos[0].errInt) falla('2 < x ≤ 2 hauria de donar error');
}
// condicions en TeX i text
{
  fets++;
  const I = { a: -3, ai: true, b: 0, bi: false };
  if (M.texCondicio(I) !== '-3\\le x<0') falla('texCondicio: ' + M.texCondicio(I));
  if (M.textCondicio(I) !== '−3 ≤ x < 0') falla('textCondicio: ' + M.textCondicio(I));
  if (M.texCondicio({ a: -Infinity, ai: false, b: -3, bi: false }) !== 'x<-3') falla('x < −3');
  if (M.texCondicio({ a: 0, ai: true, b: Infinity, bi: false }) !== 'x\\ge 0') falla('x ≥ 0');
}

console.log(errors ? `\n${errors} errors en ${fets} comprovacions.` : `✓ ${fets} comprovacions correctes.`);
process.exit(errors ? 1 : 0);
