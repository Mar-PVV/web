/* Calculadora de notes de 1r de batxillerat.
   Tot es calcula al navegador: no es desa ni s'envia res.
   Els criteris d'avaluació són a CRITERIS: si canvien, només cal tocar-los aquí
   (i el text de «Com es calcula?» a calculadora-notes.html).
   Prova: node proves/prova-calculadora-notes.js */
(function () {
  'use strict';

  const CRITERIS = {
    pesosExamens: [1, 2],           // examen 1 ×1, examen 2 ×2
    unTest:   { examens: 0.9, test: 0.1 },   // trimestre amb 1 test
    dosTests: { examens: 0.8, test: 0.1 },   // trimestre amb 2 tests (cada test)
    pesosTrimestres: [1, 2, 3]      // nota final, amb les notes sense arrodonir
  };

  // ── Càlculs (sense pantalla, per poder-los provar amb node) ────────────
  const net = x => Math.round(x * 1e6) / 1e6;

  /* Arrodoniment de matemàtiques: per sota de 5 es trunca; a partir de 5 es
     puja a l'enter següent si la part decimal arriba a ,75. */
  function arrodoneix(x) {
    x = net(x);
    const e = Math.floor(x);
    if (x < 5) return e;
    return net(x - e) >= 0.75 ? e + 1 : e;
  }

  // nota sense arrodonir mínima perquè l'arrodonida sigui com a mínim n
  const llindar = n => (n <= 5 ? n : n - 0.25);

  // «sense arrodonir»: tallada a dues xifres decimals
  const talla = x => Math.floor(net(x) * 100) / 100;

  function coeficientsTrimestre(tests) {
    const p = CRITERIS.pesosExamens, s = p[0] + p[1];
    const c = tests === 2 ? CRITERIS.dosTests : CRITERIS.unTest;
    const ex = [c.examens * p[0] / s, c.examens * p[1] / s];
    return tests === 2 ? ex.concat([c.test, c.test]) : ex.concat([c.test]);
  }

  function coeficientsFinal() {
    const p = CRITERIS.pesosTrimestres, s = p.reduce((a, b) => a + b, 0);
    return p.map(x => x / s);
  }

  /* Nota amb els valors que hi ha (null = encara no la té).
     Si en falta alguna, es fa la mitjana ponderada del que hi ha (provisional). */
  function nota(coef, valors) {
    let s = 0, c = 0;
    valors.forEach((v, i) => { if (v !== null) { s += coef[i] * v; c += coef[i]; } });
    if (!c) return null;
    return { nota: s / c, provisional: c < coef.reduce((a, b) => a + b, 0) - 1e-9 };
  }

  /* Quina nota cal treure a les caselles buides (la mateixa a totes) perquè la
     nota arrodonida sigui com a mínim `objectiu`. */
  function necessita(coef, valors, objectiu) {
    let s = 0, c = 0;
    const buides = [];
    valors.forEach((v, i) => {
      if (v === null) { c += coef[i]; buides.push(i); } else s += coef[i] * v;
    });
    if (!buides.length) return { cap: true };
    const x = (llindar(objectiu) - s) / c;
    if (net(x) <= 0) return { buides, assegurat: true };
    const cal = Math.ceil(net(x) * 100) / 100;
    if (cal > 10) {
      const max = s + 10 * c;
      return { buides, impossible: true, max, maxArrodonida: arrodoneix(max) };
    }
    return { buides, cal };
  }

  const Notes = { CRITERIS, arrodoneix, llindar, talla, coeficientsTrimestre,
    coeficientsFinal, nota, necessita };
  if (typeof module !== 'undefined' && module.exports) module.exports = Notes;
  if (typeof document === 'undefined') return;

  // ── Pantalla ────────────────────────────────────────────────────────────
  const $ = id => document.getElementById(id);
  const mostra = x => talla(x).toFixed(2).replace('.', ',');
  const pct = x => Math.round(x * 100) + ' %';

  function llegeix(input) {
    const t = input.value.trim().replace(',', '.');
    if (t === '') { input.classList.remove('cn-malament'); return null; }
    const bo = /^(\d{1,2}(\.\d*)?|\.\d+)$/.test(t) && Number(t) <= 10;
    input.classList.toggle('cn-malament', !bo);
    return bo ? Number(t) : NaN;
  }

  function lleva(llista) {
    return llista.length < 2 ? llista.join('')
      : llista.slice(0, -1).join(', ') + ' i ' + llista[llista.length - 1];
  }

  // selectors d'objectiu
  ['t-objectiu', 'f-objectiu'].forEach(id => {
    const sel = $(id);
    sel.innerHTML = '<option value="5">un 5 (aprovar)</option>'
      + [6, 7, 8, 9, 10].map(n => `<option value="${n}">un ${n}</option>`).join('');
  });
  $('t-objectiu').value = '8';
  $('f-objectiu').value = '5';

  // pestanyes (amb #final a l'adreça, per poder-hi enllaçar)
  const pestanyes = [['pes-trimestre', 'panell-trimestre'], ['pes-final', 'panell-final']];
  function obre(quina, desa) {
    pestanyes.forEach(([b, p]) => {
      const si = b === quina;
      $(b).setAttribute('aria-selected', String(si));
      $(p).hidden = !si;
    });
    if (desa) history.replaceState(null, '', quina === 'pes-final' ? '#final' : location.pathname + location.search);
  }
  pestanyes.forEach(([b]) => $(b).addEventListener('click', () => obre(b, true)));
  obre(location.hash === '#final' ? 'pes-final' : 'pes-trimestre', false);

  // 1 o 2 tests
  let tests = 1;
  document.querySelectorAll('.cn-tria button').forEach(b => b.addEventListener('click', () => {
    tests = Number(b.dataset.n);
    document.querySelectorAll('.cn-tria button').forEach(c =>
      c.setAttribute('aria-checked', String(c === b)));
    $('fila-te2').hidden = tests !== 2;
    calcula();
  }));

  function pinta(pre, coef, inputs, noms, quin) {
    const valors = inputs.map(llegeix);
    const avis = $(pre + '-avis'), nec = $(pre + '-necessito');
    const caixa = $(pre + '-exacta').closest('.cn-resultat');
    avis.hidden = true; avis.classList.remove('cn-avis-error');
    caixa.classList.remove('cn-amb-nota');

    if (valors.some(Number.isNaN)) {
      $(pre + '-exacta').textContent = $(pre + '-arrodonida').textContent = '—';
      avis.textContent = 'Hi ha alguna nota mal escrita: han de ser números del 0 al 10.';
      avis.classList.add('cn-avis-error'); avis.hidden = false;
      nec.textContent = '';
      return;
    }

    const r = nota(coef, valors);
    if (r) {
      $(pre + '-exacta').textContent = mostra(r.nota);
      $(pre + '-arrodonida').textContent = arrodoneix(r.nota);
      caixa.classList.add('cn-amb-nota');
      if (r.provisional) {
        const falten = valors.map((v, i) => (v === null ? noms[i].nom : null)).filter(Boolean);
        avis.textContent = 'Provisional: encara falta ' + lleva(falten)
          + '. Ara és la nota amb el que ja tens.';
        avis.hidden = false;
      }
    } else {
      $(pre + '-exacta').textContent = $(pre + '-arrodonida').textContent = '—';
    }

    const obj = Number($(pre + '-objectiu').value);
    const n = necessita(coef, valors, obj);
    const fita = `un ${obj}${quin}`;
    if (n.cap) {
      nec.innerHTML = 'Ja tens totes les notes. Deixa en blanc la que encara no tens i et diré quina necessites.';
    } else {
      const on = lleva(n.buides.map(i => noms[i].a));
      const totes = n.buides.length > 1 ? ' (la mateixa nota a cadascun)' : '';
      if (n.assegurat) {
        nec.innerHTML = `Ja tens assegurat ${fita}, encara que treguis un 0 ${on}.`;
      } else if (n.impossible) {
        nec.innerHTML = `No hi arribes: encara que treguis un 10 ${on}, la nota seria `
          + `<strong>${mostra(n.max)}</strong> (arrodonida, ${n.maxArrodonida}).`;
      } else {
        nec.innerHTML = `Per treure ${fita} necessites com a mínim un `
          + `<strong>${mostra(n.cal)}</strong> ${on}${totes}.`;
      }
    }
  }

  const NOMS_T = [
    { nom: "l'examen 1", a: "a l'examen 1" }, { nom: "l'examen 2", a: "a l'examen 2" },
    { nom: 'el test 1', a: 'al test 1' }, { nom: 'el test 2', a: 'al test 2' }];
  const NOMS_F = [
    { nom: 'el 1r trimestre', a: 'al 1r trimestre' }, { nom: 'el 2n trimestre', a: 'al 2n trimestre' },
    { nom: 'el 3r trimestre', a: 'al 3r trimestre' }];

  function calcula() {
    const c = coeficientsTrimestre(tests);
    const ex = tests === 2 ? CRITERIS.dosTests : CRITERIS.unTest;
    $('pes-examens').textContent = pct(ex.examens);
    $('pes-tests').textContent = tests === 2 ? pct(ex.test) + ' cada un' : pct(ex.test);
    const inT = ['ex1', 'ex2', 'te1', 'te2'].slice(0, 2 + tests).map($);
    pinta('t', c, inT, NOMS_T, ' al trimestre');
    pinta('f', coeficientsFinal(), ['tr1', 'tr2', 'tr3'].map($), NOMS_F, ' a la final');
  }

  document.querySelector('main').addEventListener('input', calcula);
  document.querySelector('main').addEventListener('change', calcula);
  $('buida').addEventListener('click', () => {
    document.querySelectorAll('.cn-panell input').forEach(i => { i.value = ''; });
    calcula();
  });
  calcula();
})();
