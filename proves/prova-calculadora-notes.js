// Prova dels càlculs de la calculadora de notes: node proves/prova-calculadora-notes.js
const N = require('../assets/calculadora-notes.js');
let mal = 0;
const eq = (a, b, que) => {
  const ok = typeof b === 'number' ? Math.abs(a - b) < 1e-9 : JSON.stringify(a) === JSON.stringify(b);
  if (!ok) { mal++; console.log('✗', que, '→', a, 'i havia de ser', b); }
};

// arrodoniment: < 5 es trunca; a partir de 5, ,75 o més puja
[[4.99, 4], [4.75, 4], [0.9, 0], [5, 5], [5.74, 5], [5.75, 6], [6.749, 6], [6.75, 7],
 [9.74, 9], [9.75, 10], [10, 10]].forEach(([x, r]) => eq(N.arrodoneix(x), r, 'arrodoneix ' + x));
// 7.3 + 0.45 = 7.75 amb error de coma flotant → ha de pujar a 8
eq(N.arrodoneix(7.3 + 0.45), 8, 'coma flotant 7,75');

// trimestre amb 1 test: (E1 + 2·E2)/3 · 0,9 + T · 0,1
const c1 = N.coeficientsTrimestre(1);
eq(N.nota(c1, [6, 7, 8]).nota, (6 + 14) / 3 * 0.9 + 0.8, '1 test');
// amb 2 tests: (E1 + 2·E2)/3 · 0,8 + 0,1·T1 + 0,1·T2
const c2 = N.coeficientsTrimestre(2);
eq(N.nota(c2, [5, 8, 6, 10]).nota, 7 * 0.8 + 0.6 + 1, '2 tests');
// provisional: només l'examen 1 → la nota és aquest examen
eq(N.nota(c1, [6.5, null, null]), { nota: 6.5, provisional: true }, 'provisional');

// final: (T1 + 2·T2 + 3·T3)/6
eq(N.nota(N.coeficientsFinal(), [6, 7, 8]).nota, (6 + 14 + 24) / 6, 'final');

// quina nota necessito: E1 = 7, T = 8, vull un 8 → 0,3·7 + 0,6·x + 0,8 ≥ 7,75 → x ≥ 8,0833 → 8,09
eq(N.necessita(c1, [7, null, 8], 8), { buides: [1], cal: 8.09 }, 'necessito 8');
// aprovar la final amb T1 = 4, T2 = 4,5: 4/6 + 9/6 + 0,5·x ≥ 5 → x ≥ 5,6667 → 5,67
eq(N.necessita(N.coeficientsFinal(), [4, 4.5, null], 5), { buides: [2], cal: 5.67 }, 'aprovar final');
// impossible
const imp = N.necessita(c1, [2, null, 2], 9);
eq(imp.impossible, true, 'impossible');
// ja assegurat
eq(N.necessita(N.coeficientsFinal(), [10, 10, null], 2).assegurat, true, 'assegurat');
// dues caselles buides: la mateixa nota a totes (E2 i T): 0,3·6 + 0,7·x ≥ 5 → x ≥ 4,5714 → 4,58
eq(N.necessita(c1, [6, null, null], 5), { buides: [1, 2], cal: 4.58 }, 'dues buides');
// comprova que la nota que dona arriba de debò a l'objectiu
for (let o = 5; o <= 10; o++) for (let a = 0; a <= 10; a += 0.5) for (let t = 0; t <= 10; t += 1) {
  const r = N.necessita(c1, [a, null, t], o);
  if (r.cal !== undefined) {
    const n = N.nota(c1, [a, r.cal, t]).nota;
    if (N.arrodoneix(n) < o) { mal++; console.log('✗ no arriba', a, t, o, r.cal, n); }
    const menys = N.nota(c1, [a, r.cal - 0.01, t]).nota;
    if (N.arrodoneix(menys) >= o) { mal++; console.log('✗ no és el mínim', a, t, o, r.cal); }
  }
}
console.log(mal ? mal + ' errors' : 'Tot correcte');
process.exit(mal ? 1 : 0);
